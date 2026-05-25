<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project: Bicolor

Zero-overhead color tool for design engineers. oklch-first, CSS framework-agnostic, pick/convert/palette with URL-shareable state.

### Architecture
- Next.js 16 App Router + TypeScript + pnpm
- Tailwind v4 CSS-first (no config file)
- shadcn color convention (`.dark` class, `bg-background`/`text-foreground` etc.)
- culori for color math
- react-colorful (HexAlphaColorPicker, HexColorInput, HexColorPicker)
- URL search params for shareable state
- ActionBar via split React Contexts
- vitest + @testing-library/react

### Key conventions
- `globals.css`: shadcn-only `@theme inline`, no custom `--color-*` vars
- Dark mode: inline `<script>` in layout.tsx sets `.dark` before hydration
- Components use `bg-background`/`text-foreground`/`text-muted-foreground`/`bg-muted`/etc.
- ActionBar: `ActionBarSetContext` (stable setter) + `ActionBarContentContext` (mutable content)
- `useActionBar()` returns only `setContent` (subscribes to setter context, never re-renders on content changes)
- `useRef` pattern for stable callbacks in picker page

### Convert page layout
```
[ColorSwatch (clickable→react-colorful popover) + ColorInput A (editable)] [Swap] [ColorInput B (readonly)]
```
- A = source (always editable), B = target (always readonly, model selector still interactive)
- Swap exchanges values between A and B (no animations)
- `ModelGrid` shows A's value in all models (supplementary suggestions)
- URL: `?from={aModel}&value={aValue}&to={bModel}`

### Next
- Phase 3: /palette page
- Phase 4: / (landing page)
- Phase 5: polish (responsiveness, gamut warnings, OG images)
- /picker page: useRef for stable callbacks pattern
