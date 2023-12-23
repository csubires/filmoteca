#!/usr/bin/python3
import sys

from www.controller import app as application
from config.server_config import DevelopmentConfig, ProductionConfig, TestingConfig

if __name__ == '__main__':

	mode = 'default'
	if sys.argv[1:]:
		mode = sys.argv[1]				# Opción

	configurations = {
		'default': ProductionConfig,
		'development': DevelopmentConfig,
		'production': ProductionConfig,
		'testing': TestingConfig
	}

	# import os
	# print(os.getcwd())
	print('Executing in mode', configurations[mode])
	application.config.from_object(configurations[mode])
	application.run()
