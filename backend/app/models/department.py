from app.extensions import db
from app.models.base_model import BaseModel

class Department(BaseModel):

    __tablename__="departments"

    id=db.Column(db.Integer,
                 primary_key=True,
                 autoincrement=True
    )

    name=db.Column(
        db.String(100),
        unique=True,
        nullable=False,
    )

    description=db.Column(
         db.Text,
         nullable=True
    )

    budget=db.Column(
        db.Numeric(12,2),
        default=0
    )

    # -------------------------
    # Relationships
    # -------------------------

    officers = db.relationship(
        "Officer",
        back_populates="department",
        lazy="select",
    )

    complaints = db.relationship(
        "Complaint",
        back_populates="department",
        lazy="select",
    )

    def __repr__(self):
        return f"<Department {self.name}>"
    
