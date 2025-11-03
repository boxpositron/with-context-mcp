#!/usr/bin/env node

/**
 * Integration test for sync_notes tool
 * Tests bidirectional sync between local project and Obsidian vault
 */

import { syncNotes } from '../../dist/tools/sync-notes.js';

async function testSyncNotes() {
  console.log('🧪 Testing sync_notes tool...\n');

  try {
    // Test 1: Dry run to see what would be synced
    console.log('Test 1: Dry run sync');
    console.log('-------------------');
    const dryRunResult = await syncNotes({
      dry_run: true,
    });
    const dryRunData = JSON.parse(dryRunResult);
    console.log('Dry run result:');
    console.log(`  Files to move to vault: ${dryRunData.local_to_vault.count}`);
    console.log(`  Files to move to local: ${dryRunData.vault_to_local.count}`);

    if (dryRunData.local_to_vault.count > 0) {
      console.log('\n  Files that would move to vault:');
      dryRunData.local_to_vault.files.forEach((f) => console.log(`    - ${f}`));
    }

    if (dryRunData.vault_to_local.count > 0) {
      console.log('\n  Files that would move to local:');
      dryRunData.vault_to_local.files.forEach((f) => console.log(`    - ${f}`));
    }

    console.log('\n✅ Dry run test passed\n');

    // Note: We don't run actual sync in automated tests to avoid modifying files
    console.log('⚠️  Skipping actual sync test to preserve files');
    console.log('   To test actual sync, run manually with dry_run: false\n');

    console.log('✅ All sync_notes tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testSyncNotes();
