from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth

import cloudinary

db = SQLAlchemy()

migrate = Migrate()

jwt = JWTManager()

cors = CORS()

oauth = OAuth()

def init_google_oauth(app):
    """
    Register Google as an OAuth provider with Authlib.
 
    Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to be set in
    app.config (loaded from your .env via Config).
    """
 
    oauth.register(
        name="google",
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

def configure_cloudinary(app):
    """
    Configure Cloudinary.
    """

    cloudinary.config(
        cloud_name=app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=app.config["CLOUDINARY_API_KEY"],
        api_secret=app.config["CLOUDINARY_API_SECRET"],
        secure=True,
    )