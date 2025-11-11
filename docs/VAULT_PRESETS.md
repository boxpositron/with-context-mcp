# Vault Organization Presets

Intelligent, pre-configured organization strategies for different documentation workflows. Presets provide battle-tested patterns for organizing vault files based on content type, project structure, and documentation philosophy.

## Table of Contents

- [Overview](#overview)
- [Available Presets](#available-presets)
  - [Clean (Flagship)](#clean-flagship)
  - [Minimal](#minimal)
  - [Docs-as-Code](#docs-as-code)
  - [Research](#research)
- [Usage Guide](#usage-guide)
- [Preset Details](#preset-details)
- [Customization](#customization)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

### What Are Presets?

Presets are pre-configured organization strategies that define:

1. **Essential Files** - Which files stay in your local repository
2. **Organization Rules** - How vault files are categorized and organized
3. **Folder Structure** - Target folder hierarchy in your vault

Each preset embodies a specific documentation philosophy and workflow, from minimal vault usage to comprehensive vault-centric organization.

### Why Use Presets?

**Without Presets:**

- Manual organization decisions for every file
- Inconsistent folder structures
- Time-consuming setup and maintenance
- Risk of poor organization choices

**With Presets:**

- ✅ Instant, intelligent organization
- ✅ Battle-tested folder structures
- ✅ Consistent categorization rules
- ✅ Optimized for specific workflows
- ✅ Easy to customize and extend

### How Presets Work

```
1. Choose Preset → 2. Generate Plan → 3. Preview → 4. Execute
     ↓                    ↓                ↓           ↓
  clean/minimal/     Analyze vault    Dry-run     Apply changes
  docs-as-code/      Apply rules      preview     Update links
  research           Assess impact
```

Presets use **pattern matching** to categorize files and **priority-based rules** to handle conflicts. Higher priority rules are processed first, ensuring precise control over organization.

## Available Presets

### Quick Comparison

| Preset           | Philosophy                       | Essential Files                   | Vault Usage | Best For                                |
| ---------------- | -------------------------------- | --------------------------------- | ----------- | --------------------------------------- |
| **clean**        | Comprehensive vault organization | Minimal (README, LICENSE, AGENTS) | Heavy       | Production projects, clean separation   |
| **minimal**      | Keep most docs local             | Most files                        | Light       | Docs-as-code workflows, simple projects |
| **docs-as-code** | Mirror repo structure            | README, LICENSE, CONTRIBUTING     | Medium      | Developer-friendly, familiar structure  |
| **research**     | Heavy vault with rich linking    | Build/config only                 | Very Heavy  | Research projects, academic work        |

### Clean (Flagship)

**Philosophy:** Comprehensive vault organization with minimal local files. Organize by document type with clear folder structure.

**Use When:**

- You want a clean, well-organized vault
- Documentation should be separate from code
- You value discoverability and categorization
- You're building a production project

**Essential Files (Kept Local):**

```
README.md
AGENTS.md
LICENSE / LICENSE.md
CONTRIBUTING.md
.github/**/*
```

**Organization Strategy:**

- Architecture docs → `docs/architecture/`
- API docs → `docs/api/`
- Guides/tutorials → `docs/guides/`
- Meeting notes → `meetings/{YEAR}/`
- Planning docs → `planning/`
- Research notes → `research/`
- Changelogs → `changelog/`
- General docs → `docs/`

**Confidence Scores:** 0.75 - 0.9 (high confidence)

### Minimal

**Philosophy:** Keep most files local. Only move ADRs and research notes to vault for separate tracking.

**Use When:**

- You prefer docs-as-code approach
- Most documentation should live with code
- You only want vault for specific doc types
- You're working on a simple project

**Essential Files (Kept Local):**

```
**/*  (all files by default)
```

**Organization Strategy:**

- ADRs → `decisions/`
- Research notes → `research/`
- Everything else stays local

**Confidence Scores:** 0.85 - 0.9 (high confidence)

### Docs-as-Code

**Philosophy:** Mirror local repository structure in vault. Keep structure familiar without reorganization.

**Use When:**

- You want vault to mirror your repo
- Developers need familiar structure
- You don't want reorganization
- You're migrating from local-only docs

**Essential Files (Kept Local):**

```
README.md
LICENSE / LICENSE.md
CONTRIBUTING.md
```

**Organization Strategy:**

- Preserves original directory structure
- No reorganization, just delegation
- Files stay in their current folders

**Confidence Scores:** 1.0 (perfect confidence)

### Research

**Philosophy:** Heavy vault usage with rich linking. Organize by research themes and topics. Minimal local files.

**Use When:**

- You're doing research or academic work
- You need extensive cross-referencing
- You want to leverage Obsidian's linking features
- Documentation is the primary output

**Essential Files (Kept Local):**

```
README.md
package.json
tsconfig.json
*.config.js
*.config.ts
.github/**/*
```

**Organization Strategy:**

- Literature reviews → `research/literature/`
- Experiments → `research/experiments/`
- Concepts/ideas → `research/concepts/`
- Meeting notes → `meetings/{YEAR}/`
- General research → `research/notes/`

**Confidence Scores:** 0.7 - 0.9 (medium to high confidence)

## Usage Guide

### Step 1: Choose a Preset

Decide which preset matches your workflow:

```javascript
// List all available presets
const presets = await use_tool('generate_organization_plan', {
  preset_id: 'help', // Shows all presets
});
```

### Step 2: Generate Organization Plan

Create a plan using your chosen preset:

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-project',
  preset_id: 'clean', // or 'minimal', 'docs-as-code', 'research'
  min_confidence: 0.7,
  exclude_files: ['*.tmp', '*.log'],
  max_file_size_mb: 10,
});
```

### Step 3: Preview the Plan

**ALWAYS preview before executing:**

```javascript
const preview = await use_tool('reorganize_notes', {
  project_folder: 'my-project',
  plan: plan.plan, // Use the plan from step 2
  dry_run: true, // Preview only, no changes
});
```

Review the preview output:

- Which files will move
- Where they'll go
- How many links will update
- Any warnings or issues

### Step 4: Execute (After Confirmation)

Only after reviewing the preview:

```javascript
const result = await use_tool('reorganize_notes', {
  project_folder: 'my-project',
  plan: plan.plan,
  dry_run: false, // Execute for real
  update_links: true, // Fix all links
  create_backup: true, // Create backups
  min_confidence: 0.7, // Skip low-confidence ops
});
```

### Step 5: Verify Results

Check the results:

```javascript
if (result.success) {
  console.log('✓ Reorganization complete!');
  console.log(`  Moved: ${result.summary.completed} files`);
  console.log(`  Updated: ${result.summary.links_updated} links`);
} else {
  console.log('✗ Some operations failed');
  // Review failed_operations
}
```

## Preset Details

### Clean Preset - Detailed Breakdown

#### Purpose

Create a clean, well-organized vault with minimal local files. Optimized for production projects where documentation should be separate from code.

#### Essential Files

Only these files stay in your local repository:

- `README.md` / `readme.md` - Project overview
- `AGENTS.md` / `agents.md` - AI agent guidelines
- `LICENSE` / `LICENSE.md` - License information
- `CONTRIBUTING.md` / `contributing.md` - Contribution guidelines
- `.github/**/*` - GitHub workflows and templates

#### Organization Rules

**Priority 100 - Architecture Documentation**

```
Pattern: /\b(architecture|adr|design-decision|technical-design|system-design)\b/i
Target: docs/architecture/
Confidence: 0.9
```

Files containing architecture keywords → `docs/architecture/`

**Priority 95 - API Documentation**

```
Pattern: /\b(api|endpoint|swagger|openapi|rest|graphql)\b/i
Target: docs/api/
Confidence: 0.9
```

Files containing API keywords → `docs/api/`

**Priority 90 - Guides and Tutorials**

```
Pattern: /\b(guide|tutorial|how-to|howto|walkthrough|getting-started)\b/i
Target: docs/guides/
Confidence: 0.85
```

Task-oriented guides → `docs/guides/`

**Priority 85 - Meeting Notes**

```
Pattern: /\b(meeting|standup|sync|retrospective|retro)\b/i
Target: meetings/{YEAR}/
Confidence: 0.9
```

Meeting notes organized by year → `meetings/2024/`, `meetings/2025/`, etc.

**Priority 80 - Planning Documents**

```
Pattern: /\b(plan|planning|roadmap|milestone|sprint|epic|story|backlog)\b/i
Target: planning/
Confidence: 0.85
```

Project planning docs → `planning/`

**Priority 75 - Research Notes**

```
Pattern: /\b(research|investigation|spike|poc|proof-of-concept|experiment)\b/i
Target: research/
Confidence: 0.85
```

Research and exploratory work → `research/`

**Priority 70 - Changelog**

```
Pattern: /\b(changelog|release-notes|version|history)\b/i
Target: changelog/
Confidence: 0.9
```

Version history and release notes → `changelog/`

**Priority 60 - General Documentation**

```
Pattern: /\b(doc|documentation|readme|reference)\b/i
Target: docs/
Confidence: 0.75
```

General documentation → `docs/`

**Priority 10 - Catch-all**

```
Pattern: /.*/
Target: docs/
Confidence: 0.5
```

Orphaned files with no specific category → `docs/`

#### Example Before/After

**Before (Disorganized):**

```
my-project/
├── random-notes.md
├── api-stuff.md
├── meeting-jan-15.md
├── architecture-thoughts.md
├── guide.md
└── README.md
```

**After (Clean Preset):**

```
my-project/
└── README.md  (local)

vault/projects/my-project/
├── docs/
│   ├── api/
│   │   └── api-stuff.md
│   ├── architecture/
│   │   └── architecture-thoughts.md
│   └── guides/
│       └── guide.md
└── meetings/
    └── 2024/
        └── meeting-jan-15.md
```

### Minimal Preset - Detailed Breakdown

#### Purpose

Keep most documentation local with code. Only delegate ADRs and research notes to vault for separate tracking.

#### Essential Files

All files stay local by default (`**/*`), except those matching vault patterns.

#### Organization Rules

**Priority 100 - Architecture Decision Records**

```
Pattern: /\b(adr|architecture-decision|design-decision)\b/i
Target: decisions/
Confidence: 0.9
```

ADRs tracked separately in vault → `decisions/`

**Priority 90 - Research Notes**

```
Pattern: /\b(research|investigation|spike|poc|experiment)\b/i
Target: research/
Confidence: 0.85
```

Research notes tracked separately → `research/`

#### Example Before/After

**Before:**

```
my-project/
├── docs/
│   ├── api.md
│   ├── guide.md
│   └── adr-001-database.md
├── research/
│   └── spike-graphql.md
└── README.md
```

**After (Minimal Preset):**

```
my-project/
├── docs/
│   ├── api.md  (local)
│   └── guide.md  (local)
└── README.md  (local)

vault/projects/my-project/
├── decisions/
│   └── adr-001-database.md
└── research/
    └── spike-graphql.md
```

### Docs-as-Code Preset - Detailed Breakdown

#### Purpose

Mirror local repository structure in vault. No reorganization, just delegation.

#### Essential Files

- `README.md`
- `LICENSE` / `LICENSE.md`
- `CONTRIBUTING.md`

#### Organization Rules

**Priority 100 - Preserve Structure**

```
Pattern: /.*/
Target: {ORIGINAL}
Confidence: 1.0
```

All files keep their original paths. The `{ORIGINAL}` placeholder preserves directory structure.

#### Example Before/After

**Before:**

```
my-project/
├── docs/
│   ├── api/
│   │   └── users.md
│   └── guides/
│       └── setup.md
├── CONTRIBUTING.md
└── README.md
```

**After (Docs-as-Code Preset):**

```
my-project/
├── CONTRIBUTING.md  (local)
└── README.md  (local)

vault/projects/my-project/
└── docs/
    ├── api/
    │   └── users.md  (same structure)
    └── guides/
        └── setup.md  (same structure)
```

### Research Preset - Detailed Breakdown

#### Purpose

Heavy vault usage with rich linking. Organize by research themes. Minimal local files.

#### Essential Files

Only build and config files stay local:

- `README.md`
- `package.json`
- `tsconfig.json`
- `*.config.js`
- `*.config.ts`
- `.github/**/*`

#### Organization Rules

**Priority 100 - Literature Review**

```
Pattern: /\b(literature|paper|article|study|publication)\b/i
Target: research/literature/
Confidence: 0.9
```

Literature reviews and paper notes → `research/literature/`

**Priority 95 - Experiments**

```
Pattern: /\b(experiment|trial|test|evaluation|benchmark)\b/i
Target: research/experiments/
Confidence: 0.9
```

Experimental work → `research/experiments/`

**Priority 90 - Concepts and Ideas**

```
Pattern: /\b(concept|idea|theory|hypothesis|brainstorm)\b/i
Target: research/concepts/
Confidence: 0.85
```

Conceptual work and ideation → `research/concepts/`

**Priority 85 - Meeting Notes**

```
Pattern: /\b(meeting|discussion|sync)\b/i
Target: meetings/{YEAR}/
Confidence: 0.9
```

Meeting notes organized by year → `meetings/{YEAR}/`

**Priority 80 - General Research**

```
Pattern: /.*/
Target: research/notes/
Confidence: 0.7
```

General research notes → `research/notes/`

#### Example Before/After

**Before:**

```
my-project/
├── notes/
│   ├── paper-review-transformers.md
│   ├── experiment-results.md
│   ├── idea-new-architecture.md
│   └── meeting-2024-01-15.md
├── package.json
└── README.md
```

**After (Research Preset):**

```
my-project/
├── package.json  (local)
└── README.md  (local)

vault/projects/my-project/
├── research/
│   ├── literature/
│   │   └── paper-review-transformers.md
│   ├── experiments/
│   │   └── experiment-results.md
│   └── concepts/
│       └── idea-new-architecture.md
└── meetings/
    └── 2024/
        └── meeting-2024-01-15.md
```

## Customization

### Adding Custom Rules

You can extend presets with custom rules:

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-project',
  preset_id: 'clean',
  custom_rules: [
    {
      name: 'Internal Documentation',
      priority: 95, // Higher priority = processed first
      pattern: 'internal',
      targetPath: 'docs/internal',
      confidence: 0.9,
      reason: 'Internal-only documentation',
    },
    {
      name: 'Customer Docs',
      priority: 94,
      pattern: 'customer',
      targetPath: 'docs/customer',
      confidence: 0.9,
      reason: 'Customer-facing documentation',
    },
  ],
});
```

### Excluding Files

Exclude specific files or patterns:

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-project',
  preset_id: 'clean',
  exclude_files: ['*.tmp', '*.log', 'drafts/**', 'archive/**', '**/*.wip.md'],
});
```

### Adjusting Confidence Threshold

Filter operations by confidence:

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-project',
  preset_id: 'clean',
  min_confidence: 0.8, // Only include high-confidence suggestions
});
```

### Creating a Custom Preset

While you can't add new presets directly, you can simulate one with custom rules:

```javascript
// Simulate a "feature-based" preset
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-project',
  preset_id: 'minimal', // Start with minimal
  custom_rules: [
    {
      name: 'Authentication Docs',
      priority: 100,
      pattern: 'auth',
      targetPath: 'features/auth',
      confidence: 0.9,
      reason: 'Authentication feature docs',
    },
    {
      name: 'Database Docs',
      priority: 99,
      pattern: 'database',
      targetPath: 'features/database',
      confidence: 0.9,
      reason: 'Database feature docs',
    },
    {
      name: 'API Docs',
      priority: 98,
      pattern: 'api',
      targetPath: 'features/api',
      confidence: 0.9,
      reason: 'API feature docs',
    },
  ],
});
```

## API Reference

### `generate_organization_plan`

Generates an organization plan using a preset strategy.

#### Input Schema

```typescript
{
  project_folder?: string;      // Optional: Override project context
  preset_id: string;             // Required: 'clean', 'minimal', 'docs-as-code', 'research'
  min_confidence?: number;       // Optional: 0-1, default 0.7
  exclude_files?: string[];      // Optional: Glob patterns to exclude
  custom_rules?: CustomRule[];   // Optional: Additional rules
  max_file_size_mb?: number;     // Optional: Max file size, default 10
}
```

#### CustomRule Schema

```typescript
{
  name: string; // Human-readable name
  priority: number; // 0-100, higher = processed first
  pattern: string; // Regex pattern or string to match
  targetPath: string; // Target path (supports {YEAR} placeholder)
  confidence: number; // 0-1 confidence score
  reason: string; // Why this rule exists
}
```

#### Output Schema

```typescript
{
  success: boolean;
  preset: {
    id: string;
    name: string;
    description: string;
  };
  project_folder: string;
  vault_analysis: {
    total_files: number;
    total_size: string;
    analyzed_at: string;
    categories: Array<{
      name: string;
      file_count: number;
      avg_confidence: number;
    }>;
    orphan_files: number;
  };
  plan: OrganizationPlan;
  next_steps: string[];
}
```

#### OrganizationPlan Schema

```typescript
{
  generated_at: string;
  total_suggestions: number;
  requires_manual_review: boolean;
  summary: string;

  estimated_impact: {
    files_to_move: number;
    files_to_rename: number;
    links_to_update: number;
    files_requiring_link_updates: number;
    estimated_duration_ms: number;
    has_risky_operations: boolean;
  }

  suggestions: Array<{
    type: 'move' | 'rename' | 'both';
    current_path: string;
    suggested_path?: string;
    suggested_name?: string;
    reason: string;
    confidence: number;
    target_category?: string;
    impact: {
      affected_files: number;
      links_to_update: number;
      complexity: 'low' | 'medium' | 'high';
      potential_broken_links: string[];
    };
  }>;

  warnings: Array<{
    severity: 'info' | 'warning' | 'error';
    file_path?: string;
    message: string;
    suggestion?: string;
  }>;
}
```

## Examples

### Example 1: Using Clean Preset for a Web App

```javascript
// Step 1: Generate plan
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-web-app',
  preset_id: 'clean',
  min_confidence: 0.7,
  exclude_files: ['node_modules/**', '*.log'],
});

console.log('Plan Summary:', plan.plan.summary);
console.log('Files to organize:', plan.plan.total_suggestions);

// Step 2: Preview
const preview = await use_tool('reorganize_notes', {
  project_folder: 'my-web-app',
  plan: plan.plan,
  dry_run: true,
});

console.log('Preview:', preview.summary);

// Step 3: Execute (after user confirms)
const result = await use_tool('reorganize_notes', {
  project_folder: 'my-web-app',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
  create_backup: true,
});

console.log('Result:', result.success ? '✓ Success' : '✗ Failed');
```

### Example 2: Minimal Preset for Docs-as-Code Workflow

```javascript
// Keep most docs local, only move ADRs to vault
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-library',
  preset_id: 'minimal',
  min_confidence: 0.8, // Higher confidence for conservative approach
});

// Preview what will move
const preview = await use_tool('reorganize_notes', {
  project_folder: 'my-library',
  plan: plan.plan,
  dry_run: true,
});

// Only ADRs and research notes should move
console.log('Files to move:', preview.operations.length);
```

### Example 3: Research Preset for Academic Work

```javascript
// Heavy vault usage for research project
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'ml-research',
  preset_id: 'research',
  min_confidence: 0.7,
  exclude_files: ['data/**', 'models/**', '*.ipynb'],
});

// Execute with backups
const result = await use_tool('reorganize_notes', {
  project_folder: 'ml-research',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
  create_backup: true,
  min_confidence: 0.7,
});

console.log('Organized research notes:', result.summary.completed);
```

### Example 4: Custom Rules with Clean Preset

```javascript
// Extend clean preset with custom rules
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'enterprise-app',
  preset_id: 'clean',
  custom_rules: [
    {
      name: 'Security Documentation',
      priority: 96, // Between API (95) and guides (90)
      pattern: 'security|auth|encryption|compliance',
      targetPath: 'docs/security',
      confidence: 0.95,
      reason: 'Security-related documentation',
    },
    {
      name: 'Deployment Docs',
      priority: 85,
      pattern: 'deploy|kubernetes|docker|ci-cd',
      targetPath: 'docs/deployment',
      confidence: 0.9,
      reason: 'Deployment and infrastructure docs',
    },
  ],
  exclude_files: ['*.draft.md', 'temp/**'],
});
```

### Example 5: Excluding Files from Organization

```javascript
// Exclude work-in-progress and archived files
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-project',
  preset_id: 'clean',
  exclude_files: [
    '**/*.wip.md', // Work in progress
    '**/*.draft.md', // Drafts
    'archive/**', // Archived files
    'temp/**', // Temporary files
    '*.tmp', // Temp files
    'node_modules/**', // Dependencies
  ],
  min_confidence: 0.8,
});
```

## Best Practices

### Choosing the Right Preset

**Use Clean when:**

- ✅ Building a production application
- ✅ You want clear separation between code and docs
- ✅ Team needs well-organized documentation
- ✅ You value discoverability

**Use Minimal when:**

- ✅ Following docs-as-code philosophy
- ✅ Documentation should live with code
- ✅ Simple project with few doc types
- ✅ You prefer local-first approach

**Use Docs-as-Code when:**

- ✅ Migrating from local-only docs
- ✅ Developers need familiar structure
- ✅ You don't want reorganization
- ✅ Repository structure is already good

**Use Research when:**

- ✅ Doing research or academic work
- ✅ Need extensive cross-referencing
- ✅ Documentation is primary output
- ✅ You want to leverage Obsidian's features

### Workflow Best Practices

1. **Start with Analysis**

   ```javascript
   // Understand current state before organizing
   const analysis = await use_tool('analyze_vault_structure', {
     project_folder: 'my-project',
   });
   ```

2. **Always Preview First**

   ```javascript
   // NEVER skip dry-run preview
   const preview = await use_tool('reorganize_notes', {
     plan: plan.plan,
     dry_run: true, // Always preview first!
   });
   ```

3. **Use Confidence Thresholds**

   ```javascript
   // Start conservative, adjust as needed
   min_confidence: 0.8; // First run
   min_confidence: 0.7; // After reviewing results
   ```

4. **Enable Safety Features**

   ```javascript
   // Always use safety features
   {
     update_links: true,     // Fix broken links
     create_backup: true,    // Create backups
     stop_on_error: true     // Rollback on failure
   }
   ```

5. **Exclude Unnecessary Files**
   ```javascript
   // Don't waste time on temp files
   exclude_files: ['*.tmp', '*.log', 'node_modules/**', 'drafts/**', '**/*.wip.md'];
   ```

### Customization Best Practices

1. **Priority Ordering**
   - Higher priority (90-100): Specific, high-confidence rules
   - Medium priority (70-89): General categorization
   - Lower priority (10-69): Catch-all and fallback rules

2. **Pattern Matching**
   - Use specific patterns for high-confidence rules
   - Use broader patterns for catch-all rules
   - Test patterns with `preview_delegation` first

3. **Confidence Scores**
   - 0.9-1.0: Very specific, unambiguous matches
   - 0.8-0.9: Clear matches with minor ambiguity
   - 0.7-0.8: Good matches with some uncertainty
   - Below 0.7: Uncertain, requires review

4. **Custom Rules**
   - Add custom rules for project-specific needs
   - Set priority between existing preset rules
   - Use descriptive names and reasons
   - Test with dry-run before executing

### Performance Best Practices

1. **Exclude Large Files**

   ```javascript
   max_file_size_mb: 5; // Skip files > 5MB
   ```

2. **Batch Operations**
   - Organize related files together
   - Avoid too many small operations
   - Group by category or feature

3. **Monitor Impact**
   ```javascript
   // Check estimated impact before executing
   if (plan.plan.estimated_impact.links_to_update > 100) {
     console.warn('Large reorganization, may take time');
   }
   ```

## Troubleshooting

### "No matching rule found for file"

**Problem:** File doesn't match any preset rules

**Solutions:**

- Check if file is excluded by `exclude_files`
- File may be too generic for preset patterns
- Add custom rule for this file type
- Lower `min_confidence` to see catch-all suggestions

### "Confidence below threshold"

**Problem:** Operations skipped due to low confidence

**Solutions:**

- Lower `min_confidence` parameter
- Review skipped files manually
- Add custom rules with higher confidence
- Check if files are correctly categorized

### "Too many files to organize"

**Problem:** Plan has hundreds of suggestions

**Solutions:**

- Use `exclude_files` to skip unnecessary files
- Increase `min_confidence` to filter operations
- Organize in batches by category
- Use more specific preset (e.g., minimal instead of clean)

### "Wrong category assigned"

**Problem:** Files categorized incorrectly

**Solutions:**

- Add custom rule with higher priority
- Adjust file naming to match patterns better
- Use frontmatter `type` field to specify category
- Choose different preset that fits better

### "Links not updating correctly"

**Problem:** Links break after reorganization

**Solutions:**

- Ensure `update_links: true` is set
- Check that links use standard format (`[[link]]` or `[text](link.md)`)
- Custom link formats may not be supported
- Review `potential_broken_links` in plan warnings

### "Preset doesn't fit my workflow"

**Problem:** No preset matches your needs

**Solutions:**

- Start with closest preset (usually `minimal` or `clean`)
- Add custom rules to adjust behavior
- Use `docs-as-code` to preserve structure
- Combine multiple presets with custom rules

### "Operations taking too long"

**Problem:** Reorganization is slow

**Solutions:**

- Reduce scope with `exclude_files`
- Increase `max_file_size_mb` to skip large files
- Disable `update_links` if links are already correct
- Organize in smaller batches

### "Conflicting suggestions"

**Problem:** Multiple rules match same file

**Solutions:**

- Higher priority rule wins automatically
- Review rule priorities
- Make patterns more specific
- Add custom rule with higher priority to override

## Related Documentation

- [Vault Organization Guide](./VAULT_ORGANIZATION.md) - Complete vault organization documentation
- [Preset Implementation](../src/vault-organizer/presets.ts) - Source code and technical details
- [Reorganization Examples](../examples/reorganize-notes-example.md) - Practical usage examples
- [API Reference](../src/tools/generate-organization-plan.ts) - Tool implementation

---

**Version:** 3.0.5  
**Last Updated:** 2025-11-11  
**Presets Available:** 4 (clean, minimal, docs-as-code, research)

_Vault presets provide intelligent, battle-tested organization strategies for different documentation workflows, from minimal vault usage to comprehensive vault-centric organization._
