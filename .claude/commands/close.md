---
description: Close the session properly — save, record, clean up and report before the owner opens a new session.
---

# /close (this repo)

Read `template/.claude/commands/close.md` in this repo and follow it exactly. That
file is the single source; this one only makes `/close` available when you work on
the template itself on a machine without the global setup.

In this repo, step 2 also covers: a change under `template/` or `global-setup/`
gets a `CHANGELOG.md` entry, and the machine's template clone named in
`~/.claude/vibe-template.json` is pulled after the push so `/update-template`
sees it.
