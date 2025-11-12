# Vault Preset Usage Examples

Practical examples demonstrating how to use the 4 built-in organization presets for different workflows and project types.

## Table of Contents

- [Example 1: Clean Preset for Production Web App](#example-1-clean-preset-for-production-web-app)
- [Example 2: Minimal Preset for Docs-as-Code Library](#example-2-minimal-preset-for-docs-as-code-library)
- [Example 3: Research Preset for Academic Project](#example-3-research-preset-for-academic-project)
- [Example 4: Docs-as-Code Preset for Migration](#example-4-docs-as-code-preset-for-migration)
- [Example 5: Customizing Clean Preset with Exclude Files](#example-5-customizing-clean-preset-with-exclude-files)
- [Example 6: Adding Custom Rules to Presets](#example-6-adding-custom-rules-to-presets)

---

## Example 1: Clean Preset for Production Web App

**Scenario:** You're building a production web application with comprehensive documentation. You want a clean vault with well-organized docs separate from code.

**Project Structure (Before):**

```
my-web-app/
├── docs/
│   ├── api-endpoints.md
│   ├── setup-guide.md
│   ├── architecture-notes.md
│   ├── meeting-2024-01-15.md
│   └── changelog-v1.md
├── src/
│   └── components/
│       └── Button.md  (component docs)
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

**Step 1: Generate Plan**

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-web-app',
  preset_id: 'clean',
  min_confidence: 0.7,
  exclude_files: ['node_modules/**', '*.log', '*.tmp'],
  max_file_size_mb: 10,
});

console.log('Plan Summary:', plan.plan.summary);
console.log('Total Suggestions:', plan.plan.total_suggestions);
console.log('Files to Move:', plan.plan.estimated_impact.files_to_move);
```

**Output:**

```json
{
  "success": true,
  "preset": {
    "id": "clean",
    "name": "Clean",
    "description": "Comprehensive vault organization with minimal local files"
  },
  "vault_analysis": {
    "total_files": 6,
    "total_size": "45.2 KB",
    "categories": [
      { "name": "documentation", "file_count": 5 },
      { "name": "uncategorized", "file_count": 1 }
    ],
    "orphan_files": 1
  },
  "plan": {
    "total_suggestions": 5,
    "estimated_impact": {
      "files_to_move": 5,
      "files_to_rename": 0,
      "links_to_update": 8,
      "has_risky_operations": false
    }
  }
}
```

**Step 2: Preview**

```javascript
const preview = await use_tool('reorganize_notes', {
  project_folder: 'my-web-app',
  plan: plan.plan,
  dry_run: true,
});

console.log('Preview:', preview.summary);
preview.operations.forEach((op) => {
  console.log(`${op.type}: ${op.source} → ${op.target}`);
});
```

**Preview Output:**

```
MOVE: docs/api-endpoints.md → docs/api/api-endpoints.md
MOVE: docs/setup-guide.md → docs/guides/setup-guide.md
MOVE: docs/architecture-notes.md → docs/architecture/architecture-notes.md
MOVE: docs/meeting-2024-01-15.md → meetings/2024/meeting-2024-01-15.md
MOVE: docs/changelog-v1.md → changelog/changelog-v1.md
```

**Step 3: Execute**

```javascript
const result = await use_tool('reorganize_notes', {
  project_folder: 'my-web-app',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
  create_backup: true,
  min_confidence: 0.7,
});

if (result.success) {
  console.log('✓ Reorganization complete!');
  console.log(`  Moved: ${result.summary.completed} files`);
  console.log(`  Updated: ${result.summary.links_updated} links`);
}
```

**Project Structure (After):**

```
my-web-app/
├── src/
│   └── components/
│       └── Button.md  (stays local - not in docs/)
├── README.md  (stays local - essential)
├── CONTRIBUTING.md  (stays local - essential)
└── LICENSE  (stays local - essential)

vault/projects/my-web-app/
├── docs/
│   ├── api/
│   │   └── api-endpoints.md
│   ├── architecture/
│   │   └── architecture-notes.md
│   └── guides/
│       └── setup-guide.md
├── meetings/
│   └── 2024/
│       └── meeting-2024-01-15.md
└── changelog/
    └── changelog-v1.md
```

**Result:** Clean separation between code and docs, well-organized vault structure, all links updated automatically.

---

## Example 2: Minimal Preset for Docs-as-Code Library

**Scenario:** You're building a JavaScript library following docs-as-code philosophy. Most documentation should stay with code, but you want ADRs and research in vault.

**Project Structure (Before):**

```
my-library/
├── docs/
│   ├── api/
│   │   └── index.md
│   ├── guides/
│   │   └── getting-started.md
│   ├── adr/
│   │   ├── 001-use-typescript.md
│   │   └── 002-async-api.md
│   └── research/
│       └── performance-investigation.md
├── README.md
└── CONTRIBUTING.md
```

**Step 1: Generate Plan**

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-library',
  preset_id: 'minimal',
  min_confidence: 0.8, // Higher confidence for conservative approach
});

console.log('Files to delegate:', plan.plan.total_suggestions);
```

**Output:**

```json
{
  "plan": {
    "total_suggestions": 3,
    "estimated_impact": {
      "files_to_move": 3,
      "files_to_rename": 0,
      "links_to_update": 2
    }
  }
}
```

**Step 2: Preview & Execute**

```javascript
// Preview
const preview = await use_tool('reorganize_notes', {
  project_folder: 'my-library',
  plan: plan.plan,
  dry_run: true,
});

// Execute after review
const result = await use_tool('reorganize_notes', {
  project_folder: 'my-library',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
});
```

**Project Structure (After):**

```
my-library/
├── docs/
│   ├── api/
│   │   └── index.md  (stays local)
│   └── guides/
│       └── getting-started.md  (stays local)
├── README.md  (stays local)
└── CONTRIBUTING.md  (stays local)

vault/projects/my-library/
├── decisions/
│   ├── 001-use-typescript.md
│   └── 002-async-api.md
└── research/
    └── performance-investigation.md
```

**Result:** Most docs stay local with code, only ADRs and research notes in vault for separate tracking.

---

## Example 3: Research Preset for Academic Project

**Scenario:** You're working on a machine learning research project. You need extensive cross-referencing and want to leverage Obsidian's linking features.

**Project Structure (Before):**

```
ml-research/
├── notes/
│   ├── paper-review-transformers.md
│   ├── paper-review-attention.md
│   ├── experiment-baseline.md
│   ├── experiment-improved.md
│   ├── idea-new-architecture.md
│   ├── meeting-advisor-2024-01.md
│   └── general-notes.md
├── package.json
├── tsconfig.json
└── README.md
```

**Step 1: Generate Plan**

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'ml-research',
  preset_id: 'research',
  min_confidence: 0.7,
  exclude_files: ['data/**', 'models/**', '*.ipynb', '*.pkl'],
});
```

**Step 2: Execute**

```javascript
const result = await use_tool('reorganize_notes', {
  project_folder: 'ml-research',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
  create_backup: true,
});
```

**Project Structure (After):**

```
ml-research/
├── package.json  (stays local - config)
├── tsconfig.json  (stays local - config)
└── README.md  (stays local - essential)

vault/projects/ml-research/
├── research/
│   ├── literature/
│   │   ├── paper-review-transformers.md
│   │   └── paper-review-attention.md
│   ├── experiments/
│   │   ├── experiment-baseline.md
│   │   └── experiment-improved.md
│   ├── concepts/
│   │   └── idea-new-architecture.md
│   └── notes/
│       └── general-notes.md
└── meetings/
    └── 2024/
        └── meeting-advisor-2024-01.md
```

**Result:** Heavy vault usage with rich organization by research themes, minimal local files, perfect for cross-referencing.

---

## Example 4: Docs-as-Code Preset for Migration

**Scenario:** You're migrating from local-only documentation to vault. You want to preserve your existing folder structure without reorganization.

**Project Structure (Before):**

```
my-app/
├── docs/
│   ├── api/
│   │   ├── users.md
│   │   └── auth.md
│   ├── guides/
│   │   ├── setup.md
│   │   └── deployment.md
│   └── internal/
│       └── architecture.md
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

**Step 1: Generate Plan**

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-app',
  preset_id: 'docs-as-code',
  min_confidence: 1.0, // Perfect confidence - no reorganization
});
```

**Step 2: Execute**

```javascript
const result = await use_tool('reorganize_notes', {
  project_folder: 'my-app',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
});
```

**Project Structure (After):**

```
my-app/
├── README.md  (stays local - essential)
├── CONTRIBUTING.md  (stays local - essential)
└── LICENSE  (stays local - essential)

vault/projects/my-app/
└── docs/
    ├── api/
    │   ├── users.md  (same structure)
    │   └── auth.md  (same structure)
    ├── guides/
    │   ├── setup.md  (same structure)
    │   └── deployment.md  (same structure)
    └── internal/
        └── architecture.md  (same structure)
```

**Result:** Exact mirror of local structure in vault, no reorganization, familiar for developers.

---

## Example 5: Customizing Clean Preset with Exclude Files

**Scenario:** You want to use the clean preset but exclude drafts, work-in-progress files, and archived documentation.

**Step 1: Generate Plan with Exclusions**

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'my-project',
  preset_id: 'clean',
  min_confidence: 0.7,
  exclude_files: [
    // Exclude drafts and WIP
    '**/*.draft.md',
    '**/*.wip.md',
    'drafts/**',

    // Exclude archived files
    'archive/**',
    'old/**',
    '**/*.archived.md',

    // Exclude temporary files
    '*.tmp',
    '*.log',
    'temp/**',

    // Exclude build artifacts
    'node_modules/**',
    'dist/**',
    'build/**',
  ],
  max_file_size_mb: 5, // Skip large files
});

console.log('Files analyzed:', plan.vault_analysis.total_files);
console.log('Files excluded:', 'See exclude_files patterns');
```

**Step 2: Preview & Execute**

```javascript
// Preview to verify exclusions
const preview = await use_tool('reorganize_notes', {
  project_folder: 'my-project',
  plan: plan.plan,
  dry_run: true,
});

// Verify no draft/archived files in operations
const hasDrafts = preview.operations.some(
  (op) => op.source.includes('draft') || op.source.includes('wip') || op.source.includes('archive')
);

if (!hasDrafts) {
  console.log('✓ No drafts or archived files in plan');

  // Execute
  const result = await use_tool('reorganize_notes', {
    project_folder: 'my-project',
    plan: plan.plan,
    dry_run: false,
    update_links: true,
  });
}
```

**Result:** Clean preset applied only to production-ready documentation, drafts and archives stay untouched.

---

## Example 6: Adding Custom Rules to Presets

**Scenario:** You want to use the clean preset but add custom rules for security documentation and deployment guides.

**Step 1: Generate Plan with Custom Rules**

```javascript
const plan = await use_tool('generate_organization_plan', {
  project_folder: 'enterprise-app',
  preset_id: 'clean',
  min_confidence: 0.7,

  // Add custom rules
  custom_rules: [
    {
      name: 'Security Documentation',
      priority: 96, // Between API (95) and guides (90)
      pattern: 'security|auth|encryption|compliance|gdpr|hipaa',
      targetPath: 'docs/security',
      confidence: 0.95,
      reason: 'Security-related documentation requires special organization',
    },
    {
      name: 'Deployment Documentation',
      priority: 85, // Between meetings (85) and planning (80)
      pattern: 'deploy|kubernetes|docker|ci-cd|pipeline|infrastructure',
      targetPath: 'docs/deployment',
      confidence: 0.9,
      reason: 'Deployment and infrastructure documentation',
    },
    {
      name: 'Customer Documentation',
      priority: 94,
      pattern: 'customer|user-guide|end-user|help',
      targetPath: 'docs/customer',
      confidence: 0.9,
      reason: 'Customer-facing documentation',
    },
    {
      name: 'Internal Documentation',
      priority: 93,
      pattern: 'internal|private|confidential',
      targetPath: 'docs/internal',
      confidence: 0.95,
      reason: 'Internal-only documentation',
    },
  ],
});

console.log(
  'Custom rules applied:',
  plan.plan.warnings.find((w) => w.message.includes('custom rules'))
);
```

**Step 2: Preview Custom Organization**

```javascript
const preview = await use_tool('reorganize_notes', {
  project_folder: 'enterprise-app',
  plan: plan.plan,
  dry_run: true,
});

// Check custom rule matches
preview.operations.forEach((op) => {
  console.log(`${op.type}: ${op.source} → ${op.target}`);
});
```

**Example Preview Output:**

```
MOVE: docs/auth-guide.md → docs/security/auth-guide.md
MOVE: docs/encryption.md → docs/security/encryption.md
MOVE: docs/k8s-deployment.md → docs/deployment/k8s-deployment.md
MOVE: docs/ci-pipeline.md → docs/deployment/ci-pipeline.md
MOVE: docs/user-manual.md → docs/customer/user-manual.md
MOVE: docs/internal-api.md → docs/internal/internal-api.md
MOVE: docs/api-reference.md → docs/api/api-reference.md  (clean preset rule)
MOVE: docs/setup-guide.md → docs/guides/setup-guide.md  (clean preset rule)
```

**Step 3: Execute**

```javascript
const result = await use_tool('reorganize_notes', {
  project_folder: 'enterprise-app',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
  create_backup: true,
});
```

**Project Structure (After):**

```
vault/projects/enterprise-app/
├── docs/
│   ├── security/          ← Custom rule (priority 96)
│   │   ├── auth-guide.md
│   │   └── encryption.md
│   ├── api/               ← Clean preset (priority 95)
│   │   └── api-reference.md
│   ├── customer/          ← Custom rule (priority 94)
│   │   └── user-manual.md
│   ├── internal/          ← Custom rule (priority 93)
│   │   └── internal-api.md
│   ├── guides/            ← Clean preset (priority 90)
│   │   └── setup-guide.md
│   └── deployment/        ← Custom rule (priority 85)
│       ├── k8s-deployment.md
│       └── ci-pipeline.md
├── meetings/              ← Clean preset (priority 85)
└── changelog/             ← Clean preset (priority 70)
```

**Result:** Clean preset enhanced with custom rules for enterprise-specific documentation categories, all organized by priority.

---

## Best Practices from Examples

### 1. Always Preview First

```javascript
// ALWAYS run dry-run before executing
const preview = await use_tool('reorganize_notes', {
  plan: plan.plan,
  dry_run: true, // Preview first!
});
```

### 2. Use Appropriate Confidence Thresholds

```javascript
// Conservative: Only high-confidence operations
min_confidence: 0.8;

// Balanced: Include medium-confidence operations
min_confidence: 0.7;

// Aggressive: Include lower-confidence operations
min_confidence: 0.6;
```

### 3. Exclude Unnecessary Files

```javascript
exclude_files: [
  '**/*.draft.md', // Drafts
  'archive/**', // Archives
  '*.tmp', // Temp files
  'node_modules/**', // Dependencies
];
```

### 4. Enable Safety Features

```javascript
{
  update_links: true,     // Fix broken links
  create_backup: true,    // Create backups
  stop_on_error: true     // Rollback on failure
}
```

### 5. Custom Rules Priority Order

```javascript
// Higher priority (90-100): Specific rules
priority: 96; // Security docs

// Medium priority (70-89): General categorization
priority: 85; // Deployment docs

// Lower priority (10-69): Catch-all rules
priority: 60; // General docs
```

### 6. Test Custom Rules

```javascript
// Test with dry-run first
const preview = await use_tool('reorganize_notes', {
  plan: plan.plan,
  dry_run: true,
});

// Verify custom rules matched correctly
preview.operations.forEach((op) => {
  if (op.target.includes('security')) {
    console.log('✓ Security rule matched:', op.source);
  }
});
```

---

## Common Patterns

### Pattern 1: Feature-Based Organization

```javascript
custom_rules: [
  { name: 'Auth Docs', priority: 100, pattern: 'auth', targetPath: 'features/auth' },
  { name: 'Database Docs', priority: 99, pattern: 'database', targetPath: 'features/database' },
  { name: 'API Docs', priority: 98, pattern: 'api', targetPath: 'features/api' },
];
```

### Pattern 2: Audience-Based Organization

```javascript
custom_rules: [
  { name: 'User Docs', priority: 100, pattern: 'user|customer', targetPath: 'docs/users' },
  { name: 'Developer Docs', priority: 99, pattern: 'dev|api|sdk', targetPath: 'docs/developers' },
  {
    name: 'Operator Docs',
    priority: 98,
    pattern: 'ops|deploy|infra',
    targetPath: 'docs/operators',
  },
];
```

### Pattern 3: Lifecycle-Based Organization

```javascript
custom_rules: [
  { name: 'Planning', priority: 100, pattern: 'plan|roadmap', targetPath: 'lifecycle/planning' },
  { name: 'Development', priority: 99, pattern: 'dev|impl', targetPath: 'lifecycle/development' },
  { name: 'Testing', priority: 98, pattern: 'test|qa', targetPath: 'lifecycle/testing' },
  { name: 'Production', priority: 97, pattern: 'prod|release', targetPath: 'lifecycle/production' },
];
```

---

## Related Documentation

- [Vault Presets Guide](../docs/VAULT_PRESETS.md) - Complete preset documentation
- [Vault Organization](../docs/VAULT_ORGANIZATION.md) - Full vault organization guide
- [Reorganization Examples](./reorganize-notes-example.md) - More reorganization examples

---

_These examples demonstrate practical usage of vault presets for different workflows, from production applications to research projects, with customization options for enterprise needs._
