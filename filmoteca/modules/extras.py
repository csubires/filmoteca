'''
# Filename: extras.py
# Version: 1.0
# By: CSUBIRES <j3xuz_cobmetal88@hotmail.com>
# Created: 2024/01/20 11:59:25 by CSUBIRES
# Updated: 2025/08/12 11:59:25 by CSUBIRES
# Description: Este script contiene funciones de conversión de datos
'''

from datetime import datetime, timedelta		# Para hacer conversiones de tiempo y formato


from modules.utils import lg_prt

ABR_SIZE = ('B', 'KB', 'MB', 'GB', 'TB', 'PB')


def timestamp_to_date(timeStamp):
	# Convierte timestamp '1651855905' a fecha '2022-05-06'
	return datetime.fromtimestamp(float(timeStamp), tz=None).strftime('%Y-%m-%d')


def date_to_human(date):
	# Convierte fecha '2020-10-23 21:34:23' string a humano '23 de October de 2020'
	return datetime.strptime(date, '%Y-%m-%d %H:%M:%S').strftime('%d de %B de %Y')


def time_to_seconds(timeStr):
	""" Convierte un tiempo en formato %H:%M:%S.%f a segundos
		Args:
			timeStr (str): 	02:05:12
		Returns:
			(str): 			7512
	"""

	if timeStr.count(':') != 2 or timeStr is None:
		return None
	timeStr = timeStr.split('.')[0]
	return sum(x * int(t) for x, t in zip([3600, 60, 1], timeStr.split(":")))


def seconds_to_time(seconds):
	""" Convierte segundos a años, meses, días, horas, minutos, y segundos
		Args:
			seconds (int):	7512
		Returns:
			(str): 			2hr, 5min, 12seg
	"""

	duration_str = None
	try:
		d = datetime(1, 1, 1) + timedelta(seconds=seconds)
		year = f'{d.year-1}Años, ' if d.year - 1 > 0 else ''
		month = f'{d.month - 1}Meses, ' if d.month - 1 > 0 else ''
		day = f'{d.day-1}Días, ' if d.day - 1 > 0 else ''
		hour = f'{d.hour}hr, ' if d.hour > 0 else ''
		minute = f'{d.minute}min, ' if d.minute > 0 else ''
		second = f'{d.second}seg' if d.second > 0 else ''
		duration_str = f'{year}{month}{day}{hour}{minute}{second}'
	except Exception as e:
		lg_prt('ryr', 'Error seconds_to_time()', seconds, e)
	finally:
		return duration_str


def bytes_to_human(nbytes):
	""" Pasar bytes a cantidades mayores con sufijo
		Args:
			nbyte (int):	Cantidad de bytes. Ex: 14272717
		Returns:
			str:			Información formateada. Ex: 13.61 MB
	"""
	size_str = None
	try:
		i = 0
		while nbytes >= 1024 and i < (len(ABR_SIZE) - 1):
			nbytes /= 1024.
			i += 1
		f = ('%.2f' % nbytes).rstrip('0').rstrip('.')
		size_str = '%s %s' % (f, ABR_SIZE[i])
	except Exception as e:
		lg_prt('ryr', 'Error bytes_to_human()', nbytes, e)
	finally:
		return size_str


def list_to_dict(headers, rows):
	""" Convierte listado select (list(dict)) a dicionario
		Args:
			headers (list):	 		Listado con las cabeceras. Ex: [id', 'name', ...]
			rows (list(dict)):		Resultado de una consulta
				Ex: [(columna1, columna2), (columna1, ...]
		Returns:
			(list(list)) / None
	"""
	# Si existen files y el número de cabeceras es igual al número de columnas de una fila
	if len(rows) and (len(headers) == len(rows[0])):
		return [dict(zip(headers, item)) for item in rows]

	lg_prt('ry', '[✖] Error listToDict(),', f'Len(headers): {len(headers)}, len(rows): {len(rows)}, len(rows[0]): ?')
	return None
