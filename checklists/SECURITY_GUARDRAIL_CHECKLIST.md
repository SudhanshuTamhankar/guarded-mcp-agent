# Security Guardrail Checklist

Use this before marking any stage complete.

## MCP execution boundary

```txt
[ ] All MCP calls route through one execution gateway
[ ] Gateway calls policyEngine.evaluate(...) first
[ ] Blocked calls never reach MCP
[ ] Approval-required calls do not reach MCP until approved
[ ] Unknown tool names are rejected safely
```

## File sandbox safety

```txt
[ ] All file paths are normalized
[ ] Path traversal is blocked
[ ] Symlink escape is considered or documented
[ ] Only /sandbox/ paths are allowed by policy
[ ] Delete tool is blocked by default
[ ] Write tool requires approval by default
```

## Prompt injection

```txt
[ ] User prompts scanned for bypass attempts
[ ] Tool outputs scanned for bypass attempts
[ ] Exa/web content treated as untrusted
[ ] Malicious file demo exists
[ ] Model cannot bypass policy by following tool-output instructions
```

## Secrets

```txt
[ ] Environment variables never sent to frontend
[ ] MCP headers/API keys never logged
[ ] Secret scanner redacts raw values
[ ] Audit logs redact sensitive data
[ ] README uses placeholders only
```

## Budgets and approvals

```txt
[ ] Max tool-call budget enforced
[ ] Token budget tracked if available
[ ] Approval requests persist
[ ] Approval timeout denies by default
[ ] Denied approvals do not execute tools
```

## Rule conflicts

Use this precedence:

```txt
explicit block > budget exceeded > input validation failure > high-risk prompt injection > approval required > allow
```

Check:

```txt
[ ] Conflict behavior implemented
[ ] Conflict behavior documented
[ ] Logs show winning rule/reason
```
