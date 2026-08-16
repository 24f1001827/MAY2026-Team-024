from app.extensions import db
from app.models import ComplaintCluster


class ComplaintClusterRepository:
    @staticmethod
    def create(data):
        cluster = ComplaintCluster(**data)
        db.session.add(cluster)
        return cluster

    @staticmethod
    def get_by_id(cluster_id):
        return ComplaintCluster.query.filter_by(id=cluster_id, deleted_at=None).first()
