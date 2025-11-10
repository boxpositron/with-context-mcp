import path from 'path';

/**
 * Slugify a filename by converting to lowercase and replacing spaces/special chars
 * Preserves case for common filenames like README, CHANGELOG, LICENSE
 * @param filename - The filename to slugify (without extension)
 * @returns Slugified filename
 */
function slugifyFilename(filename: string): string {
  // Preserve case for well-known filenames
  const preservedFilenames = ['README', 'CHANGELOG', 'LICENSE', 'CONTRIBUTING', 'AUTHORS'];
  if (preservedFilenames.includes(filename.toUpperCase())) {
    return filename.toUpperCase();
  }

  return filename
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^a-z0-9\-_]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Sanitizes and validates a file path to prevent directory traversal attacks
 * and ensure the path stays within project boundaries.
 *
 * @param inputPath - The user-provided path to sanitize
 * @param projectFolder - The project folder name (e.g., "with-context-mcp")
 * @param basePath - The base directory path (e.g., "Projects")
 * @returns Sanitized vault-relative path (e.g., "Projects/with-context-mcp/note.md")
 * @throws Error if path is invalid or attempts directory traversal
 */
export function sanitizePath(inputPath: string, projectFolder: string, basePath: string): string {
  if (!inputPath || typeof inputPath !== 'string') {
    throw new Error('Path must be a non-empty string');
  }

  if (!projectFolder || typeof projectFolder !== 'string') {
    throw new Error('Project folder must be a non-empty string');
  }

  if (!basePath || typeof basePath !== 'string') {
    throw new Error('Base path must be a non-empty string');
  }

  // Trim whitespace
  let cleanPath = inputPath.trim();

  if (cleanPath.length === 0) {
    throw new Error('Path cannot be empty or whitespace only');
  }

  // Reject null bytes (security)
  if (cleanPath.includes('\0')) {
    throw new Error('Path contains invalid null byte character');
  }

  // Reject absolute paths (they should be relative to project)
  if (path.isAbsolute(cleanPath)) {
    throw new Error(
      'Absolute paths are not allowed. Please provide a path relative to the project folder.'
    );
  }

  // Normalize the path (resolve .., ., remove duplicate slashes)
  cleanPath = path.normalize(cleanPath);

  // After normalization, check for directory traversal attempts
  // If the path starts with .. after normalization, it's trying to escape
  if (cleanPath.startsWith('..')) {
    throw new Error('Path traversal detected. Path cannot navigate outside the project folder.');
  }

  // Also check for ../ or ..\ anywhere in the normalized path
  // (normalization should have handled this, but double-check)
  const pathParts = cleanPath.split(path.sep);
  if (pathParts.includes('..')) {
    throw new Error('Path traversal detected. Path cannot contain ".." segments.');
  }

  // Convert to forward slashes for consistency
  cleanPath = cleanPath.split(path.sep).join('/');

  // Slugify the filename (but preserve directory structure)
  const segments = cleanPath.split('/');
  const filename = segments[segments.length - 1];

  // Check if filename has .md extension
  const hasExtension = filename.toLowerCase().endsWith('.md');
  const filenameWithoutExt = hasExtension ? filename.slice(0, -3) : filename;

  // Slugify the filename
  const slugifiedFilename = slugifyFilename(filenameWithoutExt);

  // Reconstruct path with slugified filename
  if (segments.length > 1) {
    segments[segments.length - 1] = slugifiedFilename + '.md';
    cleanPath = segments.join('/');
  } else {
    cleanPath = slugifiedFilename + '.md';
  }

  // Final validation: ensure no dangerous patterns in the user input
  const dangerousPatterns = [
    /\.\./, // Directory traversal
    /^\/+/, // Leading slashes (should be relative)
    /~\//, // Home directory expansion
    /\$\{/, // Variable expansion
    /%00/, // Null byte (URL encoded)
    /%2e%2e/i, // .. (URL encoded)
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(cleanPath)) {
      throw new Error(`Path contains potentially dangerous pattern: ${pattern}`);
    }
  }

  // Construct the vault-relative path: basePath/projectFolder/cleanPath
  // This ensures files are organized under their project folder in the vault
  const vaultRelativePath = `${basePath}/${projectFolder}/${cleanPath}`;

  // Additional boundary check: verify the path structure is valid
  // We use path.normalize to check for any remaining traversal attempts
  const normalizedCheck = path.normalize(vaultRelativePath);
  if (normalizedCheck.startsWith('..')) {
    throw new Error('Path escapes project boundaries after construction');
  }

  return vaultRelativePath;
}

/**
 * Validates if a path is safe without fully resolving it.
 * Useful for quick checks before more expensive operations.
 *
 * @param inputPath - The path to validate
 * @returns true if path appears safe, false otherwise
 */
export function isPathSafe(inputPath: string): boolean {
  try {
    if (!inputPath || typeof inputPath !== 'string') {
      return false;
    }

    const cleanPath = inputPath.trim();

    // Check for various unsafe patterns
    const unsafePatterns = [
      /\0/, // Null bytes
      /\.\./, // Directory traversal
      /^[/\\]/, // Absolute paths
      /~[/\\]/, // Home directory
      /\$\{/, // Variable expansion
      /%00/, // Null byte (URL encoded)
      /%2e%2e/i, // .. (URL encoded)
    ];

    return !unsafePatterns.some((pattern) => pattern.test(cleanPath));
  } catch {
    return false;
  }
}

/**
 * Extracts the relative path from a full path given a project root.
 *
 * @param fullPath - The complete path
 * @param projectRoot - The project root directory
 * @returns Relative path from project root
 */
export function getRelativePath(fullPath: string, projectRoot: string): string {
  const relativePath = path.relative(projectRoot, fullPath);

  if (relativePath.startsWith('..')) {
    throw new Error('Path is outside project root');
  }

  return relativePath.split(path.sep).join('/');
}
