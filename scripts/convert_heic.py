import os
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

print("Buscando y convirtiendo archivos .HEIC a .JPG...")
converted = 0
for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '.system_generated' in root:
        continue
    for f in files:
        if f.lower().endswith('.heic'):
            src = os.path.join(root, f)
            dest = os.path.splitext(src)[0] + '.jpg'
            if not os.path.exists(dest):
                try:
                    im = Image.open(src)
                    im.convert('RGB').save(dest, 'JPEG', quality=92)
                    print(f"✓ Convertido: {src} -> {dest}")
                    converted += 1
                except Exception as e:
                    print(f"✗ Error en {src}: {e}")

print(f"\nListo. Total archivos nuevos convertidos: {converted}")
