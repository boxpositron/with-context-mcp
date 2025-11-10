# OpenCode Plugin Auto-Tracking Implementation

## Overview

This document describes the intelligent auto-tracking capabilities planned for the WithContext OpenCode plugin. The current implementation provides all MCP tools as native OpenCode tools, but full auto-tracking requires additional OpenCode plugin API hooks.

## Current Implementation (v2.1.0)

### What Works Now

✅ All MCP tools available as native OpenCode tools:

- Note management (read, write, list, search, delete, batch operations)
- Template system (list, create from template)
- Sync operations (ingest, teleport, sync)
- Session management tools (via manual invocation)
- Changelog and todo tools (via manual invocation)

✅ Plugin status tool showing configuration and version

✅ Basic event hook for `session.idle` events

### Manual Workflow

Users can currently track their work session manually:

```typescript
// 1. Start session
await use_tool('start_session', {
  project_folder: 'my-project',
  message: 'Implementing new feature',
});

// 2. Work on files (using OpenCode's built-in read/write/edit tools)
// ... make changes ...

// 3. Track changes manually
await use_tool('add_changelog_entry', {
  project_folder: 'my-project',
  type: 'feature',
  message: 'Add user authentication',
  files: ['src/auth.ts', 'src/middleware.ts'],
});

// 4. Add todos
await use_tool('add_todo', {
  project_folder: 'my-project',
  content: 'Write tests for auth module',
  priority: 'high',
});

// 5. View session status
await use_tool('get_session_status', {
  project_folder: 'my-project',
});

// 6. End session
await use_tool('end_session', {
  project_folder: 'my-project',
  message: 'Completed auth implementation',
});
```

## Planned Auto-Tracking Features

### Required OpenCode Plugin API Enhancements

To enable full auto-tracking, the OpenCode plugin API needs these hooks:

#### 1. `tool.execute.before` Hook

```typescript
tool: {
  execute: {
    before: async ({ name, args }) => {
      // Intercept OpenCode's built-in tools BEFORE execution
      // Check if session exists, prompt to start if needed
    };
  }
}
```

**Use cases:**

- Detect first file operation in a project
- Check if session exists for current project
- Prompt user to start session (one-time per plugin lifecycle)
- Pre-validate file paths for tracking

#### 2. `tool.execute.after` Hook

```typescript
tool: {
  execute: {
    after: async ({ name, args, result }) => {
      // Intercept OpenCode's built-in tools AFTER execution
      // Track file operations automatically
    };
  }
}
```

**Use cases:**

- Track file reads automatically (call `sessionManager.trackFileRead()`)
- Track file modifications (call `sessionManager.trackFileModified()`)
- Suggest changelog entries based on file patterns
- Debounce to prevent spam tracking

#### 3. Enhanced Event Context

```typescript
event: async ({ event, context }) => {
  // context should include:
  // - directory: current working directory
  // - project: project name/folder
  // - session: OpenCode session info
};
```

**Use cases:**

- Display session status on idle with project context
- Auto-detect project folder from directory
- Cleanup on session end

### Implementation Plan

When OpenCode plugin API supports these hooks, the implementation would look like:

```typescript
// plugin/with-context.ts (future implementation)

import { SessionManager } from '../src/session/session-manager.js';
import { ObsidianClient } from '../src/obsidian/client.js';
import { formatDuration, getSessionDuration } from '../src/session/types.js';

export const WithContextPlugin: Plugin = async ({ directory }) => {
  // Plugin state
  const state = {
    sessionManager: null as SessionManager | null,
    currentProjectFolder: null as string | null,
    hasPromptedForSession: false,
    trackingDebounceMap: new Map<string, NodeJS.Timeout>(),
  };

  // Helper: Initialize SessionManager (singleton)
  function getOrCreateSessionManager(): SessionManager {
    if (!state.sessionManager) {
      const client = new ObsidianClient({
        apiUrl: process.env.OBSIDIAN_API_URL || 'http://localhost:27123',
        apiKey: process.env.OBSIDIAN_API_KEY || '',
        vault: process.env.OBSIDIAN_VAULT || 'Vault',
        allowInsecure: process.env.NODE_ENV === 'development',
      });
      state.sessionManager = new SessionManager(client);
    }
    return state.sessionManager;
  }

  // Helper: Extract project folder from directory
  function getProjectFolder(dir: string): string {
    return path.basename(dir);
  }

  // Helper: Check for existing session
  async function checkForSession(projectFolder: string): Promise<Session | null> {
    try {
      const manager = getOrCreateSessionManager();
      // ... load session from vault ...
      return session;
    } catch {
      return null;
    }
  }

  // Helper: Analyze file change for suggestions
  function analyzeFileChange(filePath: string): { type: ChangelogType; message: string } | null {
    // Test files
    if (filePath.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)) {
      return { type: 'test', message: `Add tests for ${extractName(filePath)}` };
    }

    // Documentation
    if (filePath.match(/^(docs|documentation)\//)) {
      return { type: 'docs', message: `Update documentation` };
    }

    // Config files
    if (filePath.match(/\.(config|rc)\.(ts|js|json)$/)) {
      return { type: 'chore', message: `Update configuration` };
    }

    // Source files
    if (filePath.match(/\.(ts|js|tsx|jsx|py|go|rs)$/)) {
      return { type: 'feature', message: `Update ${extractName(filePath)}` };
    }

    return null;
  }

  // Helper: Track file operation with debouncing
  async function trackFileOperation(filePath: string, operation: 'read' | 'modify'): Promise<void> {
    const manager = state.sessionManager;
    if (!manager) return;

    const session = manager.getCurrentSession();
    if (!session || session.status !== 'active') return;

    // Debounce (500ms)
    const debounceKey = `${operation}:${filePath}`;
    const existingTimer = state.trackingDebounceMap.get(debounceKey);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
      try {
        if (operation === 'read') {
          await manager.trackFileRead(filePath as any);
        } else {
          await manager.trackFileModified(filePath);

          // Smart suggestion
          const suggestion = analyzeFileChange(filePath);
          if (suggestion) {
            console.log(`💡 Suggestion: ${suggestion.type} - ${suggestion.message}`);
          }
        }
      } catch (error) {
        // Silent failure
        console.debug('Tracking error:', error);
      } finally {
        state.trackingDebounceMap.delete(debounceKey);
      }
    }, 500);

    state.trackingDebounceMap.set(debounceKey, timer);
  }

  return {
    // Event hook
    event: async ({ event, context }) => {
      if (event.type === 'session.idle') {
        const manager = state.sessionManager;
        if (!manager) return;

        const session = manager.getCurrentSession();
        if (!session || session.status !== 'active') return;

        try {
          const duration = formatDuration(getSessionDuration(session));
          const filesModified = session.context.filesModified.length;
          const filesRead = session.context.filesRead.length;
          const changelogCount = session.changelog.length;
          const todosActive = session.todos.filter(
            (t) => t.status === 'pending' || t.status === 'in_progress'
          ).length;

          console.log(
            `📊 Session: ${duration} | ` +
              `${filesModified} modified | ${filesRead} read | ` +
              `${changelogCount} changelog | ${todosActive} active todos`
          );
        } catch (error) {
          console.debug('Session status error:', error);
        }
      }
    },

    tool: {
      // Tool execution hooks
      execute: {
        // Before hook - check for session
        before: async ({ name, args }) => {
          // Only intercept OpenCode's built-in tools
          const isFileOperation = ['read', 'edit', 'write'].includes(name);
          if (!isFileOperation) return;

          // Get project folder
          const projectFolder = state.currentProjectFolder || getProjectFolder(directory);
          if (!projectFolder) return;

          // Check if session exists
          const session = await checkForSession(projectFolder);

          // Prompt to start session (only once)
          if (!session && !state.hasPromptedForSession) {
            state.hasPromptedForSession = true;
            console.log(
              `\n💡 Tip: Start a session for "${projectFolder}" to track changes automatically.\n` +
                `   Use the start_session tool to begin.\n`
            );
          }
        },

        // After hook - track operations
        after: async ({ name, args, result }) => {
          // Only intercept OpenCode's built-in tools
          if (!['read', 'edit', 'write'].includes(name)) return;

          // Skip if tool failed
          if (!result || (typeof result === 'object' && 'error' in result)) return;

          try {
            // Extract file path
            const filePath = args?.filePath || args?.path;
            if (!filePath || typeof filePath !== 'string') return;

            // Track based on operation
            if (name === 'read') {
              await trackFileOperation(filePath, 'read');
            } else if (name === 'edit' || name === 'write') {
              await trackFileOperation(filePath, 'modify');
            }
          } catch (error) {
            console.debug('Auto-tracking error:', error);
          }
        },
      },

      // ... all existing tool definitions ...
    },
  };
};
```

### Smart Changelog Suggestions

The auto-tracking system includes intelligent changelog suggestions based on file patterns:

| File Pattern                 | Suggested Type | Example Message              |
| ---------------------------- | -------------- | ---------------------------- |
| `*.test.(ts\|js\|tsx\|jsx)`  | `test`         | "Add tests for auth"         |
| `*.spec.(ts\|js\|tsx\|jsx)`  | `test`         | "Add tests for user-service" |
| `docs/**/*`                  | `docs`         | "Update documentation"       |
| `README.md`, `CHANGELOG.md`  | `docs`         | "Update documentation"       |
| `*.config.(ts\|js\|json)`    | `chore`        | "Update configuration"       |
| `package.json`               | `chore`        | "Update configuration"       |
| `*.ts`, `*.js`, `*.py`, etc. | `feature`      | "Update auth"                |

### Performance Considerations

1. **Debouncing**: 500ms debounce prevents spam tracking when files are read/written multiple times
2. **Async Operations**: All tracking is async and non-blocking
3. **Silent Failures**: Tracking errors never break file operations
4. **Lazy Initialization**: SessionManager only created when needed
5. **Map Cleanup**: Debounce timers auto-cleaned after execution

### Error Handling

All tracking operations use try-catch with silent failures:

```typescript
try {
  await manager.trackFileModified(filePath);
} catch (error) {
  // Log to debug but don't throw
  console.debug('Tracking error:', error);
}
```

This ensures that auto-tracking never disrupts the user's workflow.

## Migration Path

### Phase 1: Manual (Current - v2.1.0)

Users manually invoke session tools and changelog/todo tools.

**Pros:**

- Works today with no API changes
- Full control over tracking
- No surprise behaviors

**Cons:**

- Requires remembering to track
- More verbose workflow
- Easy to forget to add todos/changelog

### Phase 2: Semi-Automatic (Requires Plugin API Updates)

OpenCode adds `tool.execute.before` and `tool.execute.after` hooks.

**Features:**

- Auto-track file reads/writes
- Smart changelog suggestions
- One-time session start prompts
- Idle status display

**Pros:**

- Automatic tracking of file operations
- Intelligent suggestions
- Seamless experience

**Cons:**

- Requires OpenCode plugin API enhancement

### Phase 3: Fully Automatic (Future)

Additional AI integration for even smarter suggestions.

**Ideas:**

- Analyze diff content for better changelog messages
- Auto-categorize changes (feature vs fix vs refactor)
- Suggest related todos based on code patterns
- Generate commit messages from session

## Testing the Plugin

### Current Version

```bash
# 1. Ensure with-context-mcp is installed
npm install

# 2. Build the project
npm run build

# 3. Start Obsidian with Local REST API plugin

# 4. Configure environment
export OBSIDIAN_VAULT_PATH=~/Documents/Vault
export PROJECT_BASE_PATH=Projects
export OBSIDIAN_API_URL=http://localhost:27123
export OBSIDIAN_API_KEY=your-api-key

# 5. Load plugin in OpenCode
# Add to opencode.jsonc:
{
  "plugins": [
    "./plugin/with-context.ts"
  ]
}

# 6. Test manual workflow
```

### Manual Test Workflow

```typescript
// In OpenCode session:

// 1. Start a session
await use_tool('start_session', {
  project_folder: 'test-project',
  message: 'Testing plugin functionality',
});

// 2. Make some changes (use OpenCode's read/write/edit)
// ...

// 3. Add changelog entry
await use_tool('add_changelog_entry', {
  project_folder: 'test-project',
  type: 'feature',
  message: 'Add new feature',
  files: ['src/feature.ts'],
});

// 4. Add a todo
await use_tool('add_todo', {
  project_folder: 'test-project',
  content: 'Write tests for feature',
  priority: 'high',
});

// 5. Check status
await use_tool('get_session_status', {
  project_folder: 'test-project',
});

// 6. View changelog
await use_tool('get_session_changelog', {
  project_folder: 'test-project',
});

// 7. Get commit suggestion
await use_tool('get_commit_suggestion', {
  project_folder: 'test-project',
  conventional: true,
});

// 8. End session
await use_tool('end_session', {
  project_folder: 'test-project',
  message: 'Testing complete',
});
```

## Contributing

To implement auto-tracking:

1. **OpenCode Plugin API**: Add `tool.execute.before` and `tool.execute.after` hooks
2. **Enhanced Context**: Provide `directory` and `project` in event context
3. **Tool Metadata**: Allow plugins to inspect which tools are being called
4. **TypeScript Support**: Export proper types for hook parameters

## References

- [Session Management Documentation](../src/session/README.md)
- [Changelog/Todo Tools](../docs/CHANGELOG_TODO_GUIDE.md)
- [OpenCode Plugin API](https://opencode.ai/docs) (when available)

## Status

- ✅ Core infrastructure (SessionManager, persistence, tools)
- ✅ Manual workflow fully functional
- ⏳ Waiting for OpenCode plugin API enhancements
- 📋 Implementation ready once hooks available

---

**Current Version**: 2.1.0  
**Last Updated**: 2025-01-09  
**Status**: Production-ready for manual workflow, awaiting API enhancements for auto-tracking
