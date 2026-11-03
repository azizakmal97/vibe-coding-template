---
description: Close the session properly — save, record, clean up and report before the owner opens a new session.
---

# /close

The owner closes the session after this and opens a fresh one, which knows only
what is in files. Anything not committed, pushed or written down is lost. Do every
step; say "nothing to do" for a step that has none, never skip it silently.

## Steps

1. **Every repo touched this session.** List them from the conversation (other
   projects too, not just the working directory). For each: `git status -sb`.
   - Uncommitted work: finish the edit if it is safe to, run the project's
     typecheck/build, and commit one logical change per commit. Half-done work
     that cannot be finished: commit it as `wip(...)` and say so.
   - Not pushed: `git push`, then re-check `git status -sb`. Never force-push.
   - A push that deploys (check the project's `CLAUDE.md`): confirm the deploy
     ran, or say plainly that it is unverified.
2. **Project records.** Update only what this session changed:
   - `PROGRESS.md`: tick finished bullets, mark the active phase, add a resume
     note (`continue from bullet N; last touched <file>`) for anything unfinished.
   - `CHANGELOG.md` (if the repo has one): one entry per user-visible change.
   - Docs that describe something that changed (README, `docs/`, `AGENTS.md`
     tables). In the template repo, a change to `template/AGENTS.md` also needs
     `node template/scripts/sync-agent-rules.mjs`.
3. **Memory** (`memory.md` rules): save each verified lesson that took real
   digging (symptom, root cause, fix, how to apply), an owner rule stated in chat
   (into the file that decides the behaviour, not only memory), and open work a
   later session must pick up. Update or delete notes this session proved stale.
   One-line pointer per note in `MEMORY.md`.
4. **Clean up.** Stop every server, watcher and background job you started. Send
   your own scratch files to the Recycle Bin (`~/.claude/scripts/trash.ps1`),
   never `rm`. Leave no subagent or side session running without telling the owner.
5. **Final check.** Re-run `git status -sb` on every repo from step 1; all must
   show clean and in sync. Anything that is not goes in the report.
6. **Report** — short, plain words:
   ```
   CLOSED
   SAVED:      <repo> <last commit> pushed  (one line per repo)
   RECORDED:   <files updated in steps 2–3>
   STILL OWED: <unfinished work, decisions waiting on the owner, unverified deploys>
   NEXT:       <task> — Model: <model> · Effort: <effort>
   SAFE TO CLOSE: yes | no — <why not>
   ```

## Refuse Conditions

- A check (typecheck, build, tests) fails on work you would commit: do not
  commit broken work as done. Commit it as `wip(...)` with the failure in the
  body, and put it under STILL OWED.
- Never discard uncommitted work you did not write; list it instead.
