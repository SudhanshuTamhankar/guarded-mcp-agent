const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addBlockRule() {
  await prisma.policy_rule.create({
    data: {
      id: require('crypto').randomUUID(),
      type: 'BLOCK_TOOL',
      tool_name: 'sandbox-files__delete_file',
      description: 'Block all delete operations by default',
      is_active: true
    }
  });
  console.log('Added block rule for delete_file');
}

addBlockRule()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
