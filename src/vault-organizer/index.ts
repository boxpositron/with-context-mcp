/**
 * Vault Organization Module
 *
 * Intelligent vault organization with content analysis and automated reorganization.
 * Provides tools to analyze vault structure, generate organization suggestions,
 * and safely execute reorganization operations with rollback capability.
 *
 * @module vault-organizer
 */

// Export all types
export * from './types.js';

// Export vault analyzer functions
export {
  analyzeVaultStructure,
  analyzeFileContent,
  categorizeFile,
  extractKeywords,
  extractTopics,
} from './vault-analyzer.js';

// Export vault reorganizer functions
export {
  executeReorganization,
  executeOperation,
  rollbackOperations,
  updateLinks,
  findAffectedFiles,
  createBackup,
} from './vault-reorganizer.js';
