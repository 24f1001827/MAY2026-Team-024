from marshmallow import ValidationError

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
MAX_IMAGES = 5
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def validate_images(images):
    """
    Validate uploaded complaint images.
    """

    if not images:
        raise ValidationError(
            {
                "images": [
                    "At least one image is required."
                ]
            }
        )

    if len(images) > MAX_IMAGES:
        raise ValidationError(
            {
                "images": [
                    f"You can upload a maximum of {MAX_IMAGES} images."
                ]
            }
        )

    for image in images:

        if image.filename == "":
            raise ValidationError(
                {
                    "images": [
                        "Invalid image selected."
                    ]
                }
            )

        extension = image.filename.rsplit(".", 1)[-1].lower()

        if extension not in ALLOWED_EXTENSIONS:
            raise ValidationError(
                {
                    "images": [
                        "Only JPG, JPEG and PNG images are allowed."
                    ]
                }
            )

        # Check file size
        image.seek(0, 2)      # Move cursor to end
        file_size = image.tell()
        image.seek(0)         # Reset cursor

        if file_size > MAX_IMAGE_SIZE:
            raise ValidationError(
                {
                    "images": [
                        f"'{image.filename}' exceeds the maximum size of 10 MB."
                    ]
                }
            )