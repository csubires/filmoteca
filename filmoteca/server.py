#!/usr/bin/python3
from www.controller import app as application
from config.server_config import DevelopmentConfig

if __name__ == '__main__':
	# import os
	# print(os.getcwd())
	application.config.from_object(DevelopmentConfig())
	# application.config.from_pyfile('../config/server_config.py')
	application.run()
