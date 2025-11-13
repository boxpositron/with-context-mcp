# Session Management Guide

Complete guide to tracking your development work with sessions, changelogs, and todos.

## Table of Contents

- [What Are Sessions?](#what-are-sessions)
- [When to Use Sessions](#when-to-use-sessions)
- [Session Lifecycle](#session-lifecycle)
- [Working with Changelogs](#working-with-changelogs)
- [Working with Todos](#working-with-todos)
- [Best Practices](#best-practices)
- [Complete Workflow Examples](#complete-workflow-examples)
- [Troubleshooting](#troubleshooting)

---

## What Are Sessions?

Sessions are time-bound work periods that track your development activity. Think of them as development "sprints" or "work sessions" that automatically capture:

- **Files you read and modify** - Automatic tracking of file operations
- **Changes you make** - Changelog entries with conventional commit types
- **Tasks you need to do** - Todo items with priorities and status
- **Git context** - Current branch and commit information
- **Session metadata** - Duration, timestamps, environment details

### Key Features

**Persistent State:**

- Sessions are stored in your Obsidian vault
- Survive tool restarts and system reboots
- Can be paused and resumed anytime
- Archived when completed for historical reference

**Automatic Tracking:**

- File reads and modifications tracked automatically
- Debounced updates for performance (2s delay)
- Immediate persistence for lifecycle events
- Git context captured automatically

**Flexible Management:**

- Start/pause/resume/end lifecycle
- Manual changelog entries with conventional types
- Todo management with priorities
- Generate commit messages from changelog

---

## When to Use Sessions

### Use Sessions For:

**Feature Development:**

```javascript
start_session({
  project_folder: 'my-app',
  message: 'Implementing user authentication',
});
```

Track all changes related to a specific feature from start to finish.

**Bug Fixing:**

```javascript
start_session({
  project_folder: 'my-app',
  message: 'Fixing memory leak in session cleanup',
});
```

Document investigation, fix, and testing in one session.

**Refactoring Work:**

```javascript
start_session({
  project_folder: 'my-app',
  message: 'Refactoring database layer',
});
```

Track all files affected by refactoring with automatic file tracking.

**Documentation Updates:**

```javascript
start_session({
  project_folder: 'my-app',
  message: 'Updating API documentation',
});
```

Keep track of all documentation changes in one place.

### Don't Use Sessions For:

- **Quick file edits** - Not worth the overhead
- **Read-only exploration** - No changes to track
- **Automated scripts** - Sessions are for human workflows
- **CI/CD environments** - Not designed for automation

---

## Session Lifecycle

### 1. Starting a Session

**Basic Start:**

```javascript
start_session({
  project_folder: 'my-web-app',
  message: 'Implementing authentication feature',
});
```

**Response:**

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "project_folder": "my-web-app",
  "status": "active",
  "started_at": "2025-11-13T14:30:22.123Z",
  "vault_path": "Projects/my-web-app/sessions/sess_20251113_143022_abc123.json"
}
```

**What Happens:**

- Session created with unique ID
- Saved to vault immediately
- Project context set for subsequent operations
- Git context captured (branch, last commit)
- Session marked as "active"

### 2. Pausing a Session

**When to Pause:**

- Taking a break
- Switching to different task
- End of work day
- Before system maintenance

**How to Pause:**

```javascript
pause_session({});
```

**Response:**

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "status": "paused",
  "duration": "1h 23m 45s",
  "files_read": 12,
  "files_modified": 5
}
```

**What Happens:**

- Session status changed to "paused"
- Duration calculated and saved
- Timers cleared
- State persisted to vault
- Can be resumed later

### 3. Resuming a Session

**Resume Most Recent:**

```javascript
resume_session({});
```

**Resume Specific Session:**

```javascript
resume_session({
  session_id: 'sess_20251113_143022_abc123',
});
```

**Response:**

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "status": "active",
  "duration": "1h 23m 45s",
  "files_read": 12,
  "files_modified": 5,
  "todos": 3,
  "changelog_entries": 7
}
```

**What Happens:**

- Session reactivated
- Timers restarted
- Project context restored
- Can continue tracking changes

### 4. Ending a Session

**Complete Session:**

```javascript
end_session({
  message: 'Authentication feature completed',
});
```

**Response:**

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "status": "completed",
  "duration": "2h 15m 30s",
  "summary": {
    "files_read": 15,
    "files_modified": 8,
    "todos_completed": 5,
    "todos_pending": 2,
    "changelog_entries": 12
  },
  "archived_to": "Projects/my-web-app/sessions/archive/sess_20251113_143022_abc123.json"
}
```

**What Happens:**

- Session marked as "completed"
- Comprehensive summary generated
- Moved to archive folder
- Cannot be resumed (permanent)
- Historical record preserved

### 5. Checking Session Status

**Get Current Status:**

```javascript
get_session_status({});
```

**Response:**

```json
{
  "success": true,
  "session_id": "sess_20251113_143022_abc123",
  "project_folder": "my-web-app",
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

---

## Working with Changelogs

### What is a Changelog?

A changelog is a record of all changes made during a session, organized by type using conventional commit conventions.

### Changelog Types

| Type       | Use For                                  | Example                                |
| ---------- | ---------------------------------------- | -------------------------------------- |
| `feature`  | New features or functionality            | "Add JWT authentication"               |
| `fix`      | Bug fixes                                | "Fix memory leak in session cleanup"   |
| `refactor` | Code refactoring (no behavior change)    | "Refactor database connection pooling" |
| `docs`     | Documentation changes                    | "Update API documentation"             |
| `test`     | Test additions or modifications          | "Add integration tests for auth"       |
| `chore`    | Maintenance tasks, dependencies, tooling | "Update dependencies to latest"        |

### Adding Changelog Entries

**Feature Entry:**

```javascript
add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts', 'src/middleware/auth.ts', 'tests/auth.test.ts'],
});
```

**Bug Fix Entry:**

```javascript
add_changelog_entry({
  type: 'fix',
  message: 'Fix memory leak in session cleanup',
  files: ['src/session.ts'],
});
```

**Breaking Change:**

```javascript
add_changelog_entry({
  type: 'feature',
  message: 'Restructure API endpoints',
  files: ['src/routes/api.ts'],
  breaking: true, // Mark as breaking change
});
```

**Documentation Update:**

```javascript
add_changelog_entry({
  type: 'docs',
  message: 'Update installation instructions',
  files: ['README.md'],
});
```

### Viewing Changelog

**Get Session Changelog:**

```javascript
const changelog = get_session_changelog({});
```

**Response:**

```json
{
  "success": true,
  "total_entries": 8,
  "entries": [
    {
      "id": "chg_20251113_143045_xyz789",
      "timestamp": "2025-11-13T14:30:45.123Z",
      "type": "feature",
      "message": "Add JWT authentication",
      "files": ["src/auth.ts", "src/middleware/auth.ts"]
    }
  ],
  "by_type": {
    "feature": 3,
    "fix": 2,
    "docs": 2,
    "refactor": 1
  },
  "formatted": "Features:\n  - Add JWT authentication (2 files)\n\nBug Fixes:\n  - Fix session cleanup bug (1 files)"
}
```

### Generating Commit Messages

**Conventional Commit Format:**

```javascript
const suggestion = get_commit_suggestion({
  conventional: true,
});
```

**Response:**

```json
{
  "success": true,
  "commit_message": "feat: add authentication system\n\n- Add JWT authentication\n- Add user roles and permissions\n- Add login/logout endpoints\n\nBREAKING CHANGE: API endpoints restructured",
  "type": "feature",
  "breaking_changes": true,
  "files_affected": 8,
  "entries_included": 6
}
```

**Simple Format:**

```javascript
const suggestion = get_commit_suggestion({
  conventional: false,
});
```

**Commit Message Prefixes:**

- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

---

## Working with Todos

### What are Todos?

Todos are task items tracked within your session. They help you:

- Remember what needs to be done
- Track task progress
- Prioritize work
- Review completed work

### Adding Todos

**High Priority Todo:**

```javascript
add_todo({
  content: 'Implement password reset flow',
  priority: 'high',
});
```

**Medium Priority (Default):**

```javascript
add_todo({
  content: 'Write API documentation',
});
```

**Low Priority:**

```javascript
add_todo({
  content: 'Refactor utility functions',
  priority: 'low',
});
```

**Response:**

```json
{
  "success": true,
  "todo_id": "todo_20251113_143055_def123",
  "content": "Implement password reset flow",
  "priority": "high",
  "status": "pending",
  "total_todos": 6
}
```

### Updating Todos

**Mark as In Progress:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  status: 'in_progress',
});
```

**Complete Todo:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  status: 'completed',
});
```

**Change Priority:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  priority: 'low',
});
```

**Update Both:**

```javascript
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  status: 'in_progress',
  priority: 'high',
});
```

### Listing Todos

**All Todos:**

```javascript
const todos = list_todos({});
```

**Filter by Status:**

```javascript
const pending = list_todos({
  status: 'pending',
});
```

**Filter by Priority:**

```javascript
const highPriority = list_todos({
  priority: 'high',
});
```

**Combined Filters:**

```javascript
const urgent = list_todos({
  status: 'pending',
  priority: 'high',
});
```

**Response:**

```json
{
  "success": true,
  "total_todos": 8,
  "filtered_count": 3,
  "todos": [
    {
      "id": "todo_20251113_143055_def123",
      "content": "Implement password reset flow",
      "status": "in_progress",
      "priority": "high",
      "created_at": "2025-11-13T14:30:55.123Z"
    }
  ],
  "by_status": {
    "pending": 2,
    "in_progress": 1,
    "completed": 4,
    "cancelled": 1
  },
  "formatted": "Pending (2):\n  [MED] Write API documentation\n\nIn Progress (1):\n  [HIGH] Implement password reset flow"
}
```

---

## Best Practices

### Session Management

**1. Start sessions for focused work:**

```javascript
// Good - Clear purpose
start_session({
  project_folder: 'my-app',
  message: 'Implementing user authentication',
});

// Bad - Vague purpose
start_session({
  project_folder: 'my-app',
  message: 'Working on stuff',
});
```

**2. Pause when switching contexts:**

```javascript
// Working on feature A
start_session({ message: 'Feature A' });

// Need to fix urgent bug
pause_session({});

// Fix bug in different session
start_session({ message: 'Fix critical bug' });
end_session({});

// Resume feature work
resume_session({});
```

**3. End sessions when complete:**

```javascript
// Good - Descriptive summary
end_session({
  message: 'Authentication feature completed with tests',
});

// Bad - No context
end_session({});
```

**4. Check status regularly:**

```javascript
// Review progress
const status = get_session_status({});
console.log('Duration:', status.duration);
console.log('Files modified:', status.context.files_modified);
```

### Changelog Tracking

**1. Track changes as you work:**

```javascript
// After implementing feature
add_changelog_entry({
  type: 'feature',
  message: 'Add user authentication',
  files: ['src/auth.ts'],
});

// After fixing bug
add_changelog_entry({
  type: 'fix',
  message: 'Fix session cleanup',
  files: ['src/session.ts'],
});
```

**2. Use specific, descriptive messages:**

```javascript
// Good - Specific and clear
add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication with refresh tokens',
  files: ['src/auth.ts', 'src/tokens.ts'],
});

// Bad - Vague
add_changelog_entry({
  type: 'feature',
  message: 'Add stuff',
  files: ['src/auth.ts'],
});
```

**3. Mark breaking changes:**

```javascript
add_changelog_entry({
  type: 'feature',
  message: 'Restructure API endpoints to RESTful format',
  files: ['src/routes/api.ts'],
  breaking: true, // Important!
});
```

**4. Group related changes:**

```javascript
// Good - One entry per logical change
add_changelog_entry({
  type: 'feature',
  message: 'Add user authentication',
  files: ['src/auth.ts', 'src/middleware/auth.ts', 'tests/auth.test.ts'],
});

// Bad - Too granular
add_changelog_entry({
  type: 'feature',
  message: 'Add auth.ts',
  files: ['src/auth.ts'],
});
add_changelog_entry({
  type: 'feature',
  message: 'Add middleware',
  files: ['src/middleware/auth.ts'],
});
```

### Todo Management

**1. Add todos as you think of them:**

```javascript
// During implementation, realize you need tests
add_todo({
  content: 'Write integration tests for authentication',
  priority: 'high',
});

// Notice potential improvement
add_todo({
  content: 'Refactor auth middleware for better performance',
  priority: 'low',
});
```

**2. Update status regularly:**

```javascript
// Starting work on todo
update_todo({
  todo_id: 'todo_...',
  status: 'in_progress',
});

// Completed
update_todo({
  todo_id: 'todo_...',
  status: 'completed',
});
```

**3. Review pending todos before ending session:**

```javascript
// Check what's left
const pending = list_todos({ status: 'pending' });

// Decide: complete, carry over, or cancel
pending.todos.forEach((todo) => {
  // Handle each todo appropriately
});

end_session({ message: 'Feature complete, 2 todos carried over' });
```

**4. Use priorities effectively:**

- **High** - Must be done in this session
- **Medium** - Should be done soon
- **Low** - Nice to have, can wait

---

## Complete Workflow Examples

### Example 1: Feature Development

```javascript
// 1. Start session
start_session({
  project_folder: 'my-web-app',
  message: 'Implementing user authentication',
});

// 2. Plan work with todos
add_todo({
  content: 'Implement JWT authentication',
  priority: 'high',
});
add_todo({
  content: 'Add login/logout endpoints',
  priority: 'high',
});
add_todo({
  content: 'Add password reset flow',
  priority: 'medium',
});
add_todo({
  content: 'Write authentication tests',
  priority: 'high',
});

// 3. Work on first task
// (Edit files using your editor/IDE)

// 4. Track completion
update_todo({
  todo_id: 'todo_jwt_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication with refresh tokens',
  files: ['src/auth.ts', 'src/tokens.ts'],
});

// 5. Continue with next task
update_todo({
  todo_id: 'todo_endpoints_...',
  status: 'in_progress',
});

// (Edit files)

update_todo({
  todo_id: 'todo_endpoints_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'feature',
  message: 'Add login and logout endpoints',
  files: ['src/routes/auth.ts'],
});

// 6. Add tests
update_todo({
  todo_id: 'todo_tests_...',
  status: 'in_progress',
});

// (Write tests)

update_todo({
  todo_id: 'todo_tests_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'test',
  message: 'Add comprehensive authentication tests',
  files: ['tests/auth.test.ts'],
});

// 7. Generate commit message
const commit = get_commit_suggestion({ conventional: true });
console.log(commit.commit_message);
// Output:
// feat: add user authentication
//
// - Add JWT authentication with refresh tokens
// - Add login and logout endpoints
// - Add comprehensive authentication tests

// 8. Review session
const status = get_session_status({});
console.log('Duration:', status.duration);
console.log('Completed todos:', status.todos.completed);

// 9. End session
end_session({
  message: 'Authentication feature completed with tests',
});
```

### Example 2: Bug Fix Session

```javascript
// 1. Start session
start_session({
  project_folder: 'my-app',
  message: 'Fixing memory leak in session cleanup',
});

// 2. Add investigation todo
add_todo({
  content: 'Investigate memory leak cause',
  priority: 'high',
});

// 3. Track investigation
add_changelog_entry({
  type: 'fix',
  message: 'Investigate memory leak in session cleanup',
  files: ['src/session.ts'],
});

update_todo({
  todo_id: 'todo_investigate_...',
  status: 'completed',
});

// 4. Add fix todo
add_todo({
  content: 'Implement fix for memory leak',
  priority: 'high',
});

// 5. Implement fix
update_todo({
  todo_id: 'todo_fix_...',
  status: 'in_progress',
});

// (Fix the bug)

update_todo({
  todo_id: 'todo_fix_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'fix',
  message: 'Fix memory leak by clearing event listeners on cleanup',
  files: ['src/session.ts'],
});

// 6. Add regression test
add_todo({
  content: 'Add regression test for memory leak',
  priority: 'high',
});

update_todo({
  todo_id: 'todo_test_...',
  status: 'in_progress',
});

// (Write test)

update_todo({
  todo_id: 'todo_test_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'test',
  message: 'Add regression test for memory leak',
  files: ['tests/session.test.ts'],
});

// 7. Generate commit
const commit = get_commit_suggestion({ conventional: true });
console.log(commit.commit_message);
// Output:
// fix: resolve memory leak in session cleanup
//
// - Investigate memory leak in session cleanup
// - Fix memory leak by clearing event listeners on cleanup
// - Add regression test for memory leak

// 8. End session
end_session({
  message: 'Memory leak fixed and tested',
});
```

### Example 3: Documentation Session

```javascript
// 1. Start session
start_session({
  project_folder: 'my-app',
  message: 'Updating project documentation',
});

// 2. Plan documentation updates
add_todo({
  content: 'Update installation instructions',
  priority: 'high',
});
add_todo({
  content: 'Add API documentation',
  priority: 'high',
});
add_todo({
  content: 'Update changelog',
  priority: 'medium',
});

// 3. Update README
update_todo({
  todo_id: 'todo_install_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'docs',
  message: 'Update installation instructions with new prerequisites',
  files: ['README.md'],
});

// 4. Add API docs
update_todo({
  todo_id: 'todo_api_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'docs',
  message: 'Add comprehensive API documentation',
  files: ['docs/api.md'],
});

// 5. Update changelog
update_todo({
  todo_id: 'todo_changelog_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'docs',
  message: 'Update changelog with recent changes',
  files: ['CHANGELOG.md'],
});

// 6. Generate commit
const commit = get_commit_suggestion({ conventional: true });

// 7. End session
end_session({
  message: 'Documentation updated and current',
});
```

### Example 4: Refactoring Session

```javascript
// 1. Start session
start_session({
  project_folder: 'my-app',
  message: 'Refactoring database layer',
});

// 2. Plan refactoring
add_todo({
  content: 'Extract database connection logic',
  priority: 'high',
});
add_todo({
  content: 'Implement connection pooling',
  priority: 'high',
});
add_todo({
  content: 'Update all database calls',
  priority: 'high',
});
add_todo({
  content: 'Add database tests',
  priority: 'medium',
});

// 3. Extract connection logic
update_todo({
  todo_id: 'todo_extract_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'refactor',
  message: 'Extract database connection logic to separate module',
  files: ['src/db/connection.ts'],
});

// 4. Implement pooling
update_todo({
  todo_id: 'todo_pooling_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'refactor',
  message: 'Implement connection pooling for better performance',
  files: ['src/db/pool.ts'],
});

// 5. Update calls
update_todo({
  todo_id: 'todo_update_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'refactor',
  message: 'Update all database calls to use connection pool',
  files: ['src/models/user.ts', 'src/models/session.ts', 'src/models/auth.ts'],
});

// 6. Add tests
update_todo({
  todo_id: 'todo_tests_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'test',
  message: 'Add tests for database connection pooling',
  files: ['tests/db.test.ts'],
});

// 7. Generate commit
const commit = get_commit_suggestion({ conventional: true });

// 8. End session
end_session({
  message: 'Database layer refactored with connection pooling',
});
```

---

## Troubleshooting

### "No active session"

**Problem:** Trying to use session tools without an active session.

**Solution:**

```javascript
// Start a session first
start_session({
  project_folder: 'my-app',
  message: 'Working on feature',
});

// Then use session tools
add_changelog_entry({
  type: 'feature',
  message: 'Add feature',
});
```

### "Session already active"

**Problem:** Trying to start a session when one is already active.

**Solution:**

```javascript
// Option 1: End current session first
end_session({ message: 'Completed work' });
start_session({ message: 'New work' });

// Option 2: Pause and resume
pause_session({});
// Later...
resume_session({});
```

### "Todo not found"

**Problem:** Invalid todo ID or todo from different session.

**Solution:**

```javascript
// List todos to get correct IDs
const todos = list_todos({});
console.log(todos.todos);

// Use correct ID
update_todo({
  todo_id: 'todo_20251113_143055_def123',
  status: 'completed',
});
```

### "Session not persisting"

**Problem:** Session changes not saving to vault.

**Solution:**

```javascript
// Check Obsidian connection
health_check({ project_folder: 'my-app' });

// Verify vault path
const status = get_session_status({});
console.log('Vault path:', status.vault_path);

// Force flush (normally automatic)
// Sessions auto-save with 2s debounce
```

### "Cannot resume session"

**Problem:** Session was ended (completed) and cannot be resumed.

**Solution:**

```javascript
// Completed sessions cannot be resumed
// Start a new session instead
start_session({
  project_folder: 'my-app',
  message: 'Continuing work from previous session',
});
```

---

## Related Documentation

- **[Core Tools](../tools/core-tools.md)** - Basic note operations
- **[Session Tools API](../tools/session-tools.md)** - Detailed API reference
- **[Auto-Tracking Guide](./auto-tracking.md)** - Automatic session tracking
- **[Configuration Guide](../configuration.md)** - Setup and configuration

---

**Next:** [Templates Guide](./templates.md) →

**Previous:** [← Guides Overview](./README.md)
