---
description: Pre-open-source scrub. Runs only when user is ready to publish the repo (e.g. switching from private to public on GitHub).
---

# /pre-publish

Audit + scrub before flipping a private repo to public OR before pushing to a public mirror.

## Steps

### Phase 1 — Secret Sweep (Critical)

1. Grep git history for secrets:
   ```bash
   git log -p --all -S "API_KEY" -S "SECRET" -S "PASSWORD" -S "BEGIN PRIVATE KEY" -S "BEGIN RSA PRIVATE KEY"
   ```
2. Grep current tree:
   ```bash
   git grep -E "(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|xox[bp]-[0-9]{10,}|AIza[0-9A-Za-z\\-_]{35})"
   ```
3. Check config files for hardcoded IDs (account_id, project_id, database_id):
   ```bash
   git grep -E "(account_id|project_id|database_id)\\s*[:=]\\s*[\"'][a-f0-9-]{20,}[\"']"
   ```
4. If anything found, instruct user to:
   - Rotate the leaked secret IMMEDIATELY (revoke + reissue at provider).
   - Use `git filter-repo` or `BFG Repo-Cleaner` to scrub history.
   - Force-push (one-time, with user's explicit ack of force-push risks).

### Phase 2 — Config Templating

For each hardcoded environment-specific ID found in config:
- Replace literal value with `${ENV_VAR_NAME}` template.
- Document the var in `docs/DEPLOY.md`.
- Add to `.env.example`.

### Phase 3 — Dev-Only File Move

Move historical / one-off scripts to `scripts/historical/`:
- `scripts/repair_*.sql`
- `scripts/migrate_data_*.ts`
- Anything with a date in the filename that already ran in prod.

Add README in `scripts/historical/`: "Frozen. Do not re-run."

### Phase 4 — .gitignore Audit

Verify these patterns are present:
```
.env
.env.*
!.env.example
.dev.vars
.wrangler/
node_modules/
dist/
build/
.next/
*.local
secrets/
*.pem
*.key
```

### Phase 5 — Generate Missing Docs

If missing, create with sensible defaults (ask user about license choice):

- `LICENSE` — based on user choice (see Phase 6).
- `README.md` — project description, quickstart, link to docs/.
- `SECURITY.md` — how to report vulnerabilities.
- `CONTRIBUTING.md` — how to submit PRs.
- `CHANGELOG.md` — Keep-a-Changelog format.
- `CODE_OF_CONDUCT.md` — Contributor Covenant.
- `.env.example` — every required env var.
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/pull_request_template.md`
- `docs/ARCHITECTURE.md` (separate from plain-English versions).
- `docs/DEPLOY.md` — deployment + env vars + secret setup.

### Phase 6 — License Decision

If `LICENSE` missing, present options:

| License | Sell model | Tradeoff |
|---|---|---|
| Proprietary (All Rights Reserved) | Per-customer license | Max control; no community contribution |
| MIT | No selling (free for all) | Zero leverage; anyone can fork + sell |
| AGPL-3.0 + Commercial (dual) | Free AGPL OR paid commercial | Real revenue; needs lawyer for commercial terms |
| BSL (Business Source License) | Source-available, OSS after N years | Allows community, blocks competitors |
| Elastic License v2 | Free use, no managed-service resale | Stops cloud resellers |

Default for solo-dev SaaS: AGPL + Commercial dual-license.
Default for community library: MIT.
Default for "I want to keep selling this": Proprietary, do NOT publish to public.

### Phase 7 — Final Checklist

Report back:
```
PRE-PUBLISH AUDIT
=================
SECRETS:       [CLEAN | N findings — rotate + scrub history]
HARDCODED IDS: [CLEAN | N findings — templated]
DEV-ONLY FILES: [moved to scripts/historical/ | none found]
.gitignore:    [complete | missing N patterns — added]
DOCS:          [generated N missing files]
LICENSE:       [<chosen>]
VERDICT:       [SAFE TO PUBLISH | DO NOT PUBLISH (rotate secrets first)]
```

## Refuse Conditions

- Refuse to mark "SAFE TO PUBLISH" if secrets found in current tree (no exceptions).
- Refuse to force-push without explicit user confirmation "yes force push to scrub secrets".
- Refuse to add a license without user choosing one.
