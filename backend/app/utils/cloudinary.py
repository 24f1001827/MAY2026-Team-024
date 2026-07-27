import cloudinary.uploader


def upload_image(image):
    """
    Upload image to Cloudinary.
    """

    response = cloudinary.uploader.upload(
        image,
        folder="complaints",
    )

    return {
        "image_url": response["secure_url"],
        "public_id": response["public_id"],
    }

def delete_image(public_id):
    """
    Delete image from Cloudinary.
    """

    cloudinary.uploader.destroy(public_id)