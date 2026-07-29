from app.extensions import db
from app.models import AgencyProposal,ProposalStatus


class AgencyProposalRepository:
    """
    Repository for agency proposal operations.
    """

    @staticmethod
    def create(data):
        proposal = AgencyProposal(**data)

        db.session.add(proposal)

        return proposal

    @staticmethod
    def get_by_tender_and_agency(
        tender_id,
        agency_id,
    ):
        return AgencyProposal.query.filter_by(
            tender_id=tender_id,
            agency_id=agency_id,
            deleted_at=None,
        ).first()

    @staticmethod
    def get_by_agency_id(
        agency_id,
    ):
        return (
            AgencyProposal.query.filter_by(
                agency_id=agency_id,
                deleted_at=None,
            )
            .order_by(
                AgencyProposal.created_at.desc()
            )
            .all()
        )

    @staticmethod
    def get_by_tender_id(tender_id):
        """
        Retrieve all proposals submitted for a tender.
        """

        return (
            AgencyProposal.query.filter_by(
                tender_id=tender_id,
            )
            .order_by(
                AgencyProposal.created_at.asc(),
            )
            .all()
        )

    @staticmethod
    def get_by_id(proposal_id):
        """
        Retrieve proposal by ID.
        """

        return AgencyProposal.query.get(proposal_id)

    @staticmethod
    def reject_other_proposals(
        tender_id,
        accepted_proposal_id,
    ):
        """
        Reject all other proposals for the tender.
        """

        AgencyProposal.query.filter(
            AgencyProposal.tender_id == tender_id,
            AgencyProposal.id != accepted_proposal_id,
            AgencyProposal.status != ProposalStatus.REJECTED,
        ).update(
            {
                "status": ProposalStatus.REJECTED,
            },
            synchronize_session=False,
        )

    @staticmethod
    def update():
        db.session.commit()