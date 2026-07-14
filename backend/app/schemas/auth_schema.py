import re

from marshmallow import (
    Schema,
    ValidationError,
    fields,
    validates,
    validate,
)


class RegisterCitizenSchema(Schema):
    """
    Validates the payload for POST /register/citizen.

    Also the base schema for officer/agency registration — they
    inherit `name`, `email`, `phone`, `password` and both custom
    validators from here.
    """

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=3,
            max=100,
        ),
    )

    email = fields.Email(
        required=True,
    )

    phone = fields.String(
        required=True,
    )

    password = fields.String(
        required=True,
        load_only=True,  # never included when serializing a User back out
    )

    @validates("phone")
    def validate_phone(self, value, **kwargs):
        """
        Validates an Indian mobile number: exactly 10 digits,
        starting with 6, 7, 8, or 9 (per TRAI numbering rules).
        """

        if not re.fullmatch(
            r"^[6-9]\d{9}$",
            value,
        ):
            raise ValidationError("Invalid phone number.")

    @validates("password")
    def validate_password(self, value, **kwargs):
        """
        Enforces password strength:
        - at least 8 characters
        - at least 1 uppercase, 1 lowercase, 1 digit, 1 special char

        Note: only the FIRST failing rule raises, since each `if` here
        raises immediately rather than collecting all failures. If you
        want the client to see every violated rule at once instead of
        one-at-a-time, collect messages in a list and raise them together
        at the end.
        """

        if len(value) < 8:
            raise ValidationError("Password must contain at least 8 characters.")

        if not re.search(r"[A-Z]", value):
            raise ValidationError(
                "Password must contain at least one uppercase letter."
            )

        if not re.search(r"[a-z]", value):
            raise ValidationError(
                "Password must contain at least one lowercase letter."
            )

        if not re.search(r"\d", value):
            raise ValidationError("Password must contain at least one digit.")

        if not re.search(
            r"[!@#$%^&*(),.?\":{}|<>]",
            value,
        ):
            raise ValidationError(
                "Password must contain at least one special character."
            )




class LoginSchema(Schema):
    """
    Validates the payload for POST /login.

    Deliberately lightweight — only checks presence/format, not
    strength, since this is a login attempt, not registration.
    Custom error_messages here give cleaner client-facing errors
    than Marshmallow's defaults.
    """

    email = fields.Email(
        required=True,
        error_messages={
            "required": "Email is required.",
            "invalid": "Invalid email address.",
        },
    )

    password = fields.String(
        required=True,
        load_only=True,
        error_messages={
            "required": "Password is required.",
        },
    )