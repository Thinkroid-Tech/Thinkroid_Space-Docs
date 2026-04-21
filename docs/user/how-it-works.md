# How It Works

## The Big Picture

Thinkroid Space gives you a virtual office that you run as the Boss. Your AI agents live and work inside this office — they walk around, sit at desks, use tools, communicate with each other, and complete the tasks you give them. The pixel-art interface isn't just visual decoration: it makes everything that's happening visible at a glance.

---

## The Office

The office is a top-down pixel-art map. It has rooms (meeting rooms, break rooms, workspaces), furniture, and a bulletin board. Agents move around the office depending on what they're doing — heading to a meeting room when a meeting is called, visiting the break room when they need to rest, or returning to their desk when a task comes in.

You can customize the layout: resize rooms, add furniture from the Item Shop, create new rooms, and set up different areas for different kinds of work.

---

## Agents

Each agent is an independent AI worker with their own identity, expertise, and memory. Under the hood, every agent has two components:

- **Brain** — the main AI model that handles reasoning and task execution. This is what actually does the thinking and the work.
- **Cerebellum** — a secondary model (can be the same or a lighter model) that manages the agent's memory. The Cerebellum extracts important information from completed work and organizes it into long-term memory.

Agents also have:

- **Roles and Specialties** — what they're good at (researcher, writer, developer, analyst, etc.)
- **Personas** — how they communicate and approach problems
- **Memory** — they remember past work, conversations, and learned skills, building up expertise over time
- **Morale** — a real-time health indicator that reflects how busy or strained the agent is

---

## The Boss (You)

As the Boss, you have full control over everything in the space:

- **Hire and fire agents** — build your team however you like
- **Assign tasks** — through Boss Chat or the Task Board
- **Approve sensitive actions** — agents will pause and ask before doing anything risky (like deleting files or sending messages externally), depending on how you've configured governance
- **Design the office** — arrange rooms, place furniture, customize the space
- **View everything** — all conversations, task outputs, and agent activity are visible to you

You're also the only one who can change Settings and access the full system configuration.

---

## How Agents Work

**When idle**, agents aren't just sitting there. They:
- Walk around the office
- Read the bulletin board
- Visit the break room and chat with other agents (sometimes generating useful project insights)
- Check for new tasks or messages

**When given a task**, agents:
1. Read and plan the task
2. Pull relevant memories from past work
3. Use tools to execute — searching the web, writing files, running code, sending messages, and more
4. Stream their output in real time so you can watch their progress
5. Report back when done

**Between tasks**, the Cerebellum reviews recent activity and updates the agent's memory — consolidating short-term notes into long-term knowledge.

---

## Key Concepts

| Concept | What it means |
|---------|---------------|
| **Tasks** | A unit of work you assign to an agent. Tasks have statuses (To Do, In Progress, Done) and live on the Task Board. |
| **Projects** | A container grouping related tasks together. Every task belongs to a project. |
| **Tools** | Actions agents can take — web search, file creation, running code, sending messages, and dozens more. Each tool can be restricted or approved. |
| **Governance** | Rules controlling what agents can do without asking you first. Configure per-agent or globally. |
| **Memory** | Agents keep short-term memory (recent context) and long-term memory (persistent knowledge), plus a static persona. A dedicated skill-memory tier is planned but not yet persisted. |
| **Morale** | An indicator of how strained an agent is. When morale drops low, the agent takes a break, which triggers memory consolidation. This is a health signal, not a game mechanic. |
| **Records** | Permanent reference documents that agents and you can create. Meeting notes, research findings, work summaries — anything worth keeping. |
| **Rooms** | Sub-areas of the office with their own themes, rules, and access controls. Context changes when an agent enters a room. |
| **Organizations** | Logical groups of agents — like a team or department. Each org can have its own rules and projects. |

---

## What Stays On Your Machine

Everything. Thinkroid Space runs entirely locally:
- All agent data, tasks, and conversations are stored in a local SQLite database
- Agent memory files are saved in the `office/` folder on your machine
- Your API keys stay local and are only used to call your configured AI providers
- No data is sent to Thinkroid servers

The only external calls are to the AI provider APIs you configure yourself.
