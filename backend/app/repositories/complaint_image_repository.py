from app.extensions import db
from app.models import ComplaintImage,IST


class ComplaintImageRepository:
    """
    Repository for complaint image database operations.
    """

    @staticmethod
    def create(data):
        """
        Create a complaint image record.
        """

        complaint_image = ComplaintImage(**data)

        db.session.add(complaint_image)

        return complaint_image

    @staticmethod
    def get_by_complaint_id(complaint_id):
        """
        Retrieve all images for a complaint.
        """

        return ComplaintImage.query.filter_by(
            complaint_id=complaint_id
        ).all()

    @staticmethod
    def delete_by_id(image_id):
        """
        Delete a complaint image by ID.
        """

        image = ComplaintImage.query.filter_by(
            id=image_id
        ).first()

        if image:
            db.session.delete(image)

        return image