# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2024-11-09

### Added

#### Intelligent Documentation Analyzer

- **Repository Scanner** - Automatically detects project type (MCP server, library, monorepo, CLI, web app)
- **README Health Scoring** - Analyzes README completeness with 0-100 health score
- **Link Validation** - Validates all markdown links and prevents broken references to vault files
- **Smart Recommendations** - Generates context-aware LOCAL vs VAULT delegation patterns based on project analysis
- **Documentation Categorization** - Automatically categorizes docs (guides, tutorials, architecture, ADRs, research, etc.)

#### Enhanced Setup-Notes Command

- **4-Phase Intelligent Workflow**:
  1. Repository Analysis - Scans project structure and documentation
  2. README Validation - Checks completeness, links, and self-containment
  3. Intelligent Recommendations - Suggests optimal documentation architecture
  4. Configuration & Setup - Creates smart .withcontextconfig.jsonc
- **Diátaxis Framework Integration** - Organizes docs as tutorials, guides, reference, and explanation
- **Architecture Decision Records (ADR) Support** - Suggests ADR folder structure
- **README Self-Containment** - Ensures README works without vault dependencies
- **Actionable Feedback** - Provides specific fixes for README issues

#### Development & Quality

- **Pre-push Hook** - Automatically runs tests and build before pushing
- **OpenCode Configuration** - Enhanced with autoupdate, share, and instructions fields
- **AGENTS.md** - Simplified coding agent guidelines (from 137 to 34 lines)

### Changed

#### Documentation Delegation Philosophy

- **LOCAL (Repository)** - Essential files for onboarding and quick reference
  - README.md, CONTRIBUTING.md, LICENSE, AGENTS.md
  - Inline code documentation (src/\*\*/\*.md)
  - Quick reference guides
- **VAULT (Obsidian)** - Deep research and detailed exploration
  - Detailed guides and tutorials
  - Architecture documentation and ADRs
  - Research notes and investigations
  - Meeting notes

#### Configuration Format

- `.withcontextconfig.jsonc` now generated based on actual repository analysis
- Comments include detected project type and name
- Patterns tailored to project structure (not generic templates)

### Improved

- **README Documentation** - Comprehensive update for v2.1.0 features
- **Command Documentation** - Updated /setup-notes with intelligent analysis details
- **Code Formatting** - Standardized across codebase with Prettier
- **Type Safety** - Strict TypeScript throughout

### Removed

- **Legacy Configuration Files** - Removed .withcontextignore and .withcontextignore.template (migrated to new format)
- **Build Artifacts** - Removed plugin/dist/ from version control

### Fixed

- **Trailing Commas** - Fixed JSONC syntax in configuration files
- **Whitespace** - Normalized indentation (tabs to spaces)
- **Link Validation** - Prevents README from linking to files that will move to vault

### Technical Details

#### New Modules

- `src/doc-analyzer/types.ts` - Type definitions for analysis
- `src/doc-analyzer/repo-scanner.ts` - Project structure scanner
- `src/doc-analyzer/readme-analyzer.ts` - README validation and scoring
- `src/doc-analyzer/recommendation-engine.ts` - Intelligent recommendations
- `src/doc-analyzer/index.ts` - Orchestration layer

#### Dependencies

- Added `with-context-mcp@^2.1.0` to dependencies for plugin support
- Updated `glob@^11.0.3` for improved file scanning

#### Testing

- All 344 tests passing across 15 test files
- Pre-push hook ensures quality before pushing
- Test coverage maintained

### Documentation

#### Best Practices Applied

- **Diátaxis Framework** - Tutorials, guides, reference, explanation organization
- **ADR Pattern** - Architecture Decision Records support
- **Docs-as-Code** - Markdown format, version controlled, CI/CD integration
- **README Best Practices** - Self-contained, complete, valid links

### Migration Guide

#### From v2.0.x to v2.1.0

1. **Automatic Migration** - Legacy `.withcontextignore` files are automatically migrated
2. **New Configuration** - Review generated `.withcontextconfig.jsonc`
3. **README Validation** - Fix any link issues highlighted by the analyzer
4. **Folder Structure** - Consider adopting suggested vault folder structure

#### Breaking Changes

- None - Legacy format still supported via automatic migration

### Contributors

- David Ibia (@boxpositron)

---

## [2.0.2] - 2024-11-06

### Changed

- Read-before-write enforcement for existing files to prevent data loss
- Updated sync-notes and ingest-notes to comply with enforcement

### Fixed

- Data loss prevention in write operations

---

## [2.0.0] - 2024-11-02

### Added

- Initial release with .withcontextconfig.jsonc format
- Vault and local pattern arrays
- Conflict resolution strategies
- JSON schema support

---

[2.1.0]: https://github.com/boxpositron/with-context-mcp/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/boxpositron/with-context-mcp/compare/v2.0.0...v2.0.2
[2.0.0]: https://github.com/boxpositron/with-context-mcp/releases/tag/v2.0.0
