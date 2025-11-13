# Session Tools

Development session management with automatic tracking and vault persistence.

## Table of Contents

- [Session Lifecycle](#session-lifecycle)
  - [start_session](#start_session)
  - [pause_session](#pause_session)
  - [resume_session](#resume_session)
  - [end_session](#end_session)
  - [get_session_status](#get_session_status)
- [Changelog Management](#changelog-management)
  - [add_changelog_entry](#add_changelog_entry)
  - [get_session_changelog](#get_session_changelog)
  - [get_commit_suggestion](#get_commit_suggestion)
- [Todo Management](#todo-management)
  - [add_todo](#add_todo)
  - [update_todo](#update_todo)
  - [list_todos](#list_todos)

---

## Session Lifecycle

### start_session

Start a new development session with vault persistence.

#### Parameters

| Parameter        | Type   | Required | Description                          |
| ---------------- | ------ | -------- | ------------------------------------ |
| `project_folder` | string | Yes      | Project folder name in vault         |
| `message`        | string | No       | Optional session purpose description |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "project_folder": "my-project",
  "project_name": "my-project",
  "status": "active",
  "started_at": "2025-11-13T14:30:22.123Z",
  "vault_path": "Projects/my-project/sessions/sess_20251113_143022_abc123.json",
  "message": "Session started successfully"
}
```

#### Examples

**Start new session:**

```javascript
start_session({
  project_folder: 'my-web-app',
  message: 'Implementing authentication feature',
});
```

**Start session with auto-detected project:**

```javascript
// Project folder auto-detected from git/directory
start_session({
  project_folder: 'my-project',
});
```

#### Use Cases

- Begin new development work
- Track changes for a feature
- Start debugging session
- Initialize project documentation

#### Notes

- Sets project context for subsequent operations
- Creates session file in vault immediately
- Session ID stored in memory for tool calls
- Only one active session per project

---

### pause_session

Pause the current active session.

#### Parameters

| Parameter        | Type   | Required | Default     | Description                      |
| ---------------- | ------ | -------- | ----------- | -------------------------------- |
| `project_folder` | string | No       | Auto-detect | Optional project folder override |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "project_folder": "my-project",
  "status": "paused",
  "duration": "1h 23m 45s",
  "files_read": 12,
  "files_modified": 5,
  "message": "Session paused successfully"
}
```

#### Examples

**Pause current session:**

```javascript
pause_session({});
```

**Pause specific project session:**

```javascript
pause_session({
  project_folder: 'my-project',
});
```

#### Use Cases

- Take a break from work
- Switch to different task
- End of work day
- Before system maintenance

---

### resume_session

Resume a paused session.

#### Parameters

| Parameter        | Type   | Required | Default     | Description                            |
| ---------------- | ------ | -------- | ----------- | -------------------------------------- |
| `project_folder` | string | No       | Auto-detect | Optional project folder override       |
| `session_id`     | string | No       | Most recent | Optional specific session ID to resume |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "project_folder": "my-project",
  "project_name": "my-project",
  "status": "active",
  "started_at": "2025-11-13T14:30:22.123Z",
  "duration": "1h 23m 45s",
  "files_read": 12,
  "files_modified": 5,
  "todos": 3,
  "changelog_entries": 7,
  "message": "Session resumed successfully"
}
```

#### Examples

**Resume most recent session:**

```javascript
resume_session({});
```

**Resume specific session:**

```javascript
resume_session({
  session_id: 'sess_20251113_143022_abc123',
});
```

#### Use Cases

- Continue work after break
- Resume after system restart
- Switch back to previous task
- Continue from different machine

---

### end_session

Complete and archive the current session.

#### Parameters

| Parameter        | Type   | Required | Default     | Description                      |
| ---------------- | ------ | -------- | ----------- | -------------------------------- |
| `project_folder` | string | No       | Auto-detect | Optional project folder override |
| `message`        | string | No       | -           | Optional completion message      |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "project_folder": "my-project",
  "status": "completed",
  "duration": "2h 15m 30s",
  "summary": {
    "files_read": 15,
    "files_modified": 8,
    "todos_completed": 5,
    "todos_pending": 2,
    "changelog_entries": 12
  },
  "archived_to": "Projects/my-project/sessions/archive/sess_20251113_143022_abc123.json",
  "message": "Session completed successfully"
}
```

#### Examples

**End current session:**

```javascript
end_session({
  message: 'Authentication feature completed',
});
```

**End without message:**

```javascript
end_session({});
```

#### Use Cases

- Complete feature implementation
- Finish debugging session
- End of project milestone
- Archive work session

#### Notes

- Moves session to archive folder
- Generates comprehensive summary
- Clears active session state
- Session cannot be resumed after ending

---

### get_session_status

Get current session status and comprehensive details.

#### Parameters

| Parameter        | Type   | Required | Default     | Description                      |
| ---------------- | ------ | -------- | ----------- | -------------------------------- |
| `project_folder` | string | No       | Auto-detect | Optional project folder override |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "project_folder": "my-project",
  "project_name": "my-project",
  "status": "active",
  "started_at": "2025-11-13T14:30:22.123Z",
  "duration": "45m 12s",
  "context": {
    "files_read": 8,
    "files_modified": 3,
    "current_file": "src/auth.ts"
  },
  "todos": {
    "total": 5,
    "pending": 2,
    "in_progress": 1,
    "completed": 2
  },
  "changelog": {
    "total_entries": 6,
    "by_type": {
      "feature": 3,
      "fix": 2,
      "docs": 1
    }
  },
  "git_context": {
    "branch": "feature/auth",
    "has_uncommitted_changes": true
  }
}
```

#### Examples

**Get current session status:**

```javascript
const status = get_session_status({});
console.log('Duration:', status.duration);
console.log('Files modified:', status.context.files_modified);
```

**Get specific project status:**

```javascript
const status = get_session_status({
  project_folder: 'other-project',
});
```

#### Use Cases

- Check session progress
- Review tracked changes
- Monitor file activity
- Generate status reports

---

## Changelog Management

### add_changelog_entry

Track changes with conventional commit types.

#### Parameters

| Parameter        | Type                                                                        | Required | Default     | Description                       |
| ---------------- | --------------------------------------------------------------------------- | -------- | ----------- | --------------------------------- |
| `project_folder` | string                                                                      | No       | Auto-detect | Optional project folder override  |
| `type`           | `'feature'` \| `'fix'` \| `'refactor'` \| `'docs'` \| `'test'` \| `'chore'` | Yes      | -           | Type of change                    |
| `message`        | string                                                                      | Yes      | -           | Description of the change         |
| `files`          | string[]                                                                    | No       | `[]`        | Files affected by this change     |
| `breaking`       | boolean                                                                     | No       | `false`     | Whether this is a breaking change |

#### Changelog Types

- **`feature`** - New features or functionality
- **`fix`** - Bug fixes
- **`refactor`** - Code refactoring (no behavior change)
- **`docs`** - Documentation changes
- **`test`** - Test additions or modifications
- **`chore`** - Maintenance tasks, dependencies, etc.

#### Return Value

```json
{
  "success": true,
  "entry_id": "chg_20251113_143045_xyz789",
  "type": "feature",
  "message": "Add JWT authentication",
  "files_count": 3,
  "breaking": false,
  "total_entries": 7,
  "message_text": "[OK] Changelog entry added successfully"
}
```

#### Examples

**Add feature entry:**

```javascript
add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts', 'src/middleware/auth.ts', 'tests/auth.test.ts'],
});
```

**Add bug fix:**

```javascript
add_changelog_entry({
  type: 'fix',
  message: 'Fix memory leak in session cleanup',
  files: ['src/session.ts'],
});
```

**Add breaking change:**

```javascript
add_changelog_entry({
  type: 'feature',
  message: 'Restructure API endpoints',
  files: ['src/routes/api.ts'],
  breaking: true,
});
```

**Add documentation update:**

```javascript
add_changelog_entry({
  type: 'docs',
  message: 'Update installation instructions',
  files: ['README.md'],
});
```

#### Use Cases

- Track feature development
- Document bug fixes
- Record refactoring work
- Note documentation updates
- Generate commit messages
- Create release notes

---

### get_session_changelog

View changelog for current session.

#### Parameters

| Parameter        | Type   | Required | Default     | Description                      |
| ---------------- | ------ | -------- | ----------- | -------------------------------- |
| `project_folder` | string | No       | Auto-detect | Optional project folder override |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "total_entries": 8,
  "entries": [
    {
      "id": "chg_20251113_143045_xyz789",
      "timestamp": "2025-11-13T14:30:45.123Z",
      "type": "feature",
      "message": "Add JWT authentication",
      "files": ["src/auth.ts", "src/middleware/auth.ts"],
      "impact": null
    },
    {
      "id": "chg_20251113_150122_abc456",
      "timestamp": "2025-11-13T15:01:22.456Z",
      "type": "fix",
      "message": "Fix session cleanup bug",
      "files": ["src/session.ts"],
      "impact": null
    }
  ],
  "by_type": {
    "feature": 3,
    "fix": 2,
    "docs": 2,
    "refactor": 1
  },
  "formatted": "Features:\n  - Add JWT authentication (2 files)\n  - Add user roles (3 files)\n\nBug Fixes:\n  - Fix session cleanup bug (1 files)\n  - Fix validation error (1 files)"
}
```

#### Examples

**Get changelog:**

```javascript
const changelog = get_session_changelog({});
console.log('Total entries:', changelog.total_entries);
console.log(changelog.formatted);
```

#### Use Cases

- Review session changes
- Generate release notes
- Create commit messages
- Track progress
- Document work done

---

### get_commit_suggestion

Generate commit messages from session changelog.

#### Parameters

| Parameter        | Type    | Required | Default     | Description                      |
| ---------------- | ------- | -------- | ----------- | -------------------------------- |
| `project_folder` | string  | No       | Auto-detect | Optional project folder override |
| `conventional`   | boolean | No       | `true`      | Use conventional commit format   |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "commit_message": "feat: add authentication system\n\n- Add JWT authentication\n- Add user roles and permissions\n- Add login/logout endpoints\n\nBREAKING CHANGE: API endpoints restructured",
  "type": "feature",
  "breaking_changes": true,
  "files_affected": 8,
  "entries_included": 6
}
```

#### Examples

**Generate conventional commit:**

```javascript
const suggestion = get_commit_suggestion({
  conventional: true,
});

console.log(suggestion.commit_message);
// Output:
// feat: add authentication system
//
// - Add JWT authentication
// - Add user roles and permissions
// - Add login/logout endpoints
```

**Generate simple commit:**

```javascript
const suggestion = get_commit_suggestion({
  conventional: false,
});

console.log(suggestion.commit_message);
// Output:
// Add authentication system
//
// - Add JWT authentication
// - Add user roles and permissions
```

#### Conventional Commit Prefixes

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

#### Use Cases

- Generate git commit messages
- Create pull request descriptions
- Document release changes
- Automate changelog generation

---

## Todo Management

### add_todo

Add todos to the current session.

#### Parameters

| Parameter        | Type                              | Required | Default     | Description                      |
| ---------------- | --------------------------------- | -------- | ----------- | -------------------------------- |
| `project_folder` | string                            | No       | Auto-detect | Optional project folder override |
| `content`        | string                            | Yes      | -           | Todo description                 |
| `priority`       | `'high'` \| `'medium'` \| `'low'` | No       | `'medium'`  | Todo priority                    |

#### Return Value

```json
{
  "success": true,
  "todo_id": "todo_20251113_143055_def123",
  "content": "Implement password reset flow",
  "priority": "high",
  "status": "pending",
  "total_todos": 6,
  "message": "Todo added successfully"
}
```

#### Examples

**Add high priority todo:**

```javascript
add_todo({
  content: 'Implement password reset flow',
  priority: 'high',
});
```

**Add medium priority todo:**

```javascript
add_todo({
  content: 'Write API documentation',
});
```

**Add low priority todo:**

```javascript
add_todo({
  content: 'Refactor utility functions',
  priority: 'low',
});
```

#### Use Cases

- Track implementation tasks
- Note bugs to fix
- Remember documentation updates
- Plan refactoring work

---

### update_todo

Update todo status or priority.

#### Parameters

| Parameter        | Type                                                             | Required | Default     | Description                      |
| ---------------- | ---------------------------------------------------------------- | -------- | ----------- | -------------------------------- |
| `project_folder` | string                                                           | No       | Auto-detect | Optional project folder override |
| `todo_id`        | string                                                           | Yes      | -           | Todo ID to update                |
| `status`         | `'pending'` \| `'in_progress'` \| `'completed'` \| `'cancelled'` | No       | -           | New status                       |
| `priority`       | `'high'` \| `'medium'` \| `'low'`                                | No       | -           | New priority                     |

#### Return Value

```json
{
  "success": true,
  "todo_id": "todo_20251113_143055_def123",
  "content": "Implement password reset flow",
  "status": "completed",
  "priority": "high",
  "completed_at": "2025-11-13T16:45:30.123Z",
  "message": "Todo updated successfully"
}
```

#### Examples

**Mark todo as in progress:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  status: 'in_progress',
});
```

**Complete todo:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  status: 'completed',
});
```

**Change priority:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  priority: 'low',
});
```

**Update both status and priority:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  status: 'in_progress',
  priority: 'high',
});
```

#### Use Cases

- Track task progress
- Reprioritize work
- Mark tasks complete
- Cancel obsolete tasks

---

### list_todos

List todos from current session with optional filters.

#### Parameters

| Parameter        | Type                                                             | Required | Default     | Description                      |
| ---------------- | ---------------------------------------------------------------- | -------- | ----------- | -------------------------------- |
| `project_folder` | string                                                           | No       | Auto-detect | Optional project folder override |
| `status`         | `'pending'` \| `'in_progress'` \| `'completed'` \| `'cancelled'` | No       | -           | Filter by status                 |
| `priority`       | `'high'` \| `'medium'` \| `'low'`                                | No       | -           | Filter by priority               |

#### Return Value

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "total_todos": 8,
  "filtered_count": 3,
  "todos": [
    {
      "id": "todo_20251113_143055_def123",
      "content": "Implement password reset flow",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2025-11-13T14:30:55.123Z",
      "completed_at": null
    },
    {
      "id": "todo_20251113_144012_ghi456",
      "content": "Write API documentation",
      "status": "pending",
      "priority": "medium",
      "created_at": "2025-11-13T14:40:12.456Z",
      "completed_at": null
    }
  ],
  "by_status": {
    "pending": 2,
    "in_progress": 1,
    "completed": 4,
    "cancelled": 1
  },
  "by_priority": {
    "high": 2,
    "medium": 4,
    "low": 2
  },
  "formatted": "Pending (2):\n  [MED] [todo_...] Write API documentation\n\nIn Progress (1):\n  [HIGH] [todo_...] Implement password reset flow"
}
```

#### Examples

**List all todos:**

```javascript
const todos = list_todos({});
console.log(todos.formatted);
```

**List pending todos:**

```javascript
const pending = list_todos({
  status: 'pending',
});
```

**List high priority todos:**

```javascript
const highPriority = list_todos({
  priority: 'high',
});
```

**List pending high priority todos:**

```javascript
const urgent = list_todos({
  status: 'pending',
  priority: 'high',
});
```

#### Use Cases

- Review pending tasks
- Check completed work
- Prioritize next tasks
- Track progress

---

## Common Workflows

### Workflow 1: Feature Development Session

```javascript
// 1. Start session
start_session({
  project_folder: 'my-app',
  message: 'Implementing authentication',
});

// 2. Add todos
add_todo({
  content: 'Implement JWT authentication',
  priority: 'high',
});
add_todo({
  content: 'Add login/logout endpoints',
  priority: 'high',
});
add_todo({
  content: 'Write authentication tests',
  priority: 'medium',
});

// 3. Work on tasks, track changes
add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts', 'src/middleware/auth.ts'],
});

update_todo({
  todo_id: 'todo_...',
  status: 'completed',
});

// 4. Generate commit
const commit = get_commit_suggestion({ conventional: true });
console.log(commit.commit_message);

// 5. End session
end_session({
  message: 'Authentication feature completed',
});
```

### Workflow 2: Bug Fix Session

```javascript
// 1. Start session
start_session({
  project_folder: 'my-app',
  message: 'Fixing memory leak',
});

// 2. Track investigation
add_changelog_entry({
  type: 'fix',
  message: 'Investigate memory leak in session cleanup',
  files: ['src/session.ts'],
});

// 3. Track fix
add_changelog_entry({
  type: 'fix',
  message: 'Fix memory leak by clearing event listeners',
  files: ['src/session.ts'],
});

// 4. Add test
add_changelog_entry({
  type: 'test',
  message: 'Add memory leak regression test',
  files: ['tests/session.test.ts'],
});

// 5. Generate commit and end
const commit = get_commit_suggestion({ conventional: true });
end_session({ message: 'Memory leak fixed' });
```

### Workflow 3: Documentation Session

```javascript
// 1. Start session
start_session({
  project_folder: 'my-app',
  message: 'Updating documentation',
});

// 2. Track documentation changes
add_changelog_entry({
  type: 'docs',
  message: 'Update installation instructions',
  files: ['README.md'],
});

add_changelog_entry({
  type: 'docs',
  message: 'Add API documentation',
  files: ['docs/api.md'],
});

add_changelog_entry({
  type: 'docs',
  message: 'Update changelog',
  files: ['CHANGELOG.md'],
});

// 3. Generate commit
const commit = get_commit_suggestion({ conventional: true });

// 4. End session
end_session({ message: 'Documentation updated' });
```

## Best Practices

### Session Management

1. **Start sessions for focused work:**

   ```javascript
   start_session({
     project_folder: 'my-app',
     message: 'Clear, descriptive purpose',
   });
   ```

2. **Pause when switching tasks:**

   ```javascript
   pause_session({});
   // Switch to different work
   resume_session({});
   ```

3. **End sessions when complete:**
   ```javascript
   end_session({
     message: 'Summary of work done',
   });
   ```

### Changelog Tracking

1. **Track changes as you work:**

   ```javascript
   // After implementing feature
   add_changelog_entry({
     type: 'feature',
     message: 'Add user authentication',
     files: ['src/auth.ts'],
   });
   ```

2. **Use appropriate types:**
   - `feature` - New functionality
   - `fix` - Bug fixes
   - `refactor` - Code improvements
   - `docs` - Documentation
   - `test` - Tests
   - `chore` - Maintenance

3. **Mark breaking changes:**
   ```javascript
   add_changelog_entry({
     type: 'feature',
     message: 'Restructure API',
     breaking: true,
   });
   ```

### Todo Management

1. **Add todos as you think of them:**

   ```javascript
   add_todo({
     content: 'Implement feature X',
     priority: 'high',
   });
   ```

2. **Update status regularly:**

   ```javascript
   update_todo({
     todo_id: 'todo_...',
     status: 'in_progress',
   });
   ```

3. **Review pending todos:**
   ```javascript
   const pending = list_todos({ status: 'pending' });
   ```

## Related Documentation

- [Core Tools](./core-tools.md) - Basic note operations
- [Editing Tools](./editing-tools.md) - Advanced editing
- [Configuration Guide](../configuration.md) - Setup and configuration
- [Session Management](../../src/session/README.md) - Session implementation details
