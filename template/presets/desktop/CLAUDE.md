# [PROJECT NAME] — Desktop App (Tauri 2)

> Preset: **desktop**. Stack pre-filled. Fill [BRACKETED] sections before first session.
> §§ 1–21 will be appended on final assembly. Keep this file under 300 lines.

## 1. What This Is

[One sentence: what does this app do and who uses it.]

## 2. Stack

| Layer | Choice |
|---|---|
| Shell | Tauri 2 (Rust backend, webview frontend) |
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Rust toolchain | stable + clippy + rustfmt |
| IPC | Tauri commands (typed via specta or manual TS gen) |
| State | Zustand (frontend) + Rust state mgmt |
| Storage | tauri-plugin-store + sqlite via rusqlite |
| Testing | Vitest (frontend) + cargo test (Rust) + Playwright (E2E) |
| Targets | Windows 10+, macOS 11+, Linux (x86_64 + arm64) |
| Code signing | [Apple Developer + Windows EV cert] |
| Updates | tauri-plugin-updater |

## 3. Commands

```bash
npm install            # Frontend deps
npm run tauri:dev      # Run dev (hot-reload both Rust + frontend)
npm run tauri:build    # Production build for current platform
npm test               # Vitest (frontend)
cargo test             # Rust tests (run from src-tauri/)
npm run lint           # ESLint
cargo clippy           # Rust lint
npx tsc --noEmit       # Frontend typecheck
```

## 4. Conventions

- Frontend: see web preset conventions.
- Rust: snake_case files, PascalCase types, `?` operator over panic.
- Tauri commands: `#[tauri::command]` annotated, all params + return types serializable.
- TS bindings for Tauri commands: auto-gen via specta OR hand-maintain in `src/types/ipc.ts`.
- Never expose filesystem / shell APIs to frontend without explicit allowlist in `tauri.conf.json`.

## 5. Testing

- Frontend: unit (Vitest) + component (Testing Library).
- Rust: unit `#[cfg(test)] mod tests`.
- E2E: Playwright targets dev server OR built app via tauri-driver.
- Security: review `tauri.conf.json` allowlist on every release.

## 6. Design System

Tokens in `.claude/skills/design-system/SKILL.md`. Tauri uses webview = standard React + Tailwind tokens apply. Native menus / system tray styles set in Rust.

## 7. Architecture Decisions

- _e.g. "All cross-process state via Tauri events, not shared memory."_
- _e.g. "Local SQLite for offline-first; sync to cloud on reconnect."_
- _e.g. "Frontend cannot access fs/shell — all native ops go through #[tauri::command]."_

## 8. Git Rules

- Fix mistakes with `git revert`.
- Never force push.
- Tag releases for code signing.

## 9. Off Limits

- [ ] `tauri.conf.json` allowlist — security review required.
- [ ] Code-signing certs — never commit, store in secure vault.

## 10. Current Focus / Known Issues

[Active work.]

---

## 11. Forbidden Patterns

Frontend: same as web preset.
Rust:
- `unwrap()` outside tests — use `?` or explicit handle.
- `panic!` in user-flow paths.
- Wildcard imports `use foo::*` outside preludes.
- Exposing fs/shell to frontend without explicit allowlist.

## 12. File-Size Budgets

See `file-budgets.json`. Pages 400 / components 300 / Rust files 600.

## 13. Session-Start Resume Protocol

See `PROGRESS.md`. If `🟡 in-progress` → `/resume`.

## 14. When to Extract a Service (Frontend) / Module (Rust)

Same triggers as web preset. Rust: extract module when single `lib.rs`/file > 500 LOC.

## 15. When to Split a Component

Same as web preset.

## 16. Communication Style

caveman-lite default.

## 17. Graph-First Exploration

graphify supports both TS and Rust. Read graph first.

## 18. Test-Before-Commit Gate

```bash
npx tsc --noEmit && npm test -- --run && cd src-tauri && cargo clippy -- -D warnings && cargo test && cd .. && node scripts/check-file-sizes.mjs
```

## 19. Pre-Edit Checklist for Files Over Soft Budget

Same protocol; both TS + Rust files.

## 20. Hybrid SDD + TDD + Characterization

See `rules/methodology.md`. For Tauri IPC: contract test that frontend type ↔ Rust struct stays in sync.

## 21. Document Roles

Same as web preset.
