# Complaint Management System - Backend

A Flask-based REST API backend for the **Complaint Management System**, designed to streamline the complaint resolution process from complaint registration to final closure. The system supports multiple user roles, complaint assignment, review reports, budget allocation, tender management, work orders, notifications, and complaint lifecycle management.

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Create Virtual Environment

Windows

```bash
python -m venv .venv
```

Activate

```bash
.venv\Scripts\activate
```

Linux/macOS

```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Configure Environment Variables

Create a `.env` file.

Example:

```env
# ==========================
# Flask
# ==========================

FLASK_APP=run.py
FLASK_ENV=1

SECRET_KEY=
JWT_SECRET_KEY=

# ==========================
# PostgreSQL
# ==========================

POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_DB=civic_connect

DATABASE_URI=

# ==========================
# Google OAuth
# ==========================

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ==========================
# Cloudinary
# ==========================

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ==========================
# Celery
# ==========================

CELERY_BROKER_URL=
CELERY_RESULT_BACKEND=

# ==========================
# Flask-Mail
# ==========================

MAIL_SERVER=
MAIL_PORT=
MAIL_USE_TLS=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_DEFAULT_SENDER=

# Gemini complaint triage (free tier supported)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

---


## Database & Redis Setup

This project uses **Docker Compose** to run PostgreSQL and Redis locally.

Start the required services:

```bash
docker compose up -d
```

Verify the containers are running:

```bash
docker ps
```

### Once PostgreSQL is running, apply the database migrations:


Initialize migrations (only once)

```bash
flask db init
```

Create migration

```bash
flask db migrate -m "Initial migration"
```

Apply migration

```bash
flask db upgrade
```

---

## Running the Application

```bash
python run.py
```

or

```bash
flask run
```

The backend will start on:

```
http://127.0.0.1:5000
```

---

## Celery

Start Celery Worker

```bash
celery -A run:celery_app worker --pool=solo --loglevel=info 
```

---

