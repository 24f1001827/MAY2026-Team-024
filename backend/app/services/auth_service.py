from app.models import (
    User,
    UserRole,
    UserStatus,
    AuthProvider,
    AvailabilityStatus
)

from app.repositories import (
    UserRepository,
    AgencyRepository,
    OfficerRepository,
    DepartmentRepository
)
from app.extensions import db

from app.utils import (
    hash_password,
    verify_password,
    generate_access_token,
    generate_refresh_token,
)


class AuthService:
    """
    Handles all authentication-related business logic: registration,
    credential login, and Google OAuth login. Delegates persistence
    to UserRepository and token creation to app.utils.
    """

    @staticmethod
    def register_citizen(data):
        """
        Register a new citizen account.

        Citizens are created with ACTIVE status immediately since
        they don't require manual approval (unlike officers/agencies).

        Raises:
            ValueError: if a user with this email already exists.
        """

        existing_user = UserRepository.get_by_email(data["email"])

        if existing_user:
            raise ValueError("Email already exists.")

        user = User(
            name=data["name"],
            email=data["email"],
            phone=data["phone"],
            password_hash=hash_password(data["password"]),
            role=UserRole.CITIZEN,
            status=UserStatus.ACTIVE,
            provider=AuthProvider.LOCAL,
        )

        return UserRepository.create(user)

    @staticmethod
    def register_agency(data):
        """
        Register a new agency.

        Creates both a User and an Agency record.
        The agency account remains in PendingApproval
        until approved by an administrator.

        Args:
            data: Validated request data.

        Returns:
            User: Newly created user.
        """

        if UserRepository.get_by_email(data["email"]):
            raise ValueError("Email already registered.")

        if AgencyRepository.get_by_registration_number(data["registration_number"]):
            raise ValueError("Registration number already exists.")

        if AgencyRepository.get_by_license_number(data["license_number"]):
            raise ValueError("License number already exists.")

        try:

            user = UserRepository.create(
                User(
                    name=data["name"],
                    email=data["email"],
                    password=hash_password(data["password"]),
                    phone=data["phone"],
                    role=UserRole.AGENCY,
                    status=UserStatus.PENDING_APPROVAL,
                )
            )

            AgencyRepository.create(
                {
                    "user_id": user.id,
                    "registration_number": data["registration_number"],
                    "license_number": data["license_number"],
                    "contact_person": data["contact_person"],
                }
            )

            db.session.commit()

            return user

        except Exception:

            db.session.rollback()

            raise

    @staticmethod
    def register_officer(data):
        """
        Register a new officer.

        Officer accounts require administrator approval.
        """

        if UserRepository.get_by_email(data["email"]):
            raise ValueError("Email already registered.")

        department = DepartmentRepository.get_by_name(data["department"])

        if not department:
            raise ValueError("Selected department does not exist.")

        try:

            user = UserRepository.create(
                User(
                    name=data["name"],
                    email=data["email"],
                    password_hash=hash_password(data["password"]),
                    phone=data["phone"],
                    role=UserRole.OFFICER,
                    status=UserStatus.PENDING_APPROVAL
                )
            )

            OfficerRepository.create(
                {
                    "user_id": user.id,
                    "department_id": department.id,
                    "availability_status": AvailabilityStatus.AVAILABLE,
                
                }
            )

            db.session.commit()

            return user

        except Exception:

            db.session.rollback()

            raise

    @staticmethod
    def _login_user(user):
        """
        Issue an access/refresh token pair for an already-authenticated
        user and shape the standard login response payload.

        Shared by both credential login and Google login so the
        response format stays consistent across auth methods.
        """

        access_token = generate_access_token(user)
        refresh_token = generate_refresh_token(user)

        return {
            "user": {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "role": user.role.value,
                "status": user.status.value,
            },
            "access_token": access_token,
            "refresh_token": refresh_token,
        }

    @staticmethod
    def login(data):
        """
        Authenticate a user with email + password.

        Raises:
            ValueError: if the email doesn't exist, the password is
                wrong, or the account isn't ACTIVE (e.g. still
                PENDING_APPROVAL or BLOCKED or REJECTED). The message is
                intentionally generic for bad credentials to avoid
                leaking which part was wrong.
        """

        user = UserRepository.get_by_email(data["email"])

        if not user:
            raise ValueError("Invalid email or password.")

        if user.provider != AuthProvider.LOCAL or not user.password_hash:
            raise ValueError("Invalid email or password.")

        if not verify_password(
            data["password"],
            user.password_hash,
        ):
            raise ValueError("Invalid email or password.")

        if user.status == UserStatus.PENDING_APPROVAL:
            raise PermissionError(
                "Your registration is awaiting admin approval."
            )

        if user.status == UserStatus.REJECTED:
            raise PermissionError("Your registration has been rejected.")

        if user.status == UserStatus.BLOCKED:
            raise PermissionError("Your account has been blocked.")

        return AuthService._login_user(user)

    @staticmethod
    def google_login(user_info):
        """
        Log in (or implicitly register) a user via Google OAuth.

        Looks up the local user by the email Google returned. If no
        user exists yet, a new CITIZEN account is created automatically
        with AuthProvider.GOOGLE and ACTIVE status — no separate
        registration step needed, since Google has already verified
        the email address.

        Args:
            user_info: dict from Google's userinfo/ID token, expected
                to contain "email", "name", and "sub" (Google's
                stable unique user ID, stored as provider_id).

        Raises:
            ValueError: if an account with this email already exists
                under a different provider (LOCAL) — prevents
                silently taking over a password-based account just
                because someone controls the matching Gmail address.
        """

        user = UserRepository.get_by_email(user_info["email"])

        if user and user.provider != AuthProvider.GOOGLE:
            raise ValueError(
                "An account with this email already exists. "
                "Please log in using your original sign-in method."
            )

        if not user:
            user = User(
                name=user_info["name"],
                email=user_info["email"],
                provider=AuthProvider.GOOGLE,
                provider_id=user_info["sub"],
                role=UserRole.CITIZEN,
                status=UserStatus.ACTIVE,
            )

            user = UserRepository.create(user)

        return AuthService._login_user(user)
