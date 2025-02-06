#!/usr/bin/python3
'''
# Filename: server.py
# Version: 1.0
# By: CSUBIRES <j3xuz_cobmetal88@hotmail.com>
# Created: 2024/08/12 12:03:35 by CSUBIRES
# Updated: 2025/02/06 08:08:36 by CSUBIRES
# Description: server
'''

import os
import sys

from www.controller import app as application
from config.server_config import set_config

if __name__ == '__main__':
	print('Executing in:', os.getcwd())
	# export FLASK_ENV=development
	mode_obj = set_config(os.environ.get('FLASK_ENV', 'default'))
	application.config.from_object(mode_obj)
	application.run(mode_obj.FLASK_RUN_HOST, mode_obj.FLASK_RUN_PORT)
