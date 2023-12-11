# 2023.11.27

from datetime import datetime		# Para hacer conversiones de tiempo
from datetime import timedelta		# Para cambiar de segundos a formateo de tiempo

from modules.utils import lg_prt

ABR_SIZE = ('B', 'KB', 'MB', 'GB', 'TB', 'PB')


def timestamp_to_datetime(timeStamp):		# BORRAR ?????
	""" Convierte el formato timestamp a fecha
		Args:
			timeStamp (str):	Fecha en formato timestamp. Ex: 1651855905
		Returns:
			(str): 				Fecha formateada. Ex: 06/05/2022, 18:51:45
	"""

	date = datetime.fromtimestamp(float(timeStamp), tz=None)
	return date.strftime('%d/%m/%Y, %H:%M:%S')


def timestamp2Date(timeStamp):
	# Convierte timestamp '1651855905' a fecha '2022-05-06'
	return datetime.fromtimestamp(float(timeStamp), tz=None).strftime('%Y-%m-%d')


def date_to_human(date):
	""" Formatea una fecha a formato legible
		Args:
			date (str): 2020-10-23 21:34:23
		Returns:
			(str): 		23 de October de 2020
	"""

	obj_date = datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
	return obj_date.strftime('%d de %B de %Y')


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
	""" Pasar bytes a cantidades mayores con sufijo Ej: 14272717 -> 13.61 MB
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
