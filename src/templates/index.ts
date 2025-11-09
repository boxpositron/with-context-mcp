/**
 * Template manager for the Obsidian Context MCP server
 * Provides template loading, rendering, and variable substitution
 */

import { DEFAULT_TEMPLATES } from './defaults.js';

/**
 * Represents a variable in a template
 */
export interface TemplateVariable {
  key: string;
  value: string;
}

/**
 * Represents a template with metadata
 */
export interface Template {
  name: string;
  description: string;
  content: string;
  variables: string[]; // List of required variables
}

/**
 * Get all default built-in templates
 * @returns Record of template name to template object
 */
export function getDefaultTemplates(): Record<string, Template> {
  return DEFAULT_TEMPLATES;
}

/**
 * Get a list of all available templates with their metadata
 * @returns Array of template objects
 */
export function listTemplates(): Template[] {
  return Object.values(DEFAULT_TEMPLATES);
}

/**
 * Get a specific template by name
 * @param templateName - Name of the template to retrieve
 * @returns Template object or undefined if not found
 */
export function getTemplate(templateName: string): Template | undefined {
  return DEFAULT_TEMPLATES[templateName];
}

/**
 * Get auto-filled common variables
 * @returns Record of common variable names to their values
 */
function getAutoVariables(): Record<string, string> {
  const now = new Date();

  // Format date as YYYY-MM-DD
  const date = now.toISOString().split('T')[0];

  // Format time as HH:MM
  const time = now.toTimeString().split(' ')[0].substring(0, 5);

  // Format datetime as ISO string
  const datetime = now.toISOString();

  // Get day of week
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Get month name
  const month = now.toLocaleDateString('en-US', { month: 'long' });

  // Get year
  const year = now.getFullYear().toString();

  return {
    date,
    time,
    datetime,
    year,
    month,
    dayOfWeek,
    day: now.getDate().toString(),
  };
}

/**
 * Render a template by replacing variables with their values
 * @param templateName - Name of the template to render
 * @param variables - Record of variable names to their values
 * @returns Rendered template string
 * @throws Error if template is not found or required variables are missing
 */
export function renderTemplate(
  templateName: string,
  variables: Record<string, string> = {}
): string {
  const template = getTemplate(templateName);

  if (!template) {
    throw new Error(`Template '${templateName}' not found`);
  }

  // Merge auto variables with user-provided variables
  // User variables take precedence
  const allVariables = {
    ...getAutoVariables(),
    ...variables,
  };

  // Check for missing required variables
  const missingVariables = template.variables.filter((varName) => !(varName in allVariables));

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required variables for template '${templateName}': ${missingVariables.join(', ')}`
    );
  }

  // Replace all {{variable}} placeholders with their values
  let rendered = template.content;

  for (const [key, value] of Object.entries(allVariables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(regex, value);
  }

  return rendered;
}

/**
 * Extract all variable placeholders from a template string
 * @param content - Template content to analyze
 * @returns Array of unique variable names found in the template
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

/**
 * Validate that a template has all required variables defined
 * @param template - Template to validate
 * @returns True if template is valid, false otherwise
 */
export function validateTemplate(template: Template): boolean {
  const declaredVariables = new Set(template.variables);
  const usedVariables = extractVariables(template.content);

  // Check if all used variables are declared
  for (const varName of usedVariables) {
    // Skip auto-filled variables
    const autoVars = Object.keys(getAutoVariables());
    if (!autoVars.includes(varName) && !declaredVariables.has(varName)) {
      return false;
    }
  }

  return true;
}

/**
 * Create a custom template
 * @param name - Template name
 * @param description - Template description
 * @param content - Template content with {{variable}} placeholders
 * @returns Template object
 */
export function createTemplate(name: string, description: string, content: string): Template {
  const variables = extractVariables(content);

  // Filter out auto-filled variables from required variables
  const autoVars = Object.keys(getAutoVariables());
  const requiredVariables = variables.filter((v) => !autoVars.includes(v));

  return {
    name,
    description,
    content,
    variables: requiredVariables,
  };
}
