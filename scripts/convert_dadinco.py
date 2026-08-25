import os
import glob
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

files = glob.glob('Media/**/result*.tif', recursive=True)
if not files:
    print("No se encontró result*.tif")
    exit(1)

src = files[0]
print(f"Abriendo {src}...")

img = Image.open(src)
width, height = img.size
print(f"Dimensiones: {width}x{height}, modo: {img.mode}")

if width > 1800:
    ratio = 1800 / width
    new_size = (1800, int(height * ratio))
    print(f"Redimensionando a {new_size}...")
    img = img.resize(new_size, Image.Resampling.LANCZOS)

if img.mode != 'RGB':
    img = img.convert('RGB')

dest1 = os.path.join('public', 'assets', 'images', 'geomatica', 'fotogrametrias', 'Fundo Dadinco.jpg')
dest2 = os.path.join('src', 'assets', 'media', 'tecnologia-geomatica', 'Fundo Dadinco.jpg')

os.makedirs(os.path.dirname(dest1), exist_ok=True)
os.makedirs(os.path.dirname(dest2), exist_ok=True)

img.save(dest1, 'JPEG', quality=88)
img.save(dest2, 'JPEG', quality=88)

print(f"✓ Guardado exitosamente en:\n  1. {dest1}\n  2. {dest2}")
