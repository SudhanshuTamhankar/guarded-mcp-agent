# Gemini / Antigravity Project Instructions

You are helping build a guarded MCP AI agent assignment using a multi-agent engineering process.

## Source documents

Always read these root files first when available:

```txt
PRD.md
IMPLEMENTATION_PLAN.md
```

Rules:

1. `PRD.md` defines what the product must do.
2. `IMPLEMENTATION_PLAN.md` defines the build order.
3. Do not rewrite either file unless explicitly asked.
4. Do not skip stages.
5. Do not implement future-stage features.
6. If Stage 0 already exists, treat it as completed baseline work.
7. Do not modify completed earlier-stage behavior unless required for compatibility.

## Project-specific technical choices

Use these unless the user explicitly changes them:

```txt
Runtime app LLM: Groq API with OpenAI-compatible chat/tool calling
Remote MCP server: Exa MCP
Custom MCP server: Sandbox Workspace Security MCP Server
Backend: Node.js + TypeScript
Frontend: React + Vite
Database: SQLite
MCP SDK: TypeScript MCP SDK
```

The system must not use provider-managed MCP tool execution that bypasses the local policy layer. The backend must perform the tool-use loop itself.

## Architecture principle

The model is allowed to propose tool calls. The policy engine is the only component allowed to authorize tool execution.

The core sequence is:

```txt
User → Groq LLM → tool request → policyEngine.evaluate(...) → MCP execution if allowed → tool result → Groq LLM → final answer
```

## Multi-agent behavior

Use the roles in `.agents/agents.md`:

```txt
@orchestrator
@requirements
@architect
@mcp-lead
@custom-mcp-server
@llm-agent-loop
@policy-engine
@prompt-injection
@backend-api
@frontend-dashboard
@database-audit
@approval-flow
@qa
@security
@devops
@docs-demo
@adversarial-reviewer
```

Each role must produce concrete output and hand off to the next role. Do not collapse everything into one unstructured implementation.

## Non-negotiable constraints

- No hardcoded MCP tool lists.
- MCP tool discovery must be live.
- Policy engine must be separate and self-contained.
- Dashboard rule changes must affect the running agent without restart.
- Every MCP call must pass through policy.
- Every policy decision must be logged.
- Dangerous tool calls must require approval or be blocked.
- Tool outputs and remote web content are untrusted.
- Secrets must not be logged or shown raw.

## Default policy precedence

When rules conflict, use:

```txt
explicit block > budget exceeded > input validation failure > high-risk prompt injection > approval required > allow
```

## Approval behavior

If a tool requires approval:

1. Create an approval request.
2. Do not call MCP yet.
3. Wait for admin approval or denial.
4. If approval expires, deny by default.
5. Resume conversation only after decision.

## Output discipline

For every stage, report:

```txt
- Stage goal
- Relevant PRD requirements
- Relevant implementation-plan tasks
- Files changed
- Commands run
- Tests/build results
- Policy/security risks
- Remaining blockers
- Recommended next step
```
