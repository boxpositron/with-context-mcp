---
description: Intelligently analyze and setup documentation architecture for the project
agent: general
---

# Intelligent Documentation Setup

**NEW in v2.1**: This command now uses intelligent analysis to understand your project and recommend optimal documentation architecture based on best practices!

## What This Command Does

This enhanced command performs a **4-phase intelligent analysis**:

### Phase 1: Repository Analysis

- Scans your project to identify all documentation files
- Detects project type (MCP server, library, monorepo, CLI, web app, etc.)
- Catalogs existing documentation patterns and folders
- Identifies framework (React, Next.js, Express, etc.)

### Phase 2: README Validation

- Analyzes README.md completeness and health (0-100 score)
- Validates all markdown links to ensure they won't break
- Checks for self-containment (README must work without vault access)
- Identifies missing sections (badges, quick start, installation, usage)
- **Ensures README links won't point to files that will move to vault**

### Phase 3: Intelligent Recommendations

- Recommends LOCAL vs VAULT delegation based on:
  - **Diátaxis framework** (tutorials, guides, reference, explanation)
  - Project type and structure
  - Best practices for documentation organization
- **LOCAL (Repository)**: Essential files that must work without vault
  - README.md, CONTRIBUTING.md, LICENSE, AGENTS.md
  - Inline code documentation (src/\*\*/\*.md)
  - Quick references and getting started guides
- **VAULT (Obsidian)**: Deep research and detailed exploration
  - Detailed guides and tutorials
  - Architecture Decision Records (ADRs)
  - Research notes and investigations
  - Meeting notes and explorations

### Phase 4: Configuration & Setup

- Creates intelligent `.withcontextconfig.jsonc` based on analysis
- Suggests vault folder structure (docs/guides, docs/architecture, etc.)
- Provides actionable next steps and README fixes
- Optionally creates recommended folder structure in vault

## Documentation Delegation Philosophy

### LOCAL = Essential & Quick Reference

**Purpose**: Files critical for onboarding and getting started, must work without vault

**Examples**:

- README.md - Project overview, badges, installation, quick start
- CONTRIBUTING.md - How to contribute
- LICENSE - Legal requirements
- src/\*\*/\*.md - Inline code documentation
- Quick reference guides (1-2 pages)

**Key Rule**: README must be **self-contained** - no broken links to vault files!

### VAULT = Deep Research & Exploration

**Purpose**: Detailed exploration, architecture decisions, research notes

**Examples**:

- docs/guides/\*\* - Detailed how-to guides (task-oriented)
- docs/tutorials/\*\* - Step-by-step learning paths (learning-oriented)
- docs/architecture/\*\* - Architecture docs and ADRs (understanding-oriented)
- docs/reference/\*\* - API documentation (information-oriented)
- docs/research/\*\* - Research notes and investigations
- CHANGELOG.md - Detailed change history

## Example Output

```
=== Intelligent Documentation Setup ===

✓ No existing configuration found

📊 Analyzing repository documentation...

=== Documentation Analysis ===

Project: my-awesome-project
Type: library
Total Docs: 15 files

✓ README.md (234 lines)
  Health Score: 75/100
  Links: 8 total
  ⚠ 2 warning(s)

=== README Health Report ===

Health Score: 75/100
✓ Has badges
⚠ Missing quick start section
✓ Has installation instructions
✓ Has usage examples
⚠ Has dependencies on vault content

Warnings:
  No quick start or getting started section found
  Found 1 broken or problematic link(s)
    Line 45: Link target will move to vault: docs/architecture/decisions.md

=== Documentation Architecture Recommendations ===

Project Type: library
Total Documentation Files: 15

Recommendations based on:
- Diátaxis framework (tutorials, guides, reference, explanation)
- Local = Essential (README, contributing, inline docs, quick reference)
- Vault = Deep Research (detailed guides, architecture, ADRs, explorations)
- README must be self-contained and work without vault access

⚠ README currently has dependencies on vault content - needs fixing

Keep LOCAL: 18 pattern(s)
Move to VAULT: 12 pattern(s)

Suggested vault folders:
  - docs/guides
  - docs/tutorials
  - docs/architecture/decisions

README changes needed:
  Fix 1 broken or problematic link(s):
    - Line 45: Remove or update link to "docs/architecture/decisions.md" (will move to vault)
  Add a "Quick Start" or "Getting Started" section

=== Next Steps ===

1. Review .withcontextconfig.jsonc and customize if needed
2. Fix README issues highlighted above
3. Apply recommended README changes:
   Fix broken link at line 45
   Add a "Quick Start" or "Getting Started" section
4. Use /sync-notes or /ingest-notes to migrate files to vault
5. Run /validate-config to ensure configuration is valid
```

## Your Task

When this command is run:

1. **Analyze the repository** using the intelligent documentation analyzer:
   - Scan for all documentation files
   - Identify project type and framework
   - Analyze README completeness and link validity
   - Generate recommendations based on best practices

2. **Present analysis report** showing:
   - Project type and documentation file count
   - README health score and warnings
   - Link validation results
   - Recommended LOCAL vs VAULT patterns
   - Suggested folder structure

3. **Validate README integrity**:
   - Check if README has all internal links valid
   - **Critical**: Ensure README doesn't link to files that will move to vault
   - Verify README is self-contained
   - Identify missing sections (badges, quick start, installation, usage)

4. **Create intelligent configuration**:
   - Generate `.withcontextconfig.jsonc` based on actual project analysis
   - Include project type and name in comments
   - Use recommended LOCAL and VAULT patterns from analysis
   - Follow Diátaxis framework principles

5. **Provide actionable recommendations**:
   - List specific README fixes needed
   - Suggest folder structure for vault
   - Guide user on next steps

## Configuration Format (v2.1.0)

The generated `.withcontextconfig.jsonc` will have:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/boxpositron/with-context-mcp/main/src/config/config-schema.json",

  // Configuration generated based on repository analysis
  // Project: [detected-project-name]
  // Type: [mcp-server|library|application|monorepo|cli]

  "version": "2.1",
  "defaultBehavior": "local",

  // Intelligent vault patterns based on analysis
  "vault": [
    // Patterns recommended based on your project structure
  ],

  // Intelligent local patterns based on analysis
  "local": [
    // Essential repository files and inline docs
  ],

  "conflictResolution": "local-wins",
}
```

## Best Practices Applied

The intelligent setup follows these frameworks and principles:

### Diátaxis Framework

- **Tutorials** (learning-oriented) → vault: docs/tutorials/
- **How-to guides** (task-oriented) → vault: docs/guides/
- **Reference** (information-oriented) → vault: docs/reference/, local: quick-ref.md
- **Explanation** (understanding-oriented) → vault: docs/architecture/

### Architecture Decision Records (ADRs)

- Store in `docs/architecture/decisions/` or `architecture/decisions/`
- Keep template: context, decision, consequences
- Use Michael Nygard's format

### README Best Practices

- Must be self-contained (works without vault)
- No broken links to vault-delegated files
- Has badges, installation, usage, quick start
- Links only to files that stay in repository

### Docs-as-Code

- Markdown format
- Version controlled
- Clear organization
- Consistent naming

## Guidelines for Agents

When running this command:

1. **Trust the analysis** - The intelligent engine has scanned the repo and knows what it found
2. **Prioritize README integrity** - Never allow broken links to vault files
3. **Follow LOCAL vs VAULT principles**:
   - LOCAL = Must work for someone cloning the repo
   - VAULT = Deep dives, research, explorations
4. **Apply recommendations** but allow user customization
5. **Provide specific, actionable feedback** (not generic suggestions)
6. **Reference actual files found** in the repository

## Migration from Legacy Format

If `.withcontextignore` exists:

- Automatically migrates to new `.withcontextconfig.jsonc` format
- Creates backup as `.withcontextignore.backup`
- Preserves pattern intent (negations become `local` patterns)

## Related Commands

- `/validate-config` - Validate configuration against schema
- `/preview-delegation` - Preview which files will be delegated
- `/sync-notes` - Bidirectional sync between local and vault
- `/ingest-notes` - Copy local documentation to vault
- `/teleport-notes` - Download documentation from vault to local

## Key Differences from Old Version

**Old behavior** (v2.0):

- Used generic template configuration
- No project analysis
- No README validation
- Manual pattern selection

**New behavior** (v2.1+):

- Intelligent analysis of actual project structure
- README health scoring and link validation
- Project-type-specific recommendations
- Ensures README self-containment
- Follows documentation best practices (Diátaxis, ADRs)
- Actionable, specific feedback

---

_The intelligent setup-notes uses the documentation analyzer to provide context-aware recommendations based on your actual repository structure and best practices._
