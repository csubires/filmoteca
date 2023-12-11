#!/usr/bin/python3
# 2023.3.17
# Execute: cd template
# python3 -m unittest tests.unit.core
# python3 -m unittest tests.unit.core.TestScan.test010_validate

import unittest
# Ejecutar text en el orden en el que se escriben
# unittest.TestLoader.sortTestMethodsUsing = lambda *args: -1

from filmoteca.modules.analyser import path_file_splits, get_fileMetaData, get_real_path_size


class TestScan(unittest.TestCase):
	
	def test000_create(self):
		pass

	def test010_valid_file_splits(self):
		# Probar trozeo válido
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 [HDRip] (2014).avi'
		path_file = 'Supervivencia/Los juegos del hambre - Sinsajo Parte 1 [HDRip] (2014).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 ',
				'year': '2014',
				'quality': 'HDRip',
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar trozeo válido con subgénero
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 [HDRip] (2014).avi'
		path_file = 'Supervivencia/Juegos del hambre/Los juegos del hambre - Sinsajo Parte 1 [HDRip] (2014).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 ',
				'year': '2014',
				'quality': 'HDRip',
				'genre': 'Supervivencia',
				'subgenre': 'Juegos del hambre',
				'path_genre': 'Supervivencia/Juegos del hambre'
			}
		self.assertEqual(result, good_result)
		# Probar trozeo válido sin cualidad
		file_name = 'Los juegos del hambre - En llamas (2013).avi'
		path_file = 'Supervivencia/Los juegos del hambre - En llamas (2013).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - En llamas ',
				'year': '2013',
				'quality': None,
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar trozeo con nombre CD1
		file_name = 'Apocalypse Now - CD1 [DVDRip] (1979).avi'
		path_file = 'Bélico/Apocalypse Now/Apocalypse Now - CD1 [DVDRip] (1979).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Apocalypse Now - CD1 ',
				'year': '1979',
				'quality': 'DVDRip',
				'genre': 'Bélico',
				'subgenre': 'Apocalypse Now',
				'path_genre': 'Bélico/Apocalypse Now'
			}
		self.assertEqual(result, good_result)
	def test020_invalid_file_splits(self):
		# Probar trozeo no válido al que le falta año
		file_name = 'Los juegos del hambre - En llamas.avi'
		path_file = 'Supervivencia/Los juegos del hambre - En llamas.avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - En llamas',
				'year': None,
				'quality': None,
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar error en trozeo con calidad mal
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 HDRip] (2014).avi'
		path_file = 'Supervivencia/Los juegos del hambre - Sinsajo Parte 1 HDRip] (2014).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 HDRip] ',
				'year': '2014',
				'quality': None,
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar error en trozeo con calidad mal
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 [HDRip (2014).avi'
		path_file = 'Supervivencia/Los juegos del hambre - Sinsajo Parte 1 [HDRip (2014).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 ',
				'year': '2014',
				'quality': None,
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)

		# Probar error en trozeo con año mal		
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 [HDRip] 2014).avi'
		path_file = 'Supervivencia/Los juegos del hambre - Sinsajo Parte 1 [HDRip] 2014).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 ',
				'year': None,
				'quality': 'HDRip',
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar error en trozeo con año mal		
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 [HDRip] (s2014).avi'
		path_file = 'Supervivencia/Los juegos del hambre - Sinsajo Parte 1 [HDRip] (s2014).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 ',
				'year': 's2014',
				'quality': 'HDRip',
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar error en trozeo con año mal		
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 [HDRip] (24014).avi'
		path_file = 'Supervivencia/Los juegos del hambre - Sinsajo Parte 1 [HDRip] (24014).avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 ',
				'year': '24014',
				'quality': 'HDRip',
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar error en trozeo con año mal		
		file_name = 'Los juegos del hambre - Sinsajo Parte 1 [HDRip] 24414.avi'
		path_file = 'Supervivencia/Los juegos del hambre - Sinsajo Parte 1 [HDRip] 24414.avi'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': 'Los juegos del hambre - Sinsajo Parte 1 ',
				'year': None,
				'quality': 'HDRip',
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
		# Probar error en trozeo con nombre mal		
		file_name = '(Los /juegos del hambre - Sinsajo Parte 1 [HDRip] 2000.avias'
		path_file = 'Supervivencia/(Los ,[juegos del hambre - Sinsajo Parte 1 [HDRip] 2000.avias'
		result = path_file_splits(path_file, file_name)
		good_result = {
				'title': None,
				'year': None,
				'quality': 'HDRip',
				'genre': 'Supervivencia',
				'subgenre': None,
				'path_genre': 'Supervivencia'
			}
		self.assertEqual(result, good_result)
	
	def test020_get_fileMetaData(self):
		# Obtener metadatos de un archivo de video
		full_path = '/mnt/hgfs/movies/Supervivencia/Los juegos del hambre - En llamas (2013).avi'
		duration, resolution, fps = get_fileMetaData(full_path)
		self.assertEqual(duration, 8774)
		self.assertEqual(resolution, '720x400')
		self.assertEqual(fps, 23.98)
		# Fallo al obtener metadatos de un archivo de video
		full_path = '/mnt/hgfs/movies/Supervivencia/Los juegos013).avi'
		duration, resolution, fps = get_fileMetaData(full_path)
		self.assertIsNone(duration)
		self.assertIsNone(resolution)
		self.assertIsNone(fps)

	def test020_get_real_path_size(self):
		# Obtener el tamaño real de una carpeta
		full_path = '/mnt/hgfs/movies/Supervivencia'
		result = get_real_path_size(full_path)
		self.assertEqual(result, '7,8G')
		# Fallo al obtener el tamaño real de una carpeta
		full_path = '/mnt/hgfs/movies/Superv'
		result = get_real_path_size(full_path)
		self.assertEqual(result, '0 MB')

if __name__ == '__main__':
	unittest.main()