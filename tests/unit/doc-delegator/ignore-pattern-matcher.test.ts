/**
 * Tests for IgnorePatternMatcher
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IgnorePatternMatcher } from '../../../src/doc-delegator/ignore-pattern-matcher';

describe('IgnorePatternMatcher', () => {
  describe('Constructor', () => {
    it('should create instance with no patterns', () => {
      const matcher = new IgnorePatternMatcher();
      expect(matcher.hasPatterns()).toBe(false);
      expect(matcher.getPatternCount()).toBe(0);
    });

    it('should create instance with patterns', () => {
      const matcher = new IgnorePatternMatcher(['*.md', '!README.md']);
      expect(matcher.hasPatterns()).toBe(true);
      expect(matcher.getPatternCount()).toBe(2);
    });

    it('should parse patterns in constructor', () => {
      const matcher = new IgnorePatternMatcher(['*.md', '!README.md']);
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toContain('*.md');
      expect(patterns.include).toContain('README.md');
    });
  });

  describe('parsePatterns', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should parse simple patterns', () => {
      matcher.parsePatterns('*.md\n*.txt');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md', '*.txt']);
      expect(patterns.include).toEqual([]);
    });

    it('should skip blank lines', () => {
      matcher.parsePatterns('*.md\n\n*.txt\n\n\n');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md', '*.txt']);
    });

    it('should skip comments', () => {
      matcher.parsePatterns('# Comment\n*.md\n# Another comment\n*.txt');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md', '*.txt']);
    });

    it('should handle negation patterns', () => {
      matcher.parsePatterns('*.md\n!README.md\n!CHANGELOG.md');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md']);
      expect(patterns.include).toEqual(['README.md', 'CHANGELOG.md']);
    });

    it('should trim whitespace', () => {
      matcher.parsePatterns('  *.md  \n  *.txt  ');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md', '*.txt']);
    });

    it('should handle root-only patterns', () => {
      matcher.parsePatterns('/README.md\n/docs/');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['/README.md', '/docs/']);
    });

    it('should handle directory patterns', () => {
      matcher.parsePatterns('docs/\nnode_modules/');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['docs/', 'node_modules/']);
    });

    it('should handle mixed content', () => {
      const content = `
# This is a comment
*.md
!README.md

# Another section
docs/
/LICENSE
`;
      matcher.parsePatterns(content);
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md', 'docs/', '/LICENSE']);
      expect(patterns.include).toEqual(['README.md']);
    });

    it('should handle Windows line endings (CRLF)', () => {
      matcher.parsePatterns('*.md\r\n*.txt\r\n!README.md');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md', '*.txt']);
      expect(patterns.include).toEqual(['README.md']);
    });
  });

  describe('isIgnored - Basic Patterns', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should return false when no patterns are loaded', () => {
      expect(matcher.isIgnored('README.md')).toBe(false);
      expect(matcher.isIgnored('docs/guide.md')).toBe(false);
    });

    it('should return false for empty path', () => {
      matcher.parsePatterns('*.md');
      expect(matcher.isIgnored('')).toBe(false);
    });

    it('should match simple wildcard patterns', () => {
      matcher.parsePatterns('*.md');
      expect(matcher.isIgnored('README.md')).toBe(true);
      expect(matcher.isIgnored('CHANGELOG.md')).toBe(true);
      expect(matcher.isIgnored('package.json')).toBe(false);
    });

    it('should match extension patterns', () => {
      matcher.parsePatterns('*.txt\n*.log');
      expect(matcher.isIgnored('notes.txt')).toBe(true);
      expect(matcher.isIgnored('error.log')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
    });

    it('should match exact file names', () => {
      matcher.parsePatterns('README.md\nLICENSE');
      expect(matcher.isIgnored('README.md')).toBe(true);
      expect(matcher.isIgnored('LICENSE')).toBe(true);
      expect(matcher.isIgnored('CHANGELOG.md')).toBe(false);
    });
  });

  describe('isIgnored - Glob Patterns', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should match double-star patterns (**)', () => {
      matcher.parsePatterns('**/test/**');
      expect(matcher.isIgnored('test/file.md')).toBe(true);
      expect(matcher.isIgnored('src/test/file.md')).toBe(true);
      expect(matcher.isIgnored('src/test/unit/file.md')).toBe(true);
      expect(matcher.isIgnored('src/file.md')).toBe(false);
    });

    it('should match question mark patterns (?)', () => {
      matcher.parsePatterns('file?.md');
      expect(matcher.isIgnored('file1.md')).toBe(true);
      expect(matcher.isIgnored('fileA.md')).toBe(true);
      expect(matcher.isIgnored('file.md')).toBe(false);
      expect(matcher.isIgnored('file12.md')).toBe(false);
    });

    it('should match character class patterns ([abc])', () => {
      matcher.parsePatterns('file[123].md');
      expect(matcher.isIgnored('file1.md')).toBe(true);
      expect(matcher.isIgnored('file2.md')).toBe(true);
      expect(matcher.isIgnored('file3.md')).toBe(true);
      expect(matcher.isIgnored('file4.md')).toBe(false);
      expect(matcher.isIgnored('fileA.md')).toBe(false);
    });

    it('should match range patterns ([a-z])', () => {
      matcher.parsePatterns('file[0-9].md');
      expect(matcher.isIgnored('file0.md')).toBe(true);
      expect(matcher.isIgnored('file5.md')).toBe(true);
      expect(matcher.isIgnored('file9.md')).toBe(true);
      expect(matcher.isIgnored('fileA.md')).toBe(false);
    });

    it('should match complex glob patterns', () => {
      matcher.parsePatterns('src/**/*.test.ts');
      expect(matcher.isIgnored('src/file.test.ts')).toBe(true);
      expect(matcher.isIgnored('src/utils/helper.test.ts')).toBe(true);
      expect(matcher.isIgnored('src/utils/deep/nested/file.test.ts')).toBe(true);
      expect(matcher.isIgnored('src/file.ts')).toBe(false);
      expect(matcher.isIgnored('test/file.test.ts')).toBe(false);
    });
  });

  describe('isIgnored - Root-Only Patterns', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should match files only at root level', () => {
      matcher.parsePatterns('/README.md');
      expect(matcher.isIgnored('README.md')).toBe(true);
      expect(matcher.isIgnored('docs/README.md')).toBe(false);
    });

    it('should match directories only at root level', () => {
      matcher.parsePatterns('/docs/');
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('docs/api/reference.md')).toBe(true);
      expect(matcher.isIgnored('src/docs/guide.md')).toBe(false);
    });

    it('should support multiple root patterns', () => {
      matcher.parsePatterns('/LICENSE\n/README.md\n/CHANGELOG.md');
      expect(matcher.isIgnored('LICENSE')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(true);
      expect(matcher.isIgnored('CHANGELOG.md')).toBe(true);
      expect(matcher.isIgnored('docs/LICENSE')).toBe(false);
    });
  });

  describe('isIgnored - Directory Patterns', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should match directories and their contents', () => {
      matcher.parsePatterns('node_modules/');
      expect(matcher.isIgnored('node_modules/package/index.js')).toBe(true);
      expect(matcher.isIgnored('node_modules/package/deep/file.js')).toBe(true);
      expect(matcher.isIgnored('src/node_modules/package/file.js')).toBe(true);
    });

    it('should match multiple directory patterns', () => {
      matcher.parsePatterns('docs/\ntest/\nbuild/');
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('test/unit.test.js')).toBe(true);
      expect(matcher.isIgnored('build/output.js')).toBe(true);
      expect(matcher.isIgnored('src/index.js')).toBe(false);
    });

    it('should match nested directory patterns', () => {
      matcher.parsePatterns('src/test/');
      expect(matcher.isIgnored('src/test/file.ts')).toBe(true);
      expect(matcher.isIgnored('src/test/unit/file.ts')).toBe(true);
      expect(matcher.isIgnored('src/file.ts')).toBe(false);
    });
  });

  describe('isIgnored - Negation Patterns', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should override ignore patterns with negation', () => {
      matcher.parsePatterns('*.md\n!README.md');
      expect(matcher.isIgnored('CHANGELOG.md')).toBe(true);
      expect(matcher.isIgnored('guide.md')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
    });

    it('should support multiple negation patterns', () => {
      matcher.parsePatterns('*.md\n!README.md\n!CHANGELOG.md\n!LICENSE.md');
      expect(matcher.isIgnored('guide.md')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
      expect(matcher.isIgnored('CHANGELOG.md')).toBe(false);
      expect(matcher.isIgnored('LICENSE.md')).toBe(false);
    });

    it('should support negation with directory patterns', () => {
      matcher.parsePatterns('docs/\n!docs/important.md');
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('docs/api/reference.md')).toBe(true);
      expect(matcher.isIgnored('docs/important.md')).toBe(false);
    });

    it('should support negation with glob patterns', () => {
      matcher.parsePatterns('docs/**/*.md\n!docs/**/important.md');
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('docs/api/reference.md')).toBe(true);
      expect(matcher.isIgnored('docs/important.md')).toBe(false);
      expect(matcher.isIgnored('docs/api/important.md')).toBe(false);
    });
  });

  describe('isIgnored - Path Normalization', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md\ndocs/');
    });

    it('should handle Unix-style paths', () => {
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(true);
    });

    it('should handle Windows-style paths', () => {
      expect(matcher.isIgnored('docs\\guide.md')).toBe(true);
      expect(matcher.isIgnored('src\\docs\\guide.md')).toBe(true);
    });

    it('should handle paths with leading ./', () => {
      expect(matcher.isIgnored('./README.md')).toBe(true);
      expect(matcher.isIgnored('./docs/guide.md')).toBe(true);
    });

    it('should handle paths with leading /', () => {
      expect(matcher.isIgnored('/README.md')).toBe(true);
      expect(matcher.isIgnored('/docs/guide.md')).toBe(true);
    });

    it('should handle mixed path separators', () => {
      expect(matcher.isIgnored('docs/api\\guide.md')).toBe(true);
      expect(matcher.isIgnored('src\\docs/guide.md')).toBe(true);
    });
  });

  describe('isIgnored - Edge Cases', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should handle dotfiles', () => {
      matcher.parsePatterns('.*');
      expect(matcher.isIgnored('.gitignore')).toBe(true);
      expect(matcher.isIgnored('.env')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
    });

    it('should handle specific dotfiles', () => {
      matcher.parsePatterns('.env\n.gitignore');
      expect(matcher.isIgnored('.env')).toBe(true);
      expect(matcher.isIgnored('.gitignore')).toBe(true);
      expect(matcher.isIgnored('.eslintrc')).toBe(false);
    });

    it('should be case-sensitive by default', () => {
      matcher.parsePatterns('README.md');
      expect(matcher.isIgnored('README.md')).toBe(true);
      expect(matcher.isIgnored('readme.md')).toBe(false);
      expect(matcher.isIgnored('ReadMe.md')).toBe(false);
    });

    it('should handle very long paths', () => {
      matcher.parsePatterns('**/*.md');
      const longPath = 'a/'.repeat(100) + 'file.md';
      expect(matcher.isIgnored(longPath)).toBe(true);
    });

    it('should handle special characters in patterns', () => {
      matcher.parsePatterns('file-*.md');
      expect(matcher.isIgnored('file-1.md')).toBe(true);
      expect(matcher.isIgnored('file-test.md')).toBe(true);
      expect(matcher.isIgnored('file.md')).toBe(false);
    });
  });

  describe('addPattern', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
    });

    it('should add ignore pattern', () => {
      matcher.addPattern('*.md');
      expect(matcher.isIgnored('README.md')).toBe(true);
    });

    it('should add negation pattern', () => {
      matcher.parsePatterns('*.md');
      matcher.addPattern('!README.md');
      expect(matcher.isIgnored('guide.md')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
    });

    it('should not add duplicate patterns', () => {
      matcher.addPattern('*.md');
      matcher.addPattern('*.md');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore.filter((p) => p === '*.md').length).toBe(1);
    });

    it('should skip blank patterns', () => {
      matcher.addPattern('');
      matcher.addPattern('   ');
      expect(matcher.getPatternCount()).toBe(0);
    });

    it('should skip comment patterns', () => {
      matcher.addPattern('# comment');
      expect(matcher.getPatternCount()).toBe(0);
    });

    it('should trim whitespace', () => {
      matcher.addPattern('  *.md  ');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toContain('*.md');
    });
  });

  describe('removePattern', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md\n*.txt\n!README.md');
    });

    it('should remove ignore pattern', () => {
      const removed = matcher.removePattern('*.txt');
      expect(removed).toBe(true);
      expect(matcher.isIgnored('file.txt')).toBe(false);
      expect(matcher.isIgnored('file.md')).toBe(true);
    });

    it('should remove negation pattern', () => {
      const removed = matcher.removePattern('!README.md');
      expect(removed).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(true);
    });

    it('should return false for non-existent pattern', () => {
      const removed = matcher.removePattern('*.js');
      expect(removed).toBe(false);
    });

    it('should update matching after removal', () => {
      matcher.removePattern('*.md');
      expect(matcher.isIgnored('guide.md')).toBe(false);
    });
  });

  describe('clear', () => {
    let matcher: IgnorePatternMatcher;

    beforeEach(() => {
      matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md\n*.txt\n!README.md');
    });

    it('should clear all patterns', () => {
      matcher.clear();
      expect(matcher.hasPatterns()).toBe(false);
      expect(matcher.getPatternCount()).toBe(0);
    });

    it('should stop matching after clear', () => {
      matcher.clear();
      expect(matcher.isIgnored('file.md')).toBe(false);
      expect(matcher.isIgnored('file.txt')).toBe(false);
    });

    it('should allow adding patterns after clear', () => {
      matcher.clear();
      matcher.addPattern('*.js');
      expect(matcher.isIgnored('file.js')).toBe(true);
    });
  });

  describe('getPatterns', () => {
    it('should return empty arrays when no patterns', () => {
      const matcher = new IgnorePatternMatcher();
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual([]);
      expect(patterns.include).toEqual([]);
    });

    it('should return current patterns', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md\n*.txt\n!README.md');
      const patterns = matcher.getPatterns();
      expect(patterns.ignore).toEqual(['*.md', '*.txt']);
      expect(patterns.include).toEqual(['README.md']);
    });

    it('should return copy of patterns (not reference)', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md');
      const patterns1 = matcher.getPatterns();
      const patterns2 = matcher.getPatterns();
      expect(patterns1).not.toBe(patterns2);
      expect(patterns1.ignore).not.toBe(patterns2.ignore);
    });
  });

  describe('hasPatterns', () => {
    it('should return false when no patterns', () => {
      const matcher = new IgnorePatternMatcher();
      expect(matcher.hasPatterns()).toBe(false);
    });

    it('should return true when ignore patterns exist', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md');
      expect(matcher.hasPatterns()).toBe(true);
    });

    it('should return true when negation patterns exist', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('!README.md');
      expect(matcher.hasPatterns()).toBe(true);
    });

    it('should return false after clear', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md');
      matcher.clear();
      expect(matcher.hasPatterns()).toBe(false);
    });
  });

  describe('getPatternCount', () => {
    it('should return 0 when no patterns', () => {
      const matcher = new IgnorePatternMatcher();
      expect(matcher.getPatternCount()).toBe(0);
    });

    it('should count ignore patterns', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md\n*.txt');
      expect(matcher.getPatternCount()).toBe(2);
    });

    it('should count negation patterns', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('!README.md\n!CHANGELOG.md');
      expect(matcher.getPatternCount()).toBe(2);
    });

    it('should count both pattern types', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns('*.md\n*.txt\n!README.md\n!CHANGELOG.md');
      expect(matcher.getPatternCount()).toBe(4);
    });
  });

  describe('Performance', () => {
    it('should handle 1000 pattern checks efficiently', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns(`
*.md
*.txt
docs/
test/
!README.md
!CHANGELOG.md
**/node_modules/**
**/*.test.ts
      `);

      const files: string[] = [];
      for (let i = 0; i < 1000; i++) {
        files.push(`file${i}.md`);
      }

      const start = Date.now();
      for (const file of files) {
        matcher.isIgnored(file);
      }
      const duration = Date.now() - start;

      // Should complete in less than 150ms (CI environments may be slower)
      expect(duration).toBeLessThan(150);
    });

    it('should handle many patterns efficiently', () => {
      const patterns: string[] = [];
      for (let i = 0; i < 100; i++) {
        patterns.push(`pattern${i}/*.md`);
      }

      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns(patterns.join('\n'));

      const start = Date.now();
      for (let i = 0; i < 100; i++) {
        matcher.isIgnored(`pattern${i}/file.md`);
      }
      const duration = Date.now() - start;

      // Should complete in less than 150ms (CI environments may be slower)
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle typical .gitignore-style patterns', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns(`
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.test.ts
!important.test.ts

# Build
dist/
build/
*.tsbuildinfo

# Misc
.DS_Store
*.log
.env.local
.env.development.local
      `);

      expect(matcher.isIgnored('node_modules/package/index.js')).toBe(true);
      expect(matcher.isIgnored('coverage/index.html')).toBe(true);
      expect(matcher.isIgnored('file.test.ts')).toBe(true);
      expect(matcher.isIgnored('important.test.ts')).toBe(false);
      expect(matcher.isIgnored('dist/bundle.js')).toBe(true);
      expect(matcher.isIgnored('.DS_Store')).toBe(true);
      expect(matcher.isIgnored('error.log')).toBe(true);
      expect(matcher.isIgnored('.env.local')).toBe(true);
    });

    it('should handle documentation-specific patterns', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns(`
# Ignore all markdown
*.md

# But keep important docs
!README.md
!CHANGELOG.md
!CONTRIBUTING.md

# Ignore generated docs
docs/api/

# But keep manually written guides
!docs/guides/
      `);

      expect(matcher.isIgnored('guide.md')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
      expect(matcher.isIgnored('CHANGELOG.md')).toBe(false);
      expect(matcher.isIgnored('CONTRIBUTING.md')).toBe(false);
      expect(matcher.isIgnored('docs/api/reference.md')).toBe(true);
    });
  });
});
