#!/usr/bin/python3
# 2023.11.27
# python3 scripts/fill_subgenres.py

'''
	Este script sirve para recontar las películas de subgéneros (carpetas dentro de géneros), ya que
    por alguna razón no se han contabilizado en el pasado.
    Si se vuelve a encontrar un subgénero con 0 películas borrarlo o marcarlo como error a reparar.

	
	ANTES EJECUTAR:

UPDATE genre SET num_movies = (SELECT COUNT(*) FROM movies WHERE (movies.id_genre = genre.id_genre OR movies.id_subgenre = genre.id_genre)), local_size = (SELECT SUM(size) FROM movies WHERE (movies.id_genre = genre.id_genre OR movies.id_subgenre = genre.id_genre)), local_duration = (SELECT SUM(duration) FROM movies WHERE (movies.id_genre = genre.id_genre OR movies.id_subgenre = genre.id_genre)) WHERE is_subgenre = 1

	Y ELIMINAR LOS SUBGÉNEROS QUE QUEDEN A 0 AL TERMINAR
	

'''

from modules.database import HandlerSQL					# Manejador de la base de datos
from config.queries_database import TAG_QUERY
from modules.utils import lg_prt						# Mostrar y Colorear texto en consola

from modules.auxiliary import seconds_to_time, bytes_to_human


oDTB = HandlerSQL('data/movieDB.db', TAG_QUERY) 

# Actualizar STR de géneros
rows = oDTB.execute('get_all_genre')
for row in rows:
	params_genre = {
		'id_genre': row[0],
		'local_size_str': bytes_to_human(row[4]) if row[4] is not None else None,
		'local_duration_str': seconds_to_time(row[6]) if row[6] is not None else None,
	}
	oDTB.execute('update_str_genre', params_genre)
lg_prt('bw', 'Update STR statistics of genre', params_genre)

del oDTB
