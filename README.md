# bicolor

Zero-overhead color tool for design engineers.

**Pick.** A color visually with an interactive picker. **Convert.** Between hex, rgb, hsl, oklch, oklab, lch with live preview. **Palette.** Generate harmonious 11-step oklch scales from any seed color, exportable as CSS, Tailwind v4, or JSON.

All state is URL-shareable — every picker setting, conversion pair, and palette seed is encoded in the URL. Share a color in one click.

---

## Tech

- **Next.js 16** (App Router) + TypeScript
- **Tailwind v4** — CSS-first, no config file
- **shadcn/ui** — unstyled primitives, `.dark` class convention
- **culori** — color math and conversions
- **react-colorful** — color picker widget
- **next-themes** — dark/light mode
- **Phosphor Icons** — UI icons

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
