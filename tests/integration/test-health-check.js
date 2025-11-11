/**
 * Manual test for health check tool
 * Run with: node tests/integration/test-health-check.js
 */

import { healthCheck } from '../../dist/tools/health-check.js';

async function testHealthCheck() {
  console.log('Running health check with current environment...\n');

  try {
    const result = await healthCheck({});

    console.log('='.repeat(80));
    console.log('HEALTH CHECK RESULTS');
    console.log('='.repeat(80));
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(80));

    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Success: ${result.success}`);
    console.log(`\nMessage: ${result.summary}`);

    if (result.recommendations.length > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('RECOMMENDATIONS:');
      console.log('-'.repeat(80));
      result.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('DETAILED RESULTS');
    console.log('='.repeat(80));

    // Environment check details
    console.log('\nENVIRONMENT VARIABLES:');
    console.log(`Status: ${result.checks.environment.status.toUpperCase()}`);
    console.log('\nRequired:');
    result.checks.environment.required.forEach((v) => {
      console.log(`  ${v.present ? '✓' : '✗'} ${v.name}: ${v.value || 'NOT SET'}`);
    });
    console.log('\nOptional:');
    result.checks.environment.optional.forEach((v) => {
      console.log(`  ${v.present ? '✓' : '-'} ${v.name}: ${v.value || 'NOT SET'}`);
    });

    // Obsidian API check details
    console.log('\nOBSIDIAN API:');
    console.log(`Status: ${result.checks.obsidianApi.status.toUpperCase()}`);
    console.log(`  URL: ${result.checks.obsidianApi.url}`);
    console.log(`  Vault: ${result.checks.obsidianApi.vaultName}`);
    console.log(`  Connected: ${result.checks.obsidianApi.connected ? 'YES' : 'NO'}`);
    console.log(`  Authenticated: ${result.checks.obsidianApi.authenticated ? 'YES' : 'NO'}`);
    console.log(`  Vault Accessible: ${result.checks.obsidianApi.vaultAccessible ? 'YES' : 'NO'}`);
    if (result.checks.obsidianApi.latencyMs) {
      console.log(`  Latency: ${result.checks.obsidianApi.latencyMs}ms`);
    }
    if (result.checks.obsidianApi.error) {
      console.log(`  Error: ${result.checks.obsidianApi.error}`);
    }

    // Configuration check details
    console.log('\nCONFIGURATION:');
    console.log(`Status: ${result.checks.configuration.status.toUpperCase()}`);
    console.log(`  Config Exists: ${result.checks.configuration.configExists ? 'YES' : 'NO'}`);
    if (result.checks.configuration.configPath) {
      console.log(`  Config Path: ${result.checks.configuration.configPath}`);
    }
    if (result.checks.configuration.message) {
      console.log(`  Message: ${result.checks.configuration.message}`);
    }
    if (result.checks.configuration.errors && result.checks.configuration.errors.length > 0) {
      console.log('  Errors:');
      result.checks.configuration.errors.forEach((err) => {
        console.log(`    - ${err}`);
      });
    }

    console.log('\n' + '='.repeat(80));

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testHealthCheck();
