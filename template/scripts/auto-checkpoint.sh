#!/usr/bin/env bash
# Auto-checkpoint script — OPTIONAL belt+suspenders mode.
# Off by default. Enable only during active refactor windows where you want
# guaranteed disk persistence every N minutes.
#
# Trade-off: commits broken intermediate states. Easy to `git reset` later.
#
# Cron usage (every 5 min):
#   */5 * * * * cd /path/to/repo && bash scripts/auto-checkpoint.sh >> .auto-checkpoint.log 2>&1
#
# One-shot usage:
#   bash scripts/auto-checkpoint.sh

set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
  exit 0   # nothing to commit
fi

# Only commit during active refactor (when PROGRESS.md has 🟡 in-progress)
if [ -f PROGRESS.md ] && ! grep -q "🟡" PROGRESS.md; then
  exit 0
fi

TIMESTAMP="$(date -Iseconds)"

git add -A
git commit --no-verify -m "auto-checkpoint: $TIMESTAMP" || true

echo "[auto-checkpoint] $TIMESTAMP"
