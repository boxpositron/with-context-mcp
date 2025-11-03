# .withcontextignore Examples

This document provides real-world examples of `.withcontextignore` patterns for different project types and use cases.

## Table of Contents

- [Monorepo Projects](#monorepo-projects)
- [Internal Documentation](#internal-documentation)
- [Auto-Generated Documentation](#auto-generated-documentation)
- [Work in Progress](#work-in-progress)
- [Multi-Language Projects](#multi-language-projects)
- [Open Source Projects](#open-source-projects)

## Monorepo Projects

### Example 1: Turborepo/Nx Monorepo

Keep package-level documentation local while delegating shared docs to vault:

```gitignore
# .withcontextignore

# Keep package-level docs local
packages/*/README.md
packages/*/CHANGELOG.md
packages/*/docs/

# Keep app-level docs local
apps/*/README.md
apps/*/docs/

# But delegate shared documentation (negation)
!docs/
!*.md

# Keep specific root docs in vault
!/README.md
!/CONTRIBUTING.md
!/CODE_OF_CONDUCT.md
```

### Example 2: Lerna Monorepo

```gitignore
# .withcontextignore

# Ignore all package docs
packages/**/README.md
packages/**/CHANGELOG.md
packages/**/docs/

# But keep root-level docs in vault
!README.md
!CHANGELOG.md

# Keep architecture docs in vault
!docs/architecture/
!docs/guides/
```

## Internal Documentation

### Example 1: Separate Internal from Public Docs

```gitignore
# .withcontextignore

# Keep all internal documentation local
docs/internal/
docs/private/
**/internal/**
**/private/**

# Keep team-specific docs local
docs/team/
docs/decisions/
docs/adr/

# Everything else goes to vault (public docs)
```

### Example 2: Security-Sensitive Documentation

```gitignore
# .withcontextignore

# Never delegate sensitive docs
docs/security/
docs/credentials/
docs/secrets/
**/confidential/**

# Keep deployment docs local
docs/deployment/
docs/infrastructure/

# Delegate user-facing docs
!docs/api/
!docs/guides/
!docs/tutorials/
```

## Auto-Generated Documentation

### Example 1: TypeScript Project with TypeDoc

```gitignore
# .withcontextignore

# Don't delegate generated API docs
docs/api/generated/
docs/typedoc/
api-docs/

# Don't delegate build artifacts
dist/
build/
.next/

# Delegate hand-written documentation
!docs/guides/
!docs/tutorials/
!README.md
```

### Example 2: Storybook + Docusaurus Project

```gitignore
# .withcontextignore

# Auto-generated docs
storybook-static/
.docusaurus/
.storybook/generated/

# Component documentation (generated)
src/components/**/README.md

# Delegate manual documentation
!docs/
!README.md
!CONTRIBUTING.md
```

## Work in Progress

### Example 1: Keep Drafts Local

```gitignore
# .withcontextignore

# Work in progress
docs/wip/
docs/drafts/
**/*.draft.md
**/*.wip.md
**/*-draft.md
**/*-wip.md

# Personal notes
notes/
personal/
scratch.md
todo.md

# Delegate completed documentation
!docs/published/
!docs/final/
```

### Example 2: Review Process

```gitignore
# .withcontextignore

# Under review
docs/review/
**/*.review.md
**/*-review.md

# Pending approval
docs/pending/
**/*.pending.md

# Approved docs go to vault
!docs/approved/
!docs/published/
```

## Multi-Language Projects

### Example 1: Internationalization

```gitignore
# .withcontextignore

# Keep translation files local (managed by translation service)
docs/i18n/
docs/locales/
docs/**/translations/

# Keep English docs in vault
!docs/en/

# Delegate root-level English docs
!README.md
!CONTRIBUTING.md
```

### Example 2: Polyglot Repository

```gitignore
# .withcontextignore

# Keep language-specific package docs local
packages/python/docs/
packages/java/docs/
packages/ruby/docs/

# Delegate unified API documentation
!docs/api/
!docs/reference/

# Delegate getting started guides
!docs/getting-started/
!README.md
```

## Open Source Projects

### Example 1: Community vs Core Team Docs

```gitignore
# .withcontextignore

# Keep core team docs local
docs/team/
docs/internal/
docs/roadmap/
docs/decisions/

# Delegate community documentation
!docs/community/
!docs/contributing/
!docs/code-of-conduct/
!CONTRIBUTING.md
!CODE_OF_CONDUCT.md
```

### Example 2: Issue Templates and PR Templates

```gitignore
# .withcontextignore

# Don't delegate GitHub templates
.github/ISSUE_TEMPLATE/
.github/PULL_REQUEST_TEMPLATE/

# Don't delegate CI/CD docs
.github/workflows/docs/

# Delegate main documentation
!docs/
!README.md
!CONTRIBUTING.md
```

## Advanced Patterns

### Example 1: Version-Specific Documentation

```gitignore
# .withcontextignore

# Keep old versions local
docs/v1/
docs/v2/
docs/legacy/

# Delegate current version
!docs/v3/
!docs/latest/
!docs/current/
```

### Example 2: Platform-Specific Documentation

```gitignore
# .withcontextignore

# Keep platform-specific docs local (handled by platform teams)
docs/ios/internal/
docs/android/internal/
docs/web/internal/

# Delegate cross-platform documentation
!docs/shared/
!docs/api/
!docs/architecture/
```

### Example 3: Role-Based Documentation

```gitignore
# .withcontextignore

# Keep role-specific docs local
docs/backend-team/
docs/frontend-team/
docs/devops-team/

# Delegate shared documentation
!docs/onboarding/
!docs/standards/
!docs/best-practices/
!README.md
```

## Testing Your Patterns

After creating your `.withcontextignore` file, you can test it using the CLI commands:

```bash
# Check if a specific file will be delegated
npx with-context-mcp --check-delegation docs/guide.md

# Generate a full delegation report
npx with-context-mcp --delegation-report

# Create .withcontextignore from template
npx with-context-mcp --create-withcontextignore
```

## Tips and Best Practices

1. **Start Simple**: Begin with basic patterns and add complexity as needed
2. **Use Comments**: Document why certain patterns exist
3. **Test Patterns**: Use `--delegation-report` to verify your patterns work as expected
4. **Be Explicit**: Use negation patterns (`!`) to explicitly include files
5. **Avoid Over-Delegating**: Don't delegate files that change frequently or are build artifacts
6. **Version Control**: Commit your `.withcontextignore` file to your repository
7. **Team Alignment**: Discuss delegation strategy with your team

## Common Mistakes

❌ **Don't do this:**

```gitignore
# Too broad - delegates everything
*
!README.md
```

✅ **Do this instead:**

```gitignore
# Specific patterns
docs/
*.md
!README.md
!CONTRIBUTING.md
```

❌ **Don't do this:**

```gitignore
# Overly complex patterns
**/docs/**/internal/**/*.md
```

✅ **Do this instead:**

```gitignore
# Simple and clear
**/internal/**
```

## Pattern Precedence

Patterns are evaluated in order:

1. **Ignore patterns** are evaluated first
2. **Negation patterns** (`!`) override ignore patterns
3. **Later patterns** take precedence over earlier ones

Example:

```gitignore
# All markdown files ignored
*.md

# But these are included (negated)
!README.md
!CONTRIBUTING.md

# Unless they're in internal/ (later pattern wins)
internal/*.md
```

## Integration with CI/CD

Example GitHub Actions workflow that checks delegation:

```yaml
name: Check Documentation Delegation

on: [pull_request]

jobs:
  check-delegation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g with-context-mcp
      - run: npx with-context-mcp --delegation-report
```

## Additional Resources

- [with-context MCP Documentation](../README.md)
- [OpenCode Plugin Guide](../.opencode/plugin/README.md)
- [Glob Pattern Syntax](https://github.com/micromatch/micromatch#matching-features)
