/**
 * Verification script to demonstrate the path sanitization fix
 *
 * This script shows that sanitizePath now returns vault-relative paths
 * instead of absolute filesystem paths.
 */

import { sanitizePath } from './src/security/path-validator.js';

console.log('=== Path Sanitization Fix Verification ===\n');

// Test case 1: Basic note
const test1 = {
  inputPath: 'test-note',
  projectFolder: 'test-project',
  basePath: 'Development Sessions',
};

console.log('Test 1: Basic note');
console.log('Input:', test1);
const result1 = sanitizePath(test1.inputPath, test1.projectFolder, test1.basePath);
console.log('Output:', result1);
console.log('Expected: "Development Sessions/test-project/test-note.md"');
console.log('Match:', result1 === 'Development Sessions/test-project/test-note.md' ? '✅' : '❌');
console.log();

// Test case 2: Note with subdirectory
const test2 = {
  inputPath: 'docs/api-reference',
  projectFolder: 'my-app',
  basePath: 'Projects',
};

console.log('Test 2: Note with subdirectory');
console.log('Input:', test2);
const result2 = sanitizePath(test2.inputPath, test2.projectFolder, test2.basePath);
console.log('Output:', result2);
console.log('Expected: "Projects/my-app/docs/api-reference.md"');
console.log('Match:', result2 === 'Projects/my-app/docs/api-reference.md' ? '✅' : '❌');
console.log();

// Test case 3: Note with .md extension already
const test3 = {
  inputPath: 'README.md',
  projectFolder: 'awesome-lib',
  basePath: 'Open Source',
};

console.log('Test 3: Note with .md extension');
console.log('Input:', test3);
const result3 = sanitizePath(test3.inputPath, test3.projectFolder, test3.basePath);
console.log('Output:', result3);
console.log('Expected: "Open Source/awesome-lib/README.md"');
console.log('Match:', result3 === 'Open Source/awesome-lib/README.md' ? '✅' : '❌');
console.log();

// Test case 4: Security - should reject directory traversal
console.log('Test 4: Security - directory traversal attempt');
try {
  sanitizePath('../../../etc/passwd', 'test-project', 'Development Sessions');
  console.log('❌ FAILED: Should have thrown an error');
} catch (error) {
  console.log('✅ PASSED: Correctly rejected directory traversal');
  console.log('Error:', (error as Error).message);
}
console.log();

// Test case 5: Security - should reject absolute paths
console.log('Test 5: Security - absolute path attempt');
try {
  sanitizePath('/etc/passwd', 'test-project', 'Development Sessions');
  console.log('❌ FAILED: Should have thrown an error');
} catch (error) {
  console.log('✅ PASSED: Correctly rejected absolute path');
  console.log('Error:', (error as Error).message);
}
console.log();

console.log('=== Verification Complete ===');
console.log('\nKey Changes:');
console.log('1. sanitizePath() now returns vault-relative paths');
console.log('2. Paths are in format: "{basePath}/{projectFolder}/{notePath}"');
console.log('3. All security validations remain intact');
console.log('4. Obsidian REST API will place notes in the correct vault location');
