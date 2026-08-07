from app.extensions import db
from app.models.base_model import BaseModel


class AppSettings(BaseModel):
    """
    Organization-wide settings, stored as a single row (id = 1).
    """

    __tablename__ = "app_settings"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    # When True, complaints wait in the department's queue for its head to allot
    # manually. When False, they're auto-assigned to the least-loaded officer.
    manual_allotment = db.Column(
        db.Boolean,
        default=True,
        nullable=False,
    )

    def __repr__(self):
        return f"<AppSettings manual_allotment={self.manual_allotment}>"
