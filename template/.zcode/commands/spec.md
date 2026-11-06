---
description: Write a short spec (what to build, never how) before a new feature, so "done" can be checked against it. Ideas adapted from github/spec-kit (MIT).
argument-hint: "[feature name] — [one sentence description]"
---

<!-- GENERATED from .claude/ by scripts/sync-zcode.mjs — DO NOT EDIT. Edit the .claude/ source and re-run. -->

# /spec: $ARGUMENTS

Write ONE file, `specs/<slug>.md` (create `specs/` if missing). It says what to
build and how we know it works. Never tech choices, file names or code.

**Skip it** for small changes: a one-file fix, a copy tweak, a bug, a refactor that
keeps behaviour. **Use it** for a new user-visible feature, or anything touching
money, auth or personal data.

## Steps

1. Read `CLAUDE.md` and any existing `specs/*.md`. Reuse their words for the same things.
2. Draft the file from the skeleton below. Fill what the request already answers.
3. Scan the draft for gaps: scope and roles (who can do what), data and its
   lifecycle, error / empty / loading states, security and privacy, outside
   services failing, vague words ("fast", "easy") with no number, tests nobody
   could check.
4. Keep only questions whose answer would change what gets built. Ask at most 5,
   ONE at a time, in plain words, each with your recommended answer.
5. Write each answer into the spec right away and delete its marker. Anything
   you chose not to ask goes under Assumptions as a default.
6. Set `Status: agreed` only when no `[NEEDS CLARIFICATION]` marker is left and
   the owner has okayed the spec. Until then it stays `draft`.
7. Commit: `docs(spec): <slug>`.

## Skeleton

```markdown
# <Feature title>

Date: <YYYY-MM-DD> · Status: draft | agreed

## Stories

### S1 (P1): <who can do what, and why they care>
Why P1: <one plain line>. P1 alone must be a usable slice.

Acceptance:
- A1. Given <start state>, when <action>, then <visible result>.
- A2. ...

### S2 (P2): ...
Why P2: <one plain line>

- A3. Given ..., when ..., then ...

## Edge cases
Empty, failure, too much, double action. One line each.

## Out of scope
- <things people might expect but we will not build now>

## Assumptions
- <default chosen without asking>

## Open questions
- [NEEDS CLARIFICATION: <question>]
```

Acceptance tests are numbered `A1`, `A2`, ... across the whole file, never
restarted per story, so `/done-check` and `PROGRESS.md` can point at one.

## Inside /autonomous

Never stop to ask. Take the recommended answer, record it under Assumptions, and
put the question under the phase's `Waiting on owner` in `PROGRESS.md`. Leave
`Status: draft` until the owner confirms.
