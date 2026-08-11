"""Tests for external upload, security and default admin utilities."""
from unittest.mock import MagicMock, patch
import pytest

@patch("app.utils.cloudinary.cloudinary.uploader")
def test_upload_image_returns_cloudinary_identifiers(mock_uploader):
    mock_uploader.upload.return_value = {"secure_url": "https://image", "public_id": "img-1"}
    from app.utils.cloudinary import upload_image
    image = MagicMock()
    assert upload_image(image) == {"image_url": "https://image", "public_id": "img-1"}
    mock_uploader.upload.assert_called_once_with(image, folder="complaints")

@patch("app.utils.cloudinary.cloudinary.uploader")
def test_upload_document_and_delete_image(mock_uploader):
    mock_uploader.upload.return_value = {"secure_url": "https://document", "public_id": "doc-1"}
    from app.utils.cloudinary import upload_document, delete_image
    assert upload_document("file", "proposal_documents") == {"document_url": "https://document", "public_id": "doc-1"}
    delete_image("doc-1")
    mock_uploader.destroy.assert_called_once_with("doc-1")

def test_password_hashing_and_verification():
    from app.utils.security import hash_password, verify_password
    hashed = hash_password("StrongPass123!")
    assert hashed != "StrongPass123!"
    assert verify_password("StrongPass123!", hashed) is True
    assert verify_password("wrong", hashed) is False

@patch("app.utils.security.create_refresh_token", return_value="refresh-token")
@patch("app.utils.security.create_access_token", return_value="access-token")
def test_token_helpers_include_expected_identity_and_claims(mock_access, mock_refresh):
    from app.utils.security import generate_access_token, generate_refresh_token
    user = MagicMock(id=1, email="user@example.com"); user.role.value = "citizen"
    assert generate_access_token(user) == "access-token"
    assert generate_refresh_token(user) == "refresh-token"
    mock_access.assert_called_once_with(identity="1", additional_claims={"email": "user@example.com", "role": "citizen"})
    mock_refresh.assert_called_once_with(identity="1")

@patch.dict("os.environ", {}, clear=True)
def test_create_admin_requires_environment_credentials(app):
    from app.utils.admin_create import create_admin
    with app.app_context(), patch("app.utils.admin_create.inspect") as mock_inspect:
        mock_inspect.return_value.get_table_names.return_value = ["users"]
        with pytest.raises(ValueError, match="ADMIN_EMAIL"):
            create_admin()

@patch("app.utils.admin_create.User")
@patch("app.utils.admin_create.db.session")
@patch("app.utils.admin_create.hash_password", return_value="hashed")
@patch.dict("os.environ", {"ADMIN_EMAIL": "admin@example.com", "ADMIN_PASSWORD": "password"}, clear=True)
def test_create_admin_creates_default_admin(mock_hash, mock_db, mock_user, app):
    from app.utils.admin_create import create_admin
    mock_user.query.filter_by.return_value.first.return_value = None
    with app.app_context(), patch("app.utils.admin_create.inspect") as mock_inspect:
        mock_inspect.return_value.get_table_names.return_value = ["users"]
        create_admin()
    mock_user.assert_called_once()
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
