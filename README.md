# Base Setup

## Repository

**Project:** MAY2026-Team-024

## Initial Setup

This is the base repository setup for the `Software Engineering` course for IITM BS Degree `MAY 2026` term `Team-024`.

### Project Structure

```text
MAY2026-Team-024/
├── backend/
├── frontend/
└── README.md
```

## Frontend Setup

To setup the frontend in the local environment, 

1. Clone the repo

```bash
git clone git@github.com:24f1001827/MAY2026-Team-024.git
```

2. Install dependencies

**Bun only.** `package.json` runs `only-allow bun` on preinstall, so `npm`,
`pnpm` and `yarn` are rejected.

```bash
cd frontend
bun install
```

3. Configure environment variables

```bash
cp .env.example .env.local
```

Set `API_BASE_URL` to the backend and `JWT_SECRET_KEY` to the **same value as the
backend's**. See [`frontend/README.md`](./frontend/README.md) for the full table.

4. Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Backend

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

```bash
cp .env.example .env
```

Fill in the values. The example file is the source of truth for the full list —
Flask secrets, Postgres, Google OAuth, Cloudinary, Celery, Flask-Mail, the LLM
provider keys, and the duplicate-detection thresholds. `backend/README.md`
explains the ones that need care.

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

`migrations/` is already committed. **Do not run `flask db init`** — it recreates
the directory and discards the revision history. A fresh database needs only:

```bash
flask db upgrade
```

Run `flask db migrate -m "..."` only after changing a model. See
[`backend/README.md`](./backend/README.md) for troubleshooting, including what to
do about `relation already exists`.

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

## Git Workflow

* Create feature branches from `development`
* Commit changes with clear messages
* Open pull requests for review
* Merge only after approval
* Will be using `rebase-merge` strategy to keep the history linear.

## Notes

* Keep dependencies updated.
* Follow project coding standards.
* Update documentation when adding new features.
