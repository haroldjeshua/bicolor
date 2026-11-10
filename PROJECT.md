# BICOLOR — Project Brief & Phases

> A direct, zero-overhead color tool for designers and developers.  
> Named for "two colors" — and a quiet nod to Bicol, Philippines. 🌋

---

## What It Is

**Bicolor** is a color utility web app focused on four core workflows: picking, converting, building palettes, and browsing established color names. It is framework-agnostic in its output — CSS variables, Tailwind v4 (`.css`-based), or raw values — and designed to be used without thinking about how to use it.

The guiding principle: **every page should have one job, and it should do it immediately.**

---

## Core Pages

| Route | Job |
|-------|-----|
| `/` | Landing / entry — explain what bicolor does, navigate to tools |
| `/picker` | Pick a color, see it in all color models at once, copy any |
| `/convert` | Two inputs, swappable, convert between any two color models |
| `/palette` | Generate a full palette from one color, export as CSS variables |
| `/names` | Search established color naming systems by name or HEX, find the nearest name for any color, copy values |

---

## Color Models Supported

- `hex` — `#1a2b3c`
- `rgb` — `rgb(26, 43, 60)`
- `hsl` — `hsl(210, 40%, 17%)`
- `oklch` — `oklch(0.28 0.04 220)` ← primary target
- `oklab` — `oklab(0.28 -0.01 -0.04)`
- `lch` — `lch(27% 5 220)`

---

## Named Color Reference (`/names`)

`/names` is a searchable reference library, not a color generator. It has one
job: help users find colors through established names, HEX values, and their
original design-system collections.

Three static collections ship:

| Collection | Contents | Source |
|------------|----------|--------|
| CSS Named Colors | 148 standard opaque keywords, aliases preserved | [CSS Color Module Level 4](https://www.w3.org/TR/css-color/#named-colors) |
| Tailwind CSS v4 | 26 families × 11 shades (50–950) = 286 colors | [Tailwind CSS v4 colors](https://tailwindcss.com/docs/colors) |
| XKCD Color Survey | 926 everyday names, CC0, original spellings preserved | [XKCD color survey](https://xkcd.com/color/rgb.txt) |

The Tailwind and XKCD data are generated from source, not hand-authored:
Tailwind from the installed `tailwindcss@4.3.0/theme.css` (original OKLCH
values preserved, HEX derived through culori), XKCD from a checked-in snapshot
of the survey. Explicit scatological names are omitted from the bundled XKCD
copy; everything else, typos included, is preserved.

Architecture:

```
src/lib/colors/
  types.ts        # collection, named color, sort, and nearest-match types
  css-named.ts    # adapts the existing HTML_COLOR_NAMES dataset
  tailwind-v4.ts  # generated, versioned official palette data
  xkcd.ts         # generated survey snapshot (CC0)
  index.ts        # metadata, HEX derivation, search/filter/sort/nearest helpers
```

The data layer is pure TypeScript with no React imports. Presentation lives in
`src/components/names/`. Search, collection filters, and sort combine; URL
state uses `?q=&collection=&sort=&color=`. Swatches are paint chips: the name
and HEX sit on the color. Hover reveals copy-HEX / copy-name / open-in-picker
actions; clicking a swatch opens an inspector panel and the ActionBar.

`/names` uses the same picker primitives as `/picker`: the inspector packs the
name, collection meta, inline HEX copy, and a `Copy color` formats flow and a
`Download` PNG card, while the ActionBar carries the navigation actions for the
selected color (copy name, picker, convert, palette, gradient from the color
with a random companion stop, save). The inspector is non-modal — the page and
ActionBar stay interactive behind it — and both render at the same z-layer
while a swatch is selected.

`/names` also answers the reverse question. Pasting any color into the nearest
name field runs a CIEDE2000 comparison against every collection and reports the
closest name per set, with its distance. Clicking a result filters the grid to
that entry.

Aliases and duplicate HEX values are intentional: distinct names are never
deduplicated merely because they resolve to the same color.

---

## Tech Stack

```
Framework:     Next.js 15/16 (App Router) or Vite + React + TypeScript
Styling:       Tailwind v4 (CSS-first config)
UI Library:    mostly shadcn/ui but some custom components from different registries
Animation:     Motion.dev (formerly Framer Motion)
Color engine:  culori (recommended, tree-shakable — handles oklch, oklab, lch, srgb, p3)
State:         URL search params for shareable color state
Deployment:    Vercel
```

---

## App Shell / Layout Architecture

Bicolor is **not** a dashboard, a marketing site, or a shadcn-scaffolded app.
It is a three-layer shell:

```
┌─────────────────────────────────┐
│  <Header>   nav: /picker /convert /palette   │  fixed top
├─────────────────────────────────┤
│                                 │
│  <main>   route content         │  fills remaining height
│                                 │
├─────────────────────────────────┤
│  <ActionBar>   context toolbar  │  fixed bottom
└─────────────────────────────────┘
```

**`<Header>`** — wordmark left, nav links right. Active route is visually distinct. No dropdowns, no hamburger menus.

**`<main>`** — full-height, route-owned. Each page controls its own layout entirely. No sidebars imposed by the shell.

**`<ActionBar>`** — a slim bottom toolbar whose contents are *injected per page*. Think of it as a context-aware command strip, not a persistent navigation. Contents by route:

| Route | ActionBar contents |
|-------|--------------------|
| `/picker` | Eyedropper trigger · Copy all models · Clear |
| `/convert` | Swap · Share URL · Copy result |
| `/palette` | Palette name input · Format toggle (CSS / TW4 / JSON) · Copy all · Export |

The ActionBar is a slot — pages declare what goes in it. The shell just renders it. This keeps each page clean without hiding important actions off-screen.

---

## Visual Design Direction

**Reference points:**
- [hihayk/scale](https://hihayk.github.io/scale/) — parametric feel, raw controls exposed, sliders as primary interaction, high information density without clutter. Color as content.
- [oklch.fyi](https://oklch.fyi/) — structured, educational, well-organized values.
- **Bicolor is:** Scale's directness + oklch.fyi's clarity, stripped of both's secondary complexity.

**Style principles:**
- Dark default, light mode available
- Monospace for all color values — they should feel like code output, not form fields
- Color swatches are large and dominant — the color itself is the UI
- No cards, no panels with borders, no shadcn-style rounded boxes everywhere
- Controls (inputs, dropdowns) are minimal and inline — tools, not forms
- Spacing is generous but not wasteful; density is functional
- Framer Motion for state transitions (model switch, swap animation, palette generation reveal)

**Typography:**
- Display/wordmark: something with character — not Inter, not Space Grotesk
- Values: monospace (Geist Mono, JetBrains Mono, or IBM Plex Mono)
- UI labels: clean sans-serif, small, secondary

---

## Color Picker Style Decision

**Recommendation: square gradient picker (saturation/lightness) + hue slider**

The reasoning:

| Picker style | Verdict |
|---|---|
| Color wheel (circle) | Beautiful but imprecise for developers picking exact values |
| Hexagon | Uncommon, steeper mental model |
| Tiles (Office-style) | Good for presets, not for freeform picking |
| Circle + inner square | Good but takes more screen space |
| **Square (S/L) + hue slider** | ✅ Developer-familiar (matches Figma, browser devtools), compact, precise |

**Implementation:** Use a canvas-based square picker or `react-colorful` (tiny, no deps).
The native `<input type="color">` is fine as a quick fallback but gives no control over the picker UI and is inconsistent across OS/browsers. Avoid it as the primary picker.

**Note:** On `/picker` the picker is prominent. On `/convert` and `/palette`, it's a secondary entry method (click the swatch to open a popover picker). Don't make every page feel like a color picker page.

---

## Palette — Naming & HTML Color Names

**Palette variable naming:**

Users can set a custom palette name. Structure:

```css
/* default name */
--color-50: oklch(0.97 0.01 260);

/* custom name: "brand" */
--color-brand-50: oklch(0.97 0.01 260);

/* custom name: "mayon" (go off) */
--color-mayon-50: oklch(0.97 0.01 260);
```

- Input defaults to `color`, editable inline
- Sanitize to kebab-case automatically (`My Brand` → `my-brand`)
- This is **one small input field in the ActionBar** — not a separate feature, not a modal. Keep it that way.

**Color name lookup (e.g. "Cornflower Blue"):**
The nearest-name lookup ships on `/names`: paste a color, get the closest
established name per collection. Coining a new name for a color that has none
("invented naming") stays out of scope — the page reports the closest existing
name, it does not generate one.

**HTML color names:**
Worth including as a 7th output model in `/picker`'s all-models panel — just a nearest-match lookup from a static list. Label it `CSS Named` and show it as read-only (not an input format). Low effort, occasionally delightful.

---

## Color Schemes — Scope Decision

**Verdict: defer to `/combos`, one backlog item.**

Three different jobs get confused:

| Page | Job | Input → output |
|------|-----|----------------|
| `/palette` | Expand one hue into a scale | 1 seed → 11 steps |
| `/names` | Catalog and lookup | name ↔ color |
| `/combos` (future) | Relate colors by role | 2 dominant + 1 accent |

A scheme is about relationships between hues, so it does not belong in a
single-hue scale page or a name catalog. It absorbs the earlier `/harmony`
idea: harmony modes become presets inside `/combos`, not a separate page.

What you *can* do in v1 without overcomplicating things: on `/palette`, show a small secondary swatch of the complementary color (hue + 180°) as a silent Easter egg — no labels, no explanation. Just: here's what's across the wheel. Users who know, know.

**Future `/combos` page:** pick two colors → get a suggested third accent →
preview the trio on a tiny mock UI → label each swatch using `/names`.

---

## Future Features Backlog

These are **explicitly out of scope** for v1. Documented here so they don't creep in.

| Feature | Notes |
|---|---|
| `/combos` | Role-based schemes: 2 dominant colors + 1 accent, 60-30-10 preview on a mock UI, harmony presets (replaces `/harmony`) |
| `/gradient` | oklch gradient generator with gamut warning |
| `/bulk` | Multi-line converter |
| `/gamut` | Gamut visualization, Display-P3 vs sRGB |
| Image color extractor | Upload image → extract dominant colors |
| Image gradient extractor | Upload image → generate CSS gradient |
| A11y / contrast checker | WCAG AA/AAA pass/fail against a background color |
| Generative color naming | `/names` is a reference library; nearest-name lookup only, invented naming remains out of scope |

---

## Export Format (CSS Agnostic)

Format toggle lives in `<ActionBar>` on `/palette`.

```css
/* Vanilla CSS */
:root {
  --color-brand-50: oklch(0.97 0.01 260);
  --color-brand-500: oklch(0.55 0.18 260);
  --color-brand-950: oklch(0.15 0.04 260);
}

/* Tailwind v4 */
@theme {
  --color-brand-50: oklch(0.97 0.01 260);
  --color-brand-500: oklch(0.55 0.18 260);
  --color-brand-950: oklch(0.15 0.04 260);
}

/* JSON */
{
  "50": "oklch(0.97 0.01 260)",
  "500": "oklch(0.55 0.18 260)",
  "950": "oklch(0.15 0.04 260)"
}
```

---

## Phases

### Phase 0 — Foundation
*Goal: project scaffold, routing, shared UI primitives, design tokens*

- [ ] Init Next.js App Router + TypeScript + Tailwind v4
- [ ] Install `culori`, `framer-motion`, `react-colorful`
- [ ] Set up route structure: `/`, `/picker`, `/convert`, `/palette`
- [ ] Build `<Header>` with nav links + active state
- [ ] Build `<ActionBar>` as a slot — accepts page-injected content via context or props
- [ ] Define design tokens in `app.css`: color, spacing, type scale, monospace stack
- [ ] Build `<ColorSwatch>` — large preview given any valid color value
- [ ] Build `<CopyButton>` — copies, shows transient "Copied" state
- [ ] Build `<ColorInput>` — text input + model dropdown, monospace
- [ ] `lib/color.ts`: `parse()`, `convert()`, `serialize()`, `generateScale()` wrappers around culori
- [ ] `lib/constants.ts`: supported models list, HTML named color lookup table

**Deliverable:** Navigable shell, working conversion utility, all primitives ready.

---

### Phase 1 — `/convert` Page
*Goal: the core page — two inputs, any models, swappable, shows all models below*

**UI:**
- Two `<ColorInput>` components, each with model dropdown
- Large color swatches beside each — dominant visual
- Swap button (animated, the two swatches visually trade places)
- Below: `<ModelGrid>` — the same color in all 6 models + CSS Named, each copyable

**ActionBar:** Swap · Share URL · Copy result

**Logic:**
- Input A → culori parse → convert to B's model → display live
- URL sync: `?from=hex&value=%231a2b3c&to=oklch`
- Invalid input: dim the output, don't crash

**Deliverable:** Fully working converter, URL-shareable.

---

### Phase 2 — `/picker` Page
*Goal: visual pick → see everything → copy anything*

**UI:**
- Square gradient picker (via `react-colorful` or custom canvas) + hue slider — prominent
- Eyedropper button (EyeDropper API, graceful fallback)
- `<ModelGrid>` below: all 6 models + CSS Named, all copyable

**ActionBar:** Eyedropper · Copy all · Clear

**Logic:**
- Single color state, all outputs derived
- Same `convertColor()` from Phase 0

**Deliverable:** One-stop color inspection panel.

---

### Phase 3 — `/palette` Page
*Goal: one color → 11-step oklch scale → CSS export*

**UI:**
- `<ColorInput>` at top (any model) with inline swatch
- `<PaletteStrip>` — 11 horizontal swatches (50–950), click any to copy its value
- Complementary color swatch shown quietly alongside (no label — Easter egg)
- Export code block below strip (syntax-highlighted, monospace)

**ActionBar:** Palette name input · Format toggle (CSS / TW4 / JSON) · Copy all

**Logic:**
- Lock hue + chroma from input color, step lightness from `0.97` → `0.15`
- Palette name: kebab-sanitized, default `color`
- Tailwind v4: `@theme {}` wrapper; vanilla: `:root {}`; JSON: plain object

**Deliverable:** Usable palette generator with CSS-agnostic export.

---

### Phase 4 — `/` Landing Page
*Goal: explain bicolor in one scroll, route to tools*

**UI:**
- Wordmark + tagline: "Pick. Convert. Palette."
- Three route cards with live micro-demos (not static screenshots)
- One-paragraph rationale for oklch-first
- Footer: GitHub · built by · 🌋 Bicol easter egg

**Note:** Build this last.

---

### Phase 5 — Polish & Fit
*Goal: feels like a real shipped tool*

- [ ] Responsive: all pages work on mobile (ActionBar collapses gracefully)
- [ ] Keyboard: `Tab` between inputs, `S` to swap on `/convert`
- [ ] Accessibility: aria labels, contrast check on UI chrome itself
- [ ] Out-of-gamut warning on oklch values with high chroma
- [ ] OG image: dynamic per shareable URL (Vercel OG)
- [ ] Light mode
- [ ] README

---

## File Structure

```
src/
  app/
    layout.tsx              # <Header> + <ActionBar> shell
    page.tsx                # / landing
    convert/page.tsx
    picker/page.tsx
    palette/page.tsx
    names/page.tsx        # searchable named-color reference
  components/
    Header.tsx
    ActionBar.tsx           # slot — content injected per page
    ColorInput.tsx          # text input + model dropdown
    ColorSwatch.tsx         # color preview box
    CopyButton.tsx
    ModelGrid.tsx           # all models output panel
    PaletteStrip.tsx        # 11-step horizontal swatch row
    ExportPanel.tsx         # code block + format toggle
    ColorPicker.tsx         # square picker + hue slider
    names/                  # names search, filter, sort, swatch, grouped grid, nearest-name finder, inspector, ActionBar
  lib/
    color.ts                # culori wrappers
    constants.ts            # model list, HTML color names lookup
    palette.ts              # generateScale(), complementary()
    colors/                 # static collection data + search/filter helpers
  styles/
    app.css                 # Tailwind v4 @theme tokens
```

---

## Constraints (Non-Negotiables)

- `culori` is the only source of color math. No custom conversion logic.
- `/convert` is the hero page. It ships first and ships complete.
- URL state on `/convert` is required — colors must be shareable.
- ActionBar content is page-declared, not hardcoded in the shell.
- No login, no accounts, no server state. Static + client-side only.
- oklch is the internal working format. All conversions pass through it.
- Tailwind v4 output uses `@theme {}` — not `tailwind.config.ts`.

---

## Scope Boundary (Read When Tempted)

If a new idea doesn't serve `/picker`, `/convert`, `/palette`, or `/names` directly — it goes in the backlog. Not in a comment. Not in a TODO. In the backlog table above, with a note.

The core pages. One clear job each. That's v1.

---

*Bicolor. Dalawang kulay. Built from Bicol. 🌋*
