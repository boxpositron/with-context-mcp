# Session Management

This module provides comprehensive session lifecycle management with persistent state tracking for project-based work sessions.

## Overview

The session management system tracks work sessions, including:

- Session lifecycle (start, pause, resume, complete)
- File read/modification tracking
- Changelog entries
- Todo items
- Git context (branch, last commit)
- Metadata (environment, tools used, interaction count)

## Architecture

### Components

1. **SessionManager** (`session-manager.ts`)
   - Main class for session lifecycle management
   - Implements hybrid persistence strategy
   - Auto-pause after inactivity
   - Debounced updates for performance

2. **VaultPersistence** (`vault-persistence.ts`)
   - Handles atomic writes/reads to Obsidian vault
   - Backup and recovery mechanisms
   - Session archiving

3. **Types** (`types.ts`)
   - Type definitions and branded types
   - Factory functions for creating IDs
   - Type guards and utility functions

4. **Config** (`config.ts`)
   - Zod schemas for validation
   - Default configurations
   - Configuration helpers

## Usage

### Basic Example

```typescript
import { SessionManager } from './session/session-manager.js';
import { ObsidianClient } from './obsidian/client.js';

// Create client
const client = new ObsidianClient({
  apiUrl: 'https://localhost:27124',
  apiKey: 'your-api-key',
  vault: 'your-vault',
});

// Create manager
const manager = new SessionManager(client);

// Start a session
const session = await manager.startSession('my-project', 'My Project');

// Track file reads
await manager.trackFileRead('notes/readme.md' as VaultPath);

// Track modifications
await manager.trackFileModified('src/index.ts');

// Update session
await manager.updateSession((session) => ({
  ...session,
  changelog: [
    ...session.changelog,
    {
      id: createChangelogId(),
      timestamp: now(),
      type: 'feature',
      message: 'Added new feature',
      files: ['src/feature.ts'],
      userConfirmed: true,
    },
  ],
}));

// Complete session
await manager.completeSession();
```

### Lifecycle Management

```typescript
// Start new session
const session = await manager.startSession('project-folder', 'Project Name');

// Pause current session
await manager.pauseSession();

// Resume paused session
await manager.resumeSession();

// Resume specific session by ID
await manager.resumeSession('sess_123' as SessionId);

// Complete and archive session
await manager.completeSession();
```

### Query Methods

```typescript
// Get current session
const session = manager.getCurrentSession();

// Get session status
const status = manager.getSessionStatus(); // 'active' | 'paused' | 'completed' | null

// Force immediate persistence
await manager.flush();
```

## Persistence Strategy

The SessionManager uses a hybrid persistence approach:

### Immediate Persistence

Triggered for lifecycle events:

- `startSession()`
- `pauseSession()`
- `resumeSession()`
- `completeSession()`

### Debounced Persistence

Triggered for regular updates (2s delay by default):

- `updateSession()` calls
- `trackFileRead()` calls
- `trackFileModified()` calls

### High-Value Changes

Some updates persist immediately even in `updateSession()`:

- Changelog additions/modifications
- Todo additions/modifications

## Configuration

```typescript
const manager = new SessionManager(client, {
  debounceMs: 2000, // Debounce delay in ms
  inactivityTimeoutMs: 1800000, // 30 minutes
});
```

## Session Storage

Sessions are stored in the Obsidian vault:

### Active Sessions

```
Projects/{project-folder}/.sessions/active/{session-id}.json
```

### Archived Sessions

```
Projects/{project-folder}/.sessions/archived/{year-month}/{session-id}.json
```

Example:

```
Projects/my-project/.sessions/archived/2025-11/sess_abc123.json
```

## Error Handling

```typescript
import { SessionManagerError, SessionPersistenceError } from './session/index.js';

try {
  await manager.startSession('project', 'Project');
} catch (error) {
  if (error instanceof SessionManagerError) {
    console.error('Session management error:', error.message);
  } else if (error instanceof SessionPersistenceError) {
    console.error('Persistence error:', error.message);
  }
}
```

## Testing

Comprehensive test suite available in `tests/unit/session-manager.test.ts`:

```bash
npm run test tests/unit/session-manager.test.ts
```

## MCP Tools

The session management functionality is exposed through MCP tools in `src/tools/session-tools.ts`:

### Available Tools

1. **start_session**

   ```typescript
   {
     project_folder: string,
     message?: string
   }
   ```

   Start a new development session. Creates session and persists to vault.

2. **pause_session**

   ```typescript
   {
     project_folder: string;
   }
   ```

   Pause the current active session. Saves state and clears timers.

3. **resume_session**

   ```typescript
   {
     project_folder: string,
     session_id?: string
   }
   ```

   Resume a paused session. Uses most recent if session_id not provided.

4. **end_session**

   ```typescript
   {
     project_folder: string,
     message?: string
   }
   ```

   Complete and archive the current session. Generates comprehensive summary.

5. **get_session_status**
   ```typescript
   {
     project_folder: string;
   }
   ```
   Get current session status and detailed information.

### Example Usage

```typescript
import {
  startSession,
  pauseSession,
  resumeSession,
  endSession,
  getSessionStatus,
} from './tools/session-tools.js';

// Start a session
const startResult = await startSession({
  project_folder: 'my-project',
  message: 'Working on authentication feature',
});

// Get status
const status = await getSessionStatus({
  project_folder: 'my-project',
});

// Pause when taking a break
await pauseSession({
  project_folder: 'my-project',
});

// Resume work
await resumeSession({
  project_folder: 'my-project',
});

// Complete when done
const summary = await endSession({
  project_folder: 'my-project',
  message: 'Authentication feature completed',
});
```

### Response Format

All tools return JSON-formatted strings with:

- `success`: boolean indicating operation success
- `session_id`: session identifier
- `project_folder`: project folder name
- Additional fields specific to each operation

Example response from `get_session_status`:

```json
{
  "success": true,
  "project_folder": "my-project",
  "has_active_session": true,
  "session": {
    "session_id": "sess_abc123",
    "project_name": "My Project",
    "status": "active",
    "started_at": "2025-11-09T10:00:00.000Z",
    "duration": "2h 15m",
    "context": {
      "files_read": 12,
      "files_modified": 5,
      "working_directory": "/path/to/project",
      "git_branch": "main",
      "last_commit": "abc1234"
    },
    "todos": {
      "total": 8,
      "by_status": {
        "pending": 3,
        "in_progress": 2,
        "completed": 3,
        "cancelled": 0
      }
    },
    "changelog": {
      "total": 5,
      "by_type": {
        "feature": 2,
        "fix": 1,
        "refactor": 1,
        "docs": 1,
        "test": 0,
        "chore": 0
      }
    }
  }
}
```

## Best Practices

1. **Always call `flush()` before process exit**

   ```typescript
   process.on('beforeExit', async () => {
     await manager.flush();
   });
   ```

2. **Handle errors appropriately**
   - SessionManagerError: User-facing errors (already active, not found, etc.)
   - SessionPersistenceError: I/O errors (vault unavailable, write failures)

3. **Use branded types for type safety**

   ```typescript
   import { createSessionId, createVaultPath } from './session/types.js';

   const sessionId = createSessionId();
   const path = createVaultPath('notes/readme');
   ```

4. **Track important events**

   ```typescript
   // Track file reads
   await manager.trackFileRead(path);

   // Track modifications
   await manager.trackFileModified('src/file.ts');
   ```

5. **Use updateSession for batch updates**
   ```typescript
   await manager.updateSession((session) => ({
     ...session,
     todos: [...session.todos, newTodo],
     changelog: [...session.changelog, newEntry],
   }));
   ```

## Future Enhancements

Potential improvements:

- [ ] Session resumption from archived sessions
- [ ] Session search and filtering
- [ ] Session statistics and analytics
- [ ] Retention policy enforcement
- [ ] Session export/import
- [ ] Multi-session support

## License

Part of the with-context-mcp project.
