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

1. **Find the clone, or download it.** The argument, else `$VIBE_TEMPLATE_DIR`,
   else `templateDir` in `~/.claude/vibe-template.json`, else
   `~/vibe-coding-template` if it is a clone of
   https://github.com/azizakmal97/vibe-coding-template. If none exists, clone that
   repo (public, no login) into `~/vibe-coding-template` and write
   `{ "templateDir": "<that path>" }` to `~/.claude/vibe-template.json`. Never guess
   any other path.
2. **Follow the template's command.** Read
   `<dir>/template/.claude/commands/update-template.md` and follow it exactly,
   with `<dir>` as the template location. Its "Find the template first" section
   refreshes the clone before anything is copied.
