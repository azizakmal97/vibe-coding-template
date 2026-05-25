# Handover — [Project Name]

> For the person inheriting this project. Written in plain English. No jargon.

## 1. What This App Does (in 1 sentence)

[E.g. "Lets freelancers track their invoices and which clients have paid."]

## 2. Who Uses It

- _user type 1_ — what they do
- _user type 2_ — what they do

## 3. What You're Inheriting

| Thing | What it means |
|---|---|
| Source code | The text files the app is built from. Lives in this folder. |
| Database | Where user data is stored. Connection details in `.env` (not committed). |
| Deployment | The live version users see. URL: _____________ |
| Documentation | This folder (`docs/`) explains everything in plain English. |
| AI agent setup | `.claude/` folder makes Claude Code behave consistently. Don't delete. |

## 4. The 10 Commands You'll Actually Use

(From `commands.json` — copy-paste these into your terminal.)

```bash
npm run dev          # Start app on your computer (localhost). Test changes here first.
npm run build        # Make production version. Use before deploying.
npm test             # Check nothing is broken. Run before every commit.
npm run typecheck    # Catch programming mistakes early.
git status           # See what files you changed.
git add .            # Stage all your changes for committing.
git commit -m "..."  # Save changes with a description.
git push             # Send changes to GitHub.
git pull             # Get others' changes from GitHub.
gh pr create         # Open a pull request (asks others to review your changes).
```

## 5. What You MUST NEVER Do

| Action | Why bad |
|---|---|
| Commit `.env` file | Contains passwords. Anyone seeing GitHub sees them. |
| Run `prisma migrate reset` on production | Wipes all user data. There is no undo. |
| Force push to main (`git push --force`) | Erases other people's work. |
| Delete `.claude/` folder | Removes all AI safety nets. |
| Bypass tests with `--no-verify` | The tests exist because something broke before. |

The hooks in `.claude/hooks/*.js` block most of these automatically. Don't disable them.

## 6. Glossary (Plain English)

| Word | What it means |
|---|---|
| Commit | A saved snapshot of your code with a description. Like "save" in a word processor. |
| Branch | A parallel version of the code you can experiment in without breaking main. |
| Pull request (PR) | "Hey, please review my branch before merging it into main." |
| Migration | A change to the database structure (adding a column, etc.). |
| Hook | A small script that runs automatically before/after certain actions. |
| Agent | A specialised AI helper (code-reviewer, debugger, etc.) inside Claude Code. |
| Hot reload | When you save a code file, the app updates instantly. |
| Linter | Tool that catches style mistakes and likely bugs. |
| Type error | The code asked for a number but got a string. Strict TypeScript catches these. |
| Race condition | Two things happen at almost the same time and one breaks the other. |

## 7. How to Ask the AI for Help (Without Frustration)

Good prompts:
- "Fix the login button — when I click it, nothing happens. Console says: [paste error]."
- "Add a 'cancel' button next to 'save' on the invoice form. Same style as the existing buttons."
- "Why is the dashboard page slow to load? Profile and propose a fix."

Bad prompts (will give bad results):
- "Make the app better"
- "Fix everything"
- "Refactor this" (without saying what + why)

If the AI's answer doesn't work, paste the exact error message back. Don't paraphrase.

## 8. When Something Breaks

1. Read the error message word-for-word. Most errors literally say what's wrong.
2. Run `git status` — see what files you changed.
3. Run `git diff` — see exact lines changed.
4. Try `git stash` to temporarily undo all changes, see if it works without them. If yes, your change broke it.
5. If still stuck: paste the error + the recent commit to the AI agent: "I made this change and now I see this error. Help."

If the app is broken in production:
1. Run `git revert <bad-commit-hash>` then `git push`. This safely undoes that one commit.
2. Don't panic-edit. Revert first, debug later.

## 9. Monthly Check-In

Every first Friday of the month:
- Read `PROGRESS.md` — what got done?
- Click through the live app — anything feel different / broken?
- Run `npm test` — all green?
- Glance at `git log --oneline -20` — anything surprising?
- Skim `AUDIT_AND_ROADMAP.md` Part 5 — are we on plan?

If anything unclear, ask the AI to explain it in plain English with this file open as context.
