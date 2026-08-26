import os
from moviepy import VideoFileClip

input_path = r".\Media\Videos\Premilitar con voz en off.mp4"
output_path = r".\public\assets\videos\video-institucional.mp4"

os.makedirs(os.path.dirname(output_path), exist_ok=True)

print("Cargando video original 1080p...")
clip = VideoFileClip(input_path)
print(f"Duración: {clip.duration}s, Resolución original: {clip.size}")

# 1080p Full HD a máxima fidelidad (~80 MB)
clip.write_videofile(
    output_path,
    codec="libx264",
    audio_codec="aac",
    bitrate="4800k",
    audio_bitrate="320k",
    preset="slow",
    ffmpeg_params=["-movflags", "faststart"]
)

size_mb = os.path.getsize(output_path) / (1024 * 1024)
print(f"✅ Video procesado exitosamente: {size_mb:.2f} MB")
clip.close()
