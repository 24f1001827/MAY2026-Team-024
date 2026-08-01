from flask import Flask

from app.config import Config

from app.extensions import db, migrate, jwt, cors, oauth, mail

from app.models import *

from app.celery_app import celery_init_app

from app.routes import (
    auth_bp,
    complaint_bp,
    admin_complaint_bp,
    admin_user_bp,
    officer_bp,
    agency_bp,
    notification_bp
)

from app.extensions import init_google_oauth, configure_cloudinary

from app.utils import create_admin


def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("SECRET_KEY is not set")
    if not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError("JWT_SECRET_KEY is not set")

    db.init_app(app)

    migrate.init_app(app, db)

    jwt.init_app(app)

    cors.init_app(app)

    oauth.init_app(app)

    mail.init_app(app)

    init_google_oauth(app)

    configure_cloudinary(app)

    with app.app_context():
        create_admin()

    # ------------------------
    # Blueprint Registration
    # ------------------------
    app.register_blueprint(auth_bp)
    app.register_blueprint(complaint_bp)
    app.register_blueprint(admin_complaint_bp)
    app.register_blueprint(admin_user_bp)
    app.register_blueprint(officer_bp)
    app.register_blueprint(agency_bp)
    app.register_blueprint(notification_bp)
    return app
