import { Router } from 'express';
import { prisma } from '../db';

export const policyRouter = Router();

// Get all rules
policyRouter.get('/rules', async (req, res) => {
  try {
    const rules = await prisma.policy_rules.findMany({
      orderBy: { priority: 'desc' }
    });
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle a rule
policyRouter.patch('/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    const updated = await prisma.policy_rules.update({
      where: { id },
      data: { enabled }
    });
    
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
