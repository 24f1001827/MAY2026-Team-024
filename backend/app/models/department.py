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

    # The officer who heads this department. Nullable — a department may have no
    # head assigned. FK to users.id (an officer is identified by their user id).
    head_officer_id=db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("users.id"),
        nullable=True,
    )

    # -------------------------
    # Relationships
    # -------------------------

    # Direct link to the head officer's user record, for displaying their name.
    # `foreign_keys` disambiguates from the officers relationship below.
    head_officer = db.relationship(
        "User",
        foreign_keys=[head_officer_id],
        lazy="joined",
    )

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
    
