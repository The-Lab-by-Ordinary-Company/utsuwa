# Docs Search Design

## Overview

Add client-side search to the documentation site using Pagefind.

## Architecture

**How Pagefind works:**

1. At build time (`pnpm build`), Pagefind indexes all rendered HTML in the `build/` directory
2. It generates a search index (~10-50KB) in `build/pagefind/`
3. At runtime, Pagefind JS loads the index and handles search entirely client-side

**Integration points:**

- Add `pagefind` as a dev dependency
- Add postbuild script: `"postbuild": "pagefind --site build"`
- Create `DocsSearch.svelte` component wrapping Pagefind's API
- Add component to `DocsHeader.svelte` (desktop) and `DocsSidebar.svelte` (mobile)
- Register Cmd/Ctrl+K listener in docs layout

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/lib/components/docs/DocsSearch.svelte` | New component |
| `src/lib/components/docs/DocsHeader.svelte` | Add search |
| `src/lib/components/docs/DocsSidebar.svelte` | Add search on mobile |
| `src/routes/docs/+layout.svelte` | Keyboard shortcut |
| `package.json` | Add pagefind, postbuild script |

## Component Behavior

**DocsSearch.svelte:**

- Text input with search icon and "Cmd+K" hint badge
- On focus or typing, loads Pagefind JS dynamically (lazy load)
- Results appear in dropdown panel below input
- Each result shows: page title, matched text snippet with highlights
- Click result or Enter to navigate
- Escape closes dropdown
- Arrow keys navigate results

**Responsive behavior:**

- Desktop: Search in header, ~300px width
- Mobile (<768px): Search hidden in header, appears at top of sidebar when open
- Same component, different render locations based on breakpoint

**Keyboard shortcut (Cmd/Ctrl+K):**

- Registered at layout level
- Focuses visible search input
- On mobile with closed sidebar, opens sidebar first

## Styling

- Uses existing `--docs-*` CSS variables
- Dropdown has subtle shadow, matches surface/border colors
- Highlighted match text uses `--docs-accent`

## Pagefind Configuration

- Add `data-pagefind-body` to docs content area to scope indexing
- Prevents indexing header, sidebar, footer

## States

| State | Display |
|-------|---------|
| Empty | Placeholder "Search docs..." |
| Loading Pagefind | "Loading..." in dropdown (first search only) |
| No results | "No results for [query]" |
| Results | Max 8 results, snippets ~100 chars |

## Dev Mode

Pagefind only works after build. During `pnpm dev`, show graceful fallback: "Search available in production build"
