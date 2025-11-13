/**
 * Obsidian REST API Types
 */

export interface ObsidianNote {
  path: string;
  content: string;
  tags?: string[];
  frontmatter?: Record<string, unknown>;
}

export interface ObsidianApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export interface ObsidianClientConfig {
  apiUrl: string;
  apiKey: string;
  vault: string;
  allowInsecure?: boolean;
}

export interface VaultFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  extension?: string;
  basename?: string;
  stat?: {
    ctime: number;
    mtime: number;
    size: number;
  };
}

export interface ListNotesResponse {
  files: VaultFile[];
  total?: number;
}

/**
 * Custom error classes for Obsidian API operations
 */
export class ObsidianApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ObsidianApiError';
    Object.setPrototypeOf(this, ObsidianApiError.prototype);
  }
}

export class ObsidianNotFoundError extends ObsidianApiError {
  constructor(path: string) {
    super(`Note not found: ${path}`, 404);
    this.name = 'ObsidianNotFoundError';
    Object.setPrototypeOf(this, ObsidianNotFoundError.prototype);
  }
}

export class ObsidianAuthenticationError extends ObsidianApiError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'ObsidianAuthenticationError';
    Object.setPrototypeOf(this, ObsidianAuthenticationError.prototype);
  }
}

export class ObsidianConnectionError extends ObsidianApiError {
  constructor(message = 'Failed to connect to Obsidian API') {
    super(message);
    this.name = 'ObsidianConnectionError';
    Object.setPrototypeOf(this, ObsidianConnectionError.prototype);
  }
}

export type WriteMode = 'create' | 'overwrite' | 'append' | 'prepend';

/**
 * Health check result for Obsidian API connection
 */
export interface ObsidianHealthCheck {
  connected: boolean;
  authenticated: boolean;
  vaultAccessible: boolean;
  vaultName: string;
  apiUrl: string;
  error?: string;
  latencyMs?: number;
}
