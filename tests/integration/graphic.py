#!/usr/bin/python3
# 2023.3.17
# Execute: cd template
# python3 -m unittest tests.integration.graphic
# python3 -m unittest tests.integration.graphic.TestChart.test000_create

import unittest
# Ejecutar text en el orden en el que se escriben
# unittest.TestLoader.sortTestMethodsUsing = lambda *args: -1


from modules.database import HandlerSQL
from www.graphic import draw_graphic

from config.global_constant import DB_FILE
from config.queries_database import TAG_QUERY_REPORT

class TestChart(unittest.TestCase):

	def test000_create(self):
		oDTB = HandlerSQL(DB_FILE, TAG_QUERY_REPORT)
		result = draw_graphic(oDTB)
		self.assertTrue(result)

if __name__ == '__main__':
	unittest.main()