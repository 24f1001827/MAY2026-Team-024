from app.extensions import db
from app.models import WorkOrder

class WorkOrderRepository:

    @staticmethod
    def create(data):
        """
        Create a work order.
        """

        work_order = WorkOrder(**data)

        db.session.add(work_order)

        return work_order

    @staticmethod
    def get_by_id(work_order_id):
        """
        Get work order by ID.
        """

        return (
            WorkOrder.query.filter_by(
                id=work_order_id,
                deleted_at=None,
            ).first()
        )

    @staticmethod
    def get_by_tender_id(tender_id):
        """
        Get work order by tender.
        """

        return (
            WorkOrder.query.filter_by(
                tender_id=tender_id,
                deleted_at=None,
            ).first()
        )

    @staticmethod
    def get_by_agency_id(agency_id):
        """
        Get agency work orders.
        """

        return (
            WorkOrder.query.filter_by(
                agency_id=agency_id,
                deleted_at=None,
            )
            .order_by(
                WorkOrder.created_at.desc()
            )
            .all()
        )
    
    @staticmethod
    def update(work_order):
        """
        Update work order.
        """

        db.session.add(work_order)

        return work_order