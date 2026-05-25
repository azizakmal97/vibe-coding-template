#!/usr/bin/env bash
# VibeCoding Template Setup Script — Mac / Linux / Git Bash on Windows
# Usage: bash /path/to/template/setup.sh [preset] (run from your NEW project folder)
#   preset: web | mobile | desktop | fullstack (asks interactively if omitted)

set -euo pipefail

PRESET="${1:-}"

# Check Node.js — hooks + scripts require it.
if ! command -v node &>/dev/null; then
  echo ""
  echo "ERROR: Node.js not found."
  echo "  All safety hooks (.claude/hooks/*.js) and setup scripts require Node.js."
  echo "  Without it: database protection, secret scanning, file-size budgets, command blocking are DISABLED."
  echo "  Install: https://nodejs.org or via nvm"
  echo ""
  read -p "Continue anyway? (y/N): " confirm
  [[ "$confirm" == "y" ]] || exit 1
else
  echo "Node.js: $(node --version)"
fi

TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(pwd)"

echo ""
echo "VibeCoding Template Setup"
echo "========================="
echo "Project:  $PROJECT_DIR"
echo "Template: $TEMPLATE_DIR"
echo ""

# Guard: don't run inside the template folder
if [ "$PROJECT_DIR" = "$TEMPLATE_DIR" ]; then
  echo "ERROR: Run this from your project folder, not the template folder."
  echo "       cd /path/to/your-project && bash $TEMPLATE_DIR/setup.sh"
  exit 1
fi

# Create directory structure (includes new dirs: scripts, presets, .github/workflows, docs, skills/caveman-default)
echo "Creating directories..."
mkdir -p \
  .claude/agents \
  .claude/commands \
  .claude/hooks \
  .claude/rules \
  .claude/skills/design-system \
  .claude/skills/caveman-default \
  .cursor/rules \
  .github/workflows \
  scripts \
  docs
echo "  + .claude/{agents,commands,hooks,rules,skills/*}"
echo "  + .github/workflows, scripts, docs"

# Files to copy (universal, non-preset)
declare -A FILES=(
  # root docs
  ["AGENTS.md"]="AGENTS.md"
  [".cursorrules"]=".cursorrules"
  [".cursor/rules/project.mdc"]=".cursor/rules/project.mdc"
  [".windsurfrules"]=".windsurfrules"
  [".github/copilot-instructions.md"]=".github/copilot-instructions.md"
  ["PROGRESS.md"]="PROGRESS.md"
  # .claude root
  [".claude/settings.json"]=".claude/settings.json"
  # agents (existing 5 + new 2)
  [".claude/agents/code-reviewer.md"]=".claude/agents/code-reviewer.md"
  [".claude/agents/debugger.md"]=".claude/agents/debugger.md"
  [".claude/agents/test-writer.md"]=".claude/agents/test-writer.md"
  [".claude/agents/security-auditor.md"]=".claude/agents/security-auditor.md"
  [".claude/agents/refactorer.md"]=".claude/agents/refactorer.md"
  [".claude/agents/migration-writer.md"]=".claude/agents/migration-writer.md"
  [".claude/agents/graph-navigator.md"]=".claude/agents/graph-navigator.md"
  # commands (existing 3 + new 3 + aux 3)
  [".claude/commands/new-feature.md"]=".claude/commands/new-feature.md"
  [".claude/commands/fix-bug.md"]=".claude/commands/fix-bug.md"
  [".claude/commands/pr-review.md"]=".claude/commands/pr-review.md"
  [".claude/commands/resume.md"]=".claude/commands/resume.md"
  [".claude/commands/checkpoint.md"]=".claude/commands/checkpoint.md"
  [".claude/commands/graphify.md"]=".claude/commands/graphify.md"
  [".claude/commands/next-phase.md"]=".claude/commands/next-phase.md"
  [".claude/commands/autonomous.md"]=".claude/commands/autonomous.md"
  [".claude/commands/check-ci.md"]=".claude/commands/check-ci.md"
  [".claude/commands/audit.md"]=".claude/commands/audit.md"
  [".claude/commands/handover.md"]=".claude/commands/handover.md"
  [".claude/commands/pre-publish.md"]=".claude/commands/pre-publish.md"
  [".claude/commands/forecast-storage.md"]=".claude/commands/forecast-storage.md"
  [".claude/commands/migrate.md"]=".claude/commands/migrate.md"
  [".claude/commands/deploy.md"]=".claude/commands/deploy.md"
  # hooks (existing 3 + new 3)
  [".claude/hooks/validate-command.js"]=".claude/hooks/validate-command.js"
  [".claude/hooks/post-edit-check.js"]=".claude/hooks/post-edit-check.js"
  [".claude/hooks/pre-db-migrate.js"]=".claude/hooks/pre-db-migrate.js"
  [".claude/hooks/session-start-resume.js"]=".claude/hooks/session-start-resume.js"
  [".claude/hooks/pre-commit-checkpoint.js"]=".claude/hooks/pre-commit-checkpoint.js"
  [".claude/hooks/check-file-size.js"]=".claude/hooks/check-file-size.js"
  [".claude/hooks/post-commit-push.js"]=".claude/hooks/post-commit-push.js"
  # rules (existing 4 + new 3)
  [".claude/rules/frontend.md"]=".claude/rules/frontend.md"
  [".claude/rules/backend.md"]=".claude/rules/backend.md"
  [".claude/rules/database.md"]=".claude/rules/database.md"
  [".claude/rules/api.md"]=".claude/rules/api.md"
  [".claude/rules/services.md"]=".claude/rules/services.md"
  [".claude/rules/refactor.md"]=".claude/rules/refactor.md"
  [".claude/rules/testing.md"]=".claude/rules/testing.md"
  [".claude/rules/methodology.md"]=".claude/rules/methodology.md"
  [".claude/rules/legacy-files.md"]=".claude/rules/legacy-files.md"
  [".claude/rules/naming.md"]=".claude/rules/naming.md"
  [".claude/rules/token-budget.md"]=".claude/rules/token-budget.md"
  # skills
  [".claude/skills/design-system/SKILL.md"]=".claude/skills/design-system/SKILL.md"
  [".claude/skills/caveman-default/SKILL.md"]=".claude/skills/caveman-default/SKILL.md"
  # scripts
  ["scripts/check-file-sizes.mjs"]="scripts/check-file-sizes.mjs"
  ["scripts/graphify-bootstrap.mjs"]="scripts/graphify-bootstrap.mjs"
  ["scripts/init-progress.mjs"]="scripts/init-progress.mjs"
  ["scripts/pick-preset.mjs"]="scripts/pick-preset.mjs"
  ["scripts/sync-agent-rules.mjs"]="scripts/sync-agent-rules.mjs"
  ["scripts/auto-checkpoint.sh"]="scripts/auto-checkpoint.sh"
  ["scripts/auto-checkpoint.ps1"]="scripts/auto-checkpoint.ps1"
  # audit + handover + docs templates
  ["AUDIT_AND_ROADMAP.template.md"]="AUDIT_AND_ROADMAP.template.md"
  ["docs/HANDOVER.template.md"]="docs/HANDOVER.template.md"
  ["docs/ARCHITECTURE_PLAIN.template.md"]="docs/ARCHITECTURE_PLAIN.template.md"
  ["docs/FINDINGS_AND_PLAN_PLAIN.template.md"]="docs/FINDINGS_AND_PLAN_PLAIN.template.md"
  ["docs/LEARN_FULLSTACK.template.md"]="docs/LEARN_FULLSTACK.template.md"
)

echo ""
echo "Copying universal template files..."
copied=0
for src in "${!FILES[@]}"; do
  dst="${FILES[$src]}"
  src_path="$TEMPLATE_DIR/$src"
  dst_path="$PROJECT_DIR/$dst"

  if [ -f "$src_path" ]; then
    if [ -f "$dst_path" ]; then
      echo "  ~ $dst (exists, skipping)"
    else
      cp "$src_path" "$dst_path"
      echo "  + $dst"
      ((copied++)) || true
    fi
  else
    echo "  ! Source not found: $src" >&2
  fi
done

# Run preset picker (interactive or via $1)
echo ""
echo "Picking project preset..."
node "$TEMPLATE_DIR/scripts/pick-preset.mjs" "$PRESET" || {
  echo "ERROR: preset picker failed" >&2
  exit 1
}

# Initialize PROGRESS.md with first phase
echo ""
echo "Initialising PROGRESS.md..."
node "$TEMPLATE_DIR/scripts/init-progress.mjs" || true

# Try graphify bootstrap (idempotent, never blocks)
echo ""
echo "Checking codebase for graphify..."
node "$TEMPLATE_DIR/scripts/graphify-bootstrap.mjs" || true

# .gitignore
echo ""
echo "Configuring .gitignore..."
if [ ! -f ".gitignore" ]; then
  cat > .gitignore << 'EOF'
# Secrets — never commit these
.env
.env.*
!.env.example

# Claude Code local settings
.claude/settings.local.json
.claude/db-backups/

# E2E (Playwright) artifacts
e2e/.auth/
playwright-report/
test-results/

# Build outputs
dist/
build/
.next/
.vite/

# OS
.DS_Store
Thumbs.db
EOF
  echo "  + .gitignore created"
elif ! grep -q "\.env" .gitignore 2>/dev/null; then
  cat >> .gitignore << 'EOF'

# Secrets — never commit these
.env
.env.*
!.env.example

# Claude Code local settings
.claude/settings.local.json
.claude/db-backups/

# E2E (Playwright) artifacts
e2e/.auth/
playwright-report/
test-results/
EOF
  echo "  + .gitignore updated"
else
  echo "  ~ .gitignore already has .env entries"
fi

# .env.example
if [ ! -f ".env.example" ]; then
  cat > .env.example << 'EOF'
# Copy this file to .env.local and fill in your values
# Never commit .env.local

DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Add your keys below
EOF
  echo "  + .env.example created"
fi

# Summary
echo ""
echo "═══════════════════════════════"
echo "Setup complete! Copied $copied universal files + preset assets."
echo ""
echo "Next steps:"
echo "  1. Edit CLAUDE.md — fill in [BRACKETED] sections"
echo "  2. Edit .claude/skills/design-system/SKILL.md — your colors/fonts"
echo "  3. Read PROGRESS.md — understand the session-resume protocol"
echo "  4. Read AGENTS.md — single source of truth for all AI tools"
echo "  5. git init && git add -A && git commit -m 'chore: initialize project'"
echo ""
echo "Start coding:"
echo "  /new-feature [name] — [description]"
echo "  /fix-bug [error or description]"
echo "  /pr-review [branch or PR number]"
echo "  /resume          — restore session state from PROGRESS.md"
echo "  /checkpoint      — verify + commit current work"
echo "  /next-phase      — start next pending phase"
echo "  /autonomous      — loop work unattended (token-aware bail-out)"
echo "  /check-ci        — ingest CI failures as PROGRESS entries"
echo "  /graphify        — update codebase knowledge graph"
echo "  /audit           — generate AUDIT_AND_ROADMAP.md"
echo "  /handover        — refresh plain-English docs/"
echo ""
