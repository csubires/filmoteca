import os 						# Recorrer carpetas
import threading				# Para generar threads con funciones

from .database import HandlerSQL						# Manejador de la base de datos
from .models import FilmFile
from .auxiliary import timestamp2Date, seconds_to_time, bytes_to_human
from .analyser import path_file_splits, get_fileMetaData, get_real_path_size
from .utils import lg_prt, singleton, datetime_now		# Mostrar y Colorear texto en consola

from config.global_constant import MOVIE_PATH, MOVIEXT, DB_FILE
from config.queries_database import TAG_QUERY


@singleton
class HandlerScan:
	"""	Recorrer directorios, listar películas, y sacar metadatos
		Args:
			path_number (int): 	Número asociado a la unidad de almacenamiento
				0: Internal HDD, 1: External HDD (Backup)
		Use:
			oSCAN = HandlerScan(path_number)
			oSCAN.start()
			oSCAN.stop()
			del oSCAN
	"""

	def __init__(self, path_number):
		self.path_number = path_number
		self.base_dir = MOVIE_PATH[path_number]
		self.report_date = datetime_now()
		# Cache de géneros y subgéneros para no tener que buscar el ID en bd constantemente
		self.genre_cache = {}
		self.ext_counter = {}								# Contador de extensiones
		# Objeto clase para ir almacenando los datos de la película
		self.oFilmFile = FilmFile()
		self.STOP = False									# Parada de emergencia
		self.oDTB = None

		if os.path.exists(self.base_dir):
			self.oDTB = HandlerSQL(DB_FILE, TAG_QUERY)		# Crear el manejador de BBDD
		else:
			lg_prt('ryr', '[✖] Error.', self.base_dir, 'doesnt exist')
			self.STOP = True

	def __del__(self):
		self.STOP = True
		if self.oDTB is not None:
			del self.oDTB

	def __str__(self):
		return f'Reporte del "{self.report_date}" para "{self.base_dir}"'

	def start(self):
		lg_prt('b', self)
		pThr = threading.Thread(name='scan_films', target=self.walkFolders(self.base_dir), daemon=True)
		pThr.start()
		pThr.join()

	def stop(self):
		lg_prt('y', '[▲] Stop by Interrupt')
		self.STOP = True
		del self

	def walkFolders(self, fullPath):
		# Recorrer recursivamente todas las carpetas, archivos y decidir si procesarlos o no
		listObj = os.scandir(fullPath)

		for entrada in listObj:
			if self.STOP:		# Si parada de emergencia
				break

			# Quitar /mnt/hgfs/movies/
			minPath = entrada.path.replace(self.base_dir, '')

			# Si es un directorio
			if entrada.is_dir():
				''' Si el hash no está en la base de datos recorrer el directorio
					Si está, pasar al siguiente path
					(st_ctime) Última modificación como hash '''
				if not self.isHashIndb(minPath, entrada.stat().st_ctime):
					self.walkFolders(entrada.path)
				else:
					continue

			else:		# Si es un archivo
				# Extraer y contabilizar el tipo y número de extensiones
				extension = entrada.name.rsplit('.', 1)[-1].lower()
				self.ext_counter[extension] = self.ext_counter.get(extension, 0) + 1
				if len(extension) > 4:		# Evitar archivos sin extensión
					continue

				# Insertar película en BBDD si la extensión es válida y no estaba ya
				if extension in MOVIEXT and not self.isFileInBD(minPath):

					self.oFilmFile.clear()
					self.oFilmFile.extension = extension
					self.oFilmFile.size = entrada.stat().st_size
					self.oFilmFile.size_str = bytes_to_human(entrada.stat().st_size)
					self.oFilmFile.file_created = timestamp2Date(entrada.stat().st_ctime)
					self.oFilmFile.pathfile = minPath
					self.oFilmFile.report_date = self.report_date
					self.oFilmFile.hdd_code = self.path_number

					# Primero trocear nombre
					result = path_file_splits(minPath, entrada.name)
					self.oFilmFile.title = result['title']
					self.oFilmFile.year = result['year']
					self.oFilmFile.quality = result['quality']
					self.oFilmFile.genre = result['genre']
					self.oFilmFile.subgenre = result['subgenre']
					self.oFilmFile.path_genre = result['path_genre']

					# Segundo obtener más información
					id_genre, id_subgenre = self.get_id_genre(entrada.path)
					self.oFilmFile.id_genre = id_genre
					self.oFilmFile.id_subgenre = id_subgenre

					# Obtener metadatos del archivos
					duration, resolution, fps = get_fileMetaData(entrada.path)
					self.oFilmFile.duration = duration
					self.oFilmFile.duration_str = seconds_to_time(duration)
					self.oFilmFile.resolution = resolution
					self.oFilmFile.fps = fps

					# Preparar datos e insertarlos
					params = self.oFilmFile.prepare()
					if params is not None:
						self.insert_movie(params)
					else:
						lg_prt('ry', 'Error. Data of file not valid.', params)

	def get_id_genre(self, full_path):
		''' Obtener toda la información de una película
			Args:
				full_path (str):		/mnt/hgfs/movies/genero/subgenero/El renacido [HDRip] (2015).avi
			Returns:
				(dict):					Devuelve los datos obtenidos
		'''

		# Información del archivo
		genre = self.oFilmFile.genre
		subgenre = self.oFilmFile.subgenre
		path_genre = self.oFilmFile.path_genre

		# Manejar los generos
		genrePath = os.path.dirname(full_path)				# /mnt/hgfs/movies/genero/subgenero
		hash_folder = str(os.path.getctime(genrePath))		# Tiempo de creación del archivo

		# Intentar obter el id del género de la caché, si no, consultar en BD
		id_genre = self.genre_cache.get(genre, None)
		if id_genre is None:
			id_genre = self.get_or_insert_genre(genre, False, path_genre, hash_folder)
			self.genre_cache.update({genre: id_genre})

		# Intentar obter el id del subgénero de la caché, si no, consultar en BD
		id_subgenre = self.genre_cache.get(subgenre, None)
		if subgenre is not None and id_subgenre is None:
			id_subgenre = self.get_or_insert_genre(subgenre, True, path_genre, hash_folder)
			self.genre_cache.update({subgenre: id_subgenre})

		return (id_genre, id_subgenre)

# METHOD QUERY DATABASE

	def isHashIndb(self, pathfolder, hash_folder):
		''' Comprobar si la carpeta ha cambiado (HASH)
			Si no es así, actualizar report_date (en Genre y Movies)
			Args:
				pathfolder (str):		minPath
				hash_folder (str):		entrada.stat().st_ctime
			Returns:
				(bool):					False, si ha cambiado, True si no ha cambiado
		'''
		params = {'hash_folder': hash_folder, 'pathfolder': pathfolder, 'report_date': self.report_date}
		response = self.oDTB.execute('hash_in_db', params)
		# Actualizar siempre con el hash y fecha. No da error si no existe (update/where)
		self.oDTB.execute('update_date_folder', params)
		# print(response)
		if response is None: 		# Si no encuentra nada es que se ha modificado la carpeta o no existe
			return False
		else:					 	# Si existe el mismo hash y folder en bd es que la carpeta no se ha modificado
			params = {'report_date': self.report_date, 'id_genre': response[0][0], 'hdd_code': self.path_number}
			self.oDTB.execute('update_date_movies', params) 	# Actualizar report_date de todas las películas genre
			lg_prt('yvyv', '[▲] No changes found in', pathfolder, 'updating data_report of movies by id_genre', response[0][0])
			return True

	def isFileInBD(self, pathfile):
		''' Comprobar si la película existe en la bd y actualizar la fecha (también el hdd_code)
			Args:
				pathfile (str): 	Path con el archivo de la película
			Returns:
				(bool):				True si está en la BD, False si no
		'''
		params = {'pathfile': pathfile, 'hdd_code': self.path_number, 'report_date': self.report_date}
		response = self.oDTB.execute('file_in_db', params)
		if response is None:
			return False
		else:
			# Si la película está en BD actualizar su fecha de reporte y el código de hdd
			self.oDTB.execute('update_date_file', params)
			lg_prt('by', 'Update report_date of movie', pathfile)
			return True

	def get_or_insert_genre(self, genero, isubgenero, pathfolder, hash_folder):
		# Obtiene el ID de un género y si no está lo inserta
		params = {
			'name': genero,
			'is_subgenre': isubgenero,
			'pathfolder': pathfolder,
			'hash_folder': hash_folder,
			'report_date': self.report_date
		}
		response = self.oDTB.execute('get_id_genre', params)
		if response is None:					# Si el género no existe lo inserta
			self.oDTB.execute('insert_genre', params)
			return self.oDTB.lastid				# Retorna el id recien creado
		else:
			return response[0][0]				# Restorna el id de género

	def insert_movie(self, params):
		# Insertar una película nueva en la base de datos
		if all([params['title'], params['id_genre'], params['size']]):
			self.oDTB.execute('insert_movie', params)
			lg_prt('gb', '[✔] Insert Movie:', params)
		else:
			lg_prt('ry', '[✖] Error inserting movie (data None)', params)
			lg_prt('999', 'insert_movie', params)

	def update_statistics(self):
		# Generar datos de reporte de la sesión y guardarlos en la BBDD
		params = {
			'report_date': self.report_date,
			'report_ext': ', '.join(list(map(lambda x, y: x + '(' + str(y) + ')', self.ext_counter.keys(), self.ext_counter.values()))),
			'num_files': sum(self.ext_counter.values()),
			'manual_stop': int(self.STOP),
			'hdd_code': self.path_number,
			'real_size': get_real_path_size(self.base_dir)
		}

		# Actualizar estadísticas de género
		self.oDTB.execute('update_genre', params)
		lg_prt('bw', 'Update statistics of genre', params)
		# Actualizar STR de géneros
		rows = self.oDTB.execute('get_all_genre')
		for row in rows:
			params_genre = {
				'id_genre': row[0],
				'local_size_str': bytes_to_human(row[4]) if row[4] is not None else None,
				'local_duration_str': seconds_to_time(row[6]) if row[6] is not None else None,
			}
			self.oDTB.execute('update_str_genre', params_genre)
		lg_prt('bw', 'Update STR statistics of genre', params_genre)

		# Actualizar estadísticas de reporte
		self.oDTB.execute('insert_report', params)
		lg_prt('bw', 'Update statistics of report', params)
		# Actualizar STR de reporte
		row = self.oDTB.execute('get_report_info', params)
		params['id_report'] = row[0][0]
		params['global_size_str'] = bytes_to_human(row[0][4])
		params['global_duration_str'] = seconds_to_time(row[0][6])
		self.oDTB.execute('update_str_report', params)
		lg_prt('bw', 'Update STR statistics of report', params)
