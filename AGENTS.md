# Agent Guidelines for with-context-mcp

## Project Overview

TypeScript MCP server for project-scoped note management (Obsidian, etc). Uses ES modules, Vitest for testing, strict TypeScript.

## Documentation & Research

**Use the vault for implementation planning and research:**

When working on features, bugs, or tests, create notes in the vault instead of the repo:

```javascript
// Research and plan implementations
write_note({
  path: 'dev/features/fuzzy-search-implementation.md',
  content: '# Fuzzy Search Implementation\n\n## Research...',
});

// Document test strategies
write_note({
  path: 'dev/testing/prepend-mode-test-plan.md',
  content: '# Prepend Mode Test Plan\n\n## Test Cases...',
});

// Track bugs and investigations
write_note({
  path: 'dev/bugs/path-traversal-investigation.md',
  content: '# Path Traversal Bug\n\n## Analysis...',
});
```

**Benefits:**

- Persistent across sessions
- Searchable and linkable
- Organized with other project docs
- Doesn't clutter the repo
- Easy to reference in future work

**Vault structure for development:**

```
Projects/with-context-mcp/
├── docs/           (public documentation)
├── dev/            (implementation notes)
│   ├── features/   (feature research & planning)
│   ├── bugs/       (bug investigations)
│   ├── testing/    (test strategies)
│   └── research/   (API research, decisions)
└── meetings/       (if needed)
```

## Build & Test Commands

- `npm run build` - Compile TypeScript to dist/
- `npm run dev` - Run in dev mode with tsx
- `npm run lint` - Lint with ESLint (fixes with `npm run lint:fix`)
- `npm run format` - Format with Prettier (check with `npm run format:check`)
- `npm test` - Run all tests in watch mode
- `npm run test:run` - Run tests once (for CI)
- `vitest run tests/unit/config-parser.test.ts` - Run a single test file
- `npm run test:coverage` - Generate coverage report

## Code Style

**Imports**: Use `.js` extensions for local imports (ES modules). Group: external deps, then local imports with blank line between.

**Formatting**: Prettier enforces: 2 spaces, single quotes, semicolons, 100 char line width, trailing commas (ES5), LF line endings.

**Types**: Strict TypeScript enabled. Use Zod schemas for input validation. Prefix unused vars with `_`. Avoid `any` (warn only). No explicit return types required.

**Naming**: camelCase for functions/variables, PascalCase for classes/types, UPPER_SNAKE_CASE for constants. Descriptive names (e.g., `sanitizedPath`, `writeNoteSchema`).

**Error Handling**: Use custom error classes (e.g., `ObsidianApiError`, `ConfigurationError`). Handle axios errors with type guards. Validate inputs with Zod before processing.

**Architecture**: Tools export Zod schema + handler function. Clients use axios with interceptors. Session state tracks read-before-write enforcement. Path security via `sanitizePath()`.

## Key Patterns

- Read-before-write enforcement for existing files (see `ObsidianClient.writeNote`)
- Project context resolution via `sessionState.getProjectContext()`
- Custom error types for API failures (connection, auth, not found)
- JSDoc comments for public APIs with `@param` and `@returns`
