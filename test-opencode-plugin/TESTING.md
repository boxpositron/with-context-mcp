# Batch 3 Testing Guide

## Test Scenarios

### Scenario 1: Plugin Initialization

**Goal**: Verify plugin loads correctly

1. Open `test-opencode-plugin` directory in OpenCode
2. Check console for "WithContext plugin initialized" message
3. Run `with_context_status()` tool
4. Expected output:
   ```json
   {
     "status": "active",
     "config": {
       "vaultPath": "/path/to/vault",
       "basePath": "Projects"
     },
     "version": "0.1.0"
   }
   ```

### Scenario 2: Write Note (Create Mode)

**Goal**: Create a new note

1. Run:

   ```typescript
   write_note({
     path: 'CHANGELOG.md',
     content: '# Changelog\n\n## v0.1.0\n- Initial release',
     mode: 'create',
   });
   ```

2. Expected output:

   ```json
   {
     "success": true,
     "path": "Projects/test-opencode-plugin/CHANGELOG.md",
     "mode": "create",
     "project_folder": "test-opencode-plugin",
     "message": "Note created successfully"
   }
   ```

3. Verify in Obsidian that the note exists at the correct path

### Scenario 3: Read Note

**Goal**: Read the created note

1. Run:

   ```typescript
   read_note({
     path: 'CHANGELOG.md',
   });
   ```

2. Expected output:
   ```json
   {
     "success": true,
     "path": "Projects/test-opencode-plugin/CHANGELOG.md",
     "project_folder": "test-opencode-plugin",
     "content": "# Changelog\n\n## v0.1.0\n- Initial release",
     "metadata": {
       "length": 42,
       "lines": 4
     }
   }
   ```

### Scenario 4: Write Note (Overwrite Mode)

**Goal**: Update existing note

1. Run:

   ```typescript
   write_note({
     path: 'CHANGELOG.md',
     content: '# Changelog\n\n## v0.2.0\n- Added features\n\n## v0.1.0\n- Initial release',
     mode: 'overwrite',
   });
   ```

2. Verify content was replaced
3. Read note again to confirm changes

### Scenario 5: Write Note (Append Mode)

**Goal**: Append to existing note

1. Run:

   ```typescript
   write_note({
     path: 'CHANGELOG.md',
     content: '\n\n## v0.3.0\n- More updates',
     mode: 'append',
   });
   ```

2. Read note to verify content was appended

### Scenario 6: Error Handling - Read Non-existent Note

**Goal**: Verify error handling

1. Run:

   ```typescript
   read_note({
     path: 'does-not-exist.md',
   });
   ```

2. Expected: Error message in response

### Scenario 7: Error Handling - Create Existing Note

**Goal**: Verify create mode prevents overwrites

1. Run:

   ```typescript
   write_note({
     path: 'CHANGELOG.md',
     content: 'New content',
     mode: 'create',
   });
   ```

2. Expected: Error about file already existing

### Scenario 8: Nested Paths

**Goal**: Create notes in subdirectories

1. Run:

   ```typescript
   write_note({
     path: 'docs/api.md',
     content: '# API Documentation',
     mode: 'create',
   });
   ```

2. Verify folder structure is created in Obsidian

## Success Criteria

- [ ] All 8 scenarios pass
- [ ] Notes appear in correct Obsidian vault location
- [ ] Error messages are clear and helpful
- [ ] No console errors during plugin load
- [ ] Plugin state persists across OpenCode sessions

## Known Limitations

1. Plugin requires Obsidian Local REST API to be running
2. Plugin requires valid environment variables
3. Project folder detection may need manual configuration
4. First run may require setting project context explicitly

## Next Steps After Testing

If all tests pass:

- Document any issues found
- Create list of improvements for Batch 4
- Plan additional tools to implement

If tests fail:

- Debug specific failure scenarios
- Fix issues in plugin code
- Re-test and verify fixes
