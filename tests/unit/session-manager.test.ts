/**
 * Session Manager Tests
 *
 * Tests for session lifecycle management and persistence.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SessionManager, SessionManagerError } from '../../src/session/session-manager.js';
import { ObsidianClient } from '../../src/obsidian/client.js';
import { Session, SessionId, createVaultPath } from '../../src/session/types.js';

// Mock ObsidianClient
vi.mock('../../src/obsidian/client.js');

describe('SessionManager', () => {
  let client: ObsidianClient;
  let manager: SessionManager;
  let mockWriteNote: ReturnType<typeof vi.fn>;
  let mockReadNote: ReturnType<typeof vi.fn>;
  let mockDeleteNote: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Storage for written files
    const storage = new Map<string, string>();

    // Create mock client methods
    mockWriteNote = vi.fn().mockImplementation(async (path: string, content: string) => {
      storage.set(path, content);
      return undefined;
    });

    mockReadNote = vi.fn().mockImplementation(async (path: string) => {
      if (storage.has(path)) {
        return storage.get(path)!;
      }
      throw new Error(`File not found: ${path}`);
    });

    mockDeleteNote = vi.fn().mockImplementation(async (path: string) => {
      storage.delete(path);
      return undefined;
    });

    client = {
      writeNote: mockWriteNote,
      readNote: mockReadNote,
      deleteNote: mockDeleteNote,
    } as unknown as ObsidianClient;

    manager = new SessionManager(client, {
      debounceMs: 100, // Short debounce for testing
      inactivityTimeoutMs: 10000, // 10 seconds - long enough to not fire during tests
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('startSession', () => {
    it('should create a new session', async () => {
      const session = await manager.startSession('test-project', 'Test Project');

      expect(session).toBeDefined();
      expect(session.projectName).toBe('Test Project');
      expect(session.status).toBe('active');
      expect(session.sessionId).toBeTruthy();
      expect(session.startTime).toBeTruthy();
      expect(session.endTime).toBeNull();
      expect(session.changelog).toEqual([]);
      expect(session.todos).toEqual([]);
    });

    it('should persist session immediately on start', async () => {
      await manager.startSession('test-project', 'Test Project');

      // VaultPersistence writes to temp file then final file (2 writes + backup check)
      expect(mockWriteNote).toHaveBeenCalled();
      const finalCall = mockWriteNote.mock.calls.find(
        (call) => call[0].includes('.sessions/active/') && !call[0].includes('.tmp')
      );
      expect(finalCall).toBeDefined();
      // Check for status in pretty-printed JSON
      expect(finalCall![1]).toContain('"status": "active"');
    });

    it('should throw if session already active', async () => {
      await manager.startSession('test-project', 'Test Project');

      await expect(manager.startSession('test-project', 'Test Project')).rejects.toThrow(
        SessionManagerError
      );
      await expect(manager.startSession('test-project', 'Test Project')).rejects.toThrow(
        'session already active'
      );
    });

    it('should include git context if available', async () => {
      const session = await manager.startSession('test-project', 'Test Project');

      expect(session.context).toBeDefined();
      expect(session.context.workingDirectory).toBe(process.cwd());
    });
  });

  describe('pauseSession', () => {
    it('should pause active session', async () => {
      await manager.startSession('test-project', 'Test Project');

      // Clear mock calls from start
      mockWriteNote.mockClear();

      await manager.pauseSession();

      const session = manager.getCurrentSession();
      expect(session?.status).toBe('paused');
      // VaultPersistence writes to temp then final file
      expect(mockWriteNote).toHaveBeenCalled();
    });

    it('should throw if no active session', async () => {
      await expect(manager.pauseSession()).rejects.toThrow(SessionManagerError);
      await expect(manager.pauseSession()).rejects.toThrow('no active session');
    });

    it('should throw if session already paused', async () => {
      await manager.startSession('test-project', 'Test Project');
      await manager.pauseSession();

      await expect(manager.pauseSession()).rejects.toThrow(SessionManagerError);
    });
  });

  describe('resumeSession', () => {
    it('should resume paused session', async () => {
      await manager.startSession('test-project', 'Test Project');
      await manager.pauseSession();

      mockWriteNote.mockClear();

      await manager.resumeSession();

      const session = manager.getCurrentSession();
      expect(session?.status).toBe('active');
      // VaultPersistence writes to temp then final file
      expect(mockWriteNote).toHaveBeenCalled();
    });

    it('should throw if no session to resume', async () => {
      await expect(manager.resumeSession()).rejects.toThrow(SessionManagerError);
      await expect(manager.resumeSession()).rejects.toThrow('no session to resume');
    });

    it('should throw if session not paused', async () => {
      await manager.startSession('test-project', 'Test Project');

      await expect(manager.resumeSession()).rejects.toThrow(SessionManagerError);
    });

    it('should load session from vault if sessionId provided', async () => {
      const mockSession: Session = {
        sessionId: 'sess_123' as SessionId,
        projectName: 'Test',
        startTime: '2024-01-01T00:00:00Z',
        endTime: null,
        status: 'paused',
        changelog: [],
        todos: [],
        context: {
          filesRead: [],
          filesModified: [],
          workingDirectory: '/test',
        },
        metadata: {
          environment: 'test',
          toolsUsed: [],
          interactionCount: 0,
        },
      };

      // First start a session to set project context
      await manager.startSession('test-project', 'Test Project');
      await manager.pauseSession();

      // Now mock reading the specific session
      mockReadNote.mockImplementation(async (path: string) => {
        if (path.includes('sess_123')) {
          return JSON.stringify({
            version: '1.0',
            serializedAt: '2024-01-01T00:00:00Z',
            session: mockSession,
          });
        }
        // Return last written content for other paths
        const lastCall = mockWriteNote.mock.calls[mockWriteNote.mock.calls.length - 1];
        if (lastCall) {
          return lastCall[1];
        }
        throw new Error('Not found');
      });

      const resumed = await manager.resumeSession('sess_123' as SessionId);

      expect(resumed.sessionId).toBe('sess_123');
      expect(resumed.status).toBe('active');
      expect(mockReadNote).toHaveBeenCalled();
    });
  });

  describe('completeSession', () => {
    it('should complete session and archive it', async () => {
      await manager.startSession('test-project', 'Test Project');

      mockWriteNote.mockClear();
      mockDeleteNote.mockClear();

      await manager.completeSession();

      const session = manager.getCurrentSession();
      expect(session).toBeNull();

      // Should write to archive location
      expect(mockWriteNote).toHaveBeenCalled();
      const archiveCall = mockWriteNote.mock.calls.find((call) =>
        call[0].includes('.sessions/archived/')
      );
      expect(archiveCall).toBeDefined();
      // Check for status in pretty-printed JSON
      expect(archiveCall![1]).toContain('"status": "completed"');
      expect(mockDeleteNote).toHaveBeenCalled();
    });

    it('should throw if no active session', async () => {
      await expect(manager.completeSession()).rejects.toThrow(SessionManagerError);
      await expect(manager.completeSession()).rejects.toThrow('no active session');
    });

    it('should set endTime when completing', async () => {
      await manager.startSession('test-project', 'Test Project');

      mockWriteNote.mockClear();

      await manager.completeSession();

      // Check the call to verify endTime is set
      const writeCall = mockWriteNote.mock.calls[0];
      const serialized = JSON.parse(writeCall[1]);
      expect(serialized.session.endTime).toBeTruthy();
      expect(serialized.session.status).toBe('completed');
    });
  });

  describe('updateSession', () => {
    it('should update session with custom updater', async () => {
      await manager.startSession('test-project', 'Test Project');

      await manager.updateSession((session) => ({
        ...session,
        metadata: {
          ...session.metadata,
          interactionCount: 5,
        },
      }));

      const session = manager.getCurrentSession();
      expect(session?.metadata.interactionCount).toBe(5);
    });

    it('should throw if no active session', async () => {
      await expect(manager.updateSession((s) => s)).rejects.toThrow(SessionManagerError);
    });

    it('should debounce regular updates', async () => {
      await manager.startSession('test-project', 'Test Project');
      mockWriteNote.mockClear();

      // Multiple rapid updates
      await manager.updateSession((s) => ({
        ...s,
        metadata: { ...s.metadata, interactionCount: 1 },
      }));
      await manager.updateSession((s) => ({
        ...s,
        metadata: { ...s.metadata, interactionCount: 2 },
      }));
      await manager.updateSession((s) => ({
        ...s,
        metadata: { ...s.metadata, interactionCount: 3 },
      }));

      // Should not persist immediately (empty updates are debounced)
      expect(mockWriteNote).toHaveBeenCalledTimes(0);

      // Wait for debounce
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should persist after debounce (temp + final file writes)
      expect(mockWriteNote.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('trackFileRead', () => {
    it('should track file reads', async () => {
      await manager.startSession('test-project', 'Test Project');

      const path = createVaultPath('notes/readme');
      await manager.trackFileRead(path);

      const session = manager.getCurrentSession();
      expect(session?.context.filesRead).toContain(path);
      expect(session?.metadata.interactionCount).toBe(1);
    });

    it('should not duplicate file reads', async () => {
      await manager.startSession('test-project', 'Test Project');

      const path = createVaultPath('notes/readme');
      await manager.trackFileRead(path);
      await manager.trackFileRead(path);

      const session = manager.getCurrentSession();
      expect(session?.context.filesRead).toHaveLength(1);
    });
  });

  describe('trackFileModified', () => {
    it('should track file modifications', async () => {
      await manager.startSession('test-project', 'Test Project');

      await manager.trackFileModified('src/index.ts');

      const session = manager.getCurrentSession();
      expect(session?.context.filesModified).toContain('src/index.ts');
      expect(session?.metadata.interactionCount).toBe(1);
    });

    it('should not duplicate file modifications', async () => {
      await manager.startSession('test-project', 'Test Project');

      await manager.trackFileModified('src/index.ts');
      await manager.trackFileModified('src/index.ts');

      const session = manager.getCurrentSession();
      expect(session?.context.filesModified).toHaveLength(1);
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session', async () => {
      const started = await manager.startSession('test-project', 'Test Project');
      const current = manager.getCurrentSession();

      expect(current).toBe(started);
    });

    it('should return null if no session', () => {
      const session = manager.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('getSessionStatus', () => {
    it('should return session status', async () => {
      await manager.startSession('test-project', 'Test Project');
      expect(manager.getSessionStatus()).toBe('active');

      await manager.pauseSession();
      expect(manager.getSessionStatus()).toBe('paused');
    });

    it('should return null if no session', () => {
      expect(manager.getSessionStatus()).toBeNull();
    });
  });

  describe('flush', () => {
    it('should persist pending changes immediately', async () => {
      await manager.startSession('test-project', 'Test Project');
      mockWriteNote.mockClear();

      // Make an update (debounced)
      await manager.updateSession((s) => ({
        ...s,
        metadata: { ...s.metadata, interactionCount: 1 },
      }));

      // Should not persist yet
      expect(mockWriteNote).toHaveBeenCalledTimes(0);

      // Flush
      await manager.flush();

      // Should persist immediately (temp + final writes)
      expect(mockWriteNote.mock.calls.length).toBeGreaterThan(0);
    });

    it('should not throw if no session', async () => {
      await expect(manager.flush()).resolves.not.toThrow();
    });
  });
});
