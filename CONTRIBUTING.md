# Contributing

Thanks for helping improve this template. It exists to make AI-assisted coding
safer and more consistent for everyone, so contributions that strengthen the
guardrails — or extend them to more agents, languages, and platforms — are very
welcome.

## Ground rules

- **`AGENTS.md` is the single source of truth for rules.** Never hand-edit the
  generated shims (`.cursorrules`, `.cursor/rules/project.mdc`, `.windsurfrules`,
  `.github/copilot-instructions.md`). Edit `AGENTS.md`, then run:
  ```bash
  node template/scripts/sync-agent-rules.mjs
  ```
  Commit the regenerated shims together with the `AGENTS.md` change.

- **New files must be wired into BOTH setup scripts.** If you add a file to the
  template payload, register it in `template/setup.sh` *and* `template/setup.ps1`
  (and `template/scripts/pick-preset.mjs` if it's preset-specific) so it actually
  lands in a new project. Test on both a bash and a PowerShell shell if you can.

- **Keep it cross-platform.** Hooks and scripts are Node (cross-OS). Avoid
  bash-only constructs in `.mjs`. New shell logic needs both a `.sh` and a `.ps1`
  path.

- **Keep it model-agnostic where possible.** Prose rules live in `AGENTS.md` so
  every agent benefits. Claude-Code-only enforcement (hooks, permission deny-list)
  is a bonus layer, not the only layer — don't make a rule *depend* on a hook.

## How to test a change

From a throwaway empty folder:

```bash
bash /path/to/repo/template/setup.sh web      # or: pwsh .../setup.ps1 web
```

Then confirm the expected files landed and `node scripts/check-file-sizes.mjs`
and `node scripts/sync-agent-rules.mjs` run without error.

## PRs

- One logical change per PR. Conventional commit titles (`feat:`, `fix:`,
  `docs:`, `chore:`).
- Describe *why*, not just *what*.
- If you change a rule, say which real-world failure it prevents.

## Ideas that would help the community

- A tool-agnostic pre-commit gate (husky / lefthook) so non-Claude agents get
  local enforcement too.
- More presets (Go, Python/FastAPI, SvelteKit, Expo).
- A `.mdc` rule split for Cursor (per-domain rules instead of one big file).
- Translations of the plain-language `docs/` templates.
