---
name: pr-review
argument-hint: "[PR number] or [branch-name]"
---

# PR Review: $ARGUMENTS

## Step 1: Get the Diff

```bash
# If PR number:
gh pr diff $ARGUMENTS

# If branch name:
git diff main...$ARGUMENTS --stat
git diff main...$ARGUMENTS
```

Read every changed file. Understand the intent of the change.

## Step 2: Automated Checks

Check out the branch and run:
```bash
git checkout $ARGUMENTS
npm install
npx tsc --noEmit
npx eslint . --quiet
npm test
npm run build
```

Show output of each.

## Step 3: Code Review Agent

Trigger `code-reviewer` agent on all changed files.

## Step 4: Security Check (if applicable)

Run `security-auditor` agent if PR touches:
- Authentication or authorization
- Payment processing
- User data or PII
- File uploads
- Environment configuration

## Step 5: Manual Testing

For UI changes: test in browser.
For API changes: test with curl or Postman.
Describe what you tested and what you observed.

## Step 6: Report

```
PR REVIEW: $ARGUMENTS
═════════════════════
INTENT: [what this PR does in 1-2 sentences]

AUTOMATED CHECKS:
  TypeScript: ✓ Clean / ✗ [errors]
  ESLint:     ✓ Clean / ✗ [warnings]
  Tests:      ✓ All pass / ✗ [failures]
  Build:      ✓ Success / ✗ [errors]

CODE REVIEW: [from code-reviewer agent]
SECURITY:    [from security-auditor or N/A]
MANUAL TEST: [what was tested]

CRITICAL BLOCKERS:
- [list or "none"]

APPROVED: Yes / No
REASON: [if No, specific issues to fix]
```
