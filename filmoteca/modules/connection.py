'''
# Filename: connection.py
# Version: 1.0
# By: CSUBIRES <j3xuz_cobmetal88@hotmail.com>
# Created: 2024/01/15 11:55:53 by CSUBIRES
# Updated: 2024/08/12 11:55:53 by CSUBIRES
# Description: Este script contiene una clase para el manejo de conexiones HTTP
#	LOS HEADERS PUEDEN HACER QUE PÁGINAS DEVUELVAN CÓDIGO ILEGIBLE,
#	TAMBIÉN SUCEDE CON PROXIES NO ADECUADOS, COMPROBAR ANTES QUE NADA
'''

import requests 											# Para hacer las peticiones HTTP
from requests.adapters import HTTPAdapter 					# Para evitar que se cuelge las peticiones HTTP
from requests.packages.urllib3.util.retry import Retry 		# Para evitar que se cuelge las peticiones HTTP
from json import dump										# Para poder guardar las cookies en un fichero

from .utils import Logging, singleton						# Mostrar y Colorear texto en consola
from config.default_headers import HEADERS


@singleton
class Handler_connection:
	"""	Establecer, cerrar y manejar conexiones HTTP
		(Se puede extablecer un proxy sin url_base ni check_str)
		Args:
			persistence (bool): Mantener la sesión anterior, guardando y cargando las cookies
		Use:
			oCNT = Handler_connections()
			oCNT.send('GET', url)
			del oCNT
	"""

	def __init__(self, persistence=False):
		self.inetObj = None
		self.logger = Logging('logs/connection.log')
		self.headers = HEADERS
		self.__persistence = persistence

		# Abrir conexión
		self.logger.object('Creating connection...')
		self.inetObj = requests.Session()
		# Produce Max retries exceeded with URL in requests junto con URL_PROXY_CHECK https
		self.inetObj.verify = True
		self.inetObj.timeout = 3
		self.set_headers(self.headers)
		# Evitar el error de Max retries exceeded with url
		retry = Retry(connect=3, backoff_factor=0.5)
		adapter = HTTPAdapter(max_retries=retry)
		self.inetObj.mount('http://', adapter)
		self.inetObj.mount('https://', adapter)
		self.inetObj.mount('ftp://', adapter)
		self.logger.object('Connection created', self)
		# Cargar sesión anterior
		if self.__persistence is True:
			self.load_cookies()

	def __del__(self):
		# Cerrar conexión
		if self.__persistence is True:
			# Guardar sesión anterior
			self.save_cookies()
		self.clear_cookies()
		self.inetObj.close()
		self.logger.object('Closed connection', self)

	def __str__(self):
		# Información de la conexión
		return f'Current connection: {type(self.inetObj)}'

	def send(self, method, url_page, params=None, files=None):
		""" Obtener el resultado de una petición web y el estado
			Args:
				method (str):		Tipo de petición web GET/POST/PUT/...
				url_page (str):		URL de la página a visitar
				params (dict):		Parametros de la petición (Opcional)
				files (dict):		Ficheros a enviar (Opcional)
			Returns:
				page (obj):			Resultado de la petición
				status (int):		Estado de la petición
			Use:
				page, status = send('GET', 'miweb.com', {pass:1234})
		"""

		page = None
		status_code = 999
		try:
			if method == 'GET' and not params:
				page = self.inetObj.get(url_page)
			elif method == 'GET' and params:
				page = self.inetObj.get(url_page, params=params)
			elif method == 'POST' and not files:
				page = self.inetObj.post(url_page, data=params)
			elif method == 'POST' and files:
				page = self.inetObj.post(url_page, files=files)
			else:
				self.logger.error('HTTP command not known', {'Method': method, 'URL': url_page, 'Params': params, 'State': status_code})
			status_code = page.status_code

		except requests.exceptions.HTTPError as e:
			self.logger.error('Could not access', {'Method': method, 'URL': url_page, 'Params': params, 'State': status_code, 'Error': e})

		except requests.ConnectionError as e:
			self.logger.error('Connection failure', {'Method': method, 'URL': url_page, 'Params': params, 'State': status_code, 'Error': e})

		finally:
			return (page, status_code)

	def get_url_redirect(self, url_page):
		# Obtener la última url al que se redirige después de un GET
		page, _ = self.send('GET', url_page)
		# lg_prt('r', page.history)
		if len(page.history) > 0:
			# Devolver url_redirect, status_code
			return (page.history[-1].headers['Location'], page.history[-1].status_code)
		else:
			return (None, None)

	def get_headers(self):
		# Obtener cabeceras HTTP
		return self.inetObj.headers

	def set_headers(self, new_headers):
		# Establecer las cabecera HTTP
		self.inetObj.headers.clear()
		self.inetObj.headers.update(new_headers)

	def get_cookies(self):
		# Obtener cookies de la conexión
		return self.inetObj.cookies.get_dict()

	def get_name_cookies(self, name):
		# Obtener una cookie por su nombre
		return self.inetObj.cookies.get_dict().get(name)

	def set_cookies(self, cookies):
		# Establecer cookies de la conexión
		self.inetObj.cookies.update(cookies)
		self.logger.info('Set cookies', self.inetObj.cookies.get_dict())

	def clear_cookies(self):
		# Limpiar cookies de la conexión
		self.inetObj.cookies.clear()
		self.logger.warning('Deleted cookies', self.inetObj.cookies.get_dict())

	def num_cookies(self):
		# Obtener número de cookies
		return len(self.inetObj.cookies)

	def load_cookies(self, cookies_path='data/'):
		from json import load
		# Cargar una sesión anterior cargando las cookies en un fichero
		try:
			with open(cookies_path + 'cookies.json', 'r') as f:
				self.set_cookies(requests.utils.cookiejar_from_dict(load(f)))
			return True
		except Exception as e:
			self.logger.error('Cookies could not be loaded', e)
			return False

	def save_cookies(self, cookies_path='data/'):
		# Salvar la sesión actual guardando las cookies en un fichero
		num_cookies = self.num_cookies()
		try:
			if num_cookies != 0:		# Existen cookies
				with open(cookies_path + 'cookies.json', 'w') as f:
					dump(requests.utils.dict_from_cookiejar(self.inetObj.cookies), f)
				self.logger.info('Cookies saved', {'Amount': num_cookies})
				return True
			else:
				self.logger.info('No cookies to save', self.inetObj.cookies)
				return False
		except Exception as e:
			self.logger.error('Error saving cookies', e)
			return False

	def is_online(self):
		# Verificar que hay conexión a Internet
		try:
			self.inetObj.head('https://1.1.1.1', timeout=1)
			return True
		except requests.ConnectionError:
			return False

	@staticmethod
	def encode_url(url_page):
		# Códifica una url con sus parámetro
		from requests.utils import requote_uri 		# Para códificar una URL con parametros
		return requote_uri(url_page)
