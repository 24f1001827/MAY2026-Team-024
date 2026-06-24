# Git Workflow (SOP)

This document is the standard operating procedure (SOP) for branching and merging in this repository. All contributors are expected to follow it.

## Branches

| Branch | Role |
| --- | --- |
| `development` | **Default branch.** All day-to-day work targets this branch. Feature branches are created from and merged back into `development`. |
| `staging` | **Deployment branch.** Code is promoted here from `development` for release/deployment. |

- `development` is the default branch on the remote — new clones and PRs default to it.
- Do not commit directly to `staging`; it only receives reviewed, deployment-ready changes promoted from `development`.
## Merge strategy: rebase-merge

We use a **rebase-merge** strategy to keep the commit history **linear** (no merge commits, no tangled graph).

### Working on a feature

1. Branch off the latest `development`:
   ```bash
   git checkout development
   git fetch
   git rebase origin/development
   git checkout -b feature/your-feature
   ```
2. Commit your work on the feature branch.
3. Before opening (or updating) a PR, rebase onto the latest `development`:
   ```bash
   git fetch
   git rebase origin/development
   ```
4. Resolve any conflicts during the rebase, then force-push your feature branch:
   ```bash
   git push --force-with-lease
   ```

### Merging a PR

- Merge PRs into `development` using **"Rebase and merge"** — never "Create a merge commit".
- This replays the PR commits on top of `development`, keeping the history a straight line.

### Promoting to staging (deployment)

Promote `development` to `staging` with a rebase as well, so `staging` history stays linear and matches `development`:

```bash
git checkout staging
git pull --rebase origin staging
git rebase origin/development
git push origin staging
```

## Rules of thumb

- **Always rebase, never merge.** Keep `pull.rebase` enabled locally:
  ```bash
  git config pull.rebase true
  ```
- Keep feature branches short-lived and rebased frequently to minimize conflicts.
- Use `--force-with-lease` (not `--force`) when pushing rebased branches to avoid clobbering others' work.
- Never rebase or force-push `development` or `staging` — only feature branches.
