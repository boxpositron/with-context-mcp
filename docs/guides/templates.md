# Template System Guide

Complete guide to creating consistent documentation with the template system.

## Table of Contents

- [What Are Templates?](#what-are-templates)
- [How Templates Work](#how-templates-work)
- [Available Templates](#available-templates)
- [Creating Custom Templates](#creating-custom-templates)
- [Variable Substitution](#variable-substitution)
- [Integration with MCP](#integration-with-mcp)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## What Are Templates?

Templates are pre-formatted markdown documents with placeholders for dynamic content. They help you create consistent, professional documentation quickly without starting from scratch every time.

### Key Benefits

**Consistency:**

- Same structure across all similar documents
- Professional formatting out of the box
- Standardized sections and headings

**Speed:**

- No need to remember document structure
- Fill in variables, get complete document
- Batch create multiple documents

**Quality:**

- Well-designed templates follow best practices
- Include all necessary sections
- YAML frontmatter for metadata

---

## How Templates Work

### Basic Concept

1. **Choose a template** - Select from built-in templates
2. **Provide variables** - Fill in dynamic content
3. **Auto-fill common fields** - Date, time, etc. filled automatically
4. **Get complete document** - Rendered markdown ready to use

### Variable Syntax

Templates use `{{variable}}` syntax for placeholders:

```markdown
# {{title}}

**Author:** {{author}}  
**Date:** {{date}}

## Overview

{{description}}
```

### Auto-Filled Variables

These variables are automatically filled if not provided:

| Variable        | Format           | Example          |
| --------------- | ---------------- | ---------------- |
| `{{date}}`      | YYYY-MM-DD       | 2025-11-13       |
| `{{time}}`      | HH:MM            | 14:30            |
| `{{datetime}}`  | YYYY-MM-DD HH:MM | 2025-11-13 14:30 |
| `{{year}}`      | YYYY             | 2025             |
| `{{month}}`     | Month name       | November         |
| `{{day}}`       | DD               | 13               |
| `{{dayOfWeek}}` | Day name         | Wednesday        |

---

## Available Templates

### 1. Changelog Template

**Name:** `changelog`

**Purpose:** Standard CHANGELOG.md format following [Keep a Changelog](https://keepachangelog.com/) guidelines.

**Required Variables:**

- `project` - Project name
- `version` - Version number (e.g., "1.0.0")
- `date` - Release date (auto-filled if not provided)

**Structure:**

```markdown
---
title: 'CHANGELOG - {{project}}'
type: changelog
version: { { version } }
date: { { date } }
---

# Changelog - {{project}}

All notable changes to this project will be documented in this file.

## [{{version}}] - {{date}}

### Added

-

### Changed

-

### Fixed

-

### Removed

-
```

**Use Cases:**

- Track project changes
- Document releases
- Maintain version history

### 2. Meeting Notes Template

**Name:** `meeting-notes`

**Purpose:** Meeting documentation with agenda, discussion notes, and action items.

**Required Variables:**

- `title` - Meeting title
- `date` - Meeting date (auto-filled)
- `time` - Meeting time (auto-filled)
- `project` - Associated project name

**Structure:**

```markdown
---
title: '{{title}}'
type: meeting-notes
date: { { date } }
time: { { time } }
project: { { project } }
tags:
  - meeting
  - { { project } }
---

# {{title}}

**Date:** {{date}}  
**Time:** {{time}}  
**Project:** {{project}}

## Attendees

-

## Agenda

1.
2.
3.

## Discussion Notes

### Topic 1

### Topic 2

## Action Items

- [ ]
- [ ]

## Next Steps
```

**Use Cases:**

- Team meetings
- Sprint planning
- Retrospectives
- Client meetings

### 3. Technical Documentation Template

**Name:** `technical-doc`

**Purpose:** Comprehensive technical documentation for features, systems, or architectures.

**Required Variables:**

- `title` - Document title
- `project` - Project name
- `author` - Document author
- `date` - Creation date (auto-filled)

**Structure:**

```markdown
---
title: '{{title}}'
type: technical-doc
project: { { project } }
author: { { author } }
date: { { date } }
tags:
  - technical
  - documentation
---

# {{title}}

**Project:** {{project}}  
**Author:** {{author}}  
**Date:** {{date}}

## Overview

## Architecture

## Implementation Details

## API Reference

## Examples

## Testing

## Deployment

## Maintenance
```

**Use Cases:**

- Architecture decisions
- System design
- Feature specifications
- Technical proposals

### 4. API Documentation Template

**Name:** `api-doc`

**Purpose:** API endpoint documentation with request/response examples and authentication details.

**Required Variables:**

- `title` - API documentation title
- `project` - API/Service name
- `author` - Documentation author
- `date` - Creation date (auto-filled)

**Structure:**

```markdown
---
title: '{{title}}'
type: api-documentation
project: { { project } }
author: { { author } }
date: { { date } }
tags:
  - api
  - documentation
---

# {{title}}

**Service:** {{project}}  
**Author:** {{author}}  
**Last Updated:** {{date}}

## Base URL
```

https://api.example.com/v1

````

## Authentication



## Endpoints

### Endpoint 1

**Method:** GET
**Path:** `/endpoint`

**Description:**


**Request:**
```json
{

}
````

**Response:**

```json
{}
```

**Status Codes:**

- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## Rate Limiting

## Error Handling

````

**Use Cases:**
- REST API documentation
- Endpoint specifications
- Integration guides
- API reference

### 5. Project Update Template

**Name:** `project-update`

**Purpose:** Weekly or sprint status update with metrics, achievements, and blockers.

**Required Variables:**
- `title` - Update title
- `project` - Project name
- `author` - Report author
- `date` - Report date (auto-filled)
- `period` - Time period (e.g., "Week of Nov 2-8" or "Sprint 23")

**Structure:**
```markdown
---
title: "{{title}}"
type: project-update
project: {{project}}
author: {{author}}
date: {{date}}
period: {{period}}
tags:
  - status-update
  - {{project}}
---

# {{title}}

**Project:** {{project}}
**Period:** {{period}}
**Author:** {{author}}
**Date:** {{date}}

## Summary



## Metrics

- **Completed:**
- **In Progress:**
- **Blocked:**

## Achievements

-

## Challenges



## Next Period Goals

1.
2.
3.

## Blockers



## Notes


````

**Use Cases:**

- Status reports
- Sprint reviews
- Stakeholder updates
- Progress tracking

---

## Creating Custom Templates

### Using `createTemplate()`

```typescript
import { createTemplate } from './templates';

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
```

### Custom Template Best Practices

**1. Include YAML frontmatter:**

```markdown
---
title: '{{title}}'
type: custom-template
created: { { date } }
tags:
  - custom
---
```

**2. Use descriptive variable names:**

```markdown
{{project_name}} # Good
{{pn}} # Bad
```

**3. Provide structure with headings:**

```markdown
## Section 1

{{content1}}

## Section 2

{{content2}}
```

**4. Include examples and placeholders:**

````markdown
## Examples

```json
{
  "example": "{{example_value}}"
}
```
````

````

**5. Document required variables:**
```markdown
<!-- Required variables:
  - title: Document title
  - author: Author name
  - description: Brief description
-->
````

---

## Variable Substitution

### How It Works

1. **Template contains placeholders:**

   ```markdown
   # {{title}}

   Author: {{author}}
   ```

2. **You provide values:**

   ```javascript
   {
     title: 'My Document',
     author: 'John Doe'
   }
   ```

3. **System renders final document:**

   ```markdown
   # My Document

   Author: John Doe
   ```

### Variable Types

**String Variables:**

```javascript
{
  title: 'API Documentation',
  author: 'Engineering Team',
  description: 'Complete API reference'
}
```

**Auto-Filled Variables:**

```javascript
{
  // These are filled automatically if not provided
  date: '2025-11-13',
  time: '14:30',
  year: '2025'
}
```

**Optional Variables:**

```javascript
{
  title: 'Required',
  optional_field: 'Provided if needed'
  // Missing optional fields are left as {{variable}}
}
```

### Variable Validation

**Missing Required Variables:**

```javascript
// Error: Missing required variable 'title'
renderTemplate('meeting-notes', {
  date: '2025-11-13',
  // Missing: title, project
});
```

**Correct Usage:**

```javascript
// Success
renderTemplate('meeting-notes', {
  title: 'Sprint Planning',
  project: 'My App',
  // date and time auto-filled
});
```

---

## Integration with MCP

### Using `list_templates` Tool

```javascript
// List all available templates
const result = list_templates();

console.log('Available templates:', result.templates.length);
result.templates.forEach((t) => {
  console.log(`- ${t.name}: ${t.description}`);
  console.log(`  Variables: ${t.variables.join(', ')}`);
});
```

**Response:**

```json
{
  "templates": [
    {
      "name": "meeting-notes",
      "description": "Meeting notes with attendees and action items",
      "variables": ["title", "date", "time", "project"]
    },
    {
      "name": "api-doc",
      "description": "API endpoint documentation",
      "variables": ["title", "project", "author", "date"]
    }
  ],
  "count": 5
}
```

### Using `create_from_template` Tool

```javascript
// Create meeting notes
create_from_template({
  template_name: 'meeting-notes',
  filename: 'meetings/2025-11-13-standup.md',
  variables: {
    title: 'Daily Standup',
    project: 'My Web App',
    // date and time auto-filled
  },
});
```

**Response:**

```json
{
  "success": true,
  "path": "meetings/2025-11-13-standup.md",
  "template": "meeting-notes",
  "project_folder": "my-project",
  "message": "Note created from template successfully"
}
```

---

## Best Practices

### Choosing Templates

**1. Match template to document type:**

```javascript
// Good - Right template for purpose
create_from_template({
  template_name: 'meeting-notes',
  filename: 'meetings/standup.md',
});

// Bad - Wrong template
create_from_template({
  template_name: 'api-doc',
  filename: 'meetings/standup.md',
});
```

**2. Use consistent naming:**

```javascript
// Good - Consistent date format
filename: 'meetings/2025-11-13-standup.md';

// Bad - Inconsistent
filename: 'meetings/nov-13-standup.md';
```

### Providing Variables

**1. Provide all required variables:**

```javascript
// Good
create_from_template({
  template_name: 'technical-doc',
  filename: 'docs/architecture.md',
  variables: {
    title: 'System Architecture',
    project: 'My App',
    author: 'Engineering Team',
    // date auto-filled
  },
});
```

**2. Use descriptive values:**

```javascript
// Good - Clear and specific
variables: {
  title: 'User Authentication System Architecture',
  author: 'Security Team',
}

// Bad - Vague
variables: {
  title: 'Stuff',
  author: 'Me',
}
```

### Template Organization

**1. Organize by type:**

```
meetings/
  2025-11-13-standup.md
  2025-11-13-planning.md
docs/
  api/
    users-endpoint.md
    auth-endpoint.md
  architecture/
    system-design.md
```

**2. Use frontmatter for metadata:**

```markdown
---
title: 'Meeting Notes'
type: meeting-notes
project: my-app
tags:
  - meeting
  - standup
---
```

---

## Examples

### Example 1: Create Meeting Notes

```javascript
create_from_template({
  template_name: 'meeting-notes',
  filename: 'meetings/2025-11-13-sprint-planning.md',
  variables: {
    title: 'Sprint 23 Planning',
    project: 'E-commerce Platform',
  },
});
```

**Result:**

```markdown
---
title: 'Sprint 23 Planning'
type: meeting-notes
date: 2025-11-13
time: 14:30
project: E-commerce Platform
tags:
  - meeting
  - E-commerce Platform
---

# Sprint 23 Planning

**Date:** 2025-11-13  
**Time:** 14:30  
**Project:** E-commerce Platform

## Attendees

-

## Agenda

1.
2.
3.

...
```

### Example 2: Create API Documentation

```javascript
create_from_template({
  template_name: 'api-doc',
  filename: 'docs/api/users-endpoint.md',
  variables: {
    title: 'Users API Documentation',
    project: 'User Service API v1',
    author: 'API Team',
  },
});
```

### Example 3: Create Changelog

```javascript
create_from_template({
  template_name: 'changelog',
  filename: 'CHANGELOG.md',
  variables: {
    project: 'My Web App',
    version: '2.0.0',
  },
});
```

### Example 4: Create Technical Documentation

```javascript
create_from_template({
  template_name: 'technical-doc',
  filename: 'docs/architecture/auth-system.md',
  variables: {
    title: 'Authentication System Architecture',
    project: 'User Management Service',
    author: 'Engineering Team',
  },
});
```

### Example 5: Create Project Update

```javascript
create_from_template({
  template_name: 'project-update',
  filename: 'updates/2025-11-sprint-23.md',
  variables: {
    title: 'Sprint 23 Review',
    project: 'Mobile App Rewrite',
    author: 'Project Manager',
    period: 'Week of Nov 2-8, 2025',
  },
});
```

### Example 6: Batch Create Multiple Notes

```javascript
batch_write_notes({
  notes: [
    {
      path: 'meetings/2025-11-13-standup.md',
      content: renderTemplate('meeting-notes', {
        title: 'Daily Standup',
        project: 'My App',
      }),
      mode: 'create',
    },
    {
      path: 'docs/api/users.md',
      content: renderTemplate('api-doc', {
        title: 'Users API',
        project: 'My App',
        author: 'API Team',
      }),
      mode: 'create',
    },
  ],
});
```

---

## Related Documentation

- **[Core Tools](../tools/core-tools.md)** - Basic note operations
- **[Template System Implementation](../../src/templates/README.md)** - Technical details
- **[Examples](../examples/common-workflows.md)** - More workflow examples

---

**Next:** [Vault Organization Guide](./vault-organization.md) →

**Previous:** [← Sessions Guide](./sessions.md)
