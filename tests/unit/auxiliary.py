#!/usr/bin/python3
# 2023.11.27
# Execute: cd template
# python3 -m unittest tests.unit.auxiliary
# python3 -m unittest tests.unit.auxiliary.TestScan.test010_validate

import unittest
# Ejecutar text en el orden en el que se escriben
# unittest.TestLoader.sortTestMethodsUsing = lambda *args: -1

from filmoteca.modules.auxiliary import *


class TestScan(unittest.TestCase):
	
	def test000_create(self):
		pass

	def test010_timestamp_to_datetime(self):
		result = timestamp_to_datetime(1651855905)
		self.assertEqual(result, '06/05/2022, 18:51:45')

	def test011_timestamp2Date(self):
		result = timestamp2Date(1651855905)
		self.assertEqual(result, '2022-05-06')

	def test012_date_to_human(self):
		result = date_to_human('2020-10-23 21:34:23')
		self.assertEqual(result, '23 de October de 2020')

	def test013_time_to_seconds(self):
		result = time_to_seconds('02:05:12')
		self.assertEqual(result, 7512)

	def test014_seconds_to_time(self):
		result = seconds_to_time(7512)
		self.assertEqual(result, '2hr, 5min, 12seg')

	def test015_bytes_to_human(self):
		result = bytes_to_human(14272717)
		self.assertEqual(result, '13.61 MB')

	# ---- Pruebas


if __name__ == '__main__':
	unittest.main()