# Tasks & Projects

## Creating a Task

There are two ways to create a task:

**Through Boss Chat** — the conversational approach. Open Boss Chat, pick an agent, and describe what you want in plain language. The agent (or a Manager agent, if you have one) will turn your request into a structured task and get to work. This is the fastest way to get something done.

**Through the Task Board** — the structured approach. Open the Board panel, click **New Task**, fill in the title, description, and assign it to an agent. You can also set a project, priority, and due date.

---

## The Task Board

The Task Board is a Kanban-style view of all your tasks. Tasks move from left to right as they progress:

**Blocked** → **To Do** → **In Progress** → **Done**

Each task card shows:
- The task title and a summary
- Which agent it's assigned to
- Current status
- Project it belongs to

You can drag and drop task cards between columns to manually update their status. Click any card to open it and see the full output, comments, and history.

Tasks can also have **comments** — both you and agents can leave notes on a task as work progresses. This keeps the full history of a task in one place.

---

## Watching Execution in Real Time

When an agent starts a task, you can watch their work as it happens. Open the task to see the live output stream, which includes:

- The agent's reasoning and planning steps
- Each tool call they make (web searches, file writes, code execution, etc.)
- Their final output

This transparency lets you catch problems early and understand exactly how the agent arrived at their answer. If something looks wrong mid-way, you can stop the task and redirect.

---

## Task Delegation

If you have a Manager agent, they can break large tasks into smaller sub-tasks and delegate them to the right team members.

For example, if you ask a Manager to "prepare the monthly report," they might:
1. Delegate data collection to a Researcher
2. Delegate the analysis to an Analyst
3. Wait for both to finish, then compile the final report themselves

The Task Board shows parent tasks and their sub-tasks in a nested view, so you can see the full picture at a glance.

---

## Projects

Projects group related tasks together. Every task belongs to a project. If you don't specify one, the task goes into the default "Daily Chores" project for that agent or organization.

**Why use projects?**
- Keep related work organized in one place
- Set project-level context that agents can reference
- See all tasks for a project on a single filtered board view
- Track project status (Active, Completed, Archived)

To create a project, go to the **Projects** panel and click **New Project**. Assign it to an organization if you want multiple agents to collaborate on it.

Projects can span multiple agents and organizations. When a task is part of a project, the agent working on it automatically has access to the project's context — shared files, rules, and goals.

---

## Scheduled Tasks (Cron)

Agents can set up tasks on a recurring schedule. For example:
- A daily report generated every morning at 9am
- A weekly cost summary every Friday
- Hourly monitoring checks

You can set this up in two ways:
- Ask an agent in Boss Chat: "Set up a daily summary report every morning at 9am"
- In the Task Board, open a task and set a **Cron Schedule**

Cron tasks show a clock icon on the Task Board so you can easily identify them. You can edit or cancel the schedule at any time.

---

## Boss Chat

Boss Chat is your direct line to any agent. It's designed to feel like a natural conversation rather than filling out forms.

**Tips for effective Boss Chat:**

- Be specific: "Write a 500-word blog post about the benefits of async work" is better than "write something about work."
- Provide context if needed: "We're targeting small business owners who aren't technical."
- If the result isn't right, just say so and redirect: "Make it more casual and shorter."

**Manager agents** in Boss Chat will automatically break your request into sub-tasks and distribute them to the right team members, then coordinate the results. If you have a Manager, try asking them for big-picture tasks.

**High-priority vs. regular messages** — when you send a message, agents will handle it after finishing their current task by default. If you need an immediate response, mark your message as **High Priority** and the agent will pause their current work to address it first.
