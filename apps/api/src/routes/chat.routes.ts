import { Router } from 'express';
import { agentRunner } from '../llm/AgentRunner';
import { chatStore } from '../db/ChatStore';
import rateLimit from 'express-rate-limit';

export const chatRouter = Router();

const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Rate limit exceeded. Please wait a minute before sending another message.' },
  standardHeaders: true,
  legacyHeaders: false,
});

chatRouter.post('/', chatRateLimiter, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      activeConversationId = await chatStore.createConversation();
    }
    
    // Save user message
    await chatStore.saveMessage(activeConversationId, 'user', message);
    
    // Run loop (will pause and return if approval is required)
    const result = await agentRunner.runLoop(activeConversationId);
    
    // Check if there's a pending approval for this conversation
    const { prisma } = require('../db');
    const pendingApproval = await prisma.approval_requests.findFirst({
      where: { conversation_id: activeConversationId, status: 'PENDING' }
    });

    if (pendingApproval) {
      result.push({
        role: 'assistant',
        content: `⏳ **Action Paused**: I need human approval to proceed with a sensitive action. Please review and approve my request in the **Approval Queue** from the sidebar.`
      });
    }
    
    res.json({ conversationId: activeConversationId, conversation: result, pendingApproval: !!pendingApproval });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

chatRouter.get('/:id', async (req, res) => {
  try {
    const conversation = await chatStore.getConversationMessages(req.params.id);
    res.json({ conversation });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
