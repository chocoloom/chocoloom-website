import os
import subprocess
import glob

IMAGE_DIRS = [
    'Anniversary Cakes',
    'Bachelor Cakes',
    'Half Birthday Cakes',
    'Wedding Cakes',
    'chocoloom desert',
    'desserts',
    'assets',
    'workshop/assets'
]

total_before = 0
total_after = 0
processed_count = 0

for d in IMAGE_DIRS:
    if not os.path.exists(d):
        continue
    for root, _, files in os.walk(d):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ['.png', '.jpg', '.jpeg']:
                file_path = os.path.join(root, f)
                try:
                    size = os.path.getsize(file_path)
                except Exception:
                    continue
                
                # Only optimize files larger than 250 KB
                if size > 250 * 1024:
                    total_before += size
                    temp_out = file_path + '.opt.tmp'
                    cmd = [
                        'sips',
                        '-s', 'format', 'jpeg',
                        '-s', 'formatOptions', '82',
                        '--resampleHeightWidthMax', '900',
                        file_path,
                        '--out', temp_out
                    ]
                    try:
                        res = subprocess.run(cmd, capture_output=True, text=True)
                        if os.path.exists(temp_out) and os.path.getsize(temp_out) > 0:
                            new_size = os.path.getsize(temp_out)
                            if new_size < size:
                                os.replace(temp_out, file_path)
                                total_after += new_size
                                processed_count += 1
                                print(f"Optimized: {file_path} ({size // 1024} KB -> {new_size // 1024} KB)")
                            else:
                                os.remove(temp_out)
                                total_after += size
                        else:
                            total_after += size
                    except Exception as e:
                        if os.path.exists(temp_out):
                            os.remove(temp_out)
                        total_after += size
                else:
                    total_before += size
                    total_after += size

print("\n--- OPTIMIZATION SUMMARY ---")
print(f"Images optimized: {processed_count}")
print(f"Total size before: {total_before / (1024 * 1024):.2f} MB")
print(f"Total size after:  {total_after / (1024 * 1024):.2f} MB")
print(f"Saved:             {(total_before - total_after) / (1024 * 1024):.2f} MB")

