import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding policy rules...');

  const seedRules = [
    {
      id: 'rule-block-delete',
      type: 'BLOCK_TOOL',
      name: 'Block Delete File',
      enabled: true,
      server_id: 'sandbox-files',
      tool_name: 'delete_file',
      config_json: '{}',
      priority: 100,
    },
    {
      id: 'rule-require-approval-write',
      type: 'REQUIRE_APPROVAL',
      name: 'Require Approval for Write',
      enabled: true,
      server_id: 'sandbox-files',
      tool_name: 'write_file',
      config_json: '{}',
      priority: 90,
    },
    {
      id: 'rule-path-allowlist',
      type: 'PATH_ALLOWLIST',
      name: 'Sandbox Path Allowlist',
      enabled: true,
      server_id: 'sandbox-files',
      tool_name: '*',
      config_json: JSON.stringify({ allowedPrefix: '/sandbox/' }),
      priority: 80,
    },
    {
      id: 'rule-max-tool-calls',
      type: 'MAX_TOOL_CALLS',
      name: 'Max Tool Calls',
      enabled: true,
      server_id: '*',
      tool_name: '*',
      config_json: JSON.stringify({ maxCalls: 8 }),
      priority: 70,
    },
    {
      id: 'rule-prompt-injection-guard',
      type: 'PROMPT_INJECTION_GUARD',
      name: 'Prompt Injection Guard',
      enabled: true,
      server_id: '*',
      tool_name: '*',
      config_json: JSON.stringify({ mode: 'sanitize_or_block_high_risk' }),
      priority: 60,
    },
    {
      id: 'rule-secret-redaction',
      type: 'SECRET_REDACTION',
      name: 'Secret Redaction',
      enabled: true,
      server_id: '*',
      tool_name: '*',
      config_json: '{}',
      priority: 50,
    }
  ];

  for (const rule of seedRules) {
    await prisma.policy_rules.upsert({
      where: { id: rule.id },
      update: rule,
      create: rule,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
