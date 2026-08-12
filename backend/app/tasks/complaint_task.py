from celery import shared_task

from app.services.complaint_service import ComplaintService


@shared_task
def auto_close_complaint(complaint_id):
    """
    Automatically close a complaint after 7 days
    if the complaint is still in RESOLVED status.
    """

    return ComplaintService.auto_close_complaint(
        complaint_id
    )