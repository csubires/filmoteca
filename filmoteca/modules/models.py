# 2023.3.16

from dataclasses import dataclass

from .utils import lg_prt						# Mostrar y Colorear texto en consola


@dataclass
class FilmFile:
	# Modelo para almacenar la información del archivo de una película
	_title: str
	_year: int
	_quality: str
	_extension: str
	_size: int
	_size_str: str
	_duration: int
	_duration_str: str
	_pathfile: str
	_resolution: str
	_fps: float
	_file_created: str
	_report_date: str
	_id_genre: int
	_id_subgenre: int
	_hdd_code: int
	# Auxiliar
	_genre: str
	_subgenre: str
	_path_genre: str

	def __init__(self):
		pass

	def __post_init__(self):
		# Que se inicie con una limpieza
		# self.clear()
		pass

	def validate(self):
		# Validar que cada propiedad sea del tipo adecuado o None
		result = True
		for name, field_type in self.__annotations__.items():
			provided_key = self.__dict__.get(name, None)
			# Permitir atributos None, y (si no es None y no coinciden los tipos)
			if provided_key is not None and not isinstance(provided_key, field_type):
				lg_prt('rwryrg', '[✖] Error. The field', name, 'is of type', type(provided_key), 'was expected', field_type)
				result = False
		return result

	def exchange(self):
		# Intentar convertir todas las propiedades a sus tipos adecuados
		result = True
		for name, field_type in self.__annotations__.items():
			provided_key = self.__dict__.get(name, None)
			# Permitir atributos None, y (si no es None y no coinciden los tipos)
			if provided_key is not None and not isinstance(provided_key, field_type):
				try:
					if 'str' in str(field_type):
						setattr(self, name, str(provided_key))

					elif 'int' in str(field_type):
						setattr(self, name, int(provided_key))

					elif 'float' in str(field_type):
						setattr(self, name, float(provided_key))

					elif 'bool' in str(field_type):
						setattr(self, name, bool(provided_key))
				except Exception:
					lg_prt('rwryrg', '[✖] Error. Can not change the field', name, 'is of type', type(provided_key), 'to', field_type)
					result = False
		return result

	def trim(self):
		# Elimina espacios en blanco en los atributos de tipo string
		for key, value in self.__dict__.items():
			if isinstance(value, str):
				setattr(self, key, value.strip())

	def clear(self):
		# Resetear todas las propiedades
		for key in self.__annotations__.keys():
			setattr(self, key, None)

	def json(self):
		# Crear un diccionario con las propiedades de la clase
		result = {}
		for key, value in self.__dict__.items():
			result.update({f'{key[1:]}': value})
		return result

	def prepare(self):
		# Preparar la información del dataclass para ser utilizada
		self.exchange()				# Intentar forzar la validación
		if self.validate():			# Si es validado
			self.trim()				# Hacer trim
			return self.json()		# Devolver el diccionario de datos
		else:
			return None

	# -------------------- GETTERS ---------------------

	@property
	def title(self) -> str:
		return self._title

	@property
	def year(self) -> int:
		return self._year

	@property
	def quality(self) -> str:
		return self._quality

	@property
	def extension(self) -> str:
		return self._extension

	@property
	def size(self) -> int:
		return self._size

	@property
	def size_str(self) -> str:
		return self._size_str

	@property
	def duration(self) -> int:
		return self._duration

	@property
	def duration_str(self) -> str:
		return self._duration_str

	@property
	def pathfile(self) -> str:
		return self._pathfile

	@property
	def resolution(self) -> str:
		return self._resolution

	@property
	def fps(self) -> float:
		return self._fps

	@property
	def file_created(self) -> str:
		return self._file_created

	@property
	def report_date(self) -> str:
		return self._report_date

	@property
	def id_genre(self) -> int:
		return self._id_genre

	@property
	def id_subgenre(self) -> int:
		return self._id_subgenre

	@property
	def hdd_code(self) -> int:
		return self._hdd_code

	@property
	def genre(self) -> str:
		return self._genre

	@property
	def subgenre(self) -> str:
		return self._subgenre

	@property
	def path_genre(self) -> str:
		return self._path_genre

	# -------------------- SETTERS ---------------------

	@title.setter
	def title(self, value: str):
		self._title = value

	@year.setter
	def year(self, value: int):
		self._year = value

	@quality.setter
	def quality(self, value: str):
		self._quality = value

	@extension.setter
	def extension(self, value: str):
		self._extension = value.lower()

	@size.setter
	def size(self, value: int):
		self._size = value

	@size_str.setter
	def size_str(self, value: str):
		self._size_str = value

	@duration.setter
	def duration(self, value: int):
		self._duration = value

	@duration_str.setter
	def duration_str(self, value: str):
		self._duration_str = value

	@pathfile.setter
	def pathfile(self, value: str):
		self._pathfile = value

	@resolution.setter
	def resolution(self, value: str):
		self._resolution = value

	@fps.setter
	def fps(self, value: float):
		self._fps = value

	@file_created.setter
	def file_created(self, value: str):
		self._file_created = value

	@report_date.setter
	def report_date(self, value: str):
		self._report_date = value

	@id_genre.setter
	def id_genre(self, value: int):
		self._id_genre = value

	@id_subgenre.setter
	def id_subgenre(self, value: int):
		self._id_subgenre = value

	@hdd_code.setter
	def hdd_code(self, value: int):
		self._hdd_code = value

	@genre.setter
	def genre(self, value: str):
		self._genre = value.lower()

	@subgenre.setter
	def subgenre(self, value: str):
		self._subgenre = value.lower() if value is not None else None

	@path_genre.setter
	def path_genre(self, value: str):
		self._path_genre = value


@dataclass
class FilmInet(FilmFile):
	# Modelo para almacenar la información de Internet de una película
	_id_movie: int
	_title: str

	# Propios de la clase
	_realtitle: str
	_urldesc: str
	_ratings: float
	_urlpicture: str
	_country: str
	_id_country: int

	def __init__(self):
		pass

	def __post_init__(self):
		# Que se inicie con una limpieza
		# self.clear()
		pass

	# -------------------- GETTERS ---------------------

	@property
	def id_movie(self) -> int:
		return self._id_movie

	@property
	def title(self) -> str:
		return self._title

	@property
	def realtitle(self) -> str:
		return self._realtitle

	@property
	def urldesc(self) -> str:
		return self._urldesc

	@property
	def ratings(self) -> float:
		return self._ratings

	@property
	def urlpicture(self) -> str:
		return self._urlpicture

	@property
	def country(self) -> str:
		return self._country

	@property
	def id_country(self) -> int:
		return self._id_country

	# -------------------- SETTERS ---------------------

	@id_movie.setter
	def id_movie(self, value: int):
		self._id_movie = value

	@title.setter
	def title(self, value: str):
		self._title = value

	@realtitle.setter
	def realtitle(self, value: str):
		self._realtitle = value

	@urldesc.setter
	def urldesc(self, value: str):
		self._urldesc = value.lower() if value is not None else None

	@ratings.setter
	def ratings(self, value: float):
		self._ratings = value

	@urlpicture.setter
	def urlpicture(self, value: str):
		self._urlpicture = value.lower() if value is not None else None

	@country.setter
	def country(self, value: str):
		self._country = value

	@id_country.setter
	def id_country(self, value: int):
		self._id_country = value
