# Plugin Auto-Session Management

Comprehensive guide to automatic session management in the WithContext OpenCode plugin.

## Overview

Auto-session management provides intelligent, hands-free session tracking for your development workflow. The plugin automatically detects your project, starts sessions when you begin working, and tracks file operations without manual intervention.

**Current Status:** Phase 1 implementation complete. Full auto-tracking awaits OpenCode plugin API enhancements.

### What is Auto-Session Management?

Auto-session management transforms the manual session workflow into an automated experience:

- **Automatic Project Detection** - Detects project folder from git repository or directory name
- **Auto-Start Sessions** - Starts a session automatically on first file operation
- **Smart File Tracking** - Tracks file reads and modifications with debouncing
- **Intelligent Suggestions** - Analyzes file changes to suggest changelog types
- **Session Status Display** - Shows session statistics during idle periods

## Features

### ✅ Phase 1: Foundation (Current - v3.0.5)

**Manual Session Management with Auto-Detection:**

- Project folder auto-detection from git repository
- Environment variable configuration for auto-start behavior
- Smart file change analysis for suggestion generation
- Session persistence with vault storage
- Manual changelog and todo tracking

**Available Now:**

```typescript
// Plugin automatically detects project folder
// Configuration via environment variables:
// - WITH_CONTEXT_AUTO_START (default: true)
// - WITH_CONTEXT_AUTO_TRACK (default: true)
// - WITH_CONTEXT_PROMPT (default: true)

// Manual session workflow
await use_tool('start_session', {
  project_folder: 'my-project',
  message: 'Implementing authentication',
});

// Track changes manually
await use_tool('add_changelog_entry', {
  project_folder: 'my-project',
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts'],
});
```

### ⏳ Phase 2: Auto-Tracking (Awaiting OpenCode API)

**Automatic File Operation Tracking:**

Once OpenCode provides plugin lifecycle hooks, the following features will be enabled:

- **Before Hook** - Intercepts file operations to check for active session
- **After Hook** - Tracks file reads and modifications automatically
- **Smart Suggestions** - Auto-categorizes changes based on file patterns
- **Idle Status Display** - Shows session statistics during idle periods

**Future Workflow:**

```typescript
// OpenCode detects file operation (read/edit/write)
// Plugin automatically:
// 1. Checks for active session
// 2. Prompts to start session (one-time only)
// 3. Tracks file operation
// 4. Suggests changelog entry based on file type
// 5. Shows session stats during idle periods

// No manual tracking needed!
```

## Configuration

### Environment Variables

Configure auto-session behavior via environment variables in your shell or `.env` file:

```bash
# Auto-start session on first file operation (default: true)
export WITH_CONTEXT_AUTO_START=true

# Auto-track file operations (default: true)
export WITH_CONTEXT_AUTO_TRACK=true

# Prompt user on first file operation (default: true)
export WITH_CONTEXT_PROMPT=true
```

### Configuration Options

| Variable                  | Default | Description                                         |
| ------------------------- | ------- | --------------------------------------------------- |
| `WITH_CONTEXT_AUTO_START` | `true`  | Automatically start session on first file operation |
| `WITH_CONTEXT_AUTO_TRACK` | `true`  | Track file reads and modifications automatically    |
| `WITH_CONTEXT_PROMPT`     | `true`  | Show one-time prompt before auto-starting session   |

### Configuration Examples

**Fully Automatic (Recommended):**

```bash
# Start sessions automatically, track all operations
export WITH_CONTEXT_AUTO_START=true
export WITH_CONTEXT_AUTO_TRACK=true
export WITH_CONTEXT_PROMPT=true
```

**Manual Control:**

```bash
# Disable auto-start, prompt only
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=true
```

**Silent Mode:**

```bash
# No prompts, no auto-start
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=false
```

### Defaults

All features are **enabled by default** for the best out-of-box experience. Set any variable to `"false"` (string) to disable.

## How It Works

### 1. Project Detection

The plugin automatically detects your project folder using a two-step process:

```typescript
function detectProjectFolder(dir: string): string | null {
  try {
    // Step 1: Try git repository name
    const repoName = execSync('git rev-parse --show-toplevel', {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (repoName) {
      return path.basename(repoName);
    }
  } catch {
    // Not a git repo or git not available
  }

  // Step 2: Fallback to directory basename
  return path.basename(dir);
}
```

**Detection Priority:**

1. **Git Repository Name** - Uses `git rev-parse --show-toplevel` to get repo root
2. **Directory Basename** - Falls back to current directory name

**Examples:**

```bash
# Git repository
/Users/alice/projects/my-awesome-app
→ Project folder: "my-awesome-app"

# Nested in monorepo
/Users/alice/projects/monorepo/packages/web-app
→ Project folder: "monorepo" (git root)

# Non-git directory
/Users/alice/Documents/my-project
→ Project folder: "my-project"
```

### 2. Session Lifecycle Hooks (Phase 2)

When OpenCode provides plugin API hooks, the plugin will intercept file operations:

```typescript
// Before hook - check for session
execute: {
  before: async ({ name, args }) => {
    // Intercept file operations (read, edit, write)
    if (['read', 'edit', 'write'].includes(name)) {
      // Detect project folder
      const projectFolder = detectProjectFolder(directory);

      // Check for active session
      const session = await checkForActiveSession(projectFolder);

      // Prompt to start session (one-time only)
      if (!session && !hasPromptedForSession) {
        if (autoStartEnabled) {
          await autoStartSession(projectFolder);
        } else {
          console.log('💡 Tip: Start a session to track changes');
        }
      }
    }
  },

  // After hook - track operations
  after: async ({ name, args, result }) => {
    if (['read', 'edit', 'write'].includes(name)) {
      const filePath = args?.filePath || args?.path;

      // Track based on operation
      if (name === 'read') {
        await trackFileOperation(filePath, 'read');
      } else if (name === 'edit' || name === 'write') {
        await trackFileOperation(filePath, 'modify');

        // Smart suggestion
        const suggestion = analyzeFileChange(filePath);
        if (suggestion) {
          console.log(`💡 Suggestion: ${suggestion.type} - ${suggestion.message}`);
        }
      }
    }
  }
}
```

### 3. File Operation Tracking

File operations are tracked with 500ms debouncing to avoid duplicate entries:

```typescript
async function trackFileOperation(filePath: string, operation: 'read' | 'modify') {
  const manager = sessionManager;
  const session = manager.getCurrentSession();

  if (!session || session.status !== 'active') return;

  // Debounce (500ms)
  const debounceKey = `${operation}:${filePath}`;
  const existingTimer = trackingDebounce.get(debounceKey);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(async () => {
    if (operation === 'read') {
      await manager.trackFileRead(filePath);
    } else {
      await manager.trackFileModified(filePath);

      // Smart suggestion
      const suggestion = analyzeFileChange(filePath);
      if (suggestion) {
        console.log(`💡 Suggestion: ${suggestion.type} - ${suggestion.message}`);
      }
    }
  }, 500);

  trackingDebounce.set(debounceKey, timer);
}
```

**Debouncing Benefits:**

- Prevents duplicate tracking when files are read/written multiple times
- Reduces vault write operations
- Improves performance

### 4. Smart File Analysis

The plugin analyzes file paths to suggest changelog types:

```typescript
function analyzeFileChange(filePath: string): {
  type: 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';
  message: string;
} | null {
  // Test files
  if (filePath.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)) {
    const name = path.basename(filePath, path.extname(filePath)).replace(/\.(test|spec)$/, '');
    return { type: 'test', message: `Add tests for ${name}` };
  }

  // Documentation
  if (filePath.match(/^(docs|documentation)\//)) {
    return { type: 'docs', message: 'Update documentation' };
  }

  if (filePath.match(/README\.md|CHANGELOG\.md/i)) {
    return { type: 'docs', message: 'Update documentation' };
  }

  // Config files
  if (
    filePath.match(/\.(config|rc)\.(ts|js|json)$/) ||
    filePath.match(/package\.json|tsconfig\.json/)
  ) {
    return { type: 'chore', message: 'Update configuration' };
  }

  // Source files
  if (filePath.match(/\.(ts|js|tsx|jsx|py|go|rs)$/)) {
    const name = path.basename(filePath, path.extname(filePath));
    return { type: 'feature', message: `Update ${name}` };
  }

  return null;
}
```

### 5. Idle Status Display (Phase 2)

During idle periods, the plugin displays session statistics:

```typescript
event: async ({ event }) => {
  if (event.type === 'session.idle') {
    const session = manager.getCurrentSession();
    if (!session || session.status !== 'active') return;

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
  }
};
```

## User Experience

### Before Auto-Session (Manual Workflow)

```typescript
// 1. Manually start session
await use_tool('start_session', {
  project_folder: 'my-project',
  message: 'Implementing auth',
});

// 2. Work on code...
// (use OpenCode's read/edit/write tools)

// 3. Manually track changes
await use_tool('add_changelog_entry', {
  project_folder: 'my-project',
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts', 'src/middleware.ts'],
});

// 4. Manually add todos
await use_tool('add_todo', {
  project_folder: 'my-project',
  content: 'Write integration tests',
  priority: 'high',
});

// 5. Check status manually
await use_tool('get_session_status', {
  project_folder: 'my-project',
});

// 6. Manually end session
await use_tool('end_session', {
  project_folder: 'my-project',
  message: 'Auth complete',
});
```

**Pain Points:**

- Must remember to start session
- Must manually track every change
- Must remember project folder name
- Repetitive tool calls
- Easy to forget tracking

### After Auto-Session (Phase 2 - Automated Workflow)

```typescript
// 1. Start working (OpenCode detects first file operation)
// Plugin automatically:
// - Detects project folder: "my-project"
// - Prompts: "💡 Start a session for 'my-project'?"
// - Auto-starts session

// 2. Work on code...
// Plugin automatically:
// - Tracks file reads: ['src/auth.ts', 'src/types.ts']
// - Tracks file modifications: ['src/auth.ts', 'src/middleware.ts']
// - Suggests: "💡 feature - Update auth"
// - Suggests: "💡 feature - Update middleware"

// 3. Idle period
// Plugin displays:
// "📊 Session: 45m | 2 modified | 5 read | 0 changelog | 0 active todos"

// 4. Continue working...
// Plugin continues tracking automatically

// 5. End session when done
await use_tool('end_session', {
  project_folder: 'my-project',
  message: 'Auth complete',
});
```

**Benefits:**

- Zero manual tracking
- Automatic project detection
- Smart suggestions based on file patterns
- Continuous session awareness
- Focus on coding, not bookkeeping

## Smart Suggestions

The plugin analyzes file changes to suggest appropriate changelog types:

### File Pattern Matching Table

| File Pattern                     | Type      | Example Suggestion     |
| -------------------------------- | --------- | ---------------------- |
| `*.test.ts`, `*.spec.js`         | `test`    | "Add tests for auth"   |
| `docs/**/*.md`                   | `docs`    | "Update documentation" |
| `README.md`, `CHANGELOG.md`      | `docs`    | "Update documentation" |
| `*.config.ts`, `*.rc.json`       | `chore`   | "Update configuration" |
| `package.json`, `tsconfig.json`  | `chore`   | "Update configuration" |
| `*.ts`, `*.js`, `*.tsx`, `*.jsx` | `feature` | "Update auth"          |
| `*.py`, `*.go`, `*.rs`           | `feature` | "Update server"        |

### Pattern Priority

When a file matches multiple patterns, the plugin uses this priority order:

1. **Test files** - `*.test.ts`, `*.spec.js` (highest priority)
2. **Documentation directories** - `docs/`, `documentation/`
3. **Config files** - `*.config.ts`, `package.json`
4. **Source files** - `*.ts`, `*.js`, `*.py` (lowest priority)

### Examples

```typescript
// Test file
'src/auth.test.ts'
→ { type: 'test', message: 'Add tests for auth' }

// Documentation
'docs/api/users.md'
→ { type: 'docs', message: 'Update documentation' }

// Config file
'vitest.config.ts'
→ { type: 'chore', message: 'Update configuration' }

// Source file
'src/auth.ts'
→ { type: 'feature', message: 'Update auth' }

// Priority: test > source
'src/auth.test.ts'
→ { type: 'test', message: 'Add tests for auth' }
// (not 'feature', even though it's a .ts file)

// Priority: docs > source
'docs/api.ts'
→ { type: 'docs', message: 'Update documentation' }
// (not 'feature', even though it's a .ts file)
```

## Troubleshooting

### "Session not auto-starting"

**Possible Causes:**

1. `WITH_CONTEXT_AUTO_START` is set to `"false"`
2. OpenCode plugin API hooks not yet available (Phase 2)
3. Project folder detection failed

**Solutions:**

```bash
# Check environment variable
echo $WITH_CONTEXT_AUTO_START
# Should be empty or "true"

# Enable auto-start
export WITH_CONTEXT_AUTO_START=true

# Manually start session
await use_tool('start_session', {
  project_folder: 'my-project',
});
```

### "File operations not being tracked"

**Possible Causes:**

1. `WITH_CONTEXT_AUTO_TRACK` is set to `"false"`
2. No active session
3. OpenCode plugin API hooks not yet available (Phase 2)

**Solutions:**

```bash
# Check environment variable
echo $WITH_CONTEXT_AUTO_TRACK
# Should be empty or "true"

# Enable auto-tracking
export WITH_CONTEXT_AUTO_TRACK=true

# Check session status
await use_tool('get_session_status', {
  project_folder: 'my-project',
});
```

### "Project folder detection incorrect"

**Possible Causes:**

1. Not in a git repository
2. Git not available
3. Working in subdirectory of monorepo

**Solutions:**

```bash
# Check git repository
git rev-parse --show-toplevel
# Should show repository root

# Manually set project folder
await use_tool('set_project_context', {
  project_folder: 'my-project',
});
```

### "Suggestions not appearing"

**Possible Causes:**

1. File type not recognized
2. OpenCode plugin API hooks not yet available (Phase 2)
3. Session not active

**Solutions:**

```bash
# Check if file pattern is supported
# See "Smart Suggestions" section for supported patterns

# Manually add changelog entry
await use_tool('add_changelog_entry', {
  project_folder: 'my-project',
  type: 'feature',
  message: 'Update feature',
  files: ['src/file.ts'],
});
```

## API Reference

### Helper Functions

#### `detectProjectFolder(dir: string): string | null`

Detects project folder from directory path.

**Parameters:**

- `dir` - Directory path to analyze

**Returns:**

- Project folder name (git repo name or directory basename)
- `null` if detection fails

**Example:**

```typescript
const projectFolder = detectProjectFolder('/Users/alice/projects/my-app');
// Returns: "my-app"
```

#### `analyzeFileChange(filePath: string): Suggestion | null`

Analyzes file path to suggest changelog type.

**Parameters:**

- `filePath` - File path to analyze (relative or absolute)

**Returns:**

- `{ type, message }` - Suggestion object
- `null` if file type not recognized

**Example:**

```typescript
const suggestion = analyzeFileChange('src/auth.test.ts');
// Returns: { type: 'test', message: 'Add tests for auth' }
```

#### `trackFileOperation(filePath: string, operation: 'read' | 'modify'): Promise<void>`

Tracks file operation with debouncing.

**Parameters:**

- `filePath` - File path that was operated on
- `operation` - Operation type (`'read'` or `'modify'`)

**Returns:**

- `Promise<void>` - Resolves when tracking complete

**Example:**

```typescript
await trackFileOperation('src/auth.ts', 'modify');
// Tracks modification with 500ms debounce
```

### Configuration State

```typescript
interface AutoSessionConfig {
  autoStartEnabled: boolean; // WITH_CONTEXT_AUTO_START
  autoTrackingEnabled: boolean; // WITH_CONTEXT_AUTO_TRACK
  promptOnFirstUse: boolean; // WITH_CONTEXT_PROMPT
}
```

### Plugin State

```typescript
interface PluginState {
  sessionManager: SessionManager | null;
  projectFolder: string | null;
  hasPromptedForSession: boolean;
  trackingDebounce: Map<string, NodeJS.Timeout>;
  config: AutoSessionConfig;
}
```

## Examples

### Example 1: Fully Automated Workflow (Phase 2)

```typescript
// Configuration
export WITH_CONTEXT_AUTO_START=true
export WITH_CONTEXT_AUTO_TRACK=true
export WITH_CONTEXT_PROMPT=true

// User starts working in OpenCode
// First file operation: read('src/auth.ts')

// Plugin automatically:
// 1. Detects project: "my-app"
// 2. Prompts: "💡 Start a session for 'my-app'?"
// 3. Starts session
// 4. Tracks read: ['src/auth.ts']

// User edits file: edit('src/auth.ts')
// Plugin automatically:
// 1. Tracks modification: ['src/auth.ts']
// 2. Suggests: "💡 feature - Update auth"

// User adds tests: write('src/auth.test.ts')
// Plugin automatically:
// 1. Tracks modification: ['src/auth.test.ts']
// 2. Suggests: "💡 test - Add tests for auth"

// Idle period (30 seconds)
// Plugin displays:
// "📊 Session: 15m | 2 modified | 1 read | 0 changelog | 0 active todos"
```

### Example 2: Manual Control

```typescript
// Configuration
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=true

// User starts working
// First file operation: read('src/auth.ts')

// Plugin prompts:
// "💡 Tip: Start a session for 'my-app' to track changes"

// User manually starts session
await use_tool('start_session', {
  project_folder: 'my-app',
  message: 'Implementing auth',
});

// User manually tracks changes
await use_tool('add_changelog_entry', {
  project_folder: 'my-app',
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts'],
});
```

### Example 3: Silent Mode

```typescript
// Configuration
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=false

// User starts working
// No prompts, no auto-start, no auto-tracking

// User has full manual control
await use_tool('start_session', {
  project_folder: 'my-app',
});

await use_tool('add_changelog_entry', {
  project_folder: 'my-app',
  type: 'feature',
  message: 'Add feature',
});

await use_tool('end_session', {
  project_folder: 'my-app',
});
```

## Best Practices

### When to Use Auto-Session

✅ **Recommended for:**

- Active development sessions
- Feature implementation
- Bug fixing
- Refactoring work
- Projects with frequent commits

❌ **Not recommended for:**

- Quick file edits
- Read-only exploration
- Automated scripts
- CI/CD environments

### Configuration Recommendations

**For Active Development:**

```bash
export WITH_CONTEXT_AUTO_START=true
export WITH_CONTEXT_AUTO_TRACK=true
export WITH_CONTEXT_PROMPT=true
```

**For Exploratory Work:**

```bash
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=true
```

**For Automated Environments:**

```bash
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=false
```

### Session Hygiene

1. **End sessions when done** - Don't leave sessions running indefinitely
2. **Review tracked files** - Check `get_session_status` periodically
3. **Add meaningful messages** - Provide context when starting/ending sessions
4. **Use todos for follow-up** - Track incomplete work with todos
5. **Generate commit messages** - Use `get_commit_suggestion` before committing

### Performance Tips

1. **Debouncing works automatically** - No need to worry about duplicate tracking
2. **Sessions persist to vault** - Safe to pause/resume anytime
3. **Idle timeout is 30 minutes** - Sessions auto-pause after inactivity
4. **Vault writes are batched** - Lifecycle events persist immediately, updates are debounced

## Implementation Status

### Phase 1: Foundation ✅ (Current)

- [x] Project folder detection
- [x] Environment variable configuration
- [x] Smart file change analysis
- [x] Manual session management
- [x] Session persistence
- [x] Comprehensive test coverage (58 tests)

### Phase 2: Auto-Tracking ⏳ (Awaiting OpenCode API)

- [ ] Before hook for file operations
- [ ] After hook for file operations
- [ ] Automatic file tracking
- [ ] Smart suggestion display
- [ ] Idle status display
- [ ] Session lifecycle events

### Phase 3: Intelligence 🔮 (Future)

- [ ] AI-powered change categorization
- [ ] Context-aware suggestions
- [ ] Automatic todo generation
- [ ] Smart commit message generation
- [ ] Session analytics and insights

## Related Documentation

- [Session Management](../src/session/README.md) - Core session management API
- [Plugin README](../plugin/README.md) - Plugin installation and usage
- [Test Results](../TEST_RESULTS_PLUGIN_AUTO_SESSION.md) - Comprehensive test coverage

## Support

For issues, questions, or feature requests:

- **GitHub Issues:** [with-context-mcp/issues](https://github.com/boxpositron/with-context-mcp/issues)
- **Documentation:** [README.md](../README.md)
- **Plugin Docs:** [plugin/README.md](../plugin/README.md)

## License

MIT
