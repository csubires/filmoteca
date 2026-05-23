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

        # Inicializar tabla data si no existe
        try:
            oSRVC.oDTB.cdb.execute("""
                INSERT OR IGNORE INTO data (id_data, url_end, date_end, npseries)
                VALUES (0, NULL, NULL, 1)
            """)
            oSRVC.oDTB.cdb.commit()
        except Exception as e:
            log_progress(10, f"Advertencia inicializando tabla data: {e}")

        log_progress(15, "Obteniendo configuración...")

        # Obtener configuración actual de tabla data
        try:
            result = oSRVC.oDTB.execute('select_urlend')
            url_end = task_config.get('url_end') if task_config else None
            npseries = task_config.get('npseries', 1) if task_config else 1

            if result and len(result) > 0:
                url_end = result[0][0] or url_end  # result[0][0] = url_end
                npseries = result[0][2] if len(result[0]) > 2 else npseries  # result[0][2] = npseries

            log_progress(20, f"Configuración: URL={url_end}, Series={npseries}")
        except Exception as e:
            log_progress(20, f"Error obteniendo config: {e}, usando valores por defecto")
            url_end = task_config.get('url_end') if task_config else None
            npseries = task_config.get('npseries', 1) if task_config else 1

        # Comprobar caché en la tabla torrent_cache por fecha actual
        current_date = dt_format('symd')
        log_progress(25, f"Fecha actual: {current_date}")

        try:
            cache_res = oSRVC.oDTB.execute('select_torrent_cache_by_date', {'date_cached': current_date})
            if cache_res and len(cache_res) > 0:
                # Devolver datos cacheados
                try:
                    movies = json.loads(cache_res[0][2] or '[]')  # movies_json
                    series = json.loads(cache_res[0][3] or '[]')  # series_json
                    log_progress(30, f'Usando caché de {current_date}: {len(movies)} películas, {len(series)} series')
                    result_data = {
                        'status': 'completed',
                        'data': [movies, series, cache_res[0][4], cache_res[0][1], cache_res[0][5]],  # url_end, date_cached, npseries
                        'message': 'Usando datos en caché'
                    }
                    # Imprimir resultado como JSON
                    print(json.dumps(result_data), flush=True)
                    print('TAREA COMPLETADA', flush=True)
                    return result_data
                except Exception as e:
                    log_progress(30, f'Error parseando caché: {e}')
        except Exception as e:
            # Si la consulta falla, continuamos sin caché
            log_progress(30, f'Caché no disponible: {e}')

        # Ejecutar búsqueda
        log_progress(35, "Buscando torrents en RojoTorrent...")


        oSRVC.oCNT.set_cookies({
            'browser-pow-auth': 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhY3Rpb24iOiJDSEFMTEVOR0UiLCJjaGFsbGVuZ2UiOiIwMTllNTA0MS01NWViLTcwMTAtYjE3ZC01OGRlYTgyOWYzMGYiLCJleHAiOjE3Nzk1MDYxMzAsImlhdCI6MTc3OTQ2MjkzMCwibWV0aG9kIjoiZmFzdCIsIm5iZiI6MTc3OTQ2Mjg3MCwicG9saWN5UnVsZSI6ImYxNDdjYjQ2ZmE2YmJkZGIiLCJyZXN0cmljdGlvbiI6ImE4ODQ2YjRlYjhlNjMxYjFiNjEyZDA5NjljNGE1ODZmNjFjMzAzNTU5ZjQ3OGIzZDNhYTVlY2VkYjJiNjJhMTYifQ.7r_TC5K-3zeYh34QmG17O9CJOgz-3p-QoEdWFIIVRW7o3IYmxnK9O5U1cg1aps1PPg35DOplraB0jQwTl1O8Cg',
            'browser-pow-cookie-verification': '019e5041-55eb-7010-b17d-58dea829f30f'
        })

        data = get_torrents(oSRVC.oCNT, url_end, npseries, should_continue_callback)

        if not data or not data[0]:
            log_progress(50, "No se encontraron torrents")
            result_data = {
                'status': 'completed',
                'data': [[], [], url_end, dt_format('symd'), npseries],
                'message': 'No se encontraron torrents'
            }
            print(json.dumps(result_data), flush=True)
            print('TAREA COMPLETADA', flush=True)
            return result_data

        movies_count = len(data[0])
        series_count = len(data[1]) if len(data) > 1 else 0
        log_progress(60, f"Se encontraron {movies_count} películas y {series_count} series")

        # Actualizar tabla data
        current_date = dt_format('symd')
        try:
            oSRVC.oDTB.execute('update_urlend', {
                'url_end': data[2],
                'date_end': current_date,
                'npseries': data[3] if len(data) > 3 else npseries
            })
            log_progress(75, "Tabla data actualizada")
        except Exception as e:
            log_progress(75, f"Advertencia actualizando tabla data: {e}")

        # Guardar en tabla torrent_cache (insertar o actualizar)
        log_progress(80, "Guardando datos en torrent_cache...")
        try:
            movies_json = json.dumps(data[0])
            series_json = json.dumps(data[1])

            # Intentar obtener registro existente
            existing = None
            try:
                existing = oSRVC.oDTB.execute('select_torrent_cache_by_date', {'date_cached': current_date})
            except Exception as e:
                log_progress(85, f"Error buscando registro existente: {e}")

            if existing and len(existing) > 0:
                # Actualizar registro existente
                try:
                    oSRVC.oDTB.execute('update_torrent_cache', {
                        'movies_json': movies_json,
                        'series_json': series_json,
                        'url_end': data[2],
                        'npseries': data[3] if len(data) > 3 else npseries,
                        'date_cached': current_date
                    })
                    log_progress(90, f"Caché actualizado: {movies_count} películas, {series_count} series")
                except Exception as e:
                    log_progress(90, f"Error actualizando caché: {e}")
            else:
                # Insertar nuevo registro
                try:
                    oSRVC.oDTB.execute('insert_torrent_cache', {
                        'date_cached': current_date,
                        'movies_json': movies_json,
                        'series_json': series_json,
                        'url_end': data[2],
                        'npseries': data[3] if len(data) > 3 else npseries
                    })
                    log_progress(90, f"Caché creado: {movies_count} películas, {series_count} series")
                except Exception as e:
                    log_progress(90, f"Error insertando en caché: {e}")
        except Exception as e:
            log_progress(90, f"Advertencia guardando caché: {e}")

        # Preparar resultado final
        log_progress(95, "Preparando resultado...")
        result_data = {
            'status': 'completed',
            'data': [data[0], data[1], data[2], current_date, data[3] if len(data) > 3 else npseries],
            'message': f'Se encontraron {movies_count} películas y {series_count} series'
        }

        # Imprimir resultado como JSON para que el frontend lo pueda leer
        print(json.dumps(result_data), flush=True)
        log_progress(100, "Búsqueda completada")
        print('TAREA COMPLETADA', flush=True)

        return result_data

    except Exception as e:
        log_error(str(e))
        import traceback
        traceback.print_exc()
        error_result = {
            'status': 'failed',
            'error': str(e)
        }
        print(json.dumps(error_result), flush=True)
        print('TAREA COMPLETADA', flush=True)
        return error_result


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
