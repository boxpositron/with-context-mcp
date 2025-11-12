/**
 * Manual test for health check tool with broken config
 * Tests failure scenarios
 * Run with: node tests/integration/test-health-check-failure.js
 */

import { healthCheck } from '../../dist/tools/health-check.js';

async function testHealthCheckFailure() {
  console.log('Testing health check with broken configuration...\n');

  // Save original env vars
  const originalApiKey = process.env.OBSIDIAN_API_KEY;
  const originalVault = process.env.OBSIDIAN_VAULT;

  try {
    // Test 1: Invalid API key
    console.log('='.repeat(80));
    console.log('TEST 1: Invalid API Key');
    console.log('='.repeat(80));
    process.env.OBSIDIAN_API_KEY = 'invalid-key-12345';

    let result = await healthCheck({});

    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Success: ${result.success}`);
    console.log(`\nMessage: ${result.summary}`);

    console.log('\nObsidian API Status:');
    console.log(`  Connected: ${result.checks.obsidianApi.connected ? 'YES' : 'NO'}`);
    console.log(`  Authenticated: ${result.checks.obsidianApi.authenticated ? 'YES' : 'NO'}`);
    console.log(`  Error: ${result.checks.obsidianApi.error || 'None'}`);

    if (result.recommendations.length > 0) {
      console.log('\nRecommendations:');
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    // Restore API key
    process.env.OBSIDIAN_API_KEY = originalApiKey;

    // Test 2: Invalid vault name
    console.log('\n' + '='.repeat(80));
    console.log('TEST 2: Invalid Vault Name');
    console.log('='.repeat(80));
    process.env.OBSIDIAN_VAULT = 'NonExistentVault';

    result = await healthCheck({});

    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Success: ${result.success}`);
    console.log(`\nMessage: ${result.summary}`);

    console.log('\nObsidian API Status:');
    console.log(`  Connected: ${result.checks.obsidianApi.connected ? 'YES' : 'NO'}`);
    console.log(`  Authenticated: ${result.checks.obsidianApi.authenticated ? 'YES' : 'NO'}`);
    console.log(`  Vault Accessible: ${result.checks.obsidianApi.vaultAccessible ? 'YES' : 'NO'}`);
    console.log(`  Error: ${result.checks.obsidianApi.error || 'None'}`);

    if (result.recommendations.length > 0) {
      console.log('\nRecommendations:');
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    // Restore vault
    process.env.OBSIDIAN_VAULT = originalVault;

    // Test 3: Missing environment variable
    console.log('\n' + '='.repeat(80));
    console.log('TEST 3: Missing Environment Variable');
    console.log('='.repeat(80));
    delete process.env.OBSIDIAN_API_URL;

    result = await healthCheck({});

    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Success: ${result.success}`);
    console.log(`\nMessage: ${result.summary}`);

    console.log('\nEnvironment Status:');
    console.log(`  Status: ${result.checks.environment.status.toUpperCase()}`);
    console.log('\n  Required Variables:');
    result.checks.environment.required.forEach((v) => {
      console.log(`    ${v.present ? '✓' : '✗'} ${v.name}: ${v.value || 'NOT SET'}`);
    });

    if (result.recommendations.length > 0) {
      console.log('\nRecommendations:');
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('All failure tests completed successfully!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('❌ Health check test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testHealthCheckFailure();
