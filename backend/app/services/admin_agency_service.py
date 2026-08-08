from app.repositories import AgencyRepository, WorkOrderRepository


class AdminAgencyService:
    """
    Admin-facing read operations over the agency directory.
    """

    @staticmethod
    def get_all_agencies():
        """
        All active agencies (joined to their user), for the admin directory.
        """

        return AgencyRepository.get_all()

    @staticmethod
    def get_agency(agency_id):
        """
        A single agency by its (shared) user id.

        Raises:
            ValueError: if no agency exists for that id.
        """

        agency = AgencyRepository.get_by_user_id(agency_id)

        if agency is None:
            raise ValueError("Agency not found.")

        return agency

    @staticmethod
    def get_agency_work_orders(agency_id):
        """
        Work orders assigned to an agency (the work it's executing).

        Raises:
            ValueError: if the agency doesn't exist.
        """

        agency = AgencyRepository.get_by_user_id(agency_id)

        if agency is None:
            raise ValueError("Agency not found.")

        return WorkOrderRepository.get_by_agency_id(agency_id)
