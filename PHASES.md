# BICOLOR — Phase Prompts
> Paste one prompt per session into your IDE/LLM. Complete and verify each phase before moving to the next.

---

## Phase 0 — Foundation

```
You are building "Bicolor" — a color utility web app. This is Phase 0: project scaffold and shared primitives.

Stack: Next.js App Router, TypeScript, Tailwind v4 (CSS-first, app.css only, no tailwind.config.ts), Framer Motion, culori (color math), react-colorful (picker widget).

Tasks:
1. Scaffold the Next.js project with the App Router and the above dependencies installed.
2. Set up routes as empty page stubs: /, /picker, /convert, /palette.
3. Build the app shell in layout.tsx:
   - <Header>: wordmark "bicolor" left, nav links right (/picker, /convert, /palette), active route visually distinct.
   - <ActionBar>: fixed bottom toolbar. Accepts children via an ActionBarProvider context so each page can inject its own controls.
   - <main>: fills remaining height between header and action bar.
4. Define design tokens in app.css using Tailwind v4 @theme:
   - Dark background default (#0a0a0a range), neutral foreground, one accent color.
   - Monospace font stack for color values (JetBrains Mono or IBM Plex Mono via next/font).
   - Spacing scale, border radius minimal (2px–4px max).
5. Build shared primitives:
   - <ColorSwatch /> — takes a CSS color string, renders a color preview box.
   - <CopyButton /> — takes a string value, copies on click, shows transient "Copied ✓" for 1.5s.
   - <ColorInput /> — monospace text input + model dropdown (hex, rgb, hsl, oklch, oklab, lch). Emits { value, model } on change.
6. Build lib/color.ts:
   - parse(value, model): returns culori color object or null
   - convert(value, fromModel, toModel): returns formatted string or null
   - serialize(colorObj, model): returns CSS string for that model
   - isValid(value, model): boolean
7. Build lib/constants.ts:
   - MODELS array: ['hex','rgb','hsl','oklch','oklab','lch']
   - HTML_COLOR_NAMES: static Record<string,string> of ~150 common named colors (name → hex)

Do not build any page content yet. Deliverable is a navigable shell with working primitives and a tested convert() utility (write a quick console test in a /test route or in a comment block showing it works for hex→oklch).

Design notes: no cards, no rounded panels, no shadcn. Controls are inline and minimal. Color swatches are the dominant visual. All color values render in monospace.
```

---

## Phase 1 — /convert

```
Bicolor phase 1: build the /convert page. The shell, primitives, and lib/color.ts are already complete from Phase 0.

The /convert page is the hero page of the app. It has one job: take a color in any model, convert it to any other model, show all models at once.

UI layout (top to bottom):
1. Two <ColorInput> components side by side (flex row, stack on mobile). Each has a model dropdown and a large <ColorSwatch> beside the input. These are Input A and Input B.
2. A Swap button between them. On click: swap the model selections and the values. Animate the two swatches trading places (Framer Motion layoutId).
3. Below: <ModelGrid> — displays the current color rendered in all 6 models (hex, rgb, hsl, oklch, oklab, lch) plus a "CSS Named" nearest-match row (read-only). Each row has the model label, the value in monospace, and a <CopyButton>.

ActionBar (injected via ActionBarProvider):
- Swap button (mirrors the one above, for quick keyboard-accessible reach)
- "Share" button — copies the current URL to clipboard
- "Copy result" — copies Input B's current value

Logic:
- Input A is the source of truth. As the user types in A (or changes A's model), B updates live.
- If the user types in B, B becomes the source of truth temporarily (same as A's behavior).
- URL sync: update search params on every valid change: ?from=hex&value=%231a2b3c&to=oklch. On mount, read params and restore state.
- Invalid/incomplete input: dim the output side, show a subtle "—" in ModelGrid. Do not throw or show error alerts.
- Use culori via lib/color.ts for all conversions. No custom math.

Design: swatches should be large (at least 80px tall on desktop). The two input+swatch pairs are the dominant visual. ModelGrid rows are compact, monospace, secondary. The page should feel immediate — no loading, no buttons to trigger conversion.
```

---

## Phase 2 — /picker

```
Bicolor phase 2: build the /picker page.

The /picker page has one job: pick a color visually, then see it in every color model and copy any.

UI layout:
1. Top: a square gradient picker (saturation × lightness canvas) with a hue slider below it. Use react-colorful's HexAlphaColorPicker (supports alpha via 8-digit hex). react-colorful also provides HslStringColorPicker, HslaStringColorPicker, RgbaStringColorPicker, etc. — all with alpha variants. The picker should be prominent — at least 260×260px on desktop.
2. Eyedropper button next to the picker (uses the EyeDropper Web API). On unsupported browsers, show the button as disabled with a tooltip "Not supported in this browser".
3. A hex text input below the picker so users can also type a value directly.
4. Below all of that: <ModelGrid> — same component from Phase 1. Shows the picked color in all 6 models + CSS Named, all copyable.

ActionBar (injected):
- Eyedropper trigger (mirrors the one above)
- "Copy all" — copies all model values as a formatted block, e.g.:
    hex: #1a2b3c
    oklch: oklch(0.28 0.04 220)
    ...
- "Clear" — resets to a default color (oklch(0.55 0.18 260) or similar)

Logic:
- Single color state (store as oklch internally, derive all other models via lib/color.ts).
- Picker, eyedropper, and text input all write to the same state.
- EyeDropper: call window.EyeDropper, handle NotAllowedError gracefully.

Design: picker is the dominant element, large and tactile. ModelGrid below is compact. This page should feel like opening a color inspector, not filling a form.
```

---

## Phase 3 — /palette

```
Bicolor phase 3: build the /palette page.

The /palette page has one job: take one color, generate an 11-step oklch scale (50–950), and export it as CSS variables.

UI layout:
1. Top: a <ColorInput> (any model) with a large inline swatch. This is the seed color.
2. Below: <PaletteStrip> — 11 swatches in a horizontal row, labeled 50 through 950. Each swatch is clickable and copies its value. Show the oklch value on hover (tooltip or below the swatch).
3. Quietly show a small complementary color swatch (hue + 180°) somewhere near the strip. No label. Easter egg for those who notice.
4. Below strip: <ExportPanel> — a syntax-highlighted monospace code block showing the CSS output.

ActionBar (injected):
- Palette name input (text field, defaults to "color", auto-sanitizes to kebab-case on change, e.g. "My Brand" → "my-brand")
- Format toggle: three buttons — "CSS" / "TW4" / "JSON"
- "Copy all" button

Palette generation logic (in lib/palette.ts):
- Parse seed color → convert to oklch via culori
- Lock hue and chroma, generate 11 lightness steps: [0.97, 0.93, 0.86, 0.76, 0.64, 0.52, 0.42, 0.33, 0.25, 0.18, 0.12]
- These map to steps: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950
- Clamp chroma per step to avoid out-of-gamut (use culori's toGamut or clampChroma)
- Serialize each step as oklch(L C H)
- Export formats:
  - CSS: :root { --color-{name}-50: oklch(...); ... }
  - TW4: @theme { --color-{name}-50: oklch(...); ... }
  - JSON: { "50": "oklch(...)", ... }
- complementary(): takes an oklch color, returns oklch with hue rotated +180deg

Design: palette strip is the dominant visual — swatches should be large and touching (no gap). The export block below is clearly secondary. The ActionBar is the control surface; the main area is just the color.
```

---

## Phase 4 — / Landing Page

```
Bicolor phase 4: build the / landing page. All three tool pages are complete.

The landing page has one job: explain what bicolor is in under 5 seconds, then get out of the way.

UI (single scrollable page):
1. Hero: wordmark "bicolor" large, tagline "Pick. Convert. Palette." — three words, three links.
2. Three feature cards for /picker, /convert, /palette. Each card should contain a live micro-demo using the actual components (a static mini ModelGrid with a sample color, or a small PaletteStrip with a sample scale). Not screenshots.
3. One short paragraph: what bicolor is for, and why oklch is the default.
4. Footer: GitHub link placeholder, "Built by [your name]" — and somewhere subtle, the Bicol easter egg. A small 🌋 or the text "Naga, Bicol" in the footer. Keep it quiet.

No ActionBar on this page (or show it empty).

Design: this should feel like the tool itself — not a marketing landing page. No gradients over hero images, no testimonials, no pricing. The live component demos are the content. Whitespace-heavy, fast to scan.
```

---

## Phase 5 — Polish & Fit

```
Bicolor phase 5: final polish pass. All pages are functionally complete.

Work through these in order:

1. Responsive audit:
   - /convert: stack the two ColorInputs vertically on mobile. ActionBar items wrap or abbreviate.
   - /picker: picker canvas scales down to ~240px on mobile.
   - /palette: PaletteStrip scrolls horizontally on mobile rather than wrapping.

2. Keyboard support:
   - /convert: press S to trigger Swap.
   - All CopyButtons: respond to Enter/Space.
   - ColorInput model dropdown: navigable by arrow keys.

3. Accessibility:
   - All interactive elements have aria-labels.
   - ColorSwatch includes aria-label with the color value.
   - Check contrast of the UI chrome itself (text on dark background).

4. Edge cases:
   - Out-of-gamut oklch: if chroma exceeds sRGB gamut, show a small warning indicator on the swatch (a dot or icon). Do not block the value.
   - Empty/blank input: show placeholder, no errors.
   - Very long color names in palette: truncate with ellipsis at 20 chars.

5. OG image: implement a dynamic OG image route at /api/og using @vercel/og. Accept a `color` search param, render the color as a large swatch with its hex and oklch values. This makes shared /convert URLs preview richly in Slack/Twitter.

6. Light mode: add a theme toggle (moon/sun icon in the Header). Implement via a `data-theme` attribute on <html> and alternate CSS variable values in app.css.

7. README.md: project description, tech stack, local dev instructions, deploy instructions.

Do not add any new features in this phase. If you notice something missing that isn't in this list, add a comment in the code with // BACKLOG: and move on.
```

---

## Status

| Phase | Items | Status |
|-------|-------|--------|
| 0 | Foundation | ✅ Complete |
| 1 | /convert | ✅ Complete |
| 2 | /picker | ✅ Complete |
| 3 | /palette | ✅ Complete |
| 4 | / landing | ✅ Complete |
| 5 | Responsive audit | ✅ Done |
| 5 | Keyboard support | ✅ Done |
| 5 | Accessibility | ✅ Done |
| 5 | Edge cases (gamut, empty, truncation) | ✅ Done |
| 5 | OG image (`/api/og`) | ❌ Remains — needs `@vercel/og` + edge route |
| 5 | Light mode (theme toggle) | ✅ Done via `next-themes` |
| 5 | README | ✅ Done |
| Future | /saved (Auth + Database) | ⏳ On hold |

---

## Future Phase — /saved (Auth + Database)

> Not in scope for v1. Document is here so the architecture decisions are made now, not later.

```
When ready to implement /saved:

Stack decision: use Supabase for both auth and database. It provides Postgres, auth (email/password + OAuth), row-level security, and a TypeScript client in one package. Use @supabase/ssr for Next.js App Router compatibility (handles cookies correctly in server components and middleware).

Do NOT use: Clerk (auth only, still needs a DB), NextAuth/Auth.js (needs separate DB wiring), PlanetScale/Neon standalone (still needs separate auth).

Schema (plan now, implement later):
  users         — managed by Supabase Auth (no custom table needed unless extending profile)
  saved_colors  — id, user_id (fk), color_value (text), color_model (text), label (text nullable), created_at
  saved_palettes — id, user_id (fk), seed_color (text), steps (jsonb), palette_name (text), format (text), created_at

Auth flow:
  - Magic link or GitHub OAuth as primary (low friction for devs)
  - Session managed via Supabase SSR middleware in middleware.ts
  - /saved is a protected route — middleware redirects to /login if no session

UI:
  - Each page gets a "Save" button in the ActionBar (only rendered when user is logged in)
  - /saved page: list of saved colors and palettes, click to restore state (navigates to the right page with URL params populated)
  - No complex UI — it's a list with restore + delete actions

Migration path from v1:
  - All state is already URL-based, so "save" is just persisting the URL params to the DB
  - No refactor needed on existing pages — just add the Save button to ActionBar and the /saved route
```
