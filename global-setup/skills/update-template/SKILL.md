---
name: update-template
description: Pull the latest vibe-coding-template rules, hooks, scripts and commands into the current project.
argument-hint: "[optional: path to the vibe-coding-template clone]"
disable-model-invocation: true
---

# Update Template (global entry point)

Installed machine-wide by the vibe-coding-template global setup, so
`/update-template` works in every project, including projects created before
they carried their own copy. It holds no update steps of its own: it forwards to
the template's command, so it can never go stale. A personal skill outranks a
project command of the same name, so in Claude Code this file always wins; the
project copy stays for ZCode and machines without the global setup.

1. **Find the template clone.** The argument, else `$VIBE_TEMPLATE_DIR`, else
   `templateDir` in `~/.claude/vibe-template.json` (written by the global setup),
   else ask the user. Never guess a path. Stop if
   `<dir>/template/.claude/commands/update-template.md` does not exist.
2. **Bring the clone up to date.** `git -C <dir> fetch`. If it is behind its
   remote and has no local changes, `git -C <dir> pull --ff-only`. If it has local
   changes, say so and use it as it is.
3. **Follow the template's command.** Read
   `<dir>/template/.claude/commands/update-template.md` and follow it exactly,
   with `<dir>` as the template location.
