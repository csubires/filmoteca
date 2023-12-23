import os 												# Para saber si existe una carpeta
import random 											# Pequeño descanso aleatorio entre peticiones web
import threading										# Para generar threads con funciones
from time import sleep 									# Parar el programa x segundos

from .connection import HandlerConnection				# Manejador de la conexión web
from .database import HandlerSQL						# Manejador de la base de datos
from .models import FilmInet							# Modelo para almacenar información
from .analyser import get_posible_url, parse_film, get_ranking_page
from .utils import lg_prt, singleton, year_now			# Mostrar y Colorear texto en consola

from config.global_constant import GENRE_TAG, URL_BASE, URL_PICT, DB_FILE, PATH_COVERS, YEAR_INIT_RATING
from config.queries_database import TAG_QUERY


@singleton
class HandlerService:
	"""	Obtener información de las películas desde Internet
		Args:
			oDTB (obj): 	Conexión a la base de datos establecida
		Use:
			oSRVC = HandlerService()
			oSRVC.start()
			oSRVC.stop()
			del oSRVC
	"""

	def __init__(self, oDTB=None):
		self.oCNT = HandlerConnection()
		self.oDTB = HandlerSQL(DB_FILE, TAG_QUERY) if oDTB is None else oDTB
		self.pThr = None
		self.STOP = False
		self.cache_country = {}		# Cache de países y códigos
		self.data_movie = {}		# Objeto diccionario / cache con los datos de la película
		# Objeto clase para ir almacenando los datos de la película
		self.oFilmInet = FilmInet()

	def __del__(self):
		self.STOP = True
		del self.oCNT
		del self.oDTB

	def start(self):
		self.pThr = threading.Thread(name='complete_films', target=self.complete_films, daemon=True)
		self.pThr.start()
		self.pThr.join()

	def stop(self):
		lg_prt('y', '[▲] Stop by Interrupt')
		self.STOP = True
		del self

	def complete_films(self):
		# Obtener todas las filas de películas que le falten un dato de Internet
		if not self.oCNT.isOnline():
			lg_prt('y', '[▲] Unable to connect to the Internet')
			return False

		list_movies = self.oDTB.execute('get_incompletes')
		if list_movies is None:
			lg_prt('y', '[▲] Incomplete movies not found')
			return True

		num_movies = len(list_movies)
		for index, row in enumerate(list_movies):
			if self.STOP:		# Parada manual
				break
			result = self.update_film(row)
			if result:
				lg_prt('wgv', f'[{index+1}/{num_movies}]', '[✔] Film Updated with more info', self.oFilmInet.json())
			else:
				lg_prt('wry', f'[{index+1}/{num_movies}]', '[✖] Error complete_films(). Failed to update movie', row)

	def update_film(self, row):
		# Actualizar información de una película con datos provenientes de Internet
		if not self.oCNT.isOnline():
			lg_prt('y', '[▲] Unable to connect to the Internet')
			return False

		id_movie, title, id_genre, id_subgenre, year, urldesc = row[0], row[1], row[2], row[3], row[4], row[5]
		# urldesc Es posible haberlo incluido manualmente

		genre = self.oDTB.execute('get_name_genre', {'id_genre': id_genre, 'is_subgenre': 0})[0]
		self.oFilmInet.clear()
		self.oFilmInet.title = title
		self.oFilmInet.id_movie = id_movie
		self.oFilmInet.urldesc = urldesc
		self.oFilmInet.year = year

		# Buscar en la web la película mediante su nombre, género y año
		if not self.get_inet_info(title, genre[0], year):
			return False

		if self.oFilmInet.country is None:
			return False

		# Obtener código del país
		try:
			id_country = self.cache_country.get(self.oFilmInet.country, None)
			if id_country is None:
				id_country = self.oDTB.execute('country_byname', {'name': self.oFilmInet.country})[0]
				if id_country is None:		# Si el país no existe lo inserta
					self.oDTB.execute('insert_country', {'name': self.oFilmInet.country})
					id_country = self.oDTB.lastid()
					lg_prt('gywb', '[✔] Country inserted.', 'ID:', id_country, self.oFilmInet.country)
				else:
					id_country = id_country[0]
				self.cache_country.update({self.oFilmInet.country: id_country})
			self.oFilmInet.id_country = id_country

			# Actualizar el resto de información de una película
			params = self.oFilmInet.prepare()
			self.oDTB.execute('update_movie', params)

			# Descargar la portada de la película
			if self.oFilmInet.urlpicture is not None:
				self.download_img(self.oFilmInet.urlpicture, id_subgenre or id_genre)
				sleep(random.uniform(2, 5))			# Añadir retardo entre peticiones al servidor

			return True
		except Exception as e:
			lg_prt('ryr', '[✖] Error update_film()', self.oFilmInet.json(), e)

	def get_inet_info(self, title, genre, year):
		''' Buscar la web de la película y extraer la valoración, título original, y país
			Args:
				title(str), genre(str), year(int)
			Return:
				(bool):		True si ha consegido obtener los datos
		'''
		posible_url = self.oFilmInet.urldesc

		try:
			if posible_url is None:			# Evitar tener que buscar nuevamente la película
				params = {
					# Limpiar el título de la película de CD
					'stext': title.replace('CD1', '').replace('CD2', '').replace('CD3', ''),
					'stype[]': 'title',
					'country': '',
					# Convertir género a código de género de la web filmaffinity
					'genre': GENRE_TAG.get(genre, ''),
					'fromyear': year,
					'toyear': year
				}
				# Buscar en la página de busqueda la películas
				page, status = self.oCNT.send('GET', f'{URL_BASE}/es/advsearch.php', params)
				posible_url = get_posible_url(page) if status == 200 else None
				sleep(random.uniform(1, 3))				# Añadir retardo entre peticiones al servidor
				if posible_url is None:
					lg_prt('rwry', '[✖] Error get_inet_info(). Web of film not found in', f'{URL_BASE}/es/advsearch.php', 'with params:', params)
					return False

			# Una vez se tiene la URL se busca y actualiza la información
			page, status = self.oCNT.send('GET', f'{URL_BASE}{posible_url}')
			sleep(random.uniform(1, 3))					# Añadir retardo entre peticiones al servidor
			result = parse_film(page, posible_url) if status == 200 else None
			# Rellenar película
			self.oFilmInet.urldesc = result['urldesc']
			self.oFilmInet.realtitle = result['realtitle']
			self.oFilmInet.country = result['country']
			self.oFilmInet.ratings = result['ratings']
			self.oFilmInet.urlpicture = result['urlpicture']
			return bool(result)

		except Exception as e:
			lg_prt('ryr', '[✖] Error get_inet_info()', f'{title} {genre} {year}', e)

	# FUNCIONES AUXILIARES

	def download_img(self, urlpicture, id_genre):
		''' Descarga una imagen a partir de la URL y la guarda en la carpeta de su género
			Args:
				urlpicture (str): 	/star_wars_the_last_jedi-535293064-mmed.jpg
				id_genre (int): 	14
		'''
		path = PATH_COVERS % id_genre
		filename, extension = os.path.splitext(urlpicture)
		path_file_cmp = f'{path}{filename}_cmp{extension}'

		# Comprobar si ya existe la imagen
		if os.path.isfile(path_file_cmp) or os.path.isfile(path + urlpicture):
			lg_prt('byvby', '[▲] Imagen exits.', path, urlpicture, 'or', path_file_cmp)

		else:
			try:
				page, status = self.oCNT.send('GET', f'{URL_PICT}{urlpicture}')
				sleep(random.uniform(1, 3))			# Añadir retardo entre peticiones al servidor
				if status == 200:
					if not os.path.exists(path):
						os.makedirs(path) 			# Crear directiorio si no existe
					# Guardar imagen en disco
					with open(f'{path}{urlpicture}', 'wb') as f:
						f.write(page.content)
					lg_prt('gyv', '[✔] Img downloaded.', path, urlpicture)
				else:
					lg_prt('gyv', '[✖] Error downloaded.', path, urlpicture)

			except Exception as e:
				lg_prt('ryvryr', '[✖] Error download_img()', URL_PICT, urlpicture, 'in', path, e)

	def check_img_in_hdd(self):
		# Comprobar que las portadas de películas estan en hdd
		# '/self_less-498548304-mmed.jpg'
		list_movies = self.oDTB.execute('get_urlpicture')
		lg_prt('y', '[▲] Files not found in HDD:')
		for row in list_movies:
			# id_movie = row[0]
			id_genre = row[1]
			urlpicture = row[2]
			self.download_img(urlpicture, id_genre)

	def purge_duplicate_img(self):
		# Comprobar si hay imagenes duplicadas y borrarlas si no estan en BBDD
		# Abrir un proceso y usar un comando linux para obtener info de un archivo
		from subprocess import run
		duplex = None

		try:
			# Ejecutar el proceso que devuelve la lista de archivos duplicados
			process = run(['fdupes', '-Sr', PATH_COVERS % ''], capture_output=True, text=True)
			duplex = process.stdout.split()
		except Exception as e:
			lg_prt('ry', '[✖] Error in purge_duplicate_img()', e)

		# Recorrer duplicados y decidir si borrar el archivo
		for path in duplex:
			if '/' in path:
				filename = '/' + os.path.basename(path)
				filename = filename.replace('_cmp', '')
				id_genre = int(path.rsplit('/', 2)[1])
				# lg_prt('ybv', path, filename, id_genre)
				exists = self.oDTB.execute('exists_urlpicture', {'urlpicture': filename, 'id_genre': id_genre})
				if exists is None:		# Si el archivo no está en la base de datos eliminarlo
					lg_prt('ry', 'Erasing', path)
					os.remove(path)

	def purge_img_in_hdd(self, fullPath=(PATH_COVERS % '')):
		# Recorrer todas las carpetas, archivos y decidir si procesarlos o no
		listObj = os.scandir(fullPath)

		for entrada in listObj:
			if self.STOP:		# Si parada de emergencia
				break

			if entrada.is_dir(): 									# Si es un directorio
				self.purge_img_in_hdd(entrada.path)

			else:													# Si es un archivo
				filename = '/' + os.path.basename(entrada.path)
				filename = filename.replace('_cmp', '')
				id_genre = int(entrada.path.rsplit('/', 2)[1])		# Obtener el id_genre o id_subgenre	(carpeta)
				# lg_prt('ybv', entrada.path, filename, id_genre)
				exists = self.oDTB.execute('exists_urlpicture', {'urlpicture': filename, 'id_genre': id_genre})
				if exists is None:		# Si el archivo no está en la base de datos eliminarlo
					lg_prt('ry', 'Erasing', entrada.path)
					os.remove(entrada.path)

	def get_rankin_by_years(self):
		''' Obtener sugerencias de descarga mediante el ranking por años.
			Guarda las sugerencias en cache (DDBB) para no volver a descargar
		'''

		for year in range(YEAR_INIT_RATING, year_now()):
			url_list = f'{URL_BASE}/es/topgen.php?genres=&chv=0&orderby=avg&movietype=movie|ex-anim:ex-tv&country=&fromyear={year}&toyear={year}&ratingcount=2&runtimemin=0&runtimemax=0'
			lg_prt('by', '\nAño: ', year)

			page, status = self.oCNT.send('GET', url_list)
			sleep(random.uniform(1, 3))					# Añadir retardo entre peticiones al servidor
			if status == 200:
				result = get_ranking_page(page)
				lg_prt('ygw', 'GET ', len(result), result)
				self.oDTB.execute_many('set_rating', result)
				lg_prt('gy', '[✔] Películas añadidas:', self.oDTB.affected())


			params = {
				'from': '30',
				'paramGrid[primaryCountries]': '',
				'paramGrid[genres]': '',
				'paramGrid[fromYear]': year,
				'paramGrid[toYear]': year,
				'paramGrid[runtimeMin]': '0',
				'paramGrid[runtimeMax]': '0',
				'paramGrid[minRatingCount]': '2',
				'paramGrid[movieFilterForm]': 'movie|ex-anim:ex-tv',
				'paramGrid[platforms]': '',
				'paramGrid[orderby]': 'avg',
				'orderby': 'avg',
				'showHeader': '0',
			}
			page, status = self.oCNT.send('POST', url_list, params)
			sleep(random.uniform(1, 3))					# Añadir retardo entre peticiones al servidor
			if status == 200:
				result = get_ranking_page(page)
				lg_prt('ygw', 'POST', len(result), result)
				self.oDTB.execute_many('set_rating', result)
				lg_prt('gy', '[✔] Películas añadidas:', self.oDTB.affected())

		# Actualizar estado de películas presentes
		self.oDTB.execute('set_present')
