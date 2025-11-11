---
description: Reorganize vault with AI-assisted suggestions
agent: general
subtask: true
---

# Reorganize Notes

This command executes a comprehensive vault reorganization based on an intelligent organization plan. It supports moving and renaming files with automatic link updates, dry-run preview, rollback capability, and safety checks.

## Quick Start (Ideal Workflow)

This command generates and executes vault reorganization plans instantly using presets:

```javascript
// Check for preset and execution flags
const args = '$ARGUMENTS';
const shouldExecute = args.includes('--execute');
const presetMatch = args.match(/--preset[=\s](\w+)/);
const preset = presetMatch ? presetMatch[1] : 'clean';
const minConfMatch = args.match(/--min-confidence[=\s](0\.\d+)/);
const minConfidence = minConfMatch ? parseFloat(minConfMatch[1]) : 0.7;

// Generate organization plan with preset
const planResult = await generate_organization_plan({
  preset_id: preset,
  min_confidence: minConfidence,
});

// Parse plan from result
const planData = JSON.parse(planResult);
const plan = planData.plan;

// Execute reorganization (dry-run by default for safety)
const result = await reorganize_notes({
  plan: plan,
  dry_run: !shouldExecute,
  update_links: true,
  create_backup: true,
  min_confidence: minConfidence,
});

return result;
```

**Usage:**

- `/reorganize-notes` - Preview with 'clean' preset (dry-run)
- `/reorganize-notes --execute` - Execute with 'clean' preset
- `/reorganize-notes --preset minimal` - Preview with 'minimal' preset
- `/reorganize-notes --preset docs-as-code --execute` - Execute with custom preset
- `/reorganize-notes --min-confidence 0.9` - Use higher confidence threshold

**Available Presets:**

- `clean` (default) - Moves docs to vault, keeps README/LICENSE local
- `minimal` - Keep most local, only move ADRs and research
- `docs-as-code` - Mirrors repository structure in vault
- `research` - Heavy vault usage with cross-linking

## What This Command Does

The vault reorganizer performs safe, intelligent file operations:

### Reorganization Operations

- **Move**: Relocate files to more appropriate folders
- **Rename**: Standardize file naming conventions
- **Both**: Move and rename simultaneously
- **Link Updates**: Automatically fix all references to moved/renamed files
- **Validation**: Check for conflicts and potential issues before execution

### Safety Features

- **Dry-Run Mode**: Preview all operations without making changes (enabled by default)
- **Confidence Filtering**: Only execute high-confidence suggestions
- **Automatic Backups**: Create backups before modifying files (optional)
- **Rollback Support**: Undo operations if something goes wrong
- **Link Integrity**: Ensure no links break during reorganization
- **Impact Assessment**: Show affected files and potential issues

### Workflow

1. **Analyze** → Run `/analyze-vault` to understand current structure
2. **Plan** → Create reorganization plan (manual or AI-generated)
3. **Preview** → Run with `dry_run: true` to see what will happen
4. **Execute** → Run with `dry_run: false` to apply changes
5. **Verify** → Check results and ensure links are intact

## Example Output

### Dry-Run Preview

```
=== Vault Reorganization (DRY RUN) ===

Project: my-project
Plan: 12 operations (8 moves, 4 renames)
Confidence Threshold: 0.7

=== Operations to Execute ===

1. MOVE docs/random-notes.md → docs/guides/getting-started.md
   Reason: Content is a task-oriented guide
   Confidence: 0.92
   Impact: 3 files will need link updates

2. RENAME docs/guide.md → docs/guides/api-guide.md
   Reason: Standardize naming convention
   Confidence: 0.85
   Impact: 5 files will need link updates

3. MOVE docs/architecture-notes.md → docs/architecture/decisions/001-database-choice.md
   Reason: Fits ADR format
   Confidence: 0.88
   Impact: 2 files will need link updates

... (9 more operations)

=== Impact Summary ===

Total Operations: 12
Files to Move: 8
Files to Rename: 4
Links to Update: 47 across 23 files
Estimated Duration: 5 seconds
Risky Operations: 0

=== Warnings ===

⚠️ WARNING: File "docs/old-guide.md" is referenced by external projects
   Suggestion: Update external references manually after reorganization

✓ All operations passed validation checks
✓ No conflicts detected
✓ Link integrity will be maintained

=== Next Steps ===

To execute this plan, run:
  reorganize_notes({ ..., dry_run: false })

IMPORTANT: Dry-run mode is ENABLED by default for safety!
```

### Execution Results

```
=== Vault Reorganization Complete ===

Project: my-project
Mode: EXECUTION (changes applied)

=== Operations Executed ===

✓ Moved docs/random-notes.md → docs/guides/getting-started.md
  Updated 3 links in other files
✓ Renamed docs/guide.md → docs/guides/api-guide.md
  Updated 5 links in other files
✓ Moved docs/architecture-notes.md → docs/architecture/decisions/001-database-choice.md
  Updated 2 links in other files

... (9 more successful operations)

=== Summary ===

Total Operations: 12
Successful: 12 (100%)
Failed: 0
Links Updated: 47 across 23 files
Duration: 3.2 seconds

✓ All operations completed successfully
✓ All links updated and verified
✓ No broken links detected
```

## Your Task

Execute the reorganization workflow immediately with instant preset-based planning:

The command generates a plan and executes it in one call, with dry-run by default for safety.

See "Quick Start" section above for the complete implementation.

**Important Notes:**

- Always preview first (dry-run mode is the default)
- Use `--execute` flag to apply changes
- Backups are created automatically when executing
- Links are updated automatically to prevent breakage

## Alternative: Manual Plan (Advanced)

If you need custom organization beyond presets, you can create a manual plan. See full documentation for plan structure format.

**Still follow the same workflow: Generate → Preview → Confirm → Execute**

---

## Advanced: Create Manual Plan

Based on the analysis, create a reorganization plan manually. The plan structure:

```javascript
{
  suggestions: [
    {
      type: "move",  // or "rename" or "both"
      currentPath: "docs/random-file.md",
      suggestedPath: "docs/guides/proper-location.md",  // for move
      suggestedName: "standardized-name.md",  // for rename
      reason: "Content is a task-oriented guide",
      confidence: 0.92,  // 0-1 scale
      impact: {
        affectedFiles: 3,
        linksToUpdate: 5,
        potentialBrokenLinks: [],
        complexity: "low"  // or "medium", "high"
      },
      targetCategory: "guides"
    },
    // ... more suggestions
  ],
  estimatedImpact: {
    filesToMove: 8,
    filesToRename: 4,
    linksToUpdate: 47,
    filesRequiringLinkUpdates: 23,
    estimatedDuration: 5,  // seconds
    hasRiskyOperations: false
  },
  warnings: [
    {
      severity: "warning",
      filePath: "docs/old-guide.md",
      message: "File is referenced by external projects",
      suggestion: "Update external references manually"
    }
  ],
  summary: "Reorganize 12 files to improve vault structure",
  requiresManualReview: false
}
```

### Step 3: Preview & Execute

**ALWAYS preview first!** Then get user confirmation before executing:

```javascript
// Preview
const preview = await reorganize_notes({
  project_folder: 'my-project',
  plan: manualPlan,
  dry_run: true, // CRITICAL: Preview first!
  update_links: true,
  create_backup: true,
  min_confidence: 0.7,
});

// Show preview to user, get confirmation

// Execute (only after user confirms)
const result = await reorganize_notes({
  project_folder: 'my-project',
  plan: manualPlan,
  dry_run: false,
  update_links: true,
  create_backup: true,
  min_confidence: 0.7,
});
```

---

## Safety Requirements

**⚠️ CRITICAL SAFETY RULES ⚠️**

1. **NEVER** execute with `dry_run: false` without explicit user confirmation!

2. **ALWAYS** run dry-run preview first
3. **ALWAYS** show user the preview results including:
   - Number of operations (moves, renames)
   - Files that will be affected
   - Links that will be updated
   - Any warnings or risks
4. **ALWAYS** ask user for explicit confirmation:

**User Confirmation Template:**

> "I've previewed the reorganization plan using the **[preset_name]** preset. Here's what will happen:
>
> **Operations:**
>
> - Move X files to appropriate folders
> - Rename Y files for consistency
> - Update Z links across N files
>
> **Key Changes:**
> [Show 3-5 most significant operations]
>
> **Safety:**
>
> - ✓ Backups will be created
> - ✓ Links will be automatically updated
> - ✓ Rollback available if needed
>
> **This operation will modify your vault!**
>
> Do you want to proceed with the reorganization? (yes/no)"

Only if user confirms "yes", then execute:

```javascript
reorganize_notes({
  project_folder: 'my-project',
  plan: {
    /* same plan */
  },
  dry_run: false, // Execute for real
  update_links: true,
  create_backup: true,
  min_confidence: 0.7,
});
```

### Step 5: Verify Results

After execution, verify the results:

- Show summary of operations
- Confirm all links updated successfully
- Report any failures or warnings
- Suggest running `/analyze-vault` again to verify improvements

## Plan Structure Details

### Suggestion Object

Each suggestion must include:

- **type**: `"move"`, `"rename"`, or `"both"`
- **currentPath**: Current file path (relative to vault root)
- **suggestedPath**: New path for move operations (optional)
- **suggestedName**: New name for rename operations (optional)
- **reason**: Why this change is suggested (human-readable)
- **confidence**: Score from 0.0 to 1.0 (higher = more confident)
- **impact**: Assessment of operation impact (optional but recommended)
- **targetCategory**: Target category after reorganization (optional)

### Impact Assessment

- **affectedFiles**: How many files reference this file
- **linksToUpdate**: How many links will need updating
- **potentialBrokenLinks**: Paths that might break
- **complexity**: `"low"`, `"medium"`, or `"high"`

### Confidence Scoring

- **0.9-1.0**: Very high confidence, safe to auto-execute
- **0.7-0.9**: High confidence, review recommended
- **0.5-0.7**: Medium confidence, manual review required
- **Below 0.5**: Low confidence, skip unless manually approved

Use `min_confidence` parameter to filter operations.

## Safety Parameters

### dry_run (default: true)

**ALWAYS TRUE BY DEFAULT FOR SAFETY!**

```javascript
dry_run: true; // Preview only, no changes (DEFAULT)
dry_run: false; // Execute for real (requires confirmation!)
```

### update_links (default: true)

```javascript
update_links: true; // Fix all links automatically (recommended)
update_links: false; // Don't update links (may break references)
```

### create_backup (default: true)

```javascript
create_backup: true; // Create backups before changes (recommended)
create_backup: false; // Skip backups (faster but riskier)
```

### min_confidence (default: 0.7)

```javascript
min_confidence: 0.7; // Only execute high-confidence operations
min_confidence: 0.5; // Include medium-confidence operations
min_confidence: 0.9; // Only very high-confidence operations
```

## Best Practices

### ✅ DO:

1. **Use presets** - Start with `generate_organization_plan` and a preset
2. **Preview first** - Always run with `dry_run: true` before executing
3. **Get confirmation** - Show user the preview and wait for approval
4. **Enable backups** - Keep `create_backup: true` (default)
5. **Update links** - Keep `update_links: true` (default) to maintain integrity
6. **Start conservative** - Use `min_confidence: 0.8` or higher for first run
7. **Test incrementally** - Start with a small subset if unsure

### ❌ DON'T:

1. **Don't skip dry-run** - Never execute without previewing first
2. **Don't ignore warnings** - Review and address all warnings in the plan
3. **Don't disable backups** - Always keep backups enabled unless very confident
4. **Don't rush execution** - Give user time to review preview
5. **Don't skip link updates** - Links will break if you don't update them
6. **Don't use low confidence** - Avoid `min_confidence < 0.7` unless you've reviewed manually

### Ideal Workflow Summary:

```
generate_organization_plan (preset)
  → reorganize_notes (dry_run=true)
  → SHOW TO USER + GET CONFIRMATION
  → reorganize_notes (dry_run=false)
```

## Example Usage Scenarios

### Scenario 1: Quick Reorganization with Preset (RECOMMENDED)

```javascript
// Single command generates smart plan
const plan = await generate_organization_plan({
  project_folder: 'my-project',
  preset_id: 'clean',
  min_confidence: 0.8,
});

// Preview
const preview = await reorganize_notes({
  project_folder: 'my-project',
  plan: plan,
  dry_run: true,
});

// [Show to user, get confirmation]

// Execute
const result = await reorganize_notes({
  project_folder: 'my-project',
  plan: plan,
  dry_run: false, // Only after user confirms!
});
```

### Scenario 2: Conservative Reorganization

```javascript
// Only execute very high-confidence operations
await reorganize_notes({
  project_folder: 'my-project',
  plan: plan,
  dry_run: false,
  min_confidence: 0.9, // Very conservative
  create_backup: true, // Extra safety
  update_links: true,
});
```

### Scenario 3: Targeted Reorganization

```javascript
// Move specific files to better locations
const plan = {
  suggestions: [
    {
      type: 'move',
      currentPath: 'docs/random-notes.md',
      suggestedPath: 'docs/guides/getting-started.md',
      reason: 'Content is a getting started guide',
      confidence: 0.95,
      impact: { complexity: 'low' },
    },
    {
      type: 'rename',
      currentPath: 'docs/guide.md',
      suggestedName: 'api-guide.md',
      reason: 'Standardize naming',
      confidence: 0.9,
      impact: { complexity: 'low' },
    },
  ],
  summary: 'Move and rename 2 files',
};
```

## Guidelines for Agents

When running this command:

1. **ALWAYS follow the workflow**:
   - Analyze → Plan → Preview → Confirm → Execute → Verify
2. **NEVER skip dry-run preview**:
   - Always show user what will happen before executing
3. **NEVER execute without confirmation**:
   - Explicitly ask user to confirm before `dry_run: false`
4. **Present clear summaries**:
   - Show what operations will be performed
   - Explain impact and risks
   - Highlight warnings
5. **Do NOT**:
   - Move or rename files manually
   - Update links yourself
   - Skip validation steps
   - Execute destructive operations without permission
6. **Your role is to**:
   - Orchestrate the workflow safely
   - Present information clearly
   - Protect user from mistakes
   - Ensure vault integrity

## Safety Reminders

### ⚠️ CRITICAL SAFETY RULES ⚠️

1. **Dry-run is DEFAULT**: `dry_run: true` unless explicitly set to `false`
2. **Always preview first**: Show user dry-run results before executing
3. **Require confirmation**: Never execute with `dry_run: false` without asking
4. **Backups recommended**: Keep `create_backup: true` unless user explicitly disables
5. **Link integrity**: Keep `update_links: true` to prevent broken references
6. **Test with low confidence**: Start with `min_confidence: 0.9` for first run

### What Can Go Wrong?

- **Broken links**: If `update_links: false`, references will break
- **Lost files**: If backups disabled and operation fails mid-way
- **Name conflicts**: Moving to path that already exists
- **External references**: Links from outside the vault won't be updated

## Common Reorganization Patterns

### Pattern 1: Category-Based Organization

Move files to folders by content type:

```
docs/
  guides/          # Task-oriented how-to docs
  tutorials/       # Learning-oriented step-by-step
  reference/       # Information-oriented API docs
  architecture/    # Understanding-oriented design docs
    decisions/     # ADRs (Architecture Decision Records)
```

### Pattern 2: Feature-Based Organization

Group by project feature or module:

```
docs/
  auth/            # Authentication docs
  database/        # Database docs
  api/             # API docs
  deployment/      # Deployment docs
```

### Pattern 3: Audience-Based Organization

Organize by reader type:

```
docs/
  users/           # End-user documentation
  developers/      # Developer guides
  operators/       # Operations/deployment docs
  contributors/    # Contribution guides
```

## Error Handling

The tool handles errors gracefully:

- **Conflict detection**: Prevents overwriting existing files
- **Rollback support**: Reverts changes if operation fails mid-way
- **Partial success**: Reports which operations succeeded/failed
- **Link validation**: Verifies no links broke after reorganization

If errors occur:

1. Check the error messages for details
2. Review the failed operations list
3. Fix conflicts manually if needed
4. Re-run with adjusted plan

## Related Commands

- `/analyze-vault` - Analyze vault structure before reorganizing
- `/setup-notes` - Configure documentation architecture
- `/validate-config` - Validate configuration
- `/sync-notes` - Sync files after reorganization

## Performance Considerations

Large reorganizations may take time:

- **Small vaults** (< 100 files): Nearly instant
- **Medium vaults** (100-500 files): Few seconds
- **Large vaults** (500+ files): 10-30 seconds
- **Very large vaults** (1000+ files): 30-60 seconds

Link updates are the slowest part. Consider:

- Batch similar operations together
- Use `max_files` in analysis to limit scope
- Run during off-hours for very large vaults

---

_The reorganize-notes tool provides safe, intelligent vault reorganization with automatic link updates, dry-run preview, and rollback support to maintain vault integrity._
