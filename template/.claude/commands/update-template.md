---
name: update-template
argument-hint: "[optional: path to the vibe-coding-template clone — defaults to $VIBE_TEMPLATE_DIR]"
---

# Update Template

Pull the latest rules, hooks, scripts and CI from the vibe-coding-template repo
into THIS project. Projects drift as the template evolves; this closes the gap
without touching project-owned files.

Template location, in order: the argument → `$VIBE_TEMPLATE_DIR` → ask the
user. Do not guess a path.

## What updates (template is the source of truth)

- `.claude/hooks/` — the safety net
- `.claude/rules/` — the rule files
- `.claude/agents/`, `.claude/skills/`
- `.claude/commands/` — ADD template commands that are missing; NEVER delete a
  command this project added itself
- `scripts/`, `docs/` templates
- `.github/workflows/<this project's preset>` and security workflow
- Generated shims: `.cursorrules`, `.cursor/rules/`, `.windsurfrules`,
  `.github/copilot-instructions.md`
- `AGENTS.md` — only when the user accepts the new version (see Phase 3)

## What NEVER updates (project-owned)

`CLAUDE.md`, `PROGRESS.md`, `memory/`, `settings.json` (except the hook merge
in Phase 3), `identity.json`, `package-manager.json`, `file-budgets.json`,
`.audit-accepted.json`, `preset commands.json`, `anti-slop/` (rules.json, gate
reports, audits), anything under `src/`, `.env*`.

## Phase 1: Report what changed

Read `CHANGELOG.md` in the template repo, from this project's last update (or
its first commit) to HEAD. Summarize for the user in 3–5 bullets what the
template gained since then. If nothing relevant changed, say so and stop.

## Phase 2: Diff, then classify

For every managed file, compare template vs this project
(`git diff --no-index <template-file> <project-file>` works well) and
classify: **identical** · **missing here** · **template newer** ·
**modified locally**.

## Phase 3: Apply

1. **Missing / template newer** → copy the template version in.
2. **Modified locally** → show the user the diff and ask. The default for
   hooks and rules is the template version (that is the point of this
   command); local edits survive only if the user says so.
3. New commands: copy in; never remove commands absent from the template.
4. **Hook registrations: merge, never replace.** A copied hook does nothing until
   `.claude/settings.json` registers it. For each `{event, matcher, command}` in
   the template's `.claude/settings.json` → `hooks` that this project lacks, ADD
   it (into the same event + matcher entry if one exists, else a new entry).
   Never remove, reorder or edit an existing registration and touch no other key.
   Show the user the added lines. Example: the antislop hooks
   (`pre-artifact-antislop.cjs` on `Artifact`, `post-edit-antislop.cjs` on `Edit|Write`).

## Phase 4: Regenerate the ZCode half

```
node scripts/sync-zcode.mjs
```

If `AGENTS.md` changed, also run `node scripts/sync-agent-rules.mjs` to refresh
the editor shims.

## Phase 5: Verify

1. Hook probe: `echo "DROP TABLE probe_table"` must come back `🛑 BLOCKED`.
   antislop probe: `node scripts/antislop-check.mjs <any user-facing file>` must run
   (exit 0, or exit 2 with findings), and `settings.json` must register both
   antislop hooks.
2. `.zcode/commands/` still mirrors `.claude/commands/` (new command included).
3. Run the project's typecheck/build if the setup scripts themselves changed.

## Phase 6: Commit

```
chore: update from vibe-coding-template (<short version or date>)
```

Push, then update `PROGRESS.md` only if a phase was already in progress —
this is housekeeping, not a feature phase.
