---
description: Setup .withcontextignore file for the project
agent: general
---

Create a `.withcontextignore` file in the current project root to configure which documentation files should be delegated to the Obsidian vault.

The .withcontextignore file controls which documentation files (like .md, .txt) are kept local vs delegated to your Obsidian vault via the with-context MCP server.

## Template Reference

Use this template as the basis for creating the .withcontextignore file:

```
# .withcontextignore
#
# This file controls which documentation files are delegated to your Obsidian vault
# via the with-context MCP server.
#
# SYNTAX:
#   - One pattern per line
#   - Lines starting with # are comments
#   - Blank lines are ignored
#   - Use ! to negate a pattern (include files that would otherwise be ignored)
#   - Patterns use glob syntax (*, **, ?, [abc], etc.)
#   - Patterns starting with / match only at the project root
#   - Patterns ending with / match directories and all their contents
#
# HOW IT WORKS:
#   - Files matching patterns in this file will NOT be delegated to vault
#   - All other documentation files (.md, .txt, etc.) WILL be delegated
#   - Use this to keep certain docs local while delegating others
#
# EXAMPLES:
#   *.md              # Ignore all markdown files
#   !README.md        # But include README.md (negation)
#   docs/             # Ignore entire docs directory
#   /LICENSE          # Ignore LICENSE file at project root only
#   **/internal/**    # Ignore any internal subdirectory at any level

# -----------------------------------------------------------------------------
# COMMON PATTERNS FOR MONOREPOS
# -----------------------------------------------------------------------------

# Ignore package-level READMEs but keep root README
packages/*/README.md
!README.md

# Ignore package-level changelogs
packages/*/CHANGELOG.md

# Ignore internal documentation
packages/*/docs/internal/

# -----------------------------------------------------------------------------
# INTERNAL DOCUMENTATION
# -----------------------------------------------------------------------------

# Keep internal docs local, delegate public docs to vault
docs/internal/
docs/private/
**/internal/**
**/private/**

# Architecture Decision Records (ADRs) - often kept local
docs/adr/
docs/decisions/

# -----------------------------------------------------------------------------
# AUTO-GENERATED DOCUMENTATION
# -----------------------------------------------------------------------------

# API documentation generated from code
docs/api/generated/
api-docs/
**/generated-docs/

# TypeDoc output
docs/typedoc/

# JSDoc output
docs/jsdoc/

# Storybook documentation
storybook-static/

# -----------------------------------------------------------------------------
# BUILD & TOOL OUTPUT
# -----------------------------------------------------------------------------

# Don't delegate build artifacts (even if they're markdown)
dist/
build/
out/
.next/
.docusaurus/

# -----------------------------------------------------------------------------
# VERSION CONTROL & IDE
# -----------------------------------------------------------------------------

# Don't delegate git-related docs
.git/
.github/ISSUE_TEMPLATE/
.github/PULL_REQUEST_TEMPLATE/

# IDE-specific documentation
.vscode/docs/
.idea/docs/

# -----------------------------------------------------------------------------
# DEPENDENCIES
# -----------------------------------------------------------------------------

# Don't delegate node_modules documentation
node_modules/
vendor/

# -----------------------------------------------------------------------------
# EXAMPLES & TEMPLATES
# -----------------------------------------------------------------------------

# Uncomment these if you want to keep examples local:
# examples/
# samples/
# templates/

# Or keep specific example files local:
# docs/examples/draft-*.md
# docs/templates/*.template.md

# -----------------------------------------------------------------------------
# WORK IN PROGRESS
# -----------------------------------------------------------------------------

# Keep work-in-progress docs local
docs/wip/
docs/drafts/
**/*.draft.md
**/*.wip.md
**/*-draft.md

# -----------------------------------------------------------------------------
# SENSITIVE CONTENT
# -----------------------------------------------------------------------------

# Keep sensitive documentation local (never delegate)
docs/sensitive/
docs/credentials/
docs/secrets/
**/confidential/**

# -----------------------------------------------------------------------------
# PERSONAL NOTES
# -----------------------------------------------------------------------------

# Keep personal notes local
notes/
personal/
todo.md
scratch.md

# -----------------------------------------------------------------------------
# CUSTOM PATTERNS
# -----------------------------------------------------------------------------

# Add your custom patterns below:

```

## Your task:

1. **Analyze the project structure** to understand what type of project this is (monorepo, library, web app, etc.)

2. **Create `.withcontextignore`** in the current working directory with appropriate patterns based on:
   - Project type (monorepo, library, app, etc.)
   - Existing directory structure (docs/, internal/, etc.)
   - Common patterns that make sense for this project

3. **Customize the patterns** by:
   - Keeping relevant sections from the template above
   - Removing irrelevant sections
   - Adding project-specific patterns
   - Ensuring sensible defaults (node_modules, dist, build, etc. are ignored)

4. **Explain** what you created and why certain patterns were chosen

## Guidelines:

- Keep internal/private docs local (not delegated)
- Keep work-in-progress and drafts local
- Keep sensitive information local
- Delegate public-facing documentation to vault
- Ignore build output and generated files
- Use clear comments to explain patterns

The user may provide additional context like "$ARGUMENTS" to customize the setup further.
