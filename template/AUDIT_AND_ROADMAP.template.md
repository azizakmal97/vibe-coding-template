# [PROJECT NAME] — Architecture Audit & N-Month Roadmap

> Template. AI fills this in at project-maturity milestones via `/audit`.
> WHAT + WHY lives here. WHERE + HOW lives in `PROGRESS.md`.

**Date:** YYYY-MM-DD
**Reviewer:** [name / model]
**Subject:** [repo name]
**Live:** [URL or "not deployed yet"]
**Stack:** [from CLAUDE.md §2]
**Constraint:** [solo dev / team of N / production with users / pre-launch]

---

## Part 1 — Findings (Brutal Honest)

### 1.1 Architecture Score: _N / 10_

**Sound:**
- _list strengths backed by file references_

**Pulled down by:**
- _list structural debt; cite file:line_

**Comparison to industry norms:**
- _junior / mid / senior level + why_

### 1.2 Code Organization

**God files to split:**

| File | LOC | Concerns crammed in |
|---|---:|---|
| _path_ | _n_ | _list_ |

**Folder structure:** _logical / chaotic + missing dirs (`services/`, `middleware/`, etc.)_

### 1.3 Security

**Correct:**
- _what's already right (citing file:line)_

**Still vulnerable / fragile:**
- _open issues with severity (HIGH / MED / LOW)_

### 1.4 Database

**Schema soundness:** _good / weak + why_
**FK indexes:** _all present / missing N (list)_
**Migration safety:** _patterns observed_
**Biggest data-loss risk:** _CASCADE chains / unsafe DROPs / etc._

### 1.5 Maintainability

**New developer day-one quit risk:** _LOW / MED / HIGH_

3 highest-leverage changes:
1. _change + benefit_
2. _change + benefit_
3. _change + benefit_

### 1.6 Scalability

**Breaks at:**
- _N users / N requests / N rows_

To support next-tier scale:
- _list mitigations_

### 1.7 Specific Code Smells

| Smell | Location | Severity |
|---|---|---|
| _description_ | _path:line_ | HIGH/MED/LOW |

### 1.8 Final Verdict

_2-3 sentences. Asset vs liability. Compounding vs stable._

---

## Part 2 — Refactor Blueprint

### 2.1 File Split Targets

```
[show target directory structure with LOC budgets]
```

### 2.2 Service Layer Signatures

```ts
class FooService {
  constructor(private env: Env, private actorId: string) {}
  async doX(...): Promise<...>;
}
```

### 2.3 Middleware Additions

_list new middlewares (auth, rate-limit, error-handler, security-headers)_

### 2.4 Transaction Wrapper

```ts
async function withTx(env, fn) { ... }
```

---

## Part 3 — Security + DB Follow-Ups

### 3.1 Security
1. _action item_
2. _action item_

### 3.2 Database
1. _migration: NNNN_add_missing_fk_indexes.sql_
2. _retention strategy for unbounded tables_

---

## Part 4 — Testing From Zero (or N→N+1)

### 4.1 Framework Choice

| Layer | Tool |
|---|---|
| Backend | _Vitest + real DB binding_ |
| Frontend | _Vitest + Testing Library_ |
| E2E | _Playwright_ |

### 4.2 First 10 Tests (or next 10)

| # | File | Locks down |
|---|---|---|
| 1 | _path_ | _behavior_ |
| ... | ... | ... |

---

## Part 5 — N-Month Roadmap

### Month 1 — Foundations
| Week | Deliverable |
|---|---|
| 1 | _e.g. test harness + first 10 tests_ |
| 2 | _refactor target A_ |
| 3 | _refactor target B_ |
| 4 | _CI gate live_ |

### Month 2 — Decomposition
| Week | Deliverable |
|---|---|
| 5 | ... |

### Month 3 — Hardening
| Week | Deliverable |
|---|---|
| 9 | ... |

---

## Part 6 — AI-Collaboration Guardrails

### 6.1 New `.claude/rules/` Files
_list any project-specific rule files to add_

### 6.2 CLAUDE.md Additions
_list new sections beyond §§ 11-21_

### 6.3 Naming Conventions Locked
- DB columns: _convention_
- Roles / type unions: _convention_
- Route paths: _convention_
- Audit actions: _convention_

---

## Part 7 — Licensing + Distribution

Decision: _Proprietary / MIT / AGPL+Commercial / BSL / Elastic v2 / Deferred_

| License | Sell model | Tradeoff |
|---|---|---|
| Proprietary | Per-customer license | Max control; no community |
| MIT | None (free) | Zero leverage |
| AGPL + Commercial | Open source + paid commercial | Real revenue model |
| BSL | Restricted commercial, OSS after N years | Blocks direct competition |
| Elastic v2 | Free but no managed service | Stops cloud resellers |

---

## Part 8 — Verification Per Milestone

After each Month milestone:
1. Typecheck + build pass.
2. Tests green. Coverage report shows new routes covered.
3. File-size budget check passes (no hard breach).
4. Smoke test live URL.
5. Schema verification queries.
6. _project-specific checks_

---

## Part 9 — Storage Growth + Retention

| Table | Rows/yr | Bytes/row | Size/yr | At 5 yrs | At 30 yrs |
|---|---:|---:|---:|---:|---:|
| _name_ | _n_ | _n_ | _n MB_ | _n MB_ | _n GB_ |

**Free-tier risk:** _which limits get hit first + when_

**Retention strategy:**
- Year 1-4: no action
- Year 5+: archive to cold storage / cron prune
- Year 7+: hard delete per legal retention rule

---

## Part 10 — Methodology

Hybrid SDD + TDD + Characterization (see `rules/methodology.md`):

| Building | Layer |
|---|---|
| New API route | SDD (Zod contract) + TDD |
| New service | TDD |
| Refactor legacy | Characterization → move → re-run |
| Bug fix | TDD (failing test → fix → green) |

---

## Part 11+ — Project-Specific Findings

_Reserved for project-specific deep dives (e.g. one critical bug investigation, one domain quirk)._

---

## Part 12 — Plain-Language Handover Docs Index

| File | Audience |
|---|---|
| `docs/HANDOVER.md` | Non-coder owner |
| `docs/ARCHITECTURE_PLAIN.md` | Non-coder owner |
| `docs/FINDINGS_AND_PLAN_PLAIN.md` | Non-coder owner |
| `docs/LEARN_FULLSTACK.md` | Non-coder owner learning the stack |

Run `/handover` to regenerate these after major architecture changes.

---

## Part 13 — Phase Execution + Resume Protocol Cross-Reference

Operational details live in `PROGRESS.md`. This audit is the WHAT + WHY. PROGRESS.md is the WHERE + HOW.

- `CLAUDE.md` §13 — session-start protocol gate
- `PROGRESS.md` — resume instructions + per-edit discipline + phase log
- `git log` — commit hashes per phase
