#!/bin/sh
# Builds the standalone page and commits it to the `deploy` branch (served by the site via a copy job).
set -e
cd "$(dirname "$0")/.."
node scripts/build-standalone.mjs
SRC=$(git rev-parse --short HEAD)
WT=$(mktemp -d)
if git ls-remote --exit-code origin deploy >/dev/null 2>&1; then
  git fetch -q origin deploy
  git worktree add -q "$WT" FETCH_HEAD
else
  git worktree add -q --detach "$WT"
  (cd "$WT" && git checkout -q --orphan deploy && git rm -rqf .)
fi
mkdir -p "$WT/deploy"
cp dist-standalone/index.html "$WT/deploy/index.html"
cd "$WT"
git add deploy/index.html
git commit -qm "Build from $SRC" || true
git push -q origin HEAD:refs/heads/deploy 2>&1 | grep -v negotiation || true
echo "sha=$(git rev-parse HEAD) sha256=$(sha256sum deploy/index.html | cut -d' ' -f1)"
cd - >/dev/null
git worktree remove --force "$WT"
