from unittest.mock import MagicMock, patch
import pytest
from app.models import (
    AuthProvider,
    AvailabilityStatus,
    UserRole,
    UserStatus,
)
from app.services.auth_service import AuthService

def make_user(
    user_id=1,
    name="John Doe",
    email="john@example.com",
    provider=AuthProvider.LOCAL,
    status=UserStatus.ACTIVE,
    password_hash="hashed-password",
    role=UserRole.CITIZEN,
):
    return MagicMock(
        id=user_id,
        name=name,
        email=email,
        provider=provider,
        status=status,
        password_hash=password_hash,
        role=role,
    )

def citizen_data():
    return {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "password": "StrongPass123!",
    }

def agency_data():
    return {
        "name": "RoadFix Agency",
        "email": "agency@example.com",
        "phone": "9876543210",
        "password": "StrongPass123!",
        "registration_number": "REG-001",
        "license_number": "LIC-001",
        "contact_person": "Jane Doe",
    }

def officer_data():
    return {
        "name": "Officer Bob",
        "email": "officer@example.com",
        "phone": "9876543210",
        "password": "StrongPass123!",
        "department": "Roads",
    }

# CITIZEN REGISTRATION
@patch("app.services.auth_service.UserRepository")
@patch("app.services.auth_service.hash_password")
@patch("app.services.auth_service.User")
def test_register_citizen_success(
    mock_user_model,
    mock_hash_password,
    mock_user_repo,
):
    data = citizen_data()
    user = make_user()

    mock_user_repo.get_by_email.return_value = None
    mock_hash_password.return_value = "hashed-password"
    mock_user_model.return_value = user
    mock_user_repo.create.return_value = user

    result = AuthService.register_citizen(data)

    assert result == user
    mock_hash_password.assert_called_once_with(data["password"])
    mock_user_model.assert_called_once_with(
        name=data["name"],
        email=data["email"],
        phone=data["phone"],
        password_hash="hashed-password",
        role=UserRole.CITIZEN,
        status=UserStatus.ACTIVE,
        provider=AuthProvider.LOCAL,
    )
    mock_user_repo.create.assert_called_once_with(user)

@patch("app.services.auth_service.UserRepository")
def test_register_citizen_duplicate_email(mock_user_repo):
    mock_user_repo.get_by_email.return_value = make_user()

    with pytest.raises(ValueError, match="Email already exists"):
        AuthService.register_citizen(citizen_data())

# AGENCY REGISTRATION
@patch("app.services.auth_service.db.session")
@patch("app.services.auth_service.AgencyRepository")
@patch("app.services.auth_service.UserRepository")
@patch("app.services.auth_service.hash_password")
@patch("app.services.auth_service.User")
def test_register_agency_success(
    mock_user_model,
    mock_hash_password,
    mock_user_repo,
    mock_agency_repo,
    mock_db,
):
    data = agency_data()
    user = make_user(
        user_id=2,
        name=data["name"],
        email=data["email"],
        role=UserRole.AGENCY,
        status=UserStatus.PENDING_APPROVAL,
    )

    mock_user_repo.get_by_email.return_value = None
    mock_agency_repo.get_by_registration_number.return_value = None
    mock_agency_repo.get_by_license_number.return_value = None
    mock_hash_password.return_value = "hashed-password"
    mock_user_model.return_value = user
    mock_user_repo.create.return_value = user

    result = AuthService.register_agency(data)

    assert result == user
    mock_agency_repo.create.assert_called_once_with(
        {
            "user_id": 2,
            "registration_number": "REG-001",
            "license_number": "LIC-001",
            "contact_person": "Jane Doe",
        }
    )
    mock_db.commit.assert_called_once()

@pytest.mark.parametrize(
    ("email_exists", "registration_exists", "license_exists", "message"),
    [
        (True, False, False, "Email already registered"),
        (False, True, False, "Registration number already exists"),
        (False, False, True, "License number already exists"),
    ],
)
@patch("app.services.auth_service.AgencyRepository")
@patch("app.services.auth_service.UserRepository")
def test_register_agency_duplicate_values(
    mock_user_repo,
    mock_agency_repo,
    email_exists,
    registration_exists,
    license_exists,
    message,
):
    mock_user_repo.get_by_email.return_value = (
        make_user() if email_exists else None
    )
    mock_agency_repo.get_by_registration_number.return_value = (
        MagicMock() if registration_exists else None
    )
    mock_agency_repo.get_by_license_number.return_value = (
        MagicMock() if license_exists else None
    )

    with pytest.raises(ValueError, match=message):
        AuthService.register_agency(agency_data())

@patch("app.services.auth_service.db.session")
@patch("app.services.auth_service.AgencyRepository")
@patch("app.services.auth_service.UserRepository")
@patch("app.services.auth_service.hash_password")
@patch("app.services.auth_service.User")
def test_register_agency_rolls_back_failure(
    mock_user_model,
    mock_hash_password,
    mock_user_repo,
    mock_agency_repo,
    mock_db,
):
    user = make_user(user_id=2)

    mock_user_repo.get_by_email.return_value = None
    mock_agency_repo.get_by_registration_number.return_value = None
    mock_agency_repo.get_by_license_number.return_value = None
    mock_hash_password.return_value = "hashed-password"
    mock_user_model.return_value = user
    mock_user_repo.create.return_value = user
    mock_agency_repo.create.side_effect = Exception("Database failure")

    with pytest.raises(Exception, match="Database failure"):
        AuthService.register_agency(agency_data())

    mock_db.rollback.assert_called_once()

# OFFICER REGISTRATION
@patch("app.services.auth_service.db.session")
@patch("app.services.auth_service.OfficerRepository")
@patch("app.services.auth_service.DepartmentRepository")
@patch("app.services.auth_service.UserRepository")
@patch("app.services.auth_service.hash_password")
@patch("app.services.auth_service.User")
def test_register_officer_success(
    mock_user_model,
    mock_hash_password,
    mock_user_repo,
    mock_department_repo,
    mock_officer_repo,
    mock_db,
):
    data = officer_data()
    user = make_user(
        user_id=3,
        role=UserRole.OFFICER,
        status=UserStatus.PENDING_APPROVAL,
    )
    department = MagicMock(id=10)

    mock_user_repo.get_by_email.return_value = None
    mock_department_repo.get_by_name.return_value = department
    mock_hash_password.return_value = "hashed-password"
    mock_user_model.return_value = user
    mock_user_repo.create.return_value = user

    result = AuthService.register_officer(data)

    assert result == user
    mock_officer_repo.create.assert_called_once_with(
        {
            "user_id": 3,
            "department_id": 10,
            "availability_status": AvailabilityStatus.AVAILABLE,
        }
    )
    mock_db.commit.assert_called_once()

@patch("app.services.auth_service.UserRepository")
def test_register_officer_duplicate_email(mock_user_repo):
    mock_user_repo.get_by_email.return_value = make_user()

    with pytest.raises(ValueError, match="Email already registered"):
        AuthService.register_officer(officer_data())

@patch("app.services.auth_service.DepartmentRepository")
@patch("app.services.auth_service.UserRepository")
def test_register_officer_department_not_found(
    mock_user_repo,
    mock_department_repo,
):
    mock_user_repo.get_by_email.return_value = None
    mock_department_repo.get_by_name.return_value = None

    with pytest.raises(ValueError, match="Selected department does not exist"):
        AuthService.register_officer(officer_data())

# LOGIN
@patch("app.services.auth_service.generate_refresh_token")
@patch("app.services.auth_service.generate_access_token")
def test_login_user_creates_tokens(mock_access_token, mock_refresh_token):
    user = make_user()

    mock_access_token.return_value = "access-token"
    mock_refresh_token.return_value = "refresh-token"

    result = AuthService._login_user(user)

    assert result["access_token"] == "access-token"
    assert result["refresh_token"] == "refresh-token"
    assert result["user"]["id"] == "1"
    assert result["user"]["role"] == UserRole.CITIZEN.value

@pytest.mark.parametrize(
    ("user", "password_valid", "message"),
    [
        (None, True, "Invalid email or password"),
        (
            make_user(provider=AuthProvider.GOOGLE, password_hash=None),
            True,
            "Invalid email or password",
        ),
        (make_user(), False, "Invalid email or password"),
        (
            make_user(status=UserStatus.PENDING_APPROVAL),
            True,
            "awaiting admin approval",
        ),
        (
            make_user(status=UserStatus.REJECTED),
            True,
            "registration has been rejected",
        ),
        (
            make_user(status=UserStatus.BLOCKED),
            True,
            "account has been blocked",
        ),
    ],
)
@patch("app.services.auth_service.verify_password")
@patch("app.services.auth_service.UserRepository")
def test_login_rejects_invalid_users(
    mock_user_repo,
    mock_verify_password,
    user,
    password_valid,
    message,
):
    mock_user_repo.get_by_email.return_value = user
    mock_verify_password.return_value = password_valid

    with pytest.raises((ValueError, PermissionError), match=message):
        AuthService.login(
            {
                "email": "john@example.com",
                "password": "StrongPass123!",
            }
        )

@patch("app.services.auth_service.AuthService._login_user")
@patch("app.services.auth_service.verify_password")
@patch("app.services.auth_service.UserRepository")
def test_login_success(mock_user_repo, mock_verify_password, mock_login_user):
    user = make_user()
    expected = {"access_token": "access-token"}

    mock_user_repo.get_by_email.return_value = user
    mock_verify_password.return_value = True
    mock_login_user.return_value = expected

    result = AuthService.login(
        {
            "email": "john@example.com",
            "password": "StrongPass123!",
        }
    )

    assert result == expected
    mock_login_user.assert_called_once_with(user)

# GOOGLE LOGIN
@patch("app.services.auth_service.UserRepository")
def test_google_login_rejects_local_account(mock_user_repo):
    mock_user_repo.get_by_email.return_value = make_user(
        provider=AuthProvider.LOCAL
    )

    with pytest.raises(ValueError, match="original sign-in method"):
        AuthService.google_login(
            {
                "name": "Google User",
                "email": "google@example.com",
                "sub": "google-id-1",
            }
        )

@patch("app.services.auth_service.AuthService._login_user")
@patch("app.services.auth_service.UserRepository")
def test_google_login_existing_google_user(mock_user_repo, mock_login_user):
    user = make_user(
        provider=AuthProvider.GOOGLE,
        email="google@example.com",
    )
    mock_user_repo.get_by_email.return_value = user
    mock_login_user.return_value = {"access_token": "access-token"}

    result = AuthService.google_login(
        {
            "name": "Google User",
            "email": "google@example.com",
            "sub": "google-id-1",
        }
    )

    assert result == {"access_token": "access-token"}
    mock_user_repo.create.assert_not_called()
    mock_login_user.assert_called_once_with(user)

@patch("app.services.auth_service.AuthService._login_user")
@patch("app.services.auth_service.UserRepository")
@patch("app.services.auth_service.User")
def test_google_login_creates_new_citizen(
    mock_user_model,
    mock_user_repo,
    mock_login_user,
):
    user = make_user(
        provider=AuthProvider.GOOGLE,
        email="google@example.com",
    )

    mock_user_repo.get_by_email.return_value = None
    mock_user_model.return_value = user
    mock_user_repo.create.return_value = user
    mock_login_user.return_value = {"access_token": "access-token"}

    result = AuthService.google_login(
        {
            "name": "Google User",
            "email": "google@example.com",
            "sub": "google-id-1",
        }
    )

    assert result == {"access_token": "access-token"}
    mock_user_model.assert_called_once_with(
        name="Google User",
        email="google@example.com",
        provider=AuthProvider.GOOGLE,
        provider_id="google-id-1",
        role=UserRole.CITIZEN,
        status=UserStatus.ACTIVE,
    )
    mock_user_repo.create.assert_called_once_with(user)