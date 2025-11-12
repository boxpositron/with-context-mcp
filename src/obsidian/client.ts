/**
 * Obsidian Local REST API Client
 *
 * A TypeScript client wrapper for the Obsidian Local REST API plugin.
 * Provides methods to interact with Obsidian vaults programmatically.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import https from 'https';
import {
  ObsidianClientConfig,
  ObsidianApiError,
  ObsidianNotFoundError,
  ObsidianAuthenticationError,
  ObsidianConnectionError,
  ObsidianHealthCheck,
  WriteMode,
} from './types.js';
import { sessionState } from '../session-state.js';

export class ObsidianClient {
  private client: AxiosInstance;
  private vault: string;

  /**
   * Creates a new Obsidian API client instance
   *
   * @param config - Client configuration
   * @param config.apiUrl - Base URL of the Obsidian REST API (e.g., https://localhost:27124)
   * @param config.apiKey - API key for authentication
   * @param config.vault - Name of the vault to interact with
   * @param config.allowInsecure - Allow self-signed certificates (default: true for local dev)
   */
  constructor(config: ObsidianClientConfig) {
    const { apiUrl, apiKey, vault, allowInsecure = true } = config;

    this.vault = vault;

    // Create axios instance with custom configuration
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'text/markdown',
        Accept: 'application/json',
      },
      // Allow self-signed certificates for local development
      httpsAgent: allowInsecure ? new https.Agent({ rejectUnauthorized: false }) : undefined,
      timeout: 10000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => this.handleError(error)
    );
  }

  /**
   * Normalizes a vault path by removing leading slashes and ensuring .md extension
   */
  private normalizePath(path: string): string {
    // Remove leading slash
    let normalized = path.startsWith('/') ? path.slice(1) : path;

    // Ensure .md extension
    if (!normalized.endsWith('.md')) {
      normalized += '.md';
    }

    return normalized;
  }

  /**
   * Builds the full vault path for API requests
   */
  private buildVaultPath(path: string): string {
    const normalized = this.normalizePath(path);
    return `/vault/${normalized}`;
  }

  /**
   * Handle axios errors and convert to custom error types
   */
  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Connection errors
      if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
        throw new ObsidianConnectionError(
          `Cannot connect to Obsidian API. Ensure the Local REST API plugin is running.`
        );
      }

      // HTTP status errors
      if (axiosError.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        switch (status) {
          case 401:
          case 403:
            throw new ObsidianAuthenticationError('Invalid API key or insufficient permissions');
          case 404:
            throw new ObsidianNotFoundError(
              typeof data === 'object' && data && 'message' in data
                ? String(data.message)
                : 'Resource not found'
            );
          default:
            throw new ObsidianApiError(`API request failed: ${axiosError.message}`, status, data);
        }
      }

      // Request errors (no response)
      throw new ObsidianConnectionError(axiosError.message);
    }

    // Unknown errors
    throw new ObsidianApiError(error instanceof Error ? error.message : 'Unknown error occurred');
  }

  /**
   * Write a note to the vault
   *
   * IMPORTANT: This method enforces read-before-write for existing files.
   * For 'overwrite' and 'append' modes, the file must be read first (via readNote)
   * before writing is allowed. This ensures the caller has the current state.
   * Only 'create' mode can write without a prior read (for new files only).
   *
   * @param path - Relative path within the vault (e.g., 'daily/2024-01-01' or 'notes/example.md')
   * @param content - Markdown content to write
   * @param mode - Write mode: 'create' (POST), 'overwrite' (PUT), or 'append' (PUT with Content-Insertion-Position header)
   * @returns Promise resolving when write is complete
   */
  async writeNote(path: string, content: string, mode: WriteMode = 'overwrite'): Promise<void> {
    const vaultPath = this.buildVaultPath(path);

    // Enforce read-before-write for existing files
    if (mode === 'overwrite' || mode === 'append') {
      const fileExists = await this.noteExists(path);

      if (fileExists) {
        // Check if this file was previously read in this session
        const wasRead = sessionState.hasFileBeenRead(path);

        if (!wasRead) {
          throw new ObsidianApiError(
            `Cannot write to existing file without reading it first. ` +
              `File: ${path}. Call readNote() before writeNote() for existing files.`
          );
        }
      }
    }

    switch (mode) {
      case 'create':
        await this.client.post(vaultPath, content, {
          headers: { 'Content-Type': 'text/markdown' },
        });
        break;

      case 'overwrite':
        await this.client.put(vaultPath, content, {
          headers: { 'Content-Type': 'text/markdown' },
        });
        break;

      case 'append':
        // Use PUT with Content-Insertion-Position header for append
        // This is the correct way to append in Obsidian Local REST API
        await this.client.put(vaultPath, content, {
          headers: {
            'Content-Type': 'text/markdown',
            'Content-Insertion-Position': 'end',
          },
        });
        break;

      default:
        throw new ObsidianApiError(`Invalid write mode: ${mode}`);
    }
  }

  /**
   * Internal method to fetch note content without marking as read
   * Used by noteExists() to check existence without triggering read tracking
   */
  private async fetchNoteContent(path: string): Promise<string> {
    const vaultPath = this.buildVaultPath(path);

    const response = await this.client.get(vaultPath, {
      headers: { Accept: 'text/markdown' },
      responseType: 'text',
    });

    return response.data;
  }

  /**
   * Read a note from the vault
   *
   * @param path - Relative path within the vault
   * @returns Promise resolving to the note content as a string
   */
  async readNote(path: string): Promise<string> {
    const content = await this.fetchNoteContent(path);

    // Mark file as read in session for read-before-write enforcement
    sessionState.markFileAsRead(path);

    return content;
  }

  /**
   * List notes in a directory (recursively)
   *
   * The Obsidian REST API doesn't support direct directory listing via path.
   * Instead, we get all files and filter client-side, recursively scanning subdirectories.
   *
   * @param path - Directory path within the vault (default: root)
   * @returns Promise resolving to an array of file paths (including subdirectories)
   */
  async listNotes(path: string = ''): Promise<string[]> {
    // Normalize path: remove leading/trailing slashes and ensure trailing slash
    let dirPath = path ? path.trim().replace(/^\/+|\/+$/g, '') : '';
    if (dirPath) {
      dirPath += '/';
    }

    // Use the /vault/ endpoint to list directory contents
    const endpoint = `/vault/${dirPath}`;
    const response = await this.client.get<{ files: string[] }>(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });

    // The API returns an array of filenames/directories
    // Directories end with '/', files don't
    const files: string[] = [];

    if (response.data && Array.isArray(response.data.files)) {
      for (const item of response.data.files) {
        if (item.endsWith('/')) {
          // This is a directory - recursively list its contents
          const subDirPath = dirPath + item;
          const subFiles = await this.listNotes(subDirPath.replace(/\/+$/, '')); // Remove trailing slash
          // Add subdirectory files with relative paths
          for (const subFile of subFiles) {
            files.push(item + subFile);
          }
        } else if (item.endsWith('.md')) {
          // This is a markdown file - add it to the list
          files.push(item);
        }
      }
    }

    return files;
  }

  /**
   * Delete a note from the vault
   *
   * @param path - Relative path within the vault
   * @returns Promise resolving when deletion is complete
   */
  async deleteNote(path: string): Promise<void> {
    const vaultPath = this.buildVaultPath(path);
    await this.client.delete(vaultPath);
  }

  /**
   * Check if a note exists
   *
   * Note: This method does NOT mark the file as read, as it's an internal check.
   * Use readNote() explicitly if you want to mark the file as read.
   *
   * @param path - Relative path within the vault
   * @returns Promise resolving to true if note exists, false otherwise
   */
  async noteExists(path: string): Promise<boolean> {
    try {
      await this.fetchNoteContent(path);
      return true;
    } catch (error) {
      if (error instanceof ObsidianNotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get vault information
   *
   * @returns Vault name
   */
  getVaultName(): string {
    return this.vault;
  }

  /**
   * Test connection to Obsidian API and validate configuration
   *
   * This method performs a comprehensive health check of the Obsidian API connection:
   * - Tests basic connectivity to the API URL
   * - Validates API key authentication
   * - Checks vault accessibility
   * - Measures API latency
   *
   * @returns Promise resolving to health check results
   */
  async testConnection(): Promise<ObsidianHealthCheck> {
    const startTime = Date.now();
    const result: ObsidianHealthCheck = {
      connected: false,
      authenticated: false,
      vaultAccessible: false,
      vaultName: this.vault,
      apiUrl: this.client.defaults.baseURL || '',
    };

    try {
      // Try to list root directory as a comprehensive connectivity test
      // This tests: connection, authentication, and vault accessibility in one call
      const response = await this.client.get('/vault/', {
        headers: { Accept: 'application/json' },
        timeout: 5000,
      });

      const latencyMs = Date.now() - startTime;

      // If we got here, connection and authentication worked
      result.connected = true;
      result.authenticated = true;
      result.latencyMs = latencyMs;

      // Check if we got valid vault data
      if (response.data && (Array.isArray(response.data.files) || response.status === 200)) {
        result.vaultAccessible = true;
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      result.latencyMs = latencyMs;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Connection errors
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ENOTFOUND') {
          result.error = `Cannot connect to Obsidian API at ${result.apiUrl}. Ensure the Local REST API plugin is running.`;
          return result;
        }

        // Timeout
        if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
          result.error = `Connection timeout. The API may be slow or unreachable.`;
          result.connected = true; // Partial connection
          return result;
        }

        // HTTP status errors
        if (axiosError.response) {
          const status = axiosError.response.status;
          result.connected = true;

          switch (status) {
            case 401:
            case 403:
              result.error = 'Invalid API key or insufficient permissions';
              break;
            case 404:
              result.authenticated = true;
              result.error = `Vault '${this.vault}' not found. Check OBSIDIAN_VAULT configuration.`;
              break;
            default:
              result.authenticated = true;
              result.error = `API error: ${axiosError.message} (Status: ${status})`;
          }
          return result;
        }

        // Other axios errors
        result.error = axiosError.message;
      } else {
        result.error = error instanceof Error ? error.message : 'Unknown error occurred';
      }
    }

    return result;
  }

  /**
   * Create a note with frontmatter
   *
   * @param path - Relative path within the vault
   * @param content - Note content (without frontmatter)
   * @param frontmatter - Object to convert to YAML frontmatter
   * @param mode - Write mode
   */
  async writeNoteWithFrontmatter(
    path: string,
    content: string,
    frontmatter: Record<string, unknown>,
    mode: WriteMode = 'overwrite'
  ): Promise<void> {
    const yamlFrontmatter = this.buildFrontmatter(frontmatter);
    const fullContent = `${yamlFrontmatter}\n${content}`;

    await this.writeNote(path, fullContent, mode);
  }

  /**
   * Build YAML frontmatter from object
   */
  private buildFrontmatter(data: Record<string, unknown>): string {
    const lines = ['---'];

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach((item) => lines.push(`  - ${item}`));
      } else if (typeof value === 'string') {
        // Escape quotes in strings
        const escaped = value.replace(/"/g, '\\"');
        lines.push(`${key}: "${escaped}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }

    lines.push('---');
    return lines.join('\n');
  }
}

export default ObsidianClient;
