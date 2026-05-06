# Fork Upstream Sync Policy

This repository follows a strict one-way sync model:

- Upstream source: `nexu-io/open-design` (read/fetch only)
- Writable source of truth: maintainer fork repository
- Sync direction: upstream -> fork

## Remote Rules

- `upstream`: `https://github.com/nexu-io/open-design.git` (fetch only)
- `fork`: `https://github.com/<your-account>/open-design.git` (fetch + push)
- Do not push to any remote URL containing `nexu-io/open-design`.

## Local Guardrails

1. Block push URL for `origin` if it points to upstream:
   - `git remote set-url --push origin DISABLED`
2. Keep a tracked pre-push hook that rejects upstream push attempts.

## GitHub Repository Settings (Fork)

Apply these in the fork repo settings:

1. Branch protection for `main`:
   - Require pull request before merging (recommended for team mode)
   - Require status checks (`typecheck`, `test`) before merge
2. Actions permissions:
   - Allow workflows to read/write contents (required for auto-sync push)
3. Optional:
   - Add CODEOWNERS for conflict review routing
   - Enable issue notifications for sync conflict alerts

## Auto Sync Strategy

- Trigger daily by cron and manual dispatch.
- Workflow fetches upstream and tries `git merge upstream/main --no-edit`.
- If no conflict:
  - Push merge commit to fork `main` automatically.
- If conflict:
  - Abort merge.
  - Open an issue in fork with conflict notice and request manual review.

## Manual Conflict Resolution

1. `git fetch upstream`
2. `git checkout main`
3. `git merge upstream/main`
4. Resolve conflicts and run validation (`pnpm typecheck`, `pnpm test`)
5. Push to fork and close conflict issue.
