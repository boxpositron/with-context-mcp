import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

/**
 * Detects the project folder name by checking for a git repository.
 * Attempts multiple strategies to determine a meaningful project name.
 *
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Project folder name or null if not in a git repository
 */
export async function detectProjectFolder(cwd?: string): Promise<string | null> {
  const workingDir = cwd || process.cwd();

  try {
    // Strategy 1: Try to get git repository name from remote URL
    const remoteName = await getGitRemoteName(workingDir);
    if (remoteName) {
      return remoteName;
    }

    // Strategy 2: Try to read .git/config directly
    const configName = await getGitConfigName(workingDir);
    if (configName) {
      return configName;
    }

    // Strategy 3: Get the git root directory name
    const rootName = await getGitRootName(workingDir);
    if (rootName) {
      return rootName;
    }

    // No git repository found
    return null;
  } catch (error) {
    // If any error occurs (git not installed, not a repo, etc.), return null
    return null;
  }
}

/**
 * Attempts to get the repository name from git remote URL.
 *
 * @param workingDir - Directory to check
 * @returns Repository name or null
 */
async function getGitRemoteName(workingDir: string): Promise<string | null> {
  try {
    // Try to get the remote URL
    const { stdout } = await execFileAsync(
      'git',
      ['config', '--get', 'remote.origin.url'],
      {
        cwd: workingDir,
        timeout: 5000, // 5 second timeout
      }
    );

    const remoteUrl = stdout.trim();
    if (!remoteUrl) {
      return null;
    }

    // Extract repo name from various URL formats:
    // - https://github.com/user/repo.git
    // - git@github.com:user/repo.git
    // - https://github.com/user/repo
    // - /path/to/repo.git

    // Remove .git extension if present
    let repoName = remoteUrl.replace(/\.git$/, '');

    // Extract the last segment (repo name)
    // Handle both / and : separators
    const segments = repoName.split(/[/:]/);
    repoName = segments[segments.length - 1];

    if (repoName && isValidFolderName(repoName)) {
      return repoName;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Attempts to read .git/config file and extract repository name.
 *
 * @param workingDir - Directory to check
 * @returns Repository name or null
 */
async function getGitConfigName(workingDir: string): Promise<string | null> {
  try {
    // Find git directory
    const gitDir = await findGitDirectory(workingDir);
    if (!gitDir) {
      return null;
    }

    const configPath = path.join(gitDir, 'config');
    const configContent = await fs.readFile(configPath, 'utf-8');

    // Parse the config file for remote.origin.url
    const urlMatch = configContent.match(/\[remote "origin"\][\s\S]*?url = (.+)/);
    if (!urlMatch || !urlMatch[1]) {
      return null;
    }

    const remoteUrl = urlMatch[1].trim();

    // Extract repo name (same logic as getGitRemoteName)
    let repoName = remoteUrl.replace(/\.git$/, '');
    const segments = repoName.split(/[/:]/);
    repoName = segments[segments.length - 1];

    if (repoName && isValidFolderName(repoName)) {
      return repoName;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Gets the git root directory name as a fallback.
 *
 * @param workingDir - Directory to check
 * @returns Git root directory name or null
 */
async function getGitRootName(workingDir: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['rev-parse', '--show-toplevel'],
      {
        cwd: workingDir,
        timeout: 5000,
      }
    );

    const gitRoot = stdout.trim();
    if (!gitRoot) {
      return null;
    }

    const folderName = path.basename(gitRoot);
    
    if (folderName && isValidFolderName(folderName)) {
      return folderName;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Finds the .git directory by traversing up the directory tree.
 *
 * @param startDir - Directory to start searching from
 * @returns Path to .git directory or null
 */
async function findGitDirectory(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (currentDir !== root) {
    const gitPath = path.join(currentDir, '.git');
    
    try {
      const stats = await fs.stat(gitPath);
      if (stats.isDirectory()) {
        return gitPath;
      }
      // .git might be a file (git worktree)
      if (stats.isFile()) {
        const content = await fs.readFile(gitPath, 'utf-8');
        const match = content.match(/gitdir: (.+)/);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    } catch {
      // Directory doesn't exist, continue searching
    }

    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break; // Reached root
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Validates if a folder name is safe and meaningful.
 *
 * @param name - Folder name to validate
 * @returns true if valid, false otherwise
 */
function isValidFolderName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmed = name.trim();

  // Must not be empty
  if (trimmed.length === 0) {
    return false;
  }

  // Must not contain path separators
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    return false;
  }

  // Must not be . or ..
  if (trimmed === '.' || trimmed === '..') {
    return false;
  }

  // Must not contain null bytes or other dangerous characters
  const dangerousChars = /[\0<>:"|?*]/;
  if (dangerousChars.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Checks if the current directory is within a git repository.
 *
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns true if in a git repository, false otherwise
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  const workingDir = cwd || process.cwd();

  try {
    await execFileAsync(
      'git',
      ['rev-parse', '--git-dir'],
      {
        cwd: workingDir,
        timeout: 5000,
      }
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the git branch name if available.
 *
 * @param cwd - Current working directory (defaults to process.cwd())
 * @returns Branch name or null
 */
export async function getGitBranch(cwd?: string): Promise<string | null> {
  const workingDir = cwd || process.cwd();

  try {
    const { stdout } = await execFileAsync(
      'git',
      ['rev-parse', '--abbrev-ref', 'HEAD'],
      {
        cwd: workingDir,
        timeout: 5000,
      }
    );

    const branch = stdout.trim();
    return branch || null;
  } catch {
    return null;
  }
}
