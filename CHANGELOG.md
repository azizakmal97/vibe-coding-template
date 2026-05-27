# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and this project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Mandatory browser verification for UI work.** New non-negotiable rule
  (`AGENTS.md` #5, mirrored to all agent shims): any frontend change or component
  refactor MUST be verified with a Playwright **e2e smoke** (renders + zero uncaught
  page errors) — typecheck + build prove it compiles, not that it renders — plus a
  **flow test** where the page carries real logic. Agents run the e2e themselves;
  deferring UI verification to the human is now a forbidden anti-pattern
  (`rules/refactor.md`).
- `rules/testing.md` gains an "E2E Smoke + Flow" section (pattern + gotchas:
  fixture ids must satisfy API guards; use `toHaveValue` not `getByDisplayValue`),
  and the e2e scaffold's `example.spec.ts` now demonstrates the `pageerror` guard.

## [1.0.0] - 2026-05-25

First public release.

### Added
- **Cross-agent rule system.** `AGENTS.md` is the single source of truth;
  `scripts/sync-agent-rules.mjs` generates the per-tool shims for Cursor
  (`.cursorrules`, `.cursor/rules/project.mdc`), Windsurf (`.windsurfrules`),
  and GitHub Copilot (`.github/copilot-instructions.md`).
- **Claude Code enforcement.** Permission allow/deny-list plus hooks that block
  destructive commands (`rm -rf`, `DROP TABLE`, `DELETE` without `WHERE`) and
  reading/printing secret files, warn on risky migrations, enforce file-size
  budgets, and auto-push every commit.
- **Death-defense workflow.** Per-edit commits, auto-push, and a session-resume
  protocol so a crashed/rate-limited session loses ~nothing. Slash commands:
  `/resume`, `/checkpoint`, `/next-phase`, `/autonomous`, `/check-ci`, and more.
- **Presets.** `web`, `fullstack`, `mobile`, `desktop` — each ships its own
  `CLAUDE.md`, `commands.json`, `file-budgets.json`, and CI workflow.
- **Playwright E2E scaffold** (web/fullstack) with a programmatic-auth
  `storageState` pattern and an auto-skipping CI job.
- **Test-before-commit gate** (typecheck + build + test + file-size), enforced
  in CI on every push regardless of which agent made the edit.
- **Knowledge-graph integration** (graphify) and token-budget rules for
  efficient, long-running sessions.
- **Plain-language docs templates** for non-coder project maintainers.
- **Cross-OS setup** via `setup.sh` and `setup.ps1`.
- **Reproducible demo GIF** rendered in CI with VHS.

### Notes
- Local automated enforcement (hooks + permission deny-list) is **Claude Code
  only**. Every other agent receives the rules as guidance and relies on the CI
  gate, which re-checks everything on push.

[1.0.0]: https://github.com/azizakmal97/vibe-coding-template/releases/tag/v1.0.0
