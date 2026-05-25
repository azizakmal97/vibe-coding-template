---
description: Fetch latest GitHub Actions runs. On failure, ingest log summary into PROGRESS.md as a new phase. Closes the autonomous feedback loop.
---

# /check-ci

After every push, CI runs on GitHub. If it fails, the agent must absorb that failure into PROGRESS.md so next session (or current autonomous loop) fixes it without user prompting.

## Steps

1. **Quick check (one gh call):**
   ```bash
   gh run list --limit 5 --json status,conclusion,workflowName,headBranch,databaseId,createdAt
   ```
2. Parse. For each run on the current branch:
   - `conclusion == "success"` → ignore.
   - `conclusion == "failure"` → process below.
   - `conclusion == null` AND `status == "in_progress"` → report "CI still running", exit. Don't poll.

3. **For each failure, fetch log summary (NOT full log — token-hungry):**
   ```bash
   gh run view <databaseId> --log-failed | head -200
   ```
4. **Extract root cause** (first error line + 5 lines context). Format:
   ```
   CI FAILURE: <workflow> on <branch>
   ROOT CAUSE: <one line>
   FILE: <path:line if extractable from log>
   COMMAND: <which step failed: lint/typecheck/test/build>
   ```

5. **File as PROGRESS.md phase entry** (use next available phase id, e.g. `CI-FIX-NNN`):
   ```markdown
   ### ⬜ CI-FIX-001 — Fix CI failure: <workflow> on <branch>

   **Status:** pending
   **Detected:** YYYY-MM-DD by /check-ci
   **CI run:** https://github.com/<repo>/actions/runs/<id>

   **Plan for this phase:**
   - [ ] Reproduce failure locally: `<command>`
   - [ ] Fix root cause: <hypothesis>
   - [ ] Add regression test if applicable
   - [ ] Push, verify CI green
   ```
6. Commit:
   ```
   git add PROGRESS.md && git commit -m "chore(ci): ingest failure CI-FIX-NNN"
   ```

## Token Discipline

- Use `--limit 5` not `--limit 50`.
- Use `--log-failed | head -200` not full log.
- One gh call to list, one per failed run for log. Do NOT poll.
- If 3+ CI runs failing on different things, ingest ONLY the most recent — older failures likely cascading.

## Inside /autonomous Loop

Called before `/next-phase`. Ensures AI fixes CI red before opening new feature work.

## Output Format

```
CI CHECK COMPLETE
=================
RUNS CHECKED: N
GREEN:   M
FAILED:  K (ingested as CI-FIX-NNN ... CI-FIX-NNN+K-1)
PENDING: P

NEXT: <fix CI-FIX-001 first | proceed to /next-phase>
```

## Refuse Conditions

- `gh` CLI not installed → report + skip (don't block other commands).
- Not authenticated (`gh auth status` fails) → report + skip.
- Repo has no GitHub remote → skip silently.
