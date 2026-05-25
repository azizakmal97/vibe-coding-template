---
name: fix-bug
argument-hint: "[error message or description of wrong behavior]"
---

# Bug Fix: $ARGUMENTS

No shortcuts. No guessing. Prove it.

## Step 1: Get the Full Picture

Collect:
- Exact error message (copy paste, not paraphrase)
- Stack trace (full, not truncated)
- Steps to reproduce
- Expected behavior vs actual behavior
- When it started: `git log --oneline -15`

## Step 2: Write a Failing Test First

Before touching the source code, write a test that:
- Reproduces the exact bug
- Currently fails
- Will pass only when the bug is fixed

```bash
npm test -- [test file] # Confirm it fails
```

This test is your proof of fix later.

## Step 3: Isolate Root Cause

Which layer? UI / API / Database / Config / External service

Add temporary logging to trace execution:
```typescript
console.log('[DEBUG]', { step: 'before call', input: data })
```

Narrow down until you can state:
"The bug is in `[file]:[line]` because `[specific reason]`."

Do NOT fix anything until you can state the root cause.

## Step 4: Minimal Fix

Change ONLY what's needed to fix the root cause.
Do not:
- Refactor surrounding code
- "Improve while you're here"
- Change unrelated behavior
- Add features

Remove the temporary debug logs before committing.

## Step 5: Verify Fix

```bash
npm test -- [failing test from step 2]  # Must now pass
npm test                                 # Full suite — nothing new broken
```

Show output of both.

## Step 6: Commit

```
fix([scope]): [what was wrong, stated as user-visible behavior]

Root cause: [one sentence technical explanation]
```

## Step 7: Regression Prevention

If the bug was subtle or could recur:
- Add a comment in the code explaining the non-obvious invariant
- Add the issue to `CLAUDE.md` under "Known Issues" as "Fixed: [summary]"
