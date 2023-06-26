from flask import request, render_template
from flask.helpers import flash

from www.controller import app
from modules.utils import lg_prt

from config.server_config import LOGGING


@app.errorhandler(400)
def page_not_found400(error):
	# 400 Bad Request
	LOGGING and lg_prt('999', 400, f'{request.remote_addr} [DANGER] {request.full_path} {error}')
	flash('Modificación detectada', 'danger')
	return render_template('notfound.html', error='Modificación detectada'), 400


@app.errorhandler(404)
def page_not_found404(error):
	# 404 Not Found
	# lg_prt('999', '404', f'{error}')
	LOGGING and lg_prt('999', 404, f'{request.remote_addr} [INFO] {request.full_path} {error}')
	flash('Página no encontrada', 'info')
	return render_template('notfound.html'), 404


@app.errorhandler(401)
def page_not_found401(error):
	# 401 Unauthorized   remote_addr  user_agent
	LOGGING and lg_prt('999', 401, f'{request.remote_addr} [DANGER] {request.full_path} {error}\n{request.user_agent}')
	flash('Página no encontrada', 'info')
	return render_template('honey.html'), 401


@app.errorhandler(405)
def page_not_found405(error):
	# 405 Method Not Allowed
	LOGGING and lg_prt('999', 405, f'{request.remote_addr} [DANGER] {request.full_path} {error}\n{request.user_agent}')
	flash('Página no encontrada', 'info')
	return render_template('honey.html'), 405


@app.errorhandler(500)
def page_not_found500(error):
	# 500 Internal Server Error
	LOGGING and lg_prt('999', 500, f'{request.remote_addr} [WARNING] {request.full_path} {error}')
	flash('Lo sentimos. Ocurrió algo inesperado', 'danger')
	return render_template('notfound.html'), 500
