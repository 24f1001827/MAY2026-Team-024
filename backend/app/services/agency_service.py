from app.repositories import TenderRepository,AgencyProposalRepository,AgencyRepository
from app.models import TenderStatus, ProposalStatus,IST
from app.extensions import db
from datetime import datetime
from app.utils import upload_document


class AgencyService:
    """
    Agency service.
    """

    @staticmethod
    def get_open_tenders():
        """
        Retrieve all open tenders.
        """

        return TenderRepository.get_open_tenders()

    @staticmethod
    def get_tender_details(tender_id):
        """
        Retrieve details of an open tender.
        """

        tender = TenderRepository.get_by_id(
            tender_id,
        )

        if tender is None:
            raise ValueError("Tender not found.")

        if tender.status != TenderStatus.OPEN:
            raise ValueError("Tender is not available.")

        return tender


    @staticmethod
    def submit_proposal(
        user_id,
        tender_id,
        data,
        proposal_document
    ):
        """
        Submit proposal for a tender.
        """

        agency = AgencyRepository.get_by_user_id(
            user_id,
        )

        if agency is None:
            raise ValueError(
                "Agency not found."
            )

        tender = TenderRepository.get_by_id(
            tender_id,
        )

        if tender is None:
            raise ValueError(
                "Tender not found."
            )

        if tender.status != TenderStatus.OPEN:
            raise ValueError(
                "Tender is not open."
            )

        if tender.closing_date < datetime.now(IST):
            raise ValueError(
                "Tender submission deadline has passed."
            )

        existing = (
            AgencyProposalRepository.get_by_tender_and_agency(
                tender_id,
                agency.user_id,
            )
        )

        if existing:
            raise ValueError(
                "Proposal already submitted."
            )
        

        proposal = AgencyProposalRepository.create(
            {
                "tender_id": tender.id,
                "agency_id": agency.user_id,
                "proposal_amount": data["proposal_amount"],
                "proposal_document": upload_document(proposal_document, folder="proposal_documents")["document_url"],
                "remarks": data.get(
                    "remarks"
                ),
                "status": ProposalStatus.SUBMITTED,
            }
        )

        db.session.commit()

        return proposal

    @staticmethod
    def get_proposals(user_id):
        """
        Retrieve all proposals submitted by an agency.
        """

        agency = AgencyRepository.get_by_user_id(
            user_id,
        )

        if agency is None:
            raise ValueError(
                "Agency not found."
            )

        return AgencyProposalRepository.get_by_agency_id(
            agency.user_id,
        )