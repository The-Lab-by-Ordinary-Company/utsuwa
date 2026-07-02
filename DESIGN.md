# Design System

The single reference for how Utsuwa looks. The app and the site (landing, blog, docs) share one token set and one button vocabulary. Read this before adding UI so new work stays consistent.

Source of truth: `src/app.css` (`:root` + `.dark`). Everything else consumes those tokens.

## Design language

Clean, flat, minimal. Neutral gray "layers" are FILLS, not strokes. Soft ambient shadows for depth. Accent blue `#00b2ff`. Inter for everything.

## Tokens

All tokens live in `src/app.css` under `:root` and are flipped wholesale in the `.dark` block. Reference them with `var(--token)`, never hardcode hex.

- Surfaces: `--bg-page` (the base canvas), `--bg-primary` / `--bg-secondary` / `--bg-tertiary` (the surface ladder, lightest to most tinted, used as fills for cards and controls).
- Text ramp: `--text-primary` (ink), `--text-secondary` (muted), `--text-tertiary` (faint). One ink color, varied strength.
- Accent set: `--accent`, `--accent-hover`, `--accent-muted` (~10% wash for focus rings and glows), `--accent-subtle` (~5% wash for tints).
- Borders: `--border-light` (visible dividers), `--border-subtle` (barely-there separators). Use sparingly, see Principles.
- Data colors: `--stat-*` (trust, intimacy, comfort, energy, respect, affection) and `--tier-*` (stranger through eternal-bond) for relationship/character UI. Semantic set: `--color-success` / `-error` / `-warning` / `-info`.
- Shadows: `--shadow-xs` through `--shadow-xl` (soft, mostly ambient/blur) plus `--shadow-glow` (accent-blue lift on primary buttons).
- Radii: `--radius-xs` (4) through `--radius-xl` (24) and `--radius-full` (pills).
- Scene: `--scene-bg` for the 3D canvas backdrop (tracks the page canvas per theme).

## Dark mode

`--bg-page` is the single base canvas: white in light, pure black `#000` in dark. Cards and surfaces use `--bg-primary` / `-secondary` / `-tertiary`, which are near-black slates that lift off the black canvas so hierarchy reads without borders. Text, accent, shadows, borders, and data colors all have `.dark` values, so components written against tokens flip automatically. Site and app follow the same rule, so there is one consistent look everywhere.

## Buttons

There is ONE canonical button system, defined near the end of `src/app.css`. Compose a base `.btn` with a variant and an optional size. Do not write new button CSS.

- Base: `.btn` (pill, `--radius-full`, flat, accent-muted focus ring, subtle active scale).
- Variants: `.btn-primary` (solid accent), `.btn-secondary` (gray fill, no stroke), `.btn-ghost` (transparent, fills gray on hover), `.btn-danger` (solid error), `.btn-on-card` (neutral pill for use on a filled gray card), `.btn-on-media` (translucent, sits over hero video/imagery).
- Sizes: `.btn-sm`, `.btn-lg`, and `.btn-block` (full width). Default size is medium (no size class).

Plain markup (links, site, static):

```html
<a class="btn btn-primary" href="/app">Open app</a>
<button class="btn btn-secondary btn-sm">Cancel</button>
```

In Svelte, use the wrapper `src/lib/components/ui/Button.svelte`, which maps props to the same classes:

```svelte
<Button variant="primary" size="lg">Save</Button>
<!-- variant: primary | secondary | ghost | danger ; size: sm | md | lg -->
```

Rule: never define a new button style. If a button looks wrong, adjust the tokens or add a variant to the canonical system, then reuse it everywhere.

Note: an older `.btn` block still exists earlier in `app.css` for legacy non-bits-ui buttons. The canonical block at the end wins by cascade order. New work targets the canonical vocabulary above.

## Principles

- Fills over strokes. Establish hierarchy with the surface ladder and soft shadows, not outlines. Keep borders (`--border-light` / `-subtle`) for genuine dividers only.
- No skeuomorphism. No glossy gradients, inset highlights, or glows on standard UI. The accent glow on primary buttons is the one deliberate exception. (The `--skeu-*` and decorative `--gradient-*` tokens exist for specific hero/marketing moments; do not reach for them in app chrome.)
- One source of truth. The docs/blog surfaces still use `--docs-*` names, but every one now aliases an app token in `src/lib/config/docs-theme.ts` (for example `--docs-bg: var(--bg-page)`). Change a value in `src/app.css` and it propagates to the site. Do not give `--docs-*` its own hardcoded values.
