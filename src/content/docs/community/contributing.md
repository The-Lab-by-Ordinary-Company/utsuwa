---
title: Contributing
description: How to contribute to the Utsuwa project.
---

# Contributing

Contributions to Utsuwa are welcome. This page covers how to get set up and submit changes.

## Prerequisites

- Node.js 22 or higher
- pnpm

## Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/utsuwa.git
   cd utsuwa
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```
5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Reporting Bugs

If you find a bug, create an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (browser, OS, Node version)
- Screenshots if applicable

## Suggesting Features

Feature requests are welcome. Create an issue with:

- A clear description of the feature
- The problem it solves or use case it addresses
- Any implementation ideas you have

## Pull Requests

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Ensure your code follows the project's style:
   ```bash
   pnpm lint
   ```
4. Test your changes thoroughly
5. Commit your changes with a clear message
6. Push to your fork and submit a pull request

## Code Style

- Use TypeScript for all new code
- Follow the existing code patterns in the project
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactivity
- Keep components focused and single-purpose
- Write self-documenting code with clear variable and function names

## Project Structure

```
src/
├── lib/
│   ├── ai/            # LLM response parsing and prompt building
│   ├── assets/        # Static assets (images, etc.)
│   ├── components/    # Reusable Svelte components
│   ├── config/        # App and docs configuration
│   ├── data/          # Event definitions and static data
│   ├── db/            # IndexedDB database (Dexie)
│   ├── engine/        # Companion engine (state, memory, events, heuristics)
│   ├── services/      # LLM, TTS, and storage services
│   ├── stores/        # Svelte 5 stores for state management
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── content/
│   └── docs/          # Documentation site markdown content
├── routes/
│   ├── (app)/         # Main application routes
│   ├── api/           # API routes
│   └── docs/          # Documentation site routes
└── app.css            # Global styles
```

## License

By contributing to Utsuwa, you agree that your contributions will be licensed under the MIT License.
