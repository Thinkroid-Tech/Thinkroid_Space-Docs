# Memory & Knowledge

## How Agent Memory Works

Agents don't just follow instructions and forget everything — they build up knowledge over time. When an agent completes tasks, has conversations, and observes how things work in your workspace, those experiences get stored as memories.

This matters because a well-seasoned agent performs better. An agent that remembers your preferences, your team's naming conventions, and which tools work well for certain tasks will produce higher quality work with less hand-holding from you.

---

## Memory Tiers

Memory is organized in three layers, each serving a different purpose:

### Short-term Memory

This is the agent's working memory — recent observations, partial results, and context from the current session. It fades quickly. Think of it like notes an employee jots down during a meeting: useful right now, but not meant to be kept forever.

Short-term memories are automatically created whenever an agent observes something new or completes a step in a task.

### Long-term Memory

Important information that gets promoted from short-term storage. Long-term memories persist across sessions and are available whenever the agent is working. This is where things like "Alice prefers concise summaries" or "the production database uses UTC timestamps" live.

Promotion happens automatically when a memory is referenced frequently or flagged as important — but you can also manually promote entries from the Memory Panel.

### Skill Memory (planned)

A future tier intended for technical knowledge and learned abilities — the "how I handled this kind of problem last time" layer. Not yet persisted: today, anything an agent learns accumulates in short-term and long-term memory instead. The dedicated skill tier will arrive with the planned `ThinkroidMemory` migration.

---

## Forgetting Curve

Memories don't last forever by default. Each memory has a relevance score that naturally decays over time — this is the forgetting curve.

Why does this exist? Without it, agents would accumulate enormous amounts of stale information that could actually interfere with good decision-making. An agent that remembers everything equally gives outdated information the same weight as current reality.

Memories that get referenced frequently stay fresh longer. Memories that nobody looks at or uses will fade and eventually be removed. You can always pin important memories to prevent them from fading.

---

## Memory Consolidation

When an agent enters a rest state (between active tasks), their memory system runs a consolidation process. During consolidation:

- Short-term memories are reviewed and evaluated
- High-importance ones are promoted to long-term storage
- Low-importance ones are allowed to fade
- Related memories are linked together for easier retrieval

You don't need to trigger this manually — it happens automatically. But you can force a consolidation from the Memory Panel if you want an agent to "digest" a particularly important session before starting new work.

---

## The Memory Panel

Open an agent's profile and navigate to the Memory tab to see memory stats (usage, capacity, consolidation config) and browse the raw persona / short-term / long-term memory files. You can also manually trigger a consolidation pass from here.

> **Heads-up — structured entry management is a placeholder.** The Memory Panel is wired up for a future per-entry workflow (pin / promote / delete / add individual memory entries), but the supporting endpoints are currently stubs that return an empty list pending the planned `ThinkroidMemory` migration. Until that ships, per-entry operations have nothing to act on; expected memory management is through the short / long / persona Markdown files and the automatic consolidation pipeline described above.

---

## Legacies

When an agent is offboarded, their memories aren't just deleted. Their persona, short-term, and long-term memory files are bundled into a Legacy archive — a knowledge package associated with that agent's profile.

When you hire a new agent, you can have them learn from the Legacy of a departed agent. This is especially useful for specialized roles: if a key agent leaves, their successor can inherit their institutional knowledge and get up to speed much faster.

Legacies are read-only archives. You can browse them from the Agent History section, and selectively apply portions to new agents rather than importing everything at once.
