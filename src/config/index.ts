import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Configuration schema for the MCP server
 */
const ConfigSchema = z.object({
  // Obsidian REST API settings
  obsidianApiKey: z.string().min(1, 'OBSIDIAN_API_KEY is required'),
  obsidianApiUrl: z.string().url('OBSIDIAN_API_URL must be a valid URL').default('https://127.0.0.1:27124'),
  obsidianVault: z.string().min(1, 'OBSIDIAN_VAULT is required'),
  
  // Project settings
  projectBasePath: z.string().default('Projects'),
  projectFolder: z.string().optional(), // Optional: Set specific project folder
  
  // Server settings
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  nodeEnv: z.enum(['development', 'production']).default('development'),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  try {
    return ConfigSchema.parse({
      obsidianApiKey: process.env.OBSIDIAN_API_KEY,
      obsidianApiUrl: process.env.OBSIDIAN_API_URL,
      obsidianVault: process.env.OBSIDIAN_VAULT,
      projectBasePath: process.env.PROJECT_BASE_PATH,
      projectFolder: process.env.PROJECT_FOLDER,
      logLevel: process.env.LOG_LEVEL,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Failed to load configuration');
  }
}

// Export singleton config instance
export const config = loadConfig();
