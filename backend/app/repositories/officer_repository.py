from app.models import Officer
from app.extensions import db

class OfficerRepository:

    @staticmethod
    def create(data):

        officer = Officer(**data)

        db.session.add(officer)

        return officer

    @staticmethod
    def get_by_user_id(user_id):

        return Officer.query.filter_by(
            user_id=user_id
        ).first()