from __future__ import annotations

from time import sleep
import random
from typing import Any, Callable, Dict, List, Optional

from modules.analyser import get_urls, get_film, get_urls_series, get_serie, get_rating
from modules.utils import lg_prt, dt_format, Logging
from config.constant import *

last_movie: Optional[str] = None
all_movies: List[Dict[str, Any]] = []
all_series: List[Dict[str, Any]] = []
logger = Logging('logs/torrents.log')

def safe_get_film(page: Any, item_url: str) -> Optional[Dict[str, Any]]:
    """Wrapper seguro para get_film con manejo de errores"""
    try:
        film_info = get_film(page)
        # Validar campos críticos
        if not film_info or not film_info.get('title') or not film_info.get('year'):
            lg_prt('ry', '[✖] ERROR: Datos de película incompletos', item_url)
            return None

        # Asegurar que todos los campos necesarios existen
        film_info.setdefault('rating', 0.0)

        return film_info
    except Exception as e:
        lg_prt('ry', f'[✖] ERROR en get_film: {e}', item_url)
        return None

def get_movies(oCNT: Any, index: int, should_continue_callback: Optional[Callable[[], bool]] = None) -> bool:
    """Obtiene películas de una página específica del sitio de torrents"""
    global last_movie, all_movies

    if should_continue_callback and not should_continue_callback():
        return False

    lg_prt('t', f'\n\t ----- PAGE {index} ----- \n')
    page_url = f'{URL_BASE_R}{URL_FILM}{URL_PAGE}' % index
    page, status = oCNT.send('GET', page_url)

    if status != 200:
        lg_prt('ry', '[✖] ERROR visitando', page_url)
        return False

    collection = get_urls(page)
    if not collection:
        lg_prt('yw', '[!] No se encontraron películas en la página', index)
        return False

    for idx, item in enumerate(collection):
        if should_continue_callback and not should_continue_callback():
            return False

        if item == last_movie:
            lg_prt('yg', f'\nFin: item == last_movie ({last_movie})\n')
            return False

        # Obtener detalles de la película
        movie_url = f'{URL_BASE_R}{item}'
        page, status = oCNT.send('GET', movie_url)

        if status != 200:
            lg_prt('ry', '[✖] ERROR visitando película', movie_url)
            continue

        film_info = safe_get_film(page, movie_url)
        if not film_info:
            continue

        # Construir URLs de forma segura
        try:
            safe_title = film_info['title'].replace(' ', '+') if film_info.get('title') else 'unknown'
            safe_year = film_info.get('year', '0000')

            url_filma = URL_FILMAFFINITY.format(safe_title, safe_year, safe_year)
            url_imbd = URL_IMBD.format(safe_title, safe_year, safe_year)
        except Exception as e:
            lg_prt('ry', f'[✖] ERROR construyendo URLs: {e}')
            url_filma = URL_FILMAFFINITY.format('unknown', '0000', '0000')
            url_imbd = URL_IMBD.format('unknown', '0000', '0000')

        sleep(random.uniform(5, 15))

        # Actualizar información
        film_info.update({
            'index': str(idx + 1),
            'url_filma': oCNT.encode_url(url_filma) if oCNT.encode_url(url_filma) else url_filma,
            'url_imbd': oCNT.encode_url(url_imbd) if oCNT.encode_url(url_imbd) else url_imbd,
            'url_rojo': item
        })

        # Obtener rating (manejando posibles errores)
        try:
            rating_page, rating_status = oCNT.send('GET', url_filma)
            if rating_status == 200:
                get_rating(rating_page, film_info)
            else:
                lg_prt('yw', f'[!] No se pudo obtener rating (status {rating_status})')
        except Exception as e:
            lg_prt('ry', f'[!] ERROR obteniendo rating: {e}')

        # Asegurar que el rating es float válido
        try:
            film_info['rating'] = float(film_info.get('rating', 0))
        except (ValueError, TypeError):
            film_info['rating'] = 0.0

        # Log exitoso
        lg_prt('ywprgb',
            f'{idx+1: >3}',
            film_info.get('title', 'Sin título'),
            film_info.get('year', '0000'),
            film_info.get('rating', 0.0),
        )

        # Log seguro para archivo
        logger.file('INFO',
            f'{idx+1: >3}',
            film_info.get('title', 'Sin título'),
            str(film_info.get('year', '0000')),
            str(film_info.get('rating', 0.0)),
            film_info.get('url_filma', ''),
        )

        all_movies.append(film_info)
        lg_prt('yow', f'{idx+1: >3}', item, '\n')

        sleep(random.uniform(5, 15))

    return True

def get_series(oCNT: Any, index: int, should_continue_callback: Optional[Callable[[], bool]] = None) -> bool:
    """Obtiene series de una página específica del sitio de torrents"""
    global all_series

    if should_continue_callback and not should_continue_callback():
        return False

    lg_prt('t', f'\n\t ----- PAGE {index} ----- \n')
    page_url = f'{URL_BASE_S}{URL_SERIE}{URL_PAGE_S}' % index
    page, status = oCNT.send('GET', page_url)

    if status != 200:
        lg_prt('ry', '[✖] ERROR visitando', page_url)
        return False

    collection = get_urls_series(page)
    if not collection:
        lg_prt('yw', '[!] No se encontraron series en la página', index)
        return False

    for idx, item in enumerate(collection):
        if should_continue_callback and not should_continue_callback():
            return False

        serie_url = f'{URL_BASE_S}{item}'
        page, status = oCNT.send('GET', serie_url)

        if status != 200:
            lg_prt('ry', '[✖] ERROR visitando serie', serie_url)
            continue

        serie_info = get_serie(page)
        if not serie_info:
            continue

        url_filma = URL_FILMAFFINITY.format(serie_info['title'].replace(' ', '+'), '', '')
        sleep(random.uniform(5, 15))

        serie_info.update({
            'index': str(idx + 1),
            'url_filma': oCNT.encode_url(url_filma),
            'url_rojo': oCNT.encode_url(serie_url)
        })

        all_series.append(serie_info)

        lg_prt('ywpgb',
            f'{idx+1: >3}',
            serie_info['title'],
            serie_info.get('chapters', 'N/A'),
        )

        logger.file('INFO',
            f'{idx+1: >3}',
            serie_info['title'],
            str(serie_info.get('chapters', 'N/A')),
        )

        lg_prt('yow', f'{idx+1: >3}', item, '\n')
        sleep(random.uniform(5, 15))

    return True

def get_torrents(oCNT: Any, url_end: Optional[str], npseries: int, should_continue_callback: Optional[Callable[[], bool]] = None) -> List[Any]:
    """Obtiene torrents de películas y series"""
    global last_movie, all_movies, all_series

    # Reiniciar listas globales
    all_movies = []
    all_series = []
    last_movie = url_end

    lg_prt('bw', '[+] Buscando películas...')

    # Películas (máximo 8 páginas)
    for index in range(1, 9):
        if should_continue_callback and not should_continue_callback():
            lg_prt('yw', '[!] Búsqueda de películas cancelada')
            break

        if not get_movies(oCNT, index, should_continue_callback):
            break

    lg_prt('bw', '[+] Buscando series...')

    # Series
    for index in range(1, npseries + 1):
        if should_continue_callback and not should_continue_callback():
            lg_prt('yw', '[!] Búsqueda de series cancelada')
            break

        if not get_series(oCNT, index, should_continue_callback):
            break

    return [
        all_movies,
        all_series,
        all_movies[0]['url_rojo'] if all_movies else url_end,
        npseries
    ]
