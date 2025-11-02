#!/usr/bin/env node

/**
 * Test all MCP tools
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, 'dist', 'index.js');

console.log('Testing all MCP tools...\n');

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
});

let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  const lines = responseBuffer.split('\n');
  responseBuffer = lines.pop() || '';

  lines.forEach((line) => {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('✓ Response:', JSON.stringify(response, null, 2));
      } catch {
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
      arguments: { project_folder: 'test-project' },
    },
  });
  await sleep(500);

  console.log('\n3️⃣  Write a note');
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'write_note',
      arguments: {
        path: 'README.md',
        content:
          '# Test Project\n\nThis is a test project.\n\n## Features\n- Feature 1\n- Feature 2',
        mode: 'overwrite',
      },
    },
  });
  await sleep(1000);

  console.log('\n4️⃣  Write another note');
  sendRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'write_note',
      arguments: {
        path: 'docs/api.md',
        content: '# API Documentation\n\n## Endpoints\n\n### GET /users\nReturns all users.',
        mode: 'create',
      },
    },
  });
  await sleep(1000);

  console.log('\n5️⃣  Read the note');
  sendRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'read_note',
      arguments: { path: 'README.md' },
    },
  });
  await sleep(1000);

  console.log('\n6️⃣  List notes in project root');
  sendRequest({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'list_notes',
      arguments: {},
    },
  });
  await sleep(1000);

  console.log('\n7️⃣  List notes in docs folder');
  sendRequest({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'list_notes',
      arguments: { path: 'docs' },
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
        content: '\n\n## Installation\n\n```bash\nnpm install\n```',
        mode: 'append',
      },
    },
  });
  await sleep(1000);

  console.log('\n9️⃣  Read updated README');
  sendRequest({
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/call',
    params: {
      name: 'read_note',
      arguments: { path: 'README.md' },
    },
  });
  await sleep(1000);

  console.log('\n🔟 Delete API docs (with confirmation)');
  sendRequest({
    jsonrpc: '2.0',
    id: 10,
    method: 'tools/call',
    params: {
      name: 'delete_note',
      arguments: {
        path: 'docs/api.md',
        confirm: true,
      },
    },
  });
  await sleep(1000);

  console.log('\n✅ All tests complete!');
  console.log('\nCheck your Obsidian vault at:');
  console.log('  Development Sessions/test-project/');

  server.kill();
  process.exit(0);
}

function sendRequest(request) {
  server.stdin.write(JSON.stringify(request) + '\n');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

setTimeout(runTests, 500);

setTimeout(() => {
  console.error('\n⏱️  Test timeout!');
  server.kill();
  process.exit(1);
}, 15000);
