---
description: Setup .withcontextconfig.jsonc for the project
agent: general
---

Create a `.withcontextconfig.jsonc` file in the current project root to configure which documentation files should be delegated to the Obsidian vault.

The .withcontextconfig.jsonc file provides fine-grained control over which documentation files (like .md, .txt) are kept local vs delegated to your Obsidian vault via the with-context MCP server.

## What This Command Does

This command will:

1. **Check for existing configurations** (both new `.withcontextconfig.jsonc` and legacy `.withcontextignore`)
2. **Create new configuration** in `.withcontextconfig.jsonc` format (v2.1.0)
3. **Migrate legacy configs** automatically if `.withcontextignore` exists
4. **Create vault folder structure** (optional) with organized documentation folders
5. **Update AGENTS.md** with documentation delegation guidelines for AI agents

## Configuration Format (v2.1.0)

The new JSONC format provides explicit control with these fields:

- **`version`**: Must be `"2.1"` for current format
- **`defaultBehavior`**: `"local"` (safer) or `"vault"` for unmatched files
- **`vault`**: Array of glob patterns for files to delegate to Obsidian
- **`local`**: Array of glob patterns for files to keep in project
- **`conflictResolution`**: How to handle conflicts - `"local-wins"` (recommended), `"vault-wins"`, `"most-specific-wins"`, or `"error"`

## Template Reference

Use this template as the basis for creating the .withcontextconfig.jsonc file:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/boxpositron/with-context-mcp/main/src/config/config-schema.json",

  // Configuration format version
  "version": "2.1",

  // Default behavior for files not matching any patterns
  // "local" = keep in project (safer default)
  // "vault" = delegate to Obsidian vault
  "defaultBehavior": "local",

  // Patterns for files to delegate to Obsidian vault
  // These are documentation files you want to manage in your vault
  "vault": ["docs/**/*.md", "guides/**/*.md", "tutorials/**/*.md", "CHANGELOG.md"],

  // Patterns for files to keep in local project
  // These stay in your repository and won't be synced to vault
  "local": [
    // Core repository documentation
    "/README.md",
    "/CONTRIBUTING.md",
    "/AGENTS.md",
    "/LICENSE",

    // Development documentation
    "src/**/*.md",
    "tests/**/*.md",
    "examples/**/*.md",

    // Build output and dependencies
    "dist/**",
    "node_modules/**",
    "build/**",
    "coverage/**",

    // Configuration files
    ".env*",
    "*.config.*",
    "package.json",
    "tsconfig.json",

    // Version control and IDE
    ".git/**",
    ".github/**",
    ".vscode/**",
    ".idea/**",

    // Work in progress
    "**/*.draft.md",
    "**/*.wip.md",
    "docs/wip/**",
  ],

  // How to handle conflicts when file matches both vault and local patterns
  // "local-wins" = prefer keeping files local (safer)
  // "vault-wins" = prefer delegating to vault
  // "most-specific-wins" = use most specific pattern match
  // "error" = throw error on conflict
  "conflictResolution": "local-wins",
}
```

## Pattern Syntax

Uses glob patterns for flexible matching:

```jsonc
{
  "vault": [
    "docs/", // Entire directory
    "*.md", // All markdown files at any level
    "/LICENSE", // Root-only pattern
    "**/internal/**", // Match at any level
    "guides/**/*.md", // Nested patterns
  ],
  "local": [
    "README.md", // Specific file
    "src/**/*.md", // All markdown in src/
    "**/*.draft.md", // All draft files
  ],
}
```

## Your Task:

1. **Analyze the project structure** to understand what type of project this is (monorepo, library, web app, MCP server, etc.)

2. **Create `.withcontextconfig.jsonc`** in the current working directory with appropriate patterns based on:
   - Project type (monorepo, library, app, MCP server, etc.)
   - Existing directory structure (docs/, internal/, plugin/, src/, etc.)
   - Common patterns that make sense for this project
   - Recommended defaults (node_modules, dist, build, etc. stay local)

3. **Customize the patterns** by:
   - Keeping relevant sections from the template above
   - Removing irrelevant sections
   - Adding project-specific patterns
   - Using `"vault"` array for docs you want in Obsidian
   - Using `"local"` array for docs that stay in the repository
   - Setting appropriate `conflictResolution` strategy

4. **Handle existing configs**:
   - If `.withcontextconfig.jsonc` exists, note it (unless force=true)
   - If legacy `.withcontextignore` exists, migrate it automatically
   - Create backup of legacy config as `.withcontextignore.backup`

5. **Optionally create vault folder structure** with organized directories:
   - `docs/api/` - API documentation and references
   - `docs/guides/` - User guides and how-tos
   - `docs/tutorials/` - Step-by-step tutorials
   - `docs/architecture/` - Architecture decisions
   - `development/` - Development notes
   - `research/` - Research notes
   - `meetings/` - Meeting notes

6. **Update AGENTS.md** with documentation delegation guidelines:
   - Check if AGENTS.md exists in the current working directory
   - Add or update "Documentation Delegation" section
   - Include project-specific patterns and examples
   - Teach AI agents when to use with-context tools vs local filesystem

7. **Explain** what you created and why certain patterns were chosen

## Example Configurations

### TypeScript Library/MCP Server

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "local",
  "vault": ["docs/guides/**", "docs/tutorials/**", "CHANGELOG.md"],
  "local": [
    "/README.md",
    "/AGENTS.md",
    "src/**/*.md",
    "tests/**/*.md",
    "plugin/**",
    "examples/**",
    "dist/**",
    "node_modules/**",
  ],
  "conflictResolution": "local-wins",
}
```

### Monorepo

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "local",
  "vault": ["docs/**/*.md", "packages/*/CHANGELOG.md"],
  "local": [
    "packages/*/README.md",
    "packages/*/docs/**",
    "**/internal/**",
    "dist/**",
    "node_modules/**",
  ],
  "conflictResolution": "most-specific-wins",
}
```

### Web Application

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "local",
  "vault": ["docs/user-guides/**", "docs/api/**", "CHANGELOG.md", "ROADMAP.md"],
  "local": ["/README.md", "src/**", "public/**", ".next/**", "dist/**", "**/*.draft.md"],
  "conflictResolution": "local-wins",
}
```

## AGENTS.md Template

When creating or updating the AGENTS.md file, add this section for documentation delegation:

```markdown
## Documentation Delegation with with-context MCP

This project uses the with-context MCP server for documentation management. The `.withcontextconfig.jsonc` file controls which documentation files are delegated to the Obsidian vault vs kept in the local project.

### Configuration Format (v2.1.0)

The project uses `.withcontextconfig.jsonc` with:

- **`vault` patterns**: Files to delegate to Obsidian (e.g., `docs/**/*.md`)
- **`local` patterns**: Files to keep in repository (e.g., `README.md`, `src/**`)
- **`conflictResolution`**: Strategy for handling pattern conflicts
- **`defaultBehavior`**: What to do with unmatched files

### When to Use the MCP Server

**Always use with-context tools for:**

- Creating/updating user-facing documentation (guides, tutorials, API docs)
- Managing changelogs and release notes
- Writing architecture documentation meant for sharing
- Creating team-wide documentation and wikis

**Keep local (don't delegate) for:**

- Core repository files (README.md, AGENTS.md, CONTRIBUTING.md, LICENSE)
- Development documentation inline with code (src/**/\*.md, tests/**/\*.md)
- Build artifacts and dependencies (dist/, node_modules/)
- Configuration files (.env*, *.config.\*, package.json)
- Work-in-progress documents (**/\*.draft.md, **/\*.wip.md)
- Sensitive information (**/confidential/**, docs/secrets/)

### Best Practices

1. **Set project context first:**
```

Use with-context to set project context to "project-name"

```

2. **Check delegation status** before creating docs:
- Review `.withcontextconfig.jsonc` patterns
- Files matching `vault` patterns go to Obsidian
- Files matching `local` patterns stay in repository
- Use `preview_delegation` tool to check specific files

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

### Example Workflows

**Creating a new feature guide:**
```

Use with-context to create docs/guides/new-feature.md with content explaining the feature

```

**Updating the changelog:**
```

Use with-context to append today's changes to CHANGELOG.md

```

**Syncing documentation:**
```

Use with-context to sync notes between local project and vault

```

### Related Commands

- `/setup-notes` - Setup/update .withcontextconfig.jsonc and AGENTS.md
- `/sync-notes` - Bidirectional sync between local and vault
- `/ingest-notes` - Copy local documentation to vault
- `/teleport-notes` - Download documentation from vault to local

### Configuration Tools

- `setup_notes` - Create/migrate configuration and vault structure
- `migrate_config` - Migrate from legacy .withcontextignore format
- `validate_config` - Validate configuration against schema
- `preview_delegation` - Preview which files will be delegated

For more information, see the with-context MCP documentation.
```

## Guidelines:

- **Prefer `local` patterns** for repository structure files (README, CONTRIBUTING, LICENSE)
- **Use `vault` patterns** for user-facing documentation and guides
- **Keep development docs local** (src/**/\*.md, tests/**/\*.md)
- **Keep sensitive info local** (**/confidential/**, docs/secrets/)
- **Keep drafts local** (**/\*.draft.md, **/\*.wip.md, docs/wip/)
- **Ignore build output** (dist/, build/, node_modules/)
- **Use clear comments** in the JSONC file to explain pattern choices
- **Set `conflictResolution`** based on project needs (usually `"local-wins"`)
- **Ensure AGENTS.md section** is clear and actionable for AI agents
- **Include examples** relevant to the specific project type

## Migration from Legacy Format

If the project has a legacy `.withcontextignore` file:

1. The tool will automatically migrate patterns to new format
2. Negation patterns (!) become `local` patterns
3. Positive patterns remain as `local` patterns (legacy format was opt-out)
4. A backup is created as `.withcontextignore.backup`
5. Review and customize the generated config

The user may provide additional context like "$ARGUMENTS" to customize the setup further.
