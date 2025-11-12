# Vault Organizer

Intelligent vault organization system with content analysis and automated file reorganization capabilities.

## Overview

The Vault Organizer module provides tools for analyzing vault structure, understanding file content, and generating intelligent organization suggestions. It helps maintain clean, well-structured vaults with meaningful categorization and relationships between files.

## Modules

### vault-analyzer.ts

Core module for vault scanning and content analysis. Provides mechanical analysis without AI dependencies.

#### Key Functions

##### `analyzeVaultStructure()`

Analyzes the complete structure of a vault for a given project.

```typescript
import { analyzeVaultStructure } from './vault-organizer/vault-analyzer.js';

const vaultStructure = await analyzeVaultStructure(client, 'my-project', {
  includeContentAnalysis: true,
  excludePatterns: ['*.tmp', '.*'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  detectOrphans: true,
  extractKeywords: true,
});

console.log(`Total Files: ${vaultStructure.totalFiles}`);
console.log(`Total Size: ${vaultStructure.totalSize} bytes`);
console.log(`Categories:`, vaultStructure.categories);
console.log(`Orphan Files:`, vaultStructure.orphanFiles);
```

**Parameters:**

- `client`: ObsidianClient instance
- `projectFolder`: Project folder identifier
- `options`: Analysis options (optional)
  - `includeContentAnalysis`: Extract detailed content metadata (default: true)
  - `excludePatterns`: Glob patterns to exclude (default: [])
  - `maxFileSize`: Maximum file size to analyze in bytes (default: 10MB)
  - `detectOrphans`: Find files with no links (default: true)
  - `extractKeywords`: Extract keywords from content (default: true)

**Returns:** `VaultStructure` with complete analysis results

---

##### `analyzeFileContent()`

Analyzes the content of a single markdown file.

```typescript
import { analyzeFileContent } from './vault-organizer/vault-analyzer.js';

const metadata = await analyzeFileContent(client, 'projects/my-project/README.md');

console.log('Headings:', metadata.headings);
console.log('Word Count:', metadata.wordCount);
console.log('Links:', metadata.links);
console.log('Tags:', metadata.tags);
console.log('Code Blocks:', metadata.codeBlocks);
```

**Parameters:**

- `client`: ObsidianClient instance
- `filePath`: Full path to the file in the vault

**Returns:** `ContentMetadata` with extracted information

**Features:**

- Extracts all headings (H1-H6)
- Parses YAML frontmatter
- Finds internal links (both `[[wiki]]` and `[markdown](link.md)` styles)
- Extracts tags (inline `#tag` and frontmatter tags)
- Counts words (excluding frontmatter and code blocks)
- Identifies code block languages

---

##### `categorizeFile()`

Categorizes a file based on path, name, and content.

```typescript
import { categorizeFile } from './vault-organizer/vault-analyzer.js';

const category = categorizeFile(fileInfo);
// Returns: 'documentation' | 'meeting-notes' | 'project-plans' | 'reference' | 'journal' | 'uncategorized'
```

**Categories:**

- `documentation`: README files, docs folders, guides, tutorials
- `meeting-notes`: Meeting folders, date-pattern filenames (YYYY-MM-DD)
- `project-plans`: Planning folders, roadmaps, project files
- `reference`: Reference folders, links, bookmarks
- `journal`: Journal/daily/diary folders
- `uncategorized`: Files that don't match any category

**Heuristics:**

1. Checks frontmatter `type` field first
2. Analyzes file path patterns
3. Examines filename patterns
4. Reviews content structure (if available)

---

##### `extractKeywords()`

Extracts important keywords from content using frequency analysis.

```typescript
import { extractKeywords } from './vault-organizer/vault-analyzer.js';

const keywords = extractKeywords(fileContent);
console.log('Top Keywords:', keywords); // Array of top 20 keywords
```

**Features:**

- Removes frontmatter and code blocks
- Filters stop words (the, be, to, of, etc.)
- Filters short words (3 characters or fewer)
- Counts word frequency
- Returns top 20 most frequent keywords

---

##### `extractTopics()`

Infers topics from file information including headings, tags, and keywords.

```typescript
import { extractTopics } from './vault-organizer/vault-analyzer.js';

const topics = extractTopics(fileInfo);
console.log('Topics:', topics); // Array of up to 10 topics
```

**Sources:**

- All tags from content and frontmatter
- Top 5 keywords
- First 3 headings (cleaned and normalized)

**Limits:** Maximum of 10 topics per file

## Types

All types are defined in `types.ts`:

- `VaultStructure`: Complete vault analysis results
- `VaultFileInfo`: File metadata and content analysis
- `ContentMetadata`: Extracted content information
- `FolderStats`: Folder-level statistics
- `CategoryStats`: Category-level statistics
- `AnalysisOptions`: Configuration for analysis

## Error Handling

The module uses custom error classes for specific failure scenarios:

```typescript
import { VaultAnalysisError } from './vault-organizer/types.js';

try {
  const structure = await analyzeVaultStructure(client, projectFolder);
} catch (error) {
  if (error instanceof VaultAnalysisError) {
    console.error('Analysis failed:', error.message);
    console.error('Path:', error.path);
    console.error('Cause:', error.cause);
  }
}
```

## Performance Considerations

### Large Vaults

For vaults with many files:

1. **Use `excludePatterns`** to skip unnecessary files
2. **Set `maxFileSize`** to avoid analyzing large files
3. **Disable `includeContentAnalysis`** for quick scans
4. **Disable `extractKeywords`** to reduce processing time

```typescript
// Fast scan for large vaults
const quickScan = await analyzeVaultStructure(client, projectFolder, {
  includeContentAnalysis: false,
  excludePatterns: ['*.tmp', '*.log', 'node_modules/**'],
  maxFileSize: 1 * 1024 * 1024, // 1MB
  extractKeywords: false,
});
```

### Memory Usage

- Content analysis loads entire files into memory
- Large vaults may require significant memory
- Consider analyzing in batches for very large vaults

## Examples

See `examples/vault-analyzer-example.ts` for complete usage examples:

```bash
npm run dev examples/vault-analyzer-example.ts
```

## Testing

Unit tests are available in `tests/unit/vault-analyzer.test.ts`:

```bash
npm test tests/unit/vault-analyzer.test.ts
```

## Future Enhancements

The following features are planned for future releases:

### vault-ai.ts (Coming Soon)

- AI-powered content analysis
- Intelligent categorization suggestions
- Semantic similarity detection
- Content summarization

### vault-organizer.ts (Coming Soon)

- Generate organization plans
- Estimate reorganization impact
- Execute reorganization safely
- Update internal links automatically

### vault-link-updater.ts (Coming Soon)

- Track link relationships
- Update links after moves/renames
- Detect broken links
- Suggest link improvements

## Contributing

When contributing to the vault-organizer module:

1. Follow TypeScript strict mode guidelines
2. Add JSDoc comments for all public functions
3. Include unit tests for new features
4. Update this README with new functionality
5. Use descriptive variable and function names

## Architecture

```
vault-organizer/
├── types.ts              # Type definitions and error classes
├── vault-analyzer.ts     # Core analysis functions
├── vault-ai.ts          # AI-powered analysis (planned)
├── vault-organizer.ts   # Organization planning (planned)
├── vault-link-updater.ts # Link management (planned)
└── README.md            # This file
```

## Related Modules

- `obsidian/client.ts`: ObsidianClient for vault access
- `doc-delegator/`: Document organization and delegation
- `session/`: Session management and tracking
