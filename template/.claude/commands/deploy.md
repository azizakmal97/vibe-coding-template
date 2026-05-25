---
description: Manual deploy from local. Preset-aware. Runs typecheck + build + deploy + verify live. For when CI is unavailable or you need on-demand push.
---

# /deploy

On-demand local deploy. Preset-aware. Always preceded by verification gate.

## Pre-Flight (Mandatory)

1. **Working tree clean** — uncommitted changes? STOP, `/checkpoint` first.
2. **On the right branch** — typically `main` for prod. Confirm.
3. **Local verification passes:**
   ```
   <typecheck> && <lint> && <test> && <build>
   ```
   (Pulled from `commands.json`.)
4. **All commits pushed to remote** — `git status` shows `up to date`.

## Deploy By Preset

| Preset | Deploy command |
|---|---|
| web | `npm run deploy` (or `vercel --prod` / `wrangler pages deploy dist` per project) |
| mobile | `flutter build apk --release` + manual upload to Play Console (or `fastlane`) |
| desktop | `npm run tauri:build` + manual upload to release server (or `tauri-action` via tag) |
| fullstack | `npm run deploy` (Vercel auto-deploys from main; this triggers manual) |

For Cloudflare-deployed apps (web/fullstack): `npx wrangler deploy` with `--remote` data flag respected.

## Post-Deploy Verification

1. **Fetch the live URL** — `curl -s -o /dev/null -w "%{http_code}" <url>` should return 200.
2. **Smoke test** — hit the critical user flow once via dev tools / curl / manual click.
3. **Check error logs** — Sentry / Cloudflare logs / Vercel logs for spike post-deploy.
4. **If anything red** — `git revert <bad-commit>` + `/deploy` again to roll back.

## Commit + Tag

After verified deploy:
```bash
git tag -a v<x.y.z> -m "Deploy <date>"
git push --tags
```

## Output Format

```
DEPLOY PIPELINE
===============
PRE-FLIGHT:    [pass | fail]
BUILD:         [success | error]
DEPLOY:        [success | error]
LIVE URL:      <url> → HTTP <code>
SMOKE TEST:    [pass | fail]
ERROR LOGS:    [clean | <n> spike]
TAG:           <vX.Y.Z>
VERDICT:       SHIPPED / ROLLED BACK
```

## Refuse Conditions

- Working tree dirty.
- Local verification failed.
- Unpushed commits (deploy MUST match what's on remote main).
- Live URL not reachable (env vars / DNS / firewall issue).
- Smoke test failed post-deploy (auto-revert option).

## When NOT to Use

- Production hotfix during incident — use git revert + targeted re-deploy of last-known-good.
- Major version bump — needs migration coordination, use checklist not slash command.
