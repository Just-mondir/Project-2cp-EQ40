import os
path = r"src/app/home-page/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace('onError={() = fill style={{ objectFit: "cover" }} /> setImgError(true)} />', 'onError={() => setImgError(true)} fill style={{ objectFit: "cover" }} />')

with open(path, "w", encoding="utf-8") as f:
    f.write(text)
print("done")
