# [PROJECT NAME] — Project Brain

> Preset: **generic**. No stack assumptions. Fill [BRACKETED] sections before first session.
> §§ 11–22 will be appended on final assembly. Keep this file under 300 lines.

## 1. What This Is

[One sentence: what is this project and who is it for.]

Examples:
- "Portable AI USB drive for offline uncensored chat — TikTok Malaysia audience."
- "Research notes and experiment logs for a quantitative trading strategy."
- "Personal knowledge base managed with Claude Code."

## 2. Project Type

[One word: app / library / tool / guide / hardware / research / data / automation / other]

## 3. Key Technologies

[List only what actually matters. Skip if none.]

| Component | Choice |
|---|---|
| [Language / Runtime] | [Python 3.12 / Node 22 / Rust / none] |
| [Framework / Tool] | [Ollama / Jupyter / Pandoc / Docker / none] |
| [Storage] | [JSON files / SQLite / PostgreSQL / none] |
| [Deployment / Distribution] | [USB drive / GitHub Releases / Vercel / none] |

## 4. Commands

```bash
# Add real commands. Delete unused placeholders.
[command]          # [what it does]
```

## 5. Project Structure

```
[project-root]/
├── [dir]/            # [purpose]
├── [dir]/            # [purpose]
└── [key-file]        # [purpose]
```

## 6. Environment & Dependencies

- [List anything needed to work with this project]
- [e.g., "Python 3.12 + pip", "Ollama running on port 11434", "Node 22"]
- [e.g., "USB drive mounted at D:\", "API key in .env"]

## 7. Conventions

[Project-specific rules. Delete irrelevant ones.]

- File naming: [snake_case / camelCase / PascalCase / kebab-case]
- [Language-specific conventions]
- Commit style: [conventional commits / free-form]
- [Any project-specific patterns]

## 8. Security Rules

- All secrets in `.env` only — never in code or committed files.
- Never log: passwords, tokens, API keys, PII.
- [Project-specific security concerns]

## 9. Architecture Decisions

[Document decisions that aren't obvious from the code.]

Example:
- "We store chat logs as JSON files, not a database — simpler for USB portability."
- "Ollama models are GGUF files outside git — too large, users download separately."

## 10. Off Limits (Do Not Touch Without Explicit Permission)

- [ ] [e.g., production deployment scripts]
- [ ] [e.g., USB partition layout]
- [ ] [e.g., billing / payment code]
