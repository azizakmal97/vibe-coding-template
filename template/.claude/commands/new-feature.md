---
name: new-feature
argument-hint: "[feature name] — [one sentence description of what it does]"
---

# New Feature: $ARGUMENTS

Follow this exact sequence. Do not skip steps.

## Phase 1: Research (Read before writing anything)

1. Read `CLAUDE.md` — stack, conventions, patterns
2. Find existing similar code:
   ```bash
   grep -rn "[relevant keyword]" src/ --include="*.ts" --include="*.tsx" -l
   ```
3. Identify reusable components and utilities already present
4. State: "I will change: [exact files]. I will NOT change: [boundaries]."

**Do not write code yet.**

## Phase 2: Design Contract

Before implementation, define:

```typescript
// 1. Types (what data flows through this feature)
interface FeatureInput { ... }
interface FeatureOutput { ... }

// 2. API contract (if new endpoint needed)
// POST /api/resource — Request: { ... } — Response: { data: ... }

// 3. Components needed
// - NewComponent (new) vs ExistingComponent (reuse)

// 4. Design tokens to use (from design-system.md)
// - Colors: primary, surface, border
// - Spacing: 24px card, 16px gap
```

State which existing components will be reused. If none exist for a UI element, build it using shadcn/ui primitives.

## Phase 3: Implementation (Smallest working version)

1. Types first, then implementation
2. Use existing patterns — do not invent new approaches
3. No placeholder TODOs — real implementation or nothing
4. Zero `any` TypeScript types
5. Every async operation has error handling
6. Every user input validated with Zod

## Phase 4: Test Gate (mandatory — show actual output)

```bash
npx tsc --noEmit
npx eslint . --quiet
npm test -- --coverage
npm run build
```

Paste the actual terminal output. All must be green.

## Phase 5: Security Check

Before committing, confirm:
- [ ] No hardcoded secrets
- [ ] Auth checked on new protected routes
- [ ] User inputs validated
- [ ] No `any` types that could hide security issues

## Phase 6: Code Review

Run the `code-reviewer` agent on changed files.

## Phase 7: Commit

```
feat([scope]): [what the feature does — user-visible behavior]
```

## Phase 8: Verify in Browser

Start dev server: `npm run dev`
Navigate to the feature. Test:
1. Happy path (normal use)
2. Edge case (empty state, max input)
3. Error state (what happens when it fails)

Describe what you see for each.
