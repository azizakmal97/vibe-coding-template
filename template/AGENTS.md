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
5. **Verify UI in a real browser** — ANY frontend change or component refactor MUST be checked with a Playwright **e2e smoke** (load the page, assert key regions render, assert ZERO uncaught page errors). typecheck + build prove it compiles, NOT that it renders. Add a **flow test** where the page has real logic (validation, auth/role gates, dup-guard banners, confirm dialogs). The Playwright scaffold (`e2e/`, `playwright.config.ts`) ships ready to run — **run it yourself; never defer UI verification to the human.** See `.claude/rules/testing.md` → "E2E Smoke + Flow".
6. **Per-edit commit** — see `PROGRESS.md` death-defense protocol. `wip(phase-id):` prefix.
7. **No secrets in code or transcript** — keep secrets in `.env` / `.dev.vars` (gitignored). Never read or print a secret file (`cat`/`type`/`Get-Content` a `.env`); the runtime loads them itself. Claude Code enforces this via hook + Read deny-list; other agents must self-enforce.
8. **Backwards-compatible APIs** — add fields, never remove.
9. **No silent catches** — every `catch` must log or rethrow.
10. **Ask before installing packages** — state name + version + why + bundle impact.
11. **Read `PROGRESS.md` on session start** — if a phase is `🟡 in-progress`, resume per protocol.

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

**Auto-generation:** In Claude Code, `scripts/graphify-bootstrap.mjs` runs on every SessionStart (wired in `.claude/settings.json`). Self-skips when source files < 50 OR graph < 7 days old. So the graph appears without the user asking once the codebase grows past the threshold. Other agents (Cursor / Aider / Windsurf / Copilot) don't get the auto-trigger and must run the script manually: `node scripts/graphify-bootstrap.mjs` after a fresh clone or major structural change.

---

## Communication Style

Caveman-lite default for status updates. Full English for: error explanations, architectural rationale, user-facing strings.

---

## Session-Resume Pointer

See `PROGRESS.md`. If a phase is `🟡 in-progress`, follow the 9-step resume protocol BEFORE doing anything else.

---

## Model & Tool Selection per Task

Every plan, phase, task block, or roadmap entry MUST carry an explicit per-task model assignment. The model decision drives which IDE/tool you open: Claude Code uses Anthropic models inside this repo's `.claude/` safety net; DeepSeek + Gemini run outside it (Cursor / Aider / Continue / Roo Code / direct API) and lose the death-defense hooks.

**Review the model list at project adoption** — concrete 2026 names below WILL go stale. Bump versions and rebalance assignments at the start of every new project scaffolded from this template.

### Vendor tradeoff

- **Claude (Opus / Sonnet / Haiku)** — runs inside `.claude/` hooks: SessionStart resume, pre-commit checkpoint, post-edit file-size, post-commit auto-push, secret-read deny-list. Use for anything that touches code AND benefits from death-defense.
- **DeepSeek (Pro / Flash)** — cheaper per token, strong at code, weak at architectural ambiguity. Run via Cursor / Aider. No `.claude/` hooks. Worth it only for bulk mechanical work where savings dominate.
- **Gemini (Pro / Flash)** — native multimodal (PNG / PDF / screenshot), large context window (1M+), strong at translation + cultural nuance. Run via API / AI Studio / IDE plugins. No `.claude/` hooks. Worth it for visual QA, long-context whole-repo questions, and i18n translation passes.

### Decision matrix (starting defaults — customize at project start)

| Task type | Model | Tool | Reason |
|---|---|---|---|
| Implementation of a defined feature | **Sonnet** (current: 4.6) | Claude Code | Spec exists; hooks fire |
| Tests (TDD red→green, one feature) | **Sonnet** | Claude Code | Pattern; hooks fire |
| Scaffolding (component, route, schema stub) | **Sonnet** | Claude Code | Repeatable |
| Bug fix with known root cause | **Sonnet** | Claude Code | Surgical |
| Docs polish, README updates | **Sonnet** | Claude Code | Low-stakes prose |
| Architecture / structural decision | **Opus** (current: 4.7) | Claude Code | Trade-offs matter |
| Complex debugging (root cause unclear) | **Opus** | Claude Code | Reasoning across layers |
| Security review / `/code-review high+` | **Opus** | Claude Code | Subtle issues |
| Cross-cutting refactor (5+ files) | **Opus** | Claude Code | Many edges held in mind |
| Copywriting (hero, product pitch, tone) | **Opus** | Claude Code | Voice + brand judgment |
| Legal / compliance content (Privacy / Terms / ToS) | **Opus** | Claude Code | Compliance precision |
| Performance investigation (bundle, runtime) | **Opus** | Claude Code | Diagnostic depth |
| Bulk codegen (same pattern across 5+ files) | **DeepSeek Pro** (current: V4 Pro) | Cursor / Aider | Pattern repetition cheap |
| Mass test scaffolding (E2E suite, fixtures) | **DeepSeek Pro** | Cursor / Aider | Repetitive; price wins |
| i18n translation pass (cultural nuance) | **Gemini Pro** (current: 3 Pro) | API / Studio | Translation quality + long context |
| Visual QA from screenshots (design diff, mobile check) | **Gemini Pro** | API / Studio | Native multimodal |
| Long-context whole-repo question (after `/graphify`) | **Gemini Pro** | API / Studio | 1M context covers GRAPH_REPORT + code |
| Spell-check / copy proofread | **Gemini Flash** (current: 3 Flash) | API / Studio | Cheap + good at prose |
| Bulk screenshot smoke (i18n toggle, cross-browser viewport) | **Gemini Flash** | API / Studio | Multimodal + cheap |
| Mechanical sync (`AGENTS.md` → shim files) | **Haiku** (current: 4.5) | Claude Code | One script run |
| Status checks (`git log`, ci status, "is X live") | **Haiku** | Claude Code | Cheap = right |
| Single-line edit per explicit instruction | **Haiku** | Claude Code | No judgment |
| Format / lint auto-fix passes | **DeepSeek Flash** (current: V4 Flash) | Cursor / Aider | Mechanical; price wins |

### Workflow rules

1. **Default to Sonnet in Claude Code.** It's the project pin (`.claude/settings.json`). Most work goes here.
2. **Escalate to Opus only for the rows above.** Open a fresh session, `/model opus`, then `/resume`.
3. **Drop to non-Claude tools only when bulk-mechanical OR multimodal OR translation.** Before doing so: commit current Claude Code work, push, then switch tools. Never run two agents on the same files concurrently.
4. **After non-Claude work, return to Claude Code for verification.** Run typecheck + lint + tests + build here so `.claude/` hooks + file-budget checks fire on the merged result.

### Per-phase assignment lives in `PROGRESS.md`

Every phase block in `PROGRESS.md` carries a `Model:` line plus per-bullet model annotation. Match the assignment before opening the session.

### Anti-patterns

- Opus for `npm run build` / `git status` / log inspection — burn for no upside.
- Sonnet for novel copywriting, brand voice, or architectural calls — output reads thin; you'll redo it.
- DeepSeek / Gemini for anything touching the death-defense path without a Claude verification pass — hooks didn't fire; state may be unsafe.
- Switching Claude models mid-session "just to try" — costs the cache, gains nothing.
- Inheriting this matrix unchanged into a new project without checking what the latest model lineup is.

---

## Tool-Specific Notes

Local enforcement (hooks + permission deny-list) is **Claude Code only**. Every other agent gets these rules as *guidance* and relies on self-discipline. The one gate that runs regardless of which agent made the edit is **CI** (`.github/workflows/`) — it re-checks lint, types, tests, build, and file-size budgets on every push.

- **Claude Code**: reads `CLAUDE.md` + `.claude/rules/*`. Hooks in `.claude/hooks/` enforce rules automatically; SessionStart injects the resume reminder.
- **Cursor**: reads `.cursor/rules/project.mdc` (modern) and `.cursorrules` (legacy) — both generated from this file.
- **Windsurf**: reads `.windsurfrules` (generated from this file) and/or this `AGENTS.md`.
- **GitHub Copilot**: reads `.github/copilot-instructions.md` (generated from this file).
- **Google Antigravity / Aider / others**: read this `AGENTS.md` directly at session start. No automated enforcement.

> The shim files above are GENERATED — never hand-edit them. Edit `AGENTS.md`, then run `node scripts/sync-agent-rules.mjs`.
