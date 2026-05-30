#!/usr/bin/python3
'''
# Filename: main.py
# Version: 1.0
# By: CSUBIRES <cjesuma@proton.me>
# Created: 2024/08/12 12:03:12 by CSUBIRES
# Updated: 2024/08/12 12:03:12 by CSUBIRES
# Description: main
'''

import sys                                      # Para salir al sistema
import signal                                   # Para controlar el Control+C salida del programa

from modules.core import HandlerScan            # Para listar películas e incorporarlas a la BD
from modules.service import HandlerService      # Para obtener más información de una película
from modules.utils import lg_prt, dt_format     # Mostrar y Colorear texto en consola
from helper import help                         # Mostrar el panel de ayuda

from config.constant import PATH_COVERS, DB_FILE


from config.queries import TAG_QUERY_REPORT

oSCN = oSRVC = None


def sigint_handler(signum, frame):
    # Salida forzada por teclado
    oSCN and oSCN.stop()        # Si el objeto existe hacer parada
    oSRVC and oSRVC.stop()      # Si el objeto existe hacer parada
    lg_prt('w', '______________________________________')
    lg_prt('yr', '[▲] Program keyboard output.', 'WAIT!')
    sys.exit()


# Manegadores de interrupción
signal.signal(signal.SIGINT, sigint_handler)
signal.signal(signal.SIGTERM, sigint_handler)


def main():
    sys.stdout.write('\x1b]2;CATALOGADOR DE PELÍCULAS\x07')     # Title console

    arg1, arg2, arg3 = ['help', 0, True]   # Por defecto HDD Interno
    if sys.argv[1:]:
        arg1 = sys.argv[1]                  # Opción
    if sys.argv[2:]:
        arg2 = int(sys.argv[2])             # HDD
    if sys.argv[3:]:
        arg3 = bool(int(sys.argv[3]))       # Estadísticas

    if arg1 == 'local':
        lg_prt('t', 'ACTUALIZAR LOS DATOS "LOCALES" ')
        oSCN = HandlerScan(arg2)
        if not oSCN.STOP:
            oSCN.start()
            if arg3:
                oSCN.update_statistics()    # Crear el reporte, actualizar genre
            del oSCN

    elif arg1 == 'inet':
        lg_prt('t', 'ACTUALIZAR LOS DATOS DE "INTERNET" ')
        oSRVC = HandlerService()
        oSRVC.start()
        del oSRVC

    elif arg1 == 'ranking':
        oSRVC = HandlerService()
        lg_prt('wt', '\n', 'OBTENER PELÍCULAS "RANKING" PARA DESCARGAR ')
        oSRVC.get_rankin_by_years()
        del oSRVC

    elif arg1 == 'covers':
        lg_prt('t', 'COMPROBAR LAS PORTADAS DE LAS PELÍCULAS ')
        oSRVC = HandlerService()
        oSRVC.check_img_in_hdd()
        del oSRVC

    elif arg1 == 'purge':
        oSRVC = HandlerService()
        lg_prt('wt', '\n', 'PURGAR IMAGENES INEXISTENTES EN BBDD ')
        oSRVC.purge_img_in_hdd()
        lg_prt('wt', '\n', 'PURGAR IMAGENES DUPLICADAS ')
        oSRVC.purge_duplicate_img()
        del oSRVC

    elif arg1 == 'torrent':
        lg_prt('t', 'BUSCAR NUEVOS TORRENTS ')
        from modules.torrent import get_torrents
        from modules.connection import Handler_connection
        from modules.sqlite import Handler_SQL
        from config.constant import DB_FILE
        from config.queries import TAG_QUERY_REPORT
        oCNT = Handler_connection()
        oDTB = Handler_SQL(DB_FILE, TAG_QUERY_REPORT)

        # Obtener configuración actual
        result = oDTB.execute('select_urlend')

        url_end, date_end, npseries = None, None, 1
        if result:
            url_end = result[0][0]
            date_end = result[0][1]
            npseries = result[0][2]

        current_date = dt_format('symd')

        oCNT.set_cookies({
            'browser-pow-auth': 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhY3Rpb24iOiJDSEFMTEVOR0UiLCJjaGFsbGVuZ2UiOiIwMTllNTA0MS01NWViLTcwMTAtYjE3ZC01OGRlYTgyOWYzMGYiLCJleHAiOjE3Nzk1MDYxMzAsImlhdCI6MTc3OTQ2MjkzMCwibWV0aG9kIjoiZmFzdCIsIm5iZiI6MTc3OTQ2Mjg3MCwicG9saWN5UnVsZSI6ImYxNDdjYjQ2ZmE2YmJkZGIiLCJyZXN0cmljdGlvbiI6ImE4ODQ2YjRlYjhlNjMxYjFiNjEyZDA5NjljNGE1ODZmNjFjMzAzNTU5ZjQ3OGIzZDNhYTVlY2VkYjJiNjJhMTYifQ.7r_TC5K-3zeYh34QmG17O9CJOgz-3p-QoEdWFIIVRW7o3IYmxnK9O5U1cg1aps1PPg35DOplraB0jQwTl1O8Cg',
            'browser-pow-cookie-verification': '019e5041-55eb-7010-b17d-58dea829f30f'
        })


        # Buscar si es diferente al día actual
        if not date_end or str(date_end) != str(current_date):
            lg_prt('gy', '[▪] Buscando torrents...')
            data = get_torrents(oCNT, url_end, npseries)

            if data and len(data) > 2:
                # Actualizar base de datos
                oDTB.execute('update_urlend', {
                    'url_end': data[2],
                    'date_end': current_date,
                    'npseries': data[3] if len(data) > 3 else npseries
                })
                lg_prt('gy', f'[✔] Se encontraron {len(data[0])} películas')
        else:
            lg_prt('gy', '[✔] Usando datos en caché (fecha actual)')

        del oCNT
        del oDTB

    elif arg1 == 'backup':
        lg_prt('t', 'CREAR UNA COPIA DE LA BASE DE DATOS ')
        from shutil import copy                         # Para hacer el backup de la base de datos
        from config.constant import DB_FILE      # Nombre de la BD
        backup_date = dt_format('symdthms')
        copy(DB_FILE, f'../data/backups/{backup_date}_filmoteca.db')
        lg_prt('gy', '[✔] Backup created in', f'"backups/{backup_date}_filmoteca.db"')

    elif arg1 == 'reduce':
        lg_prt('t', 'REDUCIR EL TAMAÑO DE LAS IMÁGENES ')
        from modules.reduce import ImageProcessor

        # Pipeline completo con confirmaciones (igual que el bash)
        proc = ImageProcessor("../web/frontend/public/assets/covers")
        proc.run(confirm=False)
        lg_prt('gy', '[✔] Reduce images finished', './web/frontend/public/assets/covers')

    else:
        help()


if __name__ == '__main__':
    main()
