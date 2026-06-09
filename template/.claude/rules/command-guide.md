---
paths:
  - "**/*"
---

# Command Permission Guide

Always loaded. Applies when Claude is about to run a shell command.

## Rule: Explain before you run

Before running any command the user might not recognise, add a ONE-sentence plain-English
explanation of what it does and why. Do not assume the user knows CLI tools.

Format for unfamiliar commands:
> Running `<command>` — [plain-English: what it does, what it touches, why it's needed].

For obvious commands (`git status`, `npm install`, `bun run dev`) this is optional.
For anything that reads files, writes to disk, calls a URL, or modifies a database — always explain.

## Quick reference: common commands and what they mean

| Command | What it actually does | Safe to allow? |
|---|---|---|
| `curl <url>` | Fetches a web page or API — like a browser but in the terminal | Yes, if URL is your own domain, localhost, or a known public API |
| `curl -sI <url>` | Only reads the HTTP headers (status code, etc.) — no body downloaded | Always safe |
| `git status` | Shows which files have unsaved changes — read only | Always safe |
| `git add / commit / push` | Saves and uploads your code to GitHub | Safe — this is the normal workflow |
| `npm install / bun install` | Downloads packages listed in package.json into node_modules | Safe |
| `npm run dev / bun dev` | Starts the local development server on your machine | Safe |
| `npm run build / bun build` | Compiles your code into production files | Safe |
| `npx tsc --noEmit` | TypeScript type-check — reads code, reports errors, changes nothing | Always safe |
| `ls` / `dir` | Lists files in a folder — read only | Always safe |
| `node scripts/...` | Runs a project script from the scripts/ folder | Usually safe — look at what the script is named |
| `gh run list` / `gh pr ...` | Reads GitHub CI status or PR info | Safe — read only |
| `docker compose up` | Starts Docker containers defined in the project | Safe for this project |
| `python scripts/...` | Runs a Python helper script | Usually safe — look at what the script is named |

## Red flags — stop and read carefully before approving

These are NOT in the allow list and should never be auto-approved:

| Pattern | Why it's dangerous |
|---|---|
| `rm -rf ...` | Permanently deletes files or folders — no undo |
| `curl ... -d "..." https://unknown-site.com` | Sends your data somewhere external |
| `git push --force` | Overwrites the remote branch history — can lose commits |
| `git reset --hard` | Throws away all uncommitted local changes |
| `DROP TABLE` / `DELETE FROM` (in SQL) | Permanently deletes database data |
| `npm publish` | Publishes a package to the public npm registry |
| Any command reading `.env`, `*.pem`, `*.key` | Reading secret files |

## What to look at when Claude asks permission

1. **The URL** — if curl or fetch is hitting a URL, is it your own domain or localhost?
2. **The command name** — does it sound like it deletes or sends data?
3. **The script path** — `scripts/check-file-sizes.mjs` is fine; `scripts/wipe-db.sh` needs a read first.

If you're unsure, deny it and ask Claude to explain. A good AI agent will always explain without pushback.
