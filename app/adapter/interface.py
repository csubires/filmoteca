#!/usr/bin/env python3
"""
Interfaz genérica para ejecutar tareas de filmoteca desde Node.js
Permite ejecutar cualquier opción de main.py y reportar progreso en tiempo real
"""

import sys
import os
import json
from datetime import datetime

# Agregar el directorio app al path para importaciones
app_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, app_root)

from modules.service import HandlerService as HandlerServiceMod
from modules.sqlite import Handler_SQL
from modules.utils import lg_prt, dt_format
from modules.torrent import get_torrents
from config.constant import DB_FILE


def load_queries_from_json():
	"""Cargar queries desde archivos JSON (igual que Node.js)"""
	web_queries_path = os.path.join(os.path.dirname(app_root), 'web/database/queries')
	all_queries = {}

	if os.path.exists(web_queries_path):
		for file in os.listdir(web_queries_path):
			if file.endswith('.json'):
				try:
					with open(os.path.join(web_queries_path, file), 'r') as f:
						queries = json.load(f)
						all_queries.update(queries)
				except Exception as e:
					print(f"LOG: Advertencia cargando {file}: {e}", flush=True)

	return all_queries


def log_progress(progress, message):
	"""Log con formato de progreso"""
	print(f"PROGRESO:{progress}", flush=True)
	print(f"LOG: {message}", flush=True)


def log_error(message):
	"""Log de error"""
	print(f"LOG: ERROR: {message}", flush=True)


def execute_torrent_search(task_config, should_continue_callback=None):
	"""
	Ejecutar búsqueda de torrents
	task_config: {'npseries': int, 'url_end': str}
	"""
	try:
		log_progress(5, "Iniciando búsqueda de torrents...")

		# Inicializar servicio
		tag_query = load_queries_from_json()
		oSRVC = HandlerServiceMod()
		oSRVC.oDTB.tag_query = tag_query

		# Inicializar tabla torrents si no existe
		try:
			oSRVC.oDTB.cdb.execute("""
				INSERT OR IGNORE INTO data (id_data, url_end, date_end, npseries)
				VALUES (0, NULL, NULL, 1)
			""")
			oSRVC.oDTB.cdb.commit()
		except Exception as e:
			log_progress(10, f"Advertencia inicializando tabla: {e}")

		log_progress(15, "Obteniendo configuración...")

		# Obtener configuración actual
		result = oSRVC.oDTB.execute('select_urlend')
		url_end = task_config.get('url_end') if task_config else None
		npseries = task_config.get('npseries', 1) if task_config else 1

		if result:
			url_end = result[0][0] or url_end  # result[0][0] = url_end
			npseries = result[0][2] if len(result[0]) > 2 else npseries  # result[0][2] = npseries

		log_progress(20, f"URL: {url_end}, Series: {npseries}")

		# Comprobar caché en la tabla torrent_cache por fecha actual
		current_date = dt_format('symd')
		try:
			cache_res = oSRVC.oDTB.execute('select_torrent_cache_by_date', {'date_cached': current_date})
			if cache_res and len(cache_res) > 0:
				# Devolver datos cacheados
				try:
					movies = json.loads(cache_res[0][2] or '[]')  # movies_json
					series = json.loads(cache_res[0][3] or '[]')  # series_json
					log_progress(30, 'Usando datos en caché')
					return {
						'status': 'completed',
						'data': [movies, series, cache_res[0][4], cache_res[0][1], cache_res[0][5]],  # url_end, date_cached, npseries
						'message': 'Usando datos en caché'
					}
				except Exception as e:
					log_progress(30, f'Error parseando caché: {e}')
		except Exception:
			# Si la consulta no existe o falla, continuamos sin caché
			pass

		# Ejecutar búsqueda
		log_progress(25, "Buscando torrents...")
		data = get_torrents(oSRVC.oCNT, url_end, npseries, should_continue_callback)

		if not data or not data[0]:
			log_progress(50, "No se encontraron torrents")
			return {
				'status': 'completed',
				'data': [[], [], url_end, dt_format('symd'), npseries],
				'message': 'No se encontraron torrents'
			}

		log_progress(75, f"Se encontraron {len(data[0])} películas")

		# Actualizar base de datos
		current_date = dt_format('symd')
		oSRVC.oDTB.execute('update_urlend', {
			'url_end': data[2],
			'date_end': current_date,
			'npseries': data[3] if len(data) > 3 else npseries
		})

		log_progress(90, "Guardando datos en torrent_cache...")
		# Guardar en tabla torrent_cache (insertar o actualizar)
		try:
			movies_json = json.dumps(data[0])
			series_json = json.dumps(data[1])
			# Intentar insertar
			existing = None
			try:
				existing = oSRVC.oDTB.execute('select_torrent_cache_by_date', {'date_cached': current_date})
			except Exception:
				existing = None

			if existing and len(existing) > 0:
					oSRVC.oDTB.execute('update_torrent_cache', {
						'movies_json': movies_json,
						'series_json': series_json,
						'url_end': data[2],
						'npseries': data[3] if len(data) > 3 else npseries,
						'date_cached': current_date
					})
			else:
					oSRVC.oDTB.execute('insert_torrent_cache', {
						'date_cached': current_date,
						'movies_json': movies_json,
						'series_json': series_json,
						'url_end': data[2],
						'npseries': data[3] if len(data) > 3 else npseries
					})
		except Exception as e:
			log_progress(95, f"Advertencia guardando caché: {e}")

		log_progress(95, "Datos guardados")

		return {
			'status': 'completed',
			'data': [data[0], data[1], data[2], current_date, data[4] if len(data) > 4 else npseries],
			'message': f'Se encontraron {len(data[0])} películas y {len(data[1])} series'
		}

	except Exception as e:
		log_error(str(e))
		import traceback
		traceback.print_exc()
		return {
			'status': 'failed',
			'error': str(e)
		}


def execute_local_scan(task_config, should_continue_callback=None):
	"""Ejecutar escaneo local (similar a main.py 'local')"""
	try:
		from modules.core import HandlerScan

		log_progress(5, "Iniciando escaneo local...")
		hdd = task_config.get('hdd', 0) if task_config else 0
		stats = task_config.get('stats', True) if task_config else True

		log_progress(10, f"Escaneando HDD {hdd}...")

		oSCN = HandlerScan(hdd)
		if not oSCN.STOP:
			oSCN.start()
			log_progress(80, "Escaneo completado, actualizando estadísticas...")
			if stats:
				oSCN.update_statistics()
			del oSCN

		log_progress(95, "Escaneo finalizado")
		return {
			'status': 'completed',
			'message': f'Escaneo completado en HDD {hdd}'
		}

	except Exception as e:
		log_error(str(e))
		return {
			'status': 'failed',
			'error': str(e)
		}


def execute_inet_update(task_config, should_continue_callback=None):
	"""Ejecutar actualización de datos de internet"""
	try:
		log_progress(5, "Iniciando actualización de datos de internet...")

		oSRVC = HandlerServiceMod()
		log_progress(20, "Obteniendo información de películas...")
		oSRVC.start()

		log_progress(95, "Actualización completada")
		del oSRVC

		return {
			'status': 'completed',
			'message': 'Datos de internet actualizados'
		}

	except Exception as e:
		log_error(str(e))
		return {
			'status': 'failed',
			'error': str(e)
		}


TASK_HANDLERS = {
	'torrent': execute_torrent_search,
	'local': execute_local_scan,
	'inet': execute_inet_update,
}


def execute_backup(task_config, should_continue_callback=None):
	try:
		log_progress(5, 'Iniciando backup de la base de datos...')
		from shutil import copy
		backup_date = dt_format('symdthms')
		backup_dir = os.path.join(os.path.dirname(app_root), 'data', 'backups')
		if not os.path.exists(backup_dir):
			os.makedirs(backup_dir, exist_ok=True)
		dest = os.path.join(backup_dir, f'{backup_date}_filmoteca.db')
		copy(DB_FILE, dest)
		log_progress(100, f'Backup creado en {dest}')
		return {'status': 'completed', 'message': f'Backup creado en {dest}'}
	except Exception as e:
		log_error(str(e))
		return {'status': 'failed', 'error': str(e)}


def execute_reduce(task_config, should_continue_callback=None):
	try:
		log_progress(5, 'Iniciando reducción de imágenes...')
		from modules.reduce import ImageProcessor
		covers_path = os.path.join(os.path.dirname(app_root), 'web', 'frontend', 'public', 'assets', 'covers')
		proc = ImageProcessor(covers_path)
		proc.run(confirm=False)
		log_progress(100, 'Reducción de imágenes completada')
		return {'status': 'completed', 'message': 'Reduce images finished', 'path': covers_path}
	except Exception as e:
		log_error(str(e))
		return {'status': 'failed', 'error': str(e)}


def execute_ranking(task_config, should_continue_callback=None):
	try:
		log_progress(5, 'Obteniendo ranking...')
		oSRVC = HandlerServiceMod()
		oSRVC.get_rankin_by_years()
		del oSRVC
		log_progress(100, 'Ranking obtenido')
		return {'status': 'completed', 'message': 'Ranking generado'}
	except Exception as e:
		log_error(str(e))
		return {'status': 'failed', 'error': str(e)}


def execute_covers(task_config, should_continue_callback=None):
	try:
		log_progress(5, 'Comprobando portadas en HDD...')
		oSRVC = HandlerServiceMod()
		oSRVC.check_img_in_hdd()
		del oSRVC
		log_progress(100, 'Comprobación de portadas finalizada')
		return {'status': 'completed', 'message': 'Covers check completed'}
	except Exception as e:
		log_error(str(e))
		return {'status': 'failed', 'error': str(e)}


TASK_HANDLERS.update({
	'backup': execute_backup,
	'reduce': execute_reduce,
	'ranking': execute_ranking,
	'covers': execute_covers
})


def main():
	"""Punto de entrada principal"""
	if len(sys.argv) < 2:
		print("ERROR: Se requiere especificar una tarea", flush=True)
		print(f"Tareas disponibles: {', '.join(TASK_HANDLERS.keys())}", flush=True)
		sys.exit(1)

	task_name = sys.argv[1]
	task_config = None

	# Parsear configuración JSON si se proporciona
	if len(sys.argv) > 2:
		try:
			task_config = json.loads(sys.argv[2])
		except json.JSONDecodeError:
			log_error(f"Configuración JSON inválida: {sys.argv[2]}")
			sys.exit(1)

	if task_name not in TASK_HANDLERS:
		log_error(f"Tarea desconocida: {task_name}")
		print(f"Tareas disponibles: {', '.join(TASK_HANDLERS.keys())}", flush=True)
		sys.exit(1)

	print("PROGRESO:0", flush=True)
	log_progress(1, f"Ejecutando tarea: {task_name}")

	# Flag para cancelación
	should_stop = False

	def should_continue():
		return not should_stop

	# Ejecutar la tarea
	handler = TASK_HANDLERS[task_name]
	result = handler(task_config, should_continue)

	print("PROGRESO:100", flush=True)

	if result['status'] == 'completed':
		print("TAREA COMPLETADA", flush=True)
		output = {
			'status': 'completed',
			'data': result.get('data'),
			'message': result.get('message')
		}
		print(json.dumps(output), flush=True)
		sys.exit(0)
	else:
		print("TAREA FALLIDA", flush=True)
		output = {
			'status': 'failed',
			'error': result.get('error', 'Error desconocido')
		}
		print(json.dumps(output), flush=True)
		sys.exit(1)


if __name__ == '__main__':
	main()
