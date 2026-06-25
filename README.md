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

2. Install Dependanceies

```bash
cd frontend
```
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
