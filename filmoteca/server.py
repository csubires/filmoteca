#!/usr/bin/python3
'''
# Filename: server.py
# Version: 1.0
# By: CSUBIRES <j3xuz_cobmetal88@hotmail.com>
# Created: 2024/08/12 12:03:35 by CSUBIRES
# Updated: 2024/08/12 12:03:35 by CSUBIRES
# Description: server
'''

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
