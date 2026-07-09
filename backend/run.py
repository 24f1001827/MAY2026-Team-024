from app import create_app

app = create_app()

@app.route("/")
def home():
    return "Flask App is running"

if __name__ == "__main__":
    app.run()