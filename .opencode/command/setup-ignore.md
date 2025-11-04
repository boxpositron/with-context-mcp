---
description: Setup .withcontextignore file for the project
agent: general
---

Create a `.withcontextignore` file in the current project root to configure which documentation files should be delegated to the Obsidian vault.

The .withcontextignore file controls which documentation files (like .md, .txt) are kept local vs delegated to your Obsidian vault via the with-context MCP server.

## Your task:

1. **Analyze the project structure** to understand what type of project this is (monorepo, library, web app, etc.)

2. **Read the template** from `.withcontextignore.template` in the with-context-mcp repository at: /Users/davidibia/Projects/MCP/with-context-mcp/.withcontextignore.template

3. **Create `.withcontextignore`** in the current working directory with appropriate patterns based on:
   - Project type (monorepo, library, app, etc.)
   - Existing directory structure (docs/, internal/, etc.)
   - Common patterns that make sense for this project

4. **Customize the patterns** by:
   - Keeping relevant sections from the template
   - Removing irrelevant sections
   - Adding project-specific patterns
   - Ensuring sensible defaults (node_modules, dist, build, etc. are ignored)

5. **Explain** what you created and why certain patterns were chosen

## Guidelines:

- Keep internal/private docs local (not delegated)
- Keep work-in-progress and drafts local
- Keep sensitive information local
- Delegate public-facing documentation to vault
- Ignore build output and generated files
- Use clear comments to explain patterns

The user may provide additional context like "$ARGUMENTS" to customize the setup further.
