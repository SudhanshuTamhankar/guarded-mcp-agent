import { RegisteredTool } from '../mcp/ToolRegistry';

export class ToolAdapter {
  static convertToOpenAITools(tools: RegisteredTool[]): any[] {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.exposedName,
        description: tool.description || `Call ${tool.originalName} on ${tool.serverId}`,
        parameters: tool.inputSchema
      }
    }));
  }
}
