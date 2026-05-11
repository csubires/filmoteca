"""
# Filename: reduce_image.py
# Version: 1.0
# Description: Port Python de reduce_image.sh
#   Busca duplicados, elimina EXIF, redimensiona y comprime imágenes.
#   Usa utils.py para logging, colores y medición de tiempos.
#
# Dependencias externas:
#   pip install Pillow piexif
#   (opcional) pip install fastdupes   ← para búsqueda de duplicados por hash
#
# Uso desde main.py:
#   from reduce_image import ImageProcessor
#   proc = ImageProcessor("ruta/a/imagenes")
#   proc.run()           # pipeline completo (pide confirmación en cada paso)
#   proc.run(confirm=False)  # sin confirmaciones (automatización total)
"""

from __future__ import annotations

import hashlib
import shutil
from pathlib import Path
from typing import Iterator

from PIL import Image
import piexif

from .utils import Chronos, Logging, lg_prt

# ── Constantes ────────────────────────────────────────────────────────────────

SUPPORTED_EXTENSIONS: tuple[str, ...] = (".jpg", ".jpeg", ".png", ".bmp")
RESIZE_MAX_HEIGHT: int = 500
COMPRESS_QUALITY: int = 60
COMPRESSED_SUFFIX: str = "_cmp"

log = Logging()


# ── Helpers ───────────────────────────────────────────────────────────────────


def _image_files(directory: Path, skip_compressed: bool = True) -> Iterator[Path]:
    """Genera rutas de imágenes soportadas dentro de *directory* (recursivo).

    Args:
        directory:       Directorio raíz donde buscar.
        skip_compressed: Si es ``True``, omite archivos que ya contienen
                         el sufijo ``_cmp`` en su nombre.
    """
    for path in directory.rglob("*"):
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue
        if skip_compressed and COMPRESSED_SUFFIX in path.stem:
            continue
        yield path


def _confirm(prompt: str) -> bool:
    """Pide confirmación S/N por consola.  Devuelve ``True`` si el usuario acepta."""
    answer = input(f"{prompt} (S/N): ").strip().upper()
    return answer == "S"


def _file_hash(path: Path, block_size: int = 65_536) -> str:
    """Calcula el hash MD5 de un fichero para detectar duplicados."""
    h = hashlib.md5()
    with path.open("rb") as fh:
        while chunk := fh.read(block_size):
            h.update(chunk)
    return h.hexdigest()


def _dir_size_mb(directory: Path) -> float:
    """Devuelve el tamaño total de *directory* en megabytes."""
    total = sum(f.stat().st_size for f in directory.rglob("*") if f.is_file())
    return total / (1024 * 1024)


# ── ImageProcessor ────────────────────────────────────────────────────────────


class ImageProcessor:
    """Pipeline de procesado de imágenes equivalente a ``reduce_image.sh``.

    Etapas:
        1. ``find_duplicates``  — detecta ficheros con contenido idéntico.
        2. ``remove_exif``      — elimina metadatos EXIF de cada imagen.
        3. ``resize``           — redimensiona imágenes con altura > 500 px.
        4. ``compress``         — comprime con calidad 60 y renombra añadiendo ``_cmp``.

    Args:
        directory: Ruta al directorio de imágenes.
    """

    def __init__(self, directory: str | Path) -> None:
        self.dir = Path(directory).resolve()
        if not self.dir.is_dir():
            log.error("Directorio no encontrado:", str(self.dir))
            raise NotADirectoryError(f"'{self.dir}' no es un directorio válido")
        log.info("Directorio de trabajo:", str(self.dir))

    # ── 1. Duplicados ─────────────────────────────────────────────────────────

    def find_duplicates(self, confirm: bool = True) -> dict[str, list[Path]]:
        """Busca ficheros con contenido idéntico (comparación por hash MD5).

        Args:
            confirm: Si es ``True``, pide confirmación antes de ejecutar.

        Returns:
            Diccionario ``{hash: [lista de rutas duplicadas]}``.
            Sólo contiene entradas con 2 o más rutas.
        """
        log.title("BUSCAR ARCHIVOS DUPLICADOS")
        if confirm and not _confirm("¿Estás seguro?"):
            log.warning("Operación cancelada por el usuario")
            return {}

        duplicates: dict[str, list[Path]] = {}
        with Chronos("find_duplicates"):
            for path in _image_files(self.dir, skip_compressed=False):
                h = _file_hash(path)
                duplicates.setdefault(h, []).append(path)

        result = {h: paths for h, paths in duplicates.items() if len(paths) > 1}

        if result:
            log.warning(f"Se encontraron {len(result)} grupos de duplicados:")
            for h, paths in result.items():
                lg_prt("v", f"  Hash {h[:8]}…")
                for p in paths:
                    lg_prt("y", f"    {p.relative_to(self.dir)}")
        else:
            log.success("No se encontraron duplicados")

        return result

    # ── 2. Eliminar EXIF ──────────────────────────────────────────────────────

    def remove_exif(self, confirm: bool = True) -> int:
        """Elimina los metadatos EXIF de cada imagen soportada.

        Args:
            confirm: Si es ``True``, pide confirmación antes de ejecutar.

        Returns:
            Número de imágenes procesadas.
        """
        log.title("BORRAR METADATOS EXIF DE IMÁGENES")
        if confirm and not _confirm("¿Estás seguro?"):
            log.warning("Operación cancelada por el usuario")
            return 0

        count = 0
        with Chronos("remove_exif"):
            for path in _image_files(self.dir):
                try:
                    img = Image.open(path)
                    # Eliminar EXIF embebido (JPEG/TIFF)
                    if "exif" in img.info:
                        img.save(path, exif=b"")
                    else:
                        img.save(path)
                    img.close()
                    log.object("EXIF eliminado:", path.name)
                    count += 1
                except Exception as exc:
                    log.error(f"Error procesando '{path.name}':", str(exc))

        log.success(f"EXIF eliminado en {count} imagen(es)")
        return count

    # ── 3. Redimensionar ──────────────────────────────────────────────────────

    def resize(self, max_height: int = RESIZE_MAX_HEIGHT, confirm: bool = True) -> int:
        """Redimensiona imágenes cuya altura supere *max_height* píxeles.

        Mantiene la proporción. No amplía imágenes más pequeñas.

        Args:
            max_height: Altura máxima en píxeles (por defecto 500).
            confirm:    Si es ``True``, pide confirmación antes de ejecutar.

        Returns:
            Número de imágenes redimensionadas.
        """
        log.title(f"REDIMENSIONAR IMÁGENES A x{max_height}px")
        if confirm and not _confirm("¿Estás seguro?"):
            log.warning("Operación cancelada por el usuario")
            return 0

        count = 0
        with Chronos("resize"):
            for path in _image_files(self.dir):
                try:
                    img = Image.open(path)
                    w, h = img.size
                    if h > max_height:
                        new_w = int(w * max_height / h)
                        img = img.resize((new_w, max_height), Image.LANCZOS)
                        img.save(path)
                        log.object(f"Redimensionado ({w}x{h} → {new_w}x{max_height}):", path.name)
                        count += 1
                    img.close()
                except Exception as exc:
                    log.error(f"Error procesando '{path.name}':", str(exc))

        log.success(f"{count} imagen(es) redimensionada(s)")
        return count

    # ── 4. Comprimir ──────────────────────────────────────────────────────────

    def compress(self, quality: int = COMPRESS_QUALITY, confirm: bool = True) -> int:
        """Comprime las imágenes con pérdida y añade el sufijo ``_cmp``.

        Las imágenes resultantes se guardan siempre como JPEG.

        Args:
            quality: Calidad JPEG 0-95 (por defecto 60).
            confirm: Si es ``True``, pide confirmación antes de ejecutar.

        Returns:
            Número de imágenes comprimidas.
        """
        log.title("REDUCIR/COMPRIMIR IMÁGENES")
        if confirm and not _confirm("¿Estás seguro?"):
            log.warning("Operación cancelada por el usuario")
            return 0

        count = 0
        with Chronos("compress"):
            for path in _image_files(self.dir):
                try:
                    img = Image.open(path).convert("RGB")
                    out_path = path.with_name(f"{path.stem}{COMPRESSED_SUFFIX}.jpg")
                    img.save(out_path, "JPEG", quality=quality, optimize=True)
                    img.close()

                    # Eliminar original si el destino es diferente
                    if out_path != path:
                        path.unlink()

                    log.object(f"Comprimido (q={quality}):", out_path.name)
                    count += 1
                except Exception as exc:
                    log.error(f"Error procesando '{path.name}':", str(exc))

        log.success(f"{count} imagen(es) comprimida(s)")
        return count

    # ── Pipeline completo ─────────────────────────────────────────────────────

    def run(self, confirm: bool = True) -> None:
        """Ejecuta el pipeline completo: duplicados → EXIF → resize → compress.

        Args:
            confirm: Propaga el flag de confirmación a cada etapa.
                     Pasa ``False`` para automatización sin interacción.
        """
        log.hr()
        log.title("PIPELINE REDUCE IMAGE", str(self.dir))
        log.hr()

        size_before = _dir_size_mb(self.dir)

        with Chronos("pipeline_total"):
            self.find_duplicates(confirm=confirm)
            log.hr(width=40)
            self.remove_exif(confirm=confirm)
            log.hr(width=40)
            self.resize(confirm=confirm)
            log.hr(width=40)
            self.compress(confirm=confirm)

        size_after = _dir_size_mb(self.dir)
        log.hr()
        lg_prt("wy", "Tamaño inicial:", f"{size_before:.2f} MB")
        lg_prt("wy", "Tamaño final:  ", f"{size_after:.2f} MB")
        lg_prt("gy", "Reducción:     ", f"{size_before - size_after:.2f} MB "
               f"({(1 - size_after / size_before) * 100:.1f} %)" if size_before else "—")
        log.hr()
