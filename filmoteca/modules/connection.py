# 2023.3.15

import requests 											# Para hacer las peticiones HTTP
from requests.adapters import HTTPAdapter 					# Para evitar que se cuelge las peticiones HTTP
from requests.packages.urllib3.util.retry import Retry 		# Para evitar que se cuelge las peticiones HTTP

from config.default_headers import HEADERS, URL_PROXY_CHECK
from .utils import lg_prt, singleton						# Mostrar y Colorear texto en consola

'''
	LOS HEADERS PUEDEN HACER QUE PÁGINAS DEVUELVAN CÓDIGO ILEGIBLE,
	TAMBIÉN SUCEDE CON PROXIES NO ADECUADOS, COMPROBAR ANTES QUE NADA
	EN CASO DE QUEDARSE COLGADO PRESIONAR Ctrl+Shift+C PARA PASAR AL SIGUIENTE PROXY
'''


@singleton
class HandlerConnection:
	"""	Establecer, cerrar y manejar conexiones HTTP
		(Se puede extablecer un proxy sin url_base ni check_str)
		Args:
			proxy_list (list): 	Listado de proxies (Opcional)
			url_base (str): 	URL base (Opcional)
			check_str (str): 	Cadena a buscar el el código fuente (Opcional)

		Use:
			oCNT = Handler_connections()
			oCNT = Handler_connections(PROXIES, URL_PROOF, CHECK_STR)
			oCNT.check_proxy()		# Solo si se requiere conectar mediante proxy
			oCNT.send('GET', url)
			del oCNT
	"""

	def __init__(self, proxy_list=None, url_base=None, check_str=None):
		self.proxy_list = proxy_list
		self.url_base = url_base
		self.check_str = check_str
		self.inetObj = None
		self.headers = HEADERS
		self.STOP = False
		self.proxyDict = {
			'http': 'http://127.0.0.1:80',
			'https': 'https://127.0.0.1:80',
			'ftp': 'ftp://127.0.0.1:80'
		}

		# Abrir conexión
		lg_prt('v', 'Creating connection...')
		self.inetObj = requests.Session()
		# Produce Max retries exceeded with URL in requests junto con URL_PROXY_CHECK https
		self.inetObj.verify = True
		self.inetObj.timeout = 3
		# BORRAR self.inetObj.headers.update(self.headers)
		self.set_headers(self.headers)

		# Evitar el error de Max retries exceeded with url
		retry = Retry(connect=3, backoff_factor=0.5)
		adapter = HTTPAdapter(max_retries=retry)
		self.inetObj.mount('http://', adapter)
		self.inetObj.mount('https://', adapter)
		self.inetObj.mount('ftp://', adapter)
		lg_prt('vy', '[✔] Connection created.', self)

	def __del__(self):
		# Cerrar conexión
		self.clear_cookies()
		self.inetObj.close()
		lg_prt('vy', '[▲] Closed connection.', self)

	def __str__(self):
		# Información de la conexión
		return f"Current connection: {type(self.inetObj)}, Proxy is: {self.proxyDict['https']}"

	def stop(self):
		self.STOP = True
		lg_prt('y', '[▲] Stop by Interrupt')

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
				lg_prt('ryryryry', '[✖] Error. HTTP command not known. Method:', method, 'URL:', url_page, 'Params:', params, 'State:', status_code)
			status_code = page.status_code

		except requests.exceptions.HTTPError as e:
			lg_prt('ryryryrywr', '[✖] Error. Could not access. Method:', method, 'URL:', url_page, 'Params:', params, 'State:', status_code, '\n', e)

		except requests.ConnectionError as e:
			lg_prt('ryryryrywr', '[✖] Error. Connection failure. Method:', method, 'URL:', url_page, 'Params:', params, 'State:', status_code, '\n', e)
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
		lg_prt('vy', '[▲] Set cookies. Cookies:', self.inetObj.cookies.get_dict())

	def clear_cookies(self):
		# Limpiar cookies de la conexión
		self.inetObj.cookies.clear()
		lg_prt('vwy', 'Deleted cookies.', 'Cookies:', self.inetObj.cookies.get_dict())

	def num_cookies(self):
		# Obtener número de cookies
		return len(self.inetObj.cookies)

	def load_cookies(self, cookies_path):
		from json import load
		# Cargar una sesión anterior cargando las cookies en un fichero
		try:
			with open(cookies_path + 'cookies.json', 'r') as f:
				self.inetObj.cookies.update(requests.utils.cookiejar_from_dict(load(f)))
			return True
		except Exception as e:
			lg_prt('ry', '[✖] Error loading cookies', e)
			return False

	def save_cookies(self, cookies_path):
		# Salvar la sesión actual guardando las cookies en un fichero
		from json import dump
		num_cookies = self.num_cookies()
		try:
			if num_cookies != 0:		# Existen cookies
				with open(cookies_path + 'cookies.json', 'w') as f:
					dump(requests.utils.dict_from_cookiejar(self.inetObj.cookies), f)
				lg_prt('gy', '[✔] Cookies saved. Amount:', num_cookies)
				return True
			else:
				lg_prt('yc', '[▲] No cookies to save.', self.inetObj.cookies)
				return False
		except Exception as e:
			lg_prt('ry', '[✖] Error saving cookies', e)
			return False

	def isOnline(self):
		# Verificar que hay conexión a Internet
		_, status = self.send('GET', 'https://1.1.1.1')
		return False if status == 999 else True

	def set_proxy(self):
		# Comprobar y extablecer un proxy válido
		lg_prt('bobybw', 'Searching valid proxy for', self.url_base, 'within', self.check_str, 'Proxies:', self.proxy_list)

		for proxy in self.proxy_list:
			if self.STOP:
				break

			chk_proxy = False
			lg_prt('wy', 'Setting proxy:', proxy)
			self.proxyDict['http'] = 'http://' + proxy
			self.proxyDict['https'] = 'https://' + proxy
			self.proxyDict['ftp'] = 'ftp://' + proxy
			self.inetObj.proxies = self.proxyDict

			try:
				lg_prt('vy', '[1] Checking access to proxy', self.proxyDict['https'])
				page, status = self.send('GET', URL_PROXY_CHECK)		# Obtener la IP pública
				chk_proxy = (status == requests.codes.ok) and (page.text.strip() in self.proxyDict['https'])
				if chk_proxy: 	# Si coincide la IP del proxy establecido con lo devuelto por el server web check
					lg_prt('gygy', '[✔] Access proxy. Status:', status, 'Return:', page.text.strip())
					if self.url_base is not None:
						lg_prt('vyv', '[2] Searching string "', self.check_str, '" in URL')
						page, status = self.send('GET', self.url_base)
						chk_proxy = self.check_str in page.text
						if chk_proxy:
							lg_prt('gy', '[✔] String in Page. Status:', status)
						else:
							lg_prt('ryry', '[✖] String not found in ', self.url_base, 'Status:', status)

				else:
					lg_prt('ryry', '[✖] Access proxy. Status:', status, ', Return:', page.text)
				if chk_proxy:
					return True		# Yield Salir si ha encontrado un proxy válido
			except Exception as e:
				lg_prt('ryrywr', '[✖] Connection refused. Proxy:', self.proxyDict['https'], 'State:', chk_proxy, '\n', e)

		lg_prt('r', '[✖] No proxy is valid')
		return False

	@staticmethod
	def encode_url(url_page):
		# Códifica una url con sus parámetro
		from requests.utils import requote_uri 		# Para códificar una URL con parametros
		return requote_uri(url_page)
