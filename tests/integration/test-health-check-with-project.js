/**
 * Manual test for health check tool with project folder
 * Run with: node tests/integration/test-health-check-with-project.js
 */

import { healthCheck } from '../../dist/tools/health-check.js';

async function testHealthCheckWithProject() {
  const projectFolder = '/Users/davidibia/Projects/MCP/with-context-mcp';
  console.log(`Running health check with project folder: ${projectFolder}\n`);

  try {
    const result = await healthCheck({ project_folder: projectFolder });

    console.log('='.repeat(80));
    console.log('HEALTH CHECK RESULTS (WITH PROJECT)');
    console.log('='.repeat(80));

    console.log(`\nStatus: ${result.status.toUpperCase()}`);
    console.log(`Success: ${result.success}`);
    console.log(`\nMessage: ${result.summary}`);

    // Configuration check details
    console.log('\n' + '-'.repeat(80));
    console.log('CONFIGURATION CHECK:');
    console.log('-'.repeat(80));
    console.log(`Status: ${result.checks.configuration.status.toUpperCase()}`);
    console.log(`Config Exists: ${result.checks.configuration.configExists ? 'YES' : 'NO'}`);
    console.log(`Config Valid: ${result.checks.configuration.configValid ? 'YES' : 'NO'}`);
    if (result.checks.configuration.configPath) {
      console.log(`Config Path: ${result.checks.configuration.configPath}`);
    }
    if (result.checks.configuration.message) {
      console.log(`Message: ${result.checks.configuration.message}`);
    }
    if (result.checks.configuration.errors && result.checks.configuration.errors.length > 0) {
      console.log('Errors:');
      result.checks.configuration.errors.forEach((err) => {
        console.log(`  - ${err}`);
      });
    }

    if (result.recommendations.length > 0) {
      console.log('\n' + '-'.repeat(80));
      console.log('RECOMMENDATIONS:');
      console.log('-'.repeat(80));
      result.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
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
testHealthCheckWithProject();
