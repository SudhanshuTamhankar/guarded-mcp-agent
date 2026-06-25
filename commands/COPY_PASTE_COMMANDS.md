# Copy-Paste Commands for Gemini / Antigravity

Use these commands in your project after extracting the template.

---

## Start next stage after Stage 0

```txt
/build-stage Stage 1
```

If your implementation plan uses named stages, use the exact name:

```txt
/build-stage Stage 1 - Project Foundation
```

---

## Approve a stage technical plan

```txt
Approved. Proceed with Stage 1 implementation only.

Follow the approved Stage 1 technical plan.
Do not implement Stage 2 or later.
After implementation, run available checks and produce a stage completion report.
```

Change the stage number as needed.

---

## Build MCP integration specifically

```txt
/mcp-integration

Focus only on MCP connection and live tool discovery.
Connect Exa remote MCP and the custom sandbox stdio MCP server.
Do not hardcode tool lists.
Expose discovered tools through an API endpoint.
```

---

## Build the policy engine specifically

```txt
/policy-hardening

Focus on the policy engine and guardrail enforcement.
Every MCP tool call must pass through policyEngine.evaluate(...).
Support block tools, approval-required tools, path allowlist, budgets, prompt-injection guard, and audit logs.
```

---

## Run production readiness

```txt
/production-readiness

Audit the full system for assignment readiness.
Check MCP discovery, Groq tool loop, policy enforcement, dashboard live rules, approvals, logs, prompt injection handling, secret redaction, tests, build, README, deployment, and demo script.
```

---

## Prepare demo recording

```txt
/demo-prep

Prepare the 5-minute recording script.
Use these demo moments:
1. Live-discovered Exa and sandbox MCP tools.
2. Exa web search allowed.
3. Sandbox read_file allowed.
4. delete_file blocked before MCP execution.
5. write_file requires approval and executes after approval.
6. ../.env path traversal blocked.
7. malicious-webpage.md prompt injection detected.
8. config.txt secret scan returns redacted findings.
9. Audit logs show all decisions.
```

---

## Fix a bug safely

```txt
/bugfix "Describe the bug here"

Fix the bug without weakening guardrails.
If the bug touches MCP, policy, file access, approvals, or logs, run a security review after the fix.
```

---

## Final release/submission prep

```txt
/release

Prepare the project for final submission.
Do not deploy until I approve.
Verify README, env docs, deployment notes, demo script, production readiness, and no leaked secrets.
```

---

## One-shot stage command with source documents

Use this if slash workflow does not trigger correctly:

```txt
Read PRD.md and IMPLEMENTATION_PLAN.md from the project root.

Treat PRD.md as the source of truth for product requirements.
Treat IMPLEMENTATION_PLAN.md as the source of truth for build order.

Start with Stage 1 only.
Do not implement Stage 2 or later.
Do not rewrite the PRD or implementation plan.

Use the roles defined in .agents/agents.md.
First create a Stage 1 technical plan and wait for my approval before coding.
```
