# Template System

A flexible template system for the Obsidian Context MCP server that provides production-ready markdown templates with variable substitution and hybrid storage support.

## Features

- **5 Production-Ready Templates**: Changelog, Meeting Notes, Technical Documentation, API Documentation, and Project Updates
- **Simple Variable Syntax**: Use `{{variable}}` for easy replacements
- **Auto-Fill Common Variables**: Automatically fills `{{date}}`, `{{time}}`, `{{year}}`, etc.
- **YAML Frontmatter**: All templates include metadata for better organization
- **Type-Safe API**: Full TypeScript support with well-defined interfaces
- **Validation**: Built-in template validation and variable extraction

## Available Templates

### 1. `changelog`

Standard CHANGELOG.md format following [Keep a Changelog](https://keepachangelog.com/) guidelines.

**Required Variables:**

- `project`: Project name
- `version`: Version number (e.g., "1.0.0")
- `date`: Release date (auto-filled if not provided)

**Use Case:** Track project changes, releases, and version history.

### 2. `meeting-notes`

Meeting documentation with agenda, discussion notes, and action items.

**Required Variables:**

- `title`: Meeting title
- `date`: Meeting date (auto-filled if not provided)
- `time`: Meeting time (auto-filled if not provided)
- `project`: Associated project name

**Use Case:** Document team meetings, sprint planning, retrospectives.

### 3. `technical-doc`

Comprehensive technical documentation structure for features, systems, or architectures.

**Required Variables:**

- `title`: Document title
- `project`: Project name
- `author`: Document author
- `date`: Creation date (auto-filled if not provided)

**Use Case:** Architecture decisions, system design, feature specifications.

### 4. `api-doc`

API endpoint documentation with request/response examples and authentication details.

**Required Variables:**

- `title`: API documentation title
- `project`: API/Service name
- `author`: Documentation author
- `date`: Creation date (auto-filled if not provided)

**Use Case:** REST API documentation, endpoint specifications, integration guides.

### 5. `project-update`

Weekly or sprint status update with metrics, achievements, and blockers.

**Required Variables:**

- `title`: Update title
- `project`: Project name
- `author`: Report author
- `date`: Report date (auto-filled if not provided)
- `period`: Time period (e.g., "Week of Nov 2-8" or "Sprint 23")

**Use Case:** Status reports, sprint reviews, stakeholder updates.

## API Reference

### Core Functions

#### `listTemplates(): Template[]`

Get a list of all available templates with their metadata.

```typescript
import { listTemplates } from './templates';

const templates = listTemplates();
templates.forEach((t) => {
  console.log(`${t.name}: ${t.description}`);
  console.log(`Variables: ${t.variables.join(', ')}`);
});
```

#### `getDefaultTemplates(): Record<string, Template>`

Get all default templates as a record keyed by template name.

```typescript
import { getDefaultTemplates } from './templates';

const templates = getDefaultTemplates();
const changelog = templates['changelog'];
```

#### `renderTemplate(templateName: string, variables: Record<string, string>): string`

Render a template by replacing variables with actual values.

```typescript
import { renderTemplate } from './templates';

const content = renderTemplate('meeting-notes', {
  title: 'Sprint Planning',
  project: 'MCP Server',
});
// date and time are auto-filled
```

**Auto-Filled Variables:**

- `{{date}}`: Current date in YYYY-MM-DD format
- `{{time}}`: Current time in HH:MM format
- `{{datetime}}`: ISO 8601 datetime string
- `{{year}}`: Current year
- `{{month}}`: Current month name
- `{{dayOfWeek}}`: Current day of week
- `{{day}}`: Current day of month

**Throws:**

- `Error` if template is not found
- `Error` if required variables are missing

#### `getTemplate(templateName: string): Template | undefined`

Get a specific template by name.

```typescript
import { getTemplate } from './templates';

const template = getTemplate('changelog');
if (template) {
  console.log(template.variables); // ['project', 'version', 'date']
}
```

#### `extractVariables(content: string): string[]`

Extract all variable placeholders from a template string.

```typescript
import { extractVariables } from './templates';

const vars = extractVariables('Hello {{name}}, today is {{date}}');
console.log(vars); // ['name', 'date']
```

#### `createTemplate(name: string, description: string, content: string): Template`

Create a custom template with automatic variable detection.

```typescript
import { createTemplate } from './templates';

const custom = createTemplate(
  'daily-note',
  'Daily note template',
  `# Daily Note - {{date}}

## Tasks
- [ ] Task 1

## Notes
{{notes}}`
);

console.log(custom.variables); // ['notes']
// 'date' is auto-filled, so it's not in required variables
```

#### `validateTemplate(template: Template): boolean`

Validate that a template has all required variables properly declared.

```typescript
import { validateTemplate, createTemplate } from './templates';

const template = createTemplate('test', 'Test template', 'Hello {{name}}');
const isValid = validateTemplate(template);
```

## Usage Examples

### Example 1: Create a Changelog Entry

```typescript
import { renderTemplate } from './templates';

const changelog = renderTemplate('changelog', {
  project: 'Obsidian Context MCP',
  version: '1.0.0',
  // date is auto-filled with today's date
});

console.log(changelog);
// Outputs a properly formatted CHANGELOG.md
```

### Example 2: Generate Meeting Notes

```typescript
import { renderTemplate } from './templates';

const notes = renderTemplate('meeting-notes', {
  title: 'Q4 Planning Session',
  project: 'Product Launch',
  // date and time are auto-filled
});

// Save to Obsidian vault
// await writeNote('meetings/2025-11-02-q4-planning.md', notes);
```

### Example 3: Create Technical Documentation

```typescript
import { renderTemplate } from './templates';

const docs = renderTemplate('technical-doc', {
  title: 'Authentication System Architecture',
  project: 'User Management Service',
  author: 'Engineering Team',
  // date is auto-filled
});

// Save to vault
// await writeNote('docs/architecture/auth-system.md', docs);
```

### Example 4: Generate API Documentation

```typescript
import { renderTemplate } from './templates';

const apiDocs = renderTemplate('api-doc', {
  title: 'User API Documentation',
  project: 'User Service API v1',
  author: 'API Team',
  // date is auto-filled
});
```

### Example 5: Create Project Update

```typescript
import { renderTemplate } from './templates';

const update = renderTemplate('project-update', {
  title: 'Sprint 23 Review',
  project: 'Mobile App Rewrite',
  author: 'Project Manager',
  period: 'Week of Nov 2-8, 2025',
  // date is auto-filled
});
```

### Example 6: List Available Templates

```typescript
import { listTemplates } from './templates';

const templates = listTemplates();

console.log('Available Templates:\n');
templates.forEach((template) => {
  console.log(`📄 ${template.name}`);
  console.log(`   ${template.description}`);
  console.log(`   Required: ${template.variables.join(', ')}\n`);
});
```

### Example 7: Custom Template Creation

```typescript
import { createTemplate, renderTemplate } from './templates';

// Create a custom template
const bugReport = createTemplate(
  'bug-report',
  'Bug report template',
  `---
title: "Bug: {{title}}"
type: bug-report
severity: {{severity}}
created: {{date}}
tags:
  - bug
  - {{component}}
---

# Bug Report: {{title}}

**Component:** {{component}}  
**Severity:** {{severity}}  
**Reported:** {{date}}

## Description

{{description}}

## Steps to Reproduce

1. 
2. 
3. 

## Expected Behavior

{{expected}}

## Actual Behavior

{{actual}}

## Environment

- OS: 
- Version: 
- Browser: 

## Additional Notes

`
);

// Use the custom template
const bugContent = renderTemplate('bug-report', {
  title: 'Login button not responding',
  severity: 'High',
  component: 'Authentication',
  description: 'The login button does not respond to clicks',
  expected: 'User should be logged in',
  actual: 'Nothing happens when clicking the button',
});
```

## Integration with MCP Server

The template system can be integrated into MCP server tools for easy note creation:

```typescript
// In your MCP tool handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'create_from_template',
      description: 'Create a note from a template',
      inputSchema: {
        type: 'object',
        properties: {
          template: {
            type: 'string',
            description:
              'Template name (changelog, meeting-notes, technical-doc, api-doc, project-update)',
            enum: ['changelog', 'meeting-notes', 'technical-doc', 'api-doc', 'project-update'],
          },
          notePath: {
            type: 'string',
            description: 'Path where the note should be created',
          },
          variables: {
            type: 'object',
            description: 'Template variables as key-value pairs',
            additionalProperties: { type: 'string' },
          },
        },
        required: ['template', 'notePath', 'variables'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'create_from_template') {
    const { template, notePath, variables } = request.params.arguments;

    // Render template
    const content = renderTemplate(template, variables);

    // Write to Obsidian vault
    await obsidianClient.writeNote(notePath, content);

    return {
      content: [
        {
          type: 'text',
          text: `Created note from template '${template}' at ${notePath}`,
        },
      ],
    };
  }
});
```

## TypeScript Interfaces

```typescript
interface Template {
  name: string;
  description: string;
  content: string;
  variables: string[]; // List of required variables
}

interface TemplateVariable {
  key: string;
  value: string;
}
```

## Best Practices

1. **Always provide required variables**: Check `template.variables` to see what's required
2. **Use auto-filled variables**: Leverage automatic date/time filling when possible
3. **Validate custom templates**: Use `validateTemplate()` when creating custom templates
4. **Consistent naming**: Use kebab-case for template names
5. **Clear descriptions**: Provide helpful descriptions for custom templates
6. **YAML frontmatter**: Include metadata for better organization in Obsidian
7. **Professional format**: Keep templates clean and ready-to-use

## Error Handling

```typescript
import { renderTemplate } from './templates';

try {
  const content = renderTemplate('meeting-notes', {
    title: 'Sprint Planning',
    // Missing 'project' variable
  });
} catch (error) {
  console.error(error.message);
  // "Missing required variables for template 'meeting-notes': project"
}

try {
  const content = renderTemplate('non-existent-template', {});
} catch (error) {
  console.error(error.message);
  // "Template 'non-existent-template' not found"
}
```

## Future Enhancements

Potential improvements for the template system:

- **Hybrid Storage**: Support for custom user templates stored in vault
- **Template Inheritance**: Extend base templates with custom modifications
- **Conditional Sections**: Support for optional sections based on variables
- **Template Marketplace**: Share and discover community templates
- **Rich Variables**: Support for arrays, objects, and complex data structures
- **Template Validation UI**: Visual template editor with live preview
- **Version Control**: Track template changes over time
- **Import/Export**: Share templates as YAML or JSON files

## License

MIT
