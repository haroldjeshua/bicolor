# bicolor

Zero-overhead color tool for design engineers.

**Pick.** A color visually with an interactive picker. **Convert.** Between hex, rgb, hsl, oklch, oklab, lch with live preview. **Contrast.** Check WCAG ratios for your text on a background, with passing-color suggestions. **Palette.** Generate harmonious 11-step oklch scales from any seed color, exportable as CSS, Tailwind v4, or JSON. **Names.** Search established color naming systems by keyword or HEX.

All state is URL-shareable — every picker setting, conversion pair, palette seed, contrast pair, and names search is encoded in the URL. Share a color in one click.

---

## Tech

- **Next.js 16** (App Router) + TypeScript
- **Tailwind v4** — CSS-first, no config file
- **shadcn/ui** — unstyled primitives, `.dark` class convention
- **culori** — color math and conversions
- **react-colorful** — color picker widget
- **next-themes** — dark/light mode
- **Phosphor Icons** — UI icons

## Routes

| Route | Purpose |
|-------|---------|
| `/picker` | Pick a color and inspect every model |
| `/convert` | Convert between color models with shareable state |
| `/contrast` | Check WCAG contrast between your foreground and background |
| `/palette` | Generate an 11-step OKLCH scale and export tokens |
| `/gradient` | Build CSS gradients |
| `/names` | Search CSS, Tailwind v4, and XKCD color names |
| `/saved` | Locally saved colors and palettes |

## Color name collections

`/names` is backed by static, locally bundled data in `src/lib/colors/`:

- **CSS Named Colors** — all 148 standard opaque keywords from [CSS Color Module Level 4](https://www.w3.org/TR/css-color/#named-colors), including aliases like `aqua` / `cyan`.
- **Tailwind CSS v4** — 26 families × 11 shades from the official theme, with original OKLCH values preserved. HEX is derived through culori.
- **XKCD Color Survey** — 926 crowdsourced names (CC0), original spellings kept. Explicit scatological names are omitted from the bundled copy.

Both generated datasets come from source rather than hand-written files:

```bash
node scripts/generate-tailwind-v4.mjs
node scripts/generate-xkcd.mjs
```

The Tailwind dataset records `tailwindcss@4.3.0` as its source version; the XKCD
script regenerates from a checked-in snapshot so it works offline. No API or
backend is involved.

The page also runs the lookup backwards: paste any color into the nearest-name
field and it reports the closest established name in each collection, with its
CIEDE2000 distance. Search, collection filter, sort (name / hue), and the
nearest color all live in the URL (`?q=&collection=&sort=&color=`).

## Getting started

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

## Deploy

```bash
pnpm build
```

Deploy the `out/` or `/.next` to any Node hosting. Optimized for Vercel.

## License

MIT — see [LICENSE](./LICENSE).
