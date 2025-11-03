# Batch 4 Plan - Additional Tools

**Status**: Planning  
**Previous**: Batch 3 - Testing (87.5% pass rate, 100% after fix)  
**Goal**: Expand plugin with remaining MCP tools

## Tools to Implement

### High Priority

#### 1. list_notes

**Purpose**: List all notes in project folder  
**Complexity**: Low  
**Estimated Time**: 30 minutes

**Tool Signature**:

```typescript
list_notes({
  path?: string,           // Optional: subfolder path
  project_folder?: string  // Optional: override project
})
```

**Implementation**:

- Wrap `src/tools/list-notes.ts`
- Return array of file paths
- Support filtering by subfolder

---

#### 2. search_notes

**Purpose**: Search notes by content  
**Complexity**: Medium  
**Estimated Time**: 45 minutes

**Tool Signature**:

```typescript
search_notes({
  query: string,
  project_folder?: string,
  case_sensitive?: boolean,
  limit?: number
})
```

**Implementation**:

- Wrap `src/tools/search-notes.ts`
- Return matching files with snippets
- Support case sensitivity option

---

#### 3. set_project_context

**Purpose**: Manually override project folder detection  
**Complexity**: Low  
**Estimated Time**: 20 minutes

**Tool Signature**:

```typescript
set_project_context({
  project_folder: string,
});
```

**Implementation**:

- Wrap `src/tools/set-project-context.ts`
- Allow explicit project folder setting
- Persist for session

---

### Medium Priority

#### 4. get_note_metadata

**Purpose**: Get note metadata (tags, headings, word count)  
**Complexity**: Medium  
**Estimated Time**: 30 minutes

**Tool Signature**:

```typescript
get_note_metadata({
  path: string,
  project_folder?: string
})
```

**Implementation**:

- Wrap `src/tools/get-note-metadata.ts`
- Return frontmatter, tags, headings
- Include word/line counts

---

#### 5. delete_note

**Purpose**: Delete notes with confirmation  
**Complexity**: Low  
**Estimated Time**: 20 minutes

**Tool Signature**:

```typescript
delete_note({
  path: string,
  confirm: boolean,
  project_folder?: string
})
```

**Implementation**:

- Wrap `src/tools/delete-note.ts`
- Require explicit confirmation
- Return success/error

---

### Lower Priority

#### 6. batch_write_notes

**Purpose**: Write multiple notes at once  
**Complexity**: Medium  
**Estimated Time**: 45 minutes

**Tool Signature**:

```typescript
batch_write_notes({
  notes: Array<{
    path: string,
    content: string,
    mode?: 'create' | 'overwrite' | 'append'
  }>,
  project_folder?: string
})
```

**Implementation**:

- Wrap `src/tools/batch-write-notes.ts`
- Process each note independently
- Return summary with per-note status

---

#### 7. list_templates

**Purpose**: List available note templates  
**Complexity**: Low  
**Estimated Time**: 15 minutes

**Tool Signature**:

```typescript
list_templates();
```

**Implementation**:

- Wrap `src/tools/list-templates.ts`
- Return template names and descriptions

---

#### 8. create_from_template

**Purpose**: Create note from template  
**Complexity**: Medium  
**Estimated Time**: 30 minutes

**Tool Signature**:

```typescript
create_from_template({
  template_name: string,
  filename: string,
  variables?: object,
  project_folder?: string
})
```

**Implementation**:

- Wrap `src/tools/create-from-template.ts`
- Support variable substitution
- Auto-fill common variables (date, time)

---

## Implementation Strategy

### Phase 1: Core Tools (1.5 hours)

1. list_notes
2. search_notes
3. set_project_context

### Phase 2: Metadata & Deletion (50 minutes)

4. get_note_metadata
5. delete_note

### Phase 3: Advanced Features (1.5 hours)

6. batch_write_notes
7. list_templates
8. create_from_template

### Total Estimated Time: 3.5 hours

## Testing Plan

For each new tool:

1. Create test case in TEST-PLAN.md
2. Run manual test in OpenCode
3. Verify in Obsidian vault
4. Document results

## Success Criteria

- [ ] All 8 tools implemented
- [ ] All tools tested and working
- [ ] No regressions in existing tools
- [ ] Documentation updated
- [ ] 90%+ test pass rate

## Post-Batch 4

After completing these tools, the plugin will have:

- ✅ 11 total tools (3 from Batch 2 + 8 from Batch 4)
- ✅ Full MCP feature parity
- ✅ Ready for production use

Then move to **Batch 5**:

- Event hooks
- Performance optimizations
- Advanced error handling
- Documentation polish
- Publish to npm
