import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { replaceSection, replaceSectionSchema } from '../../src/tools/replace-section.js';
import { ObsidianClient } from '../../src/obsidian/client.js';
import { sessionState } from '../../src/session-state.js';
import { config } from '../../src/config/index.js';

// Mock dependencies
vi.mock('../../src/obsidian/client.js');
vi.mock('../../src/session-state.js');
vi.mock('../../src/config/index.js');

describe('replace_section tool', () => {
  const mockReadNote = vi.fn();
  const mockWriteNote = vi.fn();
  const mockProjectContext = {
    projectFolder: 'test-project',
    basePath: '/vault/test-project',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mocks
    mockReadNote.mockClear();
    mockWriteNote.mockClear();

    // Mock sessionState
    vi.mocked(sessionState.getProjectContext).mockResolvedValue(mockProjectContext);

    // Mock ObsidianClient prototype methods (correct pattern)
    vi.mocked(ObsidianClient.prototype.readNote).mockImplementation(mockReadNote);
    vi.mocked(ObsidianClient.prototype.writeNote).mockImplementation(mockWriteNote);

    // Mock config
    vi.mocked(config).obsidianApiUrl = 'https://localhost:27124';
    vi.mocked(config).obsidianApiKey = 'test-key';
    vi.mocked(config).obsidianVault = 'test-vault';
    vi.mocked(config).nodeEnv = 'development';
    vi.mocked(config).projectBasePath = '/vault';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('schema validation', () => {
    it('should validate valid input', () => {
      const validInput = {
        path: 'README.md',
        heading: 'Installation',
        content: 'New installation instructions',
        mode: 'content-only' as const,
      };

      const result = replaceSectionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should require path, heading, and content', () => {
      const invalidInput = {
        path: 'README.md',
        heading: 'Installation',
      };

      const result = replaceSectionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should accept optional parameters', () => {
      const validInput = {
        path: 'README.md',
        heading: 'Installation',
        content: 'New content',
        mode: 'content-only' as const,
        level: 2,
        index: 0,
        preview: true,
        createIfMissing: true,
        project_folder: 'custom-project',
      };

      const result = replaceSectionSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should enforce level range 1-6', () => {
      const invalidInput = {
        path: 'README.md',
        heading: 'Test',
        content: 'Content',
        level: 7,
      };

      const result = replaceSectionSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe('content-only mode', () => {
    const testMarkdown = `# Main Title

## Installation

Old installation instructions here.

## Usage

Usage instructions here.`;

    it('should replace section content only, preserving heading', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      const result = await replaceSection({
        path: 'README.md',
        heading: 'Installation',
        content: 'New installation instructions',
        mode: 'content-only',
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.action).toBe('replace');
      expect(parsedResult.mode).toBe('content-only');
      expect(parsedResult.heading).toBe('Installation');

      // Verify writeNote was called
      expect(mockWriteNote).toHaveBeenCalledTimes(1);
      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## Installation');
      expect(writtenContent).toContain('New installation instructions');
      expect(writtenContent).not.toContain('Old installation instructions');
    });

    it('should preserve content before and after section', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Installation',
        content: 'New content',
        mode: 'content-only',
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('# Main Title');
      expect(writtenContent).toContain('## Usage');
      expect(writtenContent).toContain('Usage instructions here');
    });

    it('should handle nested headings correctly', async () => {
      const nestedMarkdown = `# Main Title

## Section A

Content A

### Subsection A1

Nested content

### Subsection A2

More nested content

## Section B

Content B`;

      mockReadNote.mockResolvedValue(nestedMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Section A',
        content: 'New Section A content',
        mode: 'content-only',
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## Section A');
      expect(writtenContent).toContain('New Section A content');
      expect(writtenContent).toContain('## Section B');
      expect(writtenContent).not.toContain('Subsection A1');
      expect(writtenContent).not.toContain('Subsection A2');
    });
  });

  describe('full mode', () => {
    const testMarkdown = `# Main Title

## Old Heading

Old content here.

## Another Section

Other content.`;

    it('should replace both heading and content', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Old Heading',
        content: '## New Heading\n\nNew content here.',
        mode: 'full',
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## New Heading');
      expect(writtenContent).toContain('New content here.');
      expect(writtenContent).not.toContain('## Old Heading');
      expect(writtenContent).not.toContain('Old content here.');
    });

    it('should preserve other sections', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Old Heading',
        content: '## Replacement\n\nReplaced.',
        mode: 'full',
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('# Main Title');
      expect(writtenContent).toContain('## Another Section');
      expect(writtenContent).toContain('Other content.');
    });
  });

  describe('heading-only mode', () => {
    const testMarkdown = `# Main Title

## Old Heading

Important content to preserve.

## Another Section`;

    it('should replace only heading text, preserving content', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Old Heading',
        content: '## New Heading',
        mode: 'heading-only',
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## New Heading');
      expect(writtenContent).toContain('Important content to preserve.');
      expect(writtenContent).not.toContain('## Old Heading');
    });
  });

  describe('duplicate heading handling', () => {
    const duplicateMarkdown = `# Main

## Installation

First installation section.

## Usage

Usage section.

## Installation

Second installation section.`;

    it('should detect ambiguous headings and return error', async () => {
      mockReadNote.mockResolvedValue(duplicateMarkdown);

      const result = await replaceSection({
        path: 'README.md',
        heading: 'Installation',
        content: 'New content',
        mode: 'content-only',
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.success).toBe(false);
      expect(parsedResult.error).toBe('Ambiguous heading');
      expect(parsedResult.matches).toBe(2);
      expect(mockWriteNote).not.toHaveBeenCalled();
    });

    it('should replace correct occurrence with index parameter', async () => {
      mockReadNote.mockResolvedValue(duplicateMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      // Replace second occurrence (index 1)
      await replaceSection({
        path: 'README.md',
        heading: 'Installation',
        content: 'Updated second installation',
        mode: 'content-only',
        index: 1,
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('First installation section');
      expect(writtenContent).toContain('Updated second installation');
      expect(writtenContent).not.toContain('Second installation section');
    });

    it('should use level to disambiguate', async () => {
      const levelMarkdown = `# Main

## Installation

H2 installation.

### Installation

H3 installation.`;

      mockReadNote.mockResolvedValue(levelMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Installation',
        content: 'Updated H2',
        mode: 'content-only',
        level: 2,
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## Installation');
      expect(writtenContent).toContain('Updated H2');
      expect(writtenContent).toContain('### Installation');
      expect(writtenContent).toContain('H3 installation');
    });
  });

  describe('section not found', () => {
    const testMarkdown = `# Main Title

## Existing Section

Content here.`;

    it('should return error when section not found', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);

      const result = await replaceSection({
        path: 'README.md',
        heading: 'Non-existent Section',
        content: 'New content',
        mode: 'content-only',
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.success).toBe(false);
      expect(parsedResult.error).toBe('Section not found');
      expect(mockWriteNote).not.toHaveBeenCalled();
    });

    it('should create section when createIfMissing is true', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      const result = await replaceSection({
        path: 'README.md',
        heading: 'New Section',
        content: 'New section content',
        mode: 'content-only',
        createIfMissing: true,
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.action).toBe('create');

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## New Section');
      expect(writtenContent).toContain('New section content');
    });

    it('should create section with specified level', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'New Section',
        content: 'Content',
        mode: 'content-only',
        createIfMissing: true,
        level: 3,
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('### New Section');
    });

    it('should not create section in full/heading-only mode', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);

      const result = await replaceSection({
        path: 'README.md',
        heading: 'New Section',
        content: 'Content',
        mode: 'full',
        createIfMissing: true,
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.success).toBe(false);
      expect(parsedResult.error).toBe('Section not found');
      expect(mockWriteNote).not.toHaveBeenCalled();
    });
  });

  describe('preview mode', () => {
    const testMarkdown = `# Main

## Section A

Old content.

## Section B

Other content.`;

    it('should return preview without writing', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);

      const result = await replaceSection({
        path: 'README.md',
        heading: 'Section A',
        content: 'New content',
        mode: 'content-only',
        preview: true,
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.preview).toBe(true);
      expect(parsedResult.before).toBeDefined();
      expect(parsedResult.after).toBeDefined();
      expect(mockWriteNote).not.toHaveBeenCalled();
    });

    it('should preview section creation', async () => {
      mockReadNote.mockResolvedValue(testMarkdown);

      const result = await replaceSection({
        path: 'README.md',
        heading: 'New Section',
        content: 'New content',
        mode: 'content-only',
        createIfMissing: true,
        preview: true,
      });

      const parsedResult = JSON.parse(result);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.preview).toBe(true);
      expect(parsedResult.action).toBe('create');
      expect(mockWriteNote).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', async () => {
      const testMarkdown = `# Main

## Section

Old content.`;

      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Section',
        content: '',
        mode: 'content-only',
      });

      expect(mockWriteNote).toHaveBeenCalledTimes(1);
      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## Section');
      expect(writtenContent).not.toContain('Old content');
    });

    it('should handle content before first heading (preamble)', async () => {
      const testMarkdown = `This is preamble content.

It should be preserved.

## First Section

Section content.`;

      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'First Section',
        content: 'New content',
        mode: 'content-only',
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('This is preamble content.');
      expect(writtenContent).toContain('It should be preserved.');
    });

    it('should handle heading at end of file', async () => {
      const testMarkdown = `# Main

## Last Section`;

      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Last Section',
        content: 'New content for last section',
        mode: 'content-only',
      });

      const writtenContent = mockWriteNote.mock.calls[0][1];
      expect(writtenContent).toContain('## Last Section');
      expect(writtenContent).toContain('New content for last section');
    });

    it('should handle special characters in headings', async () => {
      const testMarkdown = `# Main

## Installation & Setup

Old content.`;

      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'Installation & Setup',
        content: 'New content',
        mode: 'content-only',
      });

      expect(mockWriteNote).toHaveBeenCalledTimes(1);
    });

    it('should be case-insensitive when matching headings', async () => {
      const testMarkdown = `# Main

## Installation

Content.`;

      mockReadNote.mockResolvedValue(testMarkdown);
      mockWriteNote.mockResolvedValue(undefined);

      await replaceSection({
        path: 'README.md',
        heading: 'installation', // lowercase
        content: 'New content',
        mode: 'content-only',
      });

      expect(mockWriteNote).toHaveBeenCalledTimes(1);
    });
  });
});
