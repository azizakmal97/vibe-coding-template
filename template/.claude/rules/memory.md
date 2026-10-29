---
paths:
  - "**/*"
---

# Capture & Recall — how the project gets faster over time

Always loaded. A non-obvious problem should be solved ONCE, then recalled
instantly. That only works if lessons get written down and consulted. Both
halves are on you; skipping either is how an agent re-derives the same fix
every month and calls it progress.

## Capture — the same turn you solve it

When you resolve an error, bug or gotcha that took real digging, write it down
BEFORE moving on. Not "at the end" — there may be no end; the session can die
after any tool call.

Record four things:

- **Symptom** — what you actually saw, including the exact error text.
- **Root cause** — why it happened, not just where.
- **Fix** — the exact command or change.
- **How to apply next time** — what a future reader should do differently.

Where it goes:

- A note under `memory/` (one file per lesson), with a one-line pointer added to
  `memory/MEMORY.md` — that index is what gets read at session start, so a note
  with no pointer is a note nobody finds.
- If it must be known EVERY session, put it in the project `CLAUDE.md` under a
  "Known Issues" or gotcha section instead.

Worth capturing: OS- or environment-specific failures, flaky tests, data-wiping
footguns, "use script X, not command Y", non-obvious config, a routing miss
(`CLAUDE.md` §22 Rule 5), anything you would otherwise re-derive. Not worth capturing: one-off typos, or anything already
obvious from reading the code.

**A wrong lesson is worse than none.** Write only what you VERIFIED fixed the
problem, never a guess that looked plausible. A confidently-wrong note sends the
next reader down a dead end with your authority behind it — this is the
discipline auto-learning setups skip, and why their memory rots.

## Owner rules: write them where the work reads them

A rule the owner states in chat ("always use X", "never do Y") is lost the moment the
session ends unless it sits in a file the next job reads. New sessions, scheduled jobs and
subagents know only what is in files. A memory note in one project's folder never reaches
a job running in another. Recording it in memory alone is not enough. In the same turn:

1. Find the line that actually decides the behaviour: the command (`.claude/commands/`),
   the skill, or `CLAUDE.md`. Edit that line, and delete or reword any line that says the
   opposite. Jobs follow the most specific line they read.
2. If the rule fits every project, put it in the shared or global skill, not one project.
3. Commit and push, then tell the owner which file now holds it.

When you brief a subagent, give it every owner rule that applies in the first message,
not one at a time while it is already working. If an owner note could mean two things,
ask in one line instead of guessing. A guess in the wrong direction costs a full redo.

**Efficiency.** Start from what the owner already approved. Measure instead of guessing,
then correct in code. Preview the risky part before the full build. Run the expensive step
(render, export, deploy) once, after the checks pass.

## Recall — at session start, and before editing an unfamiliar area

Before re-debugging anything, check what the project already knows:

- The project `CLAUDE.md` gotcha sections.
- The `memory/MEMORY.md` index, then any note it points to that sounds relevant.

Reading the note is far cheaper than re-deriving the fix.

**Verify before you rely on it.** A note reflects what was true when it was
written. If it names a file, a flag or a command, confirm that still exists
before acting on it — and if it turns out to be wrong, correct or delete the
note rather than working around it silently.
