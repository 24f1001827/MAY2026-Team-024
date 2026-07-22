from app.models import Department

class DepartmentRepository:

    @staticmethod
    def get_by_name(name):
        return Department.query.filter_by(name=name).first()