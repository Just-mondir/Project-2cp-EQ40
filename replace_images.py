import os
import re

import sys

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if '<img' not in content:
        return

    # Check if Next.js Image is already imported
    has_image_import = 'import Image from' in content or 'import Image from ' in content

    # Using regex to replace <img ... /> or <img ...> with <Image ... fill />
    # We will use fill to maintain responsive sizes that were using classes.
    # Note: adding "fill" to Image components requires the parent to have relative style
    # But usually just replacing <img ... /> with <Image ... layout="fill" objectFit="cover" /> or just <Image ... fill={true} /> would break fewer things if we don't have w/h on img.
    # Actually, a safer approach is to regex the img tag, parsing the src, alt, className and putting it in an <Image>. Wait, NextJS 13+ Image needs width/height or `fill`.

    # Let's replace:
    # <img attrs /> -> <Image attrs fill />
    # <img attrs> -> <Image attrs fill />

    # Actually the prompt says: Replace all instances of `<img` with `<Image src={...} alt={...} width={...} height={...} />` (or `fill`). Import `Image` from `next/image` if not already imported.

    content_new = re.sub(r'<img\s+([^>]*?)(?:/?)>', r'<Image \1 fill />', content)

    # Some img tags might be split across lines. re.DOTALL is not needed if we use [^>]
    # If there are classes like "w-... h-..." the `fill` prop will expand to the parent.
    # Note: `fill` prop causes the Image to be position:absolute, which requires the parent element to have position:relative, position:fixed, or position:absolute.
    # Let's simply add width={500} height={500} as a fallback, or better: just replace `<img ` with `<Image ` and add NextJS boilerplate if required, wait, `img` tags don't require width/height in normal HTML, but Next/image does.
    # The prompt allows using `fill`.
    
    # Wait, instead of generic width/height or fill, let's just use `fill` but warn: this might break layouts if parent is not relative/absolute.
    # A safer naive approach: `width={0} height={0} sizes="100vw" style={{ width: '100%', height: 'auto' }}`

    content_new = re.sub(r'<img\b', r'<Image fill', content_new)
    
    
    # We still need to replace closing tag if it exists explicitly like </img> ? It shouldn't, img is void element.
    # Just basic text replacement: 
    # `<img ` -> `<Image fill `

    if not has_image_import:
        # Add import at the top of the file, after "use client" if it exists
        if '"use client"' in content_new or "'use client'" in content_new:
            content_new = re.sub(r'(["\']use client["\'];?\s*)', r'\1\nimport Image from "next/image";\n', content_new, count=1)
        else:
            content_new = 'import Image from "next/image";\n' + content_new

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content_new)

    print(f"Updated {filepath}")

if __name__ == "__main__":
    components_dir = "Frontend/kunuz-app/src/components"
    for root, dirs, files in os.walk(components_dir):
        for file in files:
            if file.endswith(".tsx"):
                process_file(os.path.join(root, file))

