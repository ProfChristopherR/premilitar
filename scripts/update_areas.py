import json
import os
import urllib.parse

# Load json
with open('public/data/areas.json', 'r', encoding='utf-8') as f:
    areas = json.load(f)

# The local images mapped by folders
images = {
    'instruccion-disciplina': [
        '/assets/images/banda-de-guerra/IMG_0926.jpg',
        '/assets/images/banda-de-guerra/IMG_0927.jpg',
        '/assets/images/banda-de-guerra/IMG_0938.jpg',
        '/assets/images/banda-de-guerra/IMG_1018.jpg',
        '/assets/images/banda-de-guerra/IMG_1029.jpg',
        '/assets/images/banda-de-guerra/IMG_1713.jpg',
        '/assets/images/banda-de-guerra/IMG_1995.jpg'
    ],
    'acondicionamiento-liderazgo': [
        '/assets/images/peloton-premilitar/IMG_0060.jpg',
        '/assets/images/peloton-premilitar/IMG_0063.jpg',
        '/assets/images/peloton-premilitar/IMG_0086.jpg',
        '/assets/images/peloton-premilitar/IMG_0151.jpg',
        '/assets/images/peloton-premilitar/IMG_0159.jpg'
    ],
    'ciencia-criminalistica': [
        '/assets/images/criminalistica/Gemini_Generated_Image_ag3foaag3foaag3f.jpg',
        '/assets/images/criminalistica/IMG_9123.jpg',
        '/assets/images/criminalistica/IMG_9151.jpg',
        '/assets/images/criminalistica/WhatsApp Image 2026-08-25 at 12.08.45.jpeg',
        '/assets/images/criminalistica/WhatsApp Image 2026-08-25 at 12.08.55.jpeg'
    ],
    'tecnologia-geomatica': [
        '/assets/images/geogo/exposiciones/WhatsApp Image 2026-08-25 at 12.03.35 (1).jpeg',
        '/assets/images/geogo/exposiciones/WhatsApp Image 2026-08-25 at 12.03.37.jpeg',
        '/assets/images/geogo/exposiciones/WhatsApp Image 2026-08-25 at 12.08.59 (1).jpeg',
        '/assets/images/geogo/exposiciones/WhatsApp Image 2026-08-25 at 12.08.59.jpeg',
        '/assets/images/geomatica/WhatsApp Image 2026-06-16 at 16.21.05.jpeg',
        '/assets/images/geomatica/WhatsApp Image 2026-06-16 at 16.21.10 (1).jpeg',
        '/assets/images/geomatica/WhatsApp Image 2026-06-16 at 16.21.13.jpeg',
        '/assets/images/geomatica/WhatsApp Image 2026-06-16 at 16.21.26.jpeg',
        '/assets/images/geomatica/WhatsApp Image 2026-06-16 at 16.21.30.jpeg'
    ]
}

for area in areas:
    aid = area['id']
    
    # 1. Update Gallery
    if aid in images:
        gallery_list = [{"url": urllib.parse.quote(p), "caption": "Registro fotográfico"} for p in images[aid]]
        if 'media' not in area:
            area['media'] = {}
        area['media']['gallery'] = gallery_list
    else:
        # Clear dummy images for areas we don't have
        if 'media' in area and 'gallery' in area['media']:
            area['media']['gallery'] = []

    # 2. Update Videos (remove dummy youtube)
    if 'media' in area and 'videos' in area['media']:
        videos = area['media']['videos']
        real_videos = [v for v in videos if 'dQw4w9WgXcQ' not in v['url']]
        area['media']['videos'] = real_videos

    # 3. Clean Projects
    if aid != 'tecnologia-geomatica':
        if 'projects' in area:
            area['projects'] = []
    else:
        # 4. Fix Autoinver
        if 'projects' in area:
            for p in area['projects']:
                if 'Autoinver' in p['title']:
                    p['title'] = "Invernadero Inteligente: Autoinver"
                    p['description'] = "Prototipo de invernadero inteligente para monitoreo y control ambiental autónomo."
                    p['image'] = "/assets/images/geogo/proyectos/Gemini_Generated_Image_6r9kuc6r9kuc6r9k.jpg"

with open('public/data/areas.json', 'w', encoding='utf-8') as f:
    json.dump(areas, f, ensure_ascii=False, indent=2)

print("Datos actualizados correctamente.")
