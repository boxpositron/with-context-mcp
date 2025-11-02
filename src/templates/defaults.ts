/**
 * Default templates for the Obsidian Context MCP server
 * Each template includes YAML frontmatter and uses {{variable}} syntax for replacements
 */

import { Template } from './index.js';

export const DEFAULT_TEMPLATES: Record<string, Template> = {
  changelog: {
    name: 'changelog',
    description: 'Standard CHANGELOG.md format for tracking project changes',
    variables: ['project', 'version', 'date'],
    content: `---
title: "{{project}} - Changelog"
type: changelog
version: "{{version}}"
created: {{date}}
tags:
  - changelog
  - releases
  - {{project}}
---

# Changelog - {{project}}

All notable changes to {{project}} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [{{version}}] - {{date}}

### Added
- 

### Changed
- 

### Deprecated
- 

### Removed
- 

### Fixed
- 

### Security
- 

---

## Previous Versions

### [Unreleased]
- Changes that are in development but not yet released

---

**Legend:**
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security fixes
`
  },

  'meeting-notes': {
    name: 'meeting-notes',
    description: 'Meeting notes template with agenda, attendees, and action items',
    variables: ['title', 'date', 'time', 'project'],
    content: `---
title: "{{title}}"
type: meeting-notes
date: {{date}}
time: {{time}}
project: {{project}}
tags:
  - meeting
  - {{project}}
attendees: []
---

# {{title}}

**Date:** {{date}} at {{time}}  
**Project:** {{project}}  
**Attendees:** 
- 

---

## Agenda

1. 
2. 
3. 

---

## Discussion Notes

### Topic 1: 

**Key Points:**
- 

**Decisions Made:**
- 

### Topic 2:

**Key Points:**
- 

**Decisions Made:**
- 

---

## Action Items

- [ ] **[Owner]** - Action item description | Due: YYYY-MM-DD
- [ ] **[Owner]** - Action item description | Due: YYYY-MM-DD

---

## Next Meeting

**Date:** TBD  
**Topics:**
- 

---

## Notes & References

- 
`
  },

  'technical-doc': {
    name: 'technical-doc',
    description: 'Technical documentation structure for features, systems, or architectures',
    variables: ['title', 'project', 'author', 'date'],
    content: `---
title: "{{title}}"
type: technical-documentation
project: {{project}}
author: {{author}}
created: {{date}}
updated: {{date}}
status: draft
tags:
  - technical-doc
  - {{project}}
  - architecture
---

# {{title}}

**Project:** {{project}}  
**Author:** {{author}}  
**Last Updated:** {{date}}  
**Status:** Draft

---

## Overview

### Purpose
Brief description of what this document covers and why it exists.

### Scope
What is included and what is out of scope.

---

## Architecture

### High-Level Design

\`\`\`
[Add diagrams, flowcharts, or ASCII diagrams here]
\`\`\`

### Components

#### Component 1
**Purpose:**  
**Responsibilities:**  
**Dependencies:**  

#### Component 2
**Purpose:**  
**Responsibilities:**  
**Dependencies:**  

---

## Technical Specifications

### Technologies Used
- **Language:** 
- **Framework:** 
- **Database:** 
- **Infrastructure:** 

### Data Models

\`\`\`typescript
// Add data models, schemas, or interfaces here
\`\`\`

### API Contracts

\`\`\`typescript
// Add API interfaces or contracts here
\`\`\`

---

## Implementation Details

### Key Algorithms
Description of critical algorithms or business logic.

### Performance Considerations
- 
- 

### Security Considerations
- 
- 

---

## Testing Strategy

### Unit Tests
- 

### Integration Tests
- 

### E2E Tests
- 

---

## Deployment

### Prerequisites
- 
- 

### Deployment Steps
1. 
2. 
3. 

### Environment Variables
\`\`\`bash
VARIABLE_NAME=description
\`\`\`

---

## Monitoring & Observability

### Metrics to Track
- 

### Alerts
- 

### Logging
- 

---

## Maintenance & Support

### Known Issues
- 

### Future Improvements
- 

### Contact
- **Owner:** {{author}}
- **Team:** 

---

## References

- [Link to related documentation]
- [Link to external resources]
`
  },

  'api-doc': {
    name: 'api-doc',
    description: 'API endpoint documentation with request/response examples',
    variables: ['title', 'project', 'author', 'date'],
    content: `---
title: "{{title}}"
type: api-documentation
project: {{project}}
author: {{author}}
created: {{date}}
updated: {{date}}
tags:
  - api
  - documentation
  - {{project}}
---

# {{title}}

**Project:** {{project}}  
**Author:** {{author}}  
**Last Updated:** {{date}}

---

## Base URL

\`\`\`
https://api.example.com/v1
\`\`\`

---

## Authentication

**Type:** Bearer Token / API Key / OAuth 2.0

**Header:**
\`\`\`http
Authorization: Bearer YOUR_TOKEN_HERE
\`\`\`

**Example:**
\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.example.com/v1/resource
\`\`\`

---

## Endpoints

### GET /resource

**Description:** Retrieve a list of resources

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`limit\` | integer | No | Maximum number of results (default: 20) |
| \`offset\` | integer | No | Pagination offset (default: 0) |
| \`filter\` | string | No | Filter criteria |

**Request Example:**
\`\`\`bash
curl -X GET "https://api.example.com/v1/resource?limit=10&offset=0" \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "data": [
    {
      "id": "123",
      "name": "Example Resource",
      "created_at": "2025-11-02T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
\`\`\`

**Error Responses:**
- \`401 Unauthorized\` - Invalid or missing authentication token
- \`403 Forbidden\` - Insufficient permissions
- \`429 Too Many Requests\` - Rate limit exceeded

---

### POST /resource

**Description:** Create a new resource

**Authentication:** Required

**Request Body:**
\`\`\`json
{
  "name": "New Resource",
  "description": "Resource description",
  "metadata": {
    "key": "value"
  }
}
\`\`\`

**Request Example:**
\`\`\`bash
curl -X POST "https://api.example.com/v1/resource" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Resource",
    "description": "Resource description"
  }'
\`\`\`

**Response (201 Created):**
\`\`\`json
{
  "id": "124",
  "name": "New Resource",
  "description": "Resource description",
  "created_at": "2025-11-02T00:00:00Z",
  "updated_at": "2025-11-02T00:00:00Z"
}
\`\`\`

**Error Responses:**
- \`400 Bad Request\` - Invalid request body
- \`401 Unauthorized\` - Invalid or missing authentication token
- \`422 Unprocessable Entity\` - Validation errors

---

### PUT /resource/:id

**Description:** Update an existing resource

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`id\` | string | Yes | Resource ID |

**Request Body:**
\`\`\`json
{
  "name": "Updated Resource Name",
  "description": "Updated description"
}
\`\`\`

**Response (200 OK):**
\`\`\`json
{
  "id": "124",
  "name": "Updated Resource Name",
  "description": "Updated description",
  "updated_at": "2025-11-02T00:00:00Z"
}
\`\`\`

---

### DELETE /resource/:id

**Description:** Delete a resource

**Authentication:** Required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| \`id\` | string | Yes | Resource ID |

**Response (204 No Content)**

**Error Responses:**
- \`404 Not Found\` - Resource not found

---

## Rate Limiting

- **Rate:** 100 requests per minute per API key
- **Header:** \`X-RateLimit-Remaining\`
- **Reset Header:** \`X-RateLimit-Reset\`

---

## Error Handling

All errors follow this format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
\`\`\`

---

## Webhooks

**Endpoint:** Configure in dashboard  
**Events:** \`resource.created\`, \`resource.updated\`, \`resource.deleted\`

**Payload Example:**
\`\`\`json
{
  "event": "resource.created",
  "data": {
    "id": "124",
    "name": "New Resource"
  },
  "timestamp": "2025-11-02T00:00:00Z"
}
\`\`\`

---

## SDKs & Libraries

- **JavaScript/TypeScript:** [Link to SDK]
- **Python:** [Link to SDK]
- **Go:** [Link to SDK]

---

## Changelog

### v1.0.0 - {{date}}
- Initial API release

---

## Support

- **Documentation:** https://docs.example.com
- **Support Email:** support@example.com
- **Status Page:** https://status.example.com
`
  },

  'project-update': {
    name: 'project-update',
    description: 'Weekly or sprint update format for project status reports',
    variables: ['title', 'project', 'author', 'date', 'period'],
    content: `---
title: "{{title}}"
type: project-update
project: {{project}}
author: {{author}}
date: {{date}}
period: {{period}}
tags:
  - project-update
  - {{project}}
  - status-report
---

# {{title}}

**Project:** {{project}}  
**Period:** {{period}}  
**Author:** {{author}}  
**Date:** {{date}}

---

## Executive Summary

Brief 2-3 sentence overview of the week/sprint. Highlight key achievements and any critical issues.

**Status:** 🟢 On Track | 🟡 At Risk | 🔴 Blocked

---

## Key Achievements

### Completed This Week
- ✅ **[Feature/Task Name]** - Brief description of what was completed
- ✅ **[Feature/Task Name]** - Brief description of what was completed
- ✅ **[Feature/Task Name]** - Brief description of what was completed

### Metrics & Impact
- **Deployments:** X production releases
- **Bug Fixes:** X critical bugs resolved
- **Performance:** Y% improvement in [metric]
- **User Impact:** Z users affected/benefited

---

## Work In Progress

### Active Tasks
- 🔄 **[Task Name]** - Current status and ETA
  - Progress: 60% complete
  - Blocker: None
  - ETA: {{date}}

- 🔄 **[Task Name]** - Current status and ETA
  - Progress: 30% complete
  - Blocker: Waiting on [dependency]
  - ETA: TBD

---

## Upcoming Next Week

### Planned Work
1. **[High Priority Task]** - Description
2. **[High Priority Task]** - Description
3. **[Medium Priority Task]** - Description

### Goals
- Goal 1: Specific, measurable outcome
- Goal 2: Specific, measurable outcome

---

## Blockers & Risks

### Current Blockers
- 🚫 **[Blocker Description]**
  - Impact: High/Medium/Low
  - Owner: [Name]
  - Action Required: [What needs to happen]

### Risks
- ⚠️ **[Risk Description]**
  - Probability: High/Medium/Low
  - Impact: High/Medium/Low
  - Mitigation: [Plan to address]

---

## Team Updates

### Team Capacity
- **Available:** X developers
- **OOO/PTO:** Y team members
- **Total Capacity:** Z%

### Team Needs
- [ ] Additional resources for [area]
- [ ] Support from [team/person]
- [ ] Decision needed on [topic]

---

## Technical Debt & Improvements

### Addressed This Week
- 

### Planned Improvements
- 

---

## Key Decisions Made

1. **[Decision Title]**
   - Context: Why this decision was needed
   - Decision: What was decided
   - Impact: Expected outcomes

---

## Metrics & KPIs

| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| Deployment Frequency | X/week | Y/week | ↗️ |
| Bug Resolution Time | X hours | Y hours | → |
| Code Coverage | X% | Y% | ↗️ |
| API Response Time | X ms | Y ms | ↘️ |

---

## Highlights & Learnings

### What Went Well
- 
- 

### What Could Be Improved
- 
- 

### Key Learnings
- 
- 

---

## Dependencies & Collaboration

### Waiting On
- **[Team/Person]** - [What we need]

### Supporting
- **[Team/Project]** - [What we're providing]

---

## Questions & Feedback

- 

---

## Links & Resources

- [Link to sprint board]
- [Link to documentation]
- [Link to metrics dashboard]

---

**Next Update:** [Date of next update]
`
  }
};
