// Export all tool functions for use in plugins and other integrations
export { writeNote, writeNoteSchema, type WriteNoteInput } from './write-note.js';
export { readNote, readNoteSchema, type ReadNoteInput } from './read-note.js';
export { listNotes, listNotesSchema, type ListNotesInput } from './list-notes.js';
export { deleteNote, deleteNoteSchema, type DeleteNoteInput } from './delete-note.js';
export { searchNotes, searchNotesSchema, type SearchNotesInput } from './search-notes.js';
export { healthCheck, healthCheckSchema, type HealthCheckInput } from './health-check.js';
export {
  batchWriteNotes,
  batchWriteNotesSchema,
  type BatchWriteNotesInput,
} from './batch-write-notes.js';
export {
  getNoteMetadata,
  getNoteMetadataSchema,
  type GetNoteMetadataInput,
} from './get-note-metadata.js';
export {
  updateFrontmatter,
  updateFrontmatterSchema,
  type UpdateFrontmatterInput,
} from './update-frontmatter.js';
export {
  replaceSection,
  replaceSectionSchema,
  type ReplaceSectionInput,
} from './replace-section.js';
export {
  listTemplatesHandler,
  listTemplatesSchema,
  type ListTemplatesInput,
} from './list-templates.js';
export {
  createFromTemplateHandler,
  createFromTemplateSchema,
  type CreateFromTemplateInput,
} from './create-from-template.js';
export { setProjectContext, setProjectContextSchema } from './set-project-context.js';
export { ingestNotes, ingestNotesSchema, type IngestNotesInput } from './ingest-notes.js';
export { teleportNotes, teleportNotesSchema, type TeleportNotesInput } from './teleport-notes.js';
export { syncNotes, syncNotesSchema, type SyncNotesInput } from './sync-notes.js';
export { setupNotes, setupNotesSchema, type SetupNotesArgs } from './setup-notes.js';

// Configuration tools
export {
  validateConfigTool,
  validateConfigToolSchema,
  previewDelegationTool,
  previewDelegationToolSchema,
} from './config-tools.js';

// Session management tools
export {
  startSession,
  startSessionSchema,
  type StartSessionInput,
  pauseSession,
  pauseSessionSchema,
  type PauseSessionInput,
  resumeSession,
  resumeSessionSchema,
  type ResumeSessionInput,
  endSession,
  endSessionSchema,
  type EndSessionInput,
  getSessionStatus,
  getSessionStatusSchema,
  type GetSessionStatusInput,
} from './session-tools.js';

// Changelog and todo management tools
export {
  addChangelogEntry,
  addChangelogEntrySchema,
  type AddChangelogEntryInput,
  getSessionChangelog,
  getSessionChangelogSchema,
  type GetSessionChangelogInput,
  getCommitSuggestion,
  getCommitSuggestionSchema,
  type GetCommitSuggestionInput,
  addTodo,
  addTodoSchema,
  type AddTodoInput,
  updateTodo,
  updateTodoSchema,
  type UpdateTodoInput,
  listTodos,
  listTodosSchema,
  type ListTodosInput,
} from './changelog-todo-tools.js';

// Vault analysis tools
export {
  analyzeVaultStructureHandler,
  analyzeVaultStructureSchema,
  type AnalyzeVaultStructureInput,
} from './analyze-vault-structure.js';

// Notes reorganization tools
export {
  reorganizeNotesHandler,
  reorganizeNotesSchema,
  type ReorganizeNotesInput,
} from './reorganize-notes.js';

// Organization plan generation tools
export {
  generateOrganizationPlanHandler,
  generateOrganizationPlanSchema,
  type GenerateOrganizationPlanInput,
} from './generate-organization-plan.js';
