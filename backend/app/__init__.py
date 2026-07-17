from flask import Flask

from app.config import Config

from app.extensions import db, migrate, jwt, cors, oauth


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

    return app
