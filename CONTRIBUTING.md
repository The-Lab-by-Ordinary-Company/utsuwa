# Contributing to Utsuwa

Thank you for your interest in contributing to Utsuwa! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 22 or higher
- pnpm
- [Rust toolchain](https://rustup.rs/) (only needed for desktop app development)

### Development Setup

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
6. For desktop development, run `pnpm tauri dev` instead (requires Rust)

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Your environment (web or desktop, browser if web, OS, Node version)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please create an issue with:

- A clear description of the feature
- The problem it solves or use case it addresses
- Any implementation ideas you have

### Pull Requests

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
│   ├── docs/          # Documentation site routes
│   └── overlay/       # Desktop overlay route
└── app.css            # Global styles
src-tauri/              # Tauri desktop app (Rust)
```

## Questions?

If you have questions about contributing, feel free to open an issue for discussion.

## License

By contributing to Utsuwa, you agree that your contributions will be licensed under the MIT License.
