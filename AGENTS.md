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

## Documentation Delegation with with-context MCP

This project uses the with-context MCP server for documentation management. The `.withcontextignore` file controls which documentation files are delegated to the Obsidian vault vs kept in the local project.

### When to Use the MCP Server

**Always use with-context tools for:**

- Creating/updating user-facing documentation (guides, tutorials, API docs in vault)
- Managing changelogs and release notes for projects using this MCP server
- Writing architecture documentation meant for sharing with users
- Creating team-wide documentation and wikis for projects

**Keep local (don't delegate) for:**

- **Core project documentation** (`/README.md`, `/AGENTS.md`, `/CONTRIBUTING.md`) - part of repository structure
- **Plugin development** (`plugin/README.md`, `plugin/**/*.md`) - development documentation
- **Source code documentation** (`src/**/*.md`) - inline with source code
- **Test documentation** (`tests/**/*.md`) - inline with tests
- **Examples** (`examples/`, `**/examples/**`) - development reference
- **Template documentation** (`src/templates/README.md`) - development reference
- **Build artifacts** (`dist/`, `coverage/`, `**/*.d.ts`) - generated files
- **Configuration files** (`.env*`, `*.config.*`, `package.json`) - project config
- **Version control** (`.git/`, `.github/**`) - repository files
- **IDE files** (`.vscode/`, `.idea/`, `.opencode/`) - editor config
- **Work-in-progress** (`**/*.draft.md`, `**/*.wip.md`, `docs/wip/`) - draft documents
- **Sensitive information** (`**/confidential/**`, `docs/secrets/`) - private docs
- **Personal notes** (`notes/`, `scratch.md`, `todo.md`) - personal files
- **Temporary files** (`opencodetmp/`, `tmp/`, `temp/`) - temporary directories

### Best Practices

1. **Set project context first:**

   ```
   Use with-context to set project context to "with-context-mcp"
   ```

2. **Check delegation status** before creating docs:
   - Review `.withcontextignore` patterns to understand what will be delegated
   - Files matching patterns will stay local, others go to vault

3. **Use appropriate write modes:**
   - `create` - For new documentation files (fails if file exists)
   - `overwrite` - To replace existing documentation entirely
   - `append` - For changelogs and incremental updates

4. **Organize documentation logically:**
   - Use folder structure: `docs/api/`, `docs/guides/`, `docs/tutorials/`
   - Keep related docs together in the vault
   - Follow consistent naming conventions

5. **Leverage templates** when available:
   - Check available templates with `list_templates`
   - Use `create_from_template` for consistent documentation structure

### Common Patterns in .withcontextignore

Based on this project's configuration:

- **Root documentation**: Patterns like `/README.md`, `/AGENTS.md` keep core project docs local
- **Plugin docs**: Pattern `plugin/**/*.md` keeps plugin development docs local
- **Source/test docs**: Patterns like `src/**/*.md`, `tests/**/*.md` keep inline docs local
- **Examples**: Pattern `examples/`, `**/examples/**` keeps example files local
- **Build output**: Patterns like `dist/`, `**/*.d.ts` exclude generated files
- **Dependencies**: Pattern `node_modules/` excludes third-party docs
- **Drafts**: Patterns like `**/*.draft.md`, `docs/wip/` keep work-in-progress local
- **Config**: Patterns like `.env*`, `*.config.*` keep configuration local

### Example Workflows

**Creating user guide for projects using this MCP server:**

```
Use with-context to create docs/guides/getting-started.md with beginner setup instructions
```

**Updating project changelog:**

```
Use with-context to append today's changes to CHANGELOG.md
```

**Creating API documentation for users:**

```
Use with-context to create docs/api/tools-reference.md with API documentation
```

**Syncing documentation:**

```
Use with-context to sync notes between local project and vault
```

### Related Commands

If this project has OpenCode custom commands configured:

- `/setup-notes` - Setup/update .withcontextignore and this AGENTS.md section
- `/sync-notes` - Bidirectional sync between local and vault
- `/ingest-notes` - Copy local documentation to vault
- `/teleport-notes` - Download documentation from vault to local

### Important Notes for Agents

- **DO NOT** delegate core repository files (`README.md`, `LICENSE`, `AGENTS.md`, `CONTRIBUTING.md`)
- **DO NOT** delegate development documentation in `src/`, `tests/`, `plugin/`, `examples/`
- **DO NOT** delegate build output, configuration files, or temporary directories
- **DO** delegate user-facing documentation meant for projects using this MCP server
- **DO** check `.withcontextignore` patterns before deciding where to create documentation

For more information, see the with-context MCP documentation in the project README.
