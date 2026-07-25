import cloudinary.uploader


def upload_image(image):
    """
    Upload image to Cloudinary.
    """

    response = cloudinary.uploader.upload(
        image,
        folder="complaints",
    )

    return response["secure_url"]


def delete_image(public_id):
    """
    Delete image from Cloudinary.
    """

    cloudinary.uploader.destroy(public_id)