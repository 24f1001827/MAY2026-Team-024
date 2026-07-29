import os
from unittest.mock import patch
import pytest
from flask_jwt_extended import create_access_token

# Ensure Config reads test safe values when the application is imported.
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key")
os.environ.setdefault("DATABASE_URI", "sqlite:///:memory:")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-google-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-google-client-secret")

from app import create_app
from app.models import UserRole

@pytest.fixture
def app():
    """Create a test application without creating the default admin."""
    with patch("app.create_admin"):
        test_app = create_app()
    test_app.config.update({"TESTING": True})
    yield test_app

@pytest.fixture
def client(app):
    return app.test_client()

def _jwt_headers(app, user_id, role):
    """Create an Authorization header accepted by role_required()."""
    with app.app_context():
        token = create_access_token(
            identity=user_id,
            additional_claims={"role": role.value},
        )
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_headers(app):
    return _jwt_headers(app, "admin-test-user", UserRole.ADMIN)

@pytest.fixture
def officer_headers(app):
    return _jwt_headers(app, "officer-test-user", UserRole.OFFICER)

@pytest.fixture
def citizen_headers(app):
    return _jwt_headers(app, "citizen-test-user", UserRole.CITIZEN)
