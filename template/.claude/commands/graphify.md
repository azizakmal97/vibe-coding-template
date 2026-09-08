---
description: Generate or update the codebase knowledge graph. Cuts exploration tokens by 60-80%.
---

# /graphify

Wrap the graphify skill. Run on initial project setup AND after every structural change (file add / rename / move / delete).

## Steps

1. Check for `graphify-out/GRAPH_REPORT.md`.
   - Exists + < 7 days old + no structural changes since → skip, report freshness.
   - Else → continue.
2. Run: `node scripts/graphify-bootstrap.mjs` (requires `pip install graphifyy`; it does not install for you).
3. If that reports the package is missing, install it and re-run. Do NOT try `graphify generate ...` —
   the CLI has no `generate` command and exits 0 while printing "unknown command", so it looks like it worked.
4. After generation, read `graphify-out/GRAPH_REPORT.md` header — report node count, edge count, community count to user.
5. Suggest: "use the `graph-navigator` agent for file-lookup tasks from here on; cuts exploration tokens ~60%."
6. Tell the user the output is an **Obsidian vault**: "open the `graphify-out/obsidian/` folder as a vault in Obsidian (`Open folder as vault`) to explore the codebase graph visually in Graph View."

## When to Auto-Trigger

- First Claude session in a project (setup script should have run this; verify).
- After any commit that adds/removes/renames ≥ 5 source files.
- After a refactor phase completes.

## Token Hygiene

If graph exists, the agent SHOULD prefer `Read graphify-out/GRAPH_REPORT.md` over `Glob`/`Grep` for "where is X" questions. Only fall back to Grep when graph is stale or doesn't contain the symbol.
