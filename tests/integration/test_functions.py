# Execute: python3 tests/test_functions.py

from modules.utils import lg_prt					# Mostrar y Colorear texto en consola
# from modules.movie_lister import get_fileMetaData
import subprocess 					# Abrir un proceso y usar un comando linux para obtener info de un archivo
from time import sleep				# Para detener el programa x segundos
import re							# Usar expresiones regulares para extraer información de un texto


def time_to_seconds(timeStamp):
	''' Convierte un tiempo en formato %H:%M:%S.%f a segundos
		Args:
			timeStamp(str) -> 02:05:12
		Returns:
			str-> 7512
	'''
	if timeStamp.count(':') != 2 or timeStamp is None:
		return None
	timeStamp = timeStamp.split('.')[0]
	return sum(x * int(t) for x, t in zip([3600, 60, 1], timeStamp.split(":")))

def get_fileMetaData(fullPath):
	''' Obtener los metadatos de la película
		Args: 
			fullPath(str) > '/mnt/hgfs/movies/Acción/Desterrado [HDRip] (2014).avi'
		Returns:
			list(duration, resolution, fps)
	'''
	duration=resolution=fps = None
	
	try:
		cmds = ['ffmpeg', '-i', fullPath, '-hide_banner']
		p = subprocess.Popen(cmds, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		p.wait()
		_, err = p.communicate()
		err = str(err).lower()
		
		duration = re.search(r'\d{2}:\d{2}:\d{2}', err)		# Encontrar horas hh:mm:ss
		duration = time_to_seconds(duration[0]) if duration is not None else None
		resolution = re.search(r'\d{3,5}x\d{3,5}', err)		# Encontrar resolución 9999x999
		resolution = resolution[0] if resolution is not None else None
		fps = re.search(r'\d+\.\d+ fps', err)				# Encontrar fps 99.99 fps
		fps = float(fps[0].replace(' fps', '')) if fps is not None else None
		return [duration, resolution, fps]
	except Exception as e:
		lg_prt('ryr', '[✖] Error in get_fileMetaData()', fullPath, e)
		if DEBUG_MODE:
			lg_prt('999', 'get_fileMetaData', f'{fullPath}, {duration}, {resolution}, {fps}')



def check_function():
	
    #result = get_fileMetaData('/mnt/hgfs/movies/Anime/Dragon Ball/Dragon Ball GT - 100 años después  (1997).mpg')
    result = get_fileMetaData('/mnt/hgfs/movies/Acción/Atómica [DVDRip] (2017).avi')
    lg_prt('g', result)

check_function()