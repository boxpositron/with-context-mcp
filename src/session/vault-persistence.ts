/**
 * Vault Persistence Layer
 *
 * Handles atomic writes and reads of session state to/from Obsidian vault.
 * Implements best practices for file-based persistence with error recovery.
 */

import { ObsidianClient } from '../obsidian/client.js';
import { Session, SessionId, SessionConfig, now } from './types.js';
import { SessionSchema, SessionConfigSchema } from './config.js';

// ============================================
// Session Storage Paths
// ============================================

/**
 * Session storage path utilities
 */
export class SessionPaths {
  static readonly SESSIONS_DIR = '.sessions';
  static readonly ACTIVE_DIR = '.sessions/active';
  static readonly ARCHIVED_DIR = '.sessions/archived';
  static readonly CONFIG_FILE = '.sessions/config.json';

  /**
   * Extract project name from path
   * Handles both absolute paths and project names
   */
  private static extractProjectName(projectFolder: string): string {
    // If it's an absolute path, extract the last component
    if (projectFolder.startsWith('/')) {
      const parts = projectFolder.split('/');
      return parts[parts.length - 1];
    }
    return projectFolder;
  }

  /**
   * Get path for active session
   */
  static getActivePath(projectFolder: string, sessionId: SessionId): string {
    const projectName = this.extractProjectName(projectFolder);
    return `Projects/${projectName}/${this.ACTIVE_DIR}/${sessionId}.json`;
  }

  /**
   * Get archived path organized by year-month
   */
  static getArchivedPath(projectFolder: string, sessionId: SessionId, startTime: string): string {
    const projectName = this.extractProjectName(projectFolder);
    const date = new Date(startTime);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return `Projects/${projectName}/${this.ARCHIVED_DIR}/${yearMonth}/${sessionId}.json`;
  }

  /**
   * Get config file path
   */
  static getConfigPath(projectFolder: string): string {
    const projectName = this.extractProjectName(projectFolder);
    return `Projects/${projectName}/${this.CONFIG_FILE}`;
  }
}

// ============================================
// Custom Errors
// ============================================

/**
 * Session persistence error
 */
export class SessionPersistenceError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'SessionPersistenceError';
  }
}

// ============================================
// Session Envelope
// ============================================

/**
 * Session envelope for versioning and metadata
 */
export interface SessionEnvelope {
  readonly version: string;
  readonly serializedAt: string;
  readonly session: Session;
}

// ============================================
// Vault Persistence
// ============================================

/**
 * Handles session persistence to Obsidian vault
 *
 * Implements atomic writes with backup and recovery.
 */
export class VaultPersistence {
  constructor(private client: ObsidianClient) {}

  /**
   * Write session atomically to vault
   *
   * Uses temp file + rename pattern for atomicity:
   * 1. Write to .tmp file
   * 2. Verify write succeeded
   * 3. Overwrite final file
   * 4. Clean up temp file
   *
   * @param path - Vault path to write to
   * @param session - Session to persist
   * @param options - Write options
   */
  async writeSession(
    path: string,
    session: Session,
    options: { backup?: boolean } = {}
  ): Promise<void> {
    const tempPath = `${path}.tmp`;
    const backupPath = `${path}.backup`;

    try {
      // Step 1: Create backup if requested and file exists
      if (options.backup) {
        try {
          const existing = await this.client.readNote(path);
          await this.client.writeNote(backupPath, existing, 'overwrite');
        } catch {
          // File doesn't exist yet, skip backup
        }
      }

      // Step 2: Serialize session to pretty JSON
      const content = this.serializeSession(session);

      // Step 3: Write to temp file
      try {
        await this.client.writeNote(tempPath, content, 'create');
      } catch {
        // If temp exists, overwrite it
        try {
          await this.client.writeNote(tempPath, content, 'overwrite');
        } catch (overwriteError) {
          throw new SessionPersistenceError(
            `Failed to write temp file ${tempPath}`,
            overwriteError instanceof Error ? overwriteError : undefined
          );
        }
      }

      // Step 4: Verify temp file
      let written: string;
      try {
        written = await this.client.readNote(tempPath);
        this.validateSerialized(written);
      } catch (verifyError) {
        throw new SessionPersistenceError(
          `Failed to verify temp file ${tempPath}`,
          verifyError instanceof Error ? verifyError : undefined
        );
      }

      // Step 5: Overwrite final file
      try {
        await this.client.writeNote(path, written, 'overwrite');
      } catch (writeError) {
        throw new SessionPersistenceError(
          `Failed to write final session file ${path}`,
          writeError instanceof Error ? writeError : undefined
        );
      }

      // Step 6: Clean up temp file
      try {
        await this.client.deleteNote(tempPath);
      } catch {
        // Ignore cleanup errors
      }

      // Step 7: Clean up backup on success
      if (options.backup) {
        try {
          await this.client.deleteNote(backupPath);
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      // On failure, attempt recovery from backup
      if (options.backup) {
        try {
          const backup = await this.client.readNote(backupPath);
          await this.client.writeNote(path, backup, 'overwrite');
          console.error(`Session write failed, successfully restored from backup: ${backupPath}`);
        } catch {
          // Recovery failed, leave backup in place
          console.error(
            `Session write failed and backup recovery failed. Backup preserved at: ${backupPath}`
          );
        }
      }

      // Re-throw original error with context
      if (error instanceof SessionPersistenceError) {
        throw error;
      }

      throw new SessionPersistenceError(
        `Failed to write session to ${path}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Read session from vault
   *
   * @param path - Vault path to read from
   * @returns Parsed and validated session
   */
  async readSession(path: string): Promise<Session> {
    try {
      const content = await this.client.readNote(path);

      let envelope: SessionEnvelope;
      try {
        envelope = JSON.parse(content) as SessionEnvelope;
      } catch (parseError) {
        throw new SessionPersistenceError(
          `Failed to parse session JSON from ${path}: Invalid JSON format`,
          parseError instanceof Error ? parseError : undefined
        );
      }

      // Validate with Zod (validates structure)
      try {
        // Branded types are compatible at runtime since they're just strings
        const validated = SessionSchema.parse(envelope.session);
        return validated as unknown as Session;
      } catch (validationError) {
        throw new SessionPersistenceError(
          `Failed to validate session schema from ${path}: ${validationError instanceof Error ? validationError.message : String(validationError)}`,
          validationError instanceof Error ? validationError : undefined
        );
      }
    } catch (error) {
      if (error instanceof SessionPersistenceError) {
        throw error;
      }
      throw new SessionPersistenceError(
        `Failed to read session from ${path}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Write session configuration
   */
  async writeConfig(path: string, config: SessionConfig): Promise<void> {
    const content = JSON.stringify(config, null, 2);
    await this.client.writeNote(path, content, 'overwrite');
  }

  /**
   * Read session configuration
   */
  async readConfig(path: string): Promise<SessionConfig> {
    try {
      const content = await this.client.readNote(path);
      const config = JSON.parse(content);
      return SessionConfigSchema.parse(config);
    } catch (error) {
      throw new SessionPersistenceError(
        `Failed to read config from ${path}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if session exists
   */
  async sessionExists(path: string): Promise<boolean> {
    try {
      await this.client.readNote(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete session file
   */
  async deleteSession(path: string): Promise<void> {
    try {
      await this.client.deleteNote(path);
    } catch (error) {
      throw new SessionPersistenceError(
        `Failed to delete session at ${path}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Serialize session to JSON with envelope
   */
  private serializeSession(session: Session): string {
    const envelope: SessionEnvelope = {
      version: '1.0',
      serializedAt: now(),
      session,
    };

    // Pretty-print with 2-space indent
    return JSON.stringify(envelope, null, 2);
  }

  /**
   * Validate serialized session can be parsed
   */
  private validateSerialized(content: string): void {
    try {
      const envelope = JSON.parse(content) as SessionEnvelope;
      SessionSchema.parse(envelope.session);
    } catch (error) {
      throw new SessionPersistenceError(
        'Session validation failed after write',
        error instanceof Error ? error : undefined
      );
    }
  }
}
