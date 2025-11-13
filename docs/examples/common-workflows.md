# Common Workflows

Complete, copy-paste examples for common documentation tasks with with-context-mcp.

## Table of Contents

- [Daily Note Creation](#daily-note-creation)
- [Meeting Notes Workflow](#meeting-notes-workflow)
- [Documentation Workflow](#documentation-workflow)
- [Project Setup Workflow](#project-setup-workflow)
- [Session-Based Development](#session-based-development)
- [Vault Cleanup Workflow](#vault-cleanup-workflow)
- [API Documentation Workflow](#api-documentation-workflow)
- [Changelog Management](#changelog-management)

---

## Daily Note Creation

Create daily notes with consistent structure for journaling, task tracking, and daily planning.

### Workflow

```javascript
// 1. Set project context
set_project_context({
  project_folder: 'personal',
});

// 2. Create today's daily note
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

write_note({
  path: `daily/${today}.md`,
  content: `---
title: "Daily Note - ${today}"
date: ${today}
tags:
  - daily
  - journal
---

# Daily Note - ${today}

## 🎯 Goals

- [ ] 
- [ ] 
- [ ] 

## 📝 Notes



## ✅ Completed

- 

## 💭 Reflections



## 🔗 Links

- [[${new Date(Date.now() - 86400000).toISOString().split('T')[0]}|Yesterday]]
- [[${new Date(Date.now() + 86400000).toISOString().split('T')[0]}|Tomorrow]]
`,
  mode: 'create',
});

// 3. Add todo for the day
add_todo({
  content: 'Review daily goals',
  priority: 'high',
});
```

### Output

Creates a structured daily note at `daily/2025-11-13.md` with:

- Goals section with checkboxes
- Notes area for free-form content
- Completed tasks tracking
- Reflections section
- Links to previous/next day

---

## Meeting Notes Workflow

Document meetings with attendees, agenda, discussion, and action items.

### Workflow

```javascript
// 1. Set project context
set_project_context({
  project_folder: 'my-team',
});

// 2. Create meeting note from template
create_from_template({
  template_name: 'meeting-notes',
  filename: 'meetings/2025-11-13-sprint-planning.md',
  variables: {
    title: 'Sprint 23 Planning',
    project: 'E-commerce Platform',
    // date and time auto-filled
  },
});

// 3. Read the template to fill in details
const note = read_note({
  path: 'meetings/2025-11-13-sprint-planning.md',
});

// 4. Update with meeting details
write_note({
  path: 'meetings/2025-11-13-sprint-planning.md',
  content: `---
title: "Sprint 23 Planning"
type: meeting-notes
date: 2025-11-13
time: 14:00
project: E-commerce Platform
tags:
  - meeting
  - sprint-planning
---

# Sprint 23 Planning

**Date:** 2025-11-13  
**Time:** 14:00  
**Project:** E-commerce Platform

## Attendees

- Alice (Product Manager)
- Bob (Tech Lead)
- Charlie (Developer)
- Diana (Designer)

## Agenda

1. Review Sprint 22 outcomes
2. Plan Sprint 23 features
3. Discuss technical challenges
4. Assign tasks

## Discussion Notes

### Sprint 22 Review

- Completed 8/10 stories
- 2 stories carried over due to dependencies
- Good velocity overall

### Sprint 23 Planning

- Focus on checkout flow improvements
- Payment integration priority
- Performance optimization

### Technical Challenges

- Need to upgrade payment SDK
- Database migration required
- Testing environment setup

## Action Items

- [ ] @Alice: Create user stories for checkout flow
- [ ] @Bob: Plan database migration strategy
- [ ] @Charlie: Research payment SDK upgrade
- [ ] @Diana: Design new checkout UI

## Next Steps

- Sprint 23 starts Monday, Nov 16
- Daily standups at 9:30 AM
- Sprint review on Nov 27
`,
  mode: 'overwrite',
});

// 5. Add todos for action items
add_todo({
  content: 'Create user stories for checkout flow',
  priority: 'high',
});

add_todo({
  content: 'Plan database migration strategy',
  priority: 'high',
});

// 6. Track in changelog
add_changelog_entry({
  type: 'docs',
  message: 'Document Sprint 23 planning meeting',
  files: ['meetings/2025-11-13-sprint-planning.md'],
});
```

---

## Documentation Workflow

Create and maintain project documentation with consistent structure.

### Workflow

```javascript
// 1. Set project context
set_project_context({
  project_folder: 'my-web-app',
});

// 2. Create documentation structure
batch_write_notes({
  notes: [
    {
      path: 'docs/README.md',
      content: `# Documentation

## Table of Contents

- [Getting Started](./getting-started.md)
- [API Reference](./api/README.md)
- [Architecture](./architecture.md)
- [Contributing](./contributing.md)
`,
      mode: 'create',
    },
    {
      path: 'docs/getting-started.md',
      content: `# Getting Started

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

\`\`\`bash
cp .env.example .env
# Edit .env with your settings
\`\`\`

## Running

\`\`\`bash
npm run dev
\`\`\`
`,
      mode: 'create',
    },
    {
      path: 'docs/api/README.md',
      content: `# API Reference

## Endpoints

- [Users](./users.md)
- [Authentication](./auth.md)
- [Products](./products.md)
`,
      mode: 'create',
    },
  ],
});

// 3. Create API documentation from template
create_from_template({
  template_name: 'api-doc',
  filename: 'docs/api/users.md',
  variables: {
    title: 'Users API Documentation',
    project: 'My Web App API v1',
    author: 'API Team',
  },
});

// 4. Update frontmatter for organization
update_frontmatter({
  path: 'docs/api/users.md',
  frontmatter: {
    tags: ['api', 'users', 'reference'],
    version: '1.0.0',
    status: 'published',
  },
  mode: 'merge',
});

// 5. Track documentation changes
add_changelog_entry({
  type: 'docs',
  message: 'Create initial API documentation structure',
  files: ['docs/README.md', 'docs/getting-started.md', 'docs/api/README.md', 'docs/api/users.md'],
});
```

---

## Project Setup Workflow

Initialize a new project with proper documentation structure.

### Workflow

```javascript
// 1. Health check
health_check({
  project_folder: 'new-project',
});

// 2. Intelligent setup
setup_notes({
  project_root: '/path/to/new-project',
  create_structure: true,
  auto_apply: true,
});

// 3. Set project context
set_project_context({
  project_folder: 'new-project',
});

// 4. Start session
start_session({
  project_folder: 'new-project',
  message: 'Initial project setup',
});

// 5. Create README
write_note({
  path: 'README.md',
  content: `# New Project

Brief description of the project.

## Features

- Feature 1
- Feature 2
- Feature 3

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Documentation

See [docs/](./docs/) for detailed documentation.

## License

MIT
`,
  mode: 'create',
});

// 6. Create initial documentation
batch_write_notes({
  notes: [
    {
      path: 'docs/architecture.md',
      content: '# Architecture\n\nSystem architecture documentation.',
      mode: 'create',
    },
    {
      path: 'docs/api.md',
      content: '# API Reference\n\nAPI documentation.',
      mode: 'create',
    },
    {
      path: 'CONTRIBUTING.md',
      content: '# Contributing\n\nContribution guidelines.',
      mode: 'create',
    },
  ],
});

// 7. Create changelog
create_from_template({
  template_name: 'changelog',
  filename: 'CHANGELOG.md',
  variables: {
    project: 'New Project',
    version: '0.1.0',
  },
});

// 8. Track setup
add_changelog_entry({
  type: 'chore',
  message: 'Initial project setup with documentation',
  files: ['README.md', 'docs/', 'CHANGELOG.md', 'CONTRIBUTING.md'],
});

// 9. End session
end_session({
  message: 'Project initialized with documentation structure',
});
```

---

## Session-Based Development

Track development work with sessions, changelogs, and todos.

### Workflow

```javascript
// 1. Start session
start_session({
  project_folder: 'my-app',
  message: 'Implementing user authentication',
});

// 2. Plan work with todos
add_todo({
  content: 'Implement JWT authentication',
  priority: 'high',
});

add_todo({
  content: 'Add login/logout endpoints',
  priority: 'high',
});

add_todo({
  content: 'Write authentication tests',
  priority: 'medium',
});

// 3. Work on first task
// (Edit src/auth.ts, src/tokens.ts)

// 4. Track completion
update_todo({
  todo_id: 'todo_jwt_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication with refresh tokens',
  files: ['src/auth.ts', 'src/tokens.ts'],
});

// 5. Continue with next task
update_todo({
  todo_id: 'todo_endpoints_...',
  status: 'in_progress',
});

// (Edit src/routes/auth.ts)

update_todo({
  todo_id: 'todo_endpoints_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'feature',
  message: 'Add login and logout endpoints',
  files: ['src/routes/auth.ts'],
});

// 6. Add tests
update_todo({
  todo_id: 'todo_tests_...',
  status: 'in_progress',
});

// (Write tests/auth.test.ts)

update_todo({
  todo_id: 'todo_tests_...',
  status: 'completed',
});

add_changelog_entry({
  type: 'test',
  message: 'Add comprehensive authentication tests',
  files: ['tests/auth.test.ts'],
});

// 7. Generate commit message
const commit = get_commit_suggestion({
  conventional: true,
});

console.log(commit.commit_message);
// Output:
// feat: add user authentication
//
// - Add JWT authentication with refresh tokens
// - Add login and logout endpoints
// - Add comprehensive authentication tests

// 8. Review session
const status = get_session_status({});
console.log('Duration:', status.duration);
console.log('Files modified:', status.context.files_modified);
console.log('Completed todos:', status.todos.completed);

// 9. End session
end_session({
  message: 'Authentication feature completed with tests',
});
```

---

## Vault Cleanup Workflow

Analyze and reorganize a disorganized vault.

### Workflow

```javascript
// 1. Set project context
set_project_context({
  project_folder: 'my-project',
});

// 2. Analyze current vault structure
const analysis = analyze_vault_structure({
  project_folder: 'my-project',
  include_content_analysis: true,
  detect_orphans: true,
  extract_keywords: true,
});

console.log('Analysis Results:');
console.log('- Total Files:', analysis.totalFiles);
console.log('- Total Size:', (analysis.totalSize / 1024 / 1024).toFixed(2), 'MB');
console.log('- Orphan Files:', analysis.orphanFiles.length);
console.log('- Categories:', Object.keys(analysis.categories));

// 3. Review orphan files
if (analysis.orphanFiles.length > 0) {
  console.log('\nOrphan Files (no links):');
  analysis.orphanFiles.forEach((file) => {
    console.log(`- ${file}`);
  });
}

// 4. Generate organization plan using preset
const plan = generate_organization_plan({
  project_folder: 'my-project',
  preset_id: 'clean', // or 'minimal', 'docs-as-code', 'research'
  min_confidence: 0.7,
  exclude_files: ['*.tmp', '*.log', 'drafts/**'],
});

console.log('\nOrganization Plan:');
console.log('- Total Suggestions:', plan.plan.total_suggestions);
console.log('- Files to Move:', plan.plan.estimated_impact.files_to_move);
console.log('- Files to Rename:', plan.plan.estimated_impact.files_to_rename);
console.log('- Links to Update:', plan.plan.estimated_impact.links_to_update);

// 5. Preview changes (dry run)
const preview = reorganize_vault({
  project_folder: 'my-project',
  plan: plan.plan,
  dry_run: true,
});

console.log('\nDry Run Preview:');
console.log(preview.summary);
console.log('Operations:', preview.operations.length);

// 6. Review warnings
if (plan.plan.warnings.length > 0) {
  console.log('\nWarnings:');
  plan.plan.warnings.forEach((warning) => {
    console.log(`[${warning.severity}] ${warning.message}`);
  });
}

// 7. Execute reorganization (after user confirms)
const result = reorganize_vault({
  project_folder: 'my-project',
  plan: plan.plan,
  dry_run: false,
  update_links: true,
  create_backup: true,
  min_confidence: 0.7,
});

console.log('\nReorganization Result:');
if (result.success) {
  console.log('✓ Success!', result.summary);
  console.log('  - Operations completed:', result.operations.length);
  console.log('  - Links updated:', result.linksUpdated);
  console.log('  - Files modified:', result.filesModified.length);
} else {
  console.error('✗ Failed!');
  console.error('  - Failed operations:', result.failedOperations.length);
  result.failedOperations.forEach((op) => {
    console.error(`    - ${op.operation.sourcePath}: ${op.error}`);
  });
}

// 8. Track cleanup in session
add_changelog_entry({
  type: 'chore',
  message: `Reorganize vault using ${plan.preset.name} preset`,
  files: result.filesModified,
});
```

---

## API Documentation Workflow

Create comprehensive API documentation for all endpoints.

### Workflow

```javascript
// 1. Set project context
set_project_context({
  project_folder: 'my-api',
});

// 2. Create API documentation structure
write_note({
  path: 'docs/api/README.md',
  content: `# API Reference

## Base URL

\`\`\`
https://api.example.com/v1
\`\`\`

## Authentication

All API requests require authentication using Bearer tokens.

## Endpoints

- [Users](./users.md)
- [Authentication](./auth.md)
- [Products](./products.md)
- [Orders](./orders.md)

## Rate Limiting

- 100 requests per minute per API key
- 1000 requests per hour per API key

## Error Codes

- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`429\` - Too Many Requests
- \`500\` - Internal Server Error
`,
  mode: 'create',
});

// 3. Create endpoint documentation from template
create_from_template({
  template_name: 'api-doc',
  filename: 'docs/api/users.md',
  variables: {
    title: 'Users API',
    project: 'My API v1',
    author: 'API Team',
  },
});

// 4. Update with endpoint details
replace_section({
  path: 'docs/api/users.md',
  heading: 'Endpoints',
  content: `## Endpoints

### GET /users

List all users with pagination.

**Parameters:**
- \`page\` (integer, optional) - Page number (default: 1)
- \`limit\` (integer, optional) - Items per page (default: 20, max: 100)
- \`sort\` (string, optional) - Sort field (default: created_at)

**Request:**
\`\`\`bash
curl -X GET "https://api.example.com/v1/users?page=1&limit=20" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

**Response:**
\`\`\`json
{
  "data": [
    {
      "id": "usr_123",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-11-13T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
\`\`\`

### GET /users/:id

Get a specific user by ID.

**Parameters:**
- \`id\` (string, required) - User ID

**Request:**
\`\`\`bash
curl -X GET "https://api.example.com/v1/users/usr_123" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

**Response:**
\`\`\`json
{
  "id": "usr_123",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-11-13T14:30:00Z",
  "updated_at": "2025-11-13T14:30:00Z"
}
\`\`\`

### POST /users

Create a new user.

**Request Body:**
\`\`\`json
{
  "email": "newuser@example.com",
  "name": "Jane Doe",
  "password": "securepassword123"
}
\`\`\`

**Request:**
\`\`\`bash
curl -X POST "https://api.example.com/v1/users" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"newuser@example.com","name":"Jane Doe","password":"securepassword123"}'
\`\`\`

**Response:**
\`\`\`json
{
  "id": "usr_456",
  "email": "newuser@example.com",
  "name": "Jane Doe",
  "created_at": "2025-11-13T15:00:00Z"
}
\`\`\`
`,
  mode: 'content-only',
});

// 5. Add metadata
update_frontmatter({
  path: 'docs/api/users.md',
  frontmatter: {
    tags: ['api', 'users', 'reference'],
    version: '1.0.0',
    status: 'published',
    endpoints: ['GET /users', 'GET /users/:id', 'POST /users'],
  },
  mode: 'merge',
});

// 6. Track documentation
add_changelog_entry({
  type: 'docs',
  message: 'Add comprehensive Users API documentation',
  files: ['docs/api/README.md', 'docs/api/users.md'],
});
```

---

## Changelog Management

Maintain a project changelog with conventional commit format.

### Workflow

```javascript
// 1. Set project context
set_project_context({
  project_folder: 'my-app',
});

// 2. Start session
start_session({
  project_folder: 'my-app',
  message: 'Sprint 23 development',
});

// 3. Track changes throughout sprint
add_changelog_entry({
  type: 'feature',
  message: 'Add user authentication',
  files: ['src/auth.ts', 'src/middleware/auth.ts'],
});

add_changelog_entry({
  type: 'feature',
  message: 'Add password reset flow',
  files: ['src/auth/reset.ts', 'src/routes/auth.ts'],
});

add_changelog_entry({
  type: 'fix',
  message: 'Fix memory leak in session cleanup',
  files: ['src/session.ts'],
});

add_changelog_entry({
  type: 'refactor',
  message: 'Refactor database connection pooling',
  files: ['src/db/pool.ts'],
});

add_changelog_entry({
  type: 'docs',
  message: 'Update API documentation',
  files: ['docs/api.md'],
});

add_changelog_entry({
  type: 'test',
  message: 'Add authentication tests',
  files: ['tests/auth.test.ts'],
});

// 4. Get session changelog
const changelog = get_session_changelog({});

console.log('Session Changelog:');
console.log(changelog.formatted);

// 5. Generate commit message
const commit = get_commit_suggestion({
  conventional: true,
});

console.log('\nSuggested Commit Message:');
console.log(commit.commit_message);

// 6. Update CHANGELOG.md
const changelogContent = `
## [2.0.0] - 2025-11-13

### Added
- User authentication with JWT
- Password reset flow

### Fixed
- Memory leak in session cleanup

### Changed
- Refactored database connection pooling

### Documentation
- Updated API documentation

### Tests
- Added comprehensive authentication tests
`;

write_note({
  path: 'CHANGELOG.md',
  content: changelogContent,
  mode: 'prepend', // Add to top of file
});

// 7. Track changelog update
add_changelog_entry({
  type: 'docs',
  message: 'Update CHANGELOG for v2.0.0',
  files: ['CHANGELOG.md'],
});

// 8. End session
end_session({
  message: 'Sprint 23 completed, v2.0.0 ready for release',
});
```

---

## Related Documentation

- **[Guides](../guides/README.md)** - Comprehensive guides
- **[Tool Reference](../tools/README.md)** - Complete API reference
- **[Getting Started](../getting-started.md)** - Installation and setup

---

**Previous:** [← Examples Overview](./README.md)
