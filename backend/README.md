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

# Provider-agnostic LangChain complaint intelligence
LLM_PROVIDER=google
LLM_MODEL=gemini-2.5-flash
GOOGLE_API_KEY=your_google_api_key
EMBEDDING_PROVIDER=google
EMBEDDING_MODEL=models/gemini-embedding-001

# Duplicate grouping: same normalized pincode/locality first, then hard distance
# filtering, then embedding cosine similarity.
DUPLICATE_EMBEDDING_THRESHOLD=0.84
DUPLICATE_DISTANCE_MODE=hard_filter
DUPLICATE_MAX_DISTANCE_METERS=150
DUPLICATE_DISTANCE_SCORE_RADIUS_METERS=250
DUPLICATE_DISTANCE_WEIGHT=0.15
DUPLICATE_MAX_CANDIDATES=20
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

The `migrations/` directory is already in the repo. **Do not run `flask db init`**
— it recreates that directory and would discard the existing revision history.
To bring a fresh database up to date, only this is needed:

```bash
flask db upgrade
```

Check where you are at any point:

```bash
flask db current      # the revision your database is stamped at
flask db heads        # the latest revision(s) in the repo — should be exactly one
```

Only run `flask db migrate -m "..."` when you have **changed a model** and want to
generate a new revision for it. Always read the generated file before applying it;
autogenerate can produce spurious drops.

<details>
<summary><strong>"relation already exists" on <code>flask db upgrade</code></strong></summary>

This means the schema is present but `alembic_version` doesn't record it, so
Alembic replays the chain from the beginning and collides with tables that are
already there. Confirm with:

```bash
flask db current      # prints nothing, or a revision not in migrations/versions/
```

The fix is to record the true position rather than re-running migrations. Find
the revision(s) matching your schema, insert them, then upgrade:

```sql
-- example: a database already carrying both pre-merge branches
INSERT INTO alembic_version (version_num) VALUES ('b8c9d0e1f2a3'), ('a8b9c0d1e2f3');
```

```bash
flask db upgrade
```

Two rows is valid — it's how Alembic represents a multi-head state, and the
merge revision collapses them back to one. `flask db stamp` takes only a single
revision, so it can't express that on its own.

</details>

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

## Tests

```bash
pytest                 # whole suite
pytest -q tests/test_complaint_service.py    # one file
```

Tests run against an in-memory SQLite database (see `tests/conftest.py`), so they
need neither Postgres nor the LLM provider keys.

---

## Celery

Start Celery Worker

```bash
celery -A run:celery_app worker --pool=solo --loglevel=info 
```

---

