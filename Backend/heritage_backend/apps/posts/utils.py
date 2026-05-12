import cloudinary.uploader

def upload_to_cloudinary(file, folder="posts", resource_type="image"):
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type=resource_type,
    )
    return result["secure_url"]
