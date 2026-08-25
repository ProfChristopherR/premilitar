import os
from moviepy import VideoFileClip

input_videos = [
    r".\Media\Videos\Exposiciones Geogo\VID_20260604_102258.mp4",
    r".\Media\Videos\banda de guerra y peloton\VID_20260814_112420.mp4",
    r".\Media\Videos\vuelo fpv\VID_20260722_165456.mp4"
]

output_dir = r".\public\assets\videos"

for vid_path in input_videos:
    try:
        filename = os.path.basename(vid_path)
        out_path = os.path.join(output_dir, filename)
        
        print(f"Procesando {filename}...")
        clip = VideoFileClip(vid_path)
        
        # Extract a 15-second clip from the middle to avoid shaky starts/ends
        duration = clip.duration
        start_time = duration / 2 - 7.5
        end_time = duration / 2 + 7.5
        
        if start_time < 0:
            start_time = 0
            end_time = min(15, duration)
            
        subclip = clip.subclipped(start_time, end_time)
        
        # Resize to 720p maximum to save space for web
        if subclip.h > 720:
            subclip = subclip.resized(height=720)
            
        subclip.write_videofile(out_path, codec="libx264", audio_codec="aac", bitrate="1000k")
        print(f"Guardado {out_path}")
        clip.close()
    except Exception as e:
        print(f"Error procesando {vid_path}: {e}")

print("Edición de video completada.")
