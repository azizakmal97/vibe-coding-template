---
description: Update all related files and do proper closing before i close and delete this session and start on new session, so the new session get the context to continue.
---

# /close (this repo)

Read `template/.claude/commands/close.md` in this repo and follow it exactly. That
file is the single source; this one only makes `/close` available when you work on
the template itself on a machine without the global setup.

In this repo, step 2 also covers: a change under `template/` or `global-setup/`
gets a `CHANGELOG.md` entry, and the machine's template clone named in
`~/.claude/vibe-template.json` is pulled after the push so `/update-template`
sees it.
