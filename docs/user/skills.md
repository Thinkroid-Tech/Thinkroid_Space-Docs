# Skills & MCP

## What are Skills?

Skills extend what your agents can do. Every agent comes with a set of built-in tools, but skills let you connect them to external services — giving them the ability to search the web, query a database, send emails, interact with APIs, and much more.

Skills are powered by the **Model Context Protocol (MCP)**, an open standard that lets AI systems communicate with external tools in a consistent way. You don't need to understand the protocol itself — just think of MCP servers as skill packs that you plug in.

---

## Built-in Tools vs Skills

Every agent has access to the same set of built-in tools out of the box:

- **Built-in tools** (51 total) cover the fundamentals: chatting, reading and writing files, browsing the web, running containers, managing tasks, scheduling cron jobs, Athena UI bridge helpers, and more. These are always available to every agent and don't require any setup.

- **Skills** are add-ons. They come from MCP servers you connect, and they unlock capabilities that go beyond the built-in set — things like querying a specific SaaS product, running specialized computations, or integrating with your internal systems.

If you're not sure whether you need a skill, start with the built-in tools. You'll know you need a skill when an agent tells you it can't do something you expected it to handle.

---

## Adding an MCP Server

To connect a new skill source:

1. Go to **Settings → Skills**
2. Click **Add MCP Server**
3. Enter a name for the server and its URL
4. Click **Connect**
5. The system will automatically discover all the tools that server provides

Once connected, the server's tools appear in your Skill Library and are ready to assign to agents.

---

## Per-Agent Skill Assignment

Not every agent needs every skill. A research agent might need web search and document tools, while a coding agent needs container access and a code execution environment. Keeping skill assignments focused helps agents stay on-task and avoids confusion.

To assign skills to a specific agent:

1. Open the agent's profile
2. Go to **Agent Settings → Skills**
3. Toggle on the skills you want that agent to have access to

Changes take effect immediately — no restart needed.

---

## Skill Library

The Skill Library is your catalog of everything available. For each skill you can see:

- What tools it provides and what those tools do
- Which agents currently have it assigned
- Whether it's active or needs reconnection

From the library you can install community-shared skill packs with one click. Installing a new skill pack requires Boss approval, since new MCP connections expand what agents can do.

---

## Requesting New Skills

Agents can recognize when they lack a capability they need. When this happens, an agent can submit a request for a new skill — you'll see it appear in the Approval Queue with a description of what the agent is trying to accomplish and what skill it believes would help.

Review the request, and if it looks reasonable, approve it to install the corresponding MCP server. You can also deny the request and leave a note explaining an alternative approach.

This keeps you in control of what external services your agents can reach, while still letting agents surface their own capability gaps.
