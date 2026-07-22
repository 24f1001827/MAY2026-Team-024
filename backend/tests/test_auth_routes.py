import pytest
from unittest.mock import patch, MagicMock

def test_google_login_redirect(client):
    """
    Test that hitting /google/login returns a 302 redirect 
    to the Google consent screen.
    """
    response = client.get("/api/v1/auth/google/login")
    
    assert response.status_code == 302
    assert "accounts.google.com" in response.headers["Location"]


@patch("app.routes.auth.AuthService.google_login")
@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_success(mock_authorize_token, mock_google_login, client):
    """
    Test that a successful token exchange with Google correctly 
    calls the AuthService and returns a 200 with JWT tokens.
    """
    mock_authorize_token.return_value = {
        "access_token": "fake-google-access-token",
        "userinfo": {
            "email": "citizen@example.com",
            "name": "Test Citizen",
            "sub": "google-uid-123"
        }
    }
    
    mock_google_login.return_value = {
        "access_token": "app-jwt-token",
        "refresh_token": "app-refresh-token",
        "user": {"email": "citizen@example.com", "role": "citizen"}
    }
    
    response = client.get("/api/v1/auth/google/callback")
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["access_token"] == "app-jwt-token"
    
    mock_google_login.assert_called_once_with(mock_authorize_token.return_value["userinfo"])


@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_missing_email(mock_authorize_token, client):
    """
    Test that the route returns 400 if Google's profile payload 
    does not include an email address.
    """
    mock_authorize_token.return_value = {
        "access_token": "fake-token",
        "userinfo": {
            "name": "Hidden Email User" 
        }
    }
    
    response = client.get("/api/v1/auth/google/callback")
    
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "Could not retrieve account details" in data["message"]

@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_auth_failure(mock_authorize_token, client):
    """
    Test that the route returns 401 if the token exchange fails 
    (e.g., the user clicked 'Cancel' on the consent screen).
    """
    mock_authorize_token.side_effect = Exception("User denied consent")
    
    response = client.get("/api/v1/auth/google/callback")
    
    assert response.status_code == 401
    data = response.get_json()
    assert data["success"] is False
    assert "Google authentication failed" in data["message"]

@patch("app.routes.auth.AuthService.register_citizen")
def test_standard_register_success(mock_register, client):
    """Test successful user registration via email and password."""
    
    from unittest.mock import MagicMock
    mock_user = MagicMock()
    mock_user.id = 1
    mock_user.name = "New Citizen"
    mock_user.email = "newuser@example.com"
    mock_user.role.value = "citizen"
    mock_user.status.value = "active"
    
    mock_register.return_value = mock_user
    
    response = client.post(
        "/api/v1/auth/register/citizen",
        json={
            "email": "newuser@example.com", 
            "password": "SecurePassword123!",
            "name": "New Citizen",
            "phone": "9876543210"
        }
    )
    
    assert response.status_code == 201, f"Failed: {response.get_json()}"
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["email"] == "newuser@example.com"

@patch("app.routes.auth.AuthService.login")
def test_standard_login_success(mock_login, client):
    """Test successful email/password login returning JWT tokens."""
    mock_login.return_value = {
        "access_token": "standard-jwt-token",
        "refresh_token": "standard-refresh-token",
        "user": {"email": "user@example.com", "role": "citizen"}
    }
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "SecurePassword123!"}
    )
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert data["data"]["access_token"] == "standard-jwt-token"

@patch("app.routes.auth.AuthService.login")
def test_standard_login_invalid_credentials(mock_login, client):
    """Test login rejection when credentials don't match."""
    mock_login.side_effect = ValueError("Invalid email or password.")
    
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "WrongPassword!"}
    )
    
    assert response.status_code == 401
    data = response.get_json()
    assert data["success"] is False
    assert "Invalid email or password." in data["message"]

@patch("app.routes.auth.AuthService.register_agency")
def test_agency_register_success(mock_register, client):
    """Test successful agency registration returning a pending approval message."""
    from unittest.mock import MagicMock
    mock_agency = MagicMock()
    mock_agency.id = 2
    mock_agency.name = "City Works Dept"
    mock_agency.email = "agency@example.com"
    mock_agency.role.value = "agency"
    mock_agency.status.value = "pending"
    
    mock_register.return_value = mock_agency
    
    response = client.post(
        "/api/v1/auth/register/agency",
        json={
            "email": "agency@example.com", 
            "password": "SecurePassword123!",
            "name": "City Works Dept",
            "phone": "9876543211",
            "registration_number": "REG-12345",
            "contact_person": "Jane Doe",
            "license_number": "LIC-999" 
        }
    )
    
    assert response.status_code == 201, f"Failed: {response.get_json()}"
    data = response.get_json()
    assert data["success"] is True
    assert "Awaiting admin approval" in data["message"]


@patch("app.routes.auth.AuthService.register_agency")
def test_agency_register_conflict(mock_register, client):
    """Test agency registration rejection when email/license already exists."""
    mock_register.side_effect = ValueError("Agency with this email already exists.")
    
    response = client.post(
        "/api/v1/auth/register/agency",
        json={
            "email": "existing_agency@example.com", 
            "password": "SecurePassword123!",
            "name": "Existing Agency",
            "phone": "9876543212",
            "registration_number": "REG-12345",
            "contact_person": "John Doe",
            "license_number": "LIC-888"
        }
    )
    
    assert response.status_code == 409
    data = response.get_json()
    assert data["success"] is False
    assert "already exists" in data["message"]

@patch("app.routes.auth.AuthService.register_agency")
def test_agency_register_forbidden(mock_register, client):
    """Test agency registration rejection due to permissions."""
    mock_register.side_effect = PermissionError("Not authorized to register agencies.")
    
    response = client.post(
        "/api/v1/auth/register/agency",
        json={
            "email": "hacker@example.com", 
            "password": "SecurePassword123!",
            "name": "Fake Agency",
            "phone": "9876543213",
            "registration_number": "REG-12345",
            "contact_person": "Hacker Man",
            "license_number": "LIC-000"         
        }
    )
    
    assert response.status_code == 403
    assert response.get_json()["success"] is False