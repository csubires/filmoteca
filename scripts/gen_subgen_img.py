#!/usr/bin/python3
# 2023.11.27
# python3 scripts/gen_subgen_img.py

'''
	Script para generar una carátula de un género mediante un collage de las películas que contiene
'''

import os 												# Para saber si existe una carpeta
import random 											# Pequeño descanso aleatorio entre peticiones web
from PIL import Image

from filmoteca.modules.database import HandlerSQL					# Manejador de la base de datos
from filmoteca.config.queries_database import TAG_QUERY
from filmoteca.modules.utils import lg_prt						# Mostrar y Colorear texto en consola

GENRE_PATH = 'filmoteca/www/images/genres/'
COVER_PATH = 'filmoteca/www/images/covers/'


def gen_image(id_genre, new_file):
	cover_path_genre = COVER_PATH + str(id_genre)

	# 3 - Comprobar si existe la carpeta cover para ese género
	if os.path.exists(cover_path_genre):
		_, _, files = next(os.walk(cover_path_genre))
		imgLen = len(files)
		if imgLen == 0: return 0

		# 4 - Elegir 10 imagenes aleatoriamente
		images_selected = []
		count = 0

		if imgLen < 11:
			images_selected = files
		else:
			while count < 10:
				rint = random.randint(0, imgLen-1)
				images_selected.append(files.pop(rint))
				count+=1
				imgLen-=1

		lg_prt('wc', images_selected, len(images_selected))

		# 5 - Generar imagen
		collage = Image.new("RGB", (500,200), color=(255,255,255,255))

		c=0
		imgLen = len(images_selected)
		for i in range(0,500,100):
			for j in range(0,200,100):
				file = images_selected[c%imgLen]
				photo = Image.open(f'{cover_path_genre}/{file}')
				photo = photo.resize((100,100))		
				collage.paste(photo, (i,j))
				c+=1

		# collage.show(title='ok')
		# collage.save(f'scripts/prueba/{id_genre}.png')
		collage.save(f'{GENRE_PATH}{id_genre}.jpg')


# 1 - Obtener lista de géneros y subgéneros
oDTB = HandlerSQL('filmoteca/data/movieDB.db', TAG_QUERY) 

rows = oDTB.execute('get_all_genre')
for row in rows:
	id_genre = row[0]
	file_path = GENRE_PATH + str(id_genre) + '.jpg'
	# 2 - Comprobar si existe caratula para ese género o sub
	if not os.path.isfile(file_path):
		lg_prt('yryv', '[▲]', row[1], 'no tiene caratula', file_path)
		gen_image(id_genre, file_path)

del oDTB

