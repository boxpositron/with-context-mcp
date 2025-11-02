/**
 * Shared types for the MCP server
 */

/**
 * Write mode for documentation updates
 */
export type WriteMode = 'append' | 'overwrite' | 'create';

/**
 * Project context information
 */
export interface ProjectContext {
  /**
   * The project folder name (e.g., repository name)
   */
  projectFolder: string;

  /**
   * The base path where documentation is stored
   */
  basePath: string;

  /**
   * Optional git branch name
   */
  branch?: string;

  /**
   * Optional current working directory
   */
  cwd?: string;
}

/**
 * Path validation error
 */
export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathValidationError';
    Object.setPrototypeOf(this, PathValidationError.prototype);
  }
}

/**
 * Project detection error
 */
export class ProjectDetectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectDetectionError';
    Object.setPrototypeOf(this, ProjectDetectionError.prototype);
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * File operation error
 */
export class FileOperationError extends Error {
  constructor(
    message: string,
    public readonly operation: 'read' | 'write' | 'delete' | 'create',
    public readonly path?: string
  ) {
    super(message);
    this.name = 'FileOperationError';
    Object.setPrototypeOf(this, FileOperationError.prototype);
  }
}

/**
 * Context7 API error
 */
export class Context7Error extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'Context7Error';
    Object.setPrototypeOf(this, Context7Error.prototype);
  }
}

/**
 * Documentation entry metadata
 */
export interface DocumentationMetadata {
  /**
   * File path relative to project root
   */
  path: string;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;

  /**
   * Write mode used for last update
   */
  lastWriteMode: WriteMode;

  /**
   * Content length in characters
   */
  contentLength: number;

  /**
   * Optional tags for categorization
   */
  tags?: string[];
}

/**
 * Write operation result
 */
export interface WriteResult {
  /**
   * Full path to the written file
   */
  path: string;

  /**
   * Write mode that was used
   */
  mode: WriteMode;

  /**
   * Whether the file was newly created
   */
  created: boolean;

  /**
   * Size of content written in bytes
   */
  bytesWritten: number;

  /**
   * Metadata about the written file
   */
  metadata?: DocumentationMetadata;
}

/**
 * Read operation result
 */
export interface ReadResult {
  /**
   * Full path to the file
   */
  path: string;

  /**
   * File content
   */
  content: string;

  /**
   * File metadata
   */
  metadata?: DocumentationMetadata;
}

/**
 * Configuration options for the MCP server
 */
export interface ServerConfig {
  /**
   * Context7 API key
   */
  apiKey: string;

  /**
   * Base path for documentation storage
   */
  basePath: string;

  /**
   * Whether to auto-detect project folder
   */
  autoDetectProject?: boolean;

  /**
   * Default write mode
   */
  defaultWriteMode?: WriteMode;

  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxFileSize?: number;

  /**
   * Allowed file extensions (default: ['.md'])
   */
  allowedExtensions?: string[];
}

/**
 * Tool execution context
 */
export interface ToolContext {
  /**
   * Project context
   */
  project: ProjectContext;

  /**
   * Server configuration
   */
  config: ServerConfig;
}
