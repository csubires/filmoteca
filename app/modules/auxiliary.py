# 2023.11.27

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from modules.utils import lg_prt

ABR_SIZE = ('B', 'KB', 'MB', 'GB', 'TB', 'PB')


def timestamp_to_datetime(timeStamp: float | str) -> str:
	"""Convierte el formato timestamp a fecha
	Args:
		timeStamp (str): Fecha en formato timestamp. Ex: 1651855905
	Returns:
		(str): Fecha formateada. Ex: 06/05/2022, 18:51:45
	"""
	date = datetime.fromtimestamp(float(timeStamp), tz=None)
	return date.strftime('%d/%m/%Y, %H:%M:%S')


def timestamp2Date(timeStamp: float | str) -> str:
	"""Convierte timestamp '1651855905' a fecha '2022-05-06'"""
	return datetime.fromtimestamp(float(timeStamp), tz=None).strftime('%Y-%m-%d')


def date_to_human(date: str) -> Optional[str]:
	"""Formatea una fecha a formato legible
	Args:
		date (str): 2020-10-23 21:34:23
	Returns:
		(str): 23 de October de 2020
	"""
	try:
		obj_date = datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
		return obj_date.strftime('%d de %B de %Y')
	except ValueError:
		return None


def time_to_seconds(timeStr: str) -> Optional[int]:
	"""Convierte un tiempo en formato %H:%M:%S.%f a segundos
	Args:
		timeStr (str): 02:05:12
	Returns:
		(int): 7512
	"""
	if not timeStr or timeStr.count(':') != 2:
		return None

	try:
		timeStr = timeStr.split('.')[0]
		return sum(x * int(t) for x, t in zip([3600, 60, 1], timeStr.split(":")))
	except (ValueError, AttributeError):
		return None


def seconds_to_time(seconds: int) -> Optional[str]:
	"""Convierte segundos a años, meses, días, horas, minutos, y segundos
	Args:
		seconds (int): 7512
	Returns:
		(str): 2hr, 5min, 12seg
	"""
	try:
		d = datetime(1, 1, 1) + timedelta(seconds=seconds)
		year = f'{d.year-1}Años, ' if d.year - 1 > 0 else ''
		month = f'{d.month - 1}Meses, ' if d.month - 1 > 0 else ''
		day = f'{d.day-1}Días, ' if d.day - 1 > 0 else ''
		hour = f'{d.hour}hr, ' if d.hour > 0 else ''
		minute = f'{d.minute}min, ' if d.minute > 0 else ''
		second = f'{d.second}seg' if d.second > 0 else ''
		duration_str = f'{year}{month}{day}{hour}{minute}{second}'
		return duration_str
	except Exception as e:
		lg_prt('ryr', 'Error seconds_to_time()', seconds, e)
		return None


def bytes_to_human(nbytes: int) -> Optional[str]:
	"""Pasar bytes a cantidades mayores con sufijo Ej: 14272717 -> 13.61 MB
	Args:
		nbytes (int): Cantidad de bytes. Ex: 14272717
	Returns:
		str: Información formateada. Ex: 13.61 MB
	"""
	try:
		if nbytes == 0:
			return "0 B"
		if nbytes < 0:
			return None

		i = 0
		size = float(nbytes)
		while size >= 1024 and i < (len(ABR_SIZE) - 1):
			size /= 1024.
			i += 1

		formatted = f'{size:.2f}'.rstrip('0').rstrip('.')
		return f'{formatted} {ABR_SIZE[i]}'
	except Exception as e:
		lg_prt('ryr', 'Error bytes_to_human()', nbytes, e)
		return None
