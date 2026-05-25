# Bicolor — Product Philosophy

## Core Identity

Bicolor is a lightweight modern color workspace focused on:
- fast color conversion
- palette generation
- CSS-native workflows
- developer-first ergonomics

The goal is not to become the biggest color platform.

The goal is to become the calmest and most practical color tool developers keep open while building.

---

# The Problem

Modern frontend color workflows are fragmented.

Developers and designers constantly:
- switch tabs
- convert between color models
- copy-paste values
- browse multiple tools
- mentally map palettes
- fight unnecessary UI complexity

Bicolor exists to reduce that friction.

---

# Product Philosophy

## Simplicity Over Feature Bloat

Every feature must justify its existence.

Bicolor should feel:
- direct
- fast
- obvious
- low-friction
- implementation-focused

Avoid turning the app into:
- a dashboard
- a visual playground
- a design suite
- a SaaS-style platform

---

## Utility Over Novelty

Prioritize:
- real workflows
- copy-paste usability
- implementation speed
- predictable outputs

Avoid features that exist mainly because they are visually impressive.

---

## Calm UI

The interface should reduce mental overhead.

The app should feel:
- spacious
- editorial
- lightweight
- typography-first
- calm
- focused

Avoid:
- visual clutter
- excessive panels
- heavy card systems
- over-componentized layouts
- noisy dashboards

---

# Core User Workflow

The primary workflow is:

1. Pick or paste a color
2. Convert between color models
3. Copy usable values
4. Generate a palette
5. Export CSS-native tokens
6. Continue building

The tool should support this workflow with minimal thinking required.

---

# Primary Product Focus

Bicolor is implementation-first.

This means:
- frontend workflows come first
- CSS-native outputs matter
- OKLCH workflows are prioritized
- framework-agnostic exports are important

Tailwind support is a feature, not the identity of the product.

---

# Design Direction

Main inspirations:
- oklch.fyi
- Scale by Hayk An

But Bicolor should remain:
- simpler
- more direct
- more implementation-focused

---

# Layout Philosophy

The application is not a dashboard.

Preferred structure:

```txt
<HeaderNav />

<Main>
  route content
</Main>

<ActionBar />
```

The interface should feel like:
- a focused workspace
- a utility tool
- a modern native app

Not:
- an admin panel
- a component showcase
- a SaaS analytics interface

---

# Scope Control

Future feature ideas are welcome.

But every feature must pass this question:

> Does this reduce friction in a real frontend color workflow?

If not, it is probably feature creep.

---

# MVP Priorities

Ship only the essentials first.

## Core MVP
- color conversion
- swappable inputs
- palette generation
- CSS variable exports
- customizable token prefixes

---

# Features Explicitly Deferred

These are intentionally out of scope for MVP:
- harmony systems
- gradients
- gamut visualization
- image extraction
- gradient extraction
- AI naming
- accessibility dashboards
- accounts/auth
- cloud sync

Some may become future features.

None should compromise the simplicity of the core product.

---

# Color Picker Philosophy

The picker should prioritize precision and familiarity.

Prefer:
- spectrum square
- hue slider
- direct input

Avoid overly artistic or experimental pickers for primary workflows.

Bicolor is primarily an implementation tool, not a creative painting interface.

---

# Palette Philosophy

Palettes should:
- feel balanced
- preserve perceived lightness
- work in real UI systems
- generate usable CSS-native outputs

Prefer OKLCH-based generation over naive HSL manipulation.

---

# Engineering Philosophy

Prefer:
- composition
- reusable primitives
- CSS-native approaches
- deterministic outputs
- minimal dependencies
- simple state management

Avoid:
- premature abstraction
- overengineering
- unnecessary animations
- framework lock-in

---

# The Bicolor Rule

If a feature increases complexity more than it reduces workflow friction,
do not add it.

---

# Long-Term Vision

Bicolor should become:
- a dependable everyday utility
- a modern frontend color companion
- a clean bridge between design and implementation

The best outcome is not users being impressed.

The best outcome is users forgetting the tool is even there because it fits naturally into their workflow.
