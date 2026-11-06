# Headless Jobs: one fresh session per job

Use this when an agent must work without anyone watching: nightly builds, publishing,
reply rounds, anything a scheduler starts. Skip it for work the owner does live.

## The pattern

```
scheduler (cron, Task Scheduler) -> job queue -> one `claude -p` per job, in the job's project folder -> result written back
```

One long session that handles everything fails in three ways: its context fills up, it
dies without a word when a limit hits, and rules from one project leak into another. A
fresh process per job avoids all three. It starts in that project's folder, so it loads
that project's `CLAUDE.md`, rules and model table, and nothing else.

## Rules

1. **State lives outside the session.** Decisions and job status are rows or files any
   script can read. A job never depends on a chat staying open.
2. **Everything the job must know is in a file it reads.** A job has no memory of past
   chats. A rule stated in chat goes into the command or skill the job runs, the same turn.
3. **No prompts.** `claude -p` cannot ask. Allow every tool and command the job needs in
   the project's `.claude/settings.json`, then run the job once by hand. A missing
   permission looks like a job that did nothing.
4. **Failure is loud.** The job prints one agreed failure line and the runner treats it as
   failed, whatever the exit code says. Agents often exit 0 after giving up.
5. **Claim before running, and run a job once.** The runner claims a job with one
   conditional update, renews the claim while it runs, and releases it on exit. Anything
   that must happen exactly once (a post, a payment) keeps its own record, so a rerun can
   tell the work was already done.
6. **Keep a log per job,** and show it where the owner looks. `-p` sessions cannot be
   opened or followed from a phone.
7. **Prepare what the job can't.** A job that needs a browser needs that browser open
   before it starts. Check that the login is still good at the start of the job: an
   expired login removes tools quietly, and the job then fails in a confusing way.
8. **Respect the machine.** Cap jobs to a small number at once and check free memory
   before a heavy one. Queue the rest. A job killed for memory leaves no message.
9. **Keep job files inside the project folder.** Tools can refuse paths in the system
   temp folder. Add the folder to `.gitignore`.
