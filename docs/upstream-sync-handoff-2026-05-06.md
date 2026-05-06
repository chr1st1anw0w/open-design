# Upstream Sync Handoff (2026-05-06)

## Scope

This note records the repository policy and implementation for upstream sync safety.

- Upstream org repo (`nexu-io/open-design`) is fetch-only.
- Fork repo is the only push target.
- Sync direction is one-way: upstream -> fork.

## Current Remote Policy

Expected remote behavior:

- `fork`: fetch + push
- `origin`: fetch only
- `upstream`: fetch only

Local hardening applied:

```bash
git remote set-url --push origin DISABLED
git remote set-url --push upstream DISABLED
```

## Local Push Guard

A tracked pre-push hook is enabled to block any push URL containing `nexu-io/open-design`.

- Hook file: `.githooks/pre-push`
- Repo config: `core.hooksPath=.githooks`

Validation:

```bash
git config core.hooksPath
git remote -v
```

## Documentation and Agent Rules

Added/updated files:

- `docs/fork-upstream-sync-policy.md`
- `AGENTS.md` (Fork Sync Policy section)

These define:

- Never push to upstream.
- Always sync from upstream into fork.
- If sync conflicts occur, request maintainer review.

## GitHub Actions Auto Sync

Workflow:

- `.github/workflows/sync-upstream.yml`

Behavior:

1. Runs daily and on manual dispatch.
2. Fetches `upstream/main`.
3. Attempts merge into `main`.
4. If merge succeeds: push to repo `main`.
5. If merge conflicts: abort merge and open a GitHub issue for manual review.

## Required GitHub Repository Settings (Fork)

Apply in fork repository settings:

1. `Actions -> General -> Workflow permissions`:
   - `Read and write permissions`
2. Branch protection for `main` (recommended):
   - Require status checks before merge
   - Optionally require PR reviews based on team preference

## Operational Runbook

Manual sync when needed:

```bash
git fetch upstream
git checkout main
git merge upstream/main
pnpm typecheck
pnpm test
git push fork main
```

Conflict handling:

1. Resolve conflict locally.
2. Re-run checks.
3. Push resolved merge to fork.
4. Close sync conflict issue.
