# Vibe Coding Template

**A drop-in rule set + project scaffold that makes AI coding agents behave like a disciplined senior engineer — on any agent, any OS, any stack.**

AI agents are fast but reckless: they overcomplicate, touch code they shouldn't, claim "this should work" without proof, drop secrets into logs, and run destructive commands. This template installs the guardrails, workflow, and safety hooks that fix those failure modes — so you get speed *and* discipline.

It's not a framework or a dependency. It's a set of plain files (rules, hooks, CI, scripts) you drop into a project. Nothing to import, nothing to lock into.

> License: MIT. Use it, fork it, ship it. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Demo

![Vibe Coding Template — destructive and secret-leaking commands blocked automatically](demo/vibe-coding-demo.gif)

*Your AI agent's destructive and secret-leaking commands (`rm -rf`, `DROP TABLE`, `cat .env`) are blocked before they run. Reproduce or regenerate this GIF with [`demo/demo.tape`](demo/demo.tape).*

---

## Why this exists

| The problem (every AI agent does this) | What this template adds |
|---|---|
| "This should work" with no proof | A mandatory test-before-commit gate: typecheck + lint + test + build, output pasted |
| Overcomplicates — 1000 lines where 100 would do | Simplicity rules + file-size budgets enforced in CI |
| Edits code it didn't need to touch | Scope-lock rule: state what changes before editing |
| Loses work when the session dies mid-task | Per-edit commits + auto-push + a session-resume protocol |
| Reads/prints secrets, runs `rm -rf`, drops tables | Permission deny-list + a command-validation hook that blocks destructive + secret-leaking commands |
| Different rules for Cursor vs Claude vs Copilot | One source of truth (`AGENTS.md`) → generated config for every agent |

---

## Works with

- **Agents:** Claude Code, Cursor, Windsurf, GitHub Copilot, Google Antigravity, Aider, and any agent that reads `AGENTS.md`.
- **OS:** Windows (PowerShell), macOS, Linux (bash). Hooks and scripts are Node.js — cross-platform.
- **Stacks (presets):** `web` (React/Vite), `fullstack` (Next.js + Prisma), `mobile` (Flutter), `desktop` (Tauri). Easy to add more.

**One honest caveat:** *local* automated enforcement (hooks + permission deny-list) runs only under **Claude Code**. Every other agent reads the same rules as guidance and relies on self-discipline — plus the **CI gate**, which re-checks everything on push regardless of which agent made the edit.

---

## Quick start

There are two ways to use it. Pick one.

### Option A — Tell your AI agent to set it up (works for new *or* existing projects)

This is the whole point: you don't have to wire anything by hand. Clone this repo somewhere, then point your agent at it and paste a prompt like:

```
Read the files in <path-to-this-repo>/template and apply this Vibe Coding
Template to my project. Specifically:
1. Copy the universal files (.claude/, AGENTS.md, the generated agent shims,
   scripts/, .github/workflows/, docs/, PROGRESS.md, file-budgets.json).
2. Pick the preset that matches my stack (web / fullstack / mobile / desktop)
   and copy its CLAUDE.md, commands.json, file-budgets.json, and CI workflow.
3. Fill in the [BRACKETED] placeholders in CLAUDE.md from what you can infer
   about my project. Ask me only what you can't determine.
4. Add the e2e scaffold if this is a web/fullstack project.
5. Do NOT overwrite files I already have without showing me a diff first.
```

Because everything is plain files, **any** agent can do this — not just Claude Code.

### Option B — Run the setup script (deterministic)

From the root of your project folder:

```bash
# macOS / Linux / Git Bash
bash /path/to/vibe-coding-template/template/setup.sh web

# Windows PowerShell
pwsh C:\path\to\vibe-coding-template\template\setup.ps1 web
```

Replace `web` with `fullstack`, `mobile`, or `desktop` (omit it to choose interactively). The script copies the universal files, overlays the preset, sets up `.gitignore` + `.env.example`, and initializes `PROGRESS.md`. Existing files are skipped, never clobbered.

After either option: open `CLAUDE.md`, fill in the `[BRACKETED]` sections, and start coding.

---

## What you get

```
your-project/
├─ AGENTS.md                      # Canonical rules — every agent reads this
├─ CLAUDE.md                      # Claude Code brain (preset-specific) + your project facts
├─ .cursorrules                   # Generated from AGENTS.md (Cursor, legacy)
├─ .cursor/rules/project.mdc      # Generated (Cursor, modern Project Rules)
├─ .windsurfrules                 # Generated (Windsurf)
├─ .github/
│  ├─ copilot-instructions.md     # Generated (GitHub Copilot)
│  └─ workflows/ci.yml            # CI gate: lint, types, test, build, file-size
├─ .claude/
│  ├─ settings.json               # Permission allow/deny-list + hook wiring
│  ├─ hooks/                      # Pre/post tool hooks (destructive-cmd + secret block, file-size, DB guard, auto-push)
│  ├─ rules/                      # Path-scoped deep rules (api, database, testing, refactor, …)
│  ├─ commands/                   # Slash commands (/resume, /checkpoint, /next-phase, /autonomous, …)
│  ├─ agents/                     # Subagents (code-reviewer, debugger, security-auditor, …)
│  └─ skills/                     # caveman-default (token-saving), design-system
├─ e2e/                           # Playwright scaffold (web/fullstack) — auth setup + example spec
├─ scripts/                       # check-file-sizes, sync-agent-rules, graphify-bootstrap, …
├─ docs/                          # Plain-language templates for non-coder maintainers
├─ PROGRESS.md                    # Live phase tracker + session-resume protocol
└─ file-budgets.json              # Per-file-type LOC limits (CI-enforced)
```

### The headline features

- **Single-source rules.** Edit `AGENTS.md`; run `node scripts/sync-agent-rules.mjs`; every agent's config regenerates. No drift.
- **Safety hooks (Claude Code).** Block `rm -rf /`, `DROP TABLE`, `DELETE` without `WHERE`, `git reset --hard HEAD~N`, and reading/printing secret files (`.env`, `.dev.vars`, `*.key`…). Warn on risky migrations.
- **Death-defense workflow.** Per-edit commits with `wip(phase):` prefixes, an auto-push hook, and a session-resume protocol mean a crashed or rate-limited session loses ~nothing. `/resume` picks up exactly where it stopped.
- **Test-before-commit gate.** No "I think it works." Typecheck **and** build (they catch different bugs), tests, file-size check — all green before commit.
- **File-size budgets.** Soft warning + hard CI failure per file type, so god-files get split *before* they metastasize.
- **Methodology baked in.** Spec-driven (Zod contracts) + test-driven for new code, characterization tests before refactoring legacy code.
- **Token-aware autonomy.** `/autonomous` loops through phases and bails gracefully at a safe checkpoint when the context budget gets tight.
- **Knowledge graph.** Optional `graphify` integration maps the codebase so agents navigate by structure instead of burning tokens grepping.
- **Plain-language docs.** Generators for HANDOVER / ARCHITECTURE / FINDINGS docs aimed at non-coder project owners.

Also included: [`VIBE_CODING_PROMPT.md`](VIBE_CODING_PROMPT.md) — a standalone "senior engineer" system prompt you can paste as a `CLAUDE.md` if you want the philosophy without the full scaffold.

---

## Updating the rules

`AGENTS.md` is the **only** file you edit by hand. The per-agent configs are generated:

```bash
# after editing AGENTS.md
node template/scripts/sync-agent-rules.mjs
```

This rewrites `.cursorrules`, `.cursor/rules/project.mdc`, `.windsurfrules`, and `.github/copilot-instructions.md`. Never hand-edit those — your changes get overwritten.

---

## Presets

| Preset | Stack | Unit / Integration | E2E |
|---|---|---|---|
| `web` | React + Vite + TS + Tailwind | Vitest + Testing Library | Playwright |
| `fullstack` | Next.js + Prisma + PostgreSQL | Vitest (real test DB) | Playwright |
| `mobile` | Flutter (Dart) | flutter_test | integration_test |
| `desktop` | Tauri (Rust + React) | Vitest + cargo test | Playwright via tauri-driver |

Each preset ships its own `CLAUDE.md`, `commands.json`, `file-budgets.json`, and CI workflow.

---

## FAQ

**Do I have to use Claude Code?** No. The rules work with any agent. Claude Code just gets the extra *automated* enforcement layer (hooks). Everyone gets the rules + CI.

**Will it touch my existing code?** Setup never overwrites existing files (it skips them). The agent-driven path is instructed to show diffs before changing anything you already have.

**Is this a dependency?** No. It's plain config + scripts. Delete any file you don't want.

**Why both `tsc` and a build step in the gate?** They catch different errors — `tsc` misses things like duplicate declarations that the bundler flags, and vice versa. Running only one ships broken code.

---

## Contributing

Issues and PRs welcome — especially new presets, a tool-agnostic pre-commit gate, and more `.mdc` rule splits for Cursor. See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).
