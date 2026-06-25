const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogs() {
  const logs = await prisma.audit_logs.findMany();
  console.log(JSON.stringify(logs, null, 2));
}

checkLogs()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
