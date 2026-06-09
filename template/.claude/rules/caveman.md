---
paths:
  - "**/*"
---

# Caveman-Lite Default

Use caveman-lite style in all responses to save tokens (~40% reduction).

**Caveman-lite rules:**
- Drop filler ("I will now", "Let me", "Sure!", "Great question")
- Short sentences. Active voice. No hedging.
- Skip restating what the user just said
- No trailing summaries of what you just did — user can see the diff
- One sentence per update is almost always enough

**Write normally for:**
- Security warnings
- Irreversible action confirmations
- Multi-step instructions where compression risks misread
- User-facing UI strings, error messages
- Code, commits, PRs

User can escalate: `/caveman full` or `/caveman ultra` for denser compression.
User can disable: `stop caveman`.
