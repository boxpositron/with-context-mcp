#!/usr/bin/env node

/**
 * Test Feature D: Search, Batch Operations, and Metadata
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, 'dist', 'index.js');

console.log('Testing Feature D: Search, Batch, Metadata...\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || '';
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('✓ Response:', JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('  ', line);
      }
    }
  });
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

async function runTests() {
  console.log('1️⃣  Initialize');
  sendRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  });
  await sleep(500);

  console.log('\n2️⃣  Set project context');
  sendRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'set_project_context',
      arguments: { project_folder: 'feature-d-test' },
    },
  });
  await sleep(500);

  console.log('\n3️⃣  Batch write multiple notes');
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'batch_write_notes',
      arguments: {
        notes: [
          {
            path: 'README.md',
            content: '# Feature D Test\n\nThis project demonstrates search, batch, and metadata features.\n\n## Overview\nWe can search through notes and get metadata.',
            mode: 'overwrite'
          },
          {
            path: 'docs/api.md',
            content: '---\ntags: [api, documentation]\nauthor: Test User\n---\n\n# API Documentation\n\n## Authentication\nUse Bearer tokens for authentication.\n\n## Endpoints\n\n### GET /users\nRetrieve all users.',
            mode: 'create'
          },
          {
            path: 'docs/setup.md',
            content: '# Setup Guide\n\n## Installation\n\nRun the following commands:\n\n```bash\nnpm install\nnpm start\n```\n\n## Configuration\n\nEdit the config file.',
            mode: 'create'
          }
        ]
      },
    },
  });
  await sleep(2000);

  console.log('\n4️⃣  Get metadata for API doc');
  sendRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'get_note_metadata',
      arguments: { path: 'docs/api.md' },
    },
  });
  await sleep(1000);

  console.log('\n5️⃣  Search for "authentication"');
  sendRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'search_notes',
      arguments: { 
        query: 'authentication',
        case_sensitive: false 
      },
    },
  });
  await sleep(1500);

  console.log('\n6️⃣  Search for "npm" (case-insensitive)');
  sendRequest({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'search_notes',
      arguments: { 
        query: 'npm',
        limit: 5
      },
    },
  });
  await sleep(1500);

  console.log('\n7️⃣  Get metadata for README');
  sendRequest({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'get_note_metadata',
      arguments: { path: 'README.md' },
    },
  });
  await sleep(1000);

  console.log('\n8️⃣  Append to README');
  sendRequest({
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: {
      name: 'write_note',
      arguments: {
        path: 'README.md',
        content: '\n\n## Features\n- Search functionality\n- Batch operations\n- Metadata extraction',
        mode: 'append',
      },
    },
  });
  await sleep(1000);

  console.log('\n9️⃣  Search for "features" (should find updated README)');
  sendRequest({
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/call',
    params: {
      name: 'search_notes',
      arguments: { query: 'features' },
    },
  });
  await sleep(1500);

  console.log('\n🔟 Get updated metadata for README');
  sendRequest({
    jsonrpc: '2.0',
    id: 10,
    method: 'tools/call',
    params: {
      name: 'get_note_metadata',
      arguments: { path: 'README.md' },
    },
  });
  await sleep(1000);

  console.log('\n✅ Feature D tests complete!');
  console.log('\nCheck your Obsidian vault at:');
  console.log('  Development Sessions/feature-d-test/');
  
  server.kill();
  process.exit(0);
}

function sendRequest(request) {
  server.stdin.write(JSON.stringify(request) + '\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setTimeout(runTests, 500);

setTimeout(() => {
  console.error('\n⏱️  Test timeout!');
  server.kill();
  process.exit(1);
}, 25000);
