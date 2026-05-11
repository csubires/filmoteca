"""
# Filename: models.py
# Version: 2.0
# By: CSUBIRES <cjesuma@proton.me>
# Created: 2024/01/13 12:02:02 by CSUBIRES
# Updated: 2026/05/09 by CSUBIRES
# Description: Crear objeto para validar datos:
    Este módulo contiene clases para manejar modelos de datos con validación y conversión automática de tipos.
    Compatible con Python 3.12+.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Optional

from .utils import Logging, singleton


@singleton
@dataclass
class Film:
    """
    Modelo para representar una película con validación automática de tipos.

    Atributos:
        film_id (int): Identificador único de la película
        name (str): Nombre de la película
        fps (float): Fotogramas por segundo
        external (bool): Indica si es externa
    """
    _film_id: Optional[int] = field(default=None)
    _name: Optional[str] = field(default=None)
    _fps: Optional[float] = field(default=None)
    _external: Optional[bool] = field(default=None)

    logger: Logging = field(default_factory=lambda: Logging('logs/models.log'), init=False)

    def __post_init__(self) -> None:
        """Inicialización posterior a dataclass."""
        # Inicializar logger si no existe
        if not hasattr(self, 'logger'):
            self.logger = Logging('logs/models.log')

    def _init_values(
        self,
        film_id: Optional[int] = None,
        name: Optional[str] = None,
        fps: Optional[float] = None,
        external: Optional[bool] = None
    ) -> None:
        """Permite inicializar valores (útil para tests y reinicialización)."""
        self._film_id = film_id
        self._name = name
        self._fps = fps
        self._external = external

    def validate(self) -> bool:
        """
        Valida que cada propiedad sea del tipo adecuado o None.

        Returns:
            bool: True si todos los tipos son correctos, False en caso contrario
        """
        result = True
        # Map of public property names to their expected types
        field_types = {
            'film_id': int,
            'name': str,
            'fps': float,
            'external': bool
        }
        for name, field_type in field_types.items():
            provided_value = getattr(self, name, None)
            if provided_value is not None and not isinstance(provided_value, field_type):
                self.logger.error(
                    f'El campo "{name}" es de tipo {type(provided_value).__name__}, '
                    f'se esperaba {field_type.__name__}'
                )
                result = False
        return result

    def exchange(self) -> bool:
        """
        Intenta convertir todas las propiedades a sus tipos adecuados.

        Returns:
            bool: True si todas las conversiones fueron exitosas, False en caso contrario
        """
        result = True
        # Map of public property names to their expected types
        field_types = {
            'film_id': int,
            'name': str,
            'fps': float,
            'external': bool
        }
        for name, field_type in field_types.items():
            provided_value = getattr(self, name, None)
            if provided_value is not None and not isinstance(provided_value, field_type):
                try:
                    if field_type == str:
                        setattr(self, name, str(provided_value))
                    elif field_type == int:
                        setattr(self, name, int(provided_value))
                    elif field_type == float:
                        setattr(self, name, float(provided_value))
                    elif field_type == bool:
                        # Smart bool conversion
                        if isinstance(provided_value, str):
                            bool_value = provided_value.lower() in ('true', '1', 'yes', 'on')
                        else:
                            bool_value = bool(provided_value)
                        setattr(self, name, bool_value)
                except (ValueError, TypeError) as e:
                    self.logger.error(
                        f'No se puede convertir el campo "{name}" de tipo '
                        f'{type(provided_value).__name__} a {field_type.__name__}: {e}'
                    )
                    result = False
        return result

    def trim(self) -> None:
        """Elimina espacios en blanco en los atributos de tipo string."""
        for name in ['name']:  # Only string fields
            value = getattr(self, name, None)
            if isinstance(value, str):
                setattr(self, name, value.strip())

    def clear(self) -> None:
        """Resetea todas las propiedades a None."""
        for name in ['film_id', 'name', 'fps', 'external']:
            setattr(self, name, None)

    def json(self) -> Dict[str, Any]:
        """
        Crea un diccionario con las propiedades de la clase.

        Returns:
            Dict[str, Any]: Diccionario con los datos del modelo
        """
        result = {}
        for key in ['film_id', 'name', 'fps', 'external']:
            result[key] = getattr(self, key, None)
        return result

    def prepare(self) -> Optional[Dict[str, Any]]:
        """
        Prepara la información del modelo para ser utilizada.
        Realiza conversión de tipos, validación y limpieza.

        Returns:
            Optional[Dict[str, Any]]: Diccionario preparado o None si falla validación
        """
        self.exchange()  # Intentar conversión de tipos
        if self.validate():  # Si pasa validación
            self.trim()  # Limpiar strings
            return self.json()  # Devolver datos preparados
        else:
            return None

    def show_attr(self) -> None:
        """Muestra los atributos de la clase en el log."""
        attrs = {key: getattr(self, key, None) for key in ['film_id', 'name', 'fps', 'external']}
        self.logger.debug('Atributos de Film', list(attrs.keys()), list(attrs.values()))

    # ==================== PROPERTIES ====================

    @property
    def film_id(self) -> Optional[int]:
        """Getter para film_id."""
        return self._film_id

    @film_id.setter
    def film_id(self, value: int) -> None:
        """Setter para film_id."""
        self._film_id = value

    @property
    def name(self) -> Optional[str]:
        """Getter para name."""
        return self._name

    @name.setter
    def name(self, value: str) -> None:
        """Setter para name."""
        self._name = value

    @property
    def fps(self) -> Optional[float]:
        """Getter para fps."""
        return self._fps

    @fps.setter
    def fps(self, value: float) -> None:
        """Setter para fps."""
        self._fps = value

    @property
    def external(self) -> Optional[bool]:
        """Getter para external."""
        return self._external

    @external.setter
    def external(self, value: bool) -> None:
        """Setter para external."""
        self._external = value


# ===============================================================================
# FilmFile - Modelo para películas del sistema local
# ===============================================================================

@dataclass
class FilmFile:
    """
    Modelo para representar una película almacenada localmente.

    Utilizado por core.py para procesar archivos de películas en el disco local.
    Incluye información de metadatos de archivo y codificación.
    """
    # Información del archivo
    title: Optional[str] = None
    year: Optional[int] = None
    quality: Optional[str] = None
    extension: Optional[str] = None
    size: Optional[int] = None
    size_str: Optional[str] = None
    duration: Optional[int] = None
    duration_str: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[float] = None

    # Rutas y metadatos
    pathfile: Optional[str] = None
    file_created: Optional[str] = None
    report_date: Optional[str] = None

    # Categorización
    genre: Optional[str] = None
    subgenre: Optional[str] = None
    path_genre: Optional[str] = None
    id_genre: Optional[int] = None
    id_subgenre: Optional[int] = None

    # Almacenamiento
    hdd_code: Optional[int] = None

    # Extras
    logger: Logging = field(default_factory=lambda: Logging('logs/models.log'), init=False)

    def clear(self) -> None:
        """Resetea todas las propiedades a None."""
        for key in self.__dataclass_fields__:
            if key != 'logger':
                setattr(self, key, None)

    def json(self) -> Dict[str, Any]:
        """Crea un diccionario con todas las propiedades de la clase."""
        return {k: getattr(self, k) for k in self.__dataclass_fields__ if k != 'logger'}

    def prepare(self) -> Optional[Dict[str, Any]]:
        """
        Prepara los datos de la película para inserción en BD.
        Realiza validación básica y limpieza.

        Returns:
            Dict con los datos preparados o None si faltan datos críticos
        """
        # Validar datos críticos
        if not self.pathfile or not self.title:
            self.logger.error('prepare()', 'Missing critical fields: pathfile or title')
            return None

        # Limpiar strings
        if isinstance(self.title, str):
            self.title = self.title.strip()
        if isinstance(self.quality, str):
            self.quality = self.quality.strip()

        return self.json()

    def show_attr(self) -> None:
        """Muestra los atributos de la clase en el log."""
        self.logger.debug('FilmFile attributes', list(self.json().keys()))


# ===============================================================================
# FilmInet - Modelo para películas con información de Internet
# ===============================================================================

@dataclass
class FilmInet:
    """
    Modelo para representar información de película obtenida de Internet.

    Utilizado por service.py para procesar información de películas desde
    fuentes web como FilmAffinity, IMDb, etc.
    """
    # Identificadores
    id_movie: Optional[int] = None
    id_country: Optional[int] = None

    # Información de película
    title: Optional[str] = None
    realtitle: Optional[str] = None
    year: Optional[int] = None

    # Descripciones y URLs
    urldesc: Optional[str] = None
    urlpicture: Optional[str] = None

    # Valoración
    ratings: Optional[float] = None

    # País
    country: Optional[str] = None

    # Extras
    logger: Logging = field(default_factory=lambda: Logging('logs/models.log'), init=False)

    def clear(self) -> None:
        """Resetea todas las propiedades a None."""
        for key in self.__dataclass_fields__:
            if key != 'logger':
                setattr(self, key, None)

    def json(self) -> Dict[str, Any]:
        """Crea un diccionario con todas las propiedades de la clase."""
        return {k: getattr(self, k) for k in self.__dataclass_fields__ if k != 'logger'}

    def prepare(self) -> Optional[Dict[str, Any]]:
        """
        Prepara los datos de la película para actualización en BD.

        Returns:
            Dict con los datos preparados o None si faltan datos críticos
        """
        # Validar datos críticos
        if self.id_movie is None:
            self.logger.error('prepare()', 'Missing critical field: id_movie')
            return None

        # Limpiar strings
        for key in ['title', 'realtitle', 'urldesc', 'country']:
            value = getattr(self, key, None)
            if isinstance(value, str):
                setattr(self, key, value.strip())

        # Asegurar que ratings está en rango válido si existe
        if self.ratings is not None:
            try:
                self.ratings = float(self.ratings)
                if self.ratings < 0:
                    self.ratings = None
                elif self.ratings > 10:
                    self.logger.warning('prepare()', f'Rating {self.ratings} exceeds max (10)')
                    self.ratings = 10.0
            except (ValueError, TypeError):
                self.logger.warning('prepare()', f'Invalid rating value: {self.ratings}')
                self.ratings = None

        return self.json()

    def show_attr(self) -> None:
        """Muestra los atributos de la clase en el log."""
        self.logger.debug('FilmInet attributes', list(self.json().keys()))
