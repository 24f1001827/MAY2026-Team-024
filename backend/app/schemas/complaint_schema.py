import re

from marshmallow import (
    Schema,
    ValidationError,
    fields,
    validates,
    validates_schema,
    validate,
)
from marshmallow_enum import EnumField

from app.models.enums import (
    AssignmentStatus,
    TenderStatus,
    WorkOrderStatus,
    ReviewDecision,
)


class ComplaintSchema(Schema):
    """
    Schema for complaint creation.
    """

    title = fields.String(required=True)
    description = fields.String(required=True)

    # Either department_id (preferred) or department (name) identifies the
    # target department; validated in `validate_department_reference`.
    department_id = fields.Integer(required=False)
    department = fields.String(required=False)

    latitude = fields.Float(required=True)
    longitude = fields.Float(required=True)

    address = fields.String(required=True)
    locality = fields.String(required=True)
    city = fields.String(required=True)
    district = fields.String(required=True)
    state = fields.String(required=True)
    country = fields.String(required=True)
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
        Validate department name (only when the name form is used).
        """

        if len(value.strip()) == 0:
            raise ValidationError(
                "Department is required."
            )

        if len(value) > 100:
            raise ValidationError(
                "Department name cannot exceed 100 characters."
            )

    @validates_schema
    def validate_department_reference(self, data, **kwargs):
        """
        Require at least one way to identify the department: department_id or
        department (name). Supplying both is allowed -- ComplaintService.
        _resolve_department takes department_id and ignores the name.
        """

        if data.get("department_id") is None and not data.get("department"):
            raise ValidationError(
                {"department_id": ["A department_id or department name is required."]}
            )

    @validates("district")
    def validate_district(self, value, **kwargs):
        """
        Validate district.
        """

        if len(value.strip()) < 2:
            raise ValidationError(
                "District is required."
            )

    @validates("country")
    def validate_country(self, value, **kwargs):
        """
        Validate country.
        """

        if len(value.strip()) < 2:
            raise ValidationError(
                "Country is required."
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

    id = fields.Integer()

    image_url = fields.String()


class ComplaintResponseSchema(Schema):
    """
    Schema for complaint response.
    """

    id = fields.UUID()

    title = fields.String()

    description = fields.String()

    citizen_id = fields.UUID()

    department_id = fields.Integer()

    department = fields.Method("get_department")

    # The officer this complaint is currently allotted to (users.id), or null
    # while it waits in the department's unassigned queue.
    assigned_officer_id = fields.Method("get_assigned_officer_id")

    status = fields.Method("get_status")

    priority = fields.Method("get_priority")

    ai_category = fields.String()

    ai_priority_score = fields.Integer()

    allocated_budget = fields.Decimal(as_string=True, allow_none=True)

    budget_year = fields.String(allow_none=True)

    latitude = fields.Float()

    longitude = fields.Float()

    address = fields.String()

    locality = fields.String()

    city = fields.String()

    district = fields.String(allow_none=True)

    state = fields.String()

    country = fields.String(allow_none=True)

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

    def get_assigned_officer_id(self, obj):
        """
        The officer_id of the most recent non-rejected assignment, or None.
        (An unassigned complaint has no active assignment.)
        """

        active = [
            a
            for a in obj.assignments
            if a.status
            not in (AssignmentStatus.REJECTED, AssignmentStatus.ESCALATED)
        ]

        if not active:
            return None

        latest = max(active, key=lambda a: a.created_at)
        return str(latest.officer_id)


class ComplaintRemarkResponseSchema(Schema):
    """
    A remark / activity entry on a complaint's timeline. `status_from`/
    `status_to` are set for status transitions (else null); a null author means
    a system-generated event, surfaced as "System".
    """

    id = fields.Integer()

    complaint_id = fields.UUID()

    author_id = fields.UUID(attribute="user_id", allow_none=True)

    author_name = fields.Method("get_author_name")

    author_role = fields.Method("get_author_role")

    message = fields.String(attribute="remark")

    is_internal = fields.Boolean()

    status_from = fields.String(allow_none=True)

    status_to = fields.String(allow_none=True)

    created_at = fields.DateTime()

    def get_author_name(self, obj):
        return obj.user.name if obj.user else "System"

    def get_author_role(self, obj):
        return obj.user.role.value if obj.user else None


class ComplaintWorkOrderSchema(Schema):
    """
    Compact work-order summary embedded under a complaint's tender, so the
    reviewing officer can verify / mark-incomplete the awarded work without a
    separate lookup (there is no officer GET-work-order endpoint).
    """

    id = fields.Integer()

    status = EnumField(WorkOrderStatus, by_value=True)

    scope_of_work = fields.String()

    completion_proof_url = fields.String(allow_none=True)


class ComplaintTenderSchema(Schema):
    """
    Compact tender summary embedded in a complaint's detail response, so staff
    can see whether a complaint already has a tender (and jump to its proposals)
    without a separate lookup. Full tender details live on the tender endpoints.
    """

    id = fields.Integer()

    title = fields.String()

    status = EnumField(TenderStatus, by_value=True)

    estimated_cost = fields.Decimal(as_string=True)

    closing_date = fields.DateTime()

    # One-to-one; null until an officer awards a work order from a proposal.
    work_order = fields.Nested(ComplaintWorkOrderSchema, allow_none=True)


class ComplaintReviewReportSchema(Schema):
    """
    The officer's inspection report, embedded in a complaint's detail so any
    viewer of the complaint can see the assessment. (Defined locally rather than
    reusing officer_schema's version to avoid a circular import.)
    """

    findings = fields.String()

    estimated_cost = fields.Decimal(as_string=True, allow_none=True)

    estimated_duration_days = fields.Integer(allow_none=True)

    decision = EnumField(ReviewDecision, by_value=True)

    review_date = fields.DateTime()


class ComplaintDetailResponseSchema(ComplaintResponseSchema):
    """
    Detail response: the full complaint plus its public activity timeline.
    Internal remarks (is_internal) are omitted — they're staff-only notes.
    Used only by the single-complaint GET endpoints, not the list endpoints.
    """

    remarks = fields.Method("get_remarks")

    # The officer's review report (findings/decision), or null if not submitted.
    review_report = fields.Nested(ComplaintReviewReportSchema, allow_none=True)

    # One-to-one; null until an officer publishes a tender for this complaint.
    tender = fields.Nested(ComplaintTenderSchema, allow_none=True)

    def get_remarks(self, obj):
        visible = [r for r in obj.remarks if not r.is_internal]
        visible.sort(key=lambda r: r.created_at)
        return ComplaintRemarkResponseSchema(many=True).dump(visible)


class PublicComplaintSchema(ComplaintResponseSchema):
    """
    Anonymized complaint for the public map/list — strips every field that
    could identify the reporter or the handling officer. Unauthenticated
    surface, so this must never leak `citizen_id` / `assigned_officer_id`.
    """

    class Meta:
        exclude = ("citizen_id", "assigned_officer_id")


class PublicComplaintDetailSchema(ComplaintDetailResponseSchema):
    """
    Anonymized single-complaint detail (with images + public activity timeline).
    Same privacy stripping as `PublicComplaintSchema`; the officer's review
    report is staff/authenticated-only, so it's excluded here too.
    """

    class Meta:
        exclude = ("citizen_id", "assigned_officer_id", "review_report")


class AssignComplaintSchema(Schema):
    """
    Schema for assigning a complaint to an officer.
    """

    officer_id = fields.UUID(required=True)

    assignment_note = fields.String(
        required=False,
        allow_none=True,
    )

    @validates("assignment_note")
    def validate_assignment_note(self, value, **kwargs):
        """
        Validate assignment note.
        """

        if value and len(value.strip()) > 500:
            raise ValidationError(
                "Assignment note cannot exceed 500 characters."
            )

class ReopenComplaintSchema(Schema):
    reason = fields.String(
        required=True,
        validate=validate.Length(
            min=10,
            max=500,
        ),
    )