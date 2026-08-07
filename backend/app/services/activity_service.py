from app.repositories import ComplaintRemarkRepository


class ActivityService:
    """
    Records complaint activity as ComplaintRemark rows — the complaint's
    timeline. Entries are added to the current session; the calling service
    commits them atomically with the action they describe.
    """

    @staticmethod
    def record(
        complaint_id,
        message,
        user_id=None,
        status_from=None,
        status_to=None,
        is_internal=False,
    ):
        """
        Add an activity entry.

        - `user_id`: the actor, or None for system events (renders as "System").
        - `status_from` / `status_to`: ComplaintStatus enums for a transition,
          stored as their string values; omit for non-status events.
        """

        return ComplaintRemarkRepository.create(
            {
                "complaint_id": complaint_id,
                "user_id": user_id,
                "remark": message,
                "is_internal": is_internal,
                "status_from": status_from.value if status_from else None,
                "status_to": status_to.value if status_to else None,
            }
        )
