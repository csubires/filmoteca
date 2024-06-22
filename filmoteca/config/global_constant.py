LST_PROXY = ['205.147.101.141:80']
DEBUG_MODE = True

DB_FILE = 'data/movieDB.db'
MOVIE_PATH = ('/mnt/hgfs/movies/', '/mnt/hgfs/ext_movies/')
MOVIEXT = ('3gp', 'asf', 'avi', 'divx', 'dvd', 'flv', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'qt', 'qtl', 'swf', 'vob', 'webm', 'wmv')
GENRE_TAG = {'acción': 'AC', 'animación': 'AN', 'aventuras': 'AV', 'bélico': 'BE', 'ciencia ficción': 'C-F', 'cinenegro': 'F-N', 'comedia': 'CO', 'desconocido': 'DESC', 'documental': 'DO', 'drama': 'DR', 'fantástico': 'FAN', 'infantil': 'INF', 'intriga': 'INT', 'musical': 'MU', 'romance': 'RO', 'seriedetv': 'TV_SE', 'terror': 'TE', 'thriller': 'TH', 'western': 'WE'}
URL_BASE = 'https://www.filmaffinity.com'
URL_PICT = 'https://pics.filmaffinity.com'
PATH_COVERS = './www/images/covers/%s'
PATH_CHARTS = './www/images/charts/'
YEAR_INIT_RATING = 2023

# -------------------------- SERVER ----------------------

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
ITEMS_PER_PAGE = 6
NUM_LAST_MOV = 50								# Número de últimas películas añadidas a mostrar
NUMMOV_X_SEARCH = 10							# Número máximo de películas obtenidas por busqueda

# TAG_QUERY_REPORT : Título de la opción para mostrar en páginas
MAINTENANCE_OPTIONS = {
	'repeated_movies': 'Repetidas',
	'missing_movies_hdd0': 'Desaparecidas HDD 0 (Interno)',
	'incomplete_movie_info': 'Incompletas',
	'censured_movies': 'Censuradas',
	'devalued_movies': 'Peor Valoradas (<6.5)',
	'corrupt_movies': 'Corrompidas',
	'uncoded_country': 'País desconocido',
	'overevalued_movies': 'Mejor Valoradas (>6.7)',
	'missing_movies_hdd1': 'Desaparecidas HDD 1 (Externo)',
	'incomplete_genre': 'Géneros incompletos',
}

# TAG_QUERY_REPORT : Mensaje de acción realizada correctamente API REST CRUD
MESSAGE_SUCCESS = {
	'delete_report': 'Reporte eliminado correctamente',
	'set_code_country': 'Código y bandera de páis establecido',
	'delete_movie': 'Película eliminada correctamente',
	'modify_movie': 'Película modificada correctamente',
	'update_inet_movie': 'Película actualizada correctamente',
	'set_present': 'Película establecida como presente'
}

# TAG_QUERY_REPORT : Mensaje de fallo al realizar acción API REST CRUD
MESSAGE_FAILURE = {
	'delete_report': 'Ocurrio un error al eliminar el reporte',
	'extra_info_movie': 'Ocurrio un error al obtener más información de la película',
	'search_movies': None,
	'set_code_country': 'No se pudo editar la información del país',
	'delete_movie': 'Ocurrio un error al eliminar la película',
	'modify_movie': 'La película no pudo ser modificada',
	'update_inet_movie': 'No se pudo actualizar la película'
}

# Cabecera para datos convertidos de list SQL a JSON
HEADERS_JSON = {
	'extra_info_movie': ('id_movie', 'realtitle', 'quality', 'extension', 'size_str', 'urldesc', 'urlpicture', 'id_genre', 'id_country', 'country', 'hdd_code', 'flag'),
	'get_movie': ('id_movie', 'title', 'realtitle', 'year', 'quality', 'extension', 'size', 'size_str', 'duration', 'duration_str', 'pathfile', 'resolution', 'fps', 'urldesc', 'ratings', 'urlpicture', 'censure', 'file_created', 'report_date', 'id_genre', 'id_subgenre', 'id_country', 'hdd_code'),
	'select_country': ('id_country', 'name'),
	'search_movies': ('id_movie', 'title', 'year', 'duration_str', 'ratings', 'urlpicture', 'id_genero'),
}
