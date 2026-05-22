from __future__ import annotations

import os 						# Recorrer carpetas
import re						# Usar expresiones regulares para extraer información de un texto
import subprocess 				# Abrir un proceso y usar un comando linux

from bs4 import BeautifulSoup 					# Para extraer información de las páginas HTML
from typing import Any, Dict, Optional, Tuple

from .auxiliary import time_to_seconds
from .utils import lg_prt						# Mostrar y Colorear texto en consola

from config.constant import URL_BASE, URL_PICT



# GET LOCAL DATA FOR core.py

def path_file_splits(path_file: str, file_name: str) -> Dict[str, Optional[str]]:
	''' Trocea el path de un archivo para extraer información de nombre, calidad, etc
		Args:
			path_file (str):		genero/subgenero/El renacido [HDRip] (2015).avi
			file_name (str):		El renacido [HDRip] (2015).avi
		Returns:
			(dict):					Devuelve los datos obtenidos del file_name
	'''
	title: Optional[str] = None
	quality: Optional[str] = None
	year: Optional[str] = None
	genre: Optional[str] = None
	subgenre: Optional[str] = None
	path_genre: Optional[str] = None

	# 'file_name.extension' -> 'file_name', 'extension'
	file_name, _ = os.path.splitext(file_name)

	try:
		# Obtener todo lo que empieza antes de un [, (, .
		title = file_name.split('[', 1)[0].split('(', 1)[0].split('.', 1)[0]
		# Obtener lo que está entre corchetes []
		r = re.search(r"\[([A-Za-z0-9_]+)\]", file_name)
		quality = r.group(1) if r else None
		# Obtener lo que está entre paréntesis ()
		r = re.search(r"\(([A-Za-z0-9_]+)\)", file_name)
		year = r.group(1) if r else None
		# Género/Subgénero
		path_genre = os.path.dirname(path_file)
		path_split = path_genre.split('/')
		genre = path_split[0] or None
		subgenre = path_split[-1] if len(path_split) > 1 else None

	except Exception as e:
		lg_prt('ryr', '[✖] Error in path_file_splits()', file_name, e)

	finally:
		return {
			'title': title if title != '' else None,
			'year': year,
			'quality': quality,
			'genre': genre,
			'subgenre': subgenre,
			'path_genre': path_genre
		}


def get_fileMetaData(fullPath: str) -> Tuple[Optional[int], Optional[str], Optional[float]]:
	''' Obtener los metadatos de la película
		Args:
			fullPath (str): '/mnt/hgfs/movies/Acción/Desterrado [HDRip] (2014).avi'
		Returns:
			tuple: (duration, resolution, fps)
	'''
	duration: Optional[int] = None
	resolution: Optional[str] = None
	fps: Optional[float] = None

	try:
		cmds = ['ffmpeg', '-i', fullPath, '-hide_banner']
		p = subprocess.Popen(cmds, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		p.wait()
		_, err = p.communicate()
		err = str(err).lower()

		duration_match = re.search(r'\d{2}:\d{2}:\d{2}', err)		# Encontrar horas hh:mm:ss
		duration = time_to_seconds(duration_match[0]) if duration_match is not None else None
		resolution_match = re.search(r'\d{3,5}x\d{3,5}', err)		# Encontrar resolución 9999x999
		resolution = resolution_match[0] if resolution_match is not None else None
		fps_match = re.search(r'\d+\.\d+ fps', err)				# Encontrar fps 99.99 fps
		fps = float(fps_match[0].replace(' fps', '')) if fps_match is not None else None
		return (duration, resolution, fps)
	except Exception as e:
		lg_prt('ryr', '[✖] Error in get_fileMetaData()', fullPath, e)
		return (None, None, None)


def get_real_path_size(fullPath: str) -> str:
	''' Obtener el tamaño real de la carpeta de películas
		Args:
			fullPath (str): '/mnt/hgfs/movies'
		Returns:
			size (str): 234 MB
	'''
	from subprocess import run 					# Abrir un proceso y usar un comando linux para obtener info de un archivo
	size = '0 MB'
	try:
		process = run(['du', '-sh', fullPath], capture_output=True, text=True)
		size = process.stdout.split()[0]
	except Exception as e:
		lg_prt('ry', '[✖] Error in get_real_path_size()', e)
	return size


# GET INET DATA FOR service.py


def get_posible_url(raw_html):
	# Devolver la URL de la primera película encontrada
	posible_url = None
	soup = BeautifulSoup(raw_html.content, 'html.parser')

	# Entrar en la página de la película y obtener la info
	try:		# Provocar un error si encuentra una web relacionada con la película seguir, sino ...
		soup.select('div#adv-search-no-results')[0].text.strip()
	except Exception:
		posible_url = soup.select('div.mc-title>a')[0].get('href').strip()
		posible_url = posible_url.replace(URL_BASE, '')
	finally:
		return posible_url


def parse_film(raw_html, posible_url):
	# Devolver información de una película
	realtitle = country = ratings = urlpicture = None
	soup = BeautifulSoup(raw_html.content, 'html.parser')
	try:
		realtitle = soup.select('dl.movie-info > dd')[0].text.strip(' aka').strip()
	except Exception:
		pass
	try:
		country = soup.select('span#country-img')[0].img.get('alt').strip()
	except Exception:
		pass
	try:
		ratings = float(soup.select('div#movie-rat-avg')[0].text.strip().replace(',', '.'))
	except Exception:
		pass
	try:
		urlpicture = soup.select('div#movie-main-image-container')[0].img.get('src').strip().replace(URL_PICT, '')
	except Exception:
		pass

	return {
		'urldesc': posible_url,
		'realtitle': realtitle,
		'country': country,
		'ratings': ratings,
		'urlpicture': urlpicture
	}


def get_ranking_page(raw_html):
	# Obtener listado de películas por rating
	result = []

	soup = BeautifulSoup(raw_html.content, 'html.parser')
	films = soup.select('ul')
	print(len(films))

	for film in films:
		position = src_img = url = title = year = rating = None

		try:
			position = film.select('.position')[0].text.strip()
		except Exception:
			pass
		try:
			src_img = film.img.get('src').strip()
			src_img = src_img.replace(URL_PICT, '')
		except Exception:
			pass
		try:
			url = film.a.get('href').strip()
			url = url.replace(URL_BASE, '')
		except Exception:
			pass
		try:
			title = film.select('.mc-title')[0].text.strip()
			path_file = f'genero/subgenero/{title}.avi'
			file_name = f'{title}.avi'
			data = path_file_splits(path_file, file_name)
			title = data['title'].strip()
			year = int(data['year'])
		except Exception:
			pass
		try:
			rating = float(film.select('.avg-rating')[0].text.strip().replace(',', '.'))
		except Exception:
			pass

		if rating is not None and rating > 6.7:
			result.append({
				'position': position,
				'src_img': src_img,
				'url': url,
				'title': title,
				'year': year,
				'rating': rating
			})
	# Devolver quitando repetidos
	return [dict(t) for t in {tuple(d.items()) for d in result}]


def get_urls(raw_html):
	# Devolver información de una película
	soup = BeautifulSoup(raw_html.content, 'html.parser')
	films = soup.select('div.noticiasContent a')
	clean_films = []

	for index, item in enumerate(films):
		url = item['href'].strip()
		if '/pelicula/' in url:
			clean_films.append(url)
	return clean_films

def get_film(raw_html):
    # Devolver información de una película
    title = 'Sin título'
    year = '0000'
    description	 = ''

    try:
        soup = BeautifulSoup(raw_html.content, 'html.parser')

        # Título con manejo seguro
        title_elements = soup.select('.descargarTitulo')
        if title_elements:
            title = title_elements[0].text.strip() or 'Sin título'

        # Año con manejo seguro
        year_elements = soup.select('p.m-1')
        if year_elements:
            year_text = year_elements[0].text.strip()
            year = year_text.replace('Año: ', '') if year_text else '0000'

        # Año con manejo seguro
        description = soup.select('.text-justify')
        if description:
            description_text = description[0].text.strip()
            description = description_text.replace('Descripción: ', '') if description_text else ''

    except Exception as e:
        print(f"Error en get_film: {e}")
        title = 'Error al obtener título'
        year = '0000'

    return {
        'title': title,
        'year': year,
		'description': description,
        'rating': 0.0,
        'url_rojo': '',
        'url_filma': ''
    }


def get_urls_series(raw_html):
    # Devolver información de series
    clean_films = []

    try:
        soup = BeautifulSoup(raw_html.content, 'html.parser')
        films = soup.select('div.noticiasContent a')

        for item in films:
            href = item.get('href', '')
            if href and '/serie/' in href:
                clean_films.append(href.strip())

    except Exception as e:
        print(f"Error en get_urls_series: {e}")

    return clean_films


def get_serie(raw_html):
    # Devolver información de una serie
    title = 'Sin título'
    chapters = 'N/A'

    try:
        soup = BeautifulSoup(raw_html.content, 'html.parser')

        # Título con manejo seguro
        title_elements = soup.select('h2.descargarTitulo')
        if title_elements:
            title_text = title_elements[0].text.strip()
            title = title_text.split('-')[0].strip() if title_text else 'Sin título'

        # Capítulos con manejo seguro
        chapter_elements = soup.select('p.m-1')
        if chapter_elements and len(chapter_elements) > 1:
            chapters_text = chapter_elements[1].text.strip()
            chapters = chapters_text.replace('Episodios: ', '') if chapters_text else 'N/A'

    except Exception as e:
        print(f"Error en get_serie: {e}")
        title = 'Error al obtener título'
        chapters = 'N/A'

    return {
        'title': title,
        'chapters': chapters,
        'url_rojo': '',
        'url_filma': ''
    }

def get_rating(raw_html, film_info):
    # Obtener la valoración de una película
    rating = 0.0
    url_filma = None
    soup = BeautifulSoup(raw_html.content, 'html.parser')

    try:
        rating_elements = soup.select('.avg.mx-0')
        if rating_elements:
            rating_text = rating_elements[0].text.strip()
            rating = float(rating_text.replace(",", "."))

            # Determinar URL de FilmAffinity
            if len(rating_elements) == 1:
                mc_title_links = soup.select('.mc-title > a')
                if mc_title_links:
                    url_filma = mc_title_links[0].get('href')
                    # Asegurar que es una URL completa si es relativa
                    if url_filma and not url_filma.startswith(('http://', 'https://')):
                        url_filma = f"https://www.filmaffinity.com{url_filma}"
            else:
                rating *= -1

    except Exception as e:
        print(f"Error obteniendo rating: {e}")
        rating = 0.0
        url_filma = None

    # Asegurar que todos los valores son strings válidos
    film_info.update({
        'rating': rating,
        'url_filma': url_filma or ''  # Nunca None
    })
