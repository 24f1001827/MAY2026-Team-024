from app.extensions import db
from app.models.base_model import BaseModel
from app.models.enums import ProposalStatus


class AgencyProposal(BaseModel):
    __tablename__ = "agency_proposals"

    id = db.Column(
        db.Integer,
        primary_key=True,
        autoincrement=True,
    )

    tender_id = db.Column(
        db.Integer,
        db.ForeignKey("tenders.id"),
        nullable=False,
    )

    agency_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey("agencies.user_id"),
        nullable=False,
    )

    proposal_amount = db.Column(
        db.Numeric(12, 2),
        nullable=False,
    )

    proposal_document = db.Column(
        db.String(500),
        nullable=True,
    )

    remarks = db.Column(
        db.Text,
        nullable=True,
    )

    status = db.Column(
        db.Enum(ProposalStatus),
        default=ProposalStatus.SUBMITTED,
        nullable=False,
    )

    # -------------------------
    # Relationships
    # -------------------------

    tender = db.relationship(
        "Tender",
        back_populates="proposals",
    )

    agency = db.relationship(
        "Agency",
        back_populates="proposals",
    )

    def __repr__(self):
        return (
            f"<AgencyProposal "
            f"Tender={self.tender_id} "
            f"Agency={self.agency_id}>"
        )