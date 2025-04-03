'''
# Filename: controller.py
# Version: 1.0
# By: CSUBIRES <j3xuz_cobmetal88@hotmail.com>
# Created: 2024/08/12 12:04:39 by CSUBIRES
# Updated: 2025/03/15 10:45:21 by CSUBIRES
# Description: controller
'''

import os
import json
from datetime			import timedelta

from flask				import request, jsonify, render_template, Response, session, send_from_directory, abort
from flask.helpers		import flash, url_for
from werkzeug.utils		import redirect

from modules.utils		import lg_prt, dt_format			# Mostrar y Colorear texto en consola
from server.service		import HandlerService
from server.security	import role_required, allowed_file, set_csrf_token, check_csrf_token

def register_routes(app):
	oSRVC = HandlerService()

	@app.before_request
	def make_session_permanent():
		# Para renovar la sesión cada 60 minutos
		session.permanent = False
		app.permanent_session_lifetime = timedelta(minutes=60)

	@app.route('/static/<path:filename>')
	def static_files(filename):
		return send_from_directory('static', filename, cache_timeout=3600)

	@app.route('/')
	def index():
		# Página principal
		set_csrf_token('csrf_token_form', session)
		return render_template('index.html', title='Gestor de Películas')

	@app.route('/auth/login', methods=['GET', 'POST'])
	def login():
		# Acceso como administrador
		if request.method == 'GET':
			set_csrf_token('csrf_token_form', session)
			return render_template('auth/login.html', title='Iniciar sessión')

		elif request.method == 'POST':
			if not check_csrf_token('csrf_token_form', session, request.form['csrf_token_form']):
				abort(401, 'Altered csrf_token_form login()')

			try:
				email = request.form['email'].strip()
				result = oSRVC.validate_user(request.form['email'].strip(), request.form['password'])
				if result[0] is True:
					session['email'] = email
					session['auth'] = 1
					session['role'] = result[1]
					return redirect(url_for('index'), 301)
				elif result[0] is False:
					flash('Email o contraseña no válida', 'danger')
					return render_template('auth/login.html')
				else:
					flash(result[0], result[1])
					return render_template('auth/login.html')

			except Exception as e:
				lg_prt('ryv', 'Error in login()', e, request.form)
				abort(401, 'Possible modification of the login form')

	@app.route('/auth/signup', methods=['GET', 'POST'])
	def signup():
		# Registrar cuenta
		if request.method == 'GET':
			set_csrf_token('csrf_token_form', session)
			return render_template('auth/signup.html', title='Crear cuenta')

		elif request.method == 'POST':
			try:
				if not check_csrf_token('csrf_token_form', session, request.form['csrf_token_form']):
					abort(401, 'Altered csrf_token_form login()')
				name = request.form['name']
				email = request.form['email']
				password = request.form['password']
				repeat = password == request.form['repeat_password']
				agent = request.headers.get('User-Agent')
				ip = request.remote_addr
				date = dt_format('symdhms')
				result = oSRVC.validate_signup(name, email, password, repeat, ip, agent, date)
				flash(result[0], result[1])
				return redirect(url_for('index'), 301)

			except Exception as e:
				lg_prt('ryv', 'Error in login()', e, request.form)
				abort(401, 'Possible modification of the login form')

	@app.route('/auth/logout')
	def logout():
		# Para salir de la sesión
		session.clear()
		flash('Sesión cerrada', 'info')
		return redirect(url_for('index'), 301)

	# ----------------------------------------------------------------

	@app.route('/view/<int:index>', methods=['GET'])
	@app.route('/view', methods=['POST'])
	def view_template(index=None):
		# Obtener listados de películas
		if request.method == 'GET':
			set_csrf_token('csrf_token_form', session)
			set_csrf_token('csrf_token_movie', session)
			title, render_page, data = oSRVC.list_of_films(index)
			if data is None:
				flash('No se pudo obtener el listado de películas', 'danger')
		# Buscar películas sin JavaScript
		elif request.method == 'POST':
			if not check_csrf_token('csrf_token_form', session, request.form['csrf_token_form']):
				abort(401, 'Altered csrf_token_form view_template()')
			title, render_page, data = oSRVC.searchAMovie(request.form['search'])
			if data is None:
				flash('Sin resultados en la busqueda', 'warning')
		return render_template(render_page, title=title, response=data)

	@app.route('/menu/<string:menu>/<int:year>', methods=['GET'])
	@app.route('/menu/<string:menu>', methods=['GET'])
	@app.route('/menu', methods=['GET'])
	def menu_template(menu=None, year=None):
		# Opciones de menú
		title, render_page, data = oSRVC.getMenu(menu, year)
		if data is None:
			flash('Opción de menú no disponible', 'danger')
		return render_template(render_page, title=title, response=data)

	@app.route('/auth/maintenance/<string:menu>', methods=['GET'])
	@app.route('/auth/maintenance', methods=['GET'])
	@role_required('admin', session)
	def maintenance_template(menu=None):
		# Obtener información de mantenimiento
		set_csrf_token('csrf_token_form', session)
		set_csrf_token('csrf_token_movie', session)
		title, render_page, data = oSRVC.maintenance(menu)
		return render_template(render_page, title=title, response=data)

	@app.route('/auth/search', methods=['GET', 'POST'])
	@role_required('admin', session)
	def advanced_template():
		# Busqueda avanzada
		if request.method == 'GET':			# Mostrar formulario de busqueda avanzada
			set_csrf_token('csrf_token_form', session)
			set_csrf_token('csrf_token_movie', session)
			title, render_page, data, found = oSRVC.searchAdvanced()
			if data is None:
				flash('No se pudo obtener información para la busqueda avanzada', 'danger')
		elif request.method == 'POST':		# Buscar películas de forma avanzada
			if not check_csrf_token('csrf_token_form', session, request.form['csrf_token_form']):
				abort(401, 'Altered csrf_token_form advanced_template()')
			title, render_page, data, found = oSRVC.searchAdvanced(request.form)
			if data is None:
				flash('Ninguna película encontrada con esos parametros', 'warning')
		return render_template(render_page, title=title, response=(data, found))

	@app.route('/updateChart', methods=['GET'])
	@role_required('admin', session)
	def update_grapic():
		# Actualizar las gráficas de estadísticas
		from .chart import draw_graphic
		draw_graphic(oSRVC.oDTB)
		return redirect(url_for('menu_template'), 301)

	@app.route('/inventories/<string:file_name>', methods=['GET'])
	def inventories(file_name):
		return render_template('inventories/' + file_name, title='file_name')

	# -------------------------------------------------------------------
	# 														API REST CRUD

	@app.route('/api/<string:querySQL>/<string:params>', methods=['GET'])
	@app.route('/api/<string:querySQL>', methods=['PUT', 'DELETE'])
	def querySQL(querySQL, params=None):
		# API REST CRUD Manejador de peticiones a la base de datos JavaScript
		def need_check_token(nameToken, token):
			# Comprueba peticiones en las que hay que checkear el token
			if querySQL not in ('task_status', 'extra_info_movie', 'select_urlend') and not check_csrf_token(nameToken, session, token):
				abort(401, f'Altered {nameToken} "{querySQL}"')

		if request.is_json:		# Parametros json. PUT, POST, DELETE
			dataJson = request.get_json()
			nameToken = 'csrf_token_movie' if querySQL == 'delete_movie' else 'csrf_token_form'
			token = dataJson['csrf_token_movie'] if querySQL == 'delete_movie' else dataJson['csrf_token_form']
			need_check_token(nameToken, token)
		else:					# Paremtros string (json). GET
			dataJson = json.loads(params)
			need_check_token('csrf_token_form', dataJson.get('csrf_token_form', None))

		data, status = oSRVC.queryAPI(querySQL, dataJson)
		return jsonify(data), status


	# -------------------------------------------------------------------
	# 														FILE HANDLER

	@app.route('/<string:tag>/<path:file_name>', methods=['GET'])
	def render_image(file_name, tag=None):
		# Renderizar imagenes
		path_file = tag + '/' + file_name
		if tag == 'covers':
			path_file, extension = os.path.splitext(file_name)
			real_file_name = path_file + '_cmp' + extension
			path_file = tag + '/' + real_file_name

		if allowed_file(file_name) and tag is not None:
			return send_from_directory(app.config.get('IMAGES_FOLDER', ''), path_file, as_attachment=True)
		else:
			return send_from_directory(app.config.get('RESOURCES_CSS', ''), 'clear.svg', as_attachment=True)
