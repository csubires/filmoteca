# 2023.6.24

import sqlite3
import threading

from .utils import lg_prt, singleton			# Mostrar y Colorear texto en consola

"""
DATA-TYPES:
	None 	<--> NULL
	int 	<--> INTEGER/INT
	float 	<--> REAL/FLOAT
	str 	<--> TEXT/VARCHAR(N)
	byte 	<--> BLOB
"""


@singleton
class HandlerSQL:
	""" Inserta, borra, y actualiza la base de datos
		Args:
			database (str): 	Ruta del archivo .db o :memory:, Ex: 'data/movieDB.db'
			tag_query (dict): 	Diccionario con los pares TAG <-> QUERY
		Use:
			oDTB = HandlerSQL('nombre base de datos/:memory:', TAG_QUERY)
			oDTB.execute('insertar_algo', params)
			del oDTB
	"""

	def __init__(self, database, tag_query):
		# Establece una conexión a la base de datos
		self.database = database
		self.tag_query = tag_query
		self.db = None

		try:
			self.lock = threading.Lock()			# Para trabajar en proyectos con hilos
			self.db = sqlite3.connect(self.database, check_same_thread=False)
			self.cdb = self.db.cursor()
			lg_prt('vy', '[✔] Connected to database', self.database)
		except Exception as e:
			lg_prt('rywr', '[✖] Error connecting to the database', self.database, '\n', e)

	def __del__(self):
		# Cierra la conexión a la base de datos
		self.db.close()
		lg_prt('vyv', '[▲] Database', self.database, 'closed')

	def execute(self, tag, params={'None': None}):
		""" Ejecutar las sentencias SQL con un tag asociado
			Args:
				tag (str):	 			Tag asociada a la consulta
				params (dict):	 		Los parametros de la consulta. Ex: {'a': 'algo', 'b': 1}
			Returns:
				(list(tuple)):			[(columna1, columna2), (columna1, ...]
		"""
		response = None
		sentence = self.tag_query.get(tag, False)			# Obtener la consulta según su tag
		# lg_prt('by', sentence, params)

		try:
			self.lock.acquire(True)
			self.cdb.execute(sentence, params)				# Ejecutar consulta
			result = self.cdb.fetchall()					# Obtener resultados
			# Si la consulta no es Insert, Update, Delete necesita hacer commit
			if not sentence.upper().startswith('SELECT'):
				self.db.commit()
			# Si el resultado no devuelve ninguna fila devolver None
			response = result if len(result) > 0 else None
			self.lock.release()
		except Exception as e:
			lg_prt('ryryrwr', f'[✖] Error {type(self).__name__}.execute(), Tag:', tag, 'Query:', sentence, 'Params:', params, '\n', e)
		finally:
			return response

	def lastid(self):
		# Devolver el último id (primary key) asignado a una fila
		return self.cdb.lastrowid

	def affected(self):
		# Devolver el número de filas afectadas tras un Insert, Update, Delete
		return self.cdb.rowcount

	def execute_many(self, tag, params={'None': None}):
		""" Ejecuta consultas (Insert, Update, Delete) masivamente
			Args:
				tag (str):	 			Tag asociada a la consulta
				params (list(tuple)):	Los parametros de la consulta.
					Ex: [(columna1, columna2), (columna1, ...]
			Returns:
				None
		"""
		sentence = self.tag_query.get(tag, False)			# Obtener la consulta según su tag
		try:
			self.lock.acquire(True)
			self.cdb.executemany(sentence, params)
			self.db.commit()								# Sentencias que necesitan commit
			self.lock.release()
		except Exception as e:
			lg_prt('ryryrywr', f'[✖] Error {type(self).__name__}.execute_many(), Tag:', tag, 'Query:', sentence, 'Params:', params, '\n', e)
		finally:
			return None


def list_to_dict(headers, rows):
	""" Convierte listado select (list(dict)) a dicionario
		Args:
			headers (list):	 		Listado con las cabeceras. Ex: ['id', 'name', ...]
			rows (list(dict)):		Resultado de una consulta
				Ex: [(columna1, columna2), (columna1, ...]
		Returns:
			(list(list)) / None
	"""
	# Si existen files y el número de cabeceras es igual al número de columnas de una fila
	if len(rows) and (len(headers) == len(rows[0])):
		return [dict(zip(headers, item)) for item in rows]

	lg_prt('ry', '[✖] Error database.py.listToDict(),', f'Len(headers): {len(headers)}, len(rows): {len(rows)}, len(rows[0]): ?')
	return None
