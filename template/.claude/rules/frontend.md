---
paths:
  - "src/components/**/*.tsx"
  - "src/app/**/*.tsx"
  - "src/pages/**/*.tsx"
  - "app/**/*.tsx"
  - "components/**/*.tsx"
  - "pages/**/*.tsx"
---

# Frontend Rules

Loaded automatically when editing component or page files.

## Component Structure

```typescript
// Props interface above component — always
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
}

// Functional components only — no class components
export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (...)
}
```

- One component per file. File name = component name (PascalCase)
- Export at bottom of file or inline — be consistent with existing codebase

## Styling

- Tailwind CSS only — no inline `style={{}}` except for dynamic calculated values
- Use `cn()` (clsx + tailwind-merge) for all conditional classes
- Zero arbitrary Tailwind values (`w-[347px]`) — use spacing scale
- Dark mode: use `dark:` prefix — never hardcode light-only colors
- All color values from design tokens in `.claude/skills/design-system/SKILL.md`

```typescript
import { cn } from '@/lib/utils'

// Correct
<div className={cn('base-classes', isActive && 'active-classes', variant === 'primary' && 'primary-classes')} />

// Wrong
<div style={{ color: '#FF6B35' }} />
<div className={`text-[#FF6B35]`} />
```

## State Management

| State Type | Tool | Example |
|-----------|------|---------|
| UI-only (open/closed, hover) | `useState` | modal open state |
| Shared/global | Zustand store | user session, cart |
| Server data | React Query / SWR | fetched lists, profiles |

No prop drilling beyond 2 levels. Lift to store or use React Context.

## Component Library

Use shadcn/ui primitives before building custom. Check `/components/ui/` first.

Wrap library components in your own component — never use them directly in page code:
```typescript
// Wrong — Dialog used directly in page
import { Dialog } from '@/components/ui/dialog'

// Correct — wrapped in your component
import { ConfirmDialog } from '@/components/ConfirmDialog'
```

## Images

```typescript
// Always next/image — never <img>
import Image from 'next/image'
<Image src="/path" alt="descriptive text" width={400} height={300} />
```

## Accessibility

- All interactive elements: `aria-label` if no visible text
- Buttons: descriptive text content, not just icons
- Form inputs: associated `<label>` elements
- Color alone never conveys state (add icon or text too)

## Performance

- Heavy components: `dynamic(() => import('./Heavy'), { ssr: false })`
- Long lists: virtualize (react-virtual) if >100 items
- Event handlers in lists: no anonymous functions — use `useCallback`

## Component Split Triggers (Mandatory)

Split a component BEFORE adding any new feature when ANY trigger fires:

| Trigger | Threshold |
|---|---|
| File LOC | > hard budget from `file-budgets.json` (web preset: 400 LOC pages, 300 leaf) |
| `useState` calls | > 5 in one component |
| Dialogs / sheets / modals | > 2 in one component |
| Domain concerns | > 3 unrelated responsibilities |

Split pattern:
```
src/pages/SomeBigPage.tsx                 # orchestrator (≤ 250 LOC)
src/pages/SomeBigPage/
  SectionA.tsx
  SectionB.tsx
  SomeDialog.tsx
src/hooks/
  useSomeBigPageData.ts                   # data + mutations
  useSomeBigPageForm.ts                   # form state
```

If you cannot split BEFORE the edit, STOP and notify the user.

## Forbidden in Components

- Inline hex colors (`text-[#FF6B35]` / `style={{ color: '#xxx' }}`) — use design-system tokens.
- `useEffect` for derived state — compute inline or use `useMemo`.
- Anonymous functions in list event handlers — `useCallback` instead.
- Fetching directly in component body — use React Query / SWR hook.
- Local form state via raw `useState` — use React Hook Form + Zod.
