from app import create_app
from app.celery_app import celery_init_app

app = create_app()
celery_app=celery_init_app(app)

@app.route("/")
def home():
    return "Flask App is running"

if __name__ == "__main__":
    app.run()