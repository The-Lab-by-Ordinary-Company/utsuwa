# Landing Page Design

## Overview

Add a marketing landing page at the root URL (`/`). Move the live app from `/` to `/app`. Docs and blog routes stay unchanged.

## Route Restructuring

**Current:**
- `src/routes/(app)/+page.svelte` → `/` (live app)
- `src/routes/(app)/settings/` → `/settings/*`
- `src/routes/docs/` → `/docs/*`
- `src/routes/blog/` → `/blog/*`
- `src/routes/overlay/` → `/overlay/*`

**Target:**
- `src/routes/+page.svelte` → `/` (landing page)
- `src/routes/app/+page.svelte` → `/app` (live app)
- `src/routes/app/+layout.svelte` → app viewport layout
- `src/routes/app/settings/` → `/app/settings/*`
- `src/routes/docs/` → `/docs/*` (unchanged)
- `src/routes/blog/` → `/blog/*` (unchanged)
- `src/routes/overlay/` → `/overlay/*` (unchanged)

Delete `src/routes/(app)/` entirely after moving contents to `src/routes/app/`.

Update all internal links referencing `/settings` to `/app/settings`.

## Landing Page Sections

### Nav

Top navigation bar over the hero gradient. Contains:
- Utsuwa logo/wordmark (left)
- Nav links: Features, Docs, Blog, GitHub (center/right)
- "Try Live" CTA button (right)

### Hero

**Background:** Gradient from `#f472b6` (pink) through `#8b5cf6` (purple) to `#0a0a0a` (dark). Decorative glass-panel floating windows on left/right sides (same pattern as reference).

**Content (centered):**
- App icon (rounded square with gradient, Utsuwa logo inside)
- Heading: "Utsuwa" — large, `text-5xl md:text-6xl lg:text-7xl`, white, Exo 2 font
- Subtitle: "Open-source VRM avatar viewer with AI chat, voice, and memory."
- 3 CTA buttons in a row:
  1. **"Try Live"** — filled white pill button, links to `/app`
  2. **"Download"** — filled white pill button, links to GitHub Releases
  3. **"Docs"** — outlined/ghost pill button, links to `/docs`
- Static app screenshot in a rounded card below buttons, max-width ~1067px

### Feature A: "Meet your AI companion" (2-column)

Dark background section. Large heading centered, then 2-column layout:
- Left: App mockup/screenshot showing VRM model with speech bubble and UI overlay
- Right: Badge pill ("3D Avatar"), heading ("Meet your AI companion"), description about VRM viewer, 3D speech bubbles, expressions, orbit controls

### Feature B: "She remembers" (2-column, reversed)

Dark background, same structure but columns reversed:
- Left: Badge, heading, description about semantic memory, relationship stages, mood tracking, companion system
- Right: Mockup of companion status or memory graph

### Feature C: "Your voice, her ears" (2-column)

Same pattern:
- Left: Mockup showing chat bar with mic icon, provider logos
- Right: Badge, heading, description about 7 LLM providers, voice input, TTS, lip-sync

### Feature Grid (3-column cards)

Section heading "More features", then 3 cards:

1. **Desktop Overlay** — icon illustration, title, description about transparent overlay mode and always-on-top
2. **Local-First** — icon, title, description about IndexedDB, no server, export/import
3. **Open Source** — icon, title, description about MIT license, self-hosting, community

Cards: dark bg (`#000`), white/10 border, rounded-2xl, hover border brightens

### Final CTA Section

Light-colored section using pink gradient (`#f472b6` → `#ec4899`). Contains:
- App icon (larger)
- Heading: "Download Utsuwa"
- 3 CTA buttons (same as hero)
- Disclaimer text about platform support

### Footer

Dark bg (`#171717`), border-t border-white/5:
- Utsuwa logo (left)
- Link columns: Project (GitHub, Releases, Docs, Blog), Legal (MIT License, Privacy)
- Giant "Utsuwa" typography at bottom, oversized, partially clipped
- Bottom bar: copyright line, social links (GitHub, X/Twitter)

## Design Tokens

Use existing CSS variables from `app.css`:
- Pink accent: `--accent` / `--accent-hover`
- Dark bg: `--bg-primary` (dark mode values)
- Text: `--text-primary`, `--text-secondary` (dark mode)
- Borders: `--border-light` (dark mode)
- Shadows: existing shadow scale
- Fonts: 'Exo 2' for headings, 'M PLUS Rounded 1c' for body
- Skeuomorphic glass effects for floating elements

Landing page forces dark mode styling regardless of system preference — the gradient design requires a dark canvas.

## Technical Notes

- Landing page is a standalone Svelte component, no shared layout with the app
- Uses Tailwind utility classes (consistent with rest of codebase)
- App screenshot: static image in `static/brand-assets/` (needs to be created/provided)
- No JS interactivity beyond scroll — pure static content page
- SEO: proper meta tags, OG image, description
- Mobile responsive: stack columns, reduce font sizes, hide decorative floaters on mobile
