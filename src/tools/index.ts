// Export all tool functions for use in plugins and other integrations
export { writeNote, writeNoteSchema, type WriteNoteInput } from './write-note.js';
export { readNote, readNoteSchema, type ReadNoteInput } from './read-note.js';
export { listNotes, listNotesSchema, type ListNotesInput } from './list-notes.js';
export { deleteNote, deleteNoteSchema, type DeleteNoteInput } from './delete-note.js';
export { searchNotes, searchNotesSchema, type SearchNotesInput } from './search-notes.js';
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
