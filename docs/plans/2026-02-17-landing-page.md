# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a marketing landing page at `/` and move the live app to `/app`.

**Architecture:** Move the `(app)` layout group to a real `/app` path segment, update all internal links, then create a standalone landing page at the root. The landing page is a single Svelte component with Tailwind utility classes, forced dark mode, and the existing brand palette (pink accent, dark backgrounds).

**Tech Stack:** SvelteKit, Tailwind CSS, existing CSS variables from `app.css`

---

### Task 1: Move route files from `(app)/` to `app/`

**Files:**
- Move: `src/routes/(app)/+page.svelte` → `src/routes/app/+page.svelte`
- Move: `src/routes/(app)/+layout.svelte` → `src/routes/app/+layout.svelte`
- Move: `src/routes/(app)/settings/` → `src/routes/app/settings/` (entire directory)
- Delete: `src/routes/(app)/` (empty directory after moves)

**Step 1: Create the `app/` directory and move files**

```bash
mkdir -p src/routes/app
mv src/routes/'(app)'/+page.svelte src/routes/app/+page.svelte
mv src/routes/'(app)'/+layout.svelte src/routes/app/+layout.svelte
mv src/routes/'(app)'/settings src/routes/app/settings
rmdir src/routes/'(app)'
```

**Step 2: Verify the structure**

```bash
ls -la src/routes/app/
ls -la src/routes/app/settings/
```

Expected: `+page.svelte`, `+layout.svelte`, and `settings/` directory with its contents.

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: move (app) route group to /app path"
```

---

### Task 2: Update all internal links to `/app/settings`

**Files:**
- Modify: `src/routes/app/settings/+layout.svelte` — nav hrefs and back button
- Modify: `src/routes/app/settings/+page.svelte` — goto redirect
- Modify: `src/routes/app/settings/developer/+page.svelte` — goto after data wipe
- Modify: `src/lib/components/ui/CompanionStatus.svelte` — profile link
- Modify: `src/lib/components/layout/Header.svelte` — goto calls and logo link
- Modify: `src/lib/components/ui/TopRightButtons.svelte` — settings button

**Step 1: Update `src/routes/app/settings/+layout.svelte`**

Change nav hrefs from `/settings/*` to `/app/settings/*`:
```
{ href: '/settings/persona' → { href: '/app/settings/persona'
{ href: '/settings/display' → { href: '/app/settings/display'
{ href: '/settings/data' → { href: '/app/settings/data'
{ href: '/settings/developer' → { href: '/app/settings/developer'
```

Change back button from `href="/"` to `href="/app"`.

**Step 2: Update `src/routes/app/settings/+page.svelte`**

Change `goto('/settings/persona')` to `goto('/app/settings/persona')`.

**Step 3: Update `src/routes/app/settings/developer/+page.svelte`**

Change `goto('/')` to `goto('/app')`.

**Step 4: Update `src/lib/components/ui/CompanionStatus.svelte`**

Change `href="/settings/persona"` to `href="/app/settings/persona"`.

**Step 5: Update `src/lib/components/layout/Header.svelte`**

Change:
- `goto('/settings/vrm')` → `goto('/app/settings/vrm')`
- `goto('/settings/relationship')` → `goto('/app/settings/relationship')`
- `goto('/settings')` → `goto('/app/settings')`
- `href="/"` (logo) → `href="/app"`

**Step 6: Update `src/lib/components/ui/TopRightButtons.svelte`**

Change `goto('/settings')` to `goto('/app/settings')`.

**Step 7: Update docs "Try Live" links**

These point users to the live app, so update them:
- `src/routes/docs/+page.svelte`: `href="/"` → `href="/app"`
- `src/lib/components/docs/DocsHeader.svelte`: `href="/"` → `href="/app"`

**Step 8: Update root layout Tauri link intercept**

`src/routes/+layout.svelte` line 31: The Tauri link interception for `/docs` and `/blog` is fine as-is. No change needed.

**Step 9: Verify no remaining stale references**

```bash
grep -r '"/settings' src/ --include="*.svelte" --include="*.ts"
grep -r "'/settings" src/ --include="*.svelte" --include="*.ts"
```

Expected: No matches outside of `src/routes/app/settings/` internal references.

**Step 10: Run lint and typecheck**

```bash
npm run lint
npm run typecheck
```

**Step 11: Commit**

```bash
git add -A
git commit -m "refactor: update all internal links for /app route"
```

---

### Task 3: Create landing page — Nav + Hero section

**Files:**
- Create: `src/routes/+page.svelte` — landing page

**Step 1: Create the landing page file**

Create `src/routes/+page.svelte` with:
- `<svelte:head>` with SEO meta tags (title, description, OG tags)
- A wrapping `<div class="dark">` to force dark mode styling
- Nav bar: Utsuwa wordmark (left), nav links (Features, Docs, Blog, GitHub), "Try Live" CTA button (right)
- Hero section: Pink-to-purple-to-dark gradient background, app icon, "Utsuwa" heading, subtitle, 3 CTA buttons (Try Live → `/app`, Download → GitHub releases, Docs → `/docs`), static screenshot placeholder, glass-panel decorative floaters

Use Tailwind utility classes. Match the reference layout structure:
- Nav: `max-w-7xl mx-auto`, `flex items-center justify-between`, pill CTA button
- Hero: centered content, large heading, button row, screenshot in rounded card
- Decorative floaters: `glass-panel` class with backdrop blur, absolute positioned, hidden on mobile
- Gradient: `bg-gradient-to-b from-[#f472b6] via-[#8b5cf6] to-[#0a0a0a]`

For the screenshot area, use the existing `static/brand-assets/thumbnail.png` as a placeholder. A proper screenshot can be swapped in later.

**Step 2: Verify it renders**

```bash
npm run dev
```

Open `http://localhost:5173/` — should show the landing page. Open `http://localhost:5173/app` — should show the live app.

**Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add landing page nav and hero section"
```

---

### Task 4: Add feature callout sections

**Files:**
- Modify: `src/routes/+page.svelte`

**Step 1: Add Feature A — "Meet your AI companion"**

Below the hero, add a dark background section (`bg-[#0a0a0a]`) with:
- Centered large heading
- 2-column grid (`lg:grid-cols-2`): left = screenshot placeholder in a styled card (rounded, border, shadow), right = badge pill + heading + description paragraph
- Badge: inline-flex pill with icon, like the reference's "Ask ChatGPT" badge
- Description: VRM model viewer, 3D speech bubbles, expressions, orbit controls

**Step 2: Add Feature B — "She remembers"**

Same pattern, columns reversed (`order-2 lg:order-1` / `order-1 lg:order-2`):
- Left: badge + heading + description about semantic memory, relationship stages, mood, companion system
- Right: placeholder for memory graph or companion UI screenshot

**Step 3: Add Feature C — "Your voice, her ears"**

Same pattern, columns normal order:
- Left: placeholder for chat UI screenshot
- Right: badge + heading + description about 7 LLM providers, voice input, TTS, lip-sync

**Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add feature callout sections to landing page"
```

---

### Task 5: Add feature grid, CTA, and footer

**Files:**
- Modify: `src/routes/+page.svelte`

**Step 1: Add the "More features" grid**

Section with heading, 3-column grid (`md:grid-cols-3`):
1. **Desktop Overlay** — monitor icon SVG, title, description
2. **Local-First** — database icon SVG, title, description
3. **Open Source** — code icon SVG, title, description

Cards: `bg-black border border-white/10 rounded-2xl`, hover effect `group-hover:border-white/20`

**Step 2: Add the final CTA section**

Light pink gradient section (`bg-gradient-to-br from-[#f472b6] to-[#ec4899]`):
- Larger app icon
- "Download Utsuwa" heading
- 3 CTA buttons (same as hero)
- Platform disclaimer text

**Step 3: Add the footer**

Dark footer (`bg-[#171717]`):
- Utsuwa SVG logo (use from `static/brand-assets/logo.svg`)
- Link columns: Project (GitHub, Releases, Docs, Blog), Links (MIT License)
- Giant "Utsuwa" text at bottom, `text-[17vw]`, partially clipped with `translate-y-[12%]`
- Bottom bar: copyright, GitHub icon link

**Step 4: Add the `<style>` block**

Add the `glass-panel` class definition (from the reference) in a `<style>` block at the bottom:

```css
.glass-panel {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
}
```

**Step 5: Verify full page**

```bash
npm run dev
```

Scroll through the full landing page at `/`. Check mobile responsiveness at 375px width.

**Step 6: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add feature grid, CTA section, and footer to landing page"
```

---

### Task 6: Lint, typecheck, and final verification

**Files:**
- All modified files

**Step 1: Run lint**

```bash
npm run lint
```

Fix any issues.

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Fix any type errors.

**Step 3: Verify all routes work**

- `/` — landing page renders with all sections
- `/app` — live app loads correctly
- `/app/settings/persona` — settings navigate correctly
- `/docs` — docs still work
- `/blog` — blog still works
- Settings "Back" button goes to `/app`
- All "Try Live" links point to `/app`

**Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: lint and typecheck fixes for landing page"
```
