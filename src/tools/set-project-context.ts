import { z } from 'zod';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';

export const setProjectContextSchema = z.object({
  project_folder: z.string().min(1).describe('The project folder name within the vault'),
});

export type SetProjectContextInput = z.infer<typeof setProjectContextSchema>;

export async function setProjectContext(input: SetProjectContextInput): Promise<string> {
  const { project_folder } = input;
  
  // Set the project context for this session
  sessionState.setProjectContext(project_folder, config.projectBasePath);
  
  const context = sessionState.getCurrentContext();
  const fullPath = `${context!.basePath}/${context!.projectFolder}`;
  
  return JSON.stringify({
    success: true,
    message: `Project context set to: ${fullPath}`,
    project_folder: context!.projectFolder,
    base_path: context!.basePath,
    full_vault_path: fullPath,
  }, null, 2);
}
