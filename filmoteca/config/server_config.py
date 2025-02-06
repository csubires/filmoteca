from secrets import token_urlsafe

IMAGES_FOLDER = 'images/'				   # Covers
RESOURCES_CSS = 'static/css/img/'		   # Web assets
LOGGING = False

class Config(object):
	FLASK_APP='filmoteca'
	TESTING = False
	DEBUG = False
	FLASK_RUN_HOST = '0.0.0.0'
	SECRET_KEY = 'secret@key'
	SESSION_COOKIE_NAME = 'private'
	SESSION_COOKIE_SAMESITE = 'Lax'
	MAX_CONTENT_LENGTH = 5 * 1000 * 1000		# Archivos maximo 5MB
	SESSION_COOKIE_SECURE = False				# Cambiar si se usa HTTPS


class ProductionConfig(Config):
	SESSION_TYPE = 'memcached'
	FLASK_RUN_PORT = 8080
	SECRET_KEY = token_urlsafe(32)
	SEND_FILE_MAX_AGE_DEFAULT = 3600
	LOGGING = True
	FLASK_ENV = 'production'
	SESSION_COOKIE_SAMESITE = 'Strict'


class DevelopmentConfig(Config):
	global LOGGING
	DEBUG = True
	FLASK_RUN_PORT = 3030
	TESTING = True
	LOGGING = True
	FLASK_ENV = 'development'


class TestingConfig(Config):
	TESTING = True
	LOGGING = False

def set_config(mode):
	configurations = {
		'default': ProductionConfig,
		'development': DevelopmentConfig,
		'production': ProductionConfig,
		'testing': TestingConfig
	}
	print('Executing in mode', configurations[mode])
	return configurations[mode]
