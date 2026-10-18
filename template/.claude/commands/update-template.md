---
name: update-template
argument-hint: "[optional: path to the vibe-coding-template clone — found or downloaded automatically]"
---

# Update Template

Pull the latest rules, hooks, scripts and CI from the vibe-coding-template repo
into THIS project. Projects drift as the template evolves; this closes the gap
without touching project-owned files.

## Find the template first

Upstream: https://github.com/azizakmal97/vibe-coding-template (public, no login).

1. **Location, in order:** the argument → `$VIBE_TEMPLATE_DIR` → `templateDir` in
   `~/.claude/vibe-template.json` (written by the global setup) →
   `~/vibe-coding-template` if it is a clone of upstream. Never guess any other path.
2. **None found (a new computer):** clone upstream into `~/vibe-coding-template`,
   then write `~/.claude/vibe-template.json` as `{ "templateDir": "<that path>" }`
   so the next run finds it. Tell the user in one line what was downloaded and where.
3. **Refresh it:** `git -C <dir> fetch`. If it is behind and has no local changes,
   `git -C <dir> pull --ff-only`. If it has local changes, say so and use it as it is.
4. **Sanity check:** stop if `<dir>/template/.claude/commands/update-template.md`
   is missing; that folder is not a template clone.
5. **No global setup on this machine** (`~/.claude/skills/update-template/`
   missing)? In the Phase 6 report, tell the user that running
   `.\setup.ps1 -Agent claude` inside `<dir>` makes `/update-template` available in
   every project, including ones that don't carry this file.

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
- `.gitignore` — missing required lines appended, nothing else touched (Phase 3 step 5)

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
   command); local edits survive only if the user says so. A command the
   project rewrote for itself (its own deploy recipe, say) is usually a
   **merge**: keep the local file and add the template's new steps into it.
   Keeping a local file must never silently drop a step the template added;
   list every such step in the Phase 1 summary and confirm each landed.
3. New commands: copy in; never remove commands absent from the template.
4. **Hook registrations: merge, never replace.** A copied hook does nothing until
   `.claude/settings.json` registers it. For each `{event, matcher, command}` in
   the template's `.claude/settings.json` → `hooks` that this project lacks, ADD
   it (into the same event + matcher entry if one exists, else a new entry).
   Never remove, reorder or edit an existing registration and touch no other key.
   Show the user the added lines. Example: the antislop hooks
   (`pre-artifact-antislop.cjs` on `Artifact`, `post-edit-antislop.cjs` on `Edit|Write`).
5. **`.gitignore`: append, never replace.** From the project root run
   `node <dir>/template/scripts/ensure-gitignore.mjs`. It holds the template's
   required ignore lines and appends only the ones this project lacks, under their
   group comment; it never removes, reorders or edits a line. Show the user the
   lines it printed as added.

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
4. `.claude/` reaches the remote: `git check-ignore -q .claude/rules` must FAIL
   (exit 1). If it succeeds, `.claude/` is gitignored and every other computer
   gets none of this update; follow the fix the SessionStart notice prints.
5. Generated output stays out of Git: `git check-ignore -q graphify-out/GRAPH_REPORT.md`
   must SUCCEED (exit 0).

## Phase 6: Commit

```
chore: update from vibe-coding-template (<short version or date>)
```

Push, then update `PROGRESS.md` only if a phase was already in progress —
this is housekeeping, not a feature phase.
