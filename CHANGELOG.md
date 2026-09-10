# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and this project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- **Three rules earned from a live incident**, where a scheduling feature lost a
  user's work twice in one afternoon and a full green test suite reported nothing.
  - `rules/testing.md` — **a green gate proves it compiles, not that it renders.**
    For any change a user looks at, open the page and read it. Lists three real
    defects that passed every assertion and were obvious in one look: a list
    clipping at 6 of 31 rows with no scroll affordance, an editor resolving
    against the stored document while the engine used defaults, a card losing
    its top padding on desktop only.
  - `rules/testing.md` — **when an existing test contradicts your new rule, read
    it first.** Tests routinely encode a workflow nobody wrote down: the order
    steps happen in, the intermediate state allowed to be wrong because a later
    step fixes it. The recurring shape is a new guard that refuses something
    invalid at that instant and breaks a flow where the next step resolved it —
    usually the real defect was that nobody was TOLD, not that the state could
    exist. Prefer reporting to forbidding.
  - `rules/refactor.md` — **a warning must count exactly what the action
    destroys.** A confirmation that enumerates live states (`status IN
    ('pending','accepted')`) while the action takes everything will miss the next
    status someone adds; the user is told "0 will be removed" and seven are.
    Invert the predicate: subtract the terminal states.
- **ZCode support — the same rules and the same hooks, on Z.AI's GLM agent.**
  Previously the only agent with automated local enforcement was Claude Code;
  every other tool got the rules as guidance. ZCode now gets both, and shares one
  set of hook scripts with Claude Code rather than a parallel copy that drifts.
  - `template/.zcode/` is the ZCode half of a project: `commands/`, `agents/`,
    `skills/` and `hooks/hooks.json`, all generated from `.claude/`, plus a
    `.zcode-plugin/` manifest and `marketplace.json` so the directory installs as
    a ZCode plugin. `config.json` (MCP servers) is the only hand-edited file.
  - `zcode-hook.mjs` is the adapter that lets both agents run one set of hook
    scripts. It resolves the project from the hook payload (ZCode ignores
    workspace hook config, so the registration cannot carry the path), wraps
    plain-text hook stdout in the `hookSpecificOutput.additionalContext` shape
    ZCode requires, and normalises tool-input keys before handing the payload to
    the unmodified `.claude/hooks/*` script.
  - `scripts/sync-zcode.mjs` regenerates all of the above from `.claude/`,
    including deriving `hooks.json` from `.claude/settings.json` so the two hook
    lists cannot diverge. `sync-agent-rules.mjs` calls it, so one command still
    covers every agent.
  - `global-setup/zcode/install-zcode.mjs` does the machine-wide half: composes
    `~/.zcode/AGENTS.md` from `global-setup/CLAUDE.md` + a ZCode addendum (one
    source, no duplicated brain), installs the adapter, and merges the hook
    registrations into `~/.zcode/cli/config.json` while preserving every other
    key. `setup.ps1` gained `-Agent claude|zcode|both`.
  - Docs: `template/.zcode/README.md` covers both ways to run ZCode — with Claude
    Code as its Agent CLI (full enforcement) or as the native agent (rules always,
    hooks via the plugin) — the GLM Coding Plan env vars, and the caveats worth
    knowing before trusting the net: workspace hook config is ignored by design,
    there is no permission deny-list, and hooks have been reported not to fire for
    the native agent on some versions. Every path ends in the same instruction:
    run the `DROP TABLE` probe and confirm it blocks.
  - `AGENTS.md` gained GLM rows in the model matrix, with an explicit note that
    substituting GLM for an Opus-assigned row is a trade to declare, not a free
    swap.
  - The terminal path now uses Z.AI's official `@z_ai/coding-helper` wizard
    (`chelper init`) instead of hand-set environment variables, with the manual
    form kept as a fallback. The docs also record what the search cost to
    establish: **there is no official ZCode agent CLI** — ZCode ships as a
    desktop app, `chelper` configures *other* CLIs rather than being one, and the
    third-party `zcode-app-cli` states outright that it is unaffiliated with Z.AI
    and redistributes their proprietary runtime.

### Changed
- **The repo's own instructions moved to `AGENTS.md`**, with `CLAUDE.md` reduced to
  a pointer plus Claude-only notes. Claude Code auto-loads one file and ZCode the
  other; keeping the content in a single file is the same discipline the template
  asks projects to follow.
- **`global-setup/CLAUDE.md` picked up the reasoning-effort axis** it had drifted
  behind on. Re-running `setup.ps1` would otherwise have overwritten a newer
  `~/.claude/CLAUDE.md` with the older rules.

### Fixed
- **Auto-push silently never fired on the two most common commit forms.** The
  hook matched only a standalone `git commit ...`, so `git add . && git commit`
  — the form the docs themselves teach — was ignored; and it confirmed success
  by regexing stdout for markers that `git commit -q` suppresses. Commit
  detection is now the ahead-of-upstream count. Applies to both the project hook
  and the global one installed by `setup.ps1`.
- **The knowledge graph never generated.** `graphify generate` is not a real
  command, and the CLI exits 0 while printing `unknown command`, so the bootstrap
  reported "Done. Output is an Obsidian vault" over an empty directory. Replaced
  with `scripts/graphify-rebuild.py`, a scoped rebuild that skips `node_modules/`
  and `dist/` (the library's own file collector does not, which costs ~13 minutes
  of pinned CPU) and keeps the `__main__` guard that stops Windows worker
  processes from re-running the whole rebuild and producing a partial graph.
  Success is now verified by checking the report was rewritten. The Obsidian
  vault the README promises is actually written for the first time.
- **Three hooks crashed in any ESM project.** `config-protection`,
  `post-edit-check` and `pre-db-migrate` are CommonJS but shipped as `.js`; the
  web and fullstack presets scaffold Vite, which sets `"type": "module"`, so all
  three threw `require is not defined`. Renamed to `.cjs`.
- **Seven files were in neither setup map**, including two hooks that
  `settings.json` references — a fresh project got hooks pointing at files that
  were never copied. Both maps now cover every file under `.claude/`, `scripts/`
  and `memory/`.
- **The file-size budget checker skipped top-level files.** `**/` compiled to a
  pattern that required a slash, so `src/**/*.ts` never matched `src/a.ts`. The
  gate looked green because it was not looking. The glob placeholders were also
  raw NUL bytes, which made git treat the script as binary.
- **A soft budget warning failed CI.** All four workflows invoked the checker
  bare, so exit 1 (warn, tolerate) blocked the PR just like exit 2 (hard breach).
- **`npx tsc --noEmit` checks nothing** under a solution-style `tsconfig.json`.
  CI now prefers the project's own `typecheck` script.
- **The generated agent shims had drifted.** `.cursorrules`, `.windsurfrules`,
  `.cursor/rules/project.mdc` and `.github/copilot-instructions.md` were 79 lines
  against `AGENTS.md`'s 140 — the missing section was the whole model-routing
  doctrine, so Cursor, Windsurf and Copilot users never received it.
- `rules/frontend.md` mandated `next/image` for the Vite-based web preset, where
  it does not exist.

### Added
- **Security Scan workflow** with three blocking gates, each with a reviewable
  suppression list: a dependency gate (`scripts/audit-gate.mjs` +
  `.audit-accepted.json`, failing on any advisory not accepted and on any
  acceptance past its review date), Semgrep at ERROR severity, and Gitleaks over
  full history with `GITLEAKS_VERSION` pinned — versions below 8.25 silently
  ignore top-level allowlists. The dependency job skips itself on non-npm
  projects. The governing idea: a permanently-red gate is worse than no gate.
- **Capture & recall doctrine** — `rules/memory.md`, a seeded `memory/MEMORY.md`,
  and `AGENTS.md` rule 13. Write symptom / root cause / fix / how-to-apply the
  same turn you solve it, and only what you verified.
- **`AGENTS.md` rule 12 — a push is not a deploy.** Work is not live until the
  CI run is green; watch it and distinguish a failed build from a failed deploy.
- `rules/simplicity.md` gains the half of the quality charter it lacked:
  correctness with no silent failure, secured-by-default, and leave-it-cleaner.

### Changed
- **Model lineup refreshed to the Claude 5 family** (Opus 5 / Sonnet 5; Haiku 4.5
  unchanged), with model ids spelled out and a "last reviewed" date. The repo had
  disagreed with itself — `AGENTS.md` said Opus 4.7 while the two brains said 4.8.
- `actions/checkout`, `setup-node` and `upload-artifact` pins bumped v5 → v7
  across all four preset workflows.

---

_Earlier unreleased work, from the previous cycle:_


### Added
- **Mandatory browser verification for UI work.** New non-negotiable rule
  (`AGENTS.md` #5, mirrored to all agent shims): any frontend change or component
  refactor MUST be verified with a Playwright **e2e smoke** (renders + zero uncaught
  page errors) — typecheck + build prove it compiles, not that it renders — plus a
  **flow test** where the page carries real logic. Agents run the e2e themselves;
  deferring UI verification to the human is now a forbidden anti-pattern
  (`rules/refactor.md`).
- `rules/testing.md` gains an "E2E Smoke + Flow" section (pattern + gotchas:
  fixture ids must satisfy API guards; use `toHaveValue` not `getByDisplayValue`),
  and the e2e scaffold's `example.spec.ts` now demonstrates the `pageerror` guard.
- **CI-minute discipline for autonomous loops.** `wip(...)`/`pause(...)` commits
  now append ` [skip ci]` (in `/checkpoint`, `/autonomous`, `rules/token-budget.md`):
  every commit still auto-pushes (death defense intact) but burns zero Actions
  minutes — a whole phase costs ONE CI run (the `done` commit). Private repos get
  only 2,000 free minutes/month; per-edit auto-push could burn that mid-cycle.
  Gotcha covered: a docs-only `done` commit is also skipped by `paths-ignore`, so
  the commands instruct the agent to verify a run exists and `gh workflow run`
  manually when it doesn't.

### Changed
- **All preset CI workflows hardened** (`ci-web/fullstack/flutter/tauri.yml`):
  cancel-in-progress concurrency (rapid pushes cancel stale runs), `paths-ignore`
  so docs-only pushes skip CI, `workflow_dispatch` for manual runs, and
  least-privilege `permissions: contents: read`.
- **Every action SHA-pinned** with a `# vX.Y.Z` comment (mutable `@vN` tags can be
  repointed — the 2025 tj-actions supply-chain attack class). `dtolnay/rust-toolchain`
  gets an explicit `with: toolchain: stable` (a SHA ref no longer selects the
  channel). The repo's own `demo.yml` is pinned too, including the
  write-permission `git-auto-commit-action`.

## [1.0.0] - 2026-05-25

First public release.

### Added
- **Cross-agent rule system.** `AGENTS.md` is the single source of truth;
  `scripts/sync-agent-rules.mjs` generates the per-tool shims for Cursor
  (`.cursorrules`, `.cursor/rules/project.mdc`), Windsurf (`.windsurfrules`),
  and GitHub Copilot (`.github/copilot-instructions.md`).
- **Claude Code enforcement.** Permission allow/deny-list plus hooks that block
  destructive commands (`rm -rf`, `DROP TABLE`, `DELETE` without `WHERE`) and
  reading/printing secret files, warn on risky migrations, enforce file-size
  budgets, and auto-push every commit.
- **Death-defense workflow.** Per-edit commits, auto-push, and a session-resume
  protocol so a crashed/rate-limited session loses ~nothing. Slash commands:
  `/resume`, `/checkpoint`, `/next-phase`, `/autonomous`, `/check-ci`, and more.
- **Presets.** `web`, `fullstack`, `mobile`, `desktop` — each ships its own
  `CLAUDE.md`, `commands.json`, `file-budgets.json`, and CI workflow.
- **Playwright E2E scaffold** (web/fullstack) with a programmatic-auth
  `storageState` pattern and an auto-skipping CI job.
- **Test-before-commit gate** (typecheck + build + test + file-size), enforced
  in CI on every push regardless of which agent made the edit.
- **Knowledge-graph integration** (graphify) and token-budget rules for
  efficient, long-running sessions.
- **Plain-language docs templates** for non-coder project maintainers.
- **Cross-OS setup** via `setup.sh` and `setup.ps1`.
- **Reproducible demo GIF** rendered in CI with VHS.

### Notes
- Local automated enforcement (hooks + permission deny-list) is **Claude Code
  only**. Every other agent receives the rules as guidance and relies on the CI
  gate, which re-checks everything on push.

[1.0.0]: https://github.com/azizakmal97/vibe-coding-template/releases/tag/v1.0.0
