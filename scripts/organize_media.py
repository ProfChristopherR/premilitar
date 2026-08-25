import os
import json
import shutil

with open('public/data/areas.json', 'r', encoding='utf-8') as f:
    areas = json.load(f)

media_base = 'public/assets/media'
os.makedirs(media_base, exist_ok=True)

# Define old folders mapping roughly to IDs
folder_mapping = {
    'instruccion-disciplina': 'public/assets/images/peloton-premilitar',
    'musica-identidad': 'public/assets/images/banda-de-guerra',
    'ciencia-criminalistica': 'public/assets/images/criminalistica',
    'tecnologia-geomatica': 'public/assets/images/geomatica'
}

for area in areas:
    aid = area['id']
    area_path = os.path.join(media_base, aid)
    os.makedirs(area_path, exist_ok=True)
    
    # Create empty enlaces.json
    with open(os.path.join(area_path, 'enlaces.json'), 'w', encoding='utf-8') as f:
        json.dump({"videos_youtube": [], "mapas_arcgis": []}, f, indent=2)

    # Move known old files to new structured folder if any exist
    if aid in folder_mapping:
        src_dir = folder_mapping[aid]
        if os.path.exists(src_dir):
            for file in os.listdir(src_dir):
                if os.path.isfile(os.path.join(src_dir, file)):
                    shutil.copy2(os.path.join(src_dir, file), area_path)

# Special cases
# GeoGo goes to tecnologia-geomatica
geogo_dir = 'public/assets/images/geogo/exposiciones'
if os.path.exists(geogo_dir):
    for f in os.listdir(geogo_dir):
        if os.path.isfile(os.path.join(geogo_dir, f)):
            shutil.copy2(os.path.join(geogo_dir, f), os.path.join(media_base, 'tecnologia-geomatica'))

geomatica_fotos_dir = 'public/assets/images/geomatica/fotogrametrias'
if os.path.exists(geomatica_fotos_dir):
    for f in os.listdir(geomatica_fotos_dir):
        if os.path.isfile(os.path.join(geomatica_fotos_dir, f)):
            shutil.copy2(os.path.join(geomatica_fotos_dir, f), os.path.join(media_base, 'tecnologia-geomatica'))

# Move videos to respective folders
videos_map = {
    'VID_20260604_102258.mp4': 'tecnologia-geomatica',
    'VID_20260814_112420.mp4': 'instruccion-disciplina',
    'VID_20260722_165456.mp4': 'tecnologia-geomatica'
}

for vid, dest in videos_map.items():
    src_vid = os.path.join('public/assets/videos', vid)
    if os.path.exists(src_vid):
        shutil.copy2(src_vid, os.path.join(media_base, dest))

print("Carpetas creadas y contenido migrado exitosamente a public/assets/media.")
