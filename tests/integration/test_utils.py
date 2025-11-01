#!/usr/bin python
# -*- coding: utf-8 -*-

##import sys
##sys.path.append("..")

from datetime import datetime

import utils as utils

import matplotlib.pyplot as plt
from utils import (lg_prt, bytes_to_human, seconds_to_time, date_to_human, URL_BASE, URL_PICT)




from database import handler_SQL
from connection import Handler_connections
import os 							# Recorrer carpetas

'''

# -------------------------------------  PRUEBA DE path_file_splits()

a_film = '/mnt/hgfs/movies/genero/subgenero/El renacido [HDRip] (2015).avi'
print(a_film)
title, quality, year, extension, genre, subgenre = path_file_splits(a_film)
print('TODO ESTO ->', title, quality, year, extension, genre,  subgenre)

a_film = '/mnt/hgfs/movies/genero/El renacido [HDRip] (2015).avi'
print(a_film)
title, quality, year, extension, genre, subgenre = path_file_splits(a_film)
print('TODO ESTO 2 ->', title, quality, year, extension, genre,  subgenre)

a_film = '/mnt/hgfs/movies/genero/El renacido (2015).avi'
print(a_film)
title, quality, year, extension, genre, subgenre = path_file_splits(a_film)
print('TODO ESTO 3 ->', title, quality, year, extension, genre,  subgenre)

a_film = '/mnt/hgfs/movies/genero/El renacido.avi'
print(a_film)
title, quality, year, extension, genre, subgenre = path_file_splits(a_film)
print('TODO ESTO 4 ->', title, quality, year, extension, genre,  subgenre)

a_film = '/mnt/hgfs/movies/genero/El renacido [HDRip].avi'
print(a_film)
title, quality, year, extension, genre, subgenre = path_file_splits(a_film)
print('TODO ESTO 5 ->', title, quality, year, extension, genre,  subgenre)

a_film = '/mnt/hgfs/movies/El renacido [HDRip].avi'
print(a_film)
title, quality, year, extension, genre, subgenre = path_file_splits(a_film)
print('TODO ESTO 5 ->', title, quality, year, extension, genre,  subgenre)

'''
'''

# -------------------------------------  PRUEBA DE NEO path_file_splits()

a_film = '/mnt/hgfs/movies/Acción/Desterrado [HDRip] (2014).avi'
print(a_film)
title, quality, year, extension, size, created, genre, subgenre, path_genre = utils.path_file_splits(a_film)
print('TODO ESTO 5 ->', title, quality, year, extension, size, created, genre, subgenre, ' -> ' ,path_genre)

a_film = '/mnt/hgfs/movies/Ciencia ficción/Star Wars/Han Solo - Una historia de Star Wars [HDRip] (2018).avi'
print(a_film)
title, quality, year, extension, size, created, genre, subgenre, path_genre = utils.path_file_splits(a_film)
print('TODO ESTO 6 ->', title, quality, year, extension, size, created, genre, subgenre, ' -> ', path_genre)
'''

'''
# -------------------------------------  PRUEBA DE get varios()

print(date_to_human('2020-10-23 21:34:23'))
print(time_to_seconds('02:05:12'))
print(seconds_to_time(7512))
print(bytes_to_human(14272717))
print(filecreate_to_date('/mnt/hgfs/movies/Acción/Desterrado [HDRip] (2014).avi'))'''
#print(utils.seconds_to_time(8688))
#print(utils.bytes_to_human(2503012352))
'''

# -------------------------------------  PRUEBA DE get_filemetadata()

duration, resolution, fps = get_filemetadata('/mnt/hgfs/movies/Acción/Desterrado [HDRip] (2014).avi')
print(duration, resolution, fps)
print(seconds_to_time(duration))

'''

# -------------------------------------  PRUEBA DE get_InetInfo()

'''

LST_PROXY = []
URL_BASE = 'https://www.filmaffinity.com'

c = Handler_connections(1)

utils.c = c
posible_url, realtitle, country, ratings, urlpicture = utils.get_InetInfo('Desterrado', 'acción', '2014')
print(posible_url, realtitle, country, ratings, urlpicture)

posible_url, realtitle, country, ratings, urlpicture = utils.get_InetInfo('Matrix', 'acción', '2019')
print(posible_url, realtitle, country, ratings, urlpicture)

del c

'''

# -------------------------------------  PRUEBA DE processFile(fullPath)

'''

c = Handler_connections(1)
utils.c = c

db = handler_SQL('movieDB')
utils.db = db

#print(utils.db.get_or_insert_genre('acción', 0, 'asdasdlsd'))

report_date = str(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
utils.report_date = report_date

#data_movie = utils.processFile('/mnt/hgfs/movies/Acción/Desterrado [HDRip] (2014).avi')
#print(data_movie)

data_movie = utils.process_file('/mnt/hgfs/movies/Ciencia ficción/Star Wars/Star Wars - Los últimos Jedi [BRRip] (2017).avi')
print(data_movie)


del db
del c

'''

'''

# -------------------------------------  PRUEBA DE donwload_img

c = Handler_connections(1)
utils.c = c

utils.donwload_img('/star_wars_the_last_jedi-535293064-mmed.jpg', 14)

del c

'''

'''
# -------------------------------------  PRUEBA DE path_file_splits


a_film = '/mnt/hgfs/movies/Acción/John Wick/John Wick - Otro día para matar [DVDRip] (2014).avi'

print(a_film)
title, quality, year, extension, size, created, genre, subgenre, path_genre = utils.path_file_splits(a_film)
print('TODO ESTO ->', title, quality, year, extension, size, created, genre, subgenre, path_genre)

'''


#  ------------------------------------------- PRUEBA de graficos

# Crear el manejador de BBDD
db = handler_SQL('movieDB')

try:
	plt.clf()
	rows = db.get_report_rows('report_bd_05')
	listRows = list(zip(*rows))
	plt.rc('xtick',labelsize=9)
	plt.rc('ytick',labelsize=9)
	plt.scatter(listRows[0], listRows[1])
	plt.xlabel("Número de películas")
	plt.ylabel("Valoración")
	plt.title('Valoraciones de películas')
	plt.gcf().autofmt_xdate()
	plt.savefig('reports/plot6.png', bbox_inches='tight')
except Exception as e: 
	pass


del db


