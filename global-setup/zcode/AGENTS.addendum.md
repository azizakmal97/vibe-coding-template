---

# ZCode Addendum — how the rules above map onto this agent

Everything above is written for a Claude Code session. The rules are unchanged here;
only the file names and the enforcement story differ. Read this once, then apply the
rules above as written.

## Where things live

| Concept | Claude Code | ZCode |
|---|---|---|
| Global rules | `~/.claude/CLAUDE.md` | `~/.zcode/AGENTS.md` (this file) |
| Project rules | `<project>/CLAUDE.md` + `.claude/rules/*` | `<project>/AGENTS.md` |
| Project hooks | `.claude/settings.json` | `<project>/.zcode/` installed as a plugin |
| Global hooks | `~/.claude/settings.json` | `~/.zcode/cli/config.json` |
| Commands | `.claude/commands/` | `<project>/.zcode/commands/` |
| Subagents | `.claude/agents/` | `<project>/.zcode/agents/`, `@name` to call one |
| Skills | `.claude/skills/` | `<project>/.zcode/skills/`, `$name` to call one |
| MCP servers | `.mcp.json` / settings | `<project>/.zcode/config.json` → `mcp.servers` |

ZCode does **not** read `CLAUDE.md` after onboarding, and does **not** merge
`AGENTS.md` files from subdirectories. When a project rule matters, it belongs in the
project's root `AGENTS.md`. `.claude/rules/*.md` still exist on disk — read them with
the file tools when a rule points at one; they are just not auto-loaded.

## Enforcement is weaker here — behave accordingly

Claude Code blocks destructive work with a permission deny-list *and* hooks. ZCode
has no deny-list, only hooks, and only when they are installed. So:

- **Do not rely on being stopped.** Check a command against the project's forbidden
  list yourself before running it. The net may not be there.
- **Never read or print a secret file** (`.env`, `.dev.vars`, `*.pem/*.key/*.p12`,
  `secrets/`). Under Claude Code a deny-list also blocks this. Here, nothing might.
- **Confirm before anything irreversible** — destructive SQL, `rm -rf`, force push,
  a migration against a non-local database — even when the current confirmation mode
  would let it through.
- **CI is the gate that always runs.** `.github/workflows/` re-checks lint, types,
  tests, build and file-size budgets on every push regardless of agent. Green CI, not
  a quiet local run, is what "done" means.

## Models

The lineup above names Anthropic, DeepSeek and Google models. On a GLM Coding Plan
the working equivalents are:

| Slot | GLM model | Use for |
|---|---|---|
| Flagship / heavy reasoning | **GLM-5.3** at thinking effort `high` or `max` | Architecture, hard debugging, security review, cross-cutting refactors |
| Workhorse | **GLM-5.3** at thinking effort `low` | Normal feature work and edits |
| Small / mechanical | **GLM-5.3-Flash** | Status checks, log reads, build runs, single-line edits |

Thinking effort is set per model in Settings → Model Providers → Advanced. Declaring
the model and effort at the start of every task (Rule 1 above) applies unchanged —
name the GLM slot and the effort instead of the Claude one.

For work the rules above assign to Opus specifically because being wrong is expensive
— auth, money, patient-data correctness, brand voice — prefer switching the Agent CLI
to Claude Code on an Anthropic key rather than substituting a GLM model silently. If
that is not available, say so in the plan instead of pretending the assignment was met.

Running Claude Code on the GLM plan from a terminal: `npm i -g @z_ai/coding-helper`,
then `chelper init`. That is Z.AI's official wizard; there is no official ZCode agent
CLI, so don't go looking for one.

## Verifying the guardrails before you trust them

Reported behaviour differs by ZCode version: hooks registered in
`~/.zcode/cli/config.json` have been reported not to fire for the native ZCode Agent
while working normally for external agent CLIs
([zai-org/feedback#32](https://github.com/zai-org/feedback/issues/32)). At the start of
a session in a guarded project, confirm rather than assume — running

```
psql -c "DROP TABLE users"
```

should come back `🛑 BLOCKED`. If it does not, tell the user the local safety net is
off in this session and fall back to checking commands by hand.
