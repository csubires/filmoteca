"""
# Filename: extras.py
# Version: 2.0
# By: CSUBIRES <cjesuma@proton.me>
# Created: 2024/01/20 11:59:25 by CSUBIRES
# Updated: 2026/05/09 12:00:00 by CSUBIRES
# Description: Este script contiene funciones de conversión de datos
"""

from datetime import datetime, timedelta
from typing import Optional, Any
from zoneinfo import ZoneInfo

from modules.utils import lg_prt

ABR_SIZE = ("B", "KB", "MB", "GB", "TB", "PB")


def timestamp_to_date(timeStamp: float | str) -> str:
    """Convierte timestamp a fecha 'YYYY-MM-DD'

    Args:
        timeStamp: Timestamp Unix (ej: '1651855905' o 1651855905)

    Returns:
        Fecha en formato 'YYYY-MM-DD'
    """
    try:
        # Usar zona horaria local del sistema
        local_tz = datetime.now().astimezone().tzinfo
        return datetime.fromtimestamp(float(timeStamp), tz=local_tz).strftime(
            "%Y-%m-%d"
        )
    except Exception as e:
        lg_prt("ryr", "Error timestamp_to_date()", timeStamp, e)
        return ""


def date_to_human(date: str) -> Optional[str]:
    """Convierte fecha string a formato humano 'DD de Mes de YYYY'

    Args:
        date: Fecha en formato 'YYYY-MM-DD HH:MM:SS' o 'YYYY-MM-DD'

    Returns:
        Fecha formateada o None si hay error
    """
    formats = ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d %H:%M:%S", "%Y/%m/%d"]

    for fmt in formats:
        try:
            return datetime.strptime(date, fmt).strftime("%d de %B de %Y")
        except ValueError:
            continue

    lg_prt("ry", f"[✖] Error date_to_human(), formato no soportado: {date}")
    return None


def time_to_seconds(timeStr: str) -> Optional[int]:
    """Convierte tiempo formato %H:%M:%S o %M:%S a segundos

    Args:
        timeStr: Tiempo en formato 'HH:MM:SS' o 'MM:SS'

    Returns:
        Segundos totales o None si hay error
    """
    if not timeStr or not isinstance(timeStr, str):
        return None

    try:
        # Limpiar milisegundos si existen
        timeStr = timeStr.split(".")[0]
        parts = timeStr.split(":")

        match len(parts):
            case 1:  # Solo segundos
                return int(parts[0])
            case 2:  # MM:SS
                return int(parts[0]) * 60 + int(parts[1])
            case 3:  # HH:MM:SS
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            case _:
                return None
    except (ValueError, AttributeError) as e:
        lg_prt("ryr", "Error time_to_seconds()", timeStr, e)
        return None


def seconds_to_time(seconds: int) -> str:
    """Convierte segundos a años, meses, días, horas, minutos, segundos

    Args:
        seconds: Cantidad de segundos (ej: 7512)

    Returns:
        String formateado (ej: '2hr, 5min, 12seg')
    """
    if seconds < 0:
        return "0seg"

    try:
        # Aproximación: 1 año = 365 días, 1 mes = 30 días
        minutes, sec = divmod(int(seconds), 60)
        hours, minutes = divmod(minutes, 60)
        days, hours = divmod(hours, 24)
        years, days = divmod(days, 365)
        months, days = divmod(days, 30)

        parts = []
        if years > 0:
            parts.append(f'{years}Año{"s" if years > 1 else ""}')
        if months > 0:
            parts.append(f'{months}Mes{"es" if months > 1 else ""}')
        if days > 0:
            parts.append(f'{days}Día{"s" if days > 1 else ""}')
        if hours > 0:
            parts.append(f"{hours}hr")
        if minutes > 0:
            parts.append(f"{minutes}min")
        if sec > 0 or not parts:
            parts.append(f"{sec}seg")

        return ", ".join(parts)

    except Exception as e:
        lg_prt("ryr", "Error seconds_to_time()", seconds, e)
        return "0seg"


def bytes_to_human(nbytes: int) -> Optional[str]:
    """Convierte bytes a formato legible con sufijo (KB, MB, GB, etc.)

    Args:
        nbytes: Cantidad de bytes (ej: 14272717)

    Returns:
        String formateado (ej: '13.61 MB') o None si hay error
    """
    try:
        if nbytes == 0:
            return "0 B"

        if nbytes < 0:
            return None

        i = 0
        size = float(nbytes)
        while size >= 1024 and i < len(ABR_SIZE) - 1:
            size /= 1024.0
            i += 1

        # Formatear sin ceros innecesarios
        formatted = f"{size:.2f}"
        formatted = formatted.rstrip("0").rstrip(".")
        return f"{formatted} {ABR_SIZE[i]}"

    except Exception as e:
        lg_prt("ryr", "Error bytes_to_human()", nbytes, e)
        return None


def list_to_dict(headers: list, rows: list[tuple]) -> Optional[list[dict]]:
    """Convierte resultado de consulta SQL a lista de diccionarios

    Args:
        headers: Lista de nombres de columnas (ej: ['id', 'name'])
        rows: Lista de tuplas con los datos

    Returns:
        Lista de diccionarios o None si hay error
    """
    if not rows:
        lg_prt("ry", "[✖] Error list_to_dict(), rows vacío")
        return None

    if not headers:
        lg_prt("ry", "[✖] Error list_to_dict(), headers vacío")
        return None

    if len(headers) != len(rows[0]):
        lg_prt(
            "ry",
            f"[✖] Error list_to_dict(), Len(headers): {len(headers)}, Len(rows[0]): {len(rows[0])}",
        )
        return None

    return [dict(zip(headers, item)) for item in rows]
