# Guarded AI Agent with MCP Support - Interview & Implementation Log

This document serves as a living record of the implementation, capturing the files created, the rationale behind architectural decisions, the overall project flow, important code logic via pseudocode, and any major errors encountered along the way. It will be updated stage by stage.

---

## Stage 1: Project Foundation

### Overview
In Stage 1, we established the foundational structure for the Guarded MCP Agent. We opted for a monorepo setup using npm workspaces to house the backend API, the frontend web app, and the custom MCP servers under a single repository. 

### Files Created & Rationale

**Root Configurations:**
* `package.json`: Configured as a monorepo mapping to `apps/*` and `mcp-servers/*`.
* `mcp.config.json`: The central configuration registry for MCP servers the agent will connect to.
* `.env.example`: Template for API keys (e.g., Groq, Exa) and other secrets.

**Backend (`apps/api`):**
* `package.json` & `tsconfig.json`: Node.js + TypeScript environment setup.
* `src/server.ts`: The main Express server entry point. Includes a `/api/health` route for basic uptime checks.
* `src/config/env.ts` & `src/config/mcp-config.ts`: Centralized environment variable parsing and MCP configuration loading.
* `prisma/schema.prisma`: The SQLite database schema containing models for `policy_rules`, `conversations`, `messages`, `tool_calls`, `approval_requests`, and `audit_logs`. This fulfills the requirement for an auditable, persistent state.
* `src/db/index.ts` & `src/db/seed.ts`: Initializes the Prisma client and seeds the database with the mandatory default guardrail rules (e.g., block delete, require approval for write).

**Frontend (`apps/web`):**
* `vite.config.ts` & `src/index.css`: Initialized Vite with React and configured Tailwind CSS v4.
* `src/App.tsx`: The main layout shell featuring a side navigation bar and routing for the dashboard.
* `src/pages/*.tsx`: Placeholder pages for `ChatConsole`, `McpTools`, `Guardrails`, `Approvals`, and `AuditLogs`.

### Project Flow (So Far)
1. **User interaction** starts at the React Frontend (`apps/web`).
2. **Backend API** (`apps/api`) serves as the orchestrator.
3. **Database** (SQLite via Prisma) persists policy rules, tool execution logs, and conversation history.

### Important Code Logic (Pseudocode)

**MCP Config Loading:**
```typescript
// src/config/mcp-config.ts
function loadMcpConfig(): MCPConfig {
  read 'mcp.config.json'
  for each server in config:
    // Substitute environment variables dynamically (e.g. ${EXA_API_KEY})
    replace environment variable templates in env and headers
  return config
}
```

**Database Seeding (Default Guardrails):**
```typescript
// src/db/seed.ts
async function seedRules() {
  const defaultRules = [
    { type: 'BLOCK_TOOL', tool_name: 'delete_file', ... },
    { type: 'REQUIRE_APPROVAL', tool_name: 'write_file', ... },
    { type: 'MAX_TOOL_CALLS', maxCalls: 8, ... }
  ]
  
  for rule in defaultRules:
    upsert rule into policy_rules table
}
```

### Major Errors Encountered (Stage 1)

**1. Prisma v7.8 Breaking Schema Changes**
* **Error**: During database initialization, `npx prisma db push` failed with `Error code: P1012: The datasource property 'url' is no longer supported in schema files`.
* **Cause**: Prisma version 7.8 introduced a breaking change that removes the `url` property from the `datasource` block in `schema.prisma`, requiring connection URLs to be passed via a separate `prisma.config.ts` or the `PrismaClient` constructor.
* **Resolution**: To maintain stability and avoid unfamiliar breaking changes in the middle of the assignment, the `prisma` and `@prisma/client` dependencies were explicitly downgraded and pinned to `^5.0.0`. This allowed the standard `url = env("DATABASE_URL")` pattern to work perfectly.

**2. Tailwind CSS Initialization**
* **Error**: `npx tailwindcss init -p` failed with `npm error could not determine executable to run`.
* **Cause**: The project uses the latest Tailwind CSS v4, which handles configuration and Vite integration differently (using `@tailwindcss/vite`) rather than the traditional `tailwind.config.js` and `postcss` approach.
* **Resolution**: Installed `@tailwindcss/vite`, updated `vite.config.ts` to include the Tailwind plugin, and modified `index.css` to use the new `@import "tailwindcss";` syntax.

---

## Stage 2: Custom Sandbox Workspace Security MCP Server

### Overview
In Stage 2, we built `mcp-servers/sandbox-files`, a custom stdio-based MCP server. This server provides controlled file system operations (`list_files`, `read_file`, `write_file`, `delete_file`) constrained to a specific `sandbox/` directory. It also includes a `scan_file_for_secrets` tool to simulate finding prompt injections and secrets (a core requirement of the PRD).

### Files Created & Rationale

**Server Infrastructure (`mcp-servers/sandbox-files`):**
* `package.json` & `tsconfig.json`: Defines the server as a Node.js ES Module project using TypeScript and `@modelcontextprotocol/sdk`.
* `src/index.ts`: The main server entry point. 
  * It initializes a `Server` and a `StdioServerTransport`.
  * It handles `ListToolsRequestSchema` by returning definitions (schemas) for the five file-system tools.
  * It handles `CallToolRequestSchema` by executing the requested tool logic safely.

**Sandbox Environment (`mcp-servers/sandbox-files/sandbox/`):**
* `notes.txt`: A benign text file used to verify safe `read_file` operations.
* `config.txt`: Contains a fake API key (`API_KEY=sk-test-1234567890abcdef`) to test the `scan_file_for_secrets` tool.
* `malicious-webpage.md`: A mock file simulating a prompt injection attempt ("IGNORE ALL PREVIOUS INSTRUCTIONS").

### Project Flow (Updates)
* The overarching system will eventually launch this script (`node dist/index.js`) as a child process, communicating with it over standard input/output (stdio) via the MCP JSON-RPC protocol.

### Important Code Logic (Pseudocode)

**Path Safety Validation:**
```typescript
// Prevents directory traversal attacks (e.g. read_file("../../etc/passwd"))
function resolveSafePath(filePath: string): string {
  const absolutePath = path.resolve(sandboxRoot, filePath)
  if (!absolutePath.startsWith(sandboxRoot)) {
    throw new Error("Path is outside of sandbox boundary")
  }
  return absolutePath
}
```

**Secret Scanning Logic:**
```typescript
// Inside CallToolRequestSchema handler for 'scan_file_for_secrets'
const content = read_file_content(safePath)
// Simple regex to match key/token patterns
const apiKeyRegex = /(api[_-]?key|secret|password|token)\s*[:=]\s*([a-zA-Z0-9\-_]{8,})/gi

let foundSecrets = []
while(match = execute_regex(apiKeyRegex, content)) {
    foundSecrets.push("Found potential secret matching " + match[1])
}

if (foundSecrets.length > 0) {
    return { content: "WARNING: Found secrets: \n" + foundSecrets.join('\n') }
}
return { content: "Clean. No secrets found." }
```

### Major Errors Encountered (Stage 2)
*(No major errors encountered during Stage 2. Implementation strictly followed the SDK guidelines for stdio transport, ensuring no rogue `console.log` statements would break the JSON-RPC stream.)*

---

## Stage 3: MCP Manager and Live Tool Discovery

### Overview
In Stage 3, we implemented the `MCPManager` in the backend API to dynamically connect to the MCP servers defined in `mcp.config.json` (Exa over SSE, Sandbox over stdio). We also built a `ToolRegistry` to properly namespace tools (e.g., `sandbox-files__read_file`) and prevent collisions. Finally, we exposed these as API endpoints so the frontend can query the agent's capabilities.

### Files Created & Rationale

**MCP Integration (`apps/api/src/mcp`):**
* `ToolRegistry.ts`: A centralized, in-memory store that holds all discovered tools. When tools are registered, their names are prefixed with their server ID (namespace) to guarantee uniqueness.
* `MCPManager.ts`: Uses the `@modelcontextprotocol/sdk` to instantiate clients and maintain connections. It dynamically connects to either a local child process (via `StdioClientTransport`) or a remote server (via `SSEClientTransport`), pulls the tools via `client.listTools()`, and pushes them to the `ToolRegistry`.

**API Routes (`apps/api/src/routes`):**
* `mcp.routes.ts`: Exposes two primary endpoints for the frontend dashboard:
  * `GET /api/mcp/status`: Returns `{ "exa": "error", "sandbox-files": "connected" }`.
  * `GET /api/mcp/tools`: Returns the rich JSON schema list of all namespaced tools.

**Server Setup (`apps/api/src/server.ts`):**
* Updated the main Express initialization to run `mcpManager.initialize()` at startup and mount the `/api/mcp` routes.

### Project Flow (Updates)
* The Backend (`apps/api`) is now actively holding open long-lived JSON-RPC connections to the MCP servers.
* When the frontend Dashboard queries `/api/mcp/tools`, the Backend immediately returns the globally registered tool schemas, setting the stage for the Groq LLM loop to utilize them.

### Important Code Logic (Pseudocode)

**Tool Registration & Namespacing:**
```typescript
// apps/api/src/mcp/ToolRegistry.ts
function registerTools(serverId: string, discoveredTools: Tool[]) {
  for (tool of discoveredTools) {
    const exposedName = `${serverId}__${tool.name}`;
    toolsMap.set(exposedName, {
      exposedName: exposedName,
      originalName: tool.name,
      serverId: serverId,
      inputSchema: tool.inputSchema
    });
  }
}
```

**MCP Manager Initialization:**
```typescript
// apps/api/src/mcp/MCPManager.ts
async function initialize() {
  const config = loadMcpConfig();
  for (const server of config.servers) {
    if (server.transport === 'stdio') {
      const transport = new StdioClientTransport({ command: 'node', args: ['dist/index.js'] });
      await client.connect(transport);
    } else if (server.transport === 'sse') {
      const transport = new SSEClientTransport(new URL(server.url));
      await client.connect(transport);
    }
    
    // Auto-discover tools and populate the registry
    const response = await client.listTools();
    toolRegistry.registerTools(server.id, response.tools);
  }
}
```

### Major Errors Encountered (Stage 3)

**1. Path Resolution for Stdio Transport**
* **Error**: The `MCPManager` failed to spawn the sandbox stdio child process because `node mcp-servers/sandbox-files/dist/index.js` was run relative to `apps/api` instead of the workspace root.
* **Cause**: Current Working Directory (CWD) mismatch. The API script runs from `apps/api/`, but the `mcp.config.json` provided paths relative to the monorepo root.
* **Resolution**: Modified `MCPManager.ts` to actively inspect the command arguments. If an argument starts with `mcp-servers`, it uses `path.resolve(process.cwd(), '../../')` to transform it into an absolute path, ensuring robust resolution regardless of where the dev script is invoked.

**2. TypeScript NodeNext Module Resolution**
* **Error**: `error TS5107: Option 'moduleResolution=node10' is deprecated` when trying to run `ts-node-dev`.
* **Cause**: In `tsconfig.json`, `moduleResolution` was set to `node`, which defaults to the deprecated `node10` setting in modern TypeScript.
* **Resolution**: Reconfigured `tsconfig.json` to explicitly use `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`, fully supporting ES Module resolution used by the MCP SDK.

---

## Stage 4: Groq Agent Tool-Use Loop

### Overview
In Stage 4, we implemented the manual Groq Agent Tool-Use loop. We built an adapter to translate MCP tool JSON schemas into OpenAI-compatible function definitions, integrated the `groq-sdk`, and wrote an `AgentRunner` loop that handles the conversation between the user, the model, and the MCP servers. This fulfills the requirement to *not* use black-box provider-managed execution so that we can insert a Policy Engine in Stage 5.

### Files Created & Rationale

**LLM Integration (`apps/api/src/llm`):**
* `ToolAdapter.ts`: Translates the `RegisteredTool` interface into OpenAI `type: 'function'` objects so Groq understands the inputs.
* `GroqProvider.ts`: Wraps `groq-sdk` and handles sending the `messages` array and `tools` array to Groq. We set the fallback model to `llama-3.3-70b-versatile`.
* `AgentRunner.ts`: The manual execution loop. It tracks steps, sends the request to Groq, intercepts `tool_calls`, executes them against `MCPManager.callTool`, and feeds the results back to Groq as `role: 'tool'` messages until a final natural language answer is reached.

**API Routes (`apps/api/src/routes`):**
* `chat.routes.ts`: Exposes `POST /api/chat`, allowing the frontend to trigger the `agentRunner.runLoop(message)`.

### Project Flow (Updates)
* The agent loop now actively bridges the gap between the LLM and the connected MCP servers. Tool calls are strictly evaluated manually in `AgentRunner.ts`, creating the exact seam where the Policy Engine will be hooked in.

### Important Code Logic (Pseudocode)

**Agent Runner Loop (The Seam):**
```typescript
// apps/api/src/llm/AgentRunner.ts
async function runLoop(userMessage, maxSteps = 5) {
  let steps = 0;
  while (steps < maxSteps) {
    steps++;
    const tools = ToolAdapter.convertToOpenAITools(toolRegistry.getTools());
    const response = await groqProvider.generateResponse(conversation, tools);
    
    if (response.tool_calls) {
      for (const call of response.tool_calls) {
         // --- POLICY ENGINE SEAM GOES HERE IN STAGE 5 ---
         
         const result = await mcpManager.callTool(call.function.name, call.function.arguments);
         conversation.push({ role: 'tool', content: result });
      }
    } else {
      // Model returned final answer
      break;
    }
  }
  return conversation;
}
```

### Major Errors Encountered (Stage 4)

**1. Groq Base URL Override Mismatch**
* **Error**: The Groq SDK failed with a `404 unknown_url` when attempting to call the API.
* **Cause**: `GROQ_BASE_URL` was explicitly defined in `.env` as `https://api.groq.com/openai/v1`. The SDK automatically appends `/openai/v1/chat/completions` internally, which resulted in a double path: `https://api.groq.com/openai/v1/openai/v1/chat/completions`.
* **Resolution**: The fix is to remove `GROQ_BASE_URL` from the `.env` file entirely, allowing the `groq-sdk` to fall back to its internal, correct defaults.

---

## Stage 5: Policy Engine & Guardrails

### Overview
In Stage 5, we built the core value proposition of the Guarded MCP Agent: the **Policy Engine**. This module intercepts tool calls from the LLM, evaluates them against rules stored in the database, and returns a deterministic decision (`ALLOW`, `BLOCK`, `APPROVAL_REQUIRED`). It also guarantees that policy conflicts are resolved strictly (`BLOCK > APPROVAL_REQUIRED > ALLOW`).

### Files Created & Rationale

**Policy Enforcement (`apps/api/src/policy`):**
* `PolicyEngine.ts`: The central authorization layer. It is fully decoupled from the LLM routing and purely handles deterministic rule evaluation. 
  * Parses incoming `tool_name` (e.g. `sandbox-files__delete_file`) to check namespace or global wildcards (`*`).
  * Enforces the hard rule: Block takes precedence over Approval.
  * Enforces maximum tool call budgets per conversation.
  * Automatically creates an entry in the `audit_logs` table (SQLite) for every single decision it makes.

**Agent Integration (`apps/api/src/llm/AgentRunner.ts`):**
* Updated the execution seam. The agent now `await policyEngine.evaluate(...)` before firing any MCP tool.
* If a tool is blocked, the agent intercepts the call and feeds `POLICY_BLOCKED: {reason}` back to the model as a `tool` role message. This allows the model to understand *why* it failed, rather than crashing or hanging.

### Project Flow (Updates)
* The backend tool loop is now fully governed. The LLM can *propose* any tool call it wants, but it cannot *execute* anything without the Policy Engine explicitly allowing it. 
  await logToDatabase(decision);
  return decision;
}
```

### Major Errors Encountered (Stage 5)
*(No major errors encountered. We safely removed the `GROQ_BASE_URL` from `.env` and tested the policy engine with a simulated prompt to delete a file, which was successfully blocked and audited in the database.)*
- Every execution attempt is now leaving a persistent, auditable trail in the database.

### Important Code Logic (Pseudocode)

**Deterministic Conflict Resolution:**
``typescript
// apps/api/src/policy/PolicyEngine.ts
async function evaluate(toolName, args) {
  const rules = await prisma.policy_rules.findMany({ where: { enabled: true } });
  let decision = { status: 'ALLOW' };

  for (const rule of rules) {
    if (rule.type === 'BLOCK_TOOL') {
      decision = { status: 'BLOCK', reason: 'Blocked by policy.' };
      break; // Immediate exit, max precedence reached.
    }
    
    if (rule.type === 'REQUIRE_APPROVAL' && decision.status !== 'BLOCK') {
      decision = { status: 'APPROVAL_REQUIRED', reason: 'Requires approval.' };
      // Does not break, in case a subsequent rule is a BLOCK rule.
    }
  }

  await logToDatabase(decision);
  return decision;
}
``

---

## Stage 6: Human-in-the-Loop Approvals

### Goal
Pause the AI agent loop when it attempts a risky action, wait for a human to approve the action in the database, execute the action on behalf of the agent, and seamlessly resume the conversational loop.

### Major Errors & Learnings
1. **Loss of In-Memory State**: When the loop exits to wait for a human, the conversational context is lost. 
   *Fix*: We implemented ChatStore.ts using Prisma to persist the full message history to prisma.conversations and prisma.messages.
2. **Result Formatting Crash**: When the ApprovalService successfully ran the tool, it passed a JSON object (the MCP result) to Prisma's string column, crashing the backend. The Groq agent retried the same function call thinking it failed.
   *Fix*: Handled object serialization rigorously (	ypeof result === 'string' ? result : JSON.stringify(result)) before saving to the SQLite database.

### Key Files
- pps/api/src/db/ChatStore.ts: Persists the state of the conversation (user messages, AI responses, and tool calls).
- pps/api/src/approvals/ApprovalService.ts: Handles creating a pending request (prisma.approval_requests) and resuming the agent loop upon approval.
- pps/api/src/routes/approvals.routes.ts: Exposes /approve and /deny API endpoints.
- pps/api/src/llm/AgentRunner.ts: Modified to exit the loop early when APPROVAL_REQUIRED is encountered, and properly rebuild the message history upon resume.

### Important Code Logic (Stage 6)
``typescript
// AgentRunner pausing for approval
if (decision.status === 'APPROVAL_REQUIRED') {
  await approvalService.createRequest(conversationId, toolCall.id, functionName, args, decision.reason);
  return conversation; // Exit the loop entirely
}

// ApprovalService resuming the conversation
async approve(requestId) {
  const req = await prisma.approval_requests.findUnique({ where: { id: requestId } });
  
  // ... execute the tool via mcpManager ...
  const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
  await chatStore.saveMessage(req.conversation_id, 'tool', resultStr);

  // Resume agent loop asynchronously
  setTimeout(() => {
    agentRunner.runLoop(req.conversation_id).catch(console.error);
  }, 0);
}
``
---

## Stage 7: Prompt Injection Defense

### Goal
Protect the AI Agent from being hijacked by untrusted user input or malicious tool outputs (like web pages or sandbox files) by scanning, redacting secrets, and wrapping content in data fences.

### Major Errors & Learnings
1. **Prisma Type Crash**: The SQLite database expected event_type and severity strings for udit_logs, but I accidentally passed ction and status, which resulted in a PrismaClientValidationError that the agent kept retrying endlessly.
   *Fix*: Corrected the schema fields passed into prisma.audit_logs.create in the security utilities.

### Key Files
- pps/api/src/security/InjectionGuard.ts: Regex-based scanner for prompt injection phrases like "ignore previous instructions". Also wraps strings in <UNTRUSTED_DATA> blocks.
- pps/api/src/security/SecretRedactor.ts: Regex-based scanner to catch and replace fake API keys and secrets before they are added to the LLM's context.

### Important Code Logic (Stage 7)
``typescript
// AgentRunner parsing tool execution (Safe Wrapper)
let resultStr = typeof result === 'string' ? result : JSON.stringify(result);

// 1. Redact secrets first
resultStr = await secretRedactor.redactAndAudit(resultStr, functionName);

// 2. Audit for prompt injection keywords
await injectionGuard.scanAndAudit(resultStr, 'tool_output', conversationId);

// 3. Wrap in a data fence so the LLM doesn't read it as instructions
resultStr = injectionGuard.wrapUntrustedData(resultStr, functionName);

// 4. Save safely to DB
await chatStore.saveMessage(conversationId, 'tool', resultStr);
``

---

## Stage 8: Admin Dashboard UI

### Goal
Build a simple React dashboard to manage policies, view tool discovery, handle approvals, and chat with the agent.

### Major Errors & Learnings
1. **Frontend TypeError**: The frontend React component (McpTools.tsx) expected 	ool.name instead of 	ool.exposedName when parsing the backend API response (/api/mcp/tools). This caused a TypeError: Cannot read properties of undefined (reading 'split') that crashed the entire page.
   *Fix*: Modified the frontend mapping to fall back safely: const toolIdentifier = t.exposedName || t.name || '';
2. **CSS Layout Overflow**: The ChatConsole message input field was pushed off-screen due to overflow-y-auto inherited from the App.tsx container layout logic mixed with h-full.
   *Fix*: Changed App.tsx container to h-screen overflow-hidden and allowed individual page components to manage their own overflow-y-auto scrolling.
3. **Missing Icon**: lucide-react import Tool was missing; replaced with Wrench.

### Key Files
- pps/web/src/api/client.ts: API wrapper.
- pps/web/src/pages/ChatConsole.tsx: Agent chat interface.
- pps/web/src/pages/McpTools.tsx: Discovered MCP tools view.
- pps/web/src/pages/Guardrails.tsx: Toggleable policy rules.
- pps/web/src/pages/Approvals.tsx: Approval queue management.
- pps/web/src/pages/AuditLogs.tsx: Security event timeline.

### Important Code Logic (Stage 8)
\\\	ypescript
// Frontend Policy Toggling
const toggleRule = async (id: string, currentEnabled: boolean) => {
  try {
    // Optimistic UI update
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !currentEnabled } : r));
    await api.policy.toggleRule(id, !currentEnabled);
  } catch (err) {
    // Revert on error
    await fetchRules();
  }
};
\\\

