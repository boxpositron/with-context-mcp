/**
 * Unit tests for vault-reorganizer module
 *
 * Tests reorganization execution, rollback, link updates, and error handling.
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ObsidianClient } from '../../src/obsidian/client.js';
import {
  executeReorganization,
  executeOperation,
  rollbackOperations,
  updateLinks,
  findAffectedFiles,
  createBackup,
} from '../../src/vault-organizer/vault-reorganizer.js';
import {
  OrganizationPlan,
  ReorganizationOperation,
  VaultFileInfo,
  VaultReorganizationError,
  RollbackError,
} from '../../src/vault-organizer/types.js';

// Mock ObsidianClient
vi.mock('../../src/obsidian/client.js', () => ({
  ObsidianClient: vi.fn(),
}));

describe('vault-reorganizer', () => {
  let mockClient: {
    readNote: Mock;
    writeNote: Mock;
    deleteNote: Mock;
    listNotes: Mock;
    noteExists: Mock;
  };

  beforeEach(() => {
    mockClient = {
      readNote: vi.fn(),
      writeNote: vi.fn(),
      deleteNote: vi.fn(),
      listNotes: vi.fn(),
      noteExists: vi.fn(),
    };
  });

  describe('executeOperation', () => {
    it('should execute rename operation successfully', async () => {
      const operation: ReorganizationOperation = {
        id: 'op_1',
        type: 'rename',
        sourcePath: 'old-name.md',
        targetPath: 'new-name.md',
        rollbackInfo: {
          originalPath: 'old-name.md',
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
      };

      mockClient.readNote.mockResolvedValue('# Original Content');
      mockClient.writeNote.mockResolvedValue(undefined);
      mockClient.deleteNote.mockResolvedValue(undefined);

      await executeOperation(mockClient as unknown as ObsidianClient, operation);

      expect(mockClient.readNote).toHaveBeenCalledWith('old-name.md');
      expect(mockClient.writeNote).toHaveBeenCalledWith(
        'new-name.md',
        '# Original Content',
        'create'
      );
      expect(mockClient.deleteNote).toHaveBeenCalledWith('old-name.md');
    });

    it('should execute move operation successfully', async () => {
      const operation: ReorganizationOperation = {
        id: 'op_2',
        type: 'move',
        sourcePath: 'folder-a/file.md',
        targetPath: 'folder-b/file.md',
        rollbackInfo: {
          originalPath: 'folder-a/file.md',
          originalLocation: 'folder-a/file.md',
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
      };

      mockClient.readNote.mockResolvedValue('# File Content');
      mockClient.writeNote.mockResolvedValue(undefined);
      mockClient.deleteNote.mockResolvedValue(undefined);

      await executeOperation(mockClient as unknown as ObsidianClient, operation);

      expect(mockClient.readNote).toHaveBeenCalledWith('folder-a/file.md');
      expect(mockClient.writeNote).toHaveBeenCalledWith(
        'folder-b/file.md',
        '# File Content',
        'create'
      );
      expect(mockClient.deleteNote).toHaveBeenCalledWith('folder-a/file.md');
    });

    it('should execute delete operation successfully', async () => {
      const operation: ReorganizationOperation = {
        id: 'op_3',
        type: 'delete',
        sourcePath: 'to-delete.md',
        rollbackInfo: {
          originalPath: 'to-delete.md',
          originalContent: '# Content',
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
      };

      mockClient.deleteNote.mockResolvedValue(undefined);

      await executeOperation(mockClient as unknown as ObsidianClient, operation);

      expect(mockClient.deleteNote).toHaveBeenCalledWith('to-delete.md');
    });

    it('should execute update_links operation successfully', async () => {
      const operation: ReorganizationOperation = {
        id: 'op_4',
        type: 'update_links',
        sourcePath: 'file-with-links.md',
        newContent: '# Updated Content\n[[new-link]]',
        rollbackInfo: {
          originalPath: 'file-with-links.md',
          originalContent: '# Old Content\n[[old-link]]',
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
      };

      mockClient.writeNote.mockResolvedValue(undefined);

      await executeOperation(mockClient as unknown as ObsidianClient, operation);

      expect(mockClient.writeNote).toHaveBeenCalledWith(
        'file-with-links.md',
        '# Updated Content\n[[new-link]]',
        'overwrite'
      );
    });

    it('should throw VaultReorganizationError on failure', async () => {
      const operation: ReorganizationOperation = {
        id: 'op_fail',
        type: 'rename',
        sourcePath: 'source.md',
        targetPath: 'target.md',
        rollbackInfo: {
          originalPath: 'source.md',
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
      };

      mockClient.readNote.mockRejectedValue(new Error('Read failed'));

      await expect(
        executeOperation(mockClient as unknown as ObsidianClient, operation)
      ).rejects.toThrow(VaultReorganizationError);
    });

    it('should throw error if target path missing for rename', async () => {
      const operation: ReorganizationOperation = {
        id: 'op_no_target',
        type: 'rename',
        sourcePath: 'source.md',
        rollbackInfo: {
          originalPath: 'source.md',
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
      };

      await expect(
        executeOperation(mockClient as unknown as ObsidianClient, operation)
      ).rejects.toThrow(VaultReorganizationError);
    });

    it('should throw error if new content missing for update_links', async () => {
      const operation: ReorganizationOperation = {
        id: 'op_no_content',
        type: 'update_links',
        sourcePath: 'file.md',
        rollbackInfo: {
          originalPath: 'file.md',
          timestamp: new Date().toISOString(),
        },
        status: 'pending',
      };

      await expect(
        executeOperation(mockClient as unknown as ObsidianClient, operation)
      ).rejects.toThrow(VaultReorganizationError);
    });
  });

  describe('rollbackOperations', () => {
    it('should rollback rename operation in reverse order', async () => {
      const operations: ReorganizationOperation[] = [
        {
          id: 'op_1',
          type: 'rename',
          sourcePath: 'old.md',
          targetPath: 'new.md',
          rollbackInfo: {
            originalPath: 'old.md',
            timestamp: new Date().toISOString(),
          },
          status: 'completed',
        },
      ];

      mockClient.readNote.mockResolvedValue('# Content');
      mockClient.writeNote.mockResolvedValue(undefined);
      mockClient.deleteNote.mockResolvedValue(undefined);

      await rollbackOperations(mockClient as unknown as ObsidianClient, operations);

      expect(mockClient.readNote).toHaveBeenCalledWith('new.md');
      expect(mockClient.writeNote).toHaveBeenCalledWith('old.md', '# Content', 'create');
      expect(mockClient.deleteNote).toHaveBeenCalledWith('new.md');
    });

    it('should rollback delete operation by restoring content', async () => {
      const operations: ReorganizationOperation[] = [
        {
          id: 'op_2',
          type: 'delete',
          sourcePath: 'deleted.md',
          rollbackInfo: {
            originalPath: 'deleted.md',
            originalContent: '# Restored Content',
            timestamp: new Date().toISOString(),
          },
          status: 'completed',
        },
      ];

      mockClient.writeNote.mockResolvedValue(undefined);

      await rollbackOperations(mockClient as unknown as ObsidianClient, operations);

      expect(mockClient.writeNote).toHaveBeenCalledWith(
        'deleted.md',
        '# Restored Content',
        'create'
      );
    });

    it('should rollback update_links operation', async () => {
      const operations: ReorganizationOperation[] = [
        {
          id: 'op_3',
          type: 'update_links',
          sourcePath: 'file.md',
          rollbackInfo: {
            originalPath: 'file.md',
            originalContent: '# Original Content',
            timestamp: new Date().toISOString(),
          },
          status: 'completed',
        },
      ];

      mockClient.writeNote.mockResolvedValue(undefined);

      await rollbackOperations(mockClient as unknown as ObsidianClient, operations);

      expect(mockClient.writeNote).toHaveBeenCalledWith(
        'file.md',
        '# Original Content',
        'overwrite'
      );
    });

    it('should skip pending operations during rollback', async () => {
      const operations: ReorganizationOperation[] = [
        {
          id: 'op_pending',
          type: 'rename',
          sourcePath: 'file.md',
          targetPath: 'newfile.md',
          rollbackInfo: {
            originalPath: 'file.md',
            timestamp: new Date().toISOString(),
          },
          status: 'pending',
        },
      ];

      await rollbackOperations(mockClient as unknown as ObsidianClient, operations);

      expect(mockClient.readNote).not.toHaveBeenCalled();
      expect(mockClient.writeNote).not.toHaveBeenCalled();
    });

    it('should throw RollbackError if rollback fails', async () => {
      const operations: ReorganizationOperation[] = [
        {
          id: 'op_fail',
          type: 'delete',
          sourcePath: 'deleted.md',
          rollbackInfo: {
            originalPath: 'deleted.md',
            originalContent: '# Content',
            timestamp: new Date().toISOString(),
          },
          status: 'completed',
        },
      ];

      mockClient.writeNote.mockRejectedValue(new Error('Write failed'));

      await expect(
        rollbackOperations(mockClient as unknown as ObsidianClient, operations)
      ).rejects.toThrow(RollbackError);
    });

    it('should process multiple operations in reverse order', async () => {
      const operations: ReorganizationOperation[] = [
        {
          id: 'op_1',
          type: 'rename',
          sourcePath: 'first.md',
          targetPath: 'first-new.md',
          rollbackInfo: {
            originalPath: 'first.md',
            timestamp: new Date().toISOString(),
          },
          status: 'completed',
        },
        {
          id: 'op_2',
          type: 'rename',
          sourcePath: 'second.md',
          targetPath: 'second-new.md',
          rollbackInfo: {
            originalPath: 'second.md',
            timestamp: new Date().toISOString(),
          },
          status: 'completed',
        },
      ];

      mockClient.readNote.mockResolvedValue('# Content');
      mockClient.writeNote.mockResolvedValue(undefined);
      mockClient.deleteNote.mockResolvedValue(undefined);

      await rollbackOperations(mockClient as unknown as ObsidianClient, operations);

      // Should process in reverse: op_2 then op_1
      const readCalls = mockClient.readNote.mock.calls;
      expect(readCalls[0][0]).toBe('second-new.md');
      expect(readCalls[1][0]).toBe('first-new.md');
    });
  });

  describe('updateLinks', () => {
    it('should update wiki-style links', async () => {
      const movedFiles = new Map([['old-path.md', 'new-path.md']]);

      mockClient.listNotes.mockResolvedValue(['file-with-link.md']);
      mockClient.readNote.mockResolvedValue('# Header\n\n[[old-path.md]]');
      mockClient.writeNote.mockResolvedValue(undefined);

      const linksUpdated = await updateLinks(
        mockClient as unknown as ObsidianClient,
        movedFiles,
        'project'
      );

      expect(linksUpdated).toBe(1);
      expect(mockClient.writeNote).toHaveBeenCalledWith(
        'file-with-link.md',
        '# Header\n\n[[new-path.md]]',
        'overwrite'
      );
    });

    it('should update markdown-style links', async () => {
      const movedFiles = new Map([['docs/guide.md', 'documentation/guide.md']]);

      mockClient.listNotes.mockResolvedValue(['index.md']);
      mockClient.readNote.mockResolvedValue('See [Guide](docs/guide.md) for details');
      mockClient.writeNote.mockResolvedValue(undefined);

      const linksUpdated = await updateLinks(
        mockClient as unknown as ObsidianClient,
        movedFiles,
        'project'
      );

      expect(linksUpdated).toBe(1);
      expect(mockClient.writeNote).toHaveBeenCalledWith(
        'index.md',
        'See [Guide](documentation/guide.md.md) for details',
        'overwrite'
      );
    });

    it('should update multiple links in same file', async () => {
      const movedFiles = new Map([['old.md', 'new.md']]);

      mockClient.listNotes.mockResolvedValue(['multi-link.md']);
      mockClient.readNote.mockResolvedValue('[[old.md]] and [[old.md]] again');
      mockClient.writeNote.mockResolvedValue(undefined);

      const linksUpdated = await updateLinks(
        mockClient as unknown as ObsidianClient,
        movedFiles,
        'project'
      );

      expect(linksUpdated).toBe(2);
    });

    it('should not modify files without matching links', async () => {
      const movedFiles = new Map([['moved.md', 'destination.md']]);

      mockClient.listNotes.mockResolvedValue(['unrelated.md']);
      mockClient.readNote.mockResolvedValue('# No links here');

      const linksUpdated = await updateLinks(
        mockClient as unknown as ObsidianClient,
        movedFiles,
        'project'
      );

      expect(linksUpdated).toBe(0);
      expect(mockClient.writeNote).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and continue', async () => {
      const movedFiles = new Map([['old.md', 'new.md']]);

      // file1.md contains a link, file2.md will fail to read
      mockClient.listNotes.mockResolvedValue(['file1.md', 'file2.md']);

      // findAffectedFilesSimple will read both files first
      // Then updateLinks will read affected files again
      // 1st call: file1.md in findAffectedFilesSimple (has link)
      // 2nd call: file2.md in findAffectedFilesSimple (fails)
      // 3rd call: file1.md in updateLinks (has link, needs update)
      mockClient.readNote
        .mockResolvedValueOnce('[[old.md]]') // file1.md in findAffectedFilesSimple
        .mockRejectedValueOnce(new Error('Read failed')) // file2.md fails in findAffectedFilesSimple
        .mockResolvedValueOnce('[[old.md]]'); // file1.md in updateLinks

      mockClient.writeNote.mockResolvedValue(undefined);

      const linksUpdated = await updateLinks(
        mockClient as unknown as ObsidianClient,
        movedFiles,
        'project'
      );

      // Should update file1 successfully and skip file2 due to error
      expect(linksUpdated).toBe(1);
      expect(mockClient.writeNote).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no files exist', async () => {
      const movedFiles = new Map([['old.md', 'new.md']]);

      mockClient.listNotes.mockResolvedValue([]);

      const linksUpdated = await updateLinks(
        mockClient as unknown as ObsidianClient,
        movedFiles,
        'project'
      );

      expect(linksUpdated).toBe(0);
    });
  });

  describe('findAffectedFiles', () => {
    it('should find files with links to moved files', () => {
      const movedFiles = new Map([['old.md', 'new.md']]);

      const allFiles: VaultFileInfo[] = [
        {
          path: 'linked-file.md',
          name: 'linked-file.md',
          extension: 'md',
          size: 100,
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          keywords: [],
          topics: [],
          contentMetadata: {
            headings: [],
            frontmatter: {},
            wordCount: 10,
            links: ['old.md'],
            backlinks: [],
            codeBlocks: [],
            tags: [],
          },
        },
        {
          path: 'unlinked-file.md',
          name: 'unlinked-file.md',
          extension: 'md',
          size: 50,
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          keywords: [],
          topics: [],
          contentMetadata: {
            headings: [],
            frontmatter: {},
            wordCount: 5,
            links: [],
            backlinks: [],
            codeBlocks: [],
            tags: [],
          },
        },
      ];

      const affected = findAffectedFiles(allFiles, movedFiles);

      expect(affected.size).toBe(1);
      expect(affected.has('linked-file.md')).toBe(true);
    });

    it('should find files with backlinks to moved files', () => {
      const movedFiles = new Map([['moved.md', 'destination.md']]);

      const allFiles: VaultFileInfo[] = [
        {
          path: 'backlinked.md',
          name: 'backlinked.md',
          extension: 'md',
          size: 100,
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          keywords: [],
          topics: [],
          contentMetadata: {
            headings: [],
            frontmatter: {},
            wordCount: 10,
            links: [],
            backlinks: ['moved.md'],
            codeBlocks: [],
            tags: [],
          },
        },
      ];

      const affected = findAffectedFiles(allFiles, movedFiles);

      expect(affected.size).toBe(1);
      expect(affected.has('backlinked.md')).toBe(true);
    });

    it('should return empty set when no files affected', () => {
      const movedFiles = new Map([['old.md', 'new.md']]);

      const allFiles: VaultFileInfo[] = [
        {
          path: 'independent.md',
          name: 'independent.md',
          extension: 'md',
          size: 50,
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          keywords: [],
          topics: [],
          contentMetadata: {
            headings: [],
            frontmatter: {},
            wordCount: 5,
            links: [],
            backlinks: [],
            codeBlocks: [],
            tags: [],
          },
        },
      ];

      const affected = findAffectedFiles(allFiles, movedFiles);

      expect(affected.size).toBe(0);
    });

    it('should handle files without content metadata', () => {
      const movedFiles = new Map([['old.md', 'new.md']]);

      const allFiles: VaultFileInfo[] = [
        {
          path: 'no-metadata.md',
          name: 'no-metadata.md',
          extension: 'md',
          size: 100,
          created: '2024-01-01T00:00:00Z',
          modified: '2024-01-01T00:00:00Z',
          keywords: [],
          topics: [],
        },
      ];

      const affected = findAffectedFiles(allFiles, movedFiles);

      expect(affected.size).toBe(0);
    });
  });

  describe('createBackup', () => {
    it('should create timestamped backup in .backups folder', async () => {
      const filePath = 'important/document.md';
      const content = '# Important Document\nDo not lose this!';

      mockClient.readNote.mockResolvedValue(content);
      mockClient.writeNote.mockResolvedValue(undefined);

      const backupPath = await createBackup(mockClient as unknown as ObsidianClient, filePath);

      expect(mockClient.readNote).toHaveBeenCalledWith(filePath);
      expect(backupPath).toMatch(/^\.backups\/important_document\.md_\d{4}-\d{2}-\d{2}T/);
      expect(mockClient.writeNote).toHaveBeenCalledWith(backupPath, content, 'create');
    });

    it('should throw VaultReorganizationError if read fails', async () => {
      mockClient.readNote.mockRejectedValue(new Error('File not found'));

      await expect(
        createBackup(mockClient as unknown as ObsidianClient, 'missing.md')
      ).rejects.toThrow(VaultReorganizationError);
    });

    it('should throw VaultReorganizationError if write fails', async () => {
      mockClient.readNote.mockResolvedValue('# Content');
      mockClient.writeNote.mockRejectedValue(new Error('Write failed'));

      await expect(
        createBackup(mockClient as unknown as ObsidianClient, 'file.md')
      ).rejects.toThrow(VaultReorganizationError);
    });
  });

  describe('executeReorganization', () => {
    it('should return dry run result without making changes', async () => {
      const plan: OrganizationPlan = {
        generatedAt: new Date().toISOString(),
        suggestions: [
          {
            type: 'rename',
            currentPath: 'old-name.md',
            suggestedName: 'new-name',
            reason: 'Better clarity',
            confidence: 0.9,
            impact: {
              affectedFiles: 2,
              linksToUpdate: 3,
              potentialBrokenLinks: [],
              complexity: 'low',
            },
          },
        ],
        estimatedImpact: {
          filesToMove: 0,
          filesToRename: 1,
          linksToUpdate: 3,
          filesRequiringLinkUpdates: 2,
          estimatedDuration: 1000,
          hasRiskyOperations: false,
        },
        warnings: [],
        summary: 'Rename 1 file',
        requiresManualReview: false,
      };

      const result = await executeReorganization(mockClient as unknown as ObsidianClient, plan, {
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.operations.length).toBe(1);
      expect(result.operations[0].status).toBe('pending');
      expect(mockClient.readNote).not.toHaveBeenCalled();
      expect(mockClient.writeNote).not.toHaveBeenCalled();
    });

    it('should execute plan and update links', async () => {
      const plan: OrganizationPlan = {
        generatedAt: new Date().toISOString(),
        suggestions: [
          {
            type: 'move',
            currentPath: 'file.md',
            suggestedPath: 'folder/file.md',
            reason: 'Better organization',
            confidence: 0.95,
            impact: {
              affectedFiles: 1,
              linksToUpdate: 1,
              potentialBrokenLinks: [],
              complexity: 'low',
            },
          },
        ],
        estimatedImpact: {
          filesToMove: 1,
          filesToRename: 0,
          linksToUpdate: 1,
          filesRequiringLinkUpdates: 1,
          estimatedDuration: 1000,
          hasRiskyOperations: false,
        },
        warnings: [],
        summary: 'Move 1 file',
        requiresManualReview: false,
      };

      mockClient.readNote.mockImplementation(async (path: string) => {
        if (path === 'file.md') return '# Content';
        if (path === 'other.md') return '[[file.md]]';
        return '';
      });
      mockClient.writeNote.mockResolvedValue(undefined);
      mockClient.deleteNote.mockResolvedValue(undefined);
      mockClient.listNotes.mockResolvedValue(['other.md']);

      const result = await executeReorganization(mockClient as unknown as ObsidianClient, plan, {
        updateLinks: true,
      });

      expect(result.success).toBe(true);
      expect(result.operations.length).toBe(1);
      expect(result.linksUpdated).toBeGreaterThan(0);
    });

    it('should skip low confidence operations when configured', async () => {
      const plan: OrganizationPlan = {
        generatedAt: new Date().toISOString(),
        suggestions: [
          {
            type: 'rename',
            currentPath: 'low-confidence.md',
            suggestedName: 'maybe-better',
            reason: 'Uncertain',
            confidence: 0.5,
            impact: {
              affectedFiles: 0,
              linksToUpdate: 0,
              potentialBrokenLinks: [],
              complexity: 'low',
            },
          },
        ],
        estimatedImpact: {
          filesToMove: 0,
          filesToRename: 1,
          linksToUpdate: 0,
          filesRequiringLinkUpdates: 0,
          estimatedDuration: 500,
          hasRiskyOperations: false,
        },
        warnings: [],
        summary: 'Rename 1 file',
        requiresManualReview: false,
      };

      const result = await executeReorganization(mockClient as unknown as ObsidianClient, plan, {
        skipLowConfidence: true,
        minExecutionConfidence: 0.8,
      });

      expect(result.operations.length).toBe(0);
      expect(mockClient.readNote).not.toHaveBeenCalled();
    });
  });
});
