#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

UPSTREAM_MATCH="nexu-io/open-design"

usage() {
  cat <<'EOF'
Usage:
  bash scripts/upstream-sync-guard.sh setup
  bash scripts/upstream-sync-guard.sh status
  bash scripts/upstream-sync-guard.sh sync
EOF
}

ensure_repo() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
    echo "[ERROR] Not inside a git repository." >&2
    exit 1
  }
}

setup_guard() {
  mkdir -p .githooks
  cat > .githooks/pre-push <<'EOF'
#!/usr/bin/env sh
set -eu
remote_name="${1:-}"
remote_url="${2:-}"
case "$remote_url" in
  *nexu-io/open-design* )
    echo "[BLOCKED] Push to upstream is not allowed: $remote_name -> $remote_url" >&2
    exit 1
    ;;
esac
exit 0
EOF
  chmod +x .githooks/pre-push
  git config core.hooksPath .githooks

  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url --push origin DISABLED
  fi
  if git remote get-url upstream >/dev/null 2>&1; then
    git remote set-url --push upstream DISABLED
  fi

  if ! git remote get-url fork >/dev/null 2>&1; then
    echo "[WARN] remote 'fork' not found. Please add your writable fork remote."
  fi

  echo "[OK] Guard setup completed."
}

show_status() {
  echo "== remotes =="
  git remote -v
  echo
  echo "== hooksPath =="
  git config --get core.hooksPath || true
  echo
  echo "== branch/status =="
  git status --short --branch
}

sync_from_upstream() {
  if ! git remote get-url upstream >/dev/null 2>&1; then
    echo "[ERROR] remote 'upstream' not found." >&2
    exit 1
  fi
  if ! git remote get-url fork >/dev/null 2>&1; then
    echo "[ERROR] remote 'fork' not found (push target required)." >&2
    exit 1
  fi

  if [[ -n "$(git status --porcelain)" ]]; then
    echo "[ERROR] Working tree is not clean. Commit/stash first." >&2
    exit 1
  fi

  git fetch upstream
  git checkout main

  if git merge upstream/main --no-edit; then
    git push fork main
    echo "[OK] Synced upstream/main into local main and pushed to fork/main."
  else
    git merge --abort || true
    echo "[CONFLICT] Merge conflict detected. Resolve manually." >&2
    exit 2
  fi
}

main() {
  ensure_repo
  cmd="${1:-}"
  case "$cmd" in
    setup) setup_guard ;;
    status) show_status ;;
    sync) sync_from_upstream ;;
    *) usage; exit 1 ;;
  esac
}

main "${1:-}"
