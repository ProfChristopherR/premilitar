import os
import glob
import numpy as np
import tifffile
from PIL import Image

src = glob.glob('Media/**/result*.tif', recursive=True)[0]
print(f"Abriendo {src} con tifffile...")

with tifffile.TiffFile(src) as tif:
    # Check series or pages
    page = tif.pages[0]
    shape = page.shape
    print(f"Forma original del GeoTIFF: {shape}, dtype: {page.dtype}")
    
    # Calculate step/stride to get around 1800px
    h, w = shape[0], shape[1]
    step = max(1, max(h, w) // 1800)
    print(f"Decimando con paso: {step}...")
    
    # Read subsampled
    data = page.asarray(out='memmap')
    if len(shape) == 3:
        sub = data[::step, ::step, :3]
    else:
        sub = data[::step, ::step]
    
    if sub.dtype != np.uint8:
        # Normalize if needed
        sub = ((sub - sub.min()) / (sub.max() - sub.min() + 1e-5) * 255).astype(np.uint8)

    img = Image.fromarray(sub)
    if img.mode != 'RGB':
        img = img.convert('RGB')

    dest1 = os.path.join('public', 'assets', 'images', 'geomatica', 'fotogrametrias', 'Fundo Dadinco.jpg')
    dest2 = os.path.join('src', 'assets', 'media', 'tecnologia-geomatica', 'Fundo Dadinco.jpg')

    os.makedirs(os.path.dirname(dest1), exist_ok=True)
    os.makedirs(os.path.dirname(dest2), exist_ok=True)

    img.save(dest1, 'JPEG', quality=88)
    img.save(dest2, 'JPEG', quality=88)

    print(f"✓ Éxito: Guardado preview en {dest1} y {dest2}")
