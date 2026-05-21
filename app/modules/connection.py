'''
# Filename: connection.py
# Version: 2.0
# By: CSUBIRES <cjesuma@proton.me>
# Created: 2024/01/15 11:55:53 by CSUBIRES
# Updated: 2026/05/09 by CSUBIRES
# Description: Clase para el manejo de conexiones HTTP.
#   Soporta requests nativo y curl_cffi (TLS fingerprinting).
#   LOS HEADERS PUEDEN HACER QUE PÁGINAS DEVUELVAN CÓDIGO ILEGIBLE,
#   TAMBIÉN SUCEDE CON PROXIES NO ADECUADOS, COMPROBAR ANTES QUE NADA.
'''

from __future__ import annotations

from json import dump, load
from pathlib import Path
from typing import TYPE_CHECKING

import urllib3
from urllib3.util.retry import Retry

from .utils import Logging, singleton
from config.default_headers import HEADERS

# ── Backend selection ────────────────────────────────────────────────────────

def _load_backend(use_curl: bool):
    """Devuelve el módulo de requests según el backend elegido."""
    if use_curl:
        try:
            import curl_cffi.requests as _req
            return _req, True
        except ImportError as exc:
            raise ImportError(
                "curl_cffi no está instalado. Ejecuta: pip install curl-cffi"
            ) from exc
    else:
        import requests as _req
        return _req, False


# ── Tipos ────────────────────────────────────────────────────────────────────

if TYPE_CHECKING:
    import requests as _req_type

_ResponseTuple = tuple[object | None, int]

# ── Constantes ───────────────────────────────────────────────────────────────

DEFAULT_TIMEOUT:    int  = 10          # segundos
DEFAULT_RETRIES:    int  = 3
DEFAULT_BACKOFF:    float = 0.5
COOKIES_FILENAME:   str  = 'cookies.json'
CONNECTIVITY_URL:   str  = 'https://1.1.1.1'

SUPPORTED_METHODS = frozenset({'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'})


# ── Clase principal ──────────────────────────────────────────────────────────

@singleton
class Handler_connection:
    """Establece, cierra y maneja conexiones HTTP.

    Soporta dos backends:
        - ``requests``   (por defecto, stdlib-compatible)
        - ``curl_cffi``  (TLS fingerprinting, evita detección de bots)

    Se puede usar como context manager::

        with Handler_connection() as cnt:
            page, status = cnt.send('GET', 'https://example.com')

    Args:
        persistence (bool): Mantener la sesión entre ejecuciones
                            guardando/cargando cookies en disco.
        use_curl    (bool): Usar ``curl_cffi`` en vez de ``requests``.
        timeout     (int):  Tiempo máximo de espera por petición (segundos).
        impersonate (str):  Navegador a imitar con curl_cffi
                            (p. ej. ``"chrome120"``). Ignorado si no se usa curl.
    """

    def __init__(
        self,
        persistence: bool = False,
        use_curl:    bool = False,
        timeout:     int  = DEFAULT_TIMEOUT,
        impersonate: str  = 'chrome120',
    ) -> None:
        self._requests, self._using_curl = _load_backend(use_curl)
        self._persistence  = persistence
        self._timeout      = timeout
        self._impersonate  = impersonate
        self.logger        = Logging('logs/connection.log')
        self.headers       = HEADERS
        self.inetObj       = None   # type: ignore[assignment]

        self._open()

    # ── Ciclo de vida ────────────────────────────────────────────────────────

    def _open(self) -> None:
        """Abre la sesión HTTP y configura adaptadores y reintentos."""
        self.logger.object('Creating connection...')

        if self._using_curl:
            self.inetObj = self._requests.Session(impersonate=self._impersonate)
        else:
            self.inetObj = self._requests.Session()
            retry = Retry(connect=DEFAULT_RETRIES, backoff_factor=DEFAULT_BACKOFF)
            from requests.adapters import HTTPAdapter
            adapter = HTTPAdapter(max_retries=retry)
            for scheme in ('http://', 'https://', 'ftp://'):
                self.inetObj.mount(scheme, adapter)
            self.inetObj.verify = True

        self.set_headers(self.headers)
        self.logger.object('Connection created', self)

        if self._persistence:
            self.load_cookies()

    def _close(self) -> None:
        """Cierra la sesión HTTP limpiamente."""
        if self.inetObj is None:
            return
        if self._persistence:
            self.save_cookies()
        self.clear_cookies()
        self.inetObj.close()
        self.logger.object('Closed connection', self)

    # Context manager
    def __enter__(self) -> Handler_connection:
        return self

    def __exit__(self, *_) -> None:
        self._close()

    def __del__(self) -> None:
        self._close()

    def __str__(self) -> str:
        backend = 'curl_cffi' if self._using_curl else 'requests'
        return f'Handler_connection | backend={backend} | session={type(self.inetObj).__name__}'

    def __repr__(self) -> str:
        return (
            f'Handler_connection('
            f'persistence={self._persistence}, '
            f'use_curl={self._using_curl}, '
            f'timeout={self._timeout})'
        )

    # ── Peticiones ───────────────────────────────────────────────────────────

    def send(
        self,
        method:  str,
        url_page: str,
        params:  dict | None = None,
        files:   dict | None = None,
    ) -> _ResponseTuple:
        """Realiza una petición HTTP y devuelve ``(response, status_code)``.

        En caso de error devuelve ``(None, 999)`` y registra el fallo.

        Args:
            method   : Verbo HTTP — GET, POST, PUT, PATCH, DELETE, HEAD.
            url_page : URL destino.
            params   : Parámetros de query (GET) o body (POST/PUT/PATCH).
            files    : Ficheros a enviar en multipart (sólo POST).

        Returns:
            Tupla ``(page_object | None, http_status_code)``.
        """
        page        = None
        status_code = 999
        method      = method.upper()

        if method not in SUPPORTED_METHODS:
            self.logger.error(
                'HTTP method not supported',
                {'Method': method, 'URL': url_page, 'Supported': list(SUPPORTED_METHODS)},
            )
            return (None, status_code)

        try:
            match method:
                case 'GET':
                    page = self.inetObj.get(
                        url_page, params=params, timeout=self._timeout
                    )
                case 'POST':
                    page = self.inetObj.post(
                        url_page,
                        data=params if not files else None,
                        files=files,
                        timeout=self._timeout,
                    )
                case 'PUT':
                    page = self.inetObj.put(
                        url_page, data=params, timeout=self._timeout
                    )
                case 'PATCH':
                    page = self.inetObj.patch(
                        url_page, data=params, timeout=self._timeout
                    )
                case 'DELETE':
                    page = self.inetObj.delete(
                        url_page, timeout=self._timeout
                    )
                case 'HEAD':
                    page = self.inetObj.head(
                        url_page, timeout=self._timeout
                    )

            status_code = page.status_code

        except Exception as exc:   # noqa: BLE001  — captura requests y curl_cffi
            exc_name = type(exc).__name__
            self.logger.error(
                f'Request failed [{exc_name}]',
                {'Method': method, 'URL': url_page, 'Params': params, 'Error': str(exc)},
            )

        return (page, status_code)

    # ── Redirecciones ────────────────────────────────────────────────────────

    def get_url_redirect(self, url_page: str) -> tuple[str | None, int | None]:
        """Devuelve la URL y el status de la última redirección tras un GET.

        Returns:
            ``(redirect_url, status_code)`` o ``(None, None)`` si no hubo
            redirección o la petición falló.
        """
        page, _ = self.send('GET', url_page)
        if page is None:
            return (None, None)

        # Si hay historial de redirecciones, intentar obtener la Location
        # del último response; si no existe, devolver la URL final del page
        if getattr(page, 'history', None):
            last = page.history[-1]
            loc = last.headers.get('Location') or getattr(page, 'url', None)
            status = getattr(last, 'status_code', None) or getattr(page, 'status_code', None)
            return (loc, status)

        # Si no hubo history pero el servidor devolvió un 3xx sin Location,
        # devolver la URL final y el código (seguido por requests normalmente).
        final_url = getattr(page, 'url', None)
        final_status = getattr(page, 'status_code', None)
        return (None if not page.history and final_url == url_page else final_url, final_status)

    # ── Headers ──────────────────────────────────────────────────────────────

    def get_headers(self) -> dict:
        return dict(self.inetObj.headers)

    def set_headers(self, new_headers: dict) -> None:
        self.inetObj.headers.clear()
        self.inetObj.headers.update(new_headers)

    # ── Cookies ──────────────────────────────────────────────────────────────

    def get_cookies(self) -> dict:
        return self.inetObj.cookies.get_dict()

    def get_cookie(self, name: str) -> str | None:
        return self.inetObj.cookies.get_dict().get(name)

    def set_cookies(self, cookies: dict) -> None:
        import requests as _std
        self.inetObj.cookies.update(_std.utils.cookiejar_from_dict(cookies))
        self.logger.info('Set cookies', self.inetObj.cookies.get_dict())

    def clear_cookies(self) -> None:
        self.inetObj.cookies.clear()
        self.logger.warning('Deleted cookies', {})

    def num_cookies(self) -> int:
        return len(self.inetObj.cookies)

    def load_cookies(self, cookies_path: str | Path = 'data/') -> bool:
        """Carga cookies desde disco. Devuelve ``True`` si tuvo éxito."""
        path = Path(cookies_path) / COOKIES_FILENAME
        try:
            with path.open('r', encoding='utf-8') as f:
                self.set_cookies(load(f))
            return True
        except Exception as exc:
            self.logger.error('Cookies could not be loaded', exc)
            return False

    def save_cookies(self, cookies_path: str | Path = 'data/') -> bool:
        """Guarda cookies en disco. Devuelve ``True`` si tuvo éxito."""
        import requests as _std
        n = self.num_cookies()
        if n == 0:
            self.logger.info('No cookies to save', {})
            return False
        path = Path(cookies_path) / COOKIES_FILENAME
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open('w', encoding='utf-8') as f:
                dump(_std.utils.dict_from_cookiejar(self.inetObj.cookies), f, indent=2)
            self.logger.info('Cookies saved', {'Amount': n})
            return True
        except Exception as exc:
            self.logger.error('Error saving cookies', exc)
            return False

    # ── Conectividad ─────────────────────────────────────────────────────────

    def is_online(self) -> bool:
        """Comprueba conectividad haciendo HEAD a ``1.1.1.1``."""
        try:
            self.inetObj.head(CONNECTIVITY_URL, timeout=2)
            return True
        except Exception:   # noqa: BLE001
            return False

    # ── Utilidades estáticas ─────────────────────────────────────────────────

    @staticmethod
    def encode_url(url_page: str) -> str:
        """Codifica una URL con sus parámetros de forma segura."""
        from requests.utils import requote_uri
        return requote_uri(url_page)
