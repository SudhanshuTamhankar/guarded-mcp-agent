import { Router } from 'express';
import { approvalService } from '../approvals/ApprovalService';

export const approvalsRouter = Router();

approvalsRouter.get('/', async (req, res) => {
  try {
    const pending = await approvalService.getPendingRequests();
    res.json(pending);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

approvalsRouter.delete('/', async (req, res) => {
  try {
    await approvalService.clearAll();
    res.json({ success: true, message: 'All pending approvals cleared.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

approvalsRouter.post('/:id/approve', async (req, res) => {
  try {
    await approvalService.approve(req.params.id);
    res.json({ success: true, message: 'Request approved and execution resumed.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

approvalsRouter.post('/:id/deny', async (req, res) => {
  try {
    await approvalService.deny(req.params.id);
    res.json({ success: true, message: 'Request denied and execution resumed.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
