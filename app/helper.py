from modules.utils import lg_prt

def help():
	# Panel de ayuda
	lg_prt('w', '')
	lg_prt('t', 'CATALOGADOR DE PELÍCULAS ')
	lg_prt('wobvw', '\n\n Uso:', '\tpython3 main.py', '<Modo>', '<HDD>', '[Estadísticas]\n')

	lg_prt('bw', '\tlocal', '\t\tActualizar los datos "LOCALES"')
	lg_prt('vy', '\t\t0', '\tBuscar en el disco duro INTERNO')
	lg_prt('vy', '\t\t1', '\tBuscar en el disco duro EXTERNO')
	lg_prt('vw', '\t\t[1/0]', '\tCrear registro en estadísticas')
	lg_prt('bw', '\n\tinet', '\t\tActualizar los datos de "INTERNET"')
	lg_prt('bw', '\n\tranking', '\tObtener películas "RANKING" para descargar')
	lg_prt('bw', '\tcovers', '\tComprobar las portadas de las películas')
	lg_prt('bw', '\tpurge', '\t\tPurgar imagenes duplicadas e inexistentes en BBDD')
	lg_prt('bw', '\tbackup', '\tCrear una copia de la Base de Datos')
	lg_prt('bw', '\thelp', '\t\tMostrar ayuda')

	lg_prt('wc', '\n Ejemplos:\n', '\tpython3 main.py inet')
	lg_prt('c', '\tpython3 main.py local 1')
	lg_prt('c', '\tpython3 main.py backup')
	lg_prt('w', '')
