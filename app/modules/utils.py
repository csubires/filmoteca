"""
# Filename: utils.py
# Version: 2.0
# By: CSUBIRES <cjesuma@proton.me>
# Created: 2024/01/13 12:02:02 by CSUBIRES
# Updated: 2026/05/09 by CSUBIRES
# Description: Funciones de uso habitual:
#   imprimir en color, decoradores, fecha/hora actual,
#   medición de tiempos de ejecución, logging a consola y fichero.
"""

from __future__ import annotations

import threading
import time
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path
from typing import Any, Callable, TypeVar

# ── Tipos ────────────────────────────────────────────────────────────────────

F = TypeVar("F", bound=Callable[..., Any])

# ── Paleta de colores ────────────────────────────────────────────────────────

PALETTE: dict[str, str] = {
    "w": "\33[97m",                   # Blanco
    "r": "\33[91m",                   # Rojo
    "g": "\33[92m",                   # Verde
    "y": "\33[93m",                   # Amarillo
    "b": "\033[38;5;39m",             # Azul
    "v": "\033[38;5;99m",             # Violeta
    "p": "\033[38;5;206m",            # Rosa
    "c": "\33[96m",                   # Cian
    "o": "\033[38;5;208m",            # Naranja
    "n": "\33[01m",                   # Negrita
    "u": "\33[04m",                   # Delineado
    "i": "\33[03m",                   # Cursiva
    "k": "\33[05m",                   # Parpadeo
    "t": "\33[7m\33[92m\33[1m",       # Título
    "x": "\a\007",                    # Beep (terminal-dependiente)
}

RESET = "\033[0m"

# ── Formatos de fecha/hora ───────────────────────────────────────────────────

DATETIME_FORMAT: dict[str, str] = {
    "iy": "%Y",                         # int  → 2024
    "symd-": "%Y-%m-%d",                # str  → 2024-05-09
    "sdmy": "%d/%m/%Y",                 # str  → 09/05/2024
    "shms": "%H:%M:%S",                 # str  → 10:55:35
    "symdhms": "%Y-%m-%d %H:%M:%S",     # str  → 2024-05-09 10:55:35
    "symd": "%Y%m%d",                   # str  → 20240509
    "symdthms": "%Y%m%dT%H%M%S",        # str  → 20240509T105535
}


# ── lg_prt ───────────────────────────────────────────────────────────────────


def lg_prt(colors: str, *args: Any) -> None:
    """Imprime mensajes a color en consola.

    Cada carácter de ``colors`` corresponde a un mensaje de ``args``.
    Si hay más mensajes que colores, el resto se imprime en blanco.
    Si un código de color no existe, ese mensaje se imprime en blanco
    y se señala con ``[?X]`` — sin silenciar el resto.

    Args:
        colors: Códigos de colores concatenados, p.ej. ``'wbyr'``.
        args:   Mensajes a imprimir, uno por color.
    """
    if not args:
        return

    # Rellenar colores faltantes con blanco
    colors = colors.ljust(len(args), "w")
    parts: list[str] = []

    for i, msg in enumerate(args):
        code = colors[i]
        if code not in PALETTE:
            parts.append(f'{PALETTE["w"]} [?{code}] {msg}')
        else:
            parts.append(f"{PALETTE[code]} {msg}")

    print(" ".join(parts) + RESET)


# ── dt_format ────────────────────────────────────────────────────────────────


def dt_format(fmt: str) -> str | int:
    """Devuelve la fecha/hora actual en el formato indicado.

    Args:
        fmt: Clave de ``DATETIME_FORMAT``.

    Returns:
        ``str`` si la clave empieza por ``'s'``, ``int`` si empieza por ``'i'``.

    Raises:
        KeyError: Si ``fmt`` no existe en ``DATETIME_FORMAT``.
    """
    if fmt not in DATETIME_FORMAT:
        raise KeyError(
            f"Formato '{fmt}' no reconocido. "
            f"Disponibles: {list(DATETIME_FORMAT.keys())}"
        )
    raw = datetime.now(timezone.utc).strftime(DATETIME_FORMAT[fmt])
    match fmt[0]:
        case "s":
            return raw
        case "i":
            return int(raw)
        case _:
            return raw


# ── Logging ──────────────────────────────────────────────────────────────────


class Logging:
    """Mensajes de log coloreados en consola y opcionalmente en fichero.

    Niveles: TITLE, INFO, OBJECT, WARNING, ERROR, SUCCESS, CRITICAL, DEBUG.

    Args:
        file: Ruta del fichero de log. El directorio se crea si no existe.
    """

    # (color_icono, icono, color_dato)
    _TAGS: dict[str, tuple[str, str, str]] = {
        "TITLE": ("t", "", "b"),
        "INFO": ("b", "⎡ℹ⎦", "w"),
        "OBJECT": ("v", "⎡❯⎦", "y"),
        "WARNING": ("y", "⎡▲ WARNING⎦", "b"),
        "ERROR": ("r", "⎡✖ ERROR⎦", "y"),
        "SUCCESS": ("g", "⎡✔⎦", "w"),
        "CRITICAL": ("r", "⎡✚ CRITICAL⎦", "o"),
        "DEBUG": ("o", "", "p"),
    }

    def __init__(self, file: str | Path = "logs/log.log") -> None:
        self._file_log = Path(file)
        self._disabled = False

    # ── Control ──────────────────────────────────────────────────────────────

    @property
    def enabled(self) -> bool:
        """``True`` si el logger está activo."""
        return not self._disabled

    def enable(self) -> None:
        """Reactiva la salida de log."""
        self._disabled = False

    def disable(self) -> None:
        """Suprime toda la salida hasta el próximo ``enable()``."""
        self._disabled = True

    # ── Núcleo ───────────────────────────────────────────────────────────────

    def _print(self, level: str, message: str, *args: Any) -> None:
        """Construye y emite la línea coloreada. No llama a func() más de una vez."""
        if self._disabled:
            return

        ci, icon, cd = self._TAGS[level]
        data = " ".join(str(a) for a in args if a is not None)

        match level:
            case "DEBUG":
                print(
                    f'\n\t{PALETTE[ci]}{PALETTE["u"]}{message}{RESET}'
                    f"\n{PALETTE[cd]}{data}{RESET}\n"
                )
            case "TITLE":
                print(f" \t{PALETTE[ci]} {message} {RESET} {PALETTE[cd]} {data}{RESET}")
            case _:
                print(f" {PALETTE[ci]}{icon} {message} {PALETTE[cd]}{data}{RESET}")

    # ── API pública ───────────────────────────────────────────────────────────

    def title(self, message: str, *args: Any) -> None:
        self._print("TITLE", message, *args)

    def info(self, message: str, *args: Any) -> None:
        self._print("INFO", message, *args)

    def object(self, message: str, *args: Any) -> None:
        self._print("OBJECT", message, *args)

    def warning(self, message: str, *args: Any) -> None:
        self._print("WARNING", message, *args)

    def error(self, message: str, *args: Any) -> None:
        self._print("ERROR", message, *args)

    def success(self, message: str, *args: Any) -> None:
        self._print("SUCCESS", message, *args)

    def critical(self, message: str, *args: Any) -> None:
        self._print("CRITICAL", message, *args)

    def debug(self, message: str, *args: Any) -> None:
        self._print("DEBUG", message, *args)

    def hr(self, char: str = "─", width: int = 80) -> None:
        """Separador horizontal. Carácter y anchura configurables."""
        print(f' {PALETTE["y"]}{char * width}{RESET}')

    def file(self, level: str = "INFO", *args: Any) -> bool:
        """Escribe una línea en el fichero de log.

        Crea el directorio si no existe. Devuelve ``True`` si tuvo éxito.

        Args:
            level: Etiqueta de nivel (INFO, ERROR, WARNING…).
            args:  Mensajes adicionales separados por espacio.
        """
        try:
            self._file_log.parent.mkdir(parents=True, exist_ok=True)
            with self._file_log.open("a", encoding="utf-8") as fp:
                if not args and level != "INFO":
                    message = level
                    level = "INFO"
                else:
                    message = " ".join(str(a) for a in args)

                line = (
                    f'\n{dt_format("symdhms")} '
                    f"| {level} "
                    f'| {" ".join(str(a) for a in args)}'
                )
                fp.write(line)
            return True
        except Exception as exc:
            print(f'{PALETTE["r"]}⎡✖ LOG FILE ERROR⎦ {exc}{RESET}')
            return False


# ── singleton ────────────────────────────────────────────────────────────────


def singleton(class_: type) -> Callable[..., Any]:
    """Decorador de clase: garantiza una única instancia.

    Thread-safe mediante double-checked locking con ``threading.Lock``.
    Preserva ``__name__``, ``__doc__`` y ``__module__`` de la clase original.
    """
    instances: dict[type, Any] = {}
    lock = threading.Lock()

    @wraps(class_)
    def get_instance(*args: Any, **kwargs: Any) -> Any:
        if class_ not in instances:
            with lock:
                if class_ not in instances:  # double-checked
                    instances[class_] = class_(*args, **kwargs)
                    return instances[class_]
        lg_prt("y", "[▲] Only one instance of the object is allowed")
        return instances[class_]

    return get_instance


# ── chronos (decorador de función) ───────────────────────────────────────────


def chronos(func: F) -> F:
    """Decorador que mide y muestra el tiempo de ejecución de una función.

    Usa ``perf_counter_ns`` para máxima precisión. Preserva metadatos
    de la función original (``__name__``, ``__doc__``…).
    """

    @wraps(func)
    def wrap_func(*args: Any, **kwargs: Any) -> Any:
        tic = time.perf_counter_ns()
        value = func(*args, **kwargs)
        elapsed_ms = (time.perf_counter_ns() - tic) / 1_000_000
        lg_prt(
            "oyc", "[▲] Elapsed time for", f"@{func.__name__}", f"{elapsed_ms:,.3f} ms"
        )
        return value

    return wrap_func  # type: ignore[return-value]


# ── Chronos (context manager) ────────────────────────────────────────────────


class Chronos:
    """Cronómetro de bloque de código usando ``with``.

    Args:
        codename: Etiqueta para identificar el bloque cronometrado.

    Example::

        with Chronos('mi_bloque') as c:
            do_something()
            print(c.elapsed_ms)   # tiempo parcial dentro del bloque
    """

    def __init__(self, codename: str) -> None:
        self.codename = codename
        self._start_ns = 0

    def __enter__(self) -> Chronos:
        self._start_ns = time.perf_counter_ns()
        return self  # permite usar 'as c'

    def __exit__(self, *exc_info: Any) -> None:
        elapsed_ms = (time.perf_counter_ns() - self._start_ns) / 1_000_000
        lg_prt("oyc", "[▲] Elapsed time for", self.codename, f"{elapsed_ms:,.3f} ms")

    @property
    def elapsed_ms(self) -> float:
        """Milisegundos transcurridos desde ``__enter__`` (útil dentro del bloque)."""
        return (time.perf_counter_ns() - self._start_ns) / 1_000_000
