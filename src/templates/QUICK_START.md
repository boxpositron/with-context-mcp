# Template System - Quick Start Guide

## Installation

The template system is already integrated. Import from `./templates`:

```typescript
import { renderTemplate, listTemplates } from './templates';
```

## 5-Second Start

```typescript
import { renderTemplate } from './templates';

// Create meeting notes
const notes = renderTemplate('meeting-notes', {
  title: 'Sprint Planning',
  project: 'My Project'
});

// date and time are auto-filled!
```

## Available Templates

| Template | Use Case | Required Variables |
|----------|----------|-------------------|
| `changelog` | Version history | `project`, `version` |
| `meeting-notes` | Team meetings | `title`, `project` |
| `technical-doc` | Architecture docs | `title`, `project`, `author` |
| `api-doc` | API documentation | `title`, `project`, `author` |
| `project-update` | Status reports | `title`, `project`, `author`, `period` |

## Common Patterns

### 1. List All Templates

```typescript
import { listTemplates } from './templates';

listTemplates().forEach(t => {
  console.log(`${t.name}: ${t.description}`);
});
```

### 2. Create Daily Meeting Notes

```typescript
const notes = renderTemplate('meeting-notes', {
  title: 'Daily Standup',
  project: 'Sprint 23'
  // date: 2025-11-02 (auto)
  // time: 09:00 (auto)
});
```

### 3. Generate Changelog

```typescript
const changelog = renderTemplate('changelog', {
  project: 'My App',
  version: '2.1.0'
  // date: 2025-11-02 (auto)
});
```

### 4. Create Technical Docs

```typescript
const docs = renderTemplate('technical-doc', {
  title: 'Auth System Design',
  project: 'User Service',
  author: 'Engineering Team'
  // date: 2025-11-02 (auto)
});
```

### 5. Document API Endpoints

```typescript
const apiDocs = renderTemplate('api-doc', {
  title: 'Users API',
  project: 'User Service v1',
  author: 'API Team'
  // date: 2025-11-02 (auto)
});
```

### 6. Weekly Status Report

```typescript
const update = renderTemplate('project-update', {
  title: 'Week 44 Update',
  project: 'Mobile Rewrite',
  author: 'PM Team',
  period: 'Nov 2-8, 2025'
  // date: 2025-11-02 (auto)
});
```

## Auto-Filled Variables

Never provide these - they're automatic:

- `{{date}}` → `2025-11-02`
- `{{time}}` → `14:17`
- `{{year}}` → `2025`
- `{{month}}` → `November`
- `{{dayOfWeek}}` → `Saturday`

## Error Handling

```typescript
try {
  const content = renderTemplate('api-doc', {
    title: 'My API'
    // Missing: project, author
  });
} catch (error) {
  console.error(error.message);
  // "Missing required variables..."
}
```

## Custom Templates

```typescript
import { createTemplate } from './templates';

const custom = createTemplate(
  'daily-note',
  'Daily journal entry',
  `# {{date}}

## Mood
{{mood}}

## Tasks
- [ ] Task 1
`
);

// Use it
const entry = renderTemplate('daily-note', {
  mood: 'Productive'
  // date is auto-filled
});
```

## Testing

Run all examples:

```bash
npx tsx examples/template-examples.ts
```

## Pro Tips

1. **Override auto-fill**: Provide your own `date` or `time` to override
2. **Check requirements**: Use `getTemplate(name).variables` to see what's needed
3. **Validate first**: Use `validateTemplate()` for custom templates
4. **Extract vars**: Use `extractVariables()` to analyze template content
5. **Keep simple**: Stick to `{{variable}}` syntax - no complex logic needed

## Integration Example

```typescript
// MCP Server Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'create_from_template') {
    const { template, notePath, variables } = request.params.arguments;
    
    // Render
    const content = renderTemplate(template, variables);
    
    // Write to vault
    await obsidianClient.writeNote(notePath, content);
    
    return { 
      content: [{ 
        type: 'text', 
        text: `Created ${template} note at ${notePath}` 
      }]
    };
  }
});
```

## Need More?

- **Full Documentation**: See `README.md` for complete API reference
- **Examples**: Check `examples/template-examples.ts` for 10+ examples
- **Overview**: Read `TEMPLATE_SYSTEM.md` for implementation details

## Quick Reference Card

```
╔══════════════════════════════════════════════════════════════╗
║                    TEMPLATE QUICK REFERENCE                   ║
╠══════════════════════════════════════════════════════════════╣
║ Import:                                                       ║
║   import { renderTemplate } from './templates'               ║
║                                                               ║
║ Usage:                                                        ║
║   renderTemplate('meeting-notes', { title, project })        ║
║                                                               ║
║ Templates:                                                    ║
║   • changelog          - Version history tracking            ║
║   • meeting-notes      - Team meeting documentation          ║
║   • technical-doc      - Architecture & design docs          ║
║   • api-doc            - API endpoint documentation          ║
║   • project-update     - Weekly/sprint status reports        ║
║                                                               ║
║ Auto Variables: date, time, year, month, dayOfWeek          ║
║                                                               ║
║ Create Custom:                                                ║
║   createTemplate('name', 'desc', 'content with {{vars}}')   ║
╚══════════════════════════════════════════════════════════════╝
```

---

**Ready to go!** 🚀 Start with `renderTemplate()` and you're done.
