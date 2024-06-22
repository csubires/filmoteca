#!/usr/bin/python3

import sys 													# Para salir al sistema
import signal												# Para controlar el Control+C salida del programa

from modules.core import HandlerScan						# Para listar películas e incorporarlas a la BD
from modules.service import HandlerService					# Para obtener más información de una película
from modules.utils import lg_prt, filename_datetime			# Mostrar y Colorear texto en consola
from helper import help 									# Mostrar el panel de ayuda

oSCN = oSRVC = None


def sigint_handler(signum, frame):
	# Salida forzada por teclado
	oSCN and oSCN.stop()		# Si el objeto existe hacer parada
	oSRVC and oSRVC.stop()			# Si el objeto existe hacer parada
	lg_prt('w', '______________________________________')
	lg_prt('yr', '[▲] Program keyboard output.', 'WAIT!')
	sys.exit()


# Manegadores de interrupción
signal.signal(signal.SIGINT, sigint_handler)
signal.signal(signal.SIGTERM, sigint_handler)


def main():
	sys.stdout.write('\x1b]2;CATALOGADOR DE PELÍCULAS\x07')		# Title console

	arg1, arg2 = ['help', 0]			# Por defecto HDD Interno
	if sys.argv[1:]:
		arg1 = sys.argv[1]				# Opción
	if sys.argv[2:]:
		arg2 = sys.argv[2]				# HDD

	if arg1 == 'local':
		lg_prt('t', 'ACTUALIZAR LOS DATOS "LOCALES" ')
		oSCN = HandlerScan(int(arg2))
		if not oSCN.STOP:
			oSCN.start()
			oSCN.update_statistics()		# Crear el reporte y actualizar genre
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

	elif arg1 == 'backup':
		lg_prt('t', 'CREAR UNA COPIA DE LA BASE DE DATOS ')
		from shutil import copy							# Para hacer el backup de la base de datos
		from config.global_constant import DB_FILE		# Nombre de la BD
		backup_date = filename_datetime()
		copy(DB_FILE, f'backups/{backup_date}_movieDB.db')
		lg_prt('gy', '[✔] Backup created in', f'"backups/{backup_date}_movieDB.db"')

	else:
		help()


if __name__ == '__main__':
	main()
