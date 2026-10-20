---
description: Full-repo security audit. Every finding is verified by a second agent before it is reported, and the fixes are planned as a PROGRESS.md phase. Run before launch, after big auth/money/sharing changes, and quarterly.
argument-hint: "[quick|standard] [optional scope: a path or feature, e.g. apps/api/src/routes]"
---

<!-- GENERATED from .claude/ by scripts/sync-zcode.mjs — DO NOT EDIT. Edit the .claude/ source and re-run. -->

# /security-audit

Model: **Opus 5.5 · high** (security review: being wrong is expensive). On another
model, stop and ask for `/model opus` first (`CLAUDE.md` §22 Rule 4).

Arguments: `$ARGUMENTS`

## Steps

1. Load the `security-audit` skill (`.claude/skills/security-audit/SKILL.md`) and
   follow it in full-audit mode. `CHECKLISTS.md` sits next to it.
2. Profile: the first argument if it is `quick` or `standard`, otherwise the skill's
   profile table decides. Scope: the rest of the arguments, otherwise the whole repo.
3. Say the plan in one line before spawning hunters: profile, scope, number of agents,
   output folder (`docs/security/`, or the gitignored `.security-audit/` when the repo
   is public).
4. Run Phases 0-5 of the skill. Hunters and verifiers are separate `security-auditor`
   agents; a verifier never checks its own candidate.
5. Commit the report, `findings.json` and the `PROGRESS.md` fix phase together.

## Report back

```
SECURITY AUDIT: <profile> · <scope> · run <complete|incomplete: reason>
CONFIRMED: <n> (critical <n> · high <n> · medium <n> · low <n>)
NEEDS OWNER CHECK: <n>   REJECTED: <n>   HARDENING NOTES: <n>
FOR THE OWNER:
  - <one plain sentence per confirmed finding>
REPORT: docs/security/AUDIT-<date>.md
NEXT: SEC-<date> fix phase · <model> · <effort>
```

## Rules

- Source and existing tests only. Never call the deployed app, the production
  database or a provider API.
- No fixes during the audit. The fix phase runs afterwards, with a failing test first.
- A clean run with zero confirmed findings is a valid result. Never pad the list.
