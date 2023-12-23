from modules.service import HandlerService as HandlerServiceMod
from modules.database import HandlerSQL, list_to_dict				# Manejador de la base de datos
from modules.utils import lg_prt, singleton							# Mostrar y Colorear texto en consola
from www.auxiliary import isValidEmail, htmlFilterChars, min_len

from config.queries_database import TAG_QUERY_REPORT
from config.global_constant import DB_FILE, NUMMOV_X_SEARCH, NUM_LAST_MOV, MAINTENANCE_OPTIONS, MESSAGE_SUCCESS, MESSAGE_FAILURE, HEADERS_JSON


@singleton
class HandlerService:
	"""
		Manejador de funciones del servidor web
		Use:
			oSRV = HandlerService()
			del oSRV
	"""

	def __init__(self):
		self.cache_formsearch = {}
		self.oDTB = HandlerSQL(DB_FILE, TAG_QUERY_REPORT)		# Crear el manejador de BBDD
		self.oSRVC = None

	def __del__(self):
		del self.oDTB
		if self.oSRVC is not None:
			self.oSRVC.stop()

	def validate_user(self, email, password):
		# Comprobar que las credenciales son correctas
		import hashlib
		password_valid = False

		if not isValidEmail(email):
			return ('Email no válido', 'danger')

		data = self.oDTB.execute('get_user', {'email': email})

		if data is not None:
			bd_password = data[0][1]
			role = data[0][2]

			try:
				salt = bd_password[:32]
				key = bd_password[32:]
				tmp_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), bytes.fromhex(salt), 10)
				password_valid = True if tmp_key.hex() == key else False
			except Exception:
				return ('Contraseña almacenada no válida', 'warning')
		else:
			return ('Email o contraseña no válida', 'danger')

		return (password_valid, role)

	def validate_signup(self, name, email, password, repeat, ip, agent, date):
		# Registrar una cuenta de usuario
		import os
		import hashlib

		if not repeat:
			return ('La contraseña y su repetición no coinciden', 'danger')
		if not isValidEmail(email):
			return ('Email no válido', 'danger')
		if not min_len(4, password):
			return ('Contraseña demasido corta', 'warning')
		salt = os.urandom(16)
		new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 10)

		params = {
			'name': htmlFilterChars(name).strip(),
			'email': email.strip(),
			'password': salt.hex() + new_key.hex(),
			'ip': ip.strip(),
			'agent': agent,
			'date_time': date,
			'role': 'admin' 	# De momento todos los ususarios registrados son admins
		}

		self.oDTB.execute('register_user', params)

		if self.oDTB.affected() > 0:
			return ('Cuenta creada con exito', 'success')

	def list_of_films(self, id_genre):
		# Obtener listados de películas sin JavaScript
		response = ('Sin resultados', 'view.html', None)

		if id_genre is not None and id_genre > 0:
			# Listado de películas por género
			name_genre = self.oDTB.execute('get_name_genre', {'id_genre': id_genre})
			if name_genre is not None:		# Existe el género
				data = self.oDTB.execute('movies_by_genre', {'id_genre': id_genre})
				response = (name_genre[0][0], 'view.html', data)

		else:
			# Listado de últimas películas añadidas
			data = self.oDTB.execute('last_movies', {'limit': NUM_LAST_MOV})
			response = ('Últimas Añadidas', 'view.html', data)

		return response

	def searchAMovie(self, search):
		# Buscar una película
		response = ('Sin resultados', 'view.html', None)

		data = self.oDTB.execute('search_movies', {'search': '%' + search + '%', 'year': search, 'limit': NUMMOV_X_SEARCH})

		if data is not None and len(data) > 0:
			response = ('Resultado Busqueda', 'view.html', data)

		return response

	def getMenu(self, menu, year):
		# Opciones de menú
		response = ('Sin resultados', 'notfound.html', None)

		'''if menu == 'global':
			data = self.oDTB.execute('get_report_info')
			all_report = self.oDTB.execute('get_all_report')
			data = [data, all_report] if all(all_report) and len(all_report) > 0 else None
			response = ('Información Global', 'global.html', data) '''
		if menu == 'genres':
			data = self.oDTB.execute('get_info_genre')
			data = data if data is not None and len(data) > 0 else None
			response = ('Información de Géneros', 'genres.html', data)

		elif menu == 'recommended':
			# Listado de películas recomendadas
			data = self.oDTB.execute('recommended')
			data = data if data is not None and len(data) > 0 else None
			response = ('Recomendadas', 'view.html', data)

		elif menu == 'ranking':
			data1 = self.oDTB.execute('get_years')
			data2 = self.oDTB.execute('get_rating', {'year': year})
			data1 = data1 if data1 is not None and len(data1) > 0 else None
			response = ('Descargar', 'inventories.html', [data1, data2])

		elif menu == 'inventories':
			response = ('Listados', 'inventories.html', [])

		else:
			# Si no hay opción por defecto se muestran las estadísticas
			# Listado de reportes y datos globales
			data = self.oDTB.execute('get_report_info')
			all_report = self.oDTB.execute('get_all_report')
			data1 = [data, all_report] if all(all_report) and len(all_report) > 0 else None
			# Listado de películas por países para el mapa mundi
			data = self.oDTB.execute('world_map')
			data2 = data if data is not None and len(data) > 0 else None
			response = ('Estadísticas', 'statistics.html', [data1, data2])

		return response

	def maintenance(self, menu):
		# Obtener información para el mantenimiento
		if menu in MAINTENANCE_OPTIONS.keys():		# Comprobar que la opción está disponible
			data = self.oDTB.execute(menu)
			if data is None:
				response = ('Sin resultados', 'auth/maintenance.html', [])
			else:
				response = ('Mantenimiento', 'auth/maintenance.html', (menu, MAINTENANCE_OPTIONS.get(menu, None), data))
		else:
			response = ('Mantenimiento', 'auth/maintenance.html', None)

		return response

	def searchAdvanced(self, search=None):
		# Datos para rellenar los datalist
		data = self.cache_formsearch.get('cache_search', None)

		# Busqueda con parametros avanzados
		if search is None:
			# Información para renderizar formulario
			if data is None:
				# Cache de parametros de busqueda para evitar nuevas busquedas (No JavaScript)
				quality = self.oDTB.execute('select_quality')
				extension = self.oDTB.execute('select_extension')
				resolution = self.oDTB.execute('select_resolution')
				fps = self.oDTB.execute('select_fps')
				country = self.oDTB.execute('select_country')
				data = [quality, extension, resolution, fps, country]
				data = data if all(data) else None
				self.cache_formsearch['cache_search'] = data

			response = ('Busqueda Avanzada', 'auth/search.html', data, None)

		else:
			# Busqueda avanzada con los datos entregados por POST
			id_movie = search['id_movie']
			quality = search['quality']
			extension = search['extension']
			resolution = search['resolution']
			fps = search['fps']
			id_country = search['id_country']
			min_rating = search['min_rating']
			max_rating = search['max_rating']
			min_date = search['min_date']
			max_date = search['max_date']

			params = {
				'id_movie': id_movie,
				'quality': quality if quality != '' else 'n/a',
				'extension': extension if extension != '' else 'n/a',
				'resolution': resolution if resolution != '' else 'n/a',
				'fps': fps if fps != '' else 'n/a',
				'id_country': id_country if id_country != '' else 'n/a',
				'min_rating': min_rating if min_rating != '' else 'n/a',
				'max_rating': max_rating if max_rating != '' else 'n/a',
				'min_date': min_date if min_date != '' else 'n/a',
				'max_date': max_date if max_date != '' else 'n/a'
			}

			found = self.oDTB.execute('advanced', params)		# Películas encontradas
			if found is not None and len(found) > 0:
				response = ('Películas encontradas', 'auth/search.html', data, found)
			else:
				response = ('Sin resultados', '/auth/search.html', data, None)

		return response

# -------------------------------------------------------------------
# 														API REST CRUD

	def queryAPI(self, tagSQL, params):
		'''
		Peticiones a la base de datos con respuesta JSON
		Si tiene cabecera responde datos (SELECT)
		Si no tiene cabecera responde un mensaje (COMMIT QUERIES)
		Args:
			tagSQL (str):		Tag Query asociado a la consulta en "queries_database.py"
			params (str):		String dicionario con parametros. Ej: '{"id_movie": 123}'
		Returns:
			data (dic):			JSon con el mensaje y los datos
			status (int):		Código de servidor
		'''

		# Ejecutar consulta
		dataSQL = self.oDTB.execute(tagSQL, params)

		# Consulta con comando
		if tagSQL == 'update_inet_movie':
			# Actualizar los datos de Internet de una película
			if self.oSRVC is None:
				self.oSRVC = HandlerServiceMod(self.oDTB)
			lg_prt('bu', 'Update film ', dataSQL[0])
			result = self.oSRVC.update_film(dataSQL[0])
			lg_prt('t', result)
			dataSQL = dataSQL if result else None
			lg_prt('t', dataSQL)
		
		elif tagSQL == 'modify_movie':
			# Se modificó una película y hay que ver si es necesario mover la imagen a otra carpeta
			pass
			

		# Obtener cabeceras si existen y trasnformar a diccionario
		headers = HEADERS_JSON.get(tagSQL, None)
		# Si exiten las cabeceras mandar datos con ellas, sino mandar listado crudo
		dataJson = list_to_dict(headers, dataSQL) if headers is not None and dataSQL is not None else dataSQL

		# lg_prt('byw', dataSQL, headers, dataJson)

		if self.oDTB.affected() > 0 or dataJson is not None:
			response = ({'message': MESSAGE_SUCCESS.get(tagSQL, None), 'data': dataJson}, 200)
		else:
			response = ({'message': MESSAGE_FAILURE.get(tagSQL, 'Código de error desconocido'), 'data': []}, 400)

		return response
