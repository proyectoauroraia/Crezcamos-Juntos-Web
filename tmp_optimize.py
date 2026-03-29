import sys
import os

try:
    from PIL import Image
except ImportError:
    print("Pillow not installed")
    sys.exit(1)

input_path = "assets/originals/hero-image.jpg"
output_path = "assets/hero-image.webp"

img = Image.open(input_path)
print(f"Original image size: {img.size}")

# Try to find the best combination: Resize up to 1920px width first, then down to 1280px if needed.
# WebP quality 80 is perceptually "lossless" to most users.
widths = [img.size[0], 1920, 1600, 1280, 1024]
found = False

for w in widths:
    if w > img.size[0]:
        continue
    
    # Calculate height to keep aspect ratio
    h = int((w / img.size[0]) * img.size[1])
    resized_img = img.resize((w, h), Image.Resampling.LANCZOS)
    
    for quality in [85, 80, 75, 70, 60, 50]:
        resized_img.save(output_path, "WEBP", quality=quality, method=6)
        size_kb = os.path.getsize(output_path) / 1024
        if size_kb < 98:
            print(f"SUCCESS: Size {w}x{h}, Quality {quality}, file size: {size_kb:.2f} KB")
            found = True
            break
    if found:
        break

if not found:
    print("Could not get under 100kb even at lowest settings, stopping.")
