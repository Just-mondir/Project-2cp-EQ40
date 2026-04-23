import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '<img' not in content:
        return

    # check if 'next/image' is imported
    has_import = 'import Image from "next/image"' in content or "import Image from 'next/image'" in content

    # Replace <img attrs> with <Image attrs fill={true} />
    # Also we need to catch multi-line
    new_content = re.sub(
        r'<img\b([^>]*?)(/?)>', 
        lambda m: f'<Image{m.group(1)} fill={{{True}}} alt={{""}} />' if 'alt=' not in m.group(1) else f'<Image{m.group(1)} fill={{{True}}} />', 
        content,
        flags=re.IGNORECASE | re.DOTALL
    )

    # Some images might already use 'className' which we keep.
    if not has_import:
        if '"use client"' in new_content:
            new_content = new_content.replace('"use client";', '"use client";\nimport Image from "next/image";')
            new_content = new_content.replace('"use client"', '"use client"\nimport Image from "next/image";')
        else:
            new_content = 'import Image from "next/image";\n' + new_content

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Updated {filepath}")

components_dir = "src/components"
for root, dirs, files in os.walk(components_dir):
    for file in files:
        if file.endswith(".tsx"):
            process_file(os.path.join(root, file))
