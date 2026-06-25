import { Router } from 'express';
import { prisma } from '../db';
import { mcpManager } from '../mcp/MCPManager';

export const healthRouter = Router();

healthRouter.get('/', async (req, res) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get MCP status
    const mcpStatus = mcpManager.getStatuses();
    
    res.status(200).json({ 
      status: 'ok', 
      db: 'connected',
      mcp: mcpStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
