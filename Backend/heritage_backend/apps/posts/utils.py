import cloudinary.uploader

def upload_to_cloudinary(file, folder="posts"):
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type="image",
    )
    return result["secure_url"]