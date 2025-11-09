/**
 * Example usage of the template system
 * Run with: npm run dev examples/template-examples.ts
 */

import {
  listTemplates,
  renderTemplate,
  getTemplate,
  createTemplate,
  extractVariables,
  validateTemplate,
} from '../src/templates/index.js';

console.log('='.repeat(80));
console.log('Template System Examples');
console.log('='.repeat(80));

// Example 1: List all available templates
console.log('\n📋 Example 1: List All Templates\n');
const templates = listTemplates();
templates.forEach((template) => {
  console.log(`  📄 ${template.name}`);
  console.log(`     ${template.description}`);
  console.log(`     Required variables: ${template.variables.join(', ') || 'none'}`);
  console.log();
});

// Example 2: Render a changelog
console.log('='.repeat(80));
console.log('\n📝 Example 2: Render Changelog Template\n');
try {
  const changelog = renderTemplate('changelog', {
    project: 'Obsidian Context MCP',
    version: '1.0.0',
    // date is auto-filled
  });
  console.log('✅ Successfully rendered changelog template');
  console.log('\nFirst 300 characters:');
  console.log('-'.repeat(80));
  console.log(changelog.substring(0, 300) + '...');
  console.log('-'.repeat(80));
} catch (error) {
  console.error('❌ Error:', error);
}

// Example 3: Render meeting notes
console.log('\n' + '='.repeat(80));
console.log('\n📝 Example 3: Render Meeting Notes Template\n');
try {
  const meetingNotes = renderTemplate('meeting-notes', {
    title: 'Sprint Planning - Q4 2025',
    project: 'Product Launch',
    // date and time are auto-filled
  });
  console.log('✅ Successfully rendered meeting notes template');
  console.log('\nFirst 400 characters:');
  console.log('-'.repeat(80));
  console.log(meetingNotes.substring(0, 400) + '...');
  console.log('-'.repeat(80));
} catch (error) {
  console.error('❌ Error:', error);
}

// Example 4: Render technical documentation
console.log('\n' + '='.repeat(80));
console.log('\n📝 Example 4: Render Technical Documentation Template\n');
try {
  const techDoc = renderTemplate('technical-doc', {
    title: 'Template System Architecture',
    project: 'Obsidian Context MCP',
    author: 'Engineering Team',
    // date is auto-filled
  });
  console.log('✅ Successfully rendered technical documentation template');
  console.log('\nFirst 400 characters:');
  console.log('-'.repeat(80));
  console.log(techDoc.substring(0, 400) + '...');
  console.log('-'.repeat(80));
} catch (error) {
  console.error('❌ Error:', error);
}

// Example 5: Handle missing required variables
console.log('\n' + '='.repeat(80));
console.log('\n❌ Example 5: Error Handling - Missing Variables\n');
try {
  renderTemplate('api-doc', {
    title: 'User API',
    // Missing: project, author
  });
  console.log('This should not print');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Correctly caught error:');
    console.log(`   ${error.message}`);
  }
}

// Example 6: Template not found error
console.log('\n' + '='.repeat(80));
console.log('\n❌ Example 6: Error Handling - Template Not Found\n');
try {
  renderTemplate('non-existent-template', {});
  console.log('This should not print');
} catch (error) {
  if (error instanceof Error) {
    console.log('✅ Correctly caught error:');
    console.log(`   ${error.message}`);
  }
}

// Example 7: Extract variables from template content
console.log('\n' + '='.repeat(80));
console.log('\n🔍 Example 7: Extract Variables from Content\n');
const customContent = `# {{title}}

Created by {{author}} on {{date}}

Project: {{project}}
Version: {{version}}
`;
const extractedVars = extractVariables(customContent);
console.log('Template content:');
console.log(customContent);
console.log('Extracted variables:', extractedVars);

// Example 8: Create custom template
console.log('\n' + '='.repeat(80));
console.log('\n🎨 Example 8: Create Custom Template\n');
const customTemplate = createTemplate(
  'daily-note',
  'Daily note with tasks and reflections',
  `---
title: "Daily Note - {{date}}"
type: daily-note
created: {{date}}
tags:
  - daily
  - {{month}}
---

# Daily Note - {{dayOfWeek}}, {{date}}

## 🎯 Goals for Today
- 

## ✅ Completed Tasks
- 

## 📝 Notes & Reflections
{{notes}}

## 🔜 Tomorrow's Focus
- 
`
);

console.log('Created custom template:');
console.log(`  Name: ${customTemplate.name}`);
console.log(`  Description: ${customTemplate.description}`);
console.log(
  `  Required variables: ${customTemplate.variables.join(', ') || 'none (all auto-filled)'}`
);
console.log(`  Validation: ${validateTemplate(customTemplate) ? '✅ Valid' : '❌ Invalid'}`);

// Example 9: Render project update
console.log('\n' + '='.repeat(80));
console.log('\n📝 Example 9: Render Project Update Template\n');
try {
  const projectUpdate = renderTemplate('project-update', {
    title: 'Sprint 23 Review',
    project: 'Mobile App Rewrite',
    author: 'Project Manager',
    period: 'Week of Nov 2-8, 2025',
    // date is auto-filled
  });
  console.log('✅ Successfully rendered project update template');
  console.log('\nFirst 500 characters:');
  console.log('-'.repeat(80));
  console.log(projectUpdate.substring(0, 500) + '...');
  console.log('-'.repeat(80));
} catch (error) {
  console.error('❌ Error:', error);
}

// Example 10: Get specific template details
console.log('\n' + '='.repeat(80));
console.log('\n🔍 Example 10: Get Template Details\n');
const changelogTemplate = getTemplate('changelog');
if (changelogTemplate) {
  console.log('Changelog template details:');
  console.log(`  Name: ${changelogTemplate.name}`);
  console.log(`  Description: ${changelogTemplate.description}`);
  console.log(`  Required variables: ${changelogTemplate.variables.join(', ')}`);
  console.log(`  Content length: ${changelogTemplate.content.length} characters`);
  console.log(`  Validation: ${validateTemplate(changelogTemplate) ? '✅ Valid' : '❌ Invalid'}`);
}

console.log('\n' + '='.repeat(80));
console.log('✨ All examples completed successfully!');
console.log('='.repeat(80) + '\n');
