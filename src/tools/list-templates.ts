import { z } from 'zod';
import { listTemplates } from '../templates/index.js';

export const listTemplatesSchema = z.object({});

export type ListTemplatesInput = z.infer<typeof listTemplatesSchema>;

export async function listTemplatesHandler(_input: ListTemplatesInput): Promise<string> {
  // Get all available templates
  const templates = listTemplates();

  // Transform to response format
  const formattedTemplates = templates.map((template) => ({
    name: template.name,
    description: template.description,
    variables: template.variables,
  }));

  // Return success response with template list
  return JSON.stringify(
    {
      success: true,
      total: formattedTemplates.length,
      templates: formattedTemplates,
    },
    null,
    2
  );
}
