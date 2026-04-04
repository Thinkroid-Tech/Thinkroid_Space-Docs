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

**1. Setup Wizard (automatic on first launch)**

When no AI providers are configured, the Setup Wizard opens automatically. It walks you through everything you need before entering the office.

**2. Add an AI provider**

In the wizard, click **Add Provider** and fill in:
- A name (e.g. "OpenRouter" or "My Local LLM")
- The base URL (e.g. `https://openrouter.ai/api/v1`)
- Your API key
- One or more model names

Use the **Test** button to verify the connection before saving.

**3. Choose default AI models**

Select which model to use for **Brain** (the main reasoning model) and **Athena** (your AI assistant). Cerebellum and Context Engine are optional — they fall back to your Brain model if left empty.

**4. Pick an office size**

Choose Small, Medium, or Large, or enter custom tile dimensions. You can resize later in Settings.

**5. Enter the office**

Click **Enter Office** to finish setup. On desktop, Athena opens automatically to help you hire your first agent and assign your first task.

**Hire your first agent**

Click the **Hire** button in the HUD to open the onboarding wizard. Pick a template (Developer, Manager, Tester, etc.) or start from scratch. Most steps are optional — you can refine settings later.

**Give them a task**

Click the **Chat** button, select your agent, and type what you want done. Natural language works fine: "Research the top 5 project management tools and write a comparison summary."

Your agent will appear in the office, walk to their desk, and start working. Check results in **Board**.

---

## What's Next?

- [How It Works](./how-it-works.md) — understand the core concepts
- [Agents](./agents.md) — hire, configure, and manage your team
- [Tasks & Projects](./tasks.md) — assign work and track progress
- [Office & Rooms](./office.md) — customize your space
- [Settings](./settings.md) — providers, models, and global options
