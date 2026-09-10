# `.zcode/` — running this project under ZCode

[ZCode](https://zcode.z.ai) is Z.AI's desktop coding agent for the GLM models. This
folder is the ZCode half of the Vibe Coding Template: the same rules, hooks,
subagents, commands and skills the project already gives Claude Code, expressed in
the layout ZCode looks for.

Everything here except `config.json` is **generated** from `.claude/`. Edit the
`.claude/` source and re-run:

```bash
node scripts/sync-zcode.mjs        # or: node scripts/sync-agent-rules.mjs (does both)
```

---

## Pick a mode first — they enforce very differently

ZCode can drive either its own agent or an external agent CLI, and that choice
decides how much of the safety net actually runs.

### Mode A — ZCode running Claude Code as the Agent CLI (full enforcement)

In the chat box, open the settings icon → **Agent CLI** → pick **Claude Code**.
ZCode becomes the front end; Claude Code is the engine, so the project's whole
`.claude/` layer applies unchanged: `settings.json` permissions, all nine hooks,
`CLAUDE.md` + `.claude/rules/*`, slash commands, subagents.

Same idea in a terminal, without the ZCode app: run the Claude Code CLI against
Z.AI's Anthropic-compatible endpoint. Z.AI ships an official wizard that wires this
up for you:

```bash
npm install -g @z_ai/coding-helper
chelper init      # interactive: pick plan, paste key, configure Claude Code
chelper doctor    # verify: plan configured, key valid, tool detected
```

Useful afterwards: `chelper enter claude-code` to reconfigure, `chelper auth reload claude`
to re-apply the plan config, `chelper auth revoke` to remove the key.

<details>
<summary>Or configure it by hand</summary>

```powershell
# Windows (PowerShell) — set once, per user
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_BASE_URL', 'https://api.z.ai/api/anthropic', 'User')
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_AUTH_TOKEN', '<your z.ai api key>', 'User')
```

```bash
# macOS / Linux
export ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic"
export ANTHROPIC_AUTH_TOKEN="<your z.ai api key>"
```

Then map the model slots to the GLM lineup in `~/.claude/settings.json`:

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.3",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.3",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.3-flash"
  }
}
```

</details>

Get the key from <https://z.ai/manage-apikey/apikey-list>. The coding endpoint is
for coding tools only — it is not interchangeable with the general API endpoint.

**This mode is the closest thing to "Claude Code, but on GLM." Prefer it when you
want the guardrails to actually fire.**

> **There is no official ZCode CLI.** Z.AI ships ZCode as a desktop app only — its
> install page lists nothing but `.dmg` / `.exe` / `.AppImage` / `.deb` / `.rpm`
> builds. `@z_ai/coding-helper` is official but is a *setup wizard* for other CLIs,
> not an agent you code with. A third-party npm package (`zcode-app-cli`) does put
> ZCode's agent in a terminal, and states plainly that it is unaffiliated with Z.AI
> and redistributes their proprietary runtime — judge that for yourself before giving
> it an API key. The supported terminal path is the one above.

> **Mode A costs you Claude Code's Remote Control.** Claude Code can be driven from
> a phone (`claude remote-control`, then claude.ai/code or the Claude mobile app) —
> but [its docs](https://code.claude.com/docs/en/remote-control) rule it out whenever
> `ANTHROPIC_BASE_URL` points at anything other than `api.anthropic.com`, which is
> exactly what pointing Claude Code at Z.AI does. It also needs a Pro/Max/Team
> subscription login rather than an API key, and is disabled by
> `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`. So: **to drive a GLM session from your
> phone, use the ZCode app's own Remote Control — Mode B, or Mode A inside the ZCode
> window.** A bare terminal on GLM is desk-only.

### Mode B — the native ZCode Agent (rules always, hooks via the plugin)

ZCode's own agent reads `AGENTS.md` at the project root on its own — no wiring, no
install. That covers the rules, the scope lock, the test-before-commit gate, the
model matrix. What it does *not* read is `CLAUDE.md`, `.claude/rules/*`, or any
`hooks` block in a workspace config. Install the plugin below to get the hooks.

---

## What ZCode reads from this folder

| Component | Path | Picked up how |
|---|---|---|
| Rules | `AGENTS.md` (project root) | Automatically, every session |
| Commands | `.zcode/commands/*.md` | Workspace commands + the plugin |
| Subagents | `.zcode/agents/*.md` | The plugin (or copy to `~/.zcode/agents/`) |
| Skills | `.zcode/skills/<name>/SKILL.md` | Workspace skills + the plugin |
| Hooks | `.zcode/hooks/hooks.json` | **Plugin only** — see below |
| MCP servers | `.zcode/config.json` → `mcp.servers` | Automatically, per workspace |

`config.json` is the one file here you edit by hand. It is a normal ZCode workspace
config; add MCP servers under `mcp.servers`. Putting a `hooks` block in it does
nothing — ZCode ignores workspace hook config as a whole, for security.

---

## Installing the hooks (Mode B)

`.zcode/` doubles as a ZCode plugin, which is the supported way to give a *project*
its own hooks. One-time setup per machine:

1. ZCode → **Settings → Plugins → Create → Add marketplace**.
2. Point it at this folder: `<project-root>/.zcode`.
3. Install **vibe-coding-template** from the **Personal** section.
4. Start a new session — plugins and subagents do not hot-reload.

The hooks then run the same nine scripts Claude Code uses, through
`hooks/zcode-hook.mjs`. That adapter exists because the two agents differ in three
ways: ZCode locates the project from the hook payload rather than the config file,
reads stdout only when it is JSON, and does not guarantee the same tool-input keys.
The adapter absorbs all three, so `.claude/hooks/*` stays agent-agnostic — one set of
scripts, one behaviour, two agents.

Machine-wide alternative: `node global-setup/zcode/install-zcode.mjs` from the
template repo registers the same adapter in `~/.zcode/cli/config.json`, so every
project on the machine gets the guardrails without a per-project plugin install.

### Verify it actually fired

Do not assume. In a ZCode session, ask the agent to run a command the guard blocks:

```
run: echo "DROP TABLE probe_table"
```

A working hook returns `🛑 BLOCKED: DROP TABLE blocked — write a migration file instead`.
Nothing at all means the hooks are not wired — recheck the plugin install, and see
the caveat below.

> **Why `echo` and not a real `psql`?** The guard matches the command *string*, so
> the wrapped form trips exactly the same rule — but if the hook turns out to be
> dead, all that runs is `echo`, which prints the text and touches nothing. Never
> probe a destructive-command guard with an actually destructive command: the case
> you are testing for is the one where nothing stops it.

---

## Known caveats — read before you trust the net

- **Workspace hook config is ignored.** ZCode drops any `hooks` block in
  `<workspace>/.zcode/config.json` or `<workspace>/zcode.json` regardless of
  `hooks.enabled`. Hooks must come from `~/.zcode/cli/config.json` or a plugin.
- **ZCode's own `matcher` cannot be trusted — this template does not use it.**
  Its docs say a `|`-joined list of bare names is an exact name-list match, but on
  v3.11.x a hook registered as `Bash|Shell|Terminal|RunCommand` never fired for a
  `Bash` tool call, while the identical hook with a blank matcher fired every time
  (confirmed by logging the raw payload). So every generated entry registers with
  **no matcher** and passes `--tools` to the adapter, which filters on `tool_name`
  itself. If you add a hook by hand through Settings -> Hooks, leave Matcher blank
  for the same reason.
- **Hooks do fire otherwise.** [zai-org/feedback#32](https://github.com/zai-org/feedback/issues/32)
  reported hooks never running for the native agent; on v3.11.x that is not what
  happens — SessionStart, UserPromptSubmit, PreToolUse and PostToolUse all fire, and
  the payload carries `tool_name`, `tool_input.command` and `cwd` exactly as the
  adapter expects. Verify on your own build rather than trusting either report.
- **No allow / deny permission list.** ZCode has four confirmation modes
  (Ask before changes / Edit automatically / Plan / Full access, cycled with
  `Shift + Tab`) but no equivalent of `.claude/settings.json` → `permissions`. The
  secret-file and destructive-command blocks come from the hooks, not from a
  deny-list — one more reason to confirm the hooks fired.
- **No nested rule merge.** ZCode reads `~/.zcode/AGENTS.md` and the workspace
  `AGENTS.md`, and does not walk child directories. Keep project rules in the root
  `AGENTS.md`; do not split them into subdirectory files and expect them to load.
- **CI does not care which agent you used.** `.github/workflows/` re-checks lint,
  types, tests, build and file-size budgets on every push. That gate holds even when
  every local hook is off.

---

## Regenerating

| You changed | Run |
|---|---|
| `AGENTS.md` | `node scripts/sync-agent-rules.mjs` |
| `.claude/commands/`, `.claude/agents/`, `.claude/skills/` | `node scripts/sync-zcode.mjs` |
| `.claude/settings.json` hooks | `node scripts/sync-zcode.mjs`, then restart ZCode |

`sync-agent-rules.mjs` calls `sync-zcode.mjs` for you, so running the first is always
enough.
