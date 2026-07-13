from werkzeug.security import (
    generate_password_hash,
    check_password_hash,
)

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
)


def hash_password(password: str) -> str:
    """
    Hash a plain text password.
    """
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """
    Verify a password against its hash.
    """
    return check_password_hash(
        password_hash,
        password,
    )


def generate_access_token(user):
    """
    Generate JWT access token.
    """
    return create_access_token(
        identity=str(user.id),
        additional_claims={
            "email": user.email,
            "role": user.role.value,
        },
    )


def generate_refresh_token(user):
    """
    Generate JWT refresh token.
    """
    return create_refresh_token(
        identity=str(user.id),
    )