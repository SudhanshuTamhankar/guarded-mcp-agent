const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMessages() {
  const messages = await prisma.messages.findMany({ orderBy: { created_at: 'asc' } });
  console.log(JSON.stringify(messages, null, 2));
}

checkMessages()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
