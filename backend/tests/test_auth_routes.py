from unittest.mock import MagicMock, patch
from marshmallow import ValidationError

def make_user(
    user_id=1,
    name="John Doe",
    email="test@example.com",
    role="citizen",
    status="active",
):
    user = MagicMock()
    user.id = user_id
    user.name = name
    user.email = email
    user.role.value = role
    user.status.value = status
    return user

# Citizen registration
@patch("app.routes.auth.AuthService.register_citizen")
@patch("app.routes.auth.RegisterCitizenSchema")
def test_register_citizen_success(mock_schema, mock_register, client):
    payload = {
        "name": "John Doe",
        "email": "test@example.com",
        "password": "StrongPass123!",
    }
    validated_data = payload.copy()

    mock_schema.return_value.load.return_value = validated_data
    mock_register.return_value = make_user()

    response = client.post("/api/v1/auth/register/citizen", json=payload)

    body = response.get_json()
    assert response.status_code == 201
    assert body["success"] is True
    assert body["message"] == "Citizen registered successfully."
    assert body["data"] == {
        "id": "1",
        "name": "John Doe",
        "email": "test@example.com",
        "role": "citizen",
        "status": "active",
    }
    mock_schema.return_value.load.assert_called_once_with(payload)
    mock_register.assert_called_once_with(validated_data)

@patch("app.routes.auth.RegisterCitizenSchema")
def test_register_citizen_validation_error(mock_schema, client):
    mock_schema.return_value.load.side_effect = ValidationError(
        {"password": ["Field required."]}
    )

    response = client.post(
        "/api/v1/auth/register/citizen",
        json={"email": "test@example.com"},
    )

    body = response.get_json()
    assert response.status_code == 422
    assert body["success"] is False
    assert body["message"] == "Validation failed."
    assert body["errors"]["password"] == ["Field required."]

@patch("app.routes.auth.AuthService.register_citizen")
@patch("app.routes.auth.RegisterCitizenSchema")
def test_register_citizen_duplicate_email(mock_schema, mock_register, client):
    payload = {"email": "test@example.com"}
    mock_schema.return_value.load.return_value = payload
    mock_register.side_effect = ValueError("Email already in use.")

    response = client.post("/api/v1/auth/register/citizen", json=payload)

    body = response.get_json()
    assert response.status_code == 409
    assert body["success"] is False
    assert body["message"] == "Email already in use."

@patch("app.routes.auth.AuthService.register_citizen")
@patch("app.routes.auth.RegisterCitizenSchema")
def test_register_citizen_server_error(mock_schema, mock_register, client):
    mock_schema.return_value.load.return_value = {"email": "test@example.com"}
    mock_register.side_effect = Exception("Database connection failed")

    response = client.post(
        "/api/v1/auth/register/citizen",
        json={"email": "test@example.com"},
    )

    body = response.get_json()
    assert response.status_code == 500
    assert body["success"] is False
    assert body["message"] == "Internal server error."

# Agency registration
@patch("app.routes.auth.AuthService.register_agency")
@patch("app.routes.auth.RegisterAgencySchema")
def test_register_agency_success(mock_schema, mock_register, client):
    payload = {
        "name": "City Roads Agency",
        "email": "agency@example.com",
        "password": "StrongPass123!",
    }
    mock_schema.return_value.load.return_value = payload
    mock_register.return_value = make_user(
        user_id=2,
        name="City Roads Agency",
        email="agency@example.com",
        role="agency",
        status="pending",
    )

    response = client.post("/api/v1/auth/register/agency", json=payload)

    body = response.get_json()
    assert response.status_code == 201
    assert body["success"] is True
    assert body["message"] == "Agency registered successfully. Awaiting admin approval."
    assert body["data"]["role"] == "agency"
    assert body["data"]["status"] == "pending"

@patch("app.routes.auth.RegisterAgencySchema")
def test_register_agency_validation_error(mock_schema, client):
    mock_schema.return_value.load.side_effect = ValidationError(
        {"registration_number": ["Field required."]}
    )

    response = client.post("/api/v1/auth/register/agency", json={})

    assert response.status_code == 422
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.register_agency")
@patch("app.routes.auth.RegisterAgencySchema")
def test_register_agency_conflict(mock_schema, mock_register, client):
    mock_schema.return_value.load.return_value = {"email": "agency@example.com"}
    mock_register.side_effect = ValueError("Registration number already exists.")

    response = client.post(
        "/api/v1/auth/register/agency",
        json={"email": "agency@example.com"},
    )

    assert response.status_code == 409
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.register_agency")
@patch("app.routes.auth.RegisterAgencySchema")
def test_register_agency_forbidden(mock_schema, mock_register, client):
    mock_schema.return_value.load.return_value = {"email": "agency@example.com"}
    mock_register.side_effect = PermissionError("Not authorized.")

    response = client.post(
        "/api/v1/auth/register/agency",
        json={"email": "agency@example.com"},
    )

    assert response.status_code == 403
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.register_agency")
@patch("app.routes.auth.RegisterAgencySchema")
def test_register_agency_server_error(mock_schema, mock_register, client):
    mock_schema.return_value.load.return_value = {"email": "agency@example.com"}
    mock_register.side_effect = Exception("Database failure")

    response = client.post(
        "/api/v1/auth/register/agency",
        json={"email": "agency@example.com"},
    )

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal server error."

# Officer registration
@patch("app.routes.auth.AuthService.register_officer")
@patch("app.routes.auth.RegisterOfficerSchema")
def test_register_officer_success(mock_schema, mock_register, client):
    payload = {"name": "Officer Bob", "email": "officer@example.com"}
    mock_schema.return_value.load.return_value = payload
    mock_register.return_value = make_user(
        user_id=3,
        name="Officer Bob",
        email="officer@example.com",
        role="officer",
        status="pending",
    )

    response = client.post("/api/v1/auth/register/officer", json=payload)

    body = response.get_json()
    assert response.status_code == 201
    assert body["success"] is True
    assert body["data"]["role"] == "officer"
    assert body["data"]["status"] == "pending"

@patch("app.routes.auth.RegisterOfficerSchema")
def test_register_officer_validation_error(mock_schema, client):
    mock_schema.return_value.load.side_effect = ValidationError(
        {"department_id": ["Field required."]}
    )

    response = client.post("/api/v1/auth/register/officer", json={})

    assert response.status_code == 422
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.register_officer")
@patch("app.routes.auth.RegisterOfficerSchema")
def test_register_officer_conflict(mock_schema, mock_register, client):
    mock_schema.return_value.load.return_value = {"email": "officer@example.com"}
    mock_register.side_effect = ValueError("Officer already exists.")

    response = client.post(
        "/api/v1/auth/register/officer",
        json={"email": "officer@example.com"},
    )

    assert response.status_code == 409

@patch("app.routes.auth.AuthService.register_officer")
@patch("app.routes.auth.RegisterOfficerSchema")
def test_register_officer_forbidden(mock_schema, mock_register, client):
    mock_schema.return_value.load.return_value = {"email": "officer@example.com"}
    mock_register.side_effect = PermissionError("Not authorized.")

    response = client.post(
        "/api/v1/auth/register/officer",
        json={"email": "officer@example.com"},
    )

    assert response.status_code == 403

# Email/password login
@patch("app.routes.auth.AuthService.login")
@patch("app.routes.auth.LoginSchema")
def test_login_success(mock_schema, mock_login, client):
    payload = {
        "email": "test@example.com",
        "password": "StrongPass123!",
    }
    mock_schema.return_value.load.return_value = payload
    mock_login.return_value = {
        "access_token": "access-token",
        "refresh_token": "refresh-token",
        "user": {"id": "1", "email": "test@example.com"},
    }

    response = client.post("/api/v1/auth/login", json=payload)

    body = response.get_json()
    assert response.status_code == 200
    assert body["success"] is True
    assert body["message"] == "Login successful."
    assert body["data"]["access_token"] == "access-token"
    assert body["data"]["refresh_token"] == "refresh-token"
    mock_login.assert_called_once_with(payload)

@patch("app.routes.auth.LoginSchema")
def test_login_validation_error(mock_schema, client):
    mock_schema.return_value.load.side_effect = ValidationError(
        {"password": ["Field required."]}
    )

    response = client.post("/api/v1/auth/login", json={"email": "test@example.com"})

    assert response.status_code == 422
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.login")
@patch("app.routes.auth.LoginSchema")
def test_login_invalid_credentials(mock_schema, mock_login, client):
    mock_schema.return_value.load.return_value = {
        "email": "test@example.com",
        "password": "WrongPassword",
    }
    mock_login.side_effect = ValueError("Invalid email or password.")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "WrongPassword"},
    )

    assert response.status_code == 401
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.login")
@patch("app.routes.auth.LoginSchema")
def test_login_inactive_user(mock_schema, mock_login, client):
    mock_schema.return_value.load.return_value = {
        "email": "inactive@example.com",
        "password": "StrongPass123!",
    }
    mock_login.side_effect = PermissionError("Account is inactive.")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@example.com", "password": "StrongPass123!"},
    )

    assert response.status_code == 403
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.login")
@patch("app.routes.auth.LoginSchema")
def test_login_server_error(mock_schema, mock_login, client):
    mock_schema.return_value.load.return_value = {
        "email": "test@example.com",
        "password": "StrongPass123!",
    }
    mock_login.side_effect = Exception("Database unavailable")

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "StrongPass123!"},
    )

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal server error."

# Google OAuth
@patch("app.routes.auth.oauth.google.authorize_redirect")
def test_google_login_redirects_to_google(mock_redirect, client):
    mock_redirect.return_value = ("redirecting", 302)

    response = client.get("/api/v1/auth/google/login")

    assert response.status_code == 302
    mock_redirect.assert_called_once()
    _, kwargs = mock_redirect.call_args
    assert kwargs["prompt"] == "consent"

@patch("app.routes.auth.AuthService.google_login")
@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_success(mock_access_token, mock_google_login, client):
    user_info = {"email": "google@example.com", "name": "Google User", "sub": "123"}
    mock_access_token.return_value = {"userinfo": user_info}
    mock_google_login.return_value = {
        "access_token": "access-token",
        "refresh_token": "refresh-token",
    }

    response = client.get("/api/v1/auth/google/callback")

    body = response.get_json()
    assert response.status_code == 200
    assert body["success"] is True
    assert body["data"]["access_token"] == "access-token"
    mock_google_login.assert_called_once_with(user_info)

@patch("app.routes.auth.AuthService.google_login")
@patch("app.routes.auth.oauth.google.userinfo")
@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_uses_userinfo_fallback(
    mock_access_token,
    mock_userinfo,
    mock_google_login,
    client,
):
    user_info = {"email": "google@example.com", "name": "Google User"}
    mock_access_token.return_value = {}
    mock_userinfo.return_value = user_info
    mock_google_login.return_value = {"access_token": "access-token"}

    response = client.get("/api/v1/auth/google/callback")

    assert response.status_code == 200
    mock_userinfo.assert_called_once()
    mock_google_login.assert_called_once_with(user_info)

@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_token_exchange_failure(mock_access_token, client):
    mock_access_token.side_effect = Exception("User denied consent")

    response = client.get("/api/v1/auth/google/callback")

    assert response.status_code == 401
    assert response.get_json()["success"] is False

@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_missing_email(mock_access_token, client):
    mock_access_token.return_value = {"userinfo": {"name": "No Email User"}}

    response = client.get("/api/v1/auth/google/callback")

    assert response.status_code == 400
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.google_login")
@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_email_provider_conflict(
    mock_access_token,
    mock_google_login,
    client,
):
    mock_access_token.return_value = {
        "userinfo": {"email": "google@example.com", "name": "Google User"}
    }
    mock_google_login.side_effect = ValueError(
        "Account already exists with password login."
    )

    response = client.get("/api/v1/auth/google/callback")

    assert response.status_code == 409
    assert response.get_json()["success"] is False

@patch("app.routes.auth.AuthService.google_login")
@patch("app.routes.auth.oauth.google.authorize_access_token")
def test_google_callback_server_error(mock_access_token, mock_google_login, client):
    mock_access_token.return_value = {
        "userinfo": {"email": "google@example.com"}
    }
    mock_google_login.side_effect = Exception("Database unavailable")

    response = client.get("/api/v1/auth/google/callback")

    assert response.status_code == 500
    assert response.get_json()["message"] == "Internal server error."