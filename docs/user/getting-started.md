# Quick Start

## What is Thinkroid Space?

Thinkroid Space is a gamified AI agent platform that lives on your own machine. You hire AI agents, give them tasks, and watch them work inside a pixel-art virtual office — you're the Boss. Every agent runs locally, your data stays on your computer, and you connect your own AI provider of choice.

---

## Installation

### Docker (Recommended)

Docker is the easiest way to get up and running. You'll need [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed first.

```bash
# Clone the repository
git clone https://github.com/Thinkroid-Tech/thinkroid-space.git
cd thinkroid-space

# Start everything with one command
docker compose up -d --build
```

Once the build finishes, open your browser and go to **http://localhost:3000**.

To stop the platform:

```bash
docker compose down
```

### Local Development

If you prefer running without Docker, you'll need Node.js 22+ installed.

**Start the backend server** (runs on port 3000):

```bash
cd thinkroid-space-server
npm install
npm run dev
```

**Start the frontend** (runs on port 5173) in a second terminal:

```bash
cd thinkroid-space-ui
npm install
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Your First 5 Minutes

Here is the fastest path from zero to a working agent:

**1. Add an AI provider**

Go to **Settings** (gear icon in the top-right) and open the **Providers** tab. Click **Add Provider** and fill in:
- A name (e.g. "OpenRouter" or "My Local LLM")
- The base URL (e.g. `https://openrouter.ai/api/v1`)
- Your API key
- The model name you want to use

Hit **Save**. Your provider is now available for all agents.

**2. Hire your first agent**

The system starts with no agents — your office will be empty until you create some. Click the **Hire** button in the HUD to open the onboarding wizard.

The first step is picking a **template**. Templates are pre-configured starting points: choose one that matches the kind of agent you want (e.g. Developer, Manager, Tester) or skip to build from scratch. From there you'll be guided through giving the agent a name, setting a persona, and choosing a model. Most steps are optional — you can skip straight to the end and refine later.

**3. Open Boss Chat and give them a task**

Click the **Chat** button (or the speech bubble next to your agent), select your agent, and type what you want done. Natural language works fine: "Research the top 5 project management tools and write a comparison summary."

**4. Watch them work**

Your agent will appear in the office, walk to their desk, and start working. You can see their real-time output stream in the task panel — including their thinking steps and any tools they use.

**5. Check the results in the Task Board**

Click **Board** in the top menu. Your task will be there with its status and the agent's output. Completed work is saved and searchable.

---

## What's Next?

- [How It Works](./how-it-works.md) — understand the core concepts
- [Agents](./agents.md) — hire, configure, and manage your team
- [Tasks & Projects](./tasks.md) — assign work and track progress
- [Office & Rooms](./office.md) — customize your space
- [Settings](./settings.md) — providers, models, and global options
