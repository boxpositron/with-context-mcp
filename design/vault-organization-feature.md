# Vault Organization Feature - Design Document

## Executive Summary

This document outlines the design for an intelligent vault organization feature for the with-context-mcp project. The feature will analyze vault content, understand file purposes, suggest better organization, and execute reorganization operations while maintaining the project's security and TypeScript patterns.

**Version:** 1.0  
**Author:** AI Design Agent  
**Date:** 2025-11-11  
**Status:** Draft

---

## Table of Contents

1. [Background & Motivation](#background--motivation)
2. [Goals & Non-Goals](#goals--non-goals)
3. [Architecture Overview](#architecture-overview)
4. [Existing Capabilities Analysis](#existing-capabilities-analysis)
5. [New Components Design](#new-components-design)
6. [Data Structures & Types](#data-structures--types)
7. [User Interaction Flow](#user-interaction-flow)
8. [Integration Points](#integration-points)
9. [Security Considerations](#security-considerations)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Code Examples](#code-examples)
12. [Testing Strategy](#testing-strategy)

---

## 1. Background & Motivation

### Current State

The with-context-mcp server currently provides:

- Project-scoped note management in Obsidian vaults
- Documentation delegation between local and vault
- Intelligent setup with doc-analyzer (analyzes repos, not vaults)
- Basic CRUD operations (write, read, list, delete, search)
- Template system for creating new notes

### Problem Statement

Users accumulate documentation in their vaults over time, leading to:

- **Poor organization**: Files scattered without logical structure
- **Unclear naming**: Files named generically (e.g., "notes.md", "temp-2024-01-15.md")
- **Duplicate content**: Similar information spread across multiple files
- **Hard to navigate**: No clear hierarchy or categorization
- **Lost context**: Files don't reflect their actual purpose/content

### Opportunity

Leverage AI to:

1. Analyze vault content intelligently
2. Understand file purposes from their content
3. Suggest better names that reflect content
4. Recommend organizational structures (folders, hierarchies)
5. Execute reorganization safely with user approval

---

## 2. Goals & Non-Goals

### Goals

1. **Content Analysis**: Analyze markdown files to understand their purpose and topics
2. **Smart Naming**: Suggest better file names based on content analysis
3. **Structure Recommendations**: Propose folder hierarchies that make sense for the content
4. **Safe Reorganization**: Execute rename/move operations with validation and rollback
5. **User Control**: Always preview changes before execution
6. **AI-Powered Insights**: Use AI to summarize content and generate suggestions
7. **Integration**: Work seamlessly with existing session management and tools

### Non-Goals

1. **Content Modification**: Not editing file contents, only organizing them
2. **Automated Decisions**: Not making changes without explicit user approval
3. **External Sources**: Not pulling in content from outside the vault
4. **Real-time Monitoring**: Not a background service watching for changes
5. **Cross-Vault Operations**: Only working within the configured vault

---

## 3. Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    User (AI Agent)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 MCP Tools Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ analyze_     │  │ suggest_     │  │ reorganize_  │      │
│  │ vault_       │  │ organization │  │ vault        │      │
│  │ structure    │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Vault Analyzer Module                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vault        │  │ Content      │  │ AI           │      │
│  │ Scanner      │  │ Analyzer     │  │ Suggester    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Vault Reorganizer Module                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Path         │  │ Operation    │  │ Rollback     │      │
│  │ Planner      │  │ Executor     │  │ Manager      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Existing Infrastructure                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ObsidianClient│  │ Session      │  │ Path         │      │
│  │              │  │ Manager      │  │ Validator    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Tools Layer (3 new tools)**

- `analyze_vault_structure`: Entry point for vault analysis
- `suggest_organization`: AI-powered reorganization suggestions
- `reorganize_vault`: Execute approved reorganization plan

**Vault Analyzer Module** (new module: `src/vault-analyzer/`)

- Scan vault directory structure
- Analyze file content (headings, frontmatter, keywords)
- Generate AI-powered insights about content

**Vault Reorganizer Module** (new module: `src/vault-reorganizer/`)

- Plan reorganization operations
- Execute rename/move operations
- Handle rollback on failures

---

## 4. Existing Capabilities Analysis

### Available Infrastructure

#### ObsidianClient (`src/obsidian/client.ts`)

**Capabilities:**

- ✅ `readNote(path)`: Read file content
- ✅ `listNotes(path)`: List files recursively
- ✅ `writeNote(path, content, mode)`: Write files
- ✅ `deleteNote(path)`: Delete files
- ✅ `noteExists(path)`: Check existence
- ✅ Error handling with custom error types
- ✅ Read-before-write enforcement

**Gap:** No native rename/move operation - we'll use read + write + delete pattern

#### Doc Analyzer (`src/doc-analyzer/`)

**Capabilities:**

- ✅ Repository scanning for doc files
- ✅ File categorization (readme, guide, tutorial, etc.)
- ✅ Project type detection
- ✅ Glob pattern matching for file discovery

**Reusable Patterns:**

- File categorization logic
- Pattern matching approach
- Analysis framework structure

#### Session Manager (`src/session/`)

**Capabilities:**

- ✅ Session lifecycle management
- ✅ File tracking (reads/modifications)
- ✅ Vault persistence
- ✅ Change logging

**Integration Opportunity:**

- Track reorganization operations in session
- Log changes to changelog
- Persist reorganization plans

#### Path Security (`src/security/path-validator.ts`)

**Capabilities:**

- ✅ `sanitizePath()`: Validate and sanitize paths
- ✅ `isPathSafe()`: Quick safety checks
- ✅ Directory traversal prevention
- ✅ Null byte rejection

**Critical:** All new path operations must use these validators

### Existing Tools Patterns

From examining `search-notes.ts`, `get-note-metadata.ts`:

- ✅ Zod schemas for input validation
- ✅ Project context resolution
- ✅ ObsidianClient initialization
- ✅ JSON response formatting
- ✅ Error handling with try-catch

---

## 5. New Components Design

### 5.1 Vault Analyzer Module

**Location:** `src/vault-analyzer/`

#### Files:

1. `index.ts` - Module exports
2. `vault-scanner.ts` - Directory structure scanning
3. `content-analyzer.ts` - File content analysis
4. `ai-suggester.ts` - AI-powered suggestions
5. `types.ts` - Type definitions

#### vault-scanner.ts

```typescript
/**
 * Scan vault structure and gather file metadata
 */
export async function scanVaultStructure(
  client: ObsidianClient,
  projectFolder: string,
  basePath: string,
  options?: ScanOptions
): Promise<VaultScanResult> {
  // 1. List all files recursively
  // 2. Build directory tree
  // 3. Collect file stats (size, creation, modification)
  // 4. Categorize by extension and location
  // 5. Identify potential issues (duplicates, deep nesting)
}
```

**Responsibilities:**

- List all markdown files in project folder
- Build directory tree structure
- Collect basic file metadata
- Identify organizational anti-patterns:
  - Files in root that should be in folders
  - Deep nesting (>5 levels)
  - Too many files in one folder (>20)
  - Orphaned files (no related files nearby)

#### content-analyzer.ts

```typescript
/**
 * Analyze file content to understand purpose
 */
export async function analyzeFileContent(
  client: ObsidianClient,
  filePath: string
): Promise<ContentAnalysis> {
  // 1. Read file content
  // 2. Extract frontmatter
  // 3. Parse headings
  // 4. Extract keywords/topics
  // 5. Identify file type (meeting note, guide, reference, etc.)
  // 6. Calculate content metrics (word count, complexity)
}
```

**Responsibilities:**

- Parse markdown structure (headings, lists, code blocks)
- Extract frontmatter and tags
- Identify keywords and topics
- Classify file type/purpose
- Detect related files (via links, tags, keywords)

#### ai-suggester.ts

```typescript
/**
 * Generate AI-powered organization suggestions
 */
export async function generateOrganizationSuggestions(
  scanResult: VaultScanResult,
  contentAnalyses: Map<string, ContentAnalysis>
): Promise<OrganizationSuggestions> {
  // 1. Group files by topic/purpose
  // 2. Suggest folder structure
  // 3. Propose file renames
  // 4. Identify merge opportunities
  // 5. Recommend tag standardization
}
```

**Responsibilities:**

- Analyze patterns across all files
- Suggest logical folder hierarchies
- Generate better file names
- Identify duplicate/similar content
- Recommend archiving old files

**Note:** This component will use prompt-based AI analysis. The MCP client will handle the actual AI inference.

### 5.2 Vault Reorganizer Module

**Location:** `src/vault-reorganizer/`

#### Files:

1. `index.ts` - Module exports
2. `path-planner.ts` - Plan reorganization operations
3. `operation-executor.ts` - Execute operations
4. `rollback-manager.ts` - Handle rollback
5. `types.ts` - Type definitions

#### path-planner.ts

```typescript
/**
 * Plan reorganization operations
 */
export function planReorganization(
  currentStructure: VaultScanResult,
  suggestions: OrganizationSuggestions,
  userApprovals: UserApproval[]
): ReorganizationPlan {
  // 1. Validate all suggestions
  // 2. Check for path conflicts
  // 3. Order operations (folders before files)
  // 4. Detect circular dependencies
  // 5. Create execution plan with dependencies
}
```

**Responsibilities:**

- Validate all paths with sanitizePath()
- Check for naming conflicts
- Order operations correctly:
  - Create folders first
  - Move files that don't depend on others
  - Move files with dependencies
- Handle edge cases (circular refs, conflicts)

#### operation-executor.ts

```typescript
/**
 * Execute reorganization operations
 */
export async function executeReorganization(
  client: ObsidianClient,
  plan: ReorganizationPlan,
  options: ExecutionOptions
): Promise<ExecutionResult> {
  // 1. Create backup record
  // 2. Execute operations in order
  // 3. Update internal links in moved files
  // 4. Track progress
  // 5. Handle errors with rollback
}
```

**Responsibilities:**

- Execute operations atomically where possible
- Update markdown links in moved files
- Track all changes for rollback
- Provide progress updates
- Handle partial failures gracefully

#### rollback-manager.ts

```typescript
/**
 * Handle rollback of failed operations
 */
export async function rollbackReorganization(
  client: ObsidianClient,
  executionRecord: ExecutionRecord
): Promise<RollbackResult> {
  // 1. Reverse operations in reverse order
  // 2. Restore original file locations
  // 3. Restore original link structures
  // 4. Verify rollback success
}
```

**Responsibilities:**

- Maintain operation log for rollback
- Reverse operations in correct order
- Verify all files restored
- Report rollback status

### 5.3 Tools

**Location:** `src/tools/`

#### analyze-vault-structure.ts

```typescript
export const analyzeVaultStructureSchema = z.object({
  project_folder: z.string().optional(),
  depth_limit: z.number().optional().default(10),
  include_content_analysis: z.boolean().optional().default(true),
});

export async function analyzeVaultStructure(input: AnalyzeVaultStructureInput): Promise<string> {
  // 1. Get project context
  // 2. Initialize ObsidianClient
  // 3. Scan vault structure
  // 4. Optionally analyze content
  // 5. Return analysis results as JSON
}
```

#### suggest-organization.ts

```typescript
export const suggestOrganizationSchema = z.object({
  project_folder: z.string().optional(),
  analysis_result: z.string(), // JSON from analyze_vault_structure
  preferences: z
    .object({
      max_folder_depth: z.number().optional().default(3),
      max_files_per_folder: z.number().optional().default(15),
      naming_style: z.enum(['descriptive', 'concise', 'date-prefixed']).optional(),
    })
    .optional(),
});

export async function suggestOrganization(input: SuggestOrganizationInput): Promise<string> {
  // 1. Parse analysis result
  // 2. Generate AI-powered suggestions
  // 3. Apply user preferences
  // 4. Return suggestion plan as JSON
}
```

#### reorganize-vault.ts

```typescript
export const reorganizeVaultSchema = z.object({
  project_folder: z.string().optional(),
  reorganization_plan: z.string(), // JSON from suggest_organization
  approved_operations: z.array(z.string()), // Operation IDs to execute
  dry_run: z.boolean().optional().default(true),
  update_links: z.boolean().optional().default(true),
});

export async function reorganizeVault(input: ReorganizeVaultInput): Promise<string> {
  // 1. Parse reorganization plan
  // 2. Filter by approved operations
  // 3. Validate all paths
  // 4. Create execution plan
  // 5. Execute (or dry-run)
  // 6. Return execution results
}
```

---

## 6. Data Structures & Types

### Core Types

```typescript
// src/vault-analyzer/types.ts

/**
 * Result of vault structure scan
 */
export interface VaultScanResult {
  projectFolder: string;
  totalFiles: number;
  totalSize: number;
  directoryTree: DirectoryNode;
  files: VaultFileInfo[];
  issues: OrganizationIssue[];
  scanTimestamp: string;
}

/**
 * Directory tree node
 */
export interface DirectoryNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  fileCount?: number;
  depth: number;
}

/**
 * File information from scan
 */
export interface VaultFileInfo {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  size: number;
  depth: number;
  parentFolder: string;
}

/**
 * Organization issues found
 */
export interface OrganizationIssue {
  type: 'deep-nesting' | 'root-clutter' | 'large-folder' | 'orphaned-file' | 'duplicate-name';
  severity: 'low' | 'medium' | 'high';
  affectedFiles: string[];
  description: string;
  suggestion?: string;
}

/**
 * Content analysis result
 */
export interface ContentAnalysis {
  filePath: string;
  fileType: FileType;
  topics: string[];
  keywords: string[];
  headings: string[];
  frontmatter: Record<string, unknown> | null;
  tags: string[];
  wordCount: number;
  linkCount: number;
  internalLinks: string[];
  createdDate?: string;
  modifiedDate?: string;
  summary?: string; // AI-generated
}

export type FileType =
  | 'meeting-note'
  | 'project-doc'
  | 'research'
  | 'guide'
  | 'reference'
  | 'changelog'
  | 'todo'
  | 'daily-note'
  | 'fleeting-note'
  | 'permanent-note'
  | 'unknown';

/**
 * AI-generated organization suggestions
 */
export interface OrganizationSuggestions {
  suggestedStructure: FolderStructure[];
  fileRecommendations: FileRecommendation[];
  namingRecommendations: NamingRecommendation[];
  archiveRecommendations: ArchiveRecommendation[];
  rationale: string;
}

export interface FolderStructure {
  path: string;
  purpose: string;
  suggestedFiles: string[];
}

export interface FileRecommendation {
  currentPath: string;
  suggestedPath: string;
  reason: string;
  confidence: number; // 0-100
}

export interface NamingRecommendation {
  currentName: string;
  suggestedName: string;
  reason: string;
  confidence: number;
}

export interface ArchiveRecommendation {
  filePath: string;
  reason: string;
  lastModified: string;
}
```

### Reorganization Types

```typescript
// src/vault-reorganizer/types.ts

/**
 * Reorganization plan
 */
export interface ReorganizationPlan {
  planId: string;
  createdAt: string;
  projectFolder: string;
  operations: ReorganizationOperation[];
  estimatedDuration: number; // seconds
  warnings: string[];
}

/**
 * Single reorganization operation
 */
export interface ReorganizationOperation {
  operationId: string;
  type: 'create-folder' | 'move-file' | 'rename-file' | 'delete-file';
  sourcePath?: string;
  targetPath: string;
  reason: string;
  dependencies: string[]; // Other operation IDs that must complete first
  updateLinks: boolean;
  approved: boolean;
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  dryRun: boolean;
  stopOnError: boolean;
  updateInternalLinks: boolean;
  createBackup: boolean;
  progressCallback?: (progress: ExecutionProgress) => void;
}

/**
 * Execution progress
 */
export interface ExecutionProgress {
  totalOperations: number;
  completedOperations: number;
  currentOperation: string;
  percentComplete: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  success: boolean;
  planId: string;
  executedOperations: string[];
  failedOperations: FailedOperation[];
  rollbackRequired: boolean;
  rollbackCompleted?: boolean;
  summary: string;
}

export interface FailedOperation {
  operationId: string;
  operation: ReorganizationOperation;
  error: string;
}

/**
 * Execution record for rollback
 */
export interface ExecutionRecord {
  planId: string;
  executedOperations: ExecutedOperation[];
  timestamp: string;
}

export interface ExecutedOperation {
  operationId: string;
  operation: ReorganizationOperation;
  originalContent?: string; // For files that were modified
  completedAt: string;
}
```

---

## 7. User Interaction Flow

### Flow 1: Analyze Vault Structure

```
User: "Analyze my project vault structure"
  ↓
Agent calls: analyze_vault_structure({
  project_folder: "my-project",
  include_content_analysis: true
})
  ↓
System:
  1. Scans all files in Projects/my-project/
  2. Builds directory tree
  3. Analyzes each file's content
  4. Identifies issues (deep nesting, cluttered root, etc.)
  ↓
Returns: {
  totalFiles: 47,
  issues: [
    { type: "root-clutter", severity: "high", ... },
    { type: "deep-nesting", severity: "medium", ... }
  ],
  files: [...],
  directoryTree: {...}
}
  ↓
Agent presents: "Found 47 files with 2 organization issues..."
```

### Flow 2: Get Organization Suggestions

```
User: "Suggest a better organization for my vault"
  ↓
Agent calls: suggest_organization({
  project_folder: "my-project",
  analysis_result: "{...}", // from previous step
  preferences: {
    max_folder_depth: 3,
    naming_style: "descriptive"
  }
})
  ↓
System:
  1. Parses analysis results
  2. Groups files by topic/purpose (AI analysis)
  3. Suggests folder structure
  4. Proposes better file names
  5. Identifies archival candidates
  ↓
Returns: {
  suggestedStructure: [
    { path: "meetings/", purpose: "Meeting notes and minutes", ... },
    { path: "research/", purpose: "Research and exploration", ... }
  ],
  fileRecommendations: [
    {
      currentPath: "notes-2024-01-15.md",
      suggestedPath: "meetings/2024-01-15-sprint-planning.md",
      reason: "Contains sprint planning discussion",
      confidence: 85
    }
  ],
  ...
}
  ↓
Agent presents suggestions with rationale
```

### Flow 3: Execute Reorganization

```
User: "Execute the reorganization for operations 1, 3, and 5"
  ↓
Agent calls: reorganize_vault({
  project_folder: "my-project",
  reorganization_plan: "{...}", // from suggestions
  approved_operations: ["op-1", "op-3", "op-5"],
  dry_run: true, // First run as preview
  update_links: true
})
  ↓
System (Dry Run):
  1. Validates all paths
  2. Checks for conflicts
  3. Plans operation order
  4. Simulates execution
  ↓
Returns: {
  success: true,
  dryRun: true,
  operations: [
    { type: "create-folder", path: "meetings/" },
    { type: "move-file", from: "...", to: "..." }
  ]
}
  ↓
User: "Looks good, execute for real"
  ↓
Agent calls: reorganize_vault({ ..., dry_run: false })
  ↓
System (Real Execution):
  1. Creates backup record
  2. Executes operations in order
  3. Updates internal links
  4. Tracks all changes
  (If error → automatic rollback)
  ↓
Returns: {
  success: true,
  executedOperations: ["op-1", "op-3", "op-5"],
  summary: "Successfully reorganized 3 files into new structure"
}
```

### Flow 4: Session Integration

All reorganization operations integrate with session management:

```typescript
// Track in session changelog
await sessionManager.updateSession((session) => ({
  ...session,
  changelog: [
    ...session.changelog,
    {
      type: 'refactor',
      message: 'Reorganized vault structure',
      files: movedFiles,
      timestamp: now(),
    },
  ],
}));
```

---

## 8. Integration Points

### 8.1 Session Manager Integration

**Purpose:** Track reorganization operations as part of session activity

**Integration:**

- Add changelog entries for reorganization operations
- Track modified files in session context
- Persist reorganization plans to vault for history

**Implementation:**

```typescript
// In reorganize-vault.ts
const sessionManager = new SessionManager(client);
await sessionManager.trackFileModified(targetPath);
await sessionManager.updateSession((session) => ({
  ...session,
  changelog: [
    ...session.changelog,
    {
      type: 'refactor',
      message: `Reorganized: ${sourcePath} → ${targetPath}`,
      files: [sourcePath, targetPath],
      timestamp: now(),
    },
  ],
}));
```

### 8.2 Path Validator Integration

**Purpose:** Ensure all reorganization paths are safe

**Integration:**

- Validate all source and target paths
- Prevent directory traversal
- Ensure paths stay within project boundaries

**Implementation:**

```typescript
// In path-planner.ts
import { sanitizePath, isPathSafe } from '../security/path-validator.js';

for (const operation of plan.operations) {
  if (!isPathSafe(operation.targetPath)) {
    throw new PathValidationError(`Unsafe path: ${operation.targetPath}`);
  }

  const sanitized = sanitizePath(operation.targetPath, projectFolder, basePath);
  operation.targetPath = sanitized;
}
```

### 8.3 ObsidianClient Integration

**Purpose:** Execute all vault operations through the client

**Patterns to Use:**

- Read-before-write enforcement (already built-in)
- Proper error handling with custom error types
- Recursive directory listing for scanning

**Move Operation Pattern:**

```typescript
// Since no native move, use read + write + delete
async function moveFile(
  client: ObsidianClient,
  sourcePath: string,
  targetPath: string
): Promise<void> {
  // 1. Read source
  const content = await client.readNote(sourcePath);

  // 2. Write to target (create mode)
  await client.writeNote(targetPath, content, 'create');

  // 3. Delete source
  await client.deleteNote(sourcePath);
}
```

### 8.4 Existing Doc Analyzer Reuse

**Reusable Components:**

- File categorization logic from `repo-scanner.ts`
- Pattern matching approach
- Project type detection

**Adaptation Needed:**

- Repo scanner works on local filesystem
- Vault scanner works through ObsidianClient API
- Similar categorization but vault-focused

---

## 9. Security Considerations

### 9.1 Path Validation

**Requirements:**

- All paths MUST pass through `sanitizePath()`
- No directory traversal allowed
- Paths must stay within project folder
- No absolute paths accepted

**Implementation:**

```typescript
// Before any operation
const validatedPath = sanitizePath(userProvidedPath, projectFolder, basePath);
```

### 9.2 User Approval

**Requirements:**

- NEVER execute operations without explicit approval
- Always show dry-run preview first
- Require operation IDs for execution (not wildcards)

**Implementation:**

```typescript
// Tool schema
approved_operations: z.array(z.string())
  .min(1, 'Must approve at least one operation')
  .describe('Operation IDs explicitly approved by user');
```

### 9.3 Rollback Safety

**Requirements:**

- Track ALL operations for potential rollback
- Store original content of modified files
- Verify rollback completion
- Log all errors during rollback

**Implementation:**

```typescript
const executionRecord: ExecutionRecord = {
  planId: plan.planId,
  executedOperations: [],
  timestamp: now(),
};

// Store before each operation
executionRecord.executedOperations.push({
  operationId: op.operationId,
  operation: op,
  originalContent: content, // for modified files
  completedAt: now(),
});
```

### 9.4 Link Update Safety

**Requirements:**

- Parse markdown links carefully
- Only update internal links (within vault)
- Preserve external links unchanged
- Handle edge cases (images, embeds, etc.)

**Implementation:**

```typescript
// Regex for markdown links
const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

// Only update if internal
if (linkPath.startsWith('./') || !linkPath.includes('://')) {
  // Update internal link
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goal:** Core infrastructure and types

**Tasks:**

1. Create module structure
   - `src/vault-analyzer/` directory
   - `src/vault-reorganizer/` directory
2. Define all TypeScript types
   - `vault-analyzer/types.ts`
   - `vault-reorganizer/types.ts`
3. Set up basic exports and imports
4. Write unit tests for types
5. Add custom error classes

**Deliverables:**

- ✅ Type definitions complete
- ✅ Module structure created
- ✅ Basic tests passing

### Phase 2: Vault Analyzer (Week 2)

**Goal:** Analyze vault structure and content

**Tasks:**

1. Implement `vault-scanner.ts`
   - List files via ObsidianClient
   - Build directory tree
   - Identify issues
2. Implement `content-analyzer.ts`
   - Parse markdown structure
   - Extract metadata
   - Classify file types
3. Implement `ai-suggester.ts`
   - Group files by topic
   - Suggest folder structure
   - Propose renames
4. Create `analyze_vault_structure` tool
5. Create `suggest_organization` tool

**Deliverables:**

- ✅ Vault scanning working
- ✅ Content analysis complete
- ✅ Two tools functional
- ✅ Integration tests passing

### Phase 3: Vault Reorganizer (Week 3)

**Goal:** Execute reorganization safely

**Tasks:**

1. Implement `path-planner.ts`
   - Validate paths
   - Check conflicts
   - Order operations
2. Implement `operation-executor.ts`
   - Execute operations
   - Update links
   - Track progress
3. Implement `rollback-manager.ts`
   - Reverse operations
   - Verify restoration
4. Create `reorganize_vault` tool

**Deliverables:**

- ✅ Reorganization execution working
- ✅ Rollback mechanism tested
- ✅ Link updates functional
- ✅ All three tools complete

### Phase 4: Integration & Polish (Week 4)

**Goal:** Full integration and documentation

**Tasks:**

1. Session manager integration
   - Track reorganization in changelog
   - Persist plans to vault
2. Error handling refinement
   - Better error messages
   - Recovery strategies
3. Documentation
   - API documentation
   - User guide
   - Example workflows
4. Testing
   - End-to-end tests
   - Edge case coverage
   - Performance testing

**Deliverables:**

- ✅ Full integration working
- ✅ Documentation complete
- ✅ All tests passing
- ✅ Ready for release

### Phase 5: Advanced Features (Future)

**Optional enhancements:**

1. **Duplicate Detection**: Find and merge similar files
2. **Smart Archival**: Auto-archive old unused files
3. **Tag Standardization**: Suggest tag cleanup
4. **Template Matching**: Suggest templates for file types
5. **Bulk Operations**: Handle large-scale reorganizations
6. **Undo History**: Multi-level undo support

---

## 11. Code Examples

### 11.1 Tool Implementation Example

```typescript
// src/tools/analyze-vault-structure.ts

import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';
import { scanVaultStructure } from '../vault-analyzer/vault-scanner.js';
import { analyzeFileContent } from '../vault-analyzer/content-analyzer.js';

export const analyzeVaultStructureSchema = z.object({
  project_folder: z
    .string()
    .optional()
    .describe('Optional: Override the project folder for this operation'),
  depth_limit: z
    .number()
    .optional()
    .default(10)
    .describe('Maximum directory depth to scan (default: 10)'),
  include_content_analysis: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to analyze file contents (default: true)'),
});

export type AnalyzeVaultStructureInput = z.infer<typeof analyzeVaultStructureSchema>;

export async function analyzeVaultStructure(input: AnalyzeVaultStructureInput): Promise<string> {
  const { project_folder, depth_limit = 10, include_content_analysis = true } = input;

  // Get project context (use override if provided, otherwise session/detected)
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  // Scan vault structure
  const scanResult = await scanVaultStructure(client, context.projectFolder, context.basePath, {
    depthLimit: depth_limit,
  });

  // Optionally analyze content
  const contentAnalyses = new Map<string, ContentAnalysis>();

  if (include_content_analysis) {
    for (const file of scanResult.files) {
      try {
        const analysis = await analyzeFileContent(client, file.path);
        contentAnalyses.set(file.path, analysis);
      } catch (error) {
        console.error(`Failed to analyze ${file.path}:`, error);
        // Continue with other files
      }
    }
  }

  // Return results as JSON
  return JSON.stringify(
    {
      success: true,
      project_folder: context.projectFolder,
      scan_result: scanResult,
      content_analyses: include_content_analysis ? Array.from(contentAnalyses.values()) : undefined,
      timestamp: new Date().toISOString(),
    },
    null,
    2
  );
}
```

### 11.2 Vault Scanner Implementation

```typescript
// src/vault-analyzer/vault-scanner.ts

import { ObsidianClient } from '../obsidian/client.js';
import type { VaultScanResult, DirectoryNode, VaultFileInfo, OrganizationIssue } from './types.js';

export interface ScanOptions {
  depthLimit?: number;
  ignorePatterns?: string[];
}

export async function scanVaultStructure(
  client: ObsidianClient,
  projectFolder: string,
  basePath: string,
  options: ScanOptions = {}
): Promise<VaultScanResult> {
  const { depthLimit = 10, ignorePatterns = [] } = options;

  // Build full path for scanning
  const fullPath = `${basePath}/${projectFolder}`;

  // List all files recursively
  const allFiles = await client.listNotes(fullPath);

  // Build file info array
  const files: VaultFileInfo[] = [];
  let totalSize = 0;

  for (const relativePath of allFiles) {
    const fullFilePath = `${fullPath}/${relativePath}`;

    // Skip ignored patterns
    if (shouldIgnore(relativePath, ignorePatterns)) {
      continue;
    }

    // Calculate depth
    const depth = relativePath.split('/').length;
    if (depth > depthLimit) {
      continue;
    }

    // Get file size (would need to read content - optimization: skip for now)
    // In real implementation, might want to use stat API if available
    const size = 0; // Placeholder

    files.push({
      path: fullFilePath,
      relativePath,
      name: extractFileName(relativePath),
      extension: extractExtension(relativePath),
      size,
      depth,
      parentFolder: extractParentFolder(relativePath),
    });

    totalSize += size;
  }

  // Build directory tree
  const directoryTree = buildDirectoryTree(files, projectFolder);

  // Identify issues
  const issues = identifyIssues(files, directoryTree);

  return {
    projectFolder,
    totalFiles: files.length,
    totalSize,
    directoryTree,
    files,
    issues,
    scanTimestamp: new Date().toISOString(),
  };
}

function buildDirectoryTree(files: VaultFileInfo[], rootName: string): DirectoryNode {
  const root: DirectoryNode = {
    name: rootName,
    path: '',
    type: 'directory',
    children: [],
    fileCount: 0,
    depth: 0,
  };

  // Build tree structure
  for (const file of files) {
    const pathParts = file.relativePath.split('/');
    let currentNode = root;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isFile = i === pathParts.length - 1;

      if (isFile) {
        // Add file node
        currentNode.children = currentNode.children || [];
        currentNode.children.push({
          name: part,
          path: file.relativePath,
          type: 'file',
          depth: i + 1,
        });
        currentNode.fileCount = (currentNode.fileCount || 0) + 1;
      } else {
        // Find or create directory node
        currentNode.children = currentNode.children || [];
        let dirNode = currentNode.children.find(
          (child) => child.name === part && child.type === 'directory'
        );

        if (!dirNode) {
          dirNode = {
            name: part,
            path: pathParts.slice(0, i + 1).join('/'),
            type: 'directory',
            children: [],
            fileCount: 0,
            depth: i + 1,
          };
          currentNode.children.push(dirNode);
        }

        currentNode = dirNode;
      }
    }
  }

  return root;
}

function identifyIssues(files: VaultFileInfo[], tree: DirectoryNode): OrganizationIssue[] {
  const issues: OrganizationIssue[] = [];

  // Check for root clutter (>10 files in root)
  const rootFiles = files.filter((f) => f.depth === 1);
  if (rootFiles.length > 10) {
    issues.push({
      type: 'root-clutter',
      severity: 'high',
      affectedFiles: rootFiles.map((f) => f.path),
      description: `${rootFiles.length} files in root directory`,
      suggestion: 'Organize files into topic-based folders',
    });
  }

  // Check for deep nesting (depth > 5)
  const deepFiles = files.filter((f) => f.depth > 5);
  if (deepFiles.length > 0) {
    issues.push({
      type: 'deep-nesting',
      severity: 'medium',
      affectedFiles: deepFiles.map((f) => f.path),
      description: `${deepFiles.length} files nested deeper than 5 levels`,
      suggestion: 'Flatten directory structure',
    });
  }

  // Check for large folders (>20 files)
  const folderFileCounts = new Map<string, string[]>();
  for (const file of files) {
    const folder = file.parentFolder || 'root';
    const existing = folderFileCounts.get(folder) || [];
    existing.push(file.path);
    folderFileCounts.set(folder, existing);
  }

  for (const [folder, fileList] of folderFileCounts) {
    if (fileList.length > 20) {
      issues.push({
        type: 'large-folder',
        severity: 'medium',
        affectedFiles: fileList,
        description: `Folder "${folder}" contains ${fileList.length} files`,
        suggestion: 'Split into sub-folders by topic or date',
      });
    }
  }

  return issues;
}

// Helper functions
function shouldIgnore(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => path.includes(pattern));
}

function extractFileName(path: string): string {
  return path.split('/').pop() || '';
}

function extractExtension(path: string): string {
  const name = extractFileName(path);
  const parts = name.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

function extractParentFolder(path: string): string {
  const parts = path.split('/');
  parts.pop(); // Remove file name
  return parts.join('/');
}
```

### 11.3 Content Analyzer Implementation

```typescript
// src/vault-analyzer/content-analyzer.ts

import { ObsidianClient } from '../obsidian/client.js';
import type { ContentAnalysis, FileType } from './types.js';

export async function analyzeFileContent(
  client: ObsidianClient,
  filePath: string
): Promise<ContentAnalysis> {
  // Read file content
  const content = await client.readNote(filePath);

  // Parse frontmatter
  const { frontmatter, contentWithoutFrontmatter } = parseFrontmatter(content);

  // Extract headings
  const headings = extractHeadings(contentWithoutFrontmatter);

  // Extract tags
  const tags = extractTags(frontmatter, contentWithoutFrontmatter);

  // Extract keywords (simplified - could use TF-IDF or NLP)
  const keywords = extractKeywords(contentWithoutFrontmatter);

  // Identify topics (from headings and keywords)
  const topics = identifyTopics(headings, keywords);

  // Extract internal links
  const internalLinks = extractInternalLinks(contentWithoutFrontmatter);

  // Count words
  const wordCount = countWords(contentWithoutFrontmatter);

  // Classify file type
  const fileType = classifyFileType(filePath, frontmatter, headings, content);

  // Extract dates if available
  const createdDate = frontmatter?.created as string | undefined;
  const modifiedDate = frontmatter?.modified as string | undefined;

  return {
    filePath,
    fileType,
    topics,
    keywords,
    headings,
    frontmatter,
    tags,
    wordCount,
    linkCount: internalLinks.length,
    internalLinks,
    createdDate,
    modifiedDate,
    // summary would be AI-generated - to be implemented
  };
}

// Helper functions (simplified implementations)

function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown> | null;
  contentWithoutFrontmatter: string;
} {
  const lines = content.split('\n');

  if (lines[0]?.trim() !== '---') {
    return { frontmatter: null, contentWithoutFrontmatter: content };
  }

  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    return { frontmatter: null, contentWithoutFrontmatter: content };
  }

  // Simple YAML parsing (for full implementation, use a library)
  const frontmatter: Record<string, unknown> = {};
  const frontmatterLines = lines.slice(1, closingIndex);

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line
        .slice(colonIndex + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
  }

  const contentWithoutFrontmatter = lines.slice(closingIndex + 1).join('\n');

  return { frontmatter, contentWithoutFrontmatter };
}

function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('#')) {
      headings.push(line.trim());
    }
  }

  return headings;
}

function extractTags(frontmatter: Record<string, unknown> | null, content: string): string[] {
  const tags = new Set<string>();

  // From frontmatter
  if (frontmatter?.tags) {
    const fmTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
    fmTags.forEach((tag) => tags.add(String(tag)));
  }

  // From content (hashtags)
  const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    tags.add(match[1]);
  }

  return Array.from(tags);
}

function extractKeywords(content: string): string[] {
  // Simplified keyword extraction
  // In production, use NLP library or TF-IDF

  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4); // Only words > 4 chars

  // Count frequency
  const freq = new Map<string, number>();
  for (const word of words) {
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  // Get top 10 most frequent
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function identifyTopics(headings: string[], keywords: string[]): string[] {
  // Simplified topic identification
  // In production, use topic modeling or clustering

  const topics = new Set<string>();

  // Extract from level-1 headings
  for (const heading of headings) {
    if (heading.startsWith('# ')) {
      const topic = heading.replace(/^#+\s/, '').toLowerCase();
      topics.add(topic);
    }
  }

  // Add top keywords as topics
  keywords.slice(0, 3).forEach((kw) => topics.add(kw));

  return Array.from(topics);
}

function extractInternalLinks(content: string): string[] {
  const links: string[] = [];

  // Markdown links: [text](url)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const url = match[2];
    // Only internal links (no http/https)
    if (!url.includes('://')) {
      links.push(url);
    }
  }

  // Wiki links: [[link]]
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
  while ((match = wikiLinkRegex.exec(content)) !== null) {
    links.push(match[1]);
  }

  return links;
}

function countWords(content: string): number {
  const cleanedText = content
    .replace(/^#+\s/gm, '') // Remove heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
    .replace(/[*_~`]/g, '') // Remove emphasis markers
    .trim();

  if (!cleanedText) return 0;

  return cleanedText.split(/\s+/).filter((word) => word.length > 0).length;
}

function classifyFileType(
  filePath: string,
  frontmatter: Record<string, unknown> | null,
  headings: string[],
  content: string
): FileType {
  const lowerPath = filePath.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Check frontmatter type
  if (frontmatter?.type) {
    const type = String(frontmatter.type).toLowerCase();
    if (type === 'meeting') return 'meeting-note';
    if (type === 'research') return 'research';
    if (type === 'guide') return 'guide';
  }

  // Check path patterns
  if (lowerPath.includes('meeting')) return 'meeting-note';
  if (lowerPath.includes('research')) return 'research';
  if (lowerPath.includes('guide')) return 'guide';
  if (lowerPath.includes('todo')) return 'todo';
  if (lowerPath.includes('changelog')) return 'changelog';

  // Check content patterns
  if (lowerContent.includes('meeting notes') || lowerContent.includes('attendees')) {
    return 'meeting-note';
  }

  // Daily note pattern (YYYY-MM-DD)
  if (/\d{4}-\d{2}-\d{2}/.test(filePath)) {
    return 'daily-note';
  }

  // Short notes might be fleeting
  if (content.split(/\s+/).length < 100) {
    return 'fleeting-note';
  }

  // Default
  return 'unknown';
}
```

---

## 12. Testing Strategy

### Unit Tests

**Coverage Areas:**

1. Type definitions (compile-time checks)
2. Path validation logic
3. Content parsing functions
4. File classification logic
5. Operation planning logic
6. Rollback logic

**Example Test:**

```typescript
// tests/unit/vault-scanner.test.ts

import { describe, it, expect, vi } from 'vitest';
import { scanVaultStructure } from '../src/vault-analyzer/vault-scanner.js';
import { ObsidianClient } from '../src/obsidian/client.js';

describe('vault-scanner', () => {
  it('should identify root clutter issue', async () => {
    const mockClient = {
      listNotes: vi.fn().mockResolvedValue([
        'file1.md',
        'file2.md',
        // ... 15 files total
      ]),
    } as unknown as ObsidianClient;

    const result = await scanVaultStructure(mockClient, 'test-project', 'Projects');

    expect(result.issues).toContainEqual(
      expect.objectContaining({
        type: 'root-clutter',
        severity: 'high',
      })
    );
  });

  it('should build correct directory tree', async () => {
    const mockClient = {
      listNotes: vi.fn().mockResolvedValue(['docs/api.md', 'docs/guides/setup.md', 'README.md']),
    } as unknown as ObsidianClient;

    const result = await scanVaultStructure(mockClient, 'test-project', 'Projects');

    expect(result.directoryTree.children).toHaveLength(2); // docs/ and README.md
    expect(result.directoryTree.children?.[0]?.type).toBe('directory');
  });
});
```

### Integration Tests

**Coverage Areas:**

1. Full analysis workflow
2. Tool input/output validation
3. ObsidianClient integration
4. Session manager integration
5. Error handling paths

**Example Test:**

```typescript
// tests/integration/vault-organization.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeVaultStructure } from '../src/tools/analyze-vault-structure.js';
import { suggestOrganization } from '../src/tools/suggest-organization.js';

describe('vault organization workflow', () => {
  it('should complete full analysis and suggestion flow', async () => {
    // 1. Analyze
    const analysisResult = await analyzeVaultStructure({
      project_folder: 'test-project',
      include_content_analysis: true,
    });

    const analysis = JSON.parse(analysisResult);
    expect(analysis.success).toBe(true);
    expect(analysis.scan_result.totalFiles).toBeGreaterThan(0);

    // 2. Suggest
    const suggestionResult = await suggestOrganization({
      project_folder: 'test-project',
      analysis_result: analysisResult,
    });

    const suggestions = JSON.parse(suggestionResult);
    expect(suggestions.success).toBe(true);
    expect(suggestions.organization_suggestions).toBeDefined();
  });
});
```

### End-to-End Tests

**Coverage Areas:**

1. Complete user workflows
2. Real vault operations (test vault)
3. Rollback scenarios
4. Error recovery

**Example Test:**

```typescript
// tests/e2e/reorganization.test.ts

describe('vault reorganization e2e', () => {
  it('should successfully reorganize and rollback', async () => {
    // Setup: Create test files in vault
    await setupTestVault();

    // 1. Analyze
    const analysis = await analyzeVaultStructure({
      project_folder: 'e2e-test',
    });

    // 2. Get suggestions
    const suggestions = await suggestOrganization({
      analysis_result: analysis,
    });

    // 3. Execute (dry run)
    const dryRun = await reorganizeVault({
      reorganization_plan: suggestions,
      approved_operations: ['op-1'],
      dry_run: true,
    });

    expect(JSON.parse(dryRun).success).toBe(true);

    // 4. Execute (real)
    const result = await reorganizeVault({
      reorganization_plan: suggestions,
      approved_operations: ['op-1'],
      dry_run: false,
    });

    expect(JSON.parse(result).success).toBe(true);

    // 5. Verify file moved
    const fileExists = await checkFileExists('new/path/file.md');
    expect(fileExists).toBe(true);

    // Cleanup
    await cleanupTestVault();
  });
});
```

---

## Appendix A: Error Handling Patterns

### Custom Error Classes

```typescript
// src/vault-analyzer/types.ts

export class VaultAnalysisError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'VaultAnalysisError';
  }
}

export class ContentAnalysisError extends Error {
  constructor(
    message: string,
    public filePath: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ContentAnalysisError';
  }
}

// src/vault-reorganizer/types.ts

export class ReorganizationError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ReorganizationError';
  }
}

export class RollbackError extends Error {
  constructor(
    message: string,
    public failedOperations: string[],
    public cause?: Error
  ) {
    super(message);
    this.name = 'RollbackError';
  }
}
```

### Error Handling Pattern

```typescript
// Consistent error handling across all tools

try {
  // Operation
} catch (error) {
  if (error instanceof ObsidianNotFoundError) {
    return JSON.stringify({
      success: false,
      error: 'File not found',
      message: error.message,
    });
  }

  if (error instanceof PathValidationError) {
    return JSON.stringify({
      success: false,
      error: 'Invalid path',
      message: error.message,
    });
  }

  // Unknown error
  return JSON.stringify({
    success: false,
    error: 'Unknown error',
    message: error instanceof Error ? error.message : 'Unknown error',
  });
}
```

---

## Appendix B: AI Suggester Prompt Template

For the AI suggester component, here's a template prompt that the system would use:

```markdown
You are analyzing a vault's documentation structure. Based on the following information, suggest an improved organization.

## Vault Analysis

Total Files: {totalFiles}
Current Structure:
{directoryTree}

## File Contents Summary

{contentAnalyses}

## Identified Issues

{issues}

## Task

Suggest:

1. A logical folder structure (max 3 levels deep)
2. Better names for files that don't clearly indicate their purpose
3. Which files should be grouped together
4. Any files that should be archived (>6 months old, rarely linked)

## Output Format

Return JSON with:

- suggestedStructure: array of folder structures with purpose
- fileRecommendations: array of move/rename suggestions with confidence scores
- namingRecommendations: array of rename suggestions
- archiveRecommendations: array of archival suggestions
- rationale: explanation of the overall organizational strategy

## Guidelines

- Use descriptive folder names (not generic like "misc" or "other")
- Group by topic/purpose, not by date (unless daily notes)
- Keep frequently-accessed files easily accessible (shallow depth)
- Use consistent naming conventions
- Consider file relationships (linked files should be near each other)
```

---

## Summary

This design provides a comprehensive vault organization feature that:

1. **Analyzes** vault content intelligently using both structural and content-based analysis
2. **Suggests** improvements using AI-powered insights
3. **Executes** reorganization safely with validation, dry-run, and rollback capabilities
4. **Integrates** seamlessly with existing session management and security infrastructure
5. **Maintains** project patterns for error handling, TypeScript strictness, and path security

The implementation follows a phased approach over 4 weeks, with clear deliverables and testing at each stage. The architecture leverages existing components (ObsidianClient, session manager, path validator) while adding focused new modules for vault analysis and reorganization.
