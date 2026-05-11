

from modules.service import HandlerService as HandlerServiceMod
from modules.sqlite import Handler_SQL							# Manejador de la base de datos
from modules.extras import list_to_dict
from modules.utils import lg_prt, singleton, dt_format				# Mostrar y Colorear texto en consola
from modules.torrent import get_torrents
#from server.security import isValidEmail, htmlFilterChars, min_len

from config.queries import TAG_QUERY_REPORT
from config.constant import DB_FILE, NUMMOV_X_SEARCH, NUM_LAST_MOV, MAINTENANCE_OPTIONS, MESSAGE_SUCCESS, MESSAGE_FAILURE, HEADERS_JSON

# modules/tasks.py
from modules.utils import dt_format
from modules.torrent import get_torrents

def get_torrents_task(oSRVC, should_continue_callback=None):
    """Función para la tarea no bloqueante con mejor manejo de errores"""
    try:
        print("=== INICIANDO TAREA DE TORRENTS ===")

        if should_continue_callback and not should_continue_callback():
            return {'status': 'cancelled', 'error': 'Tarea cancelada al inicio'}

        # Obtener configuración actual
        result = oSRVC.oDTB.execute('select_urlend')
        url_end, date_end, npseries = result[0] if result else (None, None, 1)

        print(f"Configuración: URL={url_end}, Fecha={date_end}, Series={npseries}")

        if should_continue_callback and not should_continue_callback():
            return {'status': 'cancelled', 'error': 'Tarea cancelada antes de búsqueda'}

        current_date = dt_format("symd")
        data = None

        # Verificar si necesitamos actualizar
        if not date_end or str(date_end) != str(current_date):
            print("Fecha diferente, obteniendo nuevos torrents...")
            data = get_torrents(oSRVC.oCNT, url_end, npseries, should_continue_callback)

            if should_continue_callback and not should_continue_callback():
                return {'status': 'cancelled', 'error': 'Tarea cancelada durante búsqueda'}

            # Actualizar base de datos si hay datos nuevos
            if data and len(data) > 2 and data[0]:  # data[0] son las películas
                oSRVC.oDTB.execute('update_urlend', {
                    'url_end': data[2],
                    'date_end': current_date,
                    'npseries': data[3] if len(data) > 3 else npseries
                })
                oSRVC.cache_storage['cache_torrent'] = data
                print(f"✓ Actualizada la base de datos con {len(data[0])} películas")
        else:
            print("✓ Usando datos en caché (fecha actual)")
            data = oSRVC.cache_storage.get('cache_torrent', None)

        print("=== TAREA COMPLETADA ===")
        return {
            'status': 'completed',
            'data': data if data else [[], [], url_end, current_date, npseries],
            'type': 'torrent'
        }

    except Exception as e:
        print(f"=== ERROR EN TAREA: {e} ===")
        import traceback
        traceback.print_exc()
        return {'status': 'failed', 'error': str(e)}
