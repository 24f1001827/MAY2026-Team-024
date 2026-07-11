from app.extensions import db
import pytz
from datetime import datetime


IST = pytz.timezone("Asia/Kolkata")

class BaseModel(db.Model):
    __abstract__ =True

    created_at=db.Column(db.DateTime,default=lambda:datetime.now(IST),nullable=False)
    updated_at=db.Column(db.DateTime,default=lambda:datetime.now(IST),nullable=False)
    deleted_at=db.Column(db.DateTime)

