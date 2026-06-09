---
paths:
  - "**/*"
---

# Simplicity & Coherence — "One Coherent Animal"

Always loaded. The goal: a junior dev opens any file and STAYS — the whole codebase
reads like one person with taste wrote it, not AI stitching a giraffe-octopus-shark
into one mutant. Working-but-incoherent ≠ done. This rule governs *how* code is
shaped; `refactor.md` governs *when* to split it and `naming.md` governs what to
call it.

## §1 — Simplicity is the prime directive

Build the simplest thing that fully solves the problem in front of you. Over-engineering
is a defect, not craftsmanship.

| Do | Don't |
|---|---|
| Fewest moving parts that work | Add layers "for flexibility" nobody asked for |
| Solve today's problem + one obvious next step | Build for an imagined million-user future (YAGNI) |
| Inline/duplicate until used 3+ times, THEN extract | Add an interface/factory/wrapper for a single caller |
| Prefer stdlib + what the project already uses | Pull a new dependency for a 3-line helper |
| Solve exactly what was asked; ASK before expanding scope | Gold-plate with unrequested features/options/knobs |
| Delete code — best change often removes more than it adds | Keep dead code "just in case" |
| Clear version first; optimize only a measured hot path | Premature optimization that obscures intent |

**Rule of three:** a little duplication is cheaper than the wrong abstraction. Wait for
the third occurrence before generalizing.

## §2 — Fit the codebase (anti-frankenstein)

Before writing, read 2-3 neighboring files and match them EXACTLY: naming, file/folder
layout, error handling, import style, async style, state management, test style. House
style WINS over personal default — even if you'd do it differently.

- One paradigm per layer. Don't mix two HTTP clients, two date libs, two styling
  approaches, OOP+functional, or callbacks+promises in the same area. Pick what's
  already there.
- Same concept = same word everywhere. Don't call it `user` here, `account` there,
  `member` elsewhere.
- No snippet teleporting. Never paste a pattern from a different stack/era that clashes.
  Adapt it to fit or don't use it.
- Don't invent/hallucinate library APIs — verify a method/option exists before using it.

## §3 — Readable for a tired junior at 5pm

- Intent-revealing names (see `naming.md`); single letters only for loop indices / math.
- Small, single-purpose functions. If describing it needs "and", split it.
- Guard-clause early returns over deep nesting (keep ≤ ~3 levels).
- Comments explain WHY, never WHAT the code already says.
- No clever one-liners that need a PhD to parse. Boring, obvious, linear wins.

## §4 — Self-review before "done"

Re-read the full diff as a hostile senior reviewer who didn't write it:

1. Is this the SIMPLEST thing that works, or did I over-engineer?
2. Would a junior understand it in one read?
3. Does it match the surrounding code, or are there frankenstein seams?
4. Any dead code, unhandled edge, or `refactor.md` forbidden pattern?

Fix what you find. Then state what you actually verified (typecheck / build / lint /
test — with results) and call out anything you did NOT verify. Never claim done on hope.
If scope is ambiguous, ASK first — a clarifying question is cheaper than the wrong feature.

## Forbidden Simplicity Anti-Patterns

- Abstraction with a single caller — inline it until rule-of-three fires.
- A new dependency where stdlib or an existing util would do — justify or drop it.
- Speculative config flags / options / hooks for needs that don't exist yet.
- "While I'm here" scope creep — file it in `PROGRESS.md`, don't build it now (see `refactor.md`).
- Clever indirection (pipelines of tiny one-line wrappers) that forces reader to jump around.
- Mixing a second pattern/library for a job the codebase already has one for.
