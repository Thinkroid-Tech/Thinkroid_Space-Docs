# Governance & Approvals

## What is Governance?

Governance is how you control what your agents are allowed to do on their own versus what needs your explicit approval. Think of it as setting permission levels for your AI employees — some agents can work independently, others need to check in with you before taking action.

By default, agents are fairly conservative. As you build trust with a particular agent, you can unlock more capabilities. If something goes wrong, you can pull back permissions at any time.

### Where to find it

Open the **Governance panel** by clicking the 🏛 button in the right sidebar under the Tools category. The panel has three tabs:

- **Abilities** — Lists all 21 capabilities with their descriptions. Capabilities that have configurable prompts show an Edit Prompts button to customize the system and user prompt blocks for that ability.
- **Agents** — A read-only overview of which agents currently have governance abilities assigned, shown as color-coded badges.
- **Rules** — Unified rules management. Create, edit, enable/disable, and delete rules with a scope selector (company / project / org / department / room) and optional conditions (scenes, agents, hint text).

---

## Capabilities

There are 21 capabilities you can grant or revoke per agent, organized into four categories.

### Permissions

These control the core operational abilities agents have:

- **Task Assignment** — Agent can create and assign new tasks to other agents or itself.
- **Team Awareness** — Agent can see what other agents are working on and their current status.
- **Escalation** — Agent can escalate problems up the chain — flagging blockers, requesting more resources, or pulling in a manager.
- **Token Tracking** — Agent actively monitors its own token consumption and reports usage.
- **Cron Management** — Agent can schedule recurring jobs (e.g. "run this check every morning at 9am").
- **Container Management** — Agent can spin up and manage Docker containers to run code or services.

### Skills (Automated Monitoring)

These are automated background tasks that agents can run to keep things healthy:

- **Cost Reporting** — Periodically summarizes spending so you always know what things cost.
- **Budget Monitoring** — Watches total spend and warns you (or takes action) if you're approaching your limit.
- **Orphan Detection** — Finds tasks that have no assigned agent and flags them for reassignment.
- **Stuck Detection** — Identifies tasks that haven't made progress and surfaces them for review.
- **Retry Monitoring** — Tracks tasks that have been retried multiple times and alerts you if something keeps failing.
- **Result Validation** — Checks that completed task outputs actually meet the success criteria.
- **Token Monitoring** — Watches token usage across all agents and highlights anomalies.
- **Stall Detection** — Catches agents that are alive but not doing anything useful.
- **Load Balancing** — Redistributes work if some agents are overwhelmed and others are idle.
- **Entropy Calculation** — Measures how chaotic or unpredictable the overall workload is becoming.
- **Performance Review** — Generates regular summaries of how well each agent is performing.
- **Model Fit Review** — Evaluates whether the AI model assigned to an agent is the best fit for its workload.

### Hooks (Quality Control)

These fire at key moments in a task's lifecycle:

- **Output Review** — Before a task is marked complete, the agent's output is reviewed against the requirements.
- **Intervention** — Allows the system (or you) to step in and modify an agent's behavior mid-task.

### Approval

Controls whether this agent can participate in the tool approval pipeline:

- **Tool Approval** (`tool_approval`) — This agent reviews incoming tool-use requests from other agents and decides whether to approve, deny, or escalate each one. Highlighted in orange in the capability list.

---

## Templates

Setting up capabilities one by one can be tedious. Templates give you a pre-built capability set matched to a common role:

| Template | Best for |
|---|---|
| **Manager** | Agents that coordinate other agents and assign work |
| **Accountant** | Agents focused on cost tracking and budget oversight |
| **InternalAuditor** | Agents that review outputs and validate quality |
| **Sentinel** | Agents that monitor for problems and anomalies |
| **WorkflowJanitor** | Agents that clean up stalled, orphaned, or stuck work |
| **Evaluator** | Agents that assess performance and fit |
| **ToolUseManager** | Agents that handle the tool approval pipeline |
| **Architect** | Agents focused on system design and technical planning |
| **Developer** | Agents that write and review code |
| **Tester** | Agents that validate outputs and run quality checks |

Apply a template as a starting point, then fine-tune the individual capabilities as needed.

---

## Tool Approval Agent

The **ToolUseManager** template creates an agent dedicated to reviewing tool-use requests from the rest of your team before those tools are actually invoked.

When an agent in your workspace tries to call a tool, the request can be routed to the ToolUseManager first. The ToolUseManager evaluates the request and takes one of three actions:

- **APPROVE** — the tool call proceeds immediately
- **DENY** — the tool call is blocked and the requesting agent is notified
- **ESCALATE** — the request is forwarded to the human Approval Queue for your review

### Scope setting

In **Agent Settings → Governance tab**, the Tool Approval scope controls which tool calls get routed to the approval agent:

- **`confirm_only`** — only high-risk or flagged tool calls go through the approval agent; routine calls proceed directly
- **`all`** — every tool call from this agent is reviewed before execution

Use `confirm_only` for most agents to keep things moving. Use `all` for agents operating in sensitive contexts where you want tighter control.

The ToolUseManager itself runs autonomously. You only see requests in your Approval Queue when the ToolUseManager explicitly escalates something it can't confidently approve or deny on its own.

---

## The Approval Queue

When an agent tries to do something that requires your sign-off, the request appears in the Approval Panel. Each item shows:

- Which agent is making the request
- What action they want to take
- Any relevant context or reasoning

You can **Approve** to let the action proceed, or **Deny** to block it. Denied requests are logged so you can review patterns over time.

Keep an eye on the Approval Panel — a backlog of pending approvals can slow down your agents.

---

## Governance Loop

The Governance Loop is an automated background process that continuously monitors the health of your workspace. It looks for:

- Tasks that are stuck or making no progress
- Agents that are overloaded or idle
- Budget thresholds being approached
- Outputs that fail validation

When it detects a problem, it can take corrective action automatically (if you've granted the relevant capabilities) or surface an alert in the Approval Queue for you to handle. You can configure how aggressive the loop is in Settings.
