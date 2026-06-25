import { prisma } from '../db';
import { randomUUID } from 'crypto';

export class SecretRedactor {
  // Common simulated secret patterns
  private static readonly SECRET_PATTERNS = [
    { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{32,}/g },
    { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
    { name: 'Generic Bearer Token', regex: /Bearer\s+[a-zA-Z0-9\-\._~\+\/]+=*/gi }
  ];

  async redactAndAudit(text: string, contextName: string): Promise<string> {
    if (!text) return text;

    let redactedText = text;
    let secretsFound = 0;

    for (const pattern of SecretRedactor.SECRET_PATTERNS) {
      redactedText = redactedText.replace(pattern.regex, (match) => {
        secretsFound++;
        return `[REDACTED ${pattern.name}]`;
      });
    }

    if (secretsFound > 0) {
      await prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          event_type: 'SECRET_REDACTED',
          severity: 'WARNING',
          message: `Redacted ${secretsFound} secret(s) from ${contextName}`,
          metadata_json: JSON.stringify({ secretsFound })
        }
      });
      console.warn(`[Security] Redacted ${secretsFound} secrets from ${contextName}`);
    }

    return redactedText;
  }
}

export const secretRedactor = new SecretRedactor();
