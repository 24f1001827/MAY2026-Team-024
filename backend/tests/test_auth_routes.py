import pytest
from unittest.mock import patch, MagicMock

# ==========================================
# 1. GOOGLE LOGIN REDIRECT API (3 Tests)
# ==========================================

def test_google_login_redirect(client):
    """Test 1.1 (Happy): Hitting /google/login returns a 302 redirect."""
    response = client.get("/api/v1/auth/google/login")
    assert response.status_code == 302
    assert "accounts.google.com" in response.headers["Location"]

def test_google_login_invalid_method(client):
    """Test 1.2 (Negative): The redirect endpoint rejects POST requests."""
    response = client.post("/api/v1/auth/google/login")
    assert response.status_code == 405  # Method Not Allowed

@patch("app.routes.auth.oauth.google.authorize_redirect")
def test_google_login_server_error(mock_redirect, client):
    """Test 1.3 (Security/Edge): Endpoint handles configuration errors."""
    mock_redirect.side_effect = Exception("OAuth client not configured")
    response = client.get("/api/v1/auth/google/login")
    assert response.status_code == 500


# ==========================================
# 2. GOOGLE OAUTH CALLBACK API (3 Tests)
# ==========================================

@patch("app.routes.auth.AuthService.google_login")
@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_success(mock_authorize_token, mock_google_login, client):
    """Test 2.1 (Happy): Successful token exchange returns JWTs."""
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
    """Test 2.2 (Negative): Returns 400 if Google payload is missing email."""
    mock_authorize_token.return_value = {
        "access_token": "fake-token",
        "userinfo": {"name": "Hidden Email User"}
    }
    response = client.get("/api/v1/auth/google/callback")
    assert response.status_code == 400
    assert response.get_json()["success"] is False

@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_auth_failure(mock_authorize_token, client):
    """Test 2.3 (Security/Edge): Returns 401 if user denies consent."""
    mock_authorize_token.side_effect = Exception("User denied consent")
    response = client.get("/api/v1/auth/google/callback")
    assert response.status_code == 401
    assert response.get_json()["success"] is False


# ==========================================
# 3. CITIZEN REGISTRATION API (3 Tests)
# ==========================================

@patch("app.routes.auth.AuthService.register_citizen")
def test_standard_register_success(mock_register, client):
    """Test 3.1 (Happy): Successful user registration."""
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
    assert response.status_code == 201
    assert response.get_json()["success"] is True

def test_standard_register_missing_fields(client):
    """Test 3.2 (Negative): Registration rejection due to missing schema fields."""
    response = client.post(
        "/api/v1/auth/register/citizen",
        json={"email": "incomplete@example.com"} # Missing other required fields
    )
    assert response.status_code == 422
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.register_citizen")
def test_standard_register_conflict(mock_register, client):
    """Test 3.3 (Security/Edge): Registration rejection when email already exists."""
    mock_register.side_effect = ValueError("A user with this email already exists.")
    response = client.post(
        "/api/v1/auth/register/citizen",
        json={
            "email": "duplicate@example.com",
            "password": "SecurePassword123!",
            "name": "Existing Citizen",
            "phone": "9876543210"
        }
    )
    assert response.status_code == 409
    assert response.get_json()["success"] is False


# ==========================================
# 4. STANDARD LOGIN API (3 Tests)
# ==========================================

@patch("app.routes.auth.AuthService.login")
def test_standard_login_success(mock_login, client):
    """Test 4.1 (Happy): Successful email/password login."""
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
    assert response.get_json()["success"] is True

def test_standard_login_missing_fields(client):
    """Test 4.2 (Negative): Login rejection due to missing fields."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com"} # Missing password
    )
    assert response.status_code == 422
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.login")
def test_standard_login_invalid_credentials(mock_login, client):
    """Test 4.3 (Security/Edge): Login rejection for wrong password."""
    mock_login.side_effect = ValueError("Invalid email or password.")
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "user@example.com", "password": "WrongPassword!"}
    )
    assert response.status_code == 401
    assert response.get_json()["success"] is False


# ==========================================
# 5. AGENCY REGISTRATION API (3 Tests)
# ==========================================

@patch("app.routes.auth.AuthService.register_agency")
def test_agency_register_success(mock_register, client):
    """Test 5.1 (Happy): Successful agency registration (Pending Approval)."""
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
    assert response.status_code == 201
    assert response.get_json()["success"] is True

@patch("app.routes.auth.AuthService.register_agency")
def test_agency_register_conflict(mock_register, client):
    """Test 5.2 (Negative): Agency registration conflict on duplicate email/license."""
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
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.register_agency")
def test_agency_register_forbidden(mock_register, client):
    """Test 5.3 (Security/Edge): Registration rejection due to lack of permissions."""
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