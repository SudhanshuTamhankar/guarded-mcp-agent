import express from 'express';
import path from 'path';
import cors from 'cors';
import { env } from './config/env';
import { healthRouter } from './routes/health.routes';
import { mcpRouter } from './routes/mcp.routes';
import { chatRouter } from './routes/chat.routes';
import { approvalsRouter } from './routes/approvals.routes';
import { policyRouter } from './routes/policy.routes';
import { logsRouter } from './routes/logs.routes';
import { mcpManager } from './mcp/MCPManager';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/mcp', mcpRouter);
app.use('/api/chat', chatRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/policy', policyRouter);
app.use('/api/logs', logsRouter);

// Serve static frontend in production
const frontendPath = path.join(__dirname, '../../web/dist');
app.use(express.static(frontendPath));
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    next();
  }
});

async function startServer() {
  console.log('Initializing MCP Manager...');
  await mcpManager.initialize();

  app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
