#!/usr/bin/env node

/**
 * Test Template System
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, 'dist', 'index.js');

console.log('Testing Template System...\n');

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
      arguments: { project_folder: 'template-demo' },
    },
  });
  await sleep(500);

  console.log('\n3️⃣  List available templates');
  sendRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'list_templates',
      arguments: {},
    },
  });
  await sleep(500);

  console.log('\n4️⃣  Create changelog from template');
  sendRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'create_from_template',
      arguments: {
        template_name: 'changelog',
        filename: 'CHANGELOG.md',
        variables: {
          version: '1.0.0',
          project: 'Template Demo Project',
        },
      },
    },
  });
  await sleep(1000);

  console.log('\n5️⃣  Create meeting notes from template');
  sendRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'create_from_template',
      arguments: {
        template_name: 'meeting-notes',
        filename: 'meetings/sprint-planning.md',
        variables: {
          title: 'Sprint Planning Meeting',
          project: 'Template Demo',
          attendees: 'Alice, Bob, Charlie',
        },
      },
    },
  });
  await sleep(1000);

  console.log('\n6️⃣  Create API documentation from template');
  sendRequest({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'create_from_template',
      arguments: {
        template_name: 'api-doc',
        filename: 'docs/api/users-endpoint.md',
        variables: {
          endpoint: '/api/v1/users',
          method: 'GET',
          description: 'Retrieve all users from the system',
        },
      },
    },
  });
  await sleep(1000);

  console.log('\n7️⃣  Create technical documentation from template');
  sendRequest({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: {
      name: 'create_from_template',
      arguments: {
        template_name: 'technical-doc',
        filename: 'docs/architecture.md',
        variables: {
          title: 'System Architecture',
          project: 'Template Demo',
          version: '1.0',
        },
      },
    },
  });
  await sleep(1000);

  console.log('\n8️⃣  Create project update from template');
  sendRequest({
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: {
      name: 'create_from_template',
      arguments: {
        template_name: 'project-update',
        filename: 'updates/weekly-update.md',
        variables: {
          project: 'Template Demo',
          period: 'Week of Nov 4-8, 2024',
          status: 'On Track',
        },
      },
    },
  });
  await sleep(1000);

  console.log('\n9️⃣  Read the changelog to verify');
  sendRequest({
    jsonrpc: '2.0',
    id: 9,
    method: 'tools/call',
    params: {
      name: 'read_note',
      arguments: { path: 'CHANGELOG.md' },
    },
  });
  await sleep(1000);

  console.log('\n🔟 Get metadata for meeting notes');
  sendRequest({
    jsonrpc: '2.0',
    id: 10,
    method: 'tools/call',
    params: {
      name: 'get_note_metadata',
      arguments: { path: 'meetings/sprint-planning.md' },
    },
  });
  await sleep(1000);

  console.log('\n✅ Template tests complete!');
  console.log('\n📝 Created files in your Obsidian vault:');
  console.log('  Development Sessions/template-demo/CHANGELOG.md');
  console.log('  Development Sessions/template-demo/meetings/sprint-planning.md');
  console.log('  Development Sessions/template-demo/docs/api/users-endpoint.md');
  console.log('  Development Sessions/template-demo/docs/architecture.md');
  console.log('  Development Sessions/template-demo/updates/weekly-update.md');
  
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
}, 20000);
