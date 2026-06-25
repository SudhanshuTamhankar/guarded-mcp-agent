# Production / Submission Readiness Checklist

## Core assignment requirements

```txt
[ ] Backend hosts AI agent
[ ] Runtime LLM configured through Groq API
[ ] Agent runs proper tool-use loop
[ ] MCP tool discovery is live, not hardcoded
[ ] At least 2 MCP servers connected
[ ] Remote MCP server: Exa
[ ] Custom MCP server: Sandbox Workspace Security MCP
[ ] Custom MCP server exposes 4-5 tools
[ ] Policy layer sits between model and MCP execution
[ ] Dashboard rules genuinely control running agent
[ ] Dashboard changes take effect without restart
[ ] Policy engine is separate/self-contained
[ ] Code is split across agent, MCP, policy, dashboard, DB/logging
```

## Guardrails

```txt
[ ] Block specific tools
[ ] Require human approval for risky tools
[ ] Validate file paths under /sandbox/
[ ] Enforce tool-call budget
[ ] Enforce token/cost budget if available
[ ] Log all tool requests and policy decisions
[ ] Handle prompt injection attempts
[ ] Redact secrets from logs and outputs
```

## Dashboard

```txt
[ ] Chat/test console
[ ] MCP servers/tools page
[ ] Guardrail rules page
[ ] Approval queue
[ ] Conversation/tool logs page
[ ] Allowed/blocked/approval badges
```

## Reliability

```txt
[ ] MCP call timeouts
[ ] MCP server crash handling
[ ] Unknown/hallucinated tool handling
[ ] Max agent loop steps
[ ] No automatic retry for mutating tools
[ ] Approval timeout denies by default
```

## Security

```txt
[ ] No API keys committed
[ ] No raw secrets in logs
[ ] No path traversal
[ ] No MCP execution without policy
[ ] Policy conflict precedence documented
[ ] Tool outputs treated as untrusted
[ ] Exa/web results treated as untrusted
```

## Final submission

```txt
[ ] GitHub repo ready
[ ] Deployed link ready
[ ] README complete
[ ] .env.example complete
[ ] Demo script complete
[ ] 5-minute recording complete
[ ] Edge-case answers documented
```
