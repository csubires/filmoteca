import re							# Para usar expresiones regulares
import secrets
from functools import wraps

from flask import Response, session
from flask.helpers import flash, url_for
from werkzeug.utils import redirect

from server.controller import session
from config.global_constant import ALLOWED_EXTENSIONS


def role_required(role, session):
	# Para dar permisos de acceso según el rol del usuario
	def requires_access_level(f):
		@wraps(f)
		def secure_function(*args, **kws):
			try:
				if not session['auth'] or session['role'] != role:
					flash('Código de error desconocido. Ponte en contacto con el administrador.', 'danger')
					return redirect(url_for('login'), 301)
			except Exception:
				return Response(status=500)
			return f(*args, **kws)
		return secure_function
	return requires_access_level

def set_csrf_token(tag, session):
	# Establecer un token csrf para la seguridad en los formularios
	session.update({tag: ''})
	session[tag] = secrets.token_urlsafe(32)
	return session[tag]

def check_csrf_token(tag, session, csrf_token):
	# Comprobar que el token es válido
	# session.update({tag: ''})
	print(tag, '  ', session[tag],'  ', csrf_token)
	return session[tag] == csrf_token

def htmlFilterChars(text):
	if text == '':
		return None
	else:
		return (
			text.replace('&', 'y').
			replace('\\', '').
			replace('<', '').
			replace('>', ''))

def isValidEmail(email):
	regex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
	return email if re.fullmatch(regex, email) else None

# Comprobar que es número
def isValidNumber(number):
	return int(number) if number.isdigit() else None

# Para comprobar que una contraseña tenga un mínimo de caractéres
min_len = lambda min, str: len(str) >= min

# Código de país a icono de bandera unicode
flag = lambda code: ''.join([chr(127397 + ord(x)) for x in code.upper()])

# Extensiones permitidas para mostrar
def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
