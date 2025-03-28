'''
# Filename: utils.py
# Version: 1.0
# By: CSUBIRES <j3xuz_cobmetal88@hotmail.com>
# Created: 2024/01/13 12:02:02 by CSUBIRES
# Updated: 2024/08/12 12:02:02 by CSUBIRES
# Description: Este script contiene funciones
# 	de uso habitual como: imprimir en color, decoradores
#	funciones de fecha o tiempo actual, para medir tiempos
#	de ejecución, etc
'''

import time 								# Para contar tiempos
from datetime import datetime, timezone		# Para extraer la fecha actual


PALETTE = {
	'w': '\33[97m',							# w: Blanco
	'r': '\33[91m',							# r: Rojo
	'g': '\33[92m',							# g: Verde
	'y': '\33[93m',							# y: Amarillo
	'b': '\033[38;5;39m',					# b: Azul
	'v': '\033[38;5;99m',					# v: Violeta
	'p': '\033[38;5;206m',					# p: Rosa
	'c': '\33[96m',							# c: Cian
	'o': '\033[38;5;208m',					# o: Naranaja
	'n': '\33[01m',							# n: Negrita
	'u': '\33[04m',							# u: Delineado
	'i': '\33[03m',							# i: Cursiva
	'k': '\33[05m',							# k: Parpadeo
	't': '\33[7m\33[92m\33[1m',				# t: Título
	'x': '\a\007',							# x: Beep, sonido (no funciona)
}

DATETIME_FORMAT = {
	'iy': '%Y',								# year_now() int 2023
	'symd-': '%Y-%m-%d',					# date_now() str 2022-05-17
	'sdmy': '%d/%m/%Y',						# date2_now() str 17/05/2022
	'shms': '%H:%M:%S', 					# time_now() str 10:55:35
	'symdhms': '%Y-%m-%d %H:%M:%S',			# datetime_now() str 2022-05-17 10:55:35
	'symd': '%Y%m%d',						# filename_now() str 20220517
	'symdthms': '%Y%m%dT%H%M%S', 			# filename_datetime() str 20220517T091734
}


def lg_prt(colors, *args):
	""" - Imprime por pantalla texto a color
		- Si no coincide el número de colores y los mensajes, se escribe en blanco
		- Si se usa u, i, k o n, el primer mensaje es en blanco
		Args:
			colors (str): 	Códigos de colores, Ex: 'wbyr'
			args (list): 	Mensajes, Ex: [mgs1, msg2, ...]
		Returns: Imprimir mensaje coloreado
	"""

	try:
		# Si faltan colores para todos los parametros se rellena con blanco 'w'
		colors = colors.ljust(len(args), 'w')
		print(' '.join([f'{PALETTE[colors[x]]} {args[x]}' for x in range(len(args))]) + '\033[0m')
	except Exception as e:
		print('[✖] Error: lg_prt(), Color not found or', e)


class Logging():
	""" - Clase para el manejo de mensajes de errores y eventos a color
		- Posibilidad de escribir en un archivo
		- TITLE, INFO, OBJECT, WARNING, ERROR, SUCCESS, CRITICAL, DEBUG
		Args:
			file (str): 	Archivo donde guardar el log (Por defecto: project/logs/)
		Returns: Imprimir mensaje coloreado
	"""

	LOG_TAG = {
		# Títulos
		'TITLE': f" \t{PALETTE['t']} \u007b\u007d \033[0m {PALETTE['b']} \u007b\u007d\033[0m",
		# Información, cambio de modos
		'INFO': f" {PALETTE['b']}⎡ℹ⎦ \u007b\u007d {PALETTE['w']}\u007b\u007d\033[0m",
		# Crear o borrar un objeto
		'OBJECT': f" {PALETTE['v']}⎡❯⎦ \u007b\u007d {PALETTE['y']}\u007b\u007d\033[0m",
		# Alertas, advertencias
		'WARNING': f" {PALETTE['i']}{PALETTE['y']}⎡▲ WARNING⎦ \u007b\u007d {PALETTE['b']}\u007b\u007d\033[0m",
		# Errores
		'ERROR': f" {PALETTE['r']}⎡✖ ERROR⎦ \u007b\u007d {PALETTE['y']}\u007b\u007d\033[0m",
		# Acción llevada a cabo correctamente
		'SUCCESS': f" {PALETTE['g']}⎡✔⎦ \u007b\u007d {PALETTE['w']}\u007b\u007d\033[0m",
		# Error crítico, catastrófico
		'CRITICAL': f" {PALETTE['k']}{PALETTE['r']}⎡✚ CRITICAL⎦ \u007b\u007d {PALETTE['o']}\u007b\u007d\033[0m",
		# Debugear y mostrar datos temporalmente
		'DEBUG': f"{PALETTE['o']}{PALETTE['u']}\n\t\u007b\u007d\033[0m\n{PALETTE['p']}\u007b\u007d\033[0m\n",
		# Modo no definido
		'UNDEFINED': f"{PALETTE['o']}{PALETTE['u']}⎡¿? UNDEFINED⎦ \u007b\u007d\033[0m {PALETTE['y']}\u007b\u007d\033[0m",
	}

	def __init__(self, file='logs/log.log'):
		self.file_log = file
		self.__disabled = False

	def printer(func):
		# DECORADOR para imprimir el mensaje
		def wrapper(*args, **kws):
			if func(*args, **kws) is not None:
				args_str = [f'{args[x]}' for x in range(2, len(args))]
				data = ' '.join(args_str)
				print(func(*args, **kws).format(args[1], data))
				return func(*args, **kws)
		return wrapper

	def enable(self):
		# Habilitar decorador
		self.__disabled = False

	def disable(self):
		# Deshabilitar decorador
		self.__disabled = True

	@printer
	def title(self, message, *args):
		return self.LOG_TAG['TITLE'] if not self.__disabled else None

	@printer
	def info(self, message, *args):
		return self.LOG_TAG['INFO'] if not self.__disabled else None

	@printer
	def object(self, message, *args):
		return self.LOG_TAG['OBJECT'] if not self.__disabled else None

	@printer
	def warning(self, message, *args):
		return self.LOG_TAG['WARNING'] if not self.__disabled else None

	@printer
	def error(self, message, *args):
		return self.LOG_TAG['ERROR'] if not self.__disabled else None

	@printer
	def success(self, message, *args):
		return self.LOG_TAG['SUCCESS'] if not self.__disabled else None

	@printer
	def critical(self, message, *args):
		return self.LOG_TAG['CRITICAL'] if not self.__disabled else None

	@printer
	def debug(self, message, *args):
		return self.LOG_TAG['DEBUG'] if not self.__disabled else None

	def hr(self):
		# Separador de partes
		print(f" {PALETTE['y']}{'':―>80}\033[0m")

	def file(self, level='INFO', *args):
		# Crear y/o escribir mensaje de log en archivo con la fecha y hora
		with open(self.file_log, 'a+') as fp:
			fp.write(f'\n{dt_format("symdhms")} | {level} | {" ".join(args)}')

# ------------------------------------------------------------------------------------------


def dt_format(format):
	# Obtener la fecha o la hora actual en un determinado formato
	aux = datetime.now(timezone.utc).strftime(DATETIME_FORMAT[format])
	return str(aux) if format[0] == 's' else int(aux)

# ------------------------------------------------------------------------------------------


def singleton(class_):
	# DECORADOR para evitar multiples instancias de un objeto
	instances = {}

	def getinstance(*args, **kwargs):
		if class_ not in instances:
			instances[class_] = class_(*args, **kwargs)
		else:
			lg_prt('y', '[▲] Only one instance of the object is allowed')
		return instances[class_]
	return getinstance


def chronos(func):
	# DECORADOR para cronometrar la ejecución de una función
	def wrap_func(*args, **kwargs):
		tic = time.perf_counter()
		value = func(*args, **kwargs)
		toc = time.perf_counter()
		elapsed_time = toc - tic
		lg_prt('oyc', '[▲] Elapsed time for', '@chronos', f'{elapsed_time:0.4f} seconds')
		return value
	return wrap_func


class Chronos:
	""" - Cronometrar la ejecución de un trozo de código
		- Usar con "with Chronos('codename'): código"
		Args:
			codename (str): Nombre, Tag para nombrar el trozo de código
		Returns: Tiempo de ejecución
	"""

	def __init__(self, codename):
		self.codename = codename
		self.start_time = None

	def __enter__(self):
		self.start_time = time.perf_counter()

	def __exit__(self, *exc_info):
		elapsed_time = time.perf_counter() - self.start_time
		lg_prt('oyc', '[▲] Elapsed time for', f'{self.codename}', f'{elapsed_time:0.4f} seconds')
