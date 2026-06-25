import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { loadMcpConfig } from "../config/mcp-config";
import { toolRegistry } from "./ToolRegistry";

export type ServerStatus = 'connecting' | 'connected' | 'error' | 'disconnected';

export class MCPManager {
  private clients: Map<string, Client> = new Map();
  private statuses: Map<string, ServerStatus> = new Map();

  async initialize() {
    const config = loadMcpConfig();
    
    for (const [serverId, serverConfig] of Object.entries(config.servers)) {
      this.statuses.set(serverId, 'connecting');
      try {
        await this.connectServer(serverId, serverConfig);
      } catch (error) {
        console.error(`[MCP] Failed to connect to ${serverId}:`, error);
        this.statuses.set(serverId, 'error');
      }
    }
  }

  private async connectServer(serverId: string, config: any) {
    const client = new Client(
      {
        name: "armor-iq-agent",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    let transport;

    if (config.transport === 'stdio') {
      const path = require('path');
      const rootDir = path.resolve(process.cwd(), '../../');
      
      const args = config.args?.map((arg: string) => {
        if (arg.startsWith('mcp-servers')) {
          return path.resolve(rootDir, arg);
        }
        return arg;
      }) || [];

      transport = new StdioClientTransport({
        command: config.command,
        args: args,
        env: {
          ...process.env,
          ...(config.env || {})
        }
      });
    } else if (config.transport === 'sse' || config.transport === 'streamable-http') {
      if (!config.url) throw new Error(`Missing url for SSE transport on server ${serverId}`);
      transport = new SSEClientTransport(new URL(config.url), {
        // @ts-ignore
        headers: config.headers || {}
      });
    } else {
      throw new Error(`Unsupported transport: ${config.transport}`);
    }

    await client.connect(transport);
    this.clients.set(serverId, client);
    this.statuses.set(serverId, 'connected');
    
    console.log(`[MCP] Connected to ${serverId}`);

    // Discover tools
    await this.discoverTools(serverId, client);
  }

  private async discoverTools(serverId: string, client: Client) {
    try {
      const response = await client.listTools();
      toolRegistry.registerTools(serverId, response.tools);
      console.log(`[MCP] Discovered ${response.tools.length} tools from ${serverId}`);
    } catch (error) {
      console.error(`[MCP] Failed to discover tools for ${serverId}:`, error);
    }
  }

  getStatuses(): Record<string, ServerStatus> {
    return Object.fromEntries(this.statuses.entries());
  }

  async callTool(exposedName: string, args: any): Promise<any> {
    const registeredTool = toolRegistry.getTool(exposedName);
    
    if (!registeredTool) {
      throw new Error(`Tool ${exposedName} is not registered`);
    }

    const client = this.clients.get(registeredTool.serverId);
    if (!client) {
      throw new Error(`Client for server ${registeredTool.serverId} is not connected`);
    }

    // Pass the original tool name to the server
    return client.callTool({
      name: registeredTool.originalName,
      arguments: args
    });
  }
}

export const mcpManager = new MCPManager();
