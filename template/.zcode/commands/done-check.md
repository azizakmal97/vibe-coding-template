---
description: Compare the code as it is now to the feature's spec before a phase is marked done. Reports gaps, never edits source.
argument-hint: "[spec file, default: the active phase's Spec line]"
---

<!-- GENERATED from .claude/ by scripts/sync-zcode.mjs — DO NOT EDIT. Edit the .claude/ source and re-run. -->

# /done-check: $ARGUMENTS

Passing tests say the code runs, not that it does what the spec asked. This
checks the second thing. Run it before `done(<phase-id>)`.

## Find the spec

Use the argument, else the active phase's `**Spec:**` line in `PROGRESS.md`. No
spec, or `none`: say "no spec, nothing to check" and stop. That is not a failure.

## Steps

1. Read the spec. List every acceptance test (`A#`), story and edge case.
2. For each, find evidence: a passing test that really exercises that item, or
   the code path, cited as `file:line`. A green suite alone proves nothing. If no
   test covers the item, say so and cite the code instead.
3. Mark each one `met`, `partial` or `missing`.
4. Search for anything built that the spec lists under Out of scope. Flag it.
5. Never edit source code in this command.
6. Items only the owner can judge by eye (look, feel, wording) are not gaps. Put
   them under the phase's `Waiting on owner`.
7. For each `partial` or `missing` item, add a bullet to the active phase's plan
   in `PROGRESS.md`, tagged with its `A#` and a `(Model: ...)` tag. Then commit:
   `wip(<phase-id>): done-check found <n> gaps`.

## Output

```
| Item | Status  | Evidence                    |
|------|---------|-----------------------------|
| A1   | met     | tests/x.test:12, src/y:40   |
| A2   | partial | src/y:55, no test           |
| Edge: empty list | missing | none           |
| Out of scope: export | flagged | src/z:9    |

DONE-CHECK: PASS
```

The last line is `DONE-CHECK: PASS` or `DONE-CHECK: <n> GAPS`. Only PASS allows
the `done(<phase-id>)` commit. After gaps are fixed, run this again.

## Inside /autonomous

Gaps become plan bullets and the loop continues with them. Do not mark the phase
done until a re-run says PASS.
