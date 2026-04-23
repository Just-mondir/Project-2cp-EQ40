import os

src_dir = r"Frontend/kunuz-app/src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            
            new_lines = []
            import_seen = False
            changed = False
            for line in lines:
                if "import Image from \"next/image\"" in line or "import Image from 'next/image'" in line:
                    if import_seen:
                        changed = True
                        continue
                    else:
                        if ";;" in line:
                            line = line.replace(";;", ";")
                            changed = True
                        import_seen = True
                new_lines.append(line)
            
            if changed:
                with open(path, "w", encoding="utf-8") as f:
                    f.writelines(new_lines)
                print(f"Fixed {path}")
