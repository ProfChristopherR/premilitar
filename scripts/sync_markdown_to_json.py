import os
import re
import json

def parse_markdown_area(md_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = [l.strip() for l in content.split('\n')]
    
    name = ''
    aid = ''
    short_name = ''
    tagline = ''
    
    current_section = None
    description_lines = []
    objectives = []
    equipment = []
    practical_lines = []
    projects = []
    current_proj = None

    for line in lines:
        if line.startswith('# '):
            name = line.replace('# ', '').strip()
            continue
        if line.startswith('**ID**:'):
            aid = line.split('**ID**:')[1].strip()
            continue
        if line.startswith('**Nombre Corto**:'):
            short_name = line.split('**Nombre Corto**:')[1].strip()
            continue
        if line.startswith('**Lema**:'):
            tagline = line.split('**Lema**:')[1].strip()
            continue
        
        if line.startswith('## Descripción'):
            current_section = 'desc'
            continue
        elif line.startswith('## Objetivos'):
            current_section = 'obj'
            continue
        elif line.startswith('## Equipamiento'):
            current_section = 'eq'
            continue
        elif line.startswith('## Ejemplo Práctico'):
            current_section = 'prac'
            continue
        elif line.startswith('## Proyectos y Talleres'):
            current_section = 'proj'
            continue
        
        if current_section == 'desc':
            if line.startswith('##'):
                continue
            if line:
                description_lines.append(line)
        elif current_section == 'obj':
            if line.startswith('- '):
                objectives.append(line[2:].strip())
        elif current_section == 'eq':
            if line.startswith('- '):
                equipment.append(line[2:].strip())
        elif current_section == 'prac':
            if line.startswith('##'):
                continue
            if line:
                practical_lines.append(line)
        elif current_section == 'proj':
            if line.startswith('### '):
                if current_proj:
                    projects.append(current_proj)
                title = line.replace('### ', '').strip()
                current_proj = {
                    'id': title.lower().replace(' ', '-'),
                    'title': title,
                    'status': 'Prototipo',
                    'description': ''
                }
            elif current_proj:
                if line.startswith('- **ID**:'):
                    current_proj['id'] = line.split('- **ID**:')[1].strip()
                elif line.startswith('- **Instructor**:'):
                    current_proj['instructor'] = line.split('- **Instructor**:')[1].strip()
                elif line.startswith('- **Estado**:'):
                    current_proj['status'] = line.split('- **Estado**:')[1].strip()
                elif line.startswith('- **SubArea**:'):
                    current_proj['subArea'] = line.split('- **SubArea**:')[1].strip()
                elif line.startswith('- **Descripción**:'):
                    current_proj['description'] = line.split('- **Descripción**:')[1].strip()

    if current_proj:
        projects.append(current_proj)

    return {
        'id': aid,
        'name': name,
        'shortName': short_name or name,
        'tagline': tagline,
        'description': ' '.join(description_lines),
        'objectives': objectives,
        'equipment': equipment,
        'practicalExample': ' '.join(practical_lines),
        'projects': projects
    }

def sync_all_markdown():
    if not os.path.exists('content/areas'):
        print('No existe content/areas')
        return

    # Load existing areas.json to preserve icons, accentColors, 3D models and media settings
    with open('public/data/areas.json', 'r', encoding='utf-8') as f:
        existing_areas = json.load(f)
    
    area_dict = {a['id']: a for a in existing_areas}

    for f in os.listdir('content/areas'):
        if f.endswith('.md'):
            md_path = os.path.join('content/areas', f)
            parsed = parse_markdown_area(md_path)
            aid = parsed['id']
            if aid in area_dict:
                area_dict[aid]['name'] = parsed['name']
                area_dict[aid]['shortName'] = parsed['shortName']
                area_dict[aid]['tagline'] = parsed['tagline']
                area_dict[aid]['description'] = parsed['description']
                area_dict[aid]['objectives'] = parsed['objectives']
                area_dict[aid]['equipment'] = parsed['equipment']
                # Preservar configuraciones de ArcGIS y metadatos en proyectos
                existing_proj_dict = {p['id']: p for p in area_dict[aid].get('projects', [])}
                merged_projects = []
                for p in parsed['projects']:
                    pid = p['id']
                    if pid in existing_proj_dict:
                        merged = {**existing_proj_dict[pid], **p}
                        merged_projects.append(merged)
                    else:
                        merged_projects.append(p)
                area_dict[aid]['projects'] = merged_projects
                print(f"Sincronizado área: {aid} desde {f}")

    updated_areas = list(area_dict.values())

    with open('public/data/areas.json', 'w', encoding='utf-8') as f_out:
        json.dump(updated_areas, f_out, ensure_ascii=False, indent=2)

    with open('data/areas.json', 'w', encoding='utf-8') as f_out:
        json.dump(updated_areas, f_out, ensure_ascii=False, indent=2)

    print("\nareas.json actualizado con éxito a partir de los archivos Markdown.")

if __name__ == '__main__':
    sync_all_markdown()
