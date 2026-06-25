# Guarded AI Agent with MCP Support Implementation Plan

This plan breaks down the development of the Guarded AI Agent with MCP Support into structured stages, following the guidelines provided in the PRD and implementation strategy.

## Goal Description
Build a full-stack AI agent security platform demo where an LLM-powered agent discovers and calls MCP tools, while a separate policy engine enforces guardrails before any external tool execution is permitted. The LLM can request a tool call, but only the policy engine can authorize that tool call.

## Open Questions
- Do you have a preferred API key management strategy for local development (e.g., standard `.env` file)?
- Would you prefer Express or Fastify for the backend framework? (Defaulting to Express for simplicity if no preference).
- Do you have a preferred ORM between Drizzle and Prisma? (Defaulting to Prisma for faster setup if no preference).

## Proposed Changes

We will build the system from the inside out in the following stages:

### Stage 1: Project Foundation
- Setup monorepo structure (`apps/api`, `apps/web`, `mcp-servers`).
- Initialize Node.js/TypeScript backend with SQLite + Prisma/Drizzle.
- Initialize React + Vite frontend with Tailwind CSS.
- Setup basic configuration, API health endpoints, and database seed.

### Stage 2: Custom Sandbox Workspace Security MCP Server
- Build `mcp-servers/sandbox-files` using the Official TypeScript MCP SDK via stdio.
- Expose tools: `list_files`, `read_file`, `write_file`, `delete_file`, and `scan_file_for_secrets`.
- Seed demo files in the `sandbox/` directory (e.g., `notes.txt`, `config.txt`, `malicious-webpage.md`).
- Implement proper MCP tool listing, schemas, execution, and error handling.

### Stage 3: MCP Manager and Live Tool Discovery
- Implement `MCPManager` and `ToolRegistry` in the backend.
- Connect to the remote Exa MCP server (via streamable-http) and the local Sandbox MCP server (via stdio).
- Implement dynamic tool discovery, applying namespaces (e.g., `sandbox_files__read_file`).
- Create API endpoints for the frontend to view connected servers and discovered tools.

### Stage 4: Groq Agent Tool-Use Loop
- Integrate the Groq API using an OpenAI-compatible client.
- Implement the manual tool-use loop:
  - Convert discovered MCP tools to Groq function schemas.
  - Intercept model tool call requests.
  - Forward allowed requests to the respective MCP server.
  - Return tool results back to the model.
- Add a placeholder policy interface (to be implemented fully in Stage 5).

### Stage 5: Policy Engine
- Build the core guardrail layer as a separate module (`apps/api/src/policy`).
- Implement rules: `BLOCK_TOOL`, `REQUIRE_APPROVAL`, `PATH_ALLOWLIST`, `MAX_TOOL_CALLS`, `MAX_TOKENS`.
- Enforce policy evaluation before any MCP execution.
- Wire database storage for rules so dashboard changes apply dynamically without restarts.

### Stage 6: Approval Flow & Audit Logs
- Implement an approval state machine (`pending -> approved/denied/expired`).
- Pause execution during pending approvals.
- Generate comprehensive audit logs for all meaningful actions (tool requests, policy decisions, approvals).

### Stage 7: Guardrails Dashboard (Frontend)
- Build the React dashboard:
  - **Chat Console:** Interact with the agent.
  - **MCP Tools:** View connected servers and tools.
  - **Guardrails:** Manage rules dynamically.
  - **Approval Queue:** Approve/deny pending tool calls.
  - **Audit Logs:** View a timeline of events.

### Stage 8: Prompt Injection & Hardening
- Implement a prompt injection scanner for user messages and MCP tool outputs.
- Build secret redaction logic in the custom MCP server.
- Final polish and testing of edge cases (crashes, timeouts, conflicts).

## Verification Plan

### Automated/Manual Testing
- **MCP Verification:** Verify dynamic tool discovery and execution.
- **Policy Enforcement:** Test that explicit blocks, path allowlists, and budget rules correctly reject unauthorized tool calls.
- **Approval Flow:** Test that execution pauses for `write_file` and resumes only upon human approval.
- **Prompt Injection:** Supply `malicious-webpage.md` to ensure dangerous intent cannot bypass policy rules.
- **End-to-end Demo:** Complete the 5-minute requested script demonstrating Exa search, Sandbox read, blocked delete, approval write, path validation, and secret scanning.
