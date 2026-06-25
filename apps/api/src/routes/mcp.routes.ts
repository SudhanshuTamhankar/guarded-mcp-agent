import { Router } from 'express';
import { mcpManager } from '../mcp/MCPManager';
import { toolRegistry } from '../mcp/ToolRegistry';

export const mcpRouter = Router();

mcpRouter.get('/status', (req, res) => {
  res.json({
    statuses: mcpManager.getStatuses()
  });
});

mcpRouter.get('/tools', (req, res) => {
  res.json({
    tools: toolRegistry.getTools()
  });
});
