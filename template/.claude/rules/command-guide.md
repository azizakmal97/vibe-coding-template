---
paths:
  - "**/*"
---

# Command Permission Guide

Before running any unfamiliar command, add ONE plain-English sentence explaining
what it does and why. Don't assume the user knows CLI tools.

Format: `Running \`<cmd>\` — [what it does, what it touches, why needed].`
Skip for obvious ones (`git status`, `npm install`, `bun run dev`).

## Safe commands (quick ref)

| Command | What it does |
|---|---|
| `curl <url>` | Fetches a URL — like a browser in terminal |
| `curl -sI <url>` | Reads HTTP headers only — never body |
| `git add/commit/push` | Saves + uploads code to GitHub |
| `npm/bun install` | Downloads packages from package.json |
| `npm/bun run dev/build` | Starts dev server or compiles code |
| `npx tsc --noEmit` | Type-checks — reads only, changes nothing |
| `ls` / `dir` | Lists files — read only |
| `node/python scripts/...` | Runs a project helper script |

## Red flags — always explain before approving

| Pattern | Why dangerous |
|---|---|
| `rm -rf ...` | Permanently deletes files |
| `curl ... https://unknown-site.com` | Sends data externally |
| `git push --force` | Overwrites remote history |
| `git reset --hard` | Discards all uncommitted changes |
| `DROP TABLE` / `DELETE FROM` (SQL) | Permanently deletes database data |
| Reading `.env`, `*.pem`, `*.key` | Exposes secrets |

## User decision checklist

- **URL** — is it your own domain or localhost?
- **Command name** — does it delete or send data?
- **Script path** — does the name sound safe?

If unsure, deny and ask. A good agent always explains without pushback.
