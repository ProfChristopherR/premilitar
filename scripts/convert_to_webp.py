"""
convert_to_webp.py
Convierte todas las imágenes JPG/JPEG en src/assets/media/ a WebP,
mueve los originales a src/assets/media/_originals_jpg/ como respaldo
y actualiza todas las referencias en los archivos JSON.
"""

import os
import json
import shutil
from pathlib import Path
from PIL import Image

MEDIA_DIR = Path("src/assets/media")
BACKUP_DIR = MEDIA_DIR / "_originals_jpg"
QUALITY = 85
EXTENSIONS = {".jpg", ".jpeg"}

def convert_images():
    converted = []
    skipped = []
    errors = []

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    all_images = []
    for root, dirs, files in os.walk(MEDIA_DIR):
        root_path = Path(root)
        # No tocar la carpeta de respaldo
        if "_originals_jpg" in str(root_path):
            continue
        for f in files:
            ext = Path(f).suffix.lower()
            if ext in EXTENSIONS:
                all_images.append(root_path / f)

    print(f"Total imágenes a convertir: {len(all_images)}")

    for src_path in all_images:
        webp_path = src_path.with_suffix(".webp")

        # Calcular ruta relativa para el backup (misma estructura)
        rel_path = src_path.relative_to(MEDIA_DIR)
        backup_path = BACKUP_DIR / rel_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            # Abrir y convertir a WebP
            img = Image.open(src_path)
            # Convertir a RGB si tiene canal alpha (modo RGBA/P)
            if img.mode in ("RGBA", "P", "LA"):
                img = img.convert("RGBA")
                img.save(webp_path, "WEBP", quality=QUALITY, lossless=False)
            else:
                img = img.convert("RGB")
                img.save(webp_path, "WEBP", quality=QUALITY, lossless=False)

            # Mover original a carpeta de respaldo
            shutil.move(str(src_path), str(backup_path))

            orig_size = os.path.getsize(backup_path)
            webp_size = os.path.getsize(webp_path)
            savings = (1 - webp_size / orig_size) * 100

            converted.append({
                "original": str(src_path),
                "webp": str(webp_path),
                "original_kb": round(orig_size / 1024),
                "webp_kb": round(webp_size / 1024),
                "savings_pct": round(savings, 1)
            })
            print("  OK " + src_path.name + " -> " + webp_path.name + "  (" + str(orig_size//1024) + "KB -> " + str(webp_size//1024) + "KB, -" + str(round(savings)) + "%)") 

        except Exception as e:
            errors.append({"file": str(src_path), "error": str(e)})
            print("  ERROR " + src_path.name + ": " + str(e))

    return converted, skipped, errors


def update_json_references(converted):
    """Actualiza todas las referencias .jpg/.jpeg → .webp en los JSON de datos."""
    json_files = [
        "public/data/areas.json",
        "data/areas.json",
        "public/data/news.json",
        "data/news.json",
    ]
    # También detectar enlaces.json en subcarpetas de media
    for root, dirs, files in os.walk("src/assets/media"):
        for f in files:
            if f == "enlaces.json":
                json_files.append(os.path.join(root, f))

    total_replacements = 0
    for jf in json_files:
        if not os.path.exists(jf):
            continue
        with open(jf, "r", encoding="utf-8") as f:
            content = f.read()

        original_content = content
        # Reemplazar extensiones .jpg y .jpeg (case insensitive a través de variantes comunes)
        for ext in [".jpg", ".jpeg", ".JPG", ".JPEG"]:
            content = content.replace(ext, ".webp")

        if content != original_content:
            with open(jf, "w", encoding="utf-8") as f:
                f.write(content)
            replacements = original_content.count(".jpg") + original_content.count(".jpeg") + \
                           original_content.count(".JPG") + original_content.count(".JPEG")
            total_replacements += replacements
            print(f"  Actualizado: {jf} ({replacements} referencias)")

    return total_replacements


def print_summary(converted, errors):
    if not converted:
        print("\nNo se convirtió ninguna imagen.")
        return

    total_orig = sum(c["original_kb"] for c in converted)
    total_webp = sum(c["webp_kb"] for c in converted)
    total_savings = (1 - total_webp / total_orig) * 100

    print(f"\n{'='*60}")
    print(f"RESUMEN DE CONVERSIÓN")
    print(f"{'='*60}")
    print(f"  Imágenes convertidas : {len(converted)}")
    print(f"  Errores              : {len(errors)}")
    print(f"  Tamaño original      : {total_orig//1024} MB")
    print(f"  Tamaño WebP          : {total_webp//1024} MB")
    print(f"  Ahorro total         : {total_orig//1024 - total_webp//1024} MB ({total_savings:.1f}%)")
    print(f"\n  Originales JPG respaldados en: src/assets/media/_originals_jpg/")
    print(f"{'='*60}")

    if errors:
        print(f"\nERRORES:")
        for e in errors:
            print(f"  - {e['file']}: {e['error']}")


if __name__ == "__main__":
    print("[*] Iniciando conversion de imagenes a WebP...\n")

    print("PASO 1: Convirtiendo imágenes JPG/JPEG → WebP")
    converted, skipped, errors = convert_images()

    print("\nPASO 2: Actualizando referencias en archivos JSON")
    total_refs = update_json_references(converted)
    print(f"  Total de referencias actualizadas: {total_refs}")

    print_summary(converted, errors)
    print("\n[OK] Proceso completado. Recuerda hacer build y push a qa.")
