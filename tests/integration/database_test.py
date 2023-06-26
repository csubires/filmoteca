#!/usr/bin python
# -*- coding: utf-8 -*-

#import sys
#sys.path.append("..")

import matplotlib.pyplot as plt
from utils import (lg_prt, bytes_to_human, seconds_to_time, date_to_human, URL_BASE, URL_PICT)


from database import handler_SQL
from datetime import datetime
from utils import lg_prt			# Colorear texto
import utils as utils
import os 							# Recorrer carpetas

'''

# ---------------------------------------- STRUCTURES.PY



db = handler_SQL('movieDB')

db.maintenance_bd()

#lg_prt(0, f' UNO {db.get_name_subgenre(5)}')
#lg_prt(0, f' DOS {db.get_movies_by_IDGenre(1)}')
#lg_prt(0, f' TRES {db.get_genre()}')

#lg_prt(0, f' CUATRO {db.get_report_info()}')

#report_date = str(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
#report_ext = 'MIERDA'
#db.update_statistics(report_date, report_ext)

#lg_prt(0, f' CUATRO {db.get_or_insert_genre("aventuras", 0, "MIERDA")}')


info_of_movie = {
	'title':'algo', 
	'year':1234, 
	'quality':'medium', 
	'extension':'exc', 
	'size':345, 
	'pathfile':'fullPath.replace(BASE_DIR, '')', 
	'duration':345, 
	'resolution':'resolution', 
	'fps':'fps', 
	'urldesc':'posible_url', 
	'realtitle':23456, 
	'country':'country', 
	'ratings':6.6, 
	'urlpicture': 'urlpicture', 
	'download_date':'download_date', 
	'report_date':'report_date', 
	'id_genre':1, 
	'id_subgenre':0 
}

db.insert_movie(info_of_movie)

#lg_prt(0, f'{db.file_in_bd("/Ciencia ficción/Poder mental [HDRip] (2015).avi",report_date)}')
#lg_prt(0, f'{db.file_in_bd("/Ciencia ficción/Poder mental [HDRip] (2015).asvi",report_date)}')

del db

'''

# ---------------------------------------- FIN




# ---------------------------------------- CONNECTION.PY

'''
LST_PROXY = ['181.30.28.178:80', '88.199.21.76:80', '157.245.224.29:80','142.93.80.189:80']

c = Handler_connections(LST_PROXY, 1, 'https://ident.me/', '142.93.80')
c.STOP = False
c.DEBUG = True
c.open_connection()
if not c.set_proxy():
	lg_prt(1, 'Could not connect to a proxy.')
	c.close_conecction()

page, status_code = c.get_page('GET', 'https://ident.me/')
lg_prt(3, 'Handler_connections')
lg_prt(2, page.text, status_code)
c.close_conecction()

'''

# ---------------------------------------- FIN

# ---------------------------------------- DATABASE.PY

'''
COUNTRY = 'es'
MY_SEX = 0
# Crear el manejador de BBDD
db = Handler_SQL()
# Crear una conexión con la base de datos
db.create_SQL_Connection(COUNTRY)
lg_prt(3, 'create_SQL_Connection')
lg_prt(2, db.giveme_account(MY_SEX))
db.close_SQL_Connection()
'''
# ---------------------------------------- FIN

'''

# -------------------------------------  PRUEBA DE isDir o file

report_date = str(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))

db = handler_SQL('movieDB')
utils.db = db

fullPath = '/mnt/hgfs/movies/Acción/Desterrado [HDRip] (2014).avi'
if os.path.isdir(fullPath): 							# Si es un directorio
	# Si el hash no está en la base de datos recorrer el directorio, sino nada
	if not db.is_hash_inbd(fullPath, os.path.getctime(fullPath), report_date):
		print('walkFolders(fullPath')
	else: print(f'No changes found in {fullPath}')
else:
	print('Era un archivo')


fullPath = '/mnt/hgfs/movies/Acción/'
if os.path.isdir(fullPath): 							# Si es un directorio
	# Si el hash no está en la base de datos recorrer el directorio, sino nada
	if not db.is_hash_inbd(fullPath, os.path.getctime(fullPath), report_date): 
		print('walkFolders(fullPath')
	else: print(f'No changes found in {fullPath}')
else:
	print('Era un archivo')

del db

'''


# -------------------------------------  PRUEBA DE DIBUJO

db = handler_SQL('movieDB')


'''
try:
	rows = db.get_report_rows('report_bd_01')
	listRows = list(zip(*rows))
	format_date = tuple(map(date_to_human, listRows[0]))
	plt.rc('xtick',labelsize=7)
	plt.plot(format_date, listRows[1], color='#30a2da', linewidth=2.0)
	plt.title('Conteo de películas por fecha de reporte')
	plt.xlabel('Fecha de reporte')
	plt.ylabel('Número de películas')
	plt.gcf().autofmt_xdate()
	plt.rcParams['axes.facecolor'] = '#ffffff'
	plt.rcParams['savefig.facecolor'] = '#f8f9f9'
	plt.savefig('reports/test_plot1.png', bbox_inches='tight')
except Exception as e: 
	lg_prt(1, 'Error Drawing plot1:', f'{e}')

try:
	plt.clf()
	values = tuple(map(lambda x:round(x/1024/1024/1024, 2), listRows[2]))
	plt.rc('xtick',labelsize=7)
	plt.plot(format_date, values, color='#30a2da', linewidth=2.0)
	plt.title('Tamaño de la carpeta "Películas" por fecha del reporte')
	plt.xlabel('Fecha de reporte')
	plt.ylabel('Tamaño en Gigabytes')
	plt.gcf().autofmt_xdate()
	plt.rcParams['axes.facecolor'] = '#ffffff'
	plt.rcParams['savefig.facecolor'] = '#f8f9f9'
	plt.savefig('reports/test_plot2.png', bbox_inches='tight')
except Exception as e: 
	lg_prt(1, 'Error Drawing plot2:', f'{e}')



try:
	plt.clf()
	plt.figure(figsize=(20,20))
	rows = db.get_report_rows('report_bd_02')
	listRows = list(zip(*rows))
	labels = tuple(map(lambda x:x.capitalize(), listRows[0]))
	sizes = tuple(map(lambda x:0 if x is None else x, listRows[1]))
	plt.rc('xtick',labelsize=6)
	fig, ax = plt.subplots()
	plt.title('Porcentaje de películas por género')
	ax.pie(sizes, labels=labels, autopct='%1.1f%%', shadow=True, startangle=90)
	ax.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
	plt.rcParams['axes.facecolor'] = '#ffffff'
	plt.rcParams['savefig.facecolor'] = '#f8f9f9'
	plt.savefig('reports/test_plot3.png', bbox_inches='tight')
except Exception as e: 
	lg_prt(1, 'Error Drawing plot3:', f'{e}')

try:
	plt.clf()
	plt.figure(figsize=(20,10))
	rows = db.get_report_rows('report_bd_03')
	listRows = list(zip(*rows))
	x_pos = [i for i, _ in enumerate(listRows[1])]
	plt.rc('xtick',labelsize=7)
	plt.bar(x_pos, listRows[0], color='#30a2da')
	plt.xlabel("Año de estreno")
	plt.ylabel("Número de películas")
	plt.title('Número de películas por año de estreno')
	plt.gcf().autofmt_xdate()
	plt.xticks(x_pos, listRows[1])
	plt.savefig('reports/test_plot4.png', bbox_inches='tight')
except Exception as e: 
	lg_prt(1, 'Error Drawing plot4:', f'{e}')

'''

try:
	plt.clf()
	plt.figure(figsize=(20,10))
	rows = db.get_report_rows('report_bd_04')
	listRows = list(zip(*rows))
	x_pos = [i for i, _ in enumerate(listRows[1])]
	plt.rc('xtick',labelsize=7)
	plt.bar(x_pos, listRows[0], color='#30a2da')
	plt.xlabel("País")
	plt.ylabel("Número de películas")
	plt.title('Número de películas por país')
	plt.gcf().autofmt_xdate()
	plt.xticks(x_pos, listRows[1])
	plt.savefig('reports/test_plot5.png', bbox_inches='tight')
except Exception as e: 
	lg_prt(1, 'Error Drawing plot5:', f'{e}')

try:
	plt.clf()
	rows = db.get_report_rows('report_bd_05')
	listRows = list(zip(*rows))
	plt.rc('xtick',labelsize=9)
	plt.scatter(listRows[0], listRows[1])
	plt.xlabel("Número de películas")
	plt.ylabel("Valoración")
	plt.title('Número de películas por país')
	plt.title('Valoraciones de películas')
	plt.gcf().autofmt_xdate()
	plt.savefig('reports/test_plot6.png', bbox_inches='tight')
except Exception as e: 
	lg_prt(1, 'Error Drawing plot6:', f'{e}')


del db