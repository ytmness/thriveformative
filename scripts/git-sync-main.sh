#!/bin/bash
# Sincroniza el repo con origin/main sin merge (evita fallos de git pull por cambios locales).
# Uso en el servidor:
#   bash /var/www/thriveformative/scripts/git-sync-main.sh

set -e

BRANCH="${BRANCH:-main}"
REMOTE="${REMOTE:-origin}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: no estás dentro de un repositorio git."
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current || true)"
if [ -n "$CURRENT_BRANCH" ] && [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "==> Cambiando de rama $CURRENT_BRANCH → $BRANCH"
  git checkout "$BRANCH"
fi

echo "==> git fetch $REMOTE $BRANCH"
git fetch "$REMOTE" "$BRANCH"

echo "==> git reset --hard $REMOTE/$BRANCH"
git reset --hard "$REMOTE/$BRANCH"

echo "==> HEAD actual:"
git log -1 --oneline
