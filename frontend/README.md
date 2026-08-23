# Rastro — Frontend

The web dashboard for **Rastro**, a civic complaint-management platform. Citizens
file and track complaints; officers, agencies, and admins triage and resolve them
across departments, tenders, and notifications.

Built with the **Next.js App Router**. This is a modified Next.js build — see
officail Next.js documentation before writing code, as some conventions differ from
stock Next.

## Tech stack

| Area        | Choice                                                        |
| ----------- | ------------------------------------------------------------ |
| Framework   | Next.js `16.2.9` (App Router) · React `19.2`                 |
| Language    | TypeScript `5`                                               |
| Styling     | Tailwind CSS `4` · `tw-animate-css` · `class-variance-authority` |
| UI          | shadcn (`4`) wrapping Radix UI · Hugeicons                   |
| Maps        | `@vis.gl/react-google-maps` (complaints map + location picker) |
| Location    | `postalcodes-india` (State→District→City→PIN cascade, server-side) |
| Command/UI  | `cmdk` (comboboxes) · `recharts`, `react-day-picker`, `embla-carousel-react` (registry components) |
| Package mgr | **Bun** (`only-allow bun` is enforced on install)            |
| Lint / hooks| ESLint `9` (`eslint-config-next`) · Husky                    |

> **The app talks to the real Flask backend.** Requests go through Next route
> handlers under `app/api/`, which forward the caller's Bearer token to Flask
> (`lib/api/backend.ts`). Sessions are real: `lib/auth/session.ts` holds the
> backend-issued JWT and `lib/auth/current-user.ts` verifies it server-side for
> role gating. There is no mock data layer.

## Prerequisites

Install these before you start:

- **[Bun](https://bun.sh) `1.3+`** — the only supported package manager. The
  `preinstall` hook (`only-allow bun`) rejects `npm`, `pnpm`, and `yarn`.
  ```bash
  curl -fsSL https://bun.sh/install | bash    # macOS / Linux
  # then restart your shell and check:
  bun --version
  ```
- **Git**
- *(optional)* A **Google Maps JavaScript API** key — only needed to render the
  complaints map; the rest of the app runs fine without it.

## Setup — from clone to running

This repo is a monorepo; the frontend lives in the `frontend/` subdirectory.

### 1. Clone the repository

```bash
git clone git@github.com:24f1001827/MAY2026-Team-024.git
# or over HTTPS:
# git clone https://github.com/24f1001827/MAY2026-Team-024.git
```

### 2. Enter the frontend directory

```bash
cd MAY2026-Team-024/frontend
```

All the commands below are run from here.

### 3. Install dependencies

```bash
bun install
```

This also sets up Husky git hooks (via the `prepare` script). If you see an
"only bun is allowed" error, you invoked the wrong package manager — use `bun`.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and, if you want the complaints map, set
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (create a key in Google Cloud with the *Maps
JavaScript API* enabled). You can leave it blank to skip the map — every other
page still works. See [Environment variables](#environment-variables) below.

### 5. Start the dev server

```bash
bun dev
```

This runs two processes in parallel (via `concurrently`):

- **`routes`** — watches `app/dashboard` and regenerates `nav/generated/*` on
  change, so the `routes` builder always matches the filesystem.
- **`next`** — the Next.js dev server.

When you see `next` ready, open **http://localhost:3000**.

### 6. Sign in

Accounts are real and live in the backend database, so **the backend must be
running** (see [`../backend/README.md`](../backend/README.md)) and
`API_BASE_URL` must point at it.

- The backend seeds a default **admin** on first boot (see `app/utils/admin_create.py`).
- Everyone else registers at **http://localhost:3000/register** — pick Citizen,
  Officer, or Agency. Officer and Agency accounts land in *pending approval* and
  cannot sign in until an admin approves them; Citizens can sign in immediately.
- Passwords must be 8+ characters with an uppercase, a lowercase, a digit, and
  one of `!@#$%^&*(),.?":{}|<>`. The register form shows a live checklist.
- Phone numbers are Indian mobiles: 10 digits starting 6–9.

The authenticated dashboard is under `/dashboard`; public pages (home, login,
register) live under `app/(marketing)`.

> **Troubleshooting:** if a dashboard page fails to build with an error like
> `Property 'detail' does not exist on type 'string'`, your route metadata is
> stale — run `bun run routes:generate` (or just use `bun dev`, which watches
> for you).

## Scripts

| Command                 | What it does                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| `bun dev`               | Runs `routes:watch` + `next dev` together (route codegen stays live) |
| `bun run dev:next`      | Next dev server only, without the route watcher                    |
| `bun run build`         | Production build                                                    |
| `bun run start`         | Serve the production build                                         |
| `bun run lint`          | ESLint                                                              |
| `bun run routes:generate` | Regenerate `nav/generated/*` from the filesystem once            |
| `bun run routes:watch`  | Regenerate route metadata on file changes                          |

## Environment variables

Copy `.env.example` to `.env.local` and fill these in:

| Variable                          | Required | Purpose                                              |
| --------------------------------- | -------- | ---------------------------------------------------- |
| `API_BASE_URL`                    | **yes**  | Base URL of the Flask backend, server-side only. Defaults to `http://localhost:5000` |
| `JWT_SECRET_KEY`                  | **yes**  | Verifies the backend-issued JWT server-side. **Must match the backend's `JWT_SECRET_KEY` exactly** — when unset, every request is treated as unauthenticated (fail-closed) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | no\*     | Renders the complaints map and the location picker    |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`  | no       | Map ID for styled Advanced Markers (defaults to Google's `DEMO_MAP_ID`) |

Neither `API_BASE_URL` nor `JWT_SECRET_KEY` carries the `NEXT_PUBLIC_` prefix, so
neither reaches the browser — keep it that way.

\* Without a Maps key the map and location picker don't render; the rest of the
app works, but filing a complaint needs coordinates, so you'll want it.

## Project structure

Code is organized **feature-first**. See [`AGENTS.md`](./AGENTS.md) for the full
contract; the short version:

```
app/                     App Router entry points
  (marketing)/           Public pages (home, login, register)
  dashboard/             Authenticated dashboard (complaints, officers, …)
  api/                   Route handlers
features/{feature}/      Feature-specific components (e.g. features/officer/…)
  common/                Shared/global components
components/
  shadcn/                Project wrappers around shadcn components (import these)
  ui/                    Raw shadcn/Radix primitives
  providers/             Query + theme providers
hooks/{feature}/         Feature hooks (use-*, keys.ts, …)
lib/
  auth/                  Session + JWT verification + role gating
  utils/{feature}/       Feature-specific utilities
nav/                     Navigation platform — routes, sidebar, breadcrumbs, RBAC
types/{feature}/         Feature types
scripts/                 Route codegen (generate/watch)
```

### Navigation platform (`@/nav`)

`nav/` is the single source of truth for routing, the sidebar, breadcrumbs, and
access control. **Never hardcode internal paths** — use the generated `routes`
builder:

```ts
import { routes } from "@/nav"

routes.officers.href                    // "/dashboard/officers"
routes.officers.create                  // "/dashboard/officers/create"
routes.officers.detail(id).href         // "/dashboard/officers/:id"
routes.officers.detail(id).edit         // "/dashboard/officers/:id/edit"
```

The `routes` object is **generated from the filesystem**. When you add or move a
route folder under `app/dashboard`, regenerate:

```bash
bun run routes:generate
```

`bun dev` does this automatically via `routes:watch`. If you add routes and skip
regeneration, the build fails with type errors like
`Property 'detail' does not exist on type 'string'`. Register a route's UI
(label, icon, order, access) in `nav/metadata/<module>.meta.ts`, not in
components.

### shadcn wrapper pattern

Don't import raw shadcn primitives in app code. Each component is re-wrapped
under `components/shadcn/` (which pulls from `components/ui/`); import from there
so project variants live in one place:

```ts
import { Button } from "@/components/shadcn/button"      // 
import { Button } from "@/components/ui/button"          // 
```

### Auth & roles

Roles are `Citizen | Officer | Admin | Agency`. Server components gate access
with helpers from `lib/auth/current-user`:

```ts
import { requireRoles } from "@/lib/auth/current-user"

await requireRoles(["Admin"])   // redirects non-admins to the dashboard home
```

These verify the backend-issued JWT server-side using `JWT_SECRET_KEY`, so the
role in the token is authoritative. Verification fails closed: an unset or
mismatched secret means every caller is anonymous.
