import os
import subprocess
import imageio_ffmpeg

ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

def convert_all_heic():
    converted_count = 0
    for root, dirs, files in os.walk('.'):
        # Ignore node_modules and .git
        if 'node_modules' in root or '.git' in root or '.system_generated' in root:
            continue
        for f in files:
            if f.lower().endswith(('.heic', '.heif')):
                heic_path = os.path.join(root, f)
                jpg_path = os.path.splitext(heic_path)[0] + '.jpg'
                print(f"Convirtiendo HEIC a JPG: {heic_path} -> {jpg_path}")
                res = subprocess.run([ffmpeg_exe, '-y', '-i', heic_path, '-q:v', '2', jpg_path], capture_output=True)
                if res.returncode == 0:
                    converted_count += 1
                    # Remove original heic so it doesn't duplicate
                    try:
                        os.remove(heic_path)
                        print(f"  [OK] Convertido y original HEIC eliminado: {heic_path}")
                    except Exception as e:
                        print(f"  [OK] Convertido a JPG ({e})")
                else:
                    print(f"  [ERROR] No se pudo convertir {heic_path}")

    print(f"\nProceso finalizado. Total de imágenes HEIC convertidas a JPG: {converted_count}")

if __name__ == '__main__':
    convert_all_heic()
