# Vault Organization Presets - Design Document

## Executive Summary

This document proposes a preset system for vault organization that simplifies the workflow from vault analysis to reorganization. Instead of manually creating `OrganizationPlan` objects, users can select from predefined presets that automatically generate plans based on common organization patterns.

**Current Workflow:**

1. Run `analyze_vault_structure`
2. Manually create `OrganizationPlan` with suggestions
3. Run `reorganize_notes` with the plan

**Proposed Workflow:**

1. Run `analyze_vault_structure`
2. Run `generate_organization_plan` with preset name
3. Run `reorganize_notes` with the generated plan

---

## 1. System Architecture

### 1.1 Core Concepts

**Preset**: A predefined strategy for organizing vault files based on common patterns. Each preset defines:

- Target folder structure
- File categorization rules
- Naming conventions
- File placement heuristics
- Confidence scoring logic

**Preset Generator**: Analyzes vault structure and generates an `OrganizationPlan` according to preset rules.

**Preset Registry**: Central registry for storing and managing presets (hardcoded initially, extensible for custom presets).

### 1.2 Module Structure

```
src/vault-organizer/
├── types.ts                    # Existing types
├── vault-analyzer.ts           # Existing analyzer
├── vault-reorganizer.ts        # Existing reorganizer
├── presets/                    # NEW: Preset system
│   ├── types.ts               # Preset type definitions
│   ├── registry.ts            # Preset registry and management
│   ├── generator.ts           # Plan generation from presets
│   ├── presets/               # Built-in presets
│   │   ├── clean.ts          # "clean" preset
│   │   ├── minimal.ts        # "minimal" preset
│   │   ├── docs-as-code.ts   # "docs-as-code" preset
│   │   ├── research.ts       # "research" preset
│   │   ├── project-hub.ts    # "project-hub" preset
│   │   └── index.ts          # Export all presets
│   └── index.ts              # Public API
└── index.ts                   # Export all

src/tools/
├── generate-organization-plan.ts  # NEW: MCP tool
└── index.ts                       # Register new tool
```

### 1.3 Integration Points

- **Input**: `VaultStructure` from `analyzeVaultStructure()`
- **Output**: `OrganizationPlan` for `executeReorganization()`
- **Tool**: New MCP tool `generate_organization_plan`

---

## 2. Data Structures

### 2.1 Preset Definition

```typescript
/**
 * File placement rule for a preset
 */
interface PlacementRule {
  /** Human-readable name for this rule */
  name: string;

  /** Rule priority (higher = evaluated first) */
  priority: number;

  /** Matcher function to determine if file matches this rule */
  matcher: (file: VaultFileInfo) => boolean;

  /** Target folder path for matched files */
  targetFolder: string;

  /** Optional: new filename pattern (supports templates) */
  renamePattern?: string;

  /** Confidence level for this rule (0-1) */
  confidence: number;

  /** Reason template for suggestion */
  reason: string;

  /** Optional: target category */
  targetCategory?: string;
}

/**
 * Essential file pattern (files that should stay local)
 */
interface EssentialFilePattern {
  /** Glob pattern for matching files */
  pattern: string;

  /** Reason why this file is essential */
  reason: string;
}

/**
 * Preset configuration
 */
interface VaultOrganizationPreset {
  /** Unique preset identifier */
  id: string;

  /** Display name */
  name: string;

  /** Detailed description */
  description: string;

  /** Target folder structure */
  folderStructure: {
    /** Folder path */
    path: string;

    /** Folder purpose description */
    purpose: string;

    /** Auto-create if doesn't exist */
    autoCreate: boolean;
  }[];

  /** File placement rules (sorted by priority) */
  placementRules: PlacementRule[];

  /** Files that should always stay local (not moved to vault) */
  essentialLocalFiles?: EssentialFilePattern[];

  /** Whether to suggest renames for unclear filenames */
  suggestRenames: boolean;

  /** Whether to consolidate related files into same folder */
  consolidateRelated: boolean;

  /** Minimum confidence threshold for suggestions */
  defaultConfidence: number;

  /** Preset metadata */
  metadata: {
    /** Preset author */
    author: string;

    /** Version */
    version: string;

    /** Ideal use cases */
    useCases: string[];

    /** Tags for filtering */
    tags: string[];
  };
}
```

### 2.2 Generation Options

```typescript
/**
 * Options for generating organization plan from preset
 */
interface PresetGenerationOptions {
  /** Preset ID to use */
  presetId: string;

  /** Override default confidence threshold */
  minConfidence?: number;

  /** Override rename suggestions setting */
  suggestRenames?: boolean;

  /** Override consolidate related setting */
  consolidateRelated?: boolean;

  /** Custom placement rules to add */
  customRules?: PlacementRule[];

  /** Files to explicitly exclude from reorganization */
  excludeFiles?: string[];

  /** Maximum number of suggestions to generate */
  maxSuggestions?: number;

  /** Dry run mode (validate preset but don't generate plan) */
  validateOnly?: boolean;
}
```

---

## 3. "Clean" Preset Specification

### 3.1 Overview

**Purpose**: Move all documentation to vault while keeping essential project files local. Creates a clean, well-organized vault structure optimized for knowledge management.

**Philosophy**:

- Local filesystem = essential project files (README, LICENSE, configs)
- Vault = comprehensive documentation, guides, notes, and knowledge base
- Organized by content type, not by project structure

### 3.2 Folder Structure

```
vault/projects/{project-name}/
├── docs/                    # Core documentation
│   ├── architecture/       # System design, architecture decisions
│   ├── guides/             # How-to guides and tutorials
│   ├── api/                # API documentation
│   └── reference/          # Reference materials
├── planning/               # Project planning and roadmaps
│   ├── roadmaps/
│   ├── specs/
│   └── decisions/
├── meetings/               # Meeting notes
│   └── {YYYY}/            # Organized by year
├── research/               # Research notes and exploration
│   ├── benchmarks/
│   └── investigations/
├── changelog/              # Project history and changes
└── archive/                # Deprecated or old content
```

### 3.3 Placement Rules

```typescript
const cleanPreset: VaultOrganizationPreset = {
  id: 'clean',
  name: 'Clean Organization',
  description:
    'Move all documentation to vault, keep essential files local. Organized by content type.',

  folderStructure: [
    { path: 'docs', purpose: 'Core documentation', autoCreate: true },
    { path: 'docs/architecture', purpose: 'Architecture and design decisions', autoCreate: true },
    { path: 'docs/guides', purpose: 'How-to guides and tutorials', autoCreate: true },
    { path: 'docs/api', purpose: 'API documentation', autoCreate: true },
    { path: 'docs/reference', purpose: 'Reference materials', autoCreate: true },
    { path: 'planning', purpose: 'Project planning', autoCreate: true },
    { path: 'planning/roadmaps', purpose: 'Roadmaps and timelines', autoCreate: true },
    { path: 'planning/specs', purpose: 'Specifications', autoCreate: true },
    { path: 'planning/decisions', purpose: 'Decision records (ADRs)', autoCreate: true },
    { path: 'meetings', purpose: 'Meeting notes', autoCreate: true },
    { path: 'research', purpose: 'Research and exploration', autoCreate: true },
    { path: 'changelog', purpose: 'Project history', autoCreate: true },
    { path: 'archive', purpose: 'Deprecated content', autoCreate: true },
  ],

  placementRules: [
    // Architecture documentation
    {
      name: 'Architecture Documentation',
      priority: 100,
      matcher: (file) => {
        const lower = file.path.toLowerCase();
        const name = file.name.toLowerCase();
        return (
          lower.includes('architecture') ||
          lower.includes('design') ||
          name.includes('adr-') ||
          name.includes('architecture') ||
          file.topics.some((t) => ['architecture', 'design', 'system'].includes(t))
        );
      },
      targetFolder: 'docs/architecture',
      confidence: 0.9,
      reason: 'File contains architecture or design documentation',
      targetCategory: 'documentation',
    },

    // API Documentation
    {
      name: 'API Documentation',
      priority: 95,
      matcher: (file) => {
        const lower = file.name.toLowerCase();
        return (
          lower.includes('api') ||
          lower.includes('endpoint') ||
          lower.includes('swagger') ||
          lower.includes('openapi') ||
          file.topics.some((t) => ['api', 'rest', 'graphql', 'endpoint'].includes(t))
        );
      },
      targetFolder: 'docs/api',
      confidence: 0.95,
      reason: 'File contains API documentation',
      targetCategory: 'documentation',
    },

    // Guides and Tutorials
    {
      name: 'Guides and Tutorials',
      priority: 90,
      matcher: (file) => {
        const lower = file.name.toLowerCase();
        return (
          lower.includes('guide') ||
          lower.includes('tutorial') ||
          lower.includes('howto') ||
          lower.includes('how-to') ||
          lower.startsWith('getting-started') ||
          file.contentMetadata?.headings.some(
            (h) => h.toLowerCase().includes('tutorial') || h.toLowerCase().includes('guide')
          )
        );
      },
      targetFolder: 'docs/guides',
      confidence: 0.9,
      reason: 'File is a guide or tutorial',
      targetCategory: 'documentation',
    },

    // Meeting Notes
    {
      name: 'Meeting Notes',
      priority: 85,
      matcher: (file) => {
        const lower = file.path.toLowerCase();
        const name = file.name.toLowerCase();
        const hasDatePattern = /\d{4}-\d{2}-\d{2}/.test(name);
        return (
          lower.includes('meeting') ||
          lower.includes('standup') ||
          lower.includes('sync') ||
          (hasDatePattern && file.topics.some((t) => ['meeting', 'notes'].includes(t)))
        );
      },
      targetFolder: (file: VaultFileInfo) => {
        // Extract year from filename if date pattern exists
        const match = file.name.match(/(\d{4})-\d{2}-\d{2}/);
        const year = match ? match[1] : new Date().getFullYear().toString();
        return `meetings/${year}`;
      },
      confidence: 0.85,
      reason: 'File is a meeting note',
      targetCategory: 'meeting-notes',
    },

    // Planning and Roadmaps
    {
      name: 'Planning Documents',
      priority: 80,
      matcher: (file) => {
        const lower = file.path.toLowerCase();
        const name = file.name.toLowerCase();
        return (
          lower.includes('roadmap') ||
          lower.includes('milestone') ||
          lower.includes('plan') ||
          name.includes('spec') ||
          name.includes('specification') ||
          file.topics.some((t) => ['planning', 'roadmap', 'milestone'].includes(t))
        );
      },
      targetFolder: (file: VaultFileInfo) => {
        const lower = file.name.toLowerCase();
        if (lower.includes('roadmap')) return 'planning/roadmaps';
        if (lower.includes('spec')) return 'planning/specs';
        if (lower.includes('decision') || lower.includes('adr')) return 'planning/decisions';
        return 'planning';
      },
      confidence: 0.85,
      reason: 'File is a planning or specification document',
      targetCategory: 'project-plans',
    },

    // Research Notes
    {
      name: 'Research Notes',
      priority: 75,
      matcher: (file) => {
        const lower = file.path.toLowerCase();
        return (
          lower.includes('research') ||
          lower.includes('investigation') ||
          lower.includes('benchmark') ||
          lower.includes('experiment') ||
          file.topics.some((t) => ['research', 'investigation', 'benchmark'].includes(t))
        );
      },
      targetFolder: (file: VaultFileInfo) => {
        const lower = file.path.toLowerCase();
        if (lower.includes('benchmark')) return 'research/benchmarks';
        if (lower.includes('investigation')) return 'research/investigations';
        return 'research';
      },
      confidence: 0.8,
      reason: 'File contains research or investigation notes',
      targetCategory: 'reference',
    },

    // Changelog and Release Notes
    {
      name: 'Changelog and Releases',
      priority: 70,
      matcher: (file) => {
        const lower = file.name.toLowerCase();
        return (
          lower.includes('changelog') ||
          lower.includes('release') ||
          lower.includes('version') ||
          (lower.startsWith('v') && /v\d+\.\d+/.test(lower))
        );
      },
      targetFolder: 'changelog',
      confidence: 0.9,
      reason: 'File is changelog or release documentation',
      targetCategory: 'documentation',
    },

    // General Documentation (fallback)
    {
      name: 'General Documentation',
      priority: 50,
      matcher: (file) => {
        const lower = file.path.toLowerCase();
        const isMarkdown = file.extension === 'md';
        const category = categorizeFile(file);
        return isMarkdown && category === 'documentation' && !lower.includes('readme.md');
      },
      targetFolder: 'docs',
      confidence: 0.7,
      reason: 'File is general documentation',
      targetCategory: 'documentation',
    },

    // Orphan files with substantial content
    {
      name: 'Substantial Orphan Files',
      priority: 30,
      matcher: (file) => {
        const isOrphan =
          (file.contentMetadata?.links.length || 0) === 0 &&
          (file.contentMetadata?.backlinks.length || 0) === 0;
        const hasSubstantialContent = (file.contentMetadata?.wordCount || 0) > 100;
        return isOrphan && hasSubstantialContent;
      },
      targetFolder: 'docs',
      confidence: 0.6,
      reason: 'Orphan file with substantial content should be organized',
      targetCategory: 'uncategorized',
    },
  ],

  essentialLocalFiles: [
    { pattern: 'README.md', reason: 'Root README stays local for repository' },
    { pattern: 'AGENTS.md', reason: 'Agent configuration stays local' },
    { pattern: 'LICENSE', reason: 'License file must stay in repository root' },
    { pattern: 'LICENSE.md', reason: 'License file must stay in repository root' },
    { pattern: '.gitignore', reason: 'Git configuration stays local' },
    { pattern: 'package.json', reason: 'Project manifest stays local' },
    { pattern: 'tsconfig.json', reason: 'TypeScript config stays local' },
    { pattern: '*.config.js', reason: 'Configuration files stay local' },
    { pattern: '*.config.ts', reason: 'Configuration files stay local' },
    { pattern: '.env*', reason: 'Environment files stay local' },
  ],

  suggestRenames: true,
  consolidateRelated: true,
  defaultConfidence: 0.7,

  metadata: {
    author: 'with-context-mcp',
    version: '1.0.0',
    useCases: [
      'General purpose documentation organization',
      'Clean separation between code and documentation',
      'Knowledge management focused workflow',
      'Projects with extensive documentation',
    ],
    tags: ['documentation', 'knowledge-management', 'clean', 'organized'],
  },
};
```

---

## 4. Additional Preset Examples

### 4.1 "Minimal" Preset

**Purpose**: Keep everything local, only move meeting notes and large documentation files to vault.

**Use Cases**:

- Small projects
- Documentation-as-code workflow
- Projects with minimal vault usage

**Key Features**:

- Only moves files >100KB to vault
- Meeting notes organized by date
- Everything else stays local

```typescript
{
  id: 'minimal',
  name: 'Minimal Vault',
  description: 'Keep most files local, only move large docs and meetings to vault',
  folderStructure: [
    { path: 'meetings', purpose: 'Meeting notes', autoCreate: true },
    { path: 'large-docs', purpose: 'Large documentation files', autoCreate: true },
  ],
  // Only 2-3 high-priority rules
  defaultConfidence: 0.8,
}
```

### 4.2 "Docs-as-Code" Preset

**Purpose**: Mirror repository structure in vault, maintaining parallel hierarchies.

**Use Cases**:

- Projects following docs-as-code principles
- Teams preferring repository-like organization
- Projects with well-established folder structures

**Key Features**:

- Preserves existing folder structure
- Only renames unclear filenames
- Groups by feature/module rather than content type

```typescript
{
  id: 'docs-as-code',
  name: 'Docs as Code',
  description: 'Mirror repository structure, preserve existing organization',
  folderStructure: [
    // Mirrors existing structure
  ],
  placementRules: [
    // Preserves folder hierarchy
    // Only suggests renames, not moves
  ],
  suggestRenames: true,
  consolidateRelated: false,
  defaultConfidence: 0.8,
}
```

### 4.3 "Research" Preset

**Purpose**: Heavy vault usage for research-oriented projects with extensive note-taking.

**Use Cases**:

- Research projects
- Academic work
- Exploratory development
- Heavy note-takers

**Key Features**:

- Extensive categorization by research topics
- Chronological organization for experiments
- Rich tagging and cross-linking suggestions
- Literature review sections

```typescript
{
  id: 'research',
  name: 'Research Hub',
  description: 'Heavy vault usage optimized for research and exploration',
  folderStructure: [
    { path: 'literature', purpose: 'Papers and articles', autoCreate: true },
    { path: 'experiments', purpose: 'Experiment notes', autoCreate: true },
    { path: 'theories', purpose: 'Theoretical explorations', autoCreate: true },
    { path: 'findings', purpose: 'Research findings', autoCreate: true },
    { path: 'daily-notes', purpose: 'Daily research logs', autoCreate: true },
  ],
  defaultConfidence: 0.75,
}
```

### 4.4 "Project Hub" Preset

**Purpose**: Centralized project management with clear separation of active vs. archived content.

**Use Cases**:

- Multi-team projects
- Product management
- Agile/Scrum workflows
- Projects with frequent sprints

**Key Features**:

- Sprint-based organization
- Active vs. archived separation
- Stakeholder-specific folders
- Status-based categorization

```typescript
{
  id: 'project-hub',
  name: 'Project Hub',
  description: 'Project management focused organization with sprints and stakeholders',
  folderStructure: [
    { path: 'active', purpose: 'Active work', autoCreate: true },
    { path: 'active/current-sprint', purpose: 'Current sprint work', autoCreate: true },
    { path: 'sprints', purpose: 'Sprint retrospectives', autoCreate: true },
    { path: 'stakeholders', purpose: 'Stakeholder communications', autoCreate: true },
    { path: 'backlog', purpose: 'Feature backlog', autoCreate: true },
    { path: 'completed', purpose: 'Completed work', autoCreate: true },
  ],
  defaultConfidence: 0.75,
}
```

### 4.5 "Zettelkasten" Preset

**Purpose**: Atomic notes with heavy cross-linking for knowledge building.

**Use Cases**:

- Personal knowledge management
- Academic research
- Writers and content creators
- Long-term knowledge building

**Key Features**:

- Flat structure with rich metadata
- Emphasis on tags and links
- Minimal folders (flat is better)
- Timestamp-based IDs

```typescript
{
  id: 'zettelkasten',
  name: 'Zettelkasten',
  description: 'Flat structure with atomic notes and rich cross-linking',
  folderStructure: [
    { path: 'permanent', purpose: 'Permanent notes', autoCreate: true },
    { path: 'fleeting', purpose: 'Fleeting notes', autoCreate: true },
    { path: 'literature', purpose: 'Literature notes', autoCreate: true },
    { path: 'index', purpose: 'Index notes', autoCreate: true },
  ],
  // Emphasizes tags over folders
  suggestRenames: false,
  consolidateRelated: false,
  defaultConfidence: 0.7,
}
```

---

## 5. Implementation Approach

### 5.1 Phase 1: Core Types and Registry

**Files**: `src/vault-organizer/presets/types.ts`, `registry.ts`

```typescript
// types.ts
export interface VaultOrganizationPreset {
  /* ... */
}
export interface PlacementRule {
  /* ... */
}
export interface PresetGenerationOptions {
  /* ... */
}

// registry.ts
export class PresetRegistry {
  private presets = new Map<string, VaultOrganizationPreset>();

  register(preset: VaultOrganizationPreset): void;
  get(id: string): VaultOrganizationPreset | undefined;
  list(): VaultOrganizationPreset[];
  exists(id: string): boolean;
}

export const presetRegistry = new PresetRegistry();
```

### 5.2 Phase 2: Plan Generator

**File**: `src/vault-organizer/presets/generator.ts`

```typescript
export async function generateOrganizationPlan(
  vaultStructure: VaultStructure,
  preset: VaultOrganizationPreset,
  options: PresetGenerationOptions = {}
): Promise<OrganizationPlan> {
  // 1. Validate preset
  // 2. Filter files based on essential patterns
  // 3. Apply placement rules to each file
  // 4. Calculate impact for each suggestion
  // 5. Generate warnings
  // 6. Build OrganizationPlan
}
```

**Algorithm**:

```
For each file in vault:
  1. Check if file matches essential local patterns → skip
  2. Check if file in exclude list → skip
  3. Apply placement rules in priority order:
     a. Find first matching rule
     b. Determine target folder
     c. Check if rename needed
     d. Calculate confidence
     e. Create suggestion
  4. Calculate impact:
     a. Count affected files (backlinks)
     b. Count links to update
     c. Determine complexity
  5. Add to suggestions list

Post-processing:
  1. Deduplicate suggestions
  2. Sort by confidence (desc)
  3. Apply max suggestions limit
  4. Calculate estimated impact
  5. Generate warnings for risky operations
  6. Build final plan
```

### 5.3 Phase 3: Built-in Presets

**Files**: `src/vault-organizer/presets/presets/*.ts`

Implement each preset following the specification:

- `clean.ts`
- `minimal.ts`
- `docs-as-code.ts`
- `research.ts`
- `project-hub.ts`

Register in `presets/index.ts`:

```typescript
import { presetRegistry } from './registry.js';
import { cleanPreset } from './presets/clean.js';
// ... other imports

presetRegistry.register(cleanPreset);
// ... register others

export { presetRegistry };
```

### 5.4 Phase 4: MCP Tool

**File**: `src/tools/generate-organization-plan.ts`

```typescript
export const generateOrganizationPlanSchema = z.object({
  project_folder: z.string().optional(),
  preset_id: z
    .string()
    .describe('Preset to use: clean, minimal, docs-as-code, research, project-hub'),
  min_confidence: z.number().min(0).max(1).default(0.7),
  max_suggestions: z.number().optional(),
  exclude_files: z.array(z.string()).optional(),
  suggest_renames: z.boolean().optional(),
  consolidate_related: z.boolean().optional(),
  // Analysis options (can be inlined or from previous analysis)
  vault_structure: z.any().optional(),
});

export async function generateOrganizationPlanHandler(input) {
  // 1. Get/validate preset
  // 2. Analyze vault if structure not provided
  // 3. Generate plan using preset
  // 4. Return formatted plan JSON
}
```

---

## 6. API Design

### 6.1 Option A: New Tool (Recommended)

**Tool**: `generate_organization_plan`

**Advantages**:

- Clear separation of concerns
- Easier to discover and use
- Can work with cached analysis results
- Better for chaining operations

**Usage**:

```typescript
// Step 1: Analyze (can be cached)
const analysis = await analyzeVaultStructure({
  project_folder: 'my-project',
});

// Step 2: Generate plan with preset
const plan = await generateOrganizationPlan({
  project_folder: 'my-project',
  preset_id: 'clean',
  min_confidence: 0.8,
});

// Step 3: Preview
const preview = await reorganizeNotes({
  project_folder: 'my-project',
  plan,
  dry_run: true,
});

// Step 4: Execute
const result = await reorganizeNotes({
  project_folder: 'my-project',
  plan,
  dry_run: false,
});
```

### 6.2 Option B: Extended reorganize_notes (Alternative)

Add `preset_id` parameter to `reorganize_notes`:

```typescript
// Combined approach
const result = await reorganizeNotes({
  project_folder: 'my-project',
  preset_id: 'clean', // NEW: instead of manual plan
  dry_run: true,
});
```

**Advantages**:

- Fewer steps for simple use cases
- Backward compatible

**Disadvantages**:

- Less flexible
- Can't preview/modify plan before execution
- Couples plan generation with execution

**Recommendation**: Option A (new tool) for flexibility and clarity.

### 6.3 Preset Overrides

Allow fine-grained control:

```typescript
const plan = await generateOrganizationPlan({
  preset_id: 'clean',
  // Override preset defaults
  suggest_renames: false,
  min_confidence: 0.9,
  exclude_files: ['important-doc.md'],
  // Add custom rules
  custom_rules: [
    {
      name: 'Custom Rule',
      matcher: (file) => file.name.includes('special'),
      targetFolder: 'special',
      confidence: 0.95,
    },
  ],
});
```

---

## 7. Safety Considerations

### 7.1 Preset Validation

```typescript
function validatePreset(preset: VaultOrganizationPreset): ValidationResult {
  const errors: string[] = [];

  // Check for duplicate rule priorities
  // Validate folder structure
  // Verify essential file patterns are valid globs
  // Check confidence values are in range
  // Validate matcher functions

  return { valid: errors.length === 0, errors };
}
```

### 7.2 Essential File Protection

```typescript
function isEssentialFile(filePath: string, patterns: EssentialFilePattern[]): boolean {
  return patterns.some((p) => matchGlob(filePath, p.pattern));
}

// Essential files are NEVER included in suggestions
```

### 7.3 Confidence Scoring

```typescript
// Rule-based confidence (from preset)
const ruleConfidence = rule.confidence; // 0-1

// Context-based adjustment
const hasLinks = file.contentMetadata?.links.length > 0;
const isOrphan = hasLinks === false;
const hasSubstantialContent = file.contentMetadata?.wordCount > 100;

let adjustedConfidence = ruleConfidence;

// Reduce confidence for risky operations
if (isOrphan && !hasSubstantialContent) {
  adjustedConfidence *= 0.8; // Reduce by 20%
}

// Increase confidence for clear matches
if (file.path.includes(rule.targetFolder)) {
  adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.1);
}

return adjustedConfidence;
```

### 7.4 Impact Estimation

```typescript
function estimateImpact(file: VaultFileInfo, targetPath: string): OperationImpact {
  const backlinks = file.contentMetadata?.backlinks.length || 0;
  const linksToUpdate = backlinks;

  // Complexity based on number of affected files
  const complexity: 'low' | 'medium' | 'high' =
    backlinks === 0 ? 'low' : backlinks < 5 ? 'medium' : 'high';

  return {
    affectedFiles: backlinks,
    linksToUpdate,
    potentialBrokenLinks: [], // Could analyze further
    complexity,
  };
}
```

### 7.5 Warning Generation

```typescript
function generateWarnings(suggestions: OrganizationSuggestion[]): OrganizationWarning[] {
  const warnings: OrganizationWarning[] = [];

  // Warn about high-impact operations
  const highImpact = suggestions.filter((s) => s.impact.complexity === 'high');
  if (highImpact.length > 0) {
    warnings.push({
      severity: 'warning',
      message: `${highImpact.length} operations will affect many files`,
      suggestion: 'Review high-impact operations carefully',
    });
  }

  // Warn about low-confidence operations
  const lowConfidence = suggestions.filter((s) => s.confidence < 0.7);
  if (lowConfidence.length > 0) {
    warnings.push({
      severity: 'info',
      message: `${lowConfidence.length} operations have low confidence`,
      suggestion: 'Consider increasing min_confidence threshold',
    });
  }

  return warnings;
}
```

---

## 8. User Experience Flow

### 8.1 Simple Flow (Using Presets)

```
User: "Organize my vault using the clean preset"

Agent:
1. Calls analyze_vault_structure({ project_folder })
2. Calls generate_organization_plan({
     preset_id: 'clean',
     min_confidence: 0.8
   })
3. Calls reorganize_notes({
     plan,
     dry_run: true
   })
4. Shows preview to user
5. If approved:
   - Calls reorganize_notes({ plan, dry_run: false })
   - Reports results
```

### 8.2 Advanced Flow (Custom Presets)

```
User: "Organize my vault, but keep all API docs in a separate folder"

Agent:
1. Analyzes vault
2. Generates plan with clean preset
3. Adds custom rule for API docs
4. Previews changes
5. User approves
6. Executes reorganization
```

### 8.3 Discovery Flow

```
User: "What presets are available?"

Agent: Calls list_presets()

Response:
- clean: Move all docs to vault, organized by type
- minimal: Keep most local, only meetings to vault
- docs-as-code: Mirror repository structure
- research: Heavy vault usage for research
- project-hub: Project management focused
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Test Files**: `tests/unit/vault-organizer/presets/*.test.ts`

```typescript
describe('PresetRegistry', () => {
  it('should register presets');
  it('should prevent duplicate IDs');
  it('should list all presets');
});

describe('generateOrganizationPlan', () => {
  it('should generate plan from clean preset');
  it('should respect essential file patterns');
  it('should apply placement rules in priority order');
  it('should calculate impact correctly');
  it('should generate warnings for risky operations');
});

describe('Clean Preset', () => {
  it('should move architecture docs to docs/architecture');
  it('should organize meetings by year');
  it('should keep README.md local');
  it('should suggest renames for unclear filenames');
});
```

### 9.2 Integration Tests

**Test Files**: `tests/integration/preset-workflow.test.ts`

```typescript
describe('Preset Workflow', () => {
  it('should complete full workflow: analyze -> generate -> execute');
  it('should handle empty vaults gracefully');
  it('should handle vaults with complex structure');
  it('should respect custom rules');
});
```

### 9.3 Test Data

Create fixture vaults with known structures:

- `fixtures/vaults/messy-vault` - Disorganized test data
- `fixtures/vaults/clean-vault` - Expected output
- `fixtures/vaults/minimal-vault` - Small project

---

## 10. Documentation

### 10.1 User Documentation

**File**: `docs/VAULT_PRESETS.md`

Content:

- Overview of preset system
- List of built-in presets with descriptions
- Usage examples
- How to create custom presets (future)
- Troubleshooting

### 10.2 API Documentation

**File**: `docs/API_VAULT_PRESETS.md`

Content:

- Type definitions
- API reference for generator functions
- MCP tool specification
- Examples for each preset

### 10.3 Code Documentation

- JSDoc comments for all public functions
- Type annotations with descriptions
- Inline comments for complex logic

---

## 11. Future Enhancements

### 11.1 Custom Presets (v2.0)

Allow users to define custom presets in config:

```jsonc
// .withcontextconfig.jsonc
{
  "vaultOrganization": {
    "presets": {
      "my-preset": {
        "folderStructure": [...],
        "placementRules": [...]
      }
    }
  }
}
```

### 11.2 AI-Powered Rule Generation (v2.5)

Use AI to analyze vault and suggest custom rules:

```typescript
const customPreset = await generateCustomPreset({
  vaultStructure,
  description: 'Optimize for API documentation projects',
});
```

### 11.3 Preset Marketplace (v3.0)

Share and discover community presets:

- Public preset registry
- Rating and reviews
- Preset templates

### 11.4 Interactive Preset Builder (v3.5)

Web-based or CLI tool for building presets visually:

- Drag-and-drop rule builder
- Live preview
- Export to JSON

### 11.5 Preset Analytics (v4.0)

Track preset effectiveness:

- Which presets are most used
- Success rate of reorganizations
- User satisfaction metrics

---

## 12. Implementation Checklist

### Phase 1: Foundation

- [ ] Create preset type definitions
- [ ] Implement preset registry
- [ ] Add validation functions
- [ ] Write unit tests for registry

### Phase 2: Generator

- [ ] Implement plan generator algorithm
- [ ] Add impact calculation
- [ ] Add warning generation
- [ ] Write unit tests for generator

### Phase 3: Clean Preset

- [ ] Define clean preset rules
- [ ] Implement folder structure
- [ ] Add essential file patterns
- [ ] Test with sample vault

### Phase 4: Additional Presets

- [ ] Implement minimal preset
- [ ] Implement docs-as-code preset
- [ ] Implement research preset
- [ ] Implement project-hub preset
- [ ] Test each preset

### Phase 5: MCP Tool

- [ ] Create generate_organization_plan tool
- [ ] Add Zod schema
- [ ] Implement handler
- [ ] Register in tool index
- [ ] Test with MCP client

### Phase 6: Integration

- [ ] Integration tests for full workflow
- [ ] Test with real project vaults
- [ ] Performance testing
- [ ] Edge case handling

### Phase 7: Documentation

- [ ] Write user documentation
- [ ] Write API documentation
- [ ] Add JSDoc comments
- [ ] Create usage examples
- [ ] Update README

### Phase 8: Polish

- [ ] Error messages
- [ ] Progress indicators
- [ ] Dry-run improvements
- [ ] Performance optimizations

---

## 13. Conclusion

This preset system provides a powerful yet simple way to organize vaults according to common patterns. The design:

1. **Extends existing architecture** - Builds on `VaultStructure` and `OrganizationPlan`
2. **Maintains safety** - Preserves dry-run, confidence thresholds, and rollback
3. **Provides flexibility** - Supports overrides and custom rules
4. **Enables discovery** - Users can explore and choose presets
5. **Scales gracefully** - Extensible for custom presets in future

The "clean" preset serves as the flagship example, demonstrating comprehensive organization while respecting essential files. Additional presets cater to diverse workflows, from minimal vault usage to research-heavy knowledge management.

By introducing `generate_organization_plan` as a new MCP tool, we maintain backward compatibility while providing a streamlined workflow that reduces manual plan creation from dozens of lines of code to a single preset selection.

---

## Appendix A: Complete Type Definitions

```typescript
// Full type definitions for reference
export interface VaultOrganizationPreset {
  id: string;
  name: string;
  description: string;
  folderStructure: FolderDefinition[];
  placementRules: PlacementRule[];
  essentialLocalFiles?: EssentialFilePattern[];
  suggestRenames: boolean;
  consolidateRelated: boolean;
  defaultConfidence: number;
  metadata: PresetMetadata;
}

export interface FolderDefinition {
  path: string;
  purpose: string;
  autoCreate: boolean;
}

export interface PlacementRule {
  name: string;
  priority: number;
  matcher: (file: VaultFileInfo) => boolean;
  targetFolder: string | ((file: VaultFileInfo) => string);
  renamePattern?: string;
  confidence: number;
  reason: string;
  targetCategory?: string;
}

export interface EssentialFilePattern {
  pattern: string;
  reason: string;
}

export interface PresetMetadata {
  author: string;
  version: string;
  useCases: string[];
  tags: string[];
}

export interface PresetGenerationOptions {
  presetId: string;
  minConfidence?: number;
  suggestRenames?: boolean;
  consolidateRelated?: boolean;
  customRules?: PlacementRule[];
  excludeFiles?: string[];
  maxSuggestions?: number;
  validateOnly?: boolean;
}
```

## Appendix B: Clean Preset Example Output

```json
{
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "suggestions": [
    {
      "type": "move",
      "currentPath": "projects/my-project/architecture-notes.md",
      "suggestedPath": "projects/my-project/docs/architecture/architecture-notes.md",
      "reason": "File contains architecture or design documentation",
      "confidence": 0.9,
      "impact": {
        "affectedFiles": 2,
        "linksToUpdate": 3,
        "potentialBrokenLinks": [],
        "complexity": "low"
      },
      "targetCategory": "documentation"
    },
    {
      "type": "move",
      "currentPath": "projects/my-project/meeting-2024-01-15.md",
      "suggestedPath": "projects/my-project/meetings/2024/meeting-2024-01-15.md",
      "reason": "File is a meeting note",
      "confidence": 0.85,
      "impact": {
        "affectedFiles": 0,
        "linksToUpdate": 0,
        "potentialBrokenLinks": [],
        "complexity": "low"
      },
      "targetCategory": "meeting-notes"
    }
  ],
  "estimatedImpact": {
    "filesToMove": 25,
    "filesToRename": 3,
    "linksToUpdate": 47,
    "filesRequiringLinkUpdates": 15,
    "estimatedDuration": 8000,
    "hasRiskyOperations": false
  },
  "warnings": [
    {
      "severity": "info",
      "message": "3 operations have confidence below 0.8",
      "suggestion": "Consider increasing min_confidence threshold"
    }
  ],
  "summary": "Reorganize 25 files to improve vault organization using 'clean' preset",
  "requiresManualReview": false
}
```
