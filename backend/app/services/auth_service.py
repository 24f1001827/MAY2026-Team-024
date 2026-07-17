from app.models import (
    User,
    UserRole,
    UserStatus,
    AuthProvider,
)

from app.repositories import UserRepository

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
                PENDING_APPROVAL or SUSPENDED). The message is
                intentionally generic for bad credentials to avoid
                leaking which part was wrong.
        """

        user = UserRepository.get_by_email(data["email"])

        if not user:
            raise ValueError("Invalid email or password.")

        if not verify_password(
            data["password"],
            user.password_hash,
        ):
            raise ValueError("Invalid email or password.")

        if user.status != UserStatus.ACTIVE:
            raise ValueError(f"Account is {user.status.value.lower()}.")

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