import { prisma } from '../db';
import { randomUUID } from 'crypto';
import { mcpManager } from '../mcp/MCPManager';
import { chatStore } from '../db/ChatStore';
import { agentRunner } from '../llm/AgentRunner';
import { injectionGuard } from '../security/InjectionGuard';
import { secretRedactor } from '../security/SecretRedactor';

export class ApprovalService {
  async createRequest(
    conversationId: string,
    toolCallId: string, // the LLM's tool call ID
    exposedToolName: string,
    args: any,
    reason: string
  ): Promise<string> {
    const requestId = randomUUID();
    
    // Save to tool_calls to preserve arguments for later execution
    const parts = exposedToolName.split('__');
    const serverId = parts.length > 1 ? parts[0] : '*';
    const originalName = parts.length > 1 ? parts.slice(1).join('__') : exposedToolName;

    // In a real app we'd link this via foreign key, but we can reuse toolCallId as primary key for tool_calls
    await prisma.tool_calls.create({
      data: {
        id: toolCallId,
        conversation_id: conversationId,
        server_id: serverId,
        original_tool_name: originalName,
        exposed_tool_name: exposedToolName,
        arguments_json: JSON.stringify(args),
        status: 'PENDING_APPROVAL',
        policy_decision: 'APPROVAL_REQUIRED',
        policy_reason: reason
      }
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 min TTL

    await prisma.approval_requests.create({
      data: {
        id: requestId,
        conversation_id: conversationId,
        tool_call_id: toolCallId,
        status: 'PENDING',
        reason: reason,
        expires_at: expiresAt
      }
    });

    return requestId;
  }

  async getPendingRequests() {
    return prisma.approval_requests.findMany({
      where: { status: 'PENDING' },
      orderBy: { requested_at: 'desc' }
    });
  }

  async clearAll() {
    await prisma.approval_requests.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'DENIED', resolved_at: new Date(), resolved_by: 'system_reset' }
    });
  }

  async approve(requestId: string) {
    const req = await prisma.approval_requests.findUnique({ where: { id: requestId } });
    if (!req || req.status !== 'PENDING') throw new Error('Invalid or already resolved request');

    if (new Date() > req.expires_at) {
      await this.deny(requestId, 'Request expired');
      return;
    }

    await prisma.approval_requests.update({
      where: { id: requestId },
      data: { status: 'APPROVED', resolved_at: new Date(), resolved_by: 'admin' }
    });

    const toolCall = await prisma.tool_calls.findUnique({ where: { id: req.tool_call_id } });
    if (toolCall) {
      try {
        console.log(`[ApprovalService] Executing approved tool ${toolCall.exposed_tool_name}`);
        const args = JSON.parse(toolCall.arguments_json);
        const result = await mcpManager.callTool(toolCall.exposed_tool_name, args);
        
        await prisma.tool_calls.update({
          where: { id: toolCall.id },
          data: { status: 'SUCCESS', result_json: JSON.stringify(result), completed_at: new Date() }
        });

        let resultStr = typeof result === 'string' ? result : JSON.stringify(result);

        // Stage 7 - Sanitize approved tool result
        resultStr = await secretRedactor.redactAndAudit(resultStr, toolCall.exposed_tool_name);
        await injectionGuard.scanAndAudit(resultStr, 'tool_output', req.conversation_id);
        resultStr = injectionGuard.wrapUntrustedData(resultStr, toolCall.exposed_tool_name);

        // Save tool result to chat
        await chatStore.saveMessage(req.conversation_id, 'tool', resultStr, {
          tool_call_id: req.tool_call_id,
          name: toolCall.exposed_tool_name
        });
      } catch (err: any) {
        await chatStore.saveMessage(req.conversation_id, 'tool', `Error: ${err.message}`, {
          tool_call_id: req.tool_call_id,
          name: toolCall.exposed_tool_name
        });
      }
    }

    // Resume agent loop in background
    setTimeout(() => {
      agentRunner.runLoop(req.conversation_id).catch(console.error);
    }, 0);
  }

  async deny(requestId: string, overrideReason?: string) {
    const req = await prisma.approval_requests.findUnique({ where: { id: requestId } });
    if (!req) return;

    await prisma.approval_requests.update({
      where: { id: requestId },
      data: { status: 'DENIED', resolved_at: new Date(), resolved_by: 'admin' }
    });

    const toolCall = await prisma.tool_calls.findUnique({ where: { id: req.tool_call_id } });
    if (toolCall) {
      const reason = overrideReason || 'Admin denied the request.';
      await prisma.tool_calls.update({
        where: { id: toolCall.id },
        data: { status: 'DENIED', completed_at: new Date() }
      });

      await chatStore.saveMessage(req.conversation_id, 'tool', `POLICY_BLOCKED: ${reason}`, {
        tool_call_id: req.tool_call_id,
        name: toolCall.exposed_tool_name
      });
    }

    // Resume agent loop in background
    setTimeout(() => {
      agentRunner.runLoop(req.conversation_id).catch(console.error);
    }, 0);
  }
}

export const approvalService = new ApprovalService();
