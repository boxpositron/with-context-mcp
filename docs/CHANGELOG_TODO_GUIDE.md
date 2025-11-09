# Changelog and Todo Management Guide

## Quick Start

### Prerequisites

1. Start a session: `start_session({ project_folder: "my-project" })`
2. Session must be active or paused

## Changelog Tools

### Add Changelog Entry

Track changes during development with conventional commit types.

```typescript
add_changelog_entry({
  project_folder: 'my-project',
  type: 'feature', // feature|fix|refactor|docs|test|chore
  message: 'Add OAuth2 authentication',
  files: ['src/auth.ts'], // Optional
  breaking: false, // Optional
});
```

**Response:**

```json
{
  "success": true,
  "entry_id": "chlog_abc123",
  "type": "feature",
  "message": "Add OAuth2 authentication",
  "files_count": 1,
  "breaking": false,
  "total_entries": 3
}
```

### View Session Changelog

See all changes grouped by type.

```typescript
get_session_changelog({
  project_folder: 'my-project',
});
```

**Response:**

```json
{
  "success": true,
  "total_entries": 5,
  "by_type": {
    "feature": 2,
    "fix": 1,
    "docs": 2
  },
  "files_changed": 8,
  "has_breaking_changes": false,
  "changelog": "\nFeatures:\n  - Add OAuth2 authentication (1 files)\n  - Implement caching layer (3 files)\n\nBug Fixes:\n  - Fix memory leak in worker pool (2 files)\n..."
}
```

### Generate Commit Message

Create conventional commit message from changelog.

```typescript
get_commit_suggestion({
  project_folder: 'my-project',
  conventional: true, // Optional, default: true
});
```

**Response:**

```json
{
  "success": true,
  "commit_message": {
    "title": "feat(session): Add authentication and caching",
    "body": "- Add OAuth2 authentication\n- Implement caching layer\n- Fix memory leak in worker pool",
    "full": "feat(session): Add authentication and caching\n\n- Add OAuth2 authentication\n- Implement caching layer\n- Fix memory leak in worker pool"
  },
  "metadata": {
    "primary_type": "feature",
    "total_entries": 5,
    "files_changed": 8,
    "breaking_changes": false
  }
}
```

## Todo Tools

### Add Todo

Create a new todo item.

```typescript
add_todo({
  project_folder: 'my-project',
  content: 'Write unit tests for auth module',
  priority: 'high', // high|medium|low, optional, default: medium
});
```

**Response:**

```json
{
  "success": true,
  "todo_id": "todo_xyz789",
  "content": "Write unit tests for auth module",
  "priority": "high",
  "status": "pending",
  "total_todos": 4,
  "message": "✓ Todo added successfully 🔴"
}
```

### Update Todo

Change status or priority of existing todo.

```typescript
update_todo({
  project_folder: 'my-project',
  todo_id: 'todo_xyz789',
  status: 'in_progress', // Optional
  priority: 'medium', // Optional
});
```

**Response:**

```json
{
  "success": true,
  "todo_id": "todo_xyz789",
  "content": "Write unit tests for auth module",
  "status": "in_progress",
  "priority": "medium",
  "completed_at": null,
  "message": "✓ Todo updated successfully"
}
```

Mark as completed (auto-sets timestamp):

```typescript
update_todo({
  project_folder: 'my-project',
  todo_id: 'todo_xyz789',
  status: 'completed',
});
```

**Response:**

```json
{
  "success": true,
  "todo_id": "todo_xyz789",
  "content": "Write unit tests for auth module",
  "status": "completed",
  "priority": "medium",
  "completed_at": "2025-01-15T10:30:00.000Z",
  "message": "✓ Todo updated successfully"
}
```

### List Todos

View all todos with optional filters.

```typescript
// List all todos
list_todos({
  project_folder: 'my-project',
});

// Filter by status
list_todos({
  project_folder: 'my-project',
  status: 'pending',
});

// Filter by priority
list_todos({
  project_folder: 'my-project',
  priority: 'high',
});

// Combine filters
list_todos({
  project_folder: 'my-project',
  status: 'in_progress',
  priority: 'high',
});
```

**Response:**

```json
{
  "success": true,
  "total_todos": 6,
  "by_status": {
    "pending": 3,
    "in_progress": 2,
    "completed": 1,
    "cancelled": 0
  },
  "by_priority": {
    "high": 2,
    "medium": 3,
    "low": 1
  },
  "filters": {
    "status": "none",
    "priority": "none"
  },
  "todos": "\nPending (3):\n  🔴 [todo_1] Fix critical bug in payment flow\n  🟡 [todo_2] Update documentation\n  🔵 [todo_3] Refactor legacy code\n\nIn Progress (2):\n  🔴 [todo_4] Implement new feature X\n  🟡 [todo_5] Review pull requests\n..."
}
```

## Workflow Examples

### Feature Development Workflow

```typescript
// 1. Start session
start_session({ project_folder: 'my-app' });

// 2. Add initial todos
add_todo({
  project_folder: 'my-app',
  content: 'Design API endpoints',
  priority: 'high',
});

add_todo({
  project_folder: 'my-app',
  content: 'Write integration tests',
  priority: 'medium',
});

// 3. As you work, track changes
add_changelog_entry({
  project_folder: 'my-app',
  type: 'feature',
  message: 'Add user profile API endpoints',
  files: ['src/routes/profile.ts', 'src/controllers/user.ts'],
});

// 4. Update todo status
update_todo({
  project_folder: 'my-app',
  todo_id: 'todo_...',
  status: 'completed',
});

// 5. Continue tracking changes
add_changelog_entry({
  project_folder: 'my-app',
  type: 'test',
  message: 'Add integration tests for profile API',
});

// 6. Generate commit message
get_commit_suggestion({
  project_folder: 'my-app',
});

// 7. Check remaining todos
list_todos({
  project_folder: 'my-app',
  status: 'pending',
});
```

### Bug Fix Workflow

```typescript
// 1. Add todo for bug
add_todo({
  project_folder: 'my-app',
  content: 'Fix crash on invalid input',
  priority: 'high',
});

// 2. Start working
update_todo({
  project_folder: 'my-app',
  todo_id: 'todo_...',
  status: 'in_progress',
});

// 3. Track the fix
add_changelog_entry({
  project_folder: 'my-app',
  type: 'fix',
  message: 'Handle null values in input validator',
  files: ['src/validators/input.ts'],
  breaking: false,
});

// 4. Complete todo
update_todo({
  project_folder: 'my-app',
  todo_id: 'todo_...',
  status: 'completed',
});

// 5. Generate commit
get_commit_suggestion({
  project_folder: 'my-app',
});
// Returns: "fix(session): Handle null values in input validator"
```

## Priority Indicators

- 🔴 **High** - Critical, urgent work
- 🟡 **Medium** - Normal priority (default)
- 🔵 **Low** - Nice to have, non-urgent

## Change Types

Based on Conventional Commits:

- **feature** - New features or capabilities
- **fix** - Bug fixes
- **refactor** - Code restructuring without behavior change
- **docs** - Documentation updates
- **test** - Test additions or modifications
- **chore** - Build, tooling, dependency updates

## Error Handling

### No Active Session

```json
{
  "error": "No active session for project 'my-app'. Please start a session first using start_session."
}
```

**Solution:** Start a session first.

### Todo Not Found

```json
{
  "error": "Todo not found: todo_invalid123"
}
```

**Solution:** Use `list_todos` to find valid todo IDs.

### Empty Changelog

```json
{
  "error": "Cannot generate commit message: no changelog entries. Add entries using add_changelog_entry first."
}
```

**Solution:** Add at least one changelog entry before generating commit message.

## Tips

1. **Track as you go** - Add changelog entries while developing, not at the end
2. **Use descriptive messages** - Write clear, concise descriptions
3. **Link files** - Include affected files for better context
4. **Mark breaking changes** - Set `breaking: true` for API changes
5. **Review before commit** - Use `get_session_changelog` to review all changes
6. **Filter todos** - Use status/priority filters to focus on relevant items
7. **Keep todos updated** - Regularly update status to reflect progress

## Integration with Git

The commit suggestion tool generates proper conventional commit messages:

```bash
# Get suggestion
const msg = await get_commit_suggestion({ project_folder: "my-app" })

# Use in git commit
git commit -m "feat(auth): Add OAuth2 authentication

- Add OAuth2 provider integration
- Implement token refresh mechanism
- Add auth middleware

Files changed: 5"
```

## Persistence

- All changelog entries and todos are stored in the session state
- Automatically persisted to Obsidian vault
- Survives session pause/resume
- Archived with session when completed
- Path: `Projects/{project}/.sessions/active/{sessionId}.json`
