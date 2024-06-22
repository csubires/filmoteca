# 2022-06-29
import re							# Para usar expresiones regulares

from config.global_constant import ALLOWED_EXTENSIONS


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
