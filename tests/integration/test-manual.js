#!/usr/bin/env node

/**
 * Manual test script to verify MCP server functionality
 * This simulates what an MCP client would send
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('Starting MCP server test...\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  // Try to parse JSON-RPC responses
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Raw output:', line);
      }
    }
  });
});

server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Test sequence
async function runTests() {
  console.log('Test 1: Initialize');
  sendRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0',
      },
    },
  });

  await sleep(1000);

  console.log('\nTest 2: List tools');
  sendRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
  });

  await sleep(1000);

  console.log('\nTest 3: Set project context');
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'set_project_context',
      arguments: {
        project_folder: 'test-project',
      },
    },
  });

  await sleep(1000);

  console.log('\nTest 4: Write a test note');
  sendRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'write_note',
      arguments: {
        path: 'test-note.md',
        content: '# Test Note\n\nThis is a test from the MCP server.\n\nTimestamp: ' + new Date().toISOString(),
        mode: 'overwrite',
      },
    },
  });

  await sleep(2000);

  console.log('\n\nTests complete! Check your Obsidian vault at:');
  console.log('  Development Sessions/test-project/test-note.md');
  
  server.kill();
  process.exit(0);
}

function sendRequest(request) {
  console.log('Sending:', request.method);
  server.stdin.write(JSON.stringify(request) + '\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start tests after a brief delay
setTimeout(runTests, 500);

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\nTest timeout!');
  server.kill();
  process.exit(1);
}, 10000);
