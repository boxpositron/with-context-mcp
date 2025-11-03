# Agent Guidelines for with-context-mcp

## Build/Lint/Test Commands

- Build: `npm run build` (compiles TypeScript to dist/)
- Lint: `npm run lint` (check) or `npm run lint:fix` (auto-fix)
- Format: `npm run format` (write) or `npm run format:check` (check only)
- Test all: `npm test` or `npm run test:run` (single run)
- Test single file: `npx vitest tests/unit/config.test.ts` or `npx vitest run tests/unit/config.test.ts`
- Test with UI: `npm run test:ui`
- Coverage: `npm run test:coverage`

## Code Style

- **Imports**: Use `.js` extensions for local imports (e.g., `./config/index.js`), ES modules (Node16)
- **Formatting**: Single quotes, semicolons, 2 spaces, 100 char line width (Prettier config enforced)
- **Types**: Strict TypeScript (target ES2022), use Zod schemas for validation, explicit types preferred
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces, UPPER_CASE for constants
- **Error Handling**: Use McpError with ErrorCode for MCP tools, validate inputs with Zod schemas
- **Functions**: Async/await preferred, return JSON strings from tool handlers, no explicit return types required
- **Variables**: Prefix unused args with `_` (e.g., `_unusedParam`), destructure inputs early
- **Comments**: JSDoc for public APIs, inline for complex logic only
- **File Structure**: Export schemas and handlers together, separate concerns (tools/, security/, etc.)
