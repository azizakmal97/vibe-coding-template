---
paths:
  - "**/*"
---

# Naming Conventions

Lock these on day 1. Drift = inconsistency = onboarding pain.

## Fill Per Project

Edit the values below to match this project's conventions. Once set, NEVER drift.

### Database

| Thing | Convention | This project's choice |
|---|---|---|
| Column names | snake_case / camelCase | _e.g. snake_case_ |
| Table names | snake_case plural | _e.g. snake_case_plural_ |
| Index names | `idx_<table>_<col>` | _e.g. idx_users_email_ |
| FK names | `fk_<table>_<ref_table>` | _e.g. fk_orders_user_id_ |
| Migration files | `NNNN_descriptive_name.sql` | _e.g. 0001_create_users.sql_ |

### TypeScript / JavaScript

| Thing | Convention | This project's choice |
|---|---|---|
| Files | PascalCase for components, camelCase for utilities | _e.g. `UserCard.tsx`, `formatDate.ts`_ |
| Components | PascalCase | _e.g. `InvoiceList`_ |
| Hooks | `use` + PascalCase | _e.g. `useInvoices`_ |
| Services | `<Domain>Service` | _e.g. `InvoiceService`_ |
| Routes (REST) | lowercase plural, kebab-case | _e.g. `/api/user-profiles`_ |
| Route params | camelCase | _e.g. `/api/invoices/:invoiceId`_ |
| Type unions | UPPER_SNAKE or PascalCase string literal | _e.g. `'DRAFT' \| 'SENT' \| 'PAID'`_ |
| Audit action names | SCREAMING_SNAKE verb-first | _e.g. `CREATE_INVOICE`, `UPDATE_USER`_ |

### Flutter (mobile preset)

| Thing | Convention | This project's choice |
|---|---|---|
| Files | snake_case.dart | _e.g. `invoice_list_screen.dart`_ |
| Classes | PascalCase | _e.g. `InvoiceListScreen`_ |
| Widgets | PascalCase ending in `Screen` / `Card` / `Button` | _e.g. `LoginScreen`_ |
| Providers (Riverpod) | camelCase + `Provider` | _e.g. `invoicesProvider`_ |

### Rust (desktop preset)

| Thing | Convention | This project's choice |
|---|---|---|
| Files | snake_case.rs | _e.g. `invoice_commands.rs`_ |
| Functions | snake_case | _e.g. `create_invoice`_ |
| Types | PascalCase | _e.g. `InvoiceState`_ |
| Tauri commands | snake_case (matches Rust fn) | _e.g. `#[tauri::command] fn create_invoice(...)`_ |

### Tests

| Thing | Convention | This project's choice |
|---|---|---|
| Test files | `<source>.test.ts` co-located OR `__tests__/<source>.test.ts` | _e.g. co-located_ |
| Test names | `<verb> <expected behavior>` | _e.g. `'creates invoice with DRAFT status'`_ |
| Characterization tests | `<source>-characterization.test.ts` | _e.g. `invoices-create-characterization.test.ts`_ |

### Commits

| Type | When to use |
|---|---|
| `feat` | New user-facing capability |
| `fix` | Bug fix |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding / updating tests |
| `docs` | Documentation only |
| `chore` | Tooling, deps, config |
| `wip` | In-progress save (phase active in PROGRESS.md) |
| `done` | Phase completion |

Format: `<type>(<scope>): <imperative verb> <what>` (≤ 50 chars).

Examples:
- `feat(invoices): add PDF export endpoint`
- `fix(auth): redirect to login when session expires`
- `wip(M1-W2-P03): extract InvoiceService.create`
- `done(M1-W2-P03): extracted InvoiceService + tests`

## Enforcement

These conventions are NOT enforced by hooks (too many edge cases). They are enforced by:
1. AI agents reading this file before naming anything.
2. `code-reviewer` agent flagging violations in PR review.
3. `pr-review` slash command checking commit message format.

If you discover a drift, fix in the next refactor commit. Don't let it spread.
