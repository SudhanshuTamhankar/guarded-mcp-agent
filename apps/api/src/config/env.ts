import dotenv from 'dotenv';
import path from 'path';

// Load from root .env if running from workspace root
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
// Fallback if running directly in apps/api
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'groq',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_BASE_URL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  
  EXA_API_KEY: process.env.EXA_API_KEY || '',
  SANDBOX_ROOT: process.env.SANDBOX_ROOT || './sandbox',
  
  APPROVAL_TTL_SECONDS: process.env.APPROVAL_TTL_SECONDS ? parseInt(process.env.APPROVAL_TTL_SECONDS, 10) : 120,
  MAX_AGENT_STEPS: process.env.MAX_AGENT_STEPS ? parseInt(process.env.MAX_AGENT_STEPS, 10) : 8,
  MCP_TOOL_TIMEOUT_MS: process.env.MCP_TOOL_TIMEOUT_MS ? parseInt(process.env.MCP_TOOL_TIMEOUT_MS, 10) : 10000,
};
