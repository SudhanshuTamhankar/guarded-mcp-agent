export interface RegisteredTool {
  exposedName: string;
  originalName: string;
  serverId: string;
  description?: string;
  inputSchema: any;
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  registerTools(serverId: string, discoveredTools: any[]) {
    for (const tool of discoveredTools) {
      const exposedName = `${serverId}__${tool.name}`;
      
      this.tools.set(exposedName, {
        exposedName,
        originalName: tool.name,
        serverId,
        description: tool.description,
        inputSchema: tool.inputSchema
      });
    }
  }

  getTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  getTool(exposedName: string): RegisteredTool | undefined {
    return this.tools.get(exposedName);
  }

  clearServerTools(serverId: string) {
    for (const [key, tool] of this.tools.entries()) {
      if (tool.serverId === serverId) {
        this.tools.delete(key);
      }
    }
  }
}

export const toolRegistry = new ToolRegistry();
