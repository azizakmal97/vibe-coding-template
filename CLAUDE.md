# Vibe Coding Template — Claude Code Layer

**Read [`AGENTS.md`](AGENTS.md) first.** It is the canonical instruction file for this
repo — what the folders are, what "implement this template" means, what the global
setup installs, and when to re-run the rule sync. Nothing here overrides it.

This file exists only because Claude Code loads `CLAUDE.md` automatically and ZCode
loads `AGENTS.md` automatically. Keeping the content in one file and pointing at it
from the other is the same single-source discipline the template asks projects to
follow.

## Claude-Code-specific notes

- `.claude/settings.local.json` in this repo is local-only and gitignored — put
  machine-specific permissions there, never in a committed settings file.
- This repo's own hooks live in `.claude/hooks/`. They are the repo's working copies;
  the ones that ship to projects are in `template/.claude/hooks/`, and the ones that
  install machine-wide are in `global-setup/hooks/`. A fix to one usually belongs in
  all three — check before you call it done.
