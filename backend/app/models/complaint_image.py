from app.extensions import db
from app.models.base_model import BaseModel


class ComplaintImage(BaseModel):
    __tablename__ = "complaint_images"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    complaint_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("complaints.id"),
        nullable=False,
    )

    uploaded_by = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=False,
    )

    image_url = db.Column(
        db.Text,
        nullable=False,
    )

    # -------------------------
    # Relationships
    # -------------------------

    complaint = db.relationship(
        "Complaint",
        back_populates="images",
    )

    uploader = db.relationship(
        "User",
    )

    def __repr__(self):
        return f"<ComplaintImage {self.id}>"