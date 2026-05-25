---
name: design-system
description: Apply consistent visual design tokens. Auto-triggers when building UI. Invoke manually with /design-system.
user-invocable: true
---

# Design System

> SETUP REQUIRED: Replace ALL [PLACEHOLDER] values with your actual design before using.
> Extract these from your Figma file, brand guide, or existing app.
> Run `/design-system` to apply these standards to any component.

---

## Colors

```css
/* Primary brand */
--color-primary:       [#3B82F6];   /* Main action color */
--color-primary-hover: [#2563EB];   /* Darker for hover */
--color-primary-muted: [#DBEAFE];   /* Tint for backgrounds */

/* Backgrounds */
--color-bg-base:    [#09090B];      /* Page background */
--color-bg-surface: [#18181B];      /* Card / panel */
--color-bg-overlay: [#27272A];      /* Dropdown / modal overlay */
--color-bg-hover:   [rgba(255,255,255,0.04)];  /* Hover state on surface */

/* Borders */
--color-border:        [rgba(255,255,255,0.1)];  /* Default border */
--color-border-strong: [rgba(255,255,255,0.2)];  /* Emphasized border */

/* Text */
--color-text-primary:   [#FAFAFA];  /* Main content */
--color-text-secondary: [#A1A1AA];  /* Supporting text */
--color-text-muted:     [#71717A];  /* Placeholder, disabled */

/* Semantic */
--color-error:   #EF4444;
--color-warning: #F59E0B;
--color-success: #22C55E;
--color-info:    #3B82F6;
```

## Typography

```css
--font-sans: '[Inter]', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: '[JetBrains Mono]', 'Fira Code', monospace;

/* Scale — use Tailwind equivalents in practice */
hero:    3.5rem / 4rem   (56px / 64px)  → text-5xl lg:text-6xl
h1:      2.25rem / 2.5rem (36px / 40px) → text-4xl
h2:      1.875rem / 2rem  (30px / 32px) → text-3xl
h3:      1.5rem  / 1.75rem (24px / 28px) → text-2xl
h4:      1.25rem / 1.5rem  (20px / 24px) → text-xl
large:   1.125rem          (18px)         → text-lg
body:    1rem               (16px)         → text-base
small:   0.875rem           (14px)         → text-sm
xs:      0.75rem            (12px)         → text-xs

/* Weight */
regular:   400  → font-normal
medium:    500  → font-medium
semibold:  600  → font-semibold
bold:      700  → font-bold

/* Tracking */
tight:   -0.02em → tracking-tight  (headings)
normal:   0em    → tracking-normal (body)
wide:    +0.05em → tracking-wide   (labels, caps)
```

## Spacing System

Multiples of 4px. Use Tailwind scale:

```
4px  → p-1  / gap-1  / m-1
8px  → p-2  / gap-2             (tight spacing, icon gaps)
12px → p-3  / gap-3
16px → p-4  / gap-4             (default inner spacing)
20px → p-5  / gap-5
24px → p-6  / gap-6             (card padding)
32px → p-8  / gap-8             (section sub-groups)
48px → p-12 / gap-12            (section padding)
64px → p-16 / gap-16            (large section gaps)
96px → p-24 / gap-24            (hero section padding)
```

## Border Radius

```
4px  → rounded      (badges, tags, inputs)
6px  → rounded-md   (buttons)
8px  → rounded-lg   (cards, panels)
12px → rounded-xl   (modals, large cards)
16px → rounded-2xl  (hero elements)
full → rounded-full (avatars, pills)
```

## Shadows & Depth (Dark Mode)

Never flat black. Create depth through layering and subtle borders:

```css
/* Elevation levels */
--shadow-sm:  0 1px 2px rgba(0,0,0,0.5);
--shadow-md:  0 4px 6px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3);
--shadow-lg:  0 10px 15px rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.3);
--shadow-xl:  0 20px 25px rgba(0,0,0,0.7);

/* Brand glow — use sparingly on primary CTAs */
--glow-primary: 0 0 24px rgba([PRIMARY_RGB], 0.35);

/* Inset depth on surfaces */
--border-subtle: 1px solid rgba(255,255,255,0.06);
--border-default: 1px solid rgba(255,255,255,0.10);
```

## Component Patterns

### Button

```tsx
// Primary
<button className="bg-[primary] hover:bg-[primary-hover] text-white font-medium
  text-sm px-4 py-2 rounded-md transition-colors duration-150 disabled:opacity-50">

// Secondary  
<button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700
  font-medium text-sm px-4 py-2 rounded-md transition-colors duration-150">

// Ghost
<button className="hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100
  font-medium text-sm px-4 py-2 rounded-md transition-colors duration-150">

// Destructive
<button className="bg-red-600 hover:bg-red-700 text-white font-medium
  text-sm px-4 py-2 rounded-md transition-colors duration-150">
```

### Card

```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
  <h3 className="text-zinc-100 font-semibold text-lg tracking-tight">{title}</h3>
  <p className="text-zinc-400 text-sm mt-1">{description}</p>
</div>
```

### Input

```tsx
<input
  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2
    text-zinc-100 text-sm placeholder:text-zinc-600
    focus:outline-none focus:ring-2 focus:ring-[primary]/40 focus:border-[primary]
    transition-colors duration-150"
/>
```

### Badge

```tsx
<span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1
  rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
  {label}
</span>
```

## Animation Standards

```css
/* Duration */
instant:  0ms    (checkbox checks, immediate state)
fast:     150ms  (color/background transitions)
normal:   200ms  (transforms, opacity)
slow:     300ms  (layout changes, modals)

/* Easing */
ui:     ease        (most UI interactions)
enter:  ease-out    (elements appearing)
exit:   ease-in     (elements disappearing)
spring: cubic-bezier(0.34, 1.56, 0.64, 1)  (springy reveals)

/* Hover patterns */
lift:   hover:-translate-y-0.5 transition-transform duration-200
scale:  hover:scale-[1.02] transition-transform duration-200
```

## Dark Mode Rules

1. Never use flat black (`#000000`) — minimum `zinc-950` / `#09090B`
2. Create depth through 3 surface levels: base → surface → overlay
3. Use subtle borders to separate layers (not shadows alone)
4. Reduce opacity on hover states rather than changing hue
5. Semantic colors (error/success/warning) should be the same in light/dark
