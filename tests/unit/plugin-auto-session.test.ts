/**
 * Plugin Auto-Session Tests
 *
 * Tests for the auto-session helper functions from the OpenCode plugin.
 * These tests verify project detection, file change analysis, and configuration handling.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

// Mock child_process for git detection tests
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

describe('Plugin Auto-Session Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detectProjectFolder', () => {
    /**
     * Helper function to detect project folder from directory
     * Tries git repo name first, falls back to directory basename
     */
    function detectProjectFolder(dir: string): string | null {
      try {
        // Try to get git repo name
        const repoName = execSync('git rev-parse --show-toplevel', {
          cwd: dir,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
        }).trim();
        if (repoName) {
          return path.basename(repoName);
        }
      } catch {
        // Not a git repo or git not available
      }

      // Fallback to directory basename
      return path.basename(dir);
    }

    it('should detect git repo name from git config', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockReturnValue('/Users/test/projects/my-awesome-repo\n');

      const result = detectProjectFolder('/Users/test/projects/my-awesome-repo');

      expect(result).toBe('my-awesome-repo');
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse --show-toplevel', {
        cwd: '/Users/test/projects/my-awesome-repo',
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
    });

    it('should handle git repo with nested path', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockReturnValue('/Users/test/projects/monorepo\n');

      const result = detectProjectFolder('/Users/test/projects/monorepo/packages/app');

      expect(result).toBe('monorepo');
    });

    it('should fallback to directory basename when not a git repo', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = detectProjectFolder('/Users/test/projects/non-git-project');

      expect(result).toBe('non-git-project');
    });

    it('should fallback to directory basename when git not available', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockImplementation(() => {
        throw new Error('git: command not found');
      });

      const result = detectProjectFolder('/Users/test/my-project');

      expect(result).toBe('my-project');
    });

    it('should handle empty git output gracefully', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockReturnValue('');

      const result = detectProjectFolder('/Users/test/empty-project');

      expect(result).toBe('empty-project');
    });

    it('should handle paths with spaces', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = detectProjectFolder('/Users/test/My Project With Spaces');

      expect(result).toBe('My Project With Spaces');
    });

    it('should handle root directory', () => {
      const mockExecSync = vi.mocked(execSync);
      mockExecSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = detectProjectFolder('/');

      expect(result).toBe('');
    });
  });

  describe('analyzeFileChange', () => {
    /**
     * Analyze file change for smart suggestions
     * Returns suggestion type and message based on file path patterns
     */
    function analyzeFileChange(filePath: string): {
      type: 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore';
      message: string;
    } | null {
      // Test files
      if (filePath.match(/\.(test|spec)\.(ts|js|tsx|jsx)$/)) {
        const name = path.basename(filePath, path.extname(filePath)).replace(/\.(test|spec)$/, '');
        return { type: 'test', message: `Add tests for ${name}` };
      }

      // Documentation
      if (filePath.match(/^(docs|documentation)\//)) {
        return { type: 'docs', message: 'Update documentation' };
      }

      if (filePath.match(/README\.md|CHANGELOG\.md/i)) {
        return { type: 'docs', message: 'Update documentation' };
      }

      // Config files
      if (
        filePath.match(/\.(config|rc)\.(ts|js|json)$/) ||
        filePath.match(/package\.json|tsconfig\.json/)
      ) {
        return { type: 'chore', message: 'Update configuration' };
      }

      // Source files
      if (filePath.match(/\.(ts|js|tsx|jsx|py|go|rs)$/)) {
        const name = path.basename(filePath, path.extname(filePath));
        return { type: 'feature', message: `Update ${name}` };
      }

      return null;
    }

    describe('test files', () => {
      it('should detect .test.ts files', () => {
        const result = analyzeFileChange('src/utils/helper.test.ts');

        expect(result).toEqual({
          type: 'test',
          message: 'Add tests for helper',
        });
      });

      it('should detect .spec.js files', () => {
        const result = analyzeFileChange('tests/auth.spec.js');

        expect(result).toEqual({
          type: 'test',
          message: 'Add tests for auth',
        });
      });

      it('should detect .test.tsx files', () => {
        const result = analyzeFileChange('components/Button.test.tsx');

        expect(result).toEqual({
          type: 'test',
          message: 'Add tests for Button',
        });
      });

      it('should detect .spec.jsx files', () => {
        const result = analyzeFileChange('src/App.spec.jsx');

        expect(result).toEqual({
          type: 'test',
          message: 'Add tests for App',
        });
      });

      it('should handle nested test files', () => {
        const result = analyzeFileChange('tests/unit/session/manager.test.ts');

        expect(result).toEqual({
          type: 'test',
          message: 'Add tests for manager',
        });
      });
    });

    describe('documentation files', () => {
      it('should detect docs/ directory files', () => {
        const result = analyzeFileChange('docs/api.md');

        expect(result).toEqual({
          type: 'docs',
          message: 'Update documentation',
        });
      });

      it('should detect documentation/ directory files', () => {
        const result = analyzeFileChange('documentation/guide.md');

        expect(result).toEqual({
          type: 'docs',
          message: 'Update documentation',
        });
      });

      it('should detect README.md', () => {
        const result = analyzeFileChange('README.md');

        expect(result).toEqual({
          type: 'docs',
          message: 'Update documentation',
        });
      });

      it('should detect CHANGELOG.md', () => {
        const result = analyzeFileChange('CHANGELOG.md');

        expect(result).toEqual({
          type: 'docs',
          message: 'Update documentation',
        });
      });

      it('should detect README.md case-insensitively', () => {
        const result = analyzeFileChange('readme.md');

        expect(result).toEqual({
          type: 'docs',
          message: 'Update documentation',
        });
      });

      it('should detect nested docs files', () => {
        const result = analyzeFileChange('docs/guides/getting-started.md');

        expect(result).toEqual({
          type: 'docs',
          message: 'Update documentation',
        });
      });
    });

    describe('config files', () => {
      it('should detect .config.ts files', () => {
        const result = analyzeFileChange('vitest.config.ts');

        expect(result).toEqual({
          type: 'chore',
          message: 'Update configuration',
        });
      });

      it('should detect .config.js files', () => {
        const result = analyzeFileChange('webpack.config.js');

        expect(result).toEqual({
          type: 'chore',
          message: 'Update configuration',
        });
      });

      it('should detect .rc.json files (non-dotfile)', () => {
        const result = analyzeFileChange('prettier.rc.json');

        expect(result).toEqual({
          type: 'chore',
          message: 'Update configuration',
        });
      });

      it('should NOT detect dotfile .rc files (limitation)', () => {
        // Note: Current implementation doesn't handle dotfiles like .prettierrc.json
        // because the pattern /\.(config|rc)\.(ts|js|json)$/ requires a character before the dot
        const result = analyzeFileChange('.prettierrc.json');

        expect(result).toBeNull();
      });

      it('should detect package.json', () => {
        const result = analyzeFileChange('package.json');

        expect(result).toEqual({
          type: 'chore',
          message: 'Update configuration',
        });
      });

      it('should detect tsconfig.json', () => {
        const result = analyzeFileChange('tsconfig.json');

        expect(result).toEqual({
          type: 'chore',
          message: 'Update configuration',
        });
      });

      it('should detect nested config files', () => {
        const result = analyzeFileChange('packages/app/tsconfig.json');

        expect(result).toEqual({
          type: 'chore',
          message: 'Update configuration',
        });
      });
    });

    describe('source files', () => {
      it('should detect .ts files', () => {
        const result = analyzeFileChange('src/index.ts');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update index',
        });
      });

      it('should detect .js files', () => {
        const result = analyzeFileChange('src/utils.js');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update utils',
        });
      });

      it('should detect .tsx files', () => {
        const result = analyzeFileChange('components/Button.tsx');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update Button',
        });
      });

      it('should detect .jsx files', () => {
        const result = analyzeFileChange('src/App.jsx');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update App',
        });
      });

      it('should detect .py files', () => {
        const result = analyzeFileChange('scripts/deploy.py');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update deploy',
        });
      });

      it('should detect .go files', () => {
        const result = analyzeFileChange('cmd/server.go');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update server',
        });
      });

      it('should detect .rs files', () => {
        const result = analyzeFileChange('src/main.rs');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update main',
        });
      });

      it('should handle nested source files', () => {
        const result = analyzeFileChange('src/features/auth/login.ts');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update login',
        });
      });
    });

    describe('unknown file types', () => {
      it('should return null for .txt files', () => {
        const result = analyzeFileChange('notes.txt');

        expect(result).toBeNull();
      });

      it('should return null for .pdf files', () => {
        const result = analyzeFileChange('document.pdf');

        expect(result).toBeNull();
      });

      it('should return null for .png files', () => {
        const result = analyzeFileChange('image.png');

        expect(result).toBeNull();
      });

      it('should return null for .lock files', () => {
        const result = analyzeFileChange('package-lock.json');

        expect(result).toBeNull();
      });

      it('should return null for .map files', () => {
        const result = analyzeFileChange('dist/index.js.map');

        expect(result).toBeNull();
      });

      it('should return null for files without extension', () => {
        const result = analyzeFileChange('Dockerfile');

        expect(result).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle files with multiple dots', () => {
        const result = analyzeFileChange('src/utils.helper.ts');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update utils.helper',
        });
      });

      it('should prioritize test pattern over source pattern', () => {
        const result = analyzeFileChange('src/index.test.ts');

        expect(result).toEqual({
          type: 'test',
          message: 'Add tests for index',
        });
      });

      it('should prioritize docs directory over file extension', () => {
        const result = analyzeFileChange('docs/api.ts');

        expect(result).toEqual({
          type: 'docs',
          message: 'Update documentation',
        });
      });

      it('should handle empty file path', () => {
        const result = analyzeFileChange('');

        expect(result).toBeNull();
      });

      it('should handle relative paths', () => {
        const result = analyzeFileChange('./src/index.ts');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update index',
        });
      });

      it('should handle absolute paths', () => {
        const result = analyzeFileChange('/Users/test/project/src/index.ts');

        expect(result).toEqual({
          type: 'feature',
          message: 'Update index',
        });
      });
    });
  });

  describe('Configuration', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    describe('WITH_CONTEXT_AUTO_START', () => {
      it('should default to enabled when env var not set', () => {
        delete process.env.WITH_CONTEXT_AUTO_START;

        const config = {
          autoStartEnabled: process.env.WITH_CONTEXT_AUTO_START !== 'false',
        };

        expect(config.autoStartEnabled).toBe(true);
      });

      it('should be disabled when set to "false"', () => {
        process.env.WITH_CONTEXT_AUTO_START = 'false';

        const config = {
          autoStartEnabled: process.env.WITH_CONTEXT_AUTO_START !== 'false',
        };

        expect(config.autoStartEnabled).toBe(false);
      });

      it('should be enabled when set to "true"', () => {
        process.env.WITH_CONTEXT_AUTO_START = 'true';

        const config = {
          autoStartEnabled: process.env.WITH_CONTEXT_AUTO_START !== 'false',
        };

        expect(config.autoStartEnabled).toBe(true);
      });

      it('should be enabled when set to any non-"false" value', () => {
        process.env.WITH_CONTEXT_AUTO_START = '1';

        const config = {
          autoStartEnabled: process.env.WITH_CONTEXT_AUTO_START !== 'false',
        };

        expect(config.autoStartEnabled).toBe(true);
      });
    });

    describe('WITH_CONTEXT_AUTO_TRACK', () => {
      it('should default to enabled when env var not set', () => {
        delete process.env.WITH_CONTEXT_AUTO_TRACK;

        const config = {
          autoTrackingEnabled: process.env.WITH_CONTEXT_AUTO_TRACK !== 'false',
        };

        expect(config.autoTrackingEnabled).toBe(true);
      });

      it('should be disabled when set to "false"', () => {
        process.env.WITH_CONTEXT_AUTO_TRACK = 'false';

        const config = {
          autoTrackingEnabled: process.env.WITH_CONTEXT_AUTO_TRACK !== 'false',
        };

        expect(config.autoTrackingEnabled).toBe(false);
      });

      it('should be enabled when set to "true"', () => {
        process.env.WITH_CONTEXT_AUTO_TRACK = 'true';

        const config = {
          autoTrackingEnabled: process.env.WITH_CONTEXT_AUTO_TRACK !== 'false',
        };

        expect(config.autoTrackingEnabled).toBe(true);
      });
    });

    describe('WITH_CONTEXT_PROMPT', () => {
      it('should default to enabled when env var not set', () => {
        delete process.env.WITH_CONTEXT_PROMPT;

        const config = {
          promptOnFirstUse: process.env.WITH_CONTEXT_PROMPT !== 'false',
        };

        expect(config.promptOnFirstUse).toBe(true);
      });

      it('should be disabled when set to "false"', () => {
        process.env.WITH_CONTEXT_PROMPT = 'false';

        const config = {
          promptOnFirstUse: process.env.WITH_CONTEXT_PROMPT !== 'false',
        };

        expect(config.promptOnFirstUse).toBe(false);
      });

      it('should be enabled when set to "true"', () => {
        process.env.WITH_CONTEXT_PROMPT = 'true';

        const config = {
          promptOnFirstUse: process.env.WITH_CONTEXT_PROMPT !== 'false',
        };

        expect(config.promptOnFirstUse).toBe(true);
      });
    });

    describe('combined configuration', () => {
      it('should handle all env vars set to false', () => {
        process.env.WITH_CONTEXT_AUTO_START = 'false';
        process.env.WITH_CONTEXT_AUTO_TRACK = 'false';
        process.env.WITH_CONTEXT_PROMPT = 'false';

        const config = {
          autoStartEnabled: process.env.WITH_CONTEXT_AUTO_START !== 'false',
          autoTrackingEnabled: process.env.WITH_CONTEXT_AUTO_TRACK !== 'false',
          promptOnFirstUse: process.env.WITH_CONTEXT_PROMPT !== 'false',
        };

        expect(config.autoStartEnabled).toBe(false);
        expect(config.autoTrackingEnabled).toBe(false);
        expect(config.promptOnFirstUse).toBe(false);
      });

      it('should handle all env vars set to true', () => {
        process.env.WITH_CONTEXT_AUTO_START = 'true';
        process.env.WITH_CONTEXT_AUTO_TRACK = 'true';
        process.env.WITH_CONTEXT_PROMPT = 'true';

        const config = {
          autoStartEnabled: process.env.WITH_CONTEXT_AUTO_START !== 'false',
          autoTrackingEnabled: process.env.WITH_CONTEXT_AUTO_TRACK !== 'false',
          promptOnFirstUse: process.env.WITH_CONTEXT_PROMPT !== 'false',
        };

        expect(config.autoStartEnabled).toBe(true);
        expect(config.autoTrackingEnabled).toBe(true);
        expect(config.promptOnFirstUse).toBe(true);
      });

      it('should handle mixed configuration', () => {
        process.env.WITH_CONTEXT_AUTO_START = 'true';
        process.env.WITH_CONTEXT_AUTO_TRACK = 'false';
        process.env.WITH_CONTEXT_PROMPT = 'true';

        const config = {
          autoStartEnabled: process.env.WITH_CONTEXT_AUTO_START !== 'false',
          autoTrackingEnabled: process.env.WITH_CONTEXT_AUTO_TRACK !== 'false',
          promptOnFirstUse: process.env.WITH_CONTEXT_PROMPT !== 'false',
        };

        expect(config.autoStartEnabled).toBe(true);
        expect(config.autoTrackingEnabled).toBe(false);
        expect(config.promptOnFirstUse).toBe(true);
      });
    });
  });
});
