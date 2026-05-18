
import sys
import os
import json

# Agregar el directorio app al path para importaciones
app_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, app_root)

from modules.service import HandlerService as HandlerServiceMod
from modules.sqlite import Handler_SQL							# Manejador de la base de datos
from modules.extras import list_to_dict
from modules.utils import lg_prt, singleton, dt_format				# Mostrar y Colorear texto en consola
from modules.torrent import get_torrents

from config.queries import TAG_QUERY_REPORT
from config.constant import DB_FILE, NUMMOV_X_SEARCH, NUM_LAST_MOV, MAINTENANCE_OPTIONS, MESSAGE_SUCCESS, MESSAGE_FAILURE, HEADERS_JSON

def load_queries_from_json():
	"""Load queries from JSON files (same as Node.js does)"""
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
					print(f"Warning loading {file}: {e}")

	return all_queries

def get_torrents_task(oSRVC, should_continue_callback=None):
    """Función para la tarea no bloqueante con mejor manejo de errores"""
    try:
        print("LOG: === INICIANDO TAREA DE TORRENTS ===", flush=True)
        print("PROGRESO:5", flush=True)

        if should_continue_callback and not should_continue_callback():
            print("LOG: Tarea cancelada al inicio", flush=True)
            return {'status': 'cancelled', 'error': 'Tarea cancelada al inicio'}

        # Obtener configuración actual
        print("LOG: Obteniendo configuración actual...", flush=True)
        result = oSRVC.oDTB.execute('select_urlend')
        url_end, date_end, npseries = result[0] if result else (None, None, 1)

        print(f"LOG: Configuración: URL={url_end}, Fecha={date_end}, Series={npseries}", flush=True)
        print("PROGRESO:15", flush=True)

        if should_continue_callback and not should_continue_callback():
            print("LOG: Tarea cancelada antes de búsqueda", flush=True)
            return {'status': 'cancelled', 'error': 'Tarea cancelada antes de búsqueda'}

        current_date = dt_format("symd")
        data = None

        # Verificar si necesitamos actualizar
        if not date_end or str(date_end) != str(current_date):
            print(f"LOG: Fecha diferente, obteniendo nuevos torrents (hoy: {current_date})...", flush=True)
            print("PROGRESO:20", flush=True)
            data = get_torrents(oSRVC.oCNT, url_end, npseries, should_continue_callback)
            print("PROGRESO:80", flush=True)

            if should_continue_callback and not should_continue_callback():
                print("LOG: Tarea cancelada durante búsqueda", flush=True)
                return {'status': 'cancelled', 'error': 'Tarea cancelada durante búsqueda'}

            # Actualizar base de datos si hay datos nuevos
            if data and len(data) > 2 and data[0]:  # data[0] son las películas
                print(f"LOG: Actualizando base de datos con {len(data[0])} películas...", flush=True)
                oSRVC.oDTB.execute('update_urlend', {
                    'url_end': data[2],
                    'date_end': current_date,
                    'npseries': data[3] if len(data) > 3 else npseries
                })
                oSRVC.cache_storage['cache_torrent'] = data
                print(f"LOG: ✓ Base de datos actualizada", flush=True)
        else:
            print("LOG: ✓ Usando datos en caché (fecha actual)", flush=True)
            data = oSRVC.cache_storage.get('cache_torrent', None)

        print("PROGRESO:95", flush=True)
        print("LOG: === TAREA COMPLETADA ===", flush=True)
        return {
            'status': 'completed',
            'data': data if data else [[], [], url_end, current_date, npseries],
            'type': 'torrent'
        }

    except Exception as e:
        print(f"LOG: === ERROR EN TAREA: {e} ===", flush=True)
        import traceback
        traceback.print_exc()
        return {'status': 'failed', 'error': str(e)}


if __name__ == '__main__':
	"""Main entry point when executed as a standalone script from Node.js"""
	import sys
	import json
	from datetime import datetime

	try:
		print("PROGRESO:0", flush=True)
		print("LOG: Conectando a base de datos...", flush=True)

		# Load queries from JSON
		tag_query = load_queries_from_json()
		print(f"LOG: Cargadas {len(tag_query)} queries", flush=True)

		# Initialize handler with queries
		oSRVC = HandlerServiceMod()
		# Update the database handler with queries
		oSRVC.oDTB.tag_query = tag_query

		# Initialize data table if not exists
		print("LOG: Inicializando tabla data...", flush=True)
		try:
			oSRVC.oDTB.cdb.execute("""
				INSERT OR IGNORE INTO data (id_data, url_end, date_end, npseries)
				VALUES (0, NULL, NULL, 1)
			""")
			oSRVC.oDTB.cdb.commit()
			print("LOG: Tabla data lista", flush=True)
		except Exception as e:
			print(f"LOG: Advertencia inicializando tabla: {e}", flush=True)

		print("PROGRESO:10", flush=True)
		print("LOG: Iniciando búsqueda de torrents...", flush=True)

		# Flag para cancelación desde Node.js
		should_stop = False

		def should_continue():
			return not should_stop

		# Execute task
		result = get_torrents_task(oSRVC, should_continue)

		print("PROGRESO:90", flush=True)

		if result['status'] == 'completed':
			print("PROGRESO:100", flush=True)
			print("TAREA COMPLETADA", flush=True)

			# Format date as YYYYMMDD to match Node.js format
			data = result.get('data', [[], [], None, None, 1])
			today = datetime.now().strftime('%Y%m%d')

			# Return data in format: [movies, series, url_end, date_end, npseries]
			output = {
				'status': 'completed',
				'data': [
					data[0] if len(data) > 0 else [],      # movies
					data[1] if len(data) > 1 else [],      # series
					data[2] if len(data) > 2 else None,    # url_end
					today,                                  # date_end (today in YYYYMMDD format)
					data[4] if len(data) > 4 else 1        # npseries
				]
			}
			print(json.dumps(output), flush=True)
			sys.exit(0)
		elif result['status'] == 'cancelled':
			print("PROGRESO:0", flush=True)
			print("TAREA CANCELADA", flush=True)
			sys.exit(1)
		else:
			print("ERROR:", result.get('error', 'Unknown error'), flush=True)
			sys.exit(1)

	except Exception as e:
		print(f"FATAL ERROR: {e}", flush=True)
		import traceback
		traceback.print_exc()
		sys.exit(1)
