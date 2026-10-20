---
name: security-audit
description: Full-repo security audit of this project's own code. Recon, coverage ledger, hunting, an independent verifier for every candidate, then a report plus a fix phase in PROGRESS.md. Use for /security-audit, an /autonomous audit phase, or when the owner asks for a security audit, pen test or security report. For a quick security question, answer it directly instead.
---

<!-- GENERATED from .claude/ by scripts/sync-zcode.mjs — DO NOT EDIT. Edit the .claude/ source and re-run. -->

# Security Audit

The method is adapted from Cloudflare's security-audit skill (MIT, see `NOTICE.md`),
trimmed for a solo-owner web app audited by Claude Code. The checklists are in
`CHECKLISTS.md`. The `security-auditor` agent does the hunting and the verifying.

The goal is a short list of findings the owner can trust. A single run with five
real findings beats a run with forty checklist items. Defense-in-depth advice is a
hardening note, never a finding.

## Modes

- **Guidance** (default): someone asks a security question. Answer it, write no files.
- **Full audit**: only on `/security-audit`, an `/autonomous` audit bullet, or an
  explicit request for an audit or security report. If unsure, ask one question
  (in `/autonomous`, choose full audit, because the plan already asked for it).

## Safety: source only, local only

- Read source. Run only what the project already runs: its own unit and integration
  tests, on their dummy data, plus typecheck and grep.
- Never send a request to a deployed URL, a production database, a provider API or
  another user. Never use a real credential. Never install or fetch a tool for the audit.
- Never edit application source during the audit. The audit writes the report and
  plans the fixes. Fixes happen afterwards, in their own phase, with tests.
- A fact that lives outside the repo (dashboard setting, secret value, WAF rule,
  provider config) is not proof either way. Make it `needs_validation` with an exact
  owner check, for example "Cloudflare dashboard → Workers → <name> → Settings →
  Variables: is `JWT_SECRET` set as a secret?"

## Profiles and budget

| Profile | When | Agents |
|---|---|---|
| `quick` | Default. Small app, or a re-audit after fixes | parent recon, 3 hunters, 1 verifier per candidate |
| `standard` | First audit of an app with logins plus money, health data or several users per workspace; or the owner asks | parent recon, 5-7 hunters, 1 critic pass, 1 verifier per candidate |

Models: parent, hunters, critic and verifiers run on **Opus 5.5 · high**. The
"obvious things" hunter is a literal checklist and may run on **Sonnet 5.5 · medium**.
State the profile and the agent count before Phase 2. When the budget runs out,
stop and record the run as `incomplete` with the uncovered ledger rows. Never present
a partial run as a clean one.

## Where output goes

- Private repo: `docs/security/` (committed, so the next run and the next machine see it).
- Public repo, or visibility unknown: `.security-audit/` (gitignored). Unfixed
  findings must never be published. Check with `gh repo view --json visibility`.
- Files: `AUDIT-<YYYY-MM-DD>.md` (the report) and `findings.json` (every record, all runs).

## Phase 0: Prior runs

Read `findings.json` and the latest report if they exist. For each prior record:
- `confirmed` and still present in source: carry it, do not hunt it again.
- `confirmed` and fixed: re-check the fix, then mark it `fixed` with the commit.
- `rejected`: do not raise it again unless the code around it changed.
- `needs_validation`: ask whether the owner answered (PROGRESS.md "Waiting on owner").

Prior runs exist to stop repeats. Do not use them as examples that steer the new hunt.
A single run finds roughly half of what repeated runs find, so re-audit after big changes.

## Phase 1: Recon (parent)

Read `graphify-out/GRAPH_REPORT.md` first if it exists, then the entry points. Write
the "System map" section of the report, at most about 600 words:

1. **Principals**: anonymous visitor, signed-in user, workspace member by role, owner or
   admin, API or personal token, webhook sender, cron, AI model or tool call.
2. **Entry surfaces**: every route (method + path + auth middleware), cron handlers,
   webhooks, queues, file uploads, imports, MCP or AI tools, and any public bucket.
3. **Assets**: money and balances, health or personal data, tokens and keys,
   sessions, other tenants' rows, paid API spend.
4. **Trust boundaries**: where identity is decided, where the tenant or workspace
   filter is applied, where input is validated, and what the next step assumes.

Then build the **coverage ledger**: one row per surface group × attack class from
`CHECKLISTS.md` that applies. Columns: `id`, surface, class, priority, status, evidence.

- Priority: unauthenticated surfaces first, then routes that touch the assets above,
  then code changed since the last audit.
- Status: `planned` → `covered` (reviewed paths listed) · `candidate` · `blocked`
  (reason) · `not_applicable` (reason). A row is never `covered` without the paths
  that were actually read.

## Phase 2: Hunt

Give each hunter (`security-auditor`, hunter mode) its ledger rows, the matching
`CHECKLISTS.md` sections and the system map. Hunters run in parallel and do not see
each other's results. Every hunter prompt carries the method and the candidate gate below.

**Method**
- Follow each input through parsing, identity, authorization, tenant scoping, storage
  and the final sink.
- Read the sibling paths that produce the same effect: batch, import, export, retry,
  legacy, the public API next to the app API, the MCP tool next to the route. Compare
  their controls for **equivalence**, not only for presence.
- Try the sad paths the interface accepts: missing, empty, zero, negative, huge,
  duplicate, stale, revoked, concurrent, out of order.
- Ask "what can the API do that the UI never does?"
- When a high-severity root cause appears, search the assigned rows for its variants.

**Candidate gate.** A candidate must name all six:
1. the lower-trust principal and what it starts with;
2. the input or action it sends;
3. the control that should stop it (file:line);
4. the boundary that is crossed;
5. the resource or other principal affected;
6. the result, which is what goes wrong and for whom.

A candidate also carries a full source trace (entry → sink, file:line per hop) and a
stable `fingerprint` (for example `authz:loans-delete-missing-workspace-filter`, with
no line numbers). Missing any part means it is not a candidate: drop it or file it as
a hardening note. A same-principal action (a user harming only their own data) is not
a boundary crossing.

**Output.** One JSON object per hunter: `{ "rows": [{ "id", "status", "reviewed_paths", "note" }], "candidates": [ ... ], "hardening": [ ... ] }`.
An empty `candidates` array is a good result.

**Critic pass** (`standard` only): one fresh agent reads the ledger and the system map
and looks for unmapped routes, sibling paths no one read, and rows marked `covered`
with thin evidence. Its new rows go to one more hunting wave.

## Phase 3: Verify every candidate

Each candidate goes to a fresh `security-auditor` in **verifier mode** that did not
hunt it. Verifiers do not see each other's work. The prompt starts with:

> You did not write this candidate. Try to refute it from the repository source.

The verifier re-reads every hop of the trace, looks for a control the hunter missed
(middleware mounted elsewhere, a DB constraint, a Zod `.strict()`, a later check),
and may write or run an existing-style unit test on dummy data to settle it. Then it
returns exactly one verdict:

- `confirmed`: the full trace holds and the result is shown by source plus, where
  possible, a local test. Only confirmed records get a severity.
- `needs_validation`: one specific fact outside the repo decides it. Name that fact
  and the exact owner check. **No severity.** This is never a parking place for a guess.
- `rejected`: the source refutes it, or there is no real impact. Keep it, with the
  reason, so later runs do not raise it again.

A verifier may rewrite the record. A severity change of two or more levels gets a
second fresh verifier.

## Severity (confirmed only)

- **critical**: an unauthenticated actor gets code execution, the whole data store, or
  takeover of any account.
- **high**: an explicit control is fully defeated with real consequences: auth bypass,
  cross-tenant or cross-member read or write, stored XSS against other users, moving
  or changing money or balances that are not yours, uncapped spend on the owner's bill.
- **medium**: a real boundary violation with a small blast radius or unusual preconditions.
- **low**: non-secret internals disclosed, or a lot of effort for little gain.
- **info**: a confirmed but minimal observation, mostly useful as a step in a chain.

Overall severity never exceeds the demonstrated impact. "Does it fully defeat a
control for an action with real consequences, or only weaken it?" If you cannot state
the concrete damage, the severity is lower than it feels.

## Finding record (`findings.json`)

```json
{
  "fingerprint": "authz:loans-delete-missing-workspace-filter",
  "verdict": "confirmed | needs_validation | rejected | fixed",
  "title": "Any member can delete another workspace's loan",
  "severity": "high",
  "ids": { "owasp": "A01", "api": "API1", "llm": null, "cwe": "CWE-639" },
  "principal": "...", "input": "...", "control": "file:line", "boundary": "...",
  "affected": "...", "result": "...",
  "trace": [{ "kind": "entry | hop | sink", "file": "apps/api/src/routes/loans.ts", "line": 88, "note": "..." }],
  "fix": { "invariant": "...", "change": "smallest source change at the last trusted check", "test": "regression test to add" },
  "owner_check": null,
  "first_seen": "YYYY-MM-DD", "last_checked": "YYYY-MM-DD", "fixed_in": null
}
```

Tag every record with IDs from the source standards, not from secondary lists:
- **OWASP Top 10:2025**: A01 Broken Access Control · A02 Security Misconfiguration ·
  A03 Software Supply Chain Failures · A04 Cryptographic Failures · A05 Injection ·
  A06 Insecure Design · A07 Authentication Failures · A08 Software or Data Integrity
  Failures · A09 Security Logging and Alerting Failures · A10 Mishandling of Exceptional Conditions.
- **OWASP API Top 10:2023** for HTTP APIs: API1 BOLA · API2 Broken Authentication ·
  API3 Broken Object Property Level Authorization · API4 Unrestricted Resource
  Consumption · API5 Broken Function Level Authorization · API6 Unrestricted Access to
  Sensitive Business Flows · API7 SSRF · API8 Security Misconfiguration · API9 Improper
  Inventory Management · API10 Unsafe Consumption of APIs.
- **OWASP LLM Top 10:2025** for AI features: LLM01 Prompt Injection · LLM02 Sensitive
  Information Disclosure · LLM05 Improper Output Handling · LLM06 Excessive Agency ·
  LLM07 System Prompt Leakage · LLM10 Unbounded Consumption (and the others where they fit).
- **CWE**: the most specific ID you can defend.

## Phase 4: Report

Write `AUDIT-<date>.md` from the verified records only, so prose and JSON never disagree:

1. **Verdict line**: profile, scope, commit, run status (`complete` / `incomplete: <reason>`),
   counts by verdict and severity.
2. **For the owner**: one plain sentence per confirmed finding, saying what could go
   wrong and for whom, in the owner's words. No jargon without an explanation.
3. **Confirmed findings**: highest severity first: record, trace, fix, test.
4. **Needs validation**: each with its exact owner check.
5. **Hardening notes**: short list, clearly labelled "not vulnerabilities".
6. **System map** and **coverage ledger** (every row and its status).
7. **Rejected this run**: one line each, with the reason.

## Phase 5: Plan the fixes (PROGRESS.md)

- Add a `⬜ SEC-<date> Security fixes` phase, ordered by severity. One bullet per
  confirmed finding: fingerprint, fix, regression test, and a model + effort tag. Auth,
  sessions, money, tenant isolation and patient data are **Opus 5.5 · high**. Other
  fixes are **Sonnet 5.5 · medium**. Each fix is a bug fix: failing test first, then the fix.
- A `critical` or `high` finding that is live in production goes to the top of the
  roadmap, ahead of feature work, and the owner hears about it in chat in plain words.
- Each `needs_validation` owner check goes on the phase's `Waiting on owner` line, as
  click-by-click steps.
- Commit the report, `findings.json` and the PROGRESS.md change together:
  `docs(security): audit <date>, N confirmed`.

## In `/autonomous`

Do not stop to ask. Choose the profile from the table above. Put owner checks under
`Waiting on owner`. Never apply a fix in the same run as the audit. The fix phase runs
afterwards, through the normal model gate. A fix that changes login or money stays
tagged `<requires user input>` (see `.claude/rules/production-readiness.md`).

## Anti-patterns

1. Checklist gaps or missing headers reported as vulnerabilities, with no principal and no result.
2. Guessing deployment, proxy or dashboard behaviour instead of writing an owner check.
3. Calling the live site, the production DB or a provider API to "confirm" something.
4. Treating a user's power over their own data as a boundary crossing.
5. A severity on `needs_validation`, or a severity larger than the shown impact.
6. A report written before verification, or prose that disagrees with `findings.json`.
7. Re-raising a rejected record without new code.
8. Fixing code during the audit.
