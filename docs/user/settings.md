# Settings

Open Settings by clicking the **gear icon** in the top-right of the HUD, or through the sidebar. Everything is configured through the UI — you don't need to edit any files.

---

## AI Providers

This is where you connect Thinkroid Space to the AI models your agents will use.

Click **Add Provider** and fill in:
- **Name** — a label for this connection (e.g. "OpenRouter", "Local Ollama", "Claude via Anthropic")
- **Base URL** — the API endpoint (e.g. `https://openrouter.ai/api/v1`)
- **API Key** — your key for this provider (stored locally, never shared)
- **Model** — the specific model name to use (e.g. `claude-3-5-sonnet`, `gpt-4o`, `llama-3.3-70b`)

You can add as many providers as you like and mix them across agents — one agent might use a powerful cloud model for complex reasoning while another uses a fast local model for simpler tasks.

**Supported provider types:**
- OpenAI (GPT models)
- Anthropic (Claude models)
- OpenRouter (access to many models through one key)
- Local LLMs via Ollama or any OpenAI-compatible server
- Any provider that exposes an OpenAI-compatible API

Each provider entry also lets you set **rate limits** (requests per minute) and **context window size** (maximum tokens), which helps Thinkroid Space manage load and avoid hitting provider limits.

---

## Model Configuration

Once providers are set up, you can assign them to agents individually. There are also global defaults:

**Default Brain Model** — the model used for all new agents' reasoning and task execution unless you override it per-agent. Set this to your preferred general-purpose model.

**Default Cerebellum Model** — the model used for memory management (consolidating and organizing agent memories). A lighter, less expensive model often works well here. Defaults to the same as the Brain model unless you change it.

**Per-agent overrides** — in each agent's settings, you can choose a different model for that specific agent's Brain, Cerebellum, or Context Engine. This is useful for giving certain agents access to specialized or more powerful models while keeping costs low for simpler agents.

A note on the **Context Engine**: when it's using a lightweight model, you'll see a notice suggesting you configure a higher-capability model for it — the Context Engine is responsible for pulling relevant memories, and a stronger model improves retrieval quality.

---

## Backup Model Configuration

You can configure a **backup model** for each AI model type. If the primary model fails (rate limit, server error, or timeout), Thinkroid Space automatically retries with the backup model — no manual intervention needed.

**Global defaults** are set in Settings → Models tab. You can set a backup for the Brain, Cerebellum, and Context Engine. These apply to all agents unless overridden.

**Per-agent overrides** — in each agent's Settings → Models tab, you can set a different backup Brain or backup Cerebellum just for that agent. The agent-level backup takes priority over the global default.

**Athena** has its own backup model, configured in the Athena panel settings.

**How the fallback works:**
1. Primary model is called. If it fails, it retries up to 3 times.
2. If all 3 retries fail, the backup model is used instead (also up to 3 retries).
3. If the backup also fails, the task or request returns an error.

If no backup is configured and the primary model fails, the error is reported normally. Setting up a backup is optional but recommended for production use where uninterrupted operation matters.

---

## Space Settings

**Space Name** — the name displayed in the top-left of the HUD. Call it whatever you like: "HQ", "Home Office", "The Lab."

**Office Dimensions** — width and height of the office in tiles (default: 50 x 38). Larger offices have more room for agents and rooms, but take more screen space.

**Outdoor Padding** — how many tiles of grass extend beyond the office walls on each side (default: 12 tiles). Agents can walk in this area.

**Agent Movement Speed** — how fast agents walk around the office. Purely visual; doesn't affect task performance.

**Idle Loop Interval** — how often idle agents check for things to do (visit the bulletin board, wander to the break room, etc.). Lower values mean more frequent autonomous activity.

---

## Message Retention

Conversations, bulletin board posts, and chat logs accumulate over time. Configure how long they're kept:

**By count** — keep the most recent N messages per channel. When the limit is reached, the oldest messages are automatically removed.

**By time** — keep messages from the last N days or hours. Messages older than this threshold are removed.

Both policies can be active at the same time — whichever condition is met first triggers a cleanup.

**Meeting conclusions (Records) are always kept.** Retention policies only apply to raw messages, not to the permanent Records created from meeting summaries.

---

## System Language

Switch the interface language between **English**, **Chinese (中文)**, and **Japanese (日本語)**. This changes both the UI text and the language used in agent prompts, so your agents will respond in the selected language.

If any agent has customized prompts (which you set manually), a warning will appear when you switch languages — custom prompts don't auto-translate and will need to be updated manually.

---

## User Management

Thinkroid Space has a built-in authentication system with three roles. Only admins can manage users.

### First-Time Setup

When you first launch Thinkroid Space, you'll see a setup screen asking you to create the initial **admin** account. This account has full control over everything. You'll also set your Space name here.

### Three Roles

Each role has a fixed set of permissions that cannot be customized per user.

| Role | Summary |
|------|---------|
| **Admin** | Full access to everything, including user management. |
| **User** | Full workspace access. Cannot manage users. |
| **Viewer** | Read-only. Can observe but not create, modify, or delete anything. |

### Permission Comparison

| Permission | Description | Admin | User | Viewer |
|-----------|-------------|:-----:|:----:|:------:|
| manage_users | Create, edit and delete users | Yes | — | — |
| manage_agents | Create, edit and delete agents | Yes | Yes | — |
| manage_tasks | Create, assign and execute tasks | Yes | Yes | — |
| send_messages | Send boss messages and announcements | Yes | Yes | — |
| manage_settings | Modify global settings and providers | Yes | Yes | — |
| manage_containers | Start, stop and remove containers | Yes | Yes | — |
| manage_spaces | Edit office layout, rooms and items | Yes | Yes | — |
| manage_rules | Manage company and project rules | Yes | Yes | — |
| manage_conversations | Initiate meetings and conversations | Yes | Yes | — |
| manage_records | Create and edit knowledge records | Yes | Yes | — |
| manage_cron | Manage scheduled tasks | Yes | Yes | — |
| use_athena | Use Athena AI assistant | Yes | Yes | — |
| view | View all data (read-only access) | Yes | Yes | Yes |

### Account Limits

Each Thinkroid Space instance supports a fixed number of accounts per role:

| Role | Max accounts |
|------|-------------|
| Admin | 1 |
| User | 2 |
| Viewer | 2 |

The quota bar at the top of User Management shows current usage (e.g. "Admin: 1/1 · User: 0/2 · Viewer: 0/2"). Roles that have reached their limit are disabled in the create and edit forms.

### Creating Users

Go to **User Management** (accessible from the HUD settings dropdown or the mobile nav). Click **Add User** and fill in:
- **Username** — login name
- **Display Name** — shown in the UI
- **Password** — initial password
- **Role** — admin, user, or viewer (roles at capacity are greyed out)

### Account Security

- Accounts lock after **5 failed login attempts** (15-minute lockout per account, 30-minute lockout per IP after 20 failures)
- Optional **Cloudflare Turnstile** CAPTCHA can be enabled via environment variables
- **fail2ban** integration blocks repeated failed login IPs at the firewall level (when running in Docker)

---

## Debug Mode

Debug Mode is an admin-only toggle that reveals advanced configuration options throughout the interface. When disabled (the default), these features are hidden to keep the UI simple for everyday use.

**How to enable it:** Go to Settings > Debug tab (visible only to admin accounts) and turn on "Enable Debug Logging."

**What it unlocks:**

- **Prompt Editor** — The 🧠 Prompts button appears in the sidebar, giving access to the Context Engine and Memory Engine prompt block editor
- **Agent Settings** — Additional tabs appear: Prompts (scene template overrides), Memory (capacity and decay tuning), Tools (per-component tool access), and Speed (output rate limits). Shadow Mode and Advanced Settings (max tokens) also become visible
- **Governance Panel** — The Abilities tab appears, allowing you to edit governance prompt blocks. Rule creation gains a Condition editor for scene/agent filtering
- **Cron Panel** — Script-type jobs become available (run shell commands or container scripts on a schedule)
- **Container Panel** — Action buttons (Logs, Stop, Remove) appear on container cards
- **Settings > Models tab** — Idle Loop and Idle Behavior controls become visible

Users with the **user** or **viewer** role never see these features, regardless of whether debug mode is enabled.

---

## Governance

Open the Governance panel from the **Tools** section in the right sidebar (🏛 icon).

The Governance panel has up to three tabs: **Abilities** (admin + debug mode only), **Agents**, and **Rules**.

### Abilities

Configure the global default governance prompt templates. Thinkroid Space has 22 governance abilities — behaviors that agents can perform autonomously as part of their role (output review, intervention, janitor sweeps, notification filtering, handovers, and more).

Each ability has a default prompt that controls how it behaves. All agents inherit these defaults unless they override them individually in their Agent Settings > Governance tab. Click **Edit Prompts** next to any ability to customize its default prompt text.

This tab is only visible when Debug Mode is enabled by an admin.

### Agents

A read-only overview showing which agents currently have governance abilities enabled. Each agent card displays the agent's name, role, and a list of their active governance capabilities with color-coded badges.

To modify an agent's governance abilities, go to that agent's Settings > Governance tab.

### Rules

Manage all rules that guide agent behavior across your workspace. Rules from all organizational levels are unified in one place.

**Scope** — use two linked dropdowns to select the scope for your rules. Five scope categories are supported:
- First choose a **category**: Company, Organization, Department, Project, or Room
- Then choose the specific **entity** within that category (e.g. which organization or project)

Rules from all matching scopes are aggregated and injected into the agent's context together; there is no "more specific overrides less specific" inheritance at runtime.

Each rule has:
- **Category** — a grouping label (e.g. "code_quality", "communication")
- **Title** — a short name for the rule
- **Content** — the full rule text
- **Enabled** — toggle rules on/off without deleting them (displayed as a slide switch)
- **Condition** (optional) — control when the rule is applied:
  - **Scenes** — limit to specific scenes (task, chat, meeting, idle)
  - **Agents** — limit to specific agents by name
  - **Hint** — free-text note included with the rule for AI context

---

## Debug Mode

Debug mode is for troubleshooting. When enabled, every AI call is logged in full detail:

- The full context sent to the model
- The complete response received
- Token counts
- Tool calls and their results (when agents use tools mid-task)

Open the **Debug Log Viewer** to browse these logs. Entries are color-coded by type (chat, task, memory, tool use) and can be expanded or collapsed. You can page through logs and clear them all with one click.

Turn this off in normal use — it generates a lot of data.

---

## Notifications

Thinkroid Space can receive announcements and alerts from the Thinkroid team through a notification banner that scrolls across the top of the screen.

**Enable/Disable** — the toggle in the Notifications tab of Settings controls whether you see general announcements. When disabled, only security-related notifications are shown.

**Security updates** — notifications tagged as `[Security Update]` always appear regardless of your notification preference. These contain important security information you should act on.

**Dismissing** — click the X button on the right side of the notification bar to dismiss all current notifications. Dismissed notifications won't reappear, even after refreshing the page.

**New installations** — when you first set up Thinkroid Space, you'll see any recent announcements from before your install date (up to 3) plus all announcements published after.

---

## Tool Permissions

You can restrict which tools are available globally across all agents. This is useful if you want to disable certain capabilities entirely — for example, preventing any agent from executing shell commands.

Global tool permissions set the ceiling. Individual agent permissions can be more restrictive but not more permissive than the global setting.

Tool restrictions apply immediately without restarting any agents.

