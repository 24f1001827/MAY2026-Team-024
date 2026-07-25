from flask import Flask

from app.config import Config

from app.extensions import db, migrate, jwt, cors, oauth

from app.models import *

from app.routes import auth_bp,complaint_bp

from app.extensions import init_google_oauth, configure_cloudinary


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

    init_google_oauth(app)

    configure_cloudinary(app)

    # ------------------------
    # Blueprint Registration
    # ------------------------
    app.register_blueprint(auth_bp)
    app.register_blueprint(complaint_bp)
    return app
