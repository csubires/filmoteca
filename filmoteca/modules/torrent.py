
from time import sleep

from modules.analyser import get_urls, get_film, get_urls_series, get_serie, get_rating
from modules.utils import lg_prt, dt_format
from config.global_constant import *

last_movie = None
all_movies = []
all_series = []

def get_movies(oCNT, index):
	global last_movie, all_movies
	collection = None

	lg_prt('t', f'\n\t ----- PAGE {index} ----- \n')
	page, status = oCNT.send('GET', f'{URL_BASE_R}{URL_FILM}{URL_PAGE}' % index)
	if status == 200:
		collection = get_urls(page)
		for idx, item in enumerate(collection):
			if item == last_movie:
				lg_prt('y', f'\nFinish item == last_movie ({last_movie})\n')
				return False
			page, status = oCNT.send('GET', f'{URL_BASE_R}{item}')
			if status == 200:
				film_info = get_film(page)
				url = URL_FILMAFFINITY.format(film_info['title'], film_info['year'], film_info['year'])
				url2 = URL_IMBD.format(film_info['title'], film_info['year'], film_info['year'])
				sleep(1)
				film_info.update({'index': str(idx + 1)})
				film_info.update({'url_filma': oCNT.encode_url(url)})
				film_info.update({'url_imbd': oCNT.encode_url(url2)})
				film_info.update({'url_rojo': item})
				page, status = oCNT.send('GET', url)
				(status == 200) and get_rating(page, film_info)
				all_movies.append(film_info)
				lg_prt('ywprgb',
					f'{idx+1: >3}',
					film_info['title'],
		   			film_info['year'],
					film_info['rating'],
				)
				lg_prt('yow', f'{idx+1: >3}', item, '\n')
			else:
				lg_prt('ry', '[✖] ERROR', film_info['url_rojo'] + '\a\n')
				return False
			sleep(1)
	else:
		lg_prt('ry', '[✖] ERROR, Visiting ', f'{URL_BASE_R}{URL_FILM}{URL_PAGE}' % index)
		return False
	return True

def get_series(oCNT, index):
	global all_series
	collection = None

	lg_prt('t', f'\n\t ----- PAGE {index} ----- \n')
	page, status = oCNT.send('GET', f'{URL_BASE_S}{URL_SERIE}{URL_PAGE_S}' % index)
	if status == 200:
		collection = get_urls_series(page)
		for idx, item in enumerate(collection):
			page, status = oCNT.send('GET', f'{URL_BASE_S}{item}')
			if status == 200:
				serie_info = get_serie(page)
				url = URL_FILMAFFINITY.format(serie_info['title'], '', '')
				sleep(1)
				serie_info.update({'index': str(idx + 1)})
				serie_info.update({'url_filma': oCNT.encode_url(url)})
				serie_info.update({'url_rojo': oCNT.encode_url(f'{URL_BASE_S}{item}')})
				all_series.append(serie_info)
				lg_prt('ywpgb',
					f'{idx+1: >3}',
					serie_info['title'],
		   			serie_info['chapters'],
				)
				lg_prt('yow', f'{idx+1: >3}', item, '\n')
			else:
				lg_prt('ry', '[✖] ERROR', film_info['url_rojo'] + '\a\n')
				return False
			sleep(1)
	else:
		lg_prt('ry', '[✖] ERROR, Visiting ', f'{URL_BASE_S}{item}')
		return False
	return True

def get_torrents(oCNT, url_end, npseries):
	global last_movie
	last_movie = url_end

	lg_prt('bw', '[+] Searching movies...')
	index = 1
	while (index < 9 and get_movies(oCNT, index)):
		index += 1

	lg_prt('bw', '[+] Searching series...')
	index = 1
	while (index <= npseries and get_series(oCNT, index)):
		index += 1

	return [all_movies, all_series, all_movies[0]['url_rojo'] if len(all_movies) > 0 else url_end, npseries]
