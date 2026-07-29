from app.repositories import (
    TenderRepository,
    AgencyProposalRepository,
    AgencyRepository,
    WorkOrderRepository,
)
from app.models import TenderStatus, ProposalStatus, WorkOrderStatus, ComplaintStatus ,IST
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
    def submit_proposal(user_id, tender_id, data, proposal_document):
        """
        Submit proposal for a tender.
        """

        agency = AgencyRepository.get_by_user_id(
            user_id,
        )

        if agency is None:
            raise ValueError("Agency not found.")

        tender = TenderRepository.get_by_id(
            tender_id,
        )

        if tender is None:
            raise ValueError("Tender not found.")

        if tender.status != TenderStatus.OPEN:
            raise ValueError("Tender is not open.")

        if tender.closing_date < datetime.now(IST):
            raise ValueError(
                "Tender submission deadline has passed."
            )

        existing = AgencyProposalRepository.get_by_tender_and_agency(
            tender_id,
            agency.user_id,
        )

        if existing:
            raise ValueError("Proposal already submitted.")

        proposal = AgencyProposalRepository.create(
            {
                "tender_id": tender.id,
                "agency_id": agency.user_id,
                "proposal_amount": data["proposal_amount"],
                "proposal_document": upload_document(
                    proposal_document, folder="proposal_documents"
                )["document_url"],
                "remarks": data.get("remarks"),
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
            raise ValueError("Agency not found.")

        return AgencyProposalRepository.get_by_agency_id(
            agency.user_id,
        )

    @staticmethod
    def get_work_orders(
        user_id,
    ):
        """
        Get all work orders assigned to the logged-in agency.
        """

        agency = AgencyRepository.get_by_user_id(
            user_id,
        )

        if agency is None:
            raise ValueError("Agency not found.")

        work_orders = WorkOrderRepository.get_by_agency_id(
            agency.user_id,
        )

        return work_orders

    @staticmethod
    def get_work_order(
        user_id,
        work_order_id,
    ):
        """
        Get work order details.
        """

        agency = AgencyRepository.get_by_user_id(
            user_id,
        )

        if agency is None:
            raise ValueError(
                "Agency not found."
            )

        work_order = WorkOrderRepository.get_by_id(
            work_order_id,
        )

        if work_order is None:
            raise ValueError(
                "Work order not found."
            )

        if work_order.agency_id != agency.user_id:
            raise PermissionError(
                "You are not authorized to access this work order."
            )

        return work_order

    @staticmethod
    def update_work_order_status(
        user_id,
        work_order_id,
        data,
        completion_proof=None,
    ):
        """
        Update work order status.
        """

        agency = AgencyRepository.get_by_user_id(user_id)

        if agency is None:
            raise ValueError("Agency not found.")

        work_order = WorkOrderRepository.get_by_id(work_order_id)

        if work_order is None:
            raise ValueError("Work order not found.")

        if work_order.agency_id != agency.user_id:
            raise PermissionError(
                "You are not authorized to update this work order."
            )

        status = data["status"]

        if (
            work_order.status == WorkOrderStatus.ASSIGNED
            and status == WorkOrderStatus.IN_PROGRESS
        ):
            work_order.status = WorkOrderStatus.IN_PROGRESS
            work_order.start_date = datetime.now(IST).date()

        elif (
            work_order.status == WorkOrderStatus.IN_PROGRESS
            and status == WorkOrderStatus.COMPLETED
        ):
            if completion_proof is None:
                raise ValueError(
                    "Completion proof is required."
                )

            proof_url = upload_document(
                completion_proof,
                folder="work-orders/completion-proofs",
            )

            work_order.status = WorkOrderStatus.COMPLETED
            work_order.end_date = datetime.now(IST).date()
            work_order.completion_proof_url = proof_url["document_url"]

            work_order.tender.complaint.status = (
                ComplaintStatus.WORK_COMPLETED
            )

        else:
            raise ValueError(
                "Invalid status transition."
            )

        db.session.commit()

        return work_order