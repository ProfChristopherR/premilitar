import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None # Disable DecompressionBombError

input_dir = r".\public\assets\images\geomatica\fotogrametrias"
output_dir = r".\public\assets\images\geomatica\fotogrametrias"

tifs = [f for f in os.listdir(input_dir) if f.endswith('.tif')]

for tif in tifs:
    print(f"Procesando {tif}...")
    try:
        img_path = os.path.join(input_dir, tif)
        img = Image.open(img_path)
        
        # Calculate new size to avoid massive resolution, keep it max 2000px wide
        width, height = img.size
        if width > 2000:
            ratio = 2000 / width
            new_size = (2000, int(height * ratio))
            img = img.resize(new_size, Image.Resampling.LANCZOS)
        
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        out_path = os.path.join(output_dir, tif.replace('.tif', '.jpg'))
        img.save(out_path, "JPEG", quality=85)
        print(f"Guardado como {out_path}")
    except Exception as e:
        print(f"Error procesando {tif}: {e}")
