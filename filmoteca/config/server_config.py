from secrets import token_urlsafe

IMAGES_FOLDER = 'images/'                   # Covers
RESOURCES_CSS = 'static/css/img/'           # Web assets
LOGGING = False


class Config(object):
    TESTING = False
    DEBUG = False
    SECRET_KEY = 'secret'
    SESSION_COOKIE_NAME = 'private'
    SESSION_COOKIE_SAMESITE = 'Lax'
    MAX_CONTENT_LENGTH = 5 * 1000 * 1000		# Archivos maximo 5MB
    SESSION_COOKIE_SECURE = False               # Cambiar si se usa HTTPS


class ProductionConfig(Config):
    FLASK_RUN_HOST = "0.0.0.0"
    FLASK_RUN_PORT = 8080
    SECRET_KEY = token_urlsafe(32)
    LOGGING = True
    FLASK_ENV = 'production'
    SESSION_COOKIE_SAMESITE = 'Strict'


class DevelopmentConfig(Config):
    global LOGGING
    DEBUG = True
    TESTING = True
    LOGGING = True
    FLASK_ENV = 'development'


class TestingConfig(Config):
    TESTING = True
    LOGGING = False
