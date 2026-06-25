import { Router } from 'express';
import { prisma } from '../db';

export const logsRouter = Router();

// Get audit logs
logsRouter.get('/', async (req, res) => {
  try {
    const logs = await prisma.audit_logs.findMany({
      orderBy: { created_at: 'desc' },
      take: 100 // Limit to last 100 for demo
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
