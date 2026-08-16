import uuid

from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import ComplaintPriority


class ComplaintCluster(BaseModel):
    """One real-world civic issue reported by one or more complaints."""

    __tablename__ = "complaint_clusters"

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = db.Column(db.String(100), nullable=False)
    priority = db.Column(db.Enum(ComplaintPriority), nullable=False)
    ai_priority_score = db.Column(db.Integer, nullable=False)
    base_priority_score = db.Column(db.Integer, nullable=False)
    latitude = db.Column(db.Numeric(10, 7), nullable=True)
    longitude = db.Column(db.Numeric(10, 7), nullable=True)
    locality = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(100), nullable=False)

    complaints = db.relationship("Complaint", back_populates="cluster")

    def __repr__(self):
        return f"<ComplaintCluster {self.id}>"
