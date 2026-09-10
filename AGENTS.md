# Vibe Coding Template — Repo Instructions

> Canonical instructions for this repository, for every agent. Claude Code reaches
> them via `CLAUDE.md`, which points here; ZCode reads this file directly.

This repo is a two-part agent setup kit — a machine-wide half and a per-project half:

| Folder | What it is |
|---|---|
| `global-setup/` | Machine-wide config: `~/.claude/` at the top level, `~/.zcode/` under `zcode/` |
| `template/` | Per-project template — rules, hooks, subagents, commands, for both agents |

## For AI agents: what "implement this template" means

When the user says "implement", "set up", "install", or "configure this template":

1. Run the global setup from the repo root:
   - Windows: `.\setup.ps1` — both agents. `-Agent claude` or `-Agent zcode` for one.
   - macOS / Linux, ZCode half: `node global-setup/zcode/install-zcode.mjs`
2. Verify the output shows `[OK]` for each file.
3. Tell the user to restart their agent.

That's it. The script handles the global brain, the auto-push hook, settings, and the
ZCode hook registration.

## What the global setup installs

### Claude Code (`setup.ps1`, or `-Agent claude`)

| Source | Destination | What it does |
|---|---|---|
| `global-setup/CLAUDE.md` | `~/.claude/CLAUDE.md` | Global coding rules, model + effort selection, token budget — loads every session |
| `global-setup/hooks/post-commit-push.mjs` | `~/.claude/hooks/post-commit-push.mjs` | Auto-pushes to GitHub after every `git commit` |
| (generated) | `~/.claude/settings.json` | Auto-approve mode + the auto-push hook |

If `settings.json` already exists the script skips it, so re-running is safe.

### ZCode (`setup.ps1 -Agent zcode`, or the Node installer)

| Source | Destination | What it does |
|---|---|---|
| `global-setup/CLAUDE.md` + `global-setup/zcode/AGENTS.addendum.md` | `~/.zcode/AGENTS.md` | The same global brain, composed at install time with a ZCode addendum — one source, no drift |
| `global-setup/zcode/hooks/zcode-hook.mjs` | `~/.zcode/hooks/zcode-hook.mjs` | Adapter that runs a project's `.claude/hooks/*` under ZCode |
| (merged) | `~/.zcode/cli/config.json` | Hook registrations pointing at that adapter |

The hook registration is machine-wide because ZCode **ignores any `hooks` block in a
workspace config**, on purpose, for security. The adapter finds the project from the
hook payload and skips scripts a project doesn't have, so one registration serves
every repo. Existing keys in `config.json` are preserved and the file is backed up.

## Per-project setup

Each project's `.claude/` and `.zcode/` directories are committed to that project's
Git repo, so they arrive with `git clone` — no manual copying.

Applying the template to a NEW project: run `template/setup.sh <preset>` (or
`template/setup.ps1`) from the project root, then fill in the bracketed sections in
`CLAUDE.md`. The script also runs `scripts/sync-zcode.mjs`, which generates the
`.zcode/` layout from whatever `.claude/` the project ended up with.

## Editing rules in this repo

`template/AGENTS.md` is the single source of truth for project rules. After editing it:

```bash
node template/scripts/sync-agent-rules.mjs
```

That regenerates the Cursor / Windsurf / Copilot shims **and** the ZCode layout
(`template/.zcode/commands|agents|skills`, `hooks/hooks.json`). Never hand-edit a
generated file — the next sync overwrites it.

Editing `.claude/commands/`, `.claude/agents/`, `.claude/skills/`, or the `hooks`
block of `.claude/settings.json` also needs a sync, for the same reason.
