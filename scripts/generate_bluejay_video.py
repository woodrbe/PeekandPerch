"""
Generates a 720x1280 24fps 10-second looping MP4 video for the Blue Jay mascot
matching the exact format and style of cardinal animated.mp4 and golden animated.mp4.
"""

import math
import numpy as np
from PIL import Image, ImageOps
import av
import os

OUTPUT_VIDEO = "src/assets/images/bluejay animated.mp4"
FRAME_WIDTH = 720
FRAME_HEIGHT = 1280
FPS = 24
TOTAL_SECONDS = 10
TOTAL_FRAMES = FPS * TOTAL_SECONDS

IMG_1_PATH = "src/assets/images/bluejay_character_1790964142504.jpg"
IMG_2_PATH = r"C:\Users\benwo\.gemini\antigravity\brain\4f1559fd-b246-4e69-a49b-295ed1e4f71a\bluejay_pose_look_1790964575420.jpg"
IMG_3_PATH = r"C:\Users\benwo\.gemini\antigravity\brain\4f1559fd-b246-4e69-a49b-295ed1e4f71a\bluejay_pose_chirp_1790964589332.jpg"

def load_and_prep_image(path):
    img = Image.open(path).convert("RGBA")
    # Convert white background to transparent or clean
    return img

def create_frame(im1, im2, im3, t_norm, frame_idx):
    """
    Renders frame at t_norm [0..1]
    """
    # 1. Determine keyframe weights using smooth cyclic bell curves
    # Pose 1 (Proud Point): Peaks at 0.0 and 1.0 (start/end) and around 0.8
    # Pose 3 (Wink & Tilt): Peaks at 0.32 (approx 3.2s)
    # Pose 2 (Wings Open): Peaks at 0.65 (approx 6.5s)
    
    # Weight functions with smooth cosine transitions
    t_rad = t_norm * 2 * math.pi
    
    # Gaussian-like weights around peak times
    def weight(t, center, width):
        d = min(abs(t - center), abs(t - center - 1.0), abs(t - center + 1.0))
        return math.exp(- (d / width) ** 2)

    w1 = weight(t_norm, 0.0, 0.22) + weight(t_norm, 1.0, 0.22) + weight(t_norm, 0.88, 0.18)
    w3 = weight(t_norm, 0.32, 0.18) # Wink
    w2 = weight(t_norm, 0.62, 0.20) # Open wings

    total_w = w1 + w2 + w3
    w1 /= total_w
    w2 /= total_w
    w3 /= total_w

    # 2. Kinematic physical motion (breathing, floating, slight rotation)
    # Breathing: ~2.5 breath cycles over 10 seconds
    breath = math.sin(t_rad * 2.5) * 0.015
    scale = 1.0 + breath

    # Floating bob: ~1.5 cycles
    bob_y = math.sin(t_rad * 1.5) * 12.0
    # Inquisitive head/body tilt: slight angle
    tilt_deg = math.sin(t_rad * 2.0) * 1.5

    # 3. Blend base images
    arr1 = np.array(im1, dtype=np.float32)
    arr2 = np.array(im2, dtype=np.float32)
    arr3 = np.array(im3, dtype=np.float32)

    blended_arr = (arr1 * w1 + arr2 * w2 + arr3 * w3)
    blended_arr = np.clip(blended_arr, 0, 255).astype(np.uint8)
    blended_img = Image.fromarray(blended_arr, "RGBA")

    # 4. Apply scale and rotation
    # Fit character into target dimensions (approx 640x640 within 720x1280)
    target_char_size = 640
    char_w = int(target_char_size * scale)
    char_h = int(target_char_size * scale)
    
    resized_char = blended_img.resize((char_w, char_h), Image.Resampling.LANCZOS)
    if abs(tilt_deg) > 0.01:
        resized_char = resized_char.rotate(tilt_deg, resample=Image.Resampling.BICUBIC, expand=True, fillcolor=(255,255,255,255))

    # 5. Composite onto 720x1280 pure white canvas
    canvas = Image.new("RGB", (FRAME_WIDTH, FRAME_HEIGHT), (255, 255, 255))
    
    # Center horizontally, position slightly above middle vertically (so feet are on perch)
    pos_x = (FRAME_WIDTH - resized_char.width) // 2
    pos_y = int((FRAME_HEIGHT - resized_char.height) // 2 + 15 + bob_y)

    # Paste using alpha mask or RGB
    if resized_char.mode == "RGBA":
        canvas.paste(resized_char, (pos_x, pos_y), resized_char)
    else:
        canvas.paste(resized_char, (pos_x, pos_y))

    return np.array(canvas)

import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("Starting Blue Jay Mascot Video Synthesis...")
    
    im1 = load_and_prep_image(IMG_1_PATH).resize((640, 640), Image.Resampling.LANCZOS)
    im2 = load_and_prep_image(IMG_2_PATH).resize((640, 640), Image.Resampling.LANCZOS)
    im3 = load_and_prep_image(IMG_3_PATH).resize((640, 640), Image.Resampling.LANCZOS)

    os.makedirs(os.path.dirname(OUTPUT_VIDEO), exist_ok=True)

    # Setup PyAV H.264 MP4 Container
    container = av.open(OUTPUT_VIDEO, mode='w')
    stream = container.add_stream('libx264', rate=FPS)
    stream.width = FRAME_WIDTH
    stream.height = FRAME_HEIGHT
    stream.pix_fmt = 'yuv420p'
    stream.options = {
        'crf': '17',
        'preset': 'medium',
        'profile': 'high',
        'tune': 'animation'
    }

    print(f"Rendering {TOTAL_FRAMES} frames ({TOTAL_SECONDS}s at {FPS}fps)...")

    for i in range(TOTAL_FRAMES):
        t_norm = i / float(TOTAL_FRAMES)
        frame_rgb = create_frame(im1, im2, im3, t_norm, i)

        frame = av.VideoFrame.from_ndarray(frame_rgb, format='rgb24')
        for packet in stream.encode(frame):
            container.mux(packet)

        if (i + 1) % 48 == 0 or i == TOTAL_FRAMES - 1:
            pct = int(((i + 1) / TOTAL_FRAMES) * 100)
            print(f"   Progress: {pct}% ({i+1}/{TOTAL_FRAMES} frames rendered)")

    # Flush stream
    for packet in stream.encode():
        container.mux(packet)

    container.close()
    
    file_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print(f"Video created successfully: {OUTPUT_VIDEO} ({file_size_mb:.2f} MB)")

if __name__ == "__main__":
    main()
