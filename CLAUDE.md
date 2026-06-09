# Vibe Coding Template — Repo Instructions

This repo is a two-part Claude Code setup kit:

| Folder | What it is |
|---|---|
| `global-setup/` | Global Claude Code config for a new machine |
| `template/` | Per-project template (rules, hooks, agents, commands) |

## For AI Agents: What "implement this template" means

When the user says "implement", "set up", "install", or "configure this template":

1. Run `.\setup.ps1` (PowerShell, from the repo root)
2. Verify output shows `[OK]` for each file
3. Tell the user to restart Claude Code

That's it. The script handles everything — CLAUDE.md, auto-push hook, settings.json.

## What setup.ps1 installs

| Source | Destination | What it does |
|---|---|---|
| `global-setup/CLAUDE.md` | `~/.claude/CLAUDE.md` | Global coding rules, model selection, token budget — loads every session |
| `global-setup/hooks/post-commit-push.mjs` | `~/.claude/hooks/post-commit-push.mjs` | Auto-pushes to GitHub after every `git commit` |
| (generated) | `~/.claude/settings.json` | Enables auto-approve mode + wires the auto-push hook |

If `settings.json` already exists, the script skips it (safe to re-run — preserves existing config).

## Per-project setup

Each project's `.claude/` directory (hooks, rules, agents, commands) is already
committed to the project's Git repo. It comes down automatically with `git clone` —
no manual copying needed.

Apply the per-project template to a NEW project: copy `template/` contents into the project root,
then fill in the bracketed sections in `CLAUDE.md`.
