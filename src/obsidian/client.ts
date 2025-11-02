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
  WriteMode,
  VaultFile,
  ListNotesResponse,
} from './types.js';

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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'text/markdown',
        'Accept': 'application/json',
      },
      // Allow self-signed certificates for local development
      httpsAgent: allowInsecure
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined,
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
            throw new ObsidianAuthenticationError(
              'Invalid API key or insufficient permissions'
            );
          case 404:
            throw new ObsidianNotFoundError(
              typeof data === 'object' && data && 'message' in data
                ? String(data.message)
                : 'Resource not found'
            );
          default:
            throw new ObsidianApiError(
              `API request failed: ${axiosError.message}`,
              status,
              data
            );
        }
      }

      // Request errors (no response)
      throw new ObsidianConnectionError(axiosError.message);
    }

    // Unknown errors
    throw new ObsidianApiError(
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }

  /**
   * Write a note to the vault
   * 
   * @param path - Relative path within the vault (e.g., 'daily/2024-01-01' or 'notes/example.md')
   * @param content - Markdown content to write
   * @param mode - Write mode: 'create' (POST), 'overwrite' (PUT), or 'append' (PUT with Content-Insertion-Position header)
   * @returns Promise resolving when write is complete
   */
  async writeNote(
    path: string,
    content: string,
    mode: WriteMode = 'overwrite'
  ): Promise<void> {
    const vaultPath = this.buildVaultPath(path);

    try {
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
              'Content-Insertion-Position': 'end'
            },
          });
          break;

        default:
          throw new ObsidianApiError(`Invalid write mode: ${mode}`);
      }
    } catch (error) {
      // Error already handled by interceptor
      throw error;
    }
  }

  /**
   * Read a note from the vault
   * 
   * @param path - Relative path within the vault
   * @returns Promise resolving to the note content as a string
   */
  async readNote(path: string): Promise<string> {
    const vaultPath = this.buildVaultPath(path);

    try {
      const response = await this.client.get(vaultPath, {
        headers: { 'Accept': 'text/markdown' },
        responseType: 'text',
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List notes in a directory
   * 
   * The Obsidian REST API doesn't support direct directory listing via path.
   * Instead, we get all files and filter client-side.
   * 
   * @param path - Directory path within the vault (default: root)
   * @returns Promise resolving to an array of file paths
   */
  async listNotes(path: string = ''): Promise<string[]> {
    try {
      // Get ALL files from the vault (no path parameter)
      const response = await this.client.get<ListNotesResponse>('/vault');

      let files: string[] = [];

      // Extract file paths from various response formats
      if (response.data && response.data.files) {
        files = Array.isArray(response.data.files)
          ? response.data.files.map((file: VaultFile | string) => 
              typeof file === 'string' ? file : file.path
            )
          : [];
      } else if (Array.isArray(response.data)) {
        files = response.data.map((file: VaultFile | string) => 
          typeof file === 'string' ? file : file.path
        );
      }

      // Filter by directory path if specified
      if (path && path.trim() !== '') {
        let dirPath = path.trim();
        // Normalize: remove leading/trailing slashes
        dirPath = dirPath.replace(/^\/+|\/+$/g, '');
        
        // Filter files that start with this directory path
        const prefix = dirPath + '/';
        files = files.filter(f => 
          f.startsWith(prefix) || f === dirPath || f === dirPath + '.md'
        );
      }

      // Only return markdown files
      return files.filter(f => f.endsWith('.md'));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a note from the vault
   * 
   * @param path - Relative path within the vault
   * @returns Promise resolving when deletion is complete
   */
  async deleteNote(path: string): Promise<void> {
    const vaultPath = this.buildVaultPath(path);

    try {
      await this.client.delete(vaultPath);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a note exists
   * 
   * @param path - Relative path within the vault
   * @returns Promise resolving to true if note exists, false otherwise
   */
  async noteExists(path: string): Promise<boolean> {
    try {
      await this.readNote(path);
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
        value.forEach(item => lines.push(`  - ${item}`));
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
