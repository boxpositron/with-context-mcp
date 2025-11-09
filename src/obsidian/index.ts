/**
 * Obsidian REST API Client
 *
 * Export main client and types
 */

export { ObsidianClient, default } from './client.js';
export type {
  ObsidianNote,
  ObsidianApiResponse,
  ObsidianClientConfig,
  VaultFile,
  ListNotesResponse,
  WriteMode,
} from './types.js';
export {
  ObsidianApiError,
  ObsidianNotFoundError,
  ObsidianAuthenticationError,
  ObsidianConnectionError,
} from './types.js';
