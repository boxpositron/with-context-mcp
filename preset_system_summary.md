# Vault Organization Preset System - Executive Summary

## Overview

A preset system that simplifies vault organization by providing pre-configured strategies for common organization patterns. Users can select a preset instead of manually creating complex `OrganizationPlan` objects.

## Current vs. Proposed Workflow

### Current (Manual)

```typescript
// 1. Analyze vault
const analysis = await analyzeVaultStructure({ project_folder: 'my-project' });

// 2. Manually create complex plan with suggestions
const plan = {
  suggestions: [
    {
      type: 'move',
      currentPath: 'loose-note.md',
      suggestedPath: 'docs/loose-note.md',
      reason: 'File appears to be documentation',
      confidence: 0.85,
      impact: {
        /* manual calculation */
      },
    },
    // ... dozens more manual suggestions
  ],
  estimatedImpact: {
    /* manual calculation */
  },
};

// 3. Execute
const result = await reorganizeNotes({ plan, dry_run: false });
```

### Proposed (With Presets)

```typescript
// 1. Analyze vault (can be cached)
const analysis = await analyzeVaultStructure({ project_folder: 'my-project' });

// 2. Generate plan with preset
const plan = await generateOrganizationPlan({
  project_folder: 'my-project',
  preset_id: 'clean',
  min_confidence: 0.8,
});

// 3. Execute
const result = await reorganizeNotes({ plan, dry_run: false });
```

## Key Benefits

1. **Simplicity**: One-line preset selection vs. manual plan creation
2. **Consistency**: Battle-tested organization patterns
3. **Flexibility**: Can override preset defaults and add custom rules
4. **Discovery**: Users can explore available presets
5. **Safety**: Inherits all existing safety features (dry-run, rollback, confidence thresholds)

## Architecture

```
src/vault-organizer/
├── presets/
│   ├── types.ts           # Preset type definitions
│   ├── registry.ts        # Preset management
│   ├── generator.ts       # Plan generation from presets
│   └── presets/           # Built-in presets
│       ├── clean.ts
│       ├── minimal.ts
│       ├── docs-as-code.ts
│       ├── research.ts
│       └── project-hub.ts

src/tools/
└── generate-organization-plan.ts  # New MCP tool
```

## Built-in Presets

### 1. Clean (Flagship)

**Purpose**: Move all documentation to vault, keep essential files local

**Folder Structure**:

- `docs/` - Core documentation (architecture, guides, api, reference)
- `planning/` - Project planning (roadmaps, specs, decisions)
- `meetings/` - Meeting notes organized by year
- `research/` - Research notes and experiments
- `changelog/` - Project history
- `archive/` - Deprecated content

**Essential Local Files**: README.md, AGENTS.md, LICENSE, configs

**Use Cases**: General purpose, knowledge management, extensive documentation

### 2. Minimal

**Purpose**: Keep everything local, only move meetings and large docs to vault

**Use Cases**: Small projects, docs-as-code workflow, minimal vault usage

### 3. Docs-as-Code

**Purpose**: Mirror repository structure in vault

**Use Cases**: Teams following docs-as-code principles, established folder structures

### 4. Research

**Purpose**: Heavy vault usage for research projects

**Folder Structure**:

- `literature/` - Papers and articles
- `experiments/` - Experiment notes
- `theories/` - Theoretical explorations
- `findings/` - Research results
- `daily-notes/` - Research logs

**Use Cases**: Academic work, exploratory development, heavy note-takers

### 5. Project Hub

**Purpose**: Centralized project management

**Folder Structure**:

- `active/current-sprint/` - Active sprint work
- `sprints/` - Sprint retrospectives
- `stakeholders/` - Stakeholder communications
- `backlog/` - Feature backlog
- `completed/` - Completed work

**Use Cases**: Multi-team projects, product management, Agile/Scrum workflows

## "Clean" Preset Deep Dive

### Placement Rules (Priority Order)

1. **Architecture Documentation** (Priority: 100)
   - Matcher: Path/name contains "architecture", "design", "adr-"
   - Target: `docs/architecture/`
   - Confidence: 0.9

2. **API Documentation** (Priority: 95)
   - Matcher: Name contains "api", "endpoint", "swagger"
   - Target: `docs/api/`
   - Confidence: 0.95

3. **Guides and Tutorials** (Priority: 90)
   - Matcher: Name contains "guide", "tutorial", "howto"
   - Target: `docs/guides/`
   - Confidence: 0.9

4. **Meeting Notes** (Priority: 85)
   - Matcher: Path contains "meeting" OR has date pattern
   - Target: `meetings/{YEAR}/`
   - Confidence: 0.85

5. **Planning Documents** (Priority: 80)
   - Matcher: Contains "roadmap", "plan", "spec"
   - Target: `planning/roadmaps/`, `planning/specs/`, or `planning/decisions/`
   - Confidence: 0.85

6. **Research Notes** (Priority: 75)
   - Matcher: Contains "research", "investigation", "benchmark"
   - Target: `research/benchmarks/` or `research/investigations/`
   - Confidence: 0.8

7. **Changelog and Releases** (Priority: 70)
   - Matcher: Name contains "changelog", "release", version pattern
   - Target: `changelog/`
   - Confidence: 0.9

8. **General Documentation** (Priority: 50)
   - Matcher: Markdown files categorized as documentation
   - Target: `docs/`
   - Confidence: 0.7

9. **Substantial Orphan Files** (Priority: 30)
   - Matcher: No links + word count > 100
   - Target: `docs/`
   - Confidence: 0.6

### Essential File Protection

Never moves these to vault:

- `README.md` - Repository root
- `AGENTS.md` - Agent configuration
- `LICENSE`, `LICENSE.md` - Legal
- `.gitignore` - Git config
- `package.json`, `tsconfig.json` - Project configs
- `*.config.js`, `*.config.ts` - Configuration files
- `.env*` - Environment files

### Example Output

```json
{
  "suggestions": [
    {
      "type": "move",
      "currentPath": "architecture-notes.md",
      "suggestedPath": "docs/architecture/architecture-notes.md",
      "reason": "File contains architecture or design documentation",
      "confidence": 0.9,
      "impact": {
        "affectedFiles": 2,
        "linksToUpdate": 3,
        "potentialBrokenLinks": [],
        "complexity": "low"
      }
    }
  ],
  "estimatedImpact": {
    "filesToMove": 25,
    "linksToUpdate": 47,
    "estimatedDuration": 8000
  }
}
```

## API Design

### New Tool: `generate_organization_plan`

```typescript
{
  name: "generate_organization_plan",
  arguments: {
    project_folder: "my-project",
    preset_id: "clean",
    min_confidence: 0.8,
    max_suggestions: 100,
    exclude_files: ["important-doc.md"],
    // Optional overrides
    suggest_renames: true,
    consolidate_related: true,
    // Optional custom rules
    custom_rules: [
      {
        name: "Custom Rule",
        matcher: (file) => file.name.includes('special'),
        targetFolder: "special",
        confidence: 0.95
      }
    ]
  }
}
```

### User Experience

```
User: "Organize my vault using the clean preset"

Agent:
1. analyze_vault_structure({ project_folder })
2. generate_organization_plan({ preset_id: 'clean' })
3. reorganize_notes({ plan, dry_run: true })  // Preview
4. Shows preview to user
5. If approved:
   - reorganize_notes({ plan, dry_run: false })
   - Reports results
```

## Safety Features

1. **Essential File Protection**: Files matching essential patterns are never moved
2. **Confidence Scoring**: Rule-based confidence with context adjustments
3. **Impact Estimation**: Calculates affected files, links to update, complexity
4. **Warning Generation**: Alerts for high-impact or low-confidence operations
5. **Validation**: Preset validation before plan generation
6. **Dry-Run Support**: Inherited from `reorganize_notes`
7. **Rollback**: Inherited from existing reorganization system

## Implementation Plan

### Phase 1: Foundation

- Preset type definitions
- Preset registry
- Validation functions

### Phase 2: Generator

- Plan generator algorithm
- Impact calculation
- Warning generation

### Phase 3: Clean Preset

- Define placement rules
- Implement folder structure
- Add essential file patterns

### Phase 4: Additional Presets

- Minimal
- Docs-as-Code
- Research
- Project Hub

### Phase 5: MCP Tool

- Create `generate_organization_plan` tool
- Zod schema
- Handler implementation

### Phase 6: Integration & Testing

- Integration tests
- Real-world testing
- Performance optimization

### Phase 7: Documentation

- User documentation
- API reference
- Usage examples

## Future Enhancements

### v2.0: Custom Presets

Allow users to define custom presets in `.withcontextconfig.jsonc`

### v2.5: AI-Powered Rule Generation

Use AI to analyze vault and suggest custom rules

### v3.0: Preset Marketplace

Share and discover community presets

### v3.5: Interactive Preset Builder

Web-based or CLI tool for visual preset building

### v4.0: Preset Analytics

Track preset effectiveness and usage patterns

## Key Design Decisions

1. **New Tool vs. Extended Tool**: Chose new `generate_organization_plan` tool for clarity and flexibility
2. **Hardcoded vs. Config-Based**: Start with hardcoded presets, add config support in v2.0
3. **Rule Priority**: Priority-based system for handling overlapping rules
4. **Essential Files**: Explicit protection list prevents accidents
5. **Confidence Adjustment**: Context-based adjustments to rule confidence
6. **Backward Compatibility**: Fully compatible with existing `reorganize_notes` tool

## Success Metrics

1. **Adoption**: % of reorganizations using presets vs. manual plans
2. **Effectiveness**: User satisfaction with preset results
3. **Safety**: Number of rollbacks/issues per reorganization
4. **Performance**: Time to generate plans for various vault sizes
5. **Discoverability**: Preset usage distribution

## Conclusion

The preset system transforms vault organization from a complex, manual process into a simple, declarative workflow. By providing battle-tested patterns for common use cases, users can achieve clean, well-organized vaults with minimal effort while maintaining full control through overrides and custom rules.

The "clean" preset serves as the flagship example, demonstrating comprehensive organization suitable for most projects. Additional presets cater to specific workflows, ensuring broad applicability across diverse use cases.

**Next Steps**: Review design, gather feedback, begin Phase 1 implementation.
