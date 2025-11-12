# Vault Organization Feature - Executive Summary

**Project:** with-context-mcp  
**Feature:** Intelligent Vault Organization  
**Status:** Design Complete  
**Date:** 2025-11-11

---

## Overview

An intelligent vault organization feature that analyzes Obsidian vault content, understands file purposes through AI, and safely reorganizes files with better names and folder structures.

---

## Key Capabilities

### 1. Content Analysis

- Scan vault directory structure recursively
- Analyze file content (headings, frontmatter, keywords, topics)
- Identify organizational issues (root clutter, deep nesting, large folders)
- Classify file types (meeting notes, research, guides, etc.)

### 2. AI-Powered Suggestions

- Propose logical folder hierarchies based on content
- Suggest better file names that reflect actual content
- Identify files that should be grouped together
- Recommend archival of old unused files

### 3. Safe Reorganization

- Preview all changes before execution (dry-run mode)
- Execute only explicitly approved operations
- Update internal markdown links automatically
- Rollback capability on failures

---

## Architecture Components

### New Modules

**1. Vault Analyzer (`src/vault-analyzer/`)**

- `vault-scanner.ts` - Directory structure scanning
- `content-analyzer.ts` - File content analysis
- `ai-suggester.ts` - AI-powered suggestions
- `types.ts` - Type definitions

**2. Vault Reorganizer (`src/vault-reorganizer/`)**

- `path-planner.ts` - Plan reorganization operations
- `operation-executor.ts` - Execute operations safely
- `rollback-manager.ts` - Handle rollback
- `types.ts` - Type definitions

**3. MCP Tools (`src/tools/`)**

- `analyze-vault-structure.ts` - Entry point for analysis
- `suggest-organization.ts` - Get AI suggestions
- `reorganize-vault.ts` - Execute reorganization

---

## User Workflow

```
1. Analyze Vault
   ↓
   User: "Analyze my vault structure"
   Agent calls: analyze_vault_structure()
   Returns: Scan results + identified issues

2. Get Suggestions
   ↓
   User: "Suggest better organization"
   Agent calls: suggest_organization()
   Returns: Folder structure + rename suggestions

3. Preview Changes
   ↓
   User: "Show me what would change"
   Agent calls: reorganize_vault({ dry_run: true })
   Returns: Preview of operations

4. Execute
   ↓
   User: "Execute operations 1, 3, 5"
   Agent calls: reorganize_vault({
     approved_operations: ["op-1", "op-3", "op-5"],
     dry_run: false
   })
   Returns: Success + moved files
```

---

## Integration with Existing Code

### Leverages

✅ **ObsidianClient** - All vault operations  
✅ **Path Validator** - Security and sanitization  
✅ **Session Manager** - Track changes in changelog  
✅ **Doc Analyzer** - Reuse categorization patterns

### Maintains

✅ **TypeScript strictness** - Full type safety  
✅ **Error handling patterns** - Custom error classes  
✅ **Zod validation** - Input schema validation  
✅ **Read-before-write** - Safety enforcement

---

## Security Features

1. **Path Validation**: All paths sanitized via `sanitizePath()`
2. **User Approval**: Never executes without explicit approval
3. **Dry-Run First**: Always preview before real execution
4. **Rollback Safety**: Track all operations for potential rollback
5. **Link Update Safety**: Only update internal vault links

---

## Implementation Timeline

### Phase 1 (Week 1): Foundation

- Create module structure
- Define TypeScript types
- Set up error classes
- Basic tests

### Phase 2 (Week 2): Vault Analyzer

- Implement vault scanner
- Build content analyzer
- Create AI suggester
- Add 2 tools (analyze, suggest)

### Phase 3 (Week 3): Vault Reorganizer

- Implement path planner
- Build operation executor
- Add rollback manager
- Create reorganize tool

### Phase 4 (Week 4): Integration & Polish

- Session manager integration
- Documentation
- End-to-end testing
- Release preparation

---

## Example: Reorganizing a Cluttered Vault

**Before:**

```
Projects/my-project/
├── notes-2024-01-15.md
├── meeting-jan.md
├── research-ideas.md
├── api-docs.md
├── sprint-notes.md
├── architecture-thoughts.md
└── ... 15 more files in root
```

**After Analysis:**

```json
{
  "issues": [
    {
      "type": "root-clutter",
      "severity": "high",
      "affectedFiles": 20,
      "suggestion": "Organize into topic folders"
    }
  ]
}
```

**After Suggestions:**

```json
{
  "suggestedStructure": [
    { "path": "meetings/", "purpose": "Meeting notes" },
    { "path": "research/", "purpose": "Research and exploration" },
    { "path": "docs/", "purpose": "Documentation" }
  ],
  "fileRecommendations": [
    {
      "currentPath": "notes-2024-01-15.md",
      "suggestedPath": "meetings/2024-01-15-sprint-planning.md",
      "reason": "Contains sprint planning discussion",
      "confidence": 85
    }
  ]
}
```

**After Reorganization:**

```
Projects/my-project/
├── meetings/
│   ├── 2024-01-15-sprint-planning.md
│   └── 2024-01-20-team-sync.md
├── research/
│   ├── api-architecture-exploration.md
│   └── performance-optimization-ideas.md
└── docs/
    └── api-reference.md
```

---

## Key Design Decisions

### 1. No Native Move in ObsidianClient

**Solution:** Use read + write + delete pattern

```typescript
async function moveFile(client, source, target) {
  const content = await client.readNote(source);
  await client.writeNote(target, content, 'create');
  await client.deleteNote(source);
}
```

### 2. AI Suggestions via MCP Client

**Rationale:** MCP server doesn't run AI models directly. Instead, it provides structured data that the MCP client (with AI) uses to generate suggestions.

**Pattern:**

- Tool provides: Analyzed content + structure
- Client generates: Suggestions via AI prompts
- Tool validates: Path safety + executes operations

### 3. User Approval Required

**Design:** Never auto-execute. Always require explicit operation IDs.

```typescript
approved_operations: ['op-1', 'op-3', 'op-5']; // Explicit IDs
// NOT: approved_operations: ["all"] // Too dangerous
```

### 4. Rollback Strategy

**Approach:** Track all operations in execution record

```typescript
{
  executedOperations: [
    {
      operationId: "op-1",
      operation: {...},
      originalContent: "...", // For restoration
      completedAt: "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Testing Strategy

### Unit Tests

- Path validation logic
- Content parsing functions
- File classification
- Operation planning

### Integration Tests

- Full analysis workflow
- Tool input/output validation
- ObsidianClient integration
- Error handling paths

### End-to-End Tests

- Complete user workflows
- Real vault operations
- Rollback scenarios
- Error recovery

---

## Future Enhancements (Phase 5)

1. **Duplicate Detection** - Find and merge similar files
2. **Smart Archival** - Auto-archive old unused files
3. **Tag Standardization** - Suggest tag cleanup
4. **Template Matching** - Suggest templates for file types
5. **Bulk Operations** - Handle large-scale reorganizations
6. **Undo History** - Multi-level undo support

---

## Success Metrics

After implementation, users should be able to:

✅ Analyze their vault structure in <30 seconds  
✅ Get AI-powered suggestions that make sense  
✅ Preview changes before execution  
✅ Reorganize 50+ files safely  
✅ Rollback if needed  
✅ Have all internal links automatically updated  
✅ Track reorganization in session changelog

---

## Next Steps

1. **Review Design** - Get feedback on architecture and approach
2. **Prototype Scanner** - Start with vault-scanner.ts implementation
3. **Test with Real Vault** - Validate against actual Obsidian data
4. **Iterate** - Refine based on findings
5. **Implement Phases 1-4** - Follow 4-week roadmap

---

## Related Documentation

- Full Design Document: `design/vault-organization-feature.md`
- ObsidianClient API: `src/obsidian/client.ts`
- Path Validator: `src/security/path-validator.ts`
- Session Manager: `src/session/session-manager.ts`
- Existing Tools: `src/tools/`

---

**Contact**: Design Agent  
**Version**: 1.0  
**Last Updated**: 2025-11-11
