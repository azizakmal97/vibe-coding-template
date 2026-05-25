<!-- GENERATED FROM AGENTS.md by scripts/sync-agent-rules.mjs — DO NOT EDIT. Edit AGENTS.md and re-run. -->

# AGENTS.md — Single Source of Truth for All AI Coding Tools

> **This is the canonical rule source.** Claude Code, Cursor, Windsurf, GitHub Copilot, Aider, Google Antigravity, and other agents read it — directly or via the shim files generated from it.
> Edit THIS file, then run `node scripts/sync-agent-rules.mjs` to regenerate `.cursorrules`, `.cursor/rules/project.mdc`, `.windsurfrules`, and `.github/copilot-instructions.md`. `CLAUDE.md` layers Claude-specific sections on top of these rules.

---

## Stack

See `CLAUDE.md` §1–§2 for the active preset's stack + commands.

## Non-Negotiable Rules

1. **PROOF OVER PROMISE** — never say "this should work." Paste terminal output of typecheck + build + test.
2. **Scope lock** — state which files will change BEFORE editing. Do not touch anything else.
3. **Types first** — define interfaces before implementation. Zero `any`.
4. **Test before commit** — typecheck + lint + test + build all green. No exceptions.
5. **Per-edit commit** — see `PROGRESS.md` death-defense protocol. `wip(phase-id):` prefix.
6. **No secrets in code or transcript** — keep secrets in `.env` / `.dev.vars` (gitignored). Never read or print a secret file (`cat`/`type`/`Get-Content` a `.env`); the runtime loads them itself. Claude Code enforces this via hook + Read deny-list; other agents must self-enforce.
7. **Backwards-compatible APIs** — add fields, never remove.
8. **No silent catches** — every `catch` must log or rethrow.
9. **Ask before installing packages** — state name + version + why + bundle impact.
10. **Read `PROGRESS.md` on session start** — if a phase is `🟡 in-progress`, resume per protocol.

---

## File-Size Budgets

See `file-budgets.json` at project root. Hard breach = CI fails. Touch a file already over budget = MUST extract first, edit after.

---

## Forbidden Patterns

Project-specific list lives in `CLAUDE.md` §11. Universal forbidden:
- `any` TypeScript types
- `// @ts-ignore` without linked issue
- `.catch(() => {})` silent failures
- Inline auth checks (use middleware)
- Raw DB queries in route handlers (use service layer)
- Hardcoded secrets / API keys
- Reading/printing secret files (`.env`, `.dev.vars`, `*.pem/*.key/*.p12`, `secrets/`) via shell
- `eval()` / `dangerouslySetInnerHTML` without sanitization

---

## Graph-First Exploration

If `graphify-out/GRAPH_REPORT.md` exists, read it FIRST before any full-repo grep.
After structural changes (file add/rename/move/delete), run `/graphify` to update.

---

## Communication Style

Caveman-lite default for status updates. Full English for: error explanations, architectural rationale, user-facing strings.

---

## Session-Resume Pointer

See `PROGRESS.md`. If a phase is `🟡 in-progress`, follow the 9-step resume protocol BEFORE doing anything else.

---

## Tool-Specific Notes

Local enforcement (hooks + permission deny-list) is **Claude Code only**. Every other agent gets these rules as *guidance* and relies on self-discipline. The one gate that runs regardless of which agent made the edit is **CI** (`.github/workflows/`) — it re-checks lint, types, tests, build, and file-size budgets on every push.

- **Claude Code**: reads `CLAUDE.md` + `.claude/rules/*`. Hooks in `.claude/hooks/` enforce rules automatically; SessionStart injects the resume reminder.
- **Cursor**: reads `.cursor/rules/project.mdc` (modern) and `.cursorrules` (legacy) — both generated from this file.
- **Windsurf**: reads `.windsurfrules` (generated from this file) and/or this `AGENTS.md`.
- **GitHub Copilot**: reads `.github/copilot-instructions.md` (generated from this file).
- **Google Antigravity / Aider / others**: read this `AGENTS.md` directly at session start. No automated enforcement.

> The shim files above are GENERATED — never hand-edit them. Edit `AGENTS.md`, then run `node scripts/sync-agent-rules.mjs`.
