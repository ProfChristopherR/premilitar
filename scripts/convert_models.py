"""
Convierte modelos .obj a .glb para uso en <model-viewer> en la web.
Usa trimesh para la conversión.
"""
import trimesh
import os

models = [
    {
        "input": r".\public\assets\models\autoinver.obj",
        "output": r".\public\assets\models\autoinver.glb",
        "name": "Autoinver"
    },
    {
        "input": r".\public\assets\models\dav-mobile-station.obj",
        "output": r".\public\assets\models\dav-mobile-station.glb",
        "name": "DAV Mobile Station"
    },
    {
        "input": r".\public\assets\models\detector-intrusos.obj",
        "output": r".\public\assets\models\detector-intrusos.glb",
        "name": "Detector de Intrusos"
    },
]

for m in models:
    print(f">> Procesando: {m['name']}")
    try:
        mesh = trimesh.load(m['input'])
        mesh.export(m['output'])
        size_mb = os.path.getsize(m['output']) / (1024 * 1024)
        print(f"[OK] {m['name']} -> {m['output']} ({size_mb:.1f} MB)")
    except Exception as e:
        print(f"[!] Error en {m['name']}: {e}")

print("[DONE] Conversion completada.")
