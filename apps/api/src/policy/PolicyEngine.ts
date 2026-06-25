import { prisma } from '../db';
import { randomUUID } from 'crypto';

export type PolicyStatus = 'ALLOW' | 'BLOCK' | 'APPROVAL_REQUIRED';

export interface PolicyDecision {
  status: PolicyStatus;
  reason?: string;
  ruleId?: string;
}

export class PolicyEngine {
  async evaluate(
    exposedToolName: string,
    args: any,
    conversationId: string = 'default'
  ): Promise<PolicyDecision> {
    
    // Parse the exposed tool name to get server_id and original tool_name
    let serverId = '*';
    let toolName = exposedToolName;
    
    if (exposedToolName.includes('__')) {
      const parts = exposedToolName.split('__');
      serverId = parts[0];
      toolName = parts.slice(1).join('__');
    }

    // 1. Fetch enabled rules
    const rules = await prisma.policy_rules.findMany({
      where: {
        enabled: true,
        OR: [
          { server_id: serverId, tool_name: toolName },
          { server_id: serverId, tool_name: '*' },
          { server_id: '*', tool_name: toolName },
          { server_id: '*', tool_name: '*' }
        ]
      },
      orderBy: { priority: 'desc' } // Higher priority rules evaluated first
    });

    let decision: PolicyDecision = { status: 'ALLOW' };

    // 2. Evaluate rules (Precedence: BLOCK > APPROVAL_REQUIRED > ALLOW)
    for (const rule of rules) {
      if (rule.type === 'BLOCK_TOOL') {
        decision = {
          status: 'BLOCK',
          reason: rule.name || `Tool ${exposedToolName} is explicitly blocked by policy.`,
          ruleId: rule.id
        };
        break; // Max precedence reached, block immediately
      }

      if (rule.type === 'REQUIRE_APPROVAL' && decision.status !== 'BLOCK') {
        decision = {
          status: 'APPROVAL_REQUIRED',
          reason: rule.name || `Tool ${exposedToolName} requires human approval.`,
          ruleId: rule.id
        };
      }

      if (rule.type === 'MAX_TOOL_CALLS') {
        const config = JSON.parse(rule.config_json || '{}');
        if (config.maxCalls !== undefined) {
          const callCount = await prisma.tool_calls.count({
            where: { conversation_id: conversationId }
          });
          if (callCount >= config.maxCalls && decision.status !== 'BLOCK') {
            decision = {
              status: 'BLOCK',
              reason: `Max tool call budget (${config.maxCalls}) exceeded for this conversation.`,
              ruleId: rule.id
            };
            break;
          }
        }
      }

      if (rule.type === 'PATH_ALLOWLIST') {
        const checkPath = args?.filePath || args?.directory;
        if (checkPath) {
          const isAbsolutePath = checkPath.startsWith('/') && !checkPath.toLowerCase().startsWith('/sandbox/');
          if (checkPath.includes('..') || isAbsolutePath) {
            decision = {
              status: 'BLOCK',
              reason: `Path traversal or absolute path detected: ${checkPath}. Blocked by PATH_ALLOWLIST.`,
              ruleId: rule.id
            };
            break;
          }
        }
      }
    }

    // 3. Log the decision
    await this.logDecision(exposedToolName, args, decision, conversationId);

    return decision;
  }

  private async logDecision(exposedToolName: string, args: any, decision: PolicyDecision, conversationId: string) {
    try {
      const safeArgs = JSON.stringify(args);

      await prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          conversation_id: conversationId,
          event_type: 'POLICY_DECISION',
          severity: decision.status === 'BLOCK' ? 'WARNING' : 'INFO',
          message: `Policy decision for ${exposedToolName}: ${decision.status}`,
          metadata_json: JSON.stringify({
            args: safeArgs,
            reason: decision.reason,
            rule_id: decision.ruleId
          }),
          created_at: new Date()
        }
      });
    } catch (e) {
      console.error('[PolicyEngine] Failed to log decision:', e);
    }
  }
}

export const policyEngine = new PolicyEngine();
