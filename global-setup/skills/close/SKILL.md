---
name: close
description: Close the session properly — commit and push every repo touched, update PROGRESS/CHANGELOG/docs and memory, stop background jobs, and report what is safe and what is still owed.
disable-model-invocation: true
---

# Close (global entry point)

Installed machine-wide by the vibe-coding-template global setup, so `/close`
works in every project, including ones that do not carry the template. It holds
no steps of its own: it forwards to the template's command, so it never goes
stale. A personal skill outranks a project command of the same name, so in
Claude Code this file always wins; the project copy stays for ZCode.

1. **Find the clone.** `$VIBE_TEMPLATE_DIR`, else `templateDir` in
   `~/.claude/vibe-template.json`, else `~/vibe-coding-template` if it is a clone
   of https://github.com/azizakmal97/vibe-coding-template. Never guess any other
   path. If none exists, clone that repo (public, no login) into
   `~/vibe-coding-template` and write `{ "templateDir": "<that path>" }` to
   `~/.claude/vibe-template.json`, as `/update-template` does.
2. **Follow the template's command.** Read
   `<dir>/template/.claude/commands/close.md` and follow it exactly.
