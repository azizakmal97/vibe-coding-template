# [PROJECT NAME] — Mobile App (Flutter)

> Preset: **mobile**. Stack pre-filled. Fill [BRACKETED] sections before first session.
> §§ 1–21 will be appended on final assembly. Keep this file under 300 lines.

## 1. What This Is

[One sentence: what does this app do and who uses it.]

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Flutter 3 (Dart 3) |
| State | Riverpod 2 (or Bloc — pick one, document) |
| Navigation | go_router |
| HTTP | dio + retrofit |
| Storage | Hive (local) + secure_storage (secrets) |
| Forms | flutter_form_builder + validation |
| Testing | flutter_test + integration_test + mockito |
| Lint | flutter_lints + custom analysis_options.yaml |
| Targets | iOS 14+, Android API 24+ |
| Backend | [your API URL] |
| Deployment | App Store + Google Play |

## 3. Commands

```bash
flutter pub get        # Install deps
flutter run            # Run on attached device / sim
flutter test           # Unit + widget tests
flutter test integration_test   # Integration tests
flutter analyze        # Static analysis (= lint)
flutter build apk      # Android release
flutter build ios      # iOS release (requires macOS)
```

## 4. Conventions

- File naming: snake_case.dart.
- Class naming: PascalCase.
- Const constructors wherever possible.
- No `dynamic` types; use proper generics.
- Widget split: > 200 LOC = extract. > 5 setState in one stateful widget = refactor to Riverpod.
- API models via freezed + json_serializable.

## 5. Testing

- Widget tests for every screen.
- Integration tests for login + 2 core flows.
- Mock HTTP via mockito.
- Golden tests for design-system-critical widgets.
- Min 70% line coverage (Flutter tooling reports it).

## 6. Design System

Tokens in `.claude/skills/design-system/SKILL.md`. For Flutter, also define `ThemeData` in `lib/theme/`. Never hardcode color values in widgets.

## 7. Architecture Decisions

- _e.g. "Riverpod over Bloc because the app state graph is shallow."_
- _e.g. "freezed for all DTOs to enforce immutability + auto-equality."_

## 8. Git Rules

- Fix mistakes with `git revert`.
- Never force push unless explicitly asked.

## 9. Off Limits

- [ ] _e.g. `lib/services/auth_service.dart` — frozen until security review._
- [ ] _e.g. `android/app/build.gradle` — coordinate before bumping versions._

## 10. Current Focus / Known Issues

[Active work + tricky bugs.]

---

## 11. Forbidden Patterns

- `dynamic` types — define proper generics.
- `print(...)` in production — use a logger.
- `setState` in build methods.
- Empty `catch(_) {}` — log + rethrow.
- Hardcoded API URLs — env-aware config only.
- Direct HTTP calls inside widgets — go through service.

## 12. File-Size Budgets

See `file-budgets.json`. Hard breach → split widget tree first.

## 13. Session-Start Resume Protocol

See `PROGRESS.md`. If `🟡 in-progress` phase exists → run `/resume` first.

## 14. When to Extract a Service / Provider

- Same dio call in 3+ widgets → service method.
- Mutation across multiple notifiers → orchestrator service.
- Business rule in > 1 place → extract.

## 15. When to Split a Widget

| Trigger | Threshold |
|---|---|
| File LOC | > 500 (screen) / > 300 (widget) |
| `setState` in StatefulWidget | > 5 |
| Nested levels in build() | > 4 |
| Concerns | > 3 |

Use `Consumer`/`HookConsumerWidget` to localise rebuilds.

## 16. Communication Style (caveman default)

caveman-lite default. Switch via `/caveman lite|full|ultra`.

## 17. Graph-First Exploration

If `graphify-out/GRAPH_REPORT.md` exists → read it FIRST.

## 18. Test-Before-Commit Gate

```bash
flutter analyze && flutter test && flutter build apk --debug && node scripts/check-file-sizes.mjs
```

All green or no commit. Use `/checkpoint`.

## 19. Pre-Edit Checklist for Files Over Soft Budget

Same as web preset; substitute Flutter rules + commands.

## 20. Hybrid SDD + TDD + Characterization

See `rules/methodology.md`. For Flutter: widget tests + integration tests instead of unit-only.

## 21. Document Roles

Same table as web preset. See AGENTS.md + PROGRESS.md.
