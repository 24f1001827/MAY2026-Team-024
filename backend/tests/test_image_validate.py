from io import BytesIO
import pytest
from marshmallow import ValidationError
from werkzeug.datastructures import FileStorage
from app.utils.image_validate import MAX_IMAGES, MAX_IMAGE_SIZE, validate_images

def make_image(filename="pothole.jpg", content=b"image-content"):
    return FileStorage(
        stream=BytesIO(content),
        filename=filename,
        content_type="image/jpeg",
    )

def test_validate_images_accepts_valid_images():
    images = [
        make_image("road.jpg"),
        make_image("water.jpeg"),
        make_image("streetlight.png"),
    ]

    assert validate_images(images) is None

def test_validate_images_requires_at_least_one_image():
    with pytest.raises(ValidationError) as error:
        validate_images([])

    assert error.value.messages == {
        "images": ["At least one image is required."]
    }

def test_validate_images_rejects_too_many_images():
    images = [make_image(f"image-{i}.jpg") for i in range(MAX_IMAGES + 1)]

    with pytest.raises(ValidationError) as error:
        validate_images(images)

    assert error.value.messages == {
        "images": [f"You can upload a maximum of {MAX_IMAGES} images."]
    }

def test_validate_images_rejects_empty_filename():
    with pytest.raises(ValidationError) as error:
        validate_images([make_image("")])

    assert error.value.messages == {
        "images": ["Invalid image selected."]
    }

@pytest.mark.parametrize(
    "filename",
    [
        "document.pdf",
        "malware.exe",
        "image.gif",
        "image.webp",
        "file-without-extension",
    ],
)
def test_validate_images_rejects_invalid_extensions(filename):
    with pytest.raises(ValidationError) as error:
        validate_images([make_image(filename)])

    assert error.value.messages == {
        "images": ["Only JPG, JPEG and PNG images are allowed."]
    }

def test_validate_images_rejects_oversized_image():
    image = make_image(
        "large-image.jpg",
        b"x" * (MAX_IMAGE_SIZE + 1),
    )

    with pytest.raises(ValidationError) as error:
        validate_images([image])

    assert error.value.messages == {
        "images": [
            "'large-image.jpg' exceeds the maximum size of 10 MB."
        ]
    }

def test_validate_images_resets_file_pointer():
    image = make_image("pothole.jpg", b"abc123")

    validate_images([image])

    assert image.stream.tell() == 0