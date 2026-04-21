# Agents

## Hiring an Agent

The system starts with no agents installed. Every agent in your workspace is one you create yourself.

Click the **Hire** button in the top HUD to open the onboarding wizard. It walks you through 9 steps:

1. **Template** — pick a starting point from the available agent templates, or start from scratch
2. **Basic Info** — name, role, and department
3. **Department** — which team or group this agent belongs to (optional)
4. **Persona & Memory** — how the agent communicates and behaves
5. **Skills & Permissions** — which tools the agent can use
6. **Models** — which AI model powers their Brain and Cerebellum
7. **Governance** — what the agent can do autonomously vs. what requires your approval
8. **Legacy** — optionally inherit memories from a previously offboarded agent
9. **Review & Create** — confirm everything and hire

Steps 3 through 8 are optional. You can skip them all and configure the details later in Agent Settings.

**Athena can help.** During each wizard step, the built-in AI assistant Athena can suggest names, personas, model choices, and governance settings based on your existing team setup. She'll offer options — you pick or customize.

---

## Agent Settings

Once an agent is hired, click on them in the office or find them in the Agents panel to open their settings.

### Brain Model

The main AI model the agent uses for thinking and executing tasks. You can choose any model from your configured providers. A more capable model means better reasoning, but higher cost.

### Cerebellum Model

The model used for memory management — consolidating short-term notes into long-term knowledge after tasks complete. This can be a lighter, less expensive model since it doesn't need to do heavy reasoning. By default it inherits the Brain model.

### Context Engine

Controls how the agent pulls relevant memories into its working context. By default it inherits the Cerebellum model. You can configure it independently if you want stronger memory retrieval. When set to a lightweight model, a notice will remind you that retrieval quality may be reduced.

### Persona

A description of how the agent speaks and behaves. This shapes the tone and style of all their outputs. You can write anything: "Direct and concise, always uses bullet points" or "Enthusiastic researcher who explains things clearly."

### Specialty

The agent's area of expertise. This affects which tasks get suggested to them and how they approach work. Examples: Software Development, Content Writing, Data Analysis, Financial Reporting.

You can edit an agent's specialty at any time in the **Profile** tab of Agent Settings. Agents with the `update_self_profile` tool enabled can also update their own persona and specialty autonomously as their role evolves.

### Avatar

The agent's visual appearance in the office. Choose from the available pixel-art character styles.

---

## Agent Templates

When hiring, the first wizard step asks you to pick a template. There are **11 predefined templates plus a Custom (blank) entry** for a total of 12 starting points:

**Governance templates** — these agents keep your workspace healthy and under control:

| Template | What they do |
|----------|-------------|
| **Manager** | Assigns tasks to team members, monitors workload, handles escalations from other agents |
| **Accountant** | Tracks AI token usage across your team, generates cost reports, monitors budget thresholds |
| **InternalAuditor** | Reviews completed task outputs for quality — samples 30% by default, with full review for underperforming agents |
| **Sentinel** | Monitors for stuck tasks and system health issues, automatically takes corrective action |
| **WorkflowJanitor** | Cleans up orphaned tasks, detects retry failures, monitors project health |
| **Evaluator** | Reviews agent performance scores and recommends whether a model upgrade or downgrade is appropriate |
| **ToolUseManager** | Reviews incoming tool requests from other agents, then auto-approves, denies, or escalates each one |
| **NotificationReader** | Filters the governance feed for you — forwards items worth your attention and archives routine noise |

**Role templates** — general-purpose agents for common work:

| Template | What they do |
|----------|-------------|
| **Architect** | Designs system structure, plans technical decisions, documents architecture choices |
| **Developer** | Writes and reviews code, implements features, debugs issues |
| **Tester** | Creates test cases, runs quality checks, validates outputs against requirements |

**Custom** — start from a blank slate and configure everything yourself.

Each predefined template comes pre-configured with a suitable persona, specialty, default capabilities, and multi-language labels. These are starting points — you can customize any settings after hiring, or mix and match capabilities when creating a custom agent.

---

## Shadow Mode

Shadow Mode lets you test a new agent without risk before they start doing real work.

When an agent is in Shadow Mode:
- They receive the same real tasks as your regular agents
- They produce their own independent outputs
- Their outputs are **not delivered** — they're kept separate for comparison
- The Evaluator can generate a comparison report showing how the shadow agent performed vs. the live agent

When you're confident in the new agent, you can promote them from Shadow Mode to full active status. This is useful when trying out a new model or a different configuration without disrupting your live workflow.

---

## Offboarding

Removing an agent is a two-step flow. You can run them separately — preview the handover first, then confirm deletion.

1. **Offboard** — the agent generates a handover document summarizing current work, key memories are exported as a **Legacy** file, and a note is written for their successor. The agent row is still in place, so you can review the Legacy before committing.
2. **Delete** — the agent row, workspace room, and working-memory directory are removed. If offboarding hasn't run yet, the platform will try to generate a Legacy first. **Legacy and Handover files always survive deletion** so a future hire can still learn from them.

New agents you hire later can **inherit this legacy** — loading the departing agent's accumulated knowledge as a starting point. Switching to a better model doesn't mean losing everything the previous agent learned.

---

## Morale

Each agent has a morale level visible as a small indicator above their head in the office. When morale is high, agents work normally. When it drops low, the agent becomes visibly tired (a grey bubble appears above them) and will eventually take a break.

Morale reflects real system conditions:
- How full their context window is
- How long they've been working without a break
- Task failure rate

When an agent rests, their Cerebellum runs a memory consolidation pass — tidying up short-term notes, archiving what's important, and clearing the working context. After resting, the agent returns to work in a fresh state.

You don't need to manually manage morale. The system handles it. Just be aware that if an agent seems slow or takes frequent breaks, they may be handling tasks that are particularly demanding.

---

## Organizations

Agents can be grouped into Organizations (teams, departments, or any logical group you define). Each organization can have its own rules and projects. An agent can belong to multiple organizations — for example, both a "Dev Team" org and a "Q3 Sprint" project org at the same time.

You manage organizations from the Organizations panel in the sidebar.
