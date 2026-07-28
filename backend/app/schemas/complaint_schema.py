import re

from marshmallow import Schema, ValidationError, fields, validates


class ComplaintSchema(Schema):
    """
    Schema for complaint creation.
    """

    title = fields.String(required=True)
    description = fields.String(required=True)

    department = fields.String(required=True)

    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)

    address = fields.String(required=True)
    locality = fields.String(required=True)
    city = fields.String(required=True)
    state = fields.String(required=True)
    pincode = fields.String(required=True)

    @validates("title")
    def validate_title(self, value, **kwargs):
        """
        Validate complaint title.
        """

        if len(value.strip()) < 5:
            raise ValidationError(
                "Title must be at least 5 characters long."
            )

        if len(value) > 255:
            raise ValidationError(
                "Title cannot exceed 255 characters."
            )

    @validates("description")
    def validate_description(self, value, **kwargs):
        """
        Validate complaint description.
        """

        if len(value.strip()) < 10:
            raise ValidationError(
                "Description must be at least 10 characters long."
            )

    @validates("department")
    def validate_department(self, value, **kwargs):
        """
        Validate department name.
        """

        if len(value.strip()) == 0:
            raise ValidationError(
                "Department is required."
            )

        if len(value) > 100:
            raise ValidationError(
                "Department name cannot exceed 100 characters."
            )

    @validates("latitude")
    def validate_latitude(self, value, **kwargs):
        """
        Validate latitude.
        """

        if value < -90 or value > 90:
            raise ValidationError(
                "Latitude must be between -90 and 90."
            )

    @validates("longitude")
    def validate_longitude(self, value, **kwargs):
        """
        Validate longitude.
        """

        if value < -180 or value > 180:
            raise ValidationError(
                "Longitude must be between -180 and 180."
            )

    @validates("address")
    def validate_address(self, value, **kwargs):
        """
        Validate address.
        """

        if len(value.strip()) < 5:
            raise ValidationError(
                "Address is too short."
            )

    @validates("locality")
    def validate_locality(self, value, **kwargs):
        """
        Validate locality.
        """

        if len(value.strip()) < 2:
            raise ValidationError(
                "Locality is required."
            )

    @validates("city")
    def validate_city(self, value, **kwargs):
        """
        Validate city.
        """

        if len(value.strip()) < 2:
            raise ValidationError(
                "City is required."
            )

    @validates("state")
    def validate_state(self, value, **kwargs):
        """
        Validate state.
        """

        if len(value.strip()) < 2:
            raise ValidationError(
                "State is required."
            )

    @validates("pincode")
    def validate_pincode(self, value, **kwargs):
        """
        Validate Indian PIN code.
        """

        if not re.fullmatch(r"^\d{6}$", value):
            raise ValidationError(
                "Invalid PIN code."
            )

class ComplaintImageResponseSchema(Schema):
    """
    Schema for complaint images.
    """

    image_url = fields.String()


class ComplaintResponseSchema(Schema):
    """
    Schema for complaint response.
    """

    id = fields.UUID()

    title = fields.String()

    description = fields.String()

    department = fields.Method("get_department")

    status = fields.Method("get_status")

    priority = fields.Method("get_priority")

    latitude = fields.Float()

    longitude = fields.Float()

    address = fields.String()

    locality = fields.String()

    city = fields.String()

    state = fields.String()

    pincode = fields.String()

    created_at = fields.DateTime()

    updated_at = fields.DateTime()

    images = fields.Nested(
        ComplaintImageResponseSchema,
        many=True,
    )

    def get_department(self, obj):
        return obj.department.name

    def get_status(self, obj):
        return obj.status.value

    def get_priority(self, obj):
        return obj.priority.value