# 2023.06.22

import time 					# Para contar tiempos
from datetime import datetime 	# Para extraer la fecha actual


"""
	Sugerencia de uso:
		Títulos: t
		Alertas, warning [▲]: y
		Creación, manejo o borrado de objetos: v
		Accediendo a un modo: b
		Error [✖]: r
		Exito [✔]: g
		Otros: w
		Logger: nc,lg,...

	w: Blanco
	r: Rojo
	g: Verde
	b: Azul
	y: Amarillo
	v: Violeta
	c: Cian
	o: Naranaja
	n: Negrita
	u: Delineado
	t: Título
"""

PALETTE = {
	'w': '\33[97m',
	'r': '\33[91m',
	'g': '\33[92m',
	'y': '\33[93m',
	'b': '\33[94m',
	'v': '\33[95m',
	'c': '\33[96m',
	'o': '\33[33m',
	'n': '\33[01m',
	'u': '\33[04m',
	't': '\t\33[7m\33[92m\33[1m'
}


def lg_prt(colors, *args):
	""" - Imprime por pantalla a color errores y eventos
		- Posibilidad de escribir en un archivo si el parametro colors es '999'
		- En caso de recibir '999' el primer parametro de args es el nombre del archivo
		- Si no coincide el número de colores y los mensajes, se escribe en blanco
		- Si se usa u o n, el primer mensaje es en blanco
		Args:
			colors (str): 	Códigos de colores, Ex: 'wbyr'
			args (list): 	Mensajes, Ex: [mgs1, msg2, ...]
		Returns: Imprimir mensaje coloreado
	"""

	if colors == '999':
		# Crear y/o escribir mensaje de log en archivo con la fecha y hora
		report_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
		with open(f'www/logs/{args[0]}.log', 'a+') as fp:
			fp.write(f'\n{report_date} | {" ".join(args[1:])}')
	else:
		try:
			# Si faltan colores para todos los parametros se rellena con blanco 'w'
			colors = colors.ljust(len(args), 'w')
			print(' '.join([f'{PALETTE[colors[x]]} {args[x]}' for x in range(len(args))]) + '\033[0m')
		except Exception as e:
			lg_prt('ry', '[✖] ERROR: lg_prt(), Color not found or', e)


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


# ------------------------------------------------------------------------------------------
# FUNCIONES DE TIEMPO

def year_now():
	return int(datetime.now().strftime('%Y'))						# 2023

def date_now():
	return str(datetime.now().strftime('%Y-%m-%d'))					# 2022-05-17

def date2_now():
	return str(datetime.now().strftime('%d/%m/%Y'))					# 17/05/2022


def time_now():
	return f'[{datetime.now().strftime("%H:%M:%S")}]'				# [10:55:35]


def datetime_now():
	return str(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))		# 2022-05-17 10:55:35


def filename_now():
	return str(datetime.now().strftime('%Y%m%d'))					# 20220517


def filename_datetime():
	return str(datetime.now().strftime('%Y%m%dT%H%M%S'))			# 20220517T091734

# ------------------------------------------------------------------------------------------
# DECORADORES


def singleton(class_):
	# Decorador para evitar multiples instancias de un objeto
	instances = {}

	def getinstance(*args, **kwargs):
		if class_ not in instances:
			instances[class_] = class_(*args, **kwargs)
		else:
			lg_prt('y', '[▲] Only one instance of the object is allowed')
		return instances[class_]
	return getinstance


def chronos(func):
	# Decorador para cronometrar la ejecución de una función
	def wrap_func(*args, **kwargs):
		tic = time.perf_counter()
		value = func(*args, **kwargs)
		toc = time.perf_counter()
		elapsed_time = toc - tic
		lg_prt('oyc', '[▲] Elapsed time for', '@chronos', f'{elapsed_time:0.4f} seconds')
		return value
	return wrap_func
