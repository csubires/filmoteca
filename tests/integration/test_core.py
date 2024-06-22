
import os
import re							# Usar expresiones regulares para extraer información de un texto
from modules.utils import lg_prt, datetime_now
from modules.auxiliary import timestamp2Date


base_dir = '/mnt/hgfs/movies/'
report_date = datetime_now()

def path_file_splits(fullPath, fileName):
	''' Trocea el path de un archivo para extraer información de nombre, calidad, etc
		Args: 
			fullPath (str):		/mnt/hgfs/movies/genero/subgenero/El renacido [HDRip] (2015).avi
			fileName (str):		El renacido [HDRip] (2015).avi
	'''
	title=quality=year=genre=subgenre=path_genre = None
	
	fileName, _ = os.path.splitext(fileName)				# 'filename.extension' -> 'filename', 'extension'
	# auxfullPath = os.path.dirname(fullPath)					# '/root/algo/filename' -> '/root/algo'

	try:
		title = fileName.split('[', 1)[0].split('(', 1)[0].split('.', 1)[0].strip()
		r = re.search(r"\[([A-Za-z0-9_]+)\]", fileName)		# Obtener lo que esta entre corchetes []
		quality = r.group(1).strip() if r else None
		r = re.search(r"\(([A-Za-z0-9_]+)\)", fileName)		# Obtener lo que esta entre paréntesis ())
		year = r.group(1) if r else None

		path_genre = os.path.dirname('genero/subgenero/El renacido [HDRip] (2015).avi')			# genero/subgenero
		path_split = path_genre.split('/')
		genre = path_split[0].strip().lower() or None
		subgenre = path_split[-1].strip().lower() if len(path_split)>1 else None	

	except Exception as e:
		lg_prt('ryr', '[✖] Error in path_file_splits()', fullPath, e)
		if DEBUG_MODE:
			lg_prt('999', 'path_file_splits', f'{fullPath}, {title}, {quality}, {year}, {extension}, {genre}, {subgenre}, {created}, {path_genre}')

	finally:
		data_movie = {
			'title': title, 
			'year': year, 
			'quality': quality, 
			'genre': genre,
			'subgenre': subgenre,
			'path_genre': path_genre
		}

		return data_movie




a_film = '/mnt/hgfs/movies/genero/subgenero/El renacido [HDRip] (2015).avi'

result = path_file_splits(a_film, 'El renacido [HDRip] (2015).avi')

for key, value in result.items():
    lg_prt('yw', key, value)




a_film = '/mnt/hgfs/movies/genero/El renacido.avi'

result = path_file_splits(a_film, 'El renacido.avi')

for key, value in result.items():
    lg_prt('yw', key, value)








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