import os 							# Recorrer carpetas
import time 					# Para contar tiempos

from modules.utils import lg_prt

base_dir = '/home/user/Documentos/box/'


def walkFolders(fullPath):
	''' Recorrer todas las carpetas, archivos y decidir si procesarlos o no '''

	listObj = os.listdir(fullPath)
	for entrada in listObj:
 
		aPath = os.path.join(fullPath, entrada)
		min_path = aPath.replace(base_dir, '') 		# Quitar /mnt/hgfs/movies/

		if os.path.isdir(aPath): 							# Si es un directorio
			lg_prt('oyr', aPath, min_path, os.path.getctime(aPath))
			walkFolders(aPath)										# TODO (dirhash(aPath)) mal rendimiento

		else:
			_, extension = os.path.splitext(aPath)
			extension = extension.strip('.').lower()
			lg_prt('bvc', aPath, min_path, extension)



def scandirFolders(fullPath):
	# Recorrer todas las carpetas, archivos y decidir si procesarlos o no

	listObj = os.scandir(fullPath)
	for entrada in listObj:

		# aPath = os.path.join(fullPath, entrada)
		min_path = entrada.path.replace(base_dir, '') 		# Quitar /mnt/hgfs/movies/

		lg_prt('t', entrada.path, min_path)
	

		if entrada.is_dir(): 					
			lg_prt('vggr', 'DIR', min_path, entrada.stat().st_ctime)
			scandirFolders(entrada.path)

		else:
			extension = entrada.name.rsplit('.', 1)[-1].lower()
			lg_prt('bvc', entrada.path, entrada.name, extension)
			lg_prt('bvc', os.path.dirname(entrada.path), min_path, entrada.stat().st_size)




tic = time.perf_counter()
#walkFolders(base_dir)
toc = time.perf_counter()
elapsed_time1 = toc - tic

lg_prt('oyc', '-------------------', '----------', '-------------------------')

tic = time.perf_counter()
#scandirFolders(base_dir)
toc = time.perf_counter()
elapsed_time2 = toc - tic

lg_prt('oyc', '[▲] Elapsed time for', '@chronos', f'{elapsed_time1:0.4f} seconds')
lg_prt('oyc', '[▲] Elapsed time for', '@chronos', f'{elapsed_time2:0.4f} seconds')


def scandirFolders22(fullPath):
	# Recorrer todas las carpetas, archivos y decidir si procesarlos o no

	listObj = os.scandir(fullPath)
	for entrada in listObj:

		# aPath = os.path.join(fullPath, entrada)
		min_path = entrada.path.replace(base_dir, '') 		# Quitar /mnt/hgfs/movies/

		lg_prt('t', entrada.path, min_path)
	

		if entrada.is_dir(): 					
			lg_prt('vggr', 'DIR', min_path, entrada.stat().st_ctime)
			# scandirFolders(entrada.path)

		else:
			extension = entrada.name.rsplit('.', 1)[-1].lower()
			lg_prt('bvc', entrada.path, entrada.name, extension)
			lg_prt('bvc', os.path.dirname(entrada.path), min_path, entrada.stat().st_size)

scandirFolders22('/mnt/hgfs/movies/')