import fs from 'fs';
import path from 'path';

export interface ServerConfig {
  transport: 'stdio' | 'streamable-http' | 'sse';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

export interface MCPConfig {
  servers: Record<string, ServerConfig>;
}

export const loadMcpConfig = (): MCPConfig => {
  try {
    const configPath = path.resolve(process.cwd(), '../../mcp.config.json');
    if (!fs.existsSync(configPath)) {
      console.warn(`[WARN] mcp.config.json not found at ${configPath}`);
      return { servers: {} };
    }
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as MCPConfig;

    // Substitute env variables in config strings like ${EXA_API_KEY}
    const replaceEnv = (str: string) => str.replace(/\$\{([^}]+)\}/g, (_, key) => process.env[key] || '');

    for (const [serverId, server] of Object.entries(parsed.servers)) {
      if (server.headers) {
        for (const [header, val] of Object.entries(server.headers)) {
          server.headers[header] = replaceEnv(val);
        }
      }
      if (server.url) {
        server.url = replaceEnv(server.url);
      }
      if (server.env) {
        for (const [key, val] of Object.entries(server.env)) {
          server.env[key] = replaceEnv(val);
        }
      }
    }

    return parsed;
  } catch (error) {
    console.error('[ERROR] Failed to load MCP config', error);
    return { servers: {} };
  }
};
