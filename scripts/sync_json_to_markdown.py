import os
import json

def json_to_markdown():
    os.makedirs('content/areas', exist_ok=True)
    with open('public/data/areas.json', 'r', encoding='utf-8') as f:
        areas = json.load(f)

    for area in areas:
        aid = area['id']
        md_path = f'content/areas/{aid}.md'
        
        lines = []
        lines.append(f"# {area.get('name', '')}")
        lines.append(f"**ID**: {aid}")
        lines.append(f"**Nombre Corto**: {area.get('shortName', '')}")
        lines.append(f"**Lema**: {area.get('tagline', '')}")
        lines.append("")
        lines.append("## Descripción")
        lines.append(area.get('description', ''))
        lines.append("")
        lines.append("## Objetivos")
        for obj in area.get('objectives', []):
            lines.append(f"- {obj}")
        lines.append("")
        lines.append("## Equipamiento")
        for eq in area.get('equipment', []):
            lines.append(f"- {eq}")
        lines.append("")
        lines.append("## Ejemplo Práctico")
        lines.append(area.get('practicalExample', ''))
        lines.append("")
        lines.append("## Proyectos y Talleres")
        for p in area.get('projects', []):
            lines.append(f"### {p.get('title', '')}")
            lines.append(f"- **ID**: {p.get('id', '')}")
            if p.get('instructor'):
                lines.append(f"- **Instructor**: {p.get('instructor')}")
            lines.append(f"- **Estado**: {p.get('status', 'Prototipo')}")
            if p.get('subArea'):
                lines.append(f"- **SubArea**: {p.get('subArea')}")
            lines.append(f"- **Descripción**: {p.get('description', '')}")
            lines.append("")

        with open(md_path, 'w', encoding='utf-8') as f_out:
            f_out.write('\n'.join(lines))
        print(f"Creado Markdown: {md_path}")

if __name__ == '__main__':
    json_to_markdown()
