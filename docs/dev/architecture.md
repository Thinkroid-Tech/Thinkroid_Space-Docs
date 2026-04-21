# System Overview

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 18 |
| Game Engine | Phaser 3 |
| Backend | Node.js 22 + Express |
| Database | SQLite (better-sqlite3) |
| Communication | mitt event bus (Phaser ↔ React), SSE (server → client) |
| AI | OpenAI-compatible API (Claude, GPT, OpenRouter, local LLMs) |
| External Channels | Discord.js, node-telegram-bot-api |
| Container Management | Dockerode |
| Skills | Model Context Protocol (MCP) SDK |
| Auth | JWT + bcrypt, Cloudflare Turnstile (optional) |
| Deployment | Docker (multi-stage build, Node 22 Alpine) |

---

## System Diagram

```
┌───────────────────────────────────────────────────────────┐
│                        Browser                            │
│                                                           │
│  ┌────────────────┐    mitt event bus   ┌──────────────┐  │
│  │   React UI     │◄──────────────────►│  Phaser 3     │  │
│  │                │                     │  OfficeScene  │  │
│  │  56 panels &   │                     │  (map, agents │  │
│  │  overlays      │                     │   pathfinding │  │
│  │                │                     │   minimap)    │  │
│  └───────┬────────┘                     └──────────────┘  │
│          │ REST API + SSE                                 │
├──────────┼────────────────────────────────────────────────┤
│          ▼                                                │
│  ┌────────────────────────────────────────────────────┐   │
│  │              Express Server (26 routes)             │   │
│  │                                                     │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │  Routes  │  │   Services   │  │ Tool Registry │  │   │
│  │  │  (REST)  │  │              │  │ (51 tools,    │  │   │
│  │  │          │  │  AI Engine   │  │  auto-discover│  │   │
│  │  │ agents   │  │  Idle Loop   │  │  & execute)   │  │   │
│  │  │ tasks    │  │  Context Eng │  │               │  │   │
│  │  │ settings │  │  Governance  │  │ + MCP Skills  │  │   │
│  │  │ messages │  │  Cron Sched  │  │   (external)  │  │   │
│  │  │ athena   │  │  Conv Engine │  │               │  │   │
│  │  │ ...      │  │  Hook Mgr    │  │               │  │   │
│  │  └──────────┘  └──────┬───────┘  └──────────────┘  │   │
│  │                       │                             │   │
│  │         ┌─────────────┼─────────────┐               │   │
│  │         ▼             ▼             ▼               │   │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐         │   │
│  │   │  SQLite  │  │  Memory  │  │    AI    │         │   │
│  │   │   (DB)   │  │  (files) │  │  (LLMs)  │         │   │
│  │   │          │  │          │  │          │         │   │
│  │   │ agents   │  │ persona  │  │ Brain    │         │   │
│  │   │ tasks    │  │ short-   │  │ Cerebel  │         │   │
│  │   │ messages │  │   term   │  │ Context  │         │   │
│  │   │ providers│  │ long-    │  │   Engine │         │   │
│  │   │ cron_jobs│  │   term   │  │          │         │   │
│  │   │ rooms    │  │ legacies │  │          │         │   │
│  │   └──────────┘  └──────────┘  └──────┬───┘         │   │
│  │                                      │              │   │
│  │                          ┌───────────┼───────┐      │   │
│  │                          ▼           ▼       ▼      │   │
│  │                     ┌────────┐ ┌────────┐ ┌──────┐  │   │
│  │                     │ Docker │ │Discord │ │Telegr│  │   │
│  │                     │  API   │ │  Bot   │ │ Bot  │  │   │
│  │                     └────────┘ └────────┘ └──────┘  │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
thinkroid-space/
├── thinkroid-space-server/          # Express backend
│   └── src/
│       ├── routes/                  # 26 API route modules
│       │   ├── agents.js            #   Agent CRUD, settings, governance, morale
│       │   ├── tasks.js             #   Task lifecycle, SSE execution
│       │   ├── athena.js            #   Athena AI assistant endpoints
│       │   ├── settings.js          #   Global settings, provider management
│       │   ├── messages.js          #   Direct messaging between agents
│       │   ├── conversations.js     #   Conversation threading
│       │   ├── containers.js        #   Docker container management
│       │   ├── cron.js              #   Cron job scheduling
│       │   ├── skills.js            #   MCP skill management
│       │   ├── departments.js       #   Department structure
│       │   ├── organizations.js     #   Organization management
│       │   ├── rooms.js             #   Room layout & furniture
│       │   ├── items.js             #   Item registry & shop
│       │   ├── files.js             #   Sandboxed file operations
│       │   ├── approvals.js         #   Approval workflow
│       │   ├── auth.js              #   Authentication (JWT)
│       │   ├── users.js             #   User management
│       │   ├── outer-channels.js    #   Discord/Telegram channel config
│       │   ├── projects.js          #   Project management
│       │   ├── records.js           #   Meeting records & notes
│       │   ├── rules.js             #   Company/scope rules
│       │   ├── meeting.js           #   Meeting management
│       │   ├── spaces.js            #   Space configuration
│       │   ├── legacies.js          #   Departed agent knowledge
│       │   ├── notifications.js       #   External notification proxy + boss notifications
│       │   └── events.js            #   SSE event broadcasting
│       ├── services/                # Core business logic
│       │   ├── ai.js                #   Dual-model AI calling (Brain + Cerebellum)
│       │   ├── contextEngine.js     #   Dynamic prompt assembly & memory injection
│       │   ├── idleLoop.js          #   Autonomous agent behavior loop
│       │   ├── governanceEngine.js  #   22 capability definitions (management/finance/quality/monitoring/evaluation/approval), AGENT_TEMPLATES (11), applyTemplate()
│       │   ├── governanceLoop.js    #   Automated monitoring & intervention
│       │   ├── governancePrompts.js #   Governance action prompts
│       │   ├── governanceTriggers.js#   Event-driven governance triggers
│       │   ├── conversationEngine.js#   Multi-type conversation management
│       │   ├── cronScheduler.js     #   node-cron job scheduling
│       │   ├── containerAdapter.js  #   Docker container management
│       │   ├── outerChannelManager.js#  External channel routing
│       │   ├── discord.js           #   Discord adapter
│       │   ├── hookManager.js       #   Pre/post execution hooks
│       │   ├── hookSetup.js         #   Hook initialization
│       │   ├── interruptManager.js  #   Task interruption
│       │   ├── pathfinding.js       #   A* pathfinding for agent movement
│       │   ├── promptBlocks.js      #   System prompt building blocks
│       │   ├── sceneTemplates.js    #   Prompt scene templates
│       │   ├── tileGrid.js          #   Tile coordinate system
│       │   ├── auth.js              #   JWT & password management
│       │   ├── tools/               #   51 auto-discovered agent tools
│       │   │   ├── registry.js      #     Tool auto-discovery & registration (loads all 51 tool files; exports `{ definition, executor, defaultPermission }`)
│       │   │   ├── index.js         #     Tool execution dispatcher (approvals, permission checks, agent-approval routing)
│       │   │   ├── permissions.js   #     Tool permission checks
│       │   │   ├── helpers.js       #     Shared tool utilities
│       │   │   └── *.js             #     Individual tool files
│       │   ├── skills/              #   MCP integration
│       │   │   ├── skillManager.js  #     Skill lifecycle management
│       │   │   └── mcpClientPool.js #     MCP connection pooling
│       │   └── adapters/            #   External service adapters
│       │       ├── discord-adapter.js
│       │       └── telegram-adapter.js
│       ├── ai/                      # AI client factory
│       │   └── client.js
│       ├── middleware/              # Express middleware
│       │   ├── auth.js              #   JWT verification & permissions
│       │   └── accessLog.js         #   Request logging
│       ├── i18n/                    # Internationalization (en/zh/ja)
│       ├── db.js                    # SQLite schema, migrations, seed data
│       ├── memory.js                # Two-tier memory read/write
│       ├── memoryStore.js           # Memory indexing & search
│       ├── consolidate.js           # Memory consolidation (short→long term)
│       ├── extractMemories.js       # AI memory extraction from conversations
│       ├── morale.js                # Agent morale & stress calculation
│       ├── ratelimit.js             # API rate limiting
│       └── index.js                 # Server entry point
├── thinkroid-space-ui/              # Vite + React frontend
│   └── src/
│       ├── components/              # 56 UI panels & overlays
│       │   ├── AgentSettings.jsx    #   Per-agent configuration
│       │   ├── SpaceSettings.jsx    #   Global settings
│       │   ├── AthenaPanel.jsx      #   AI assistant chat interface
│       │   ├── BossChatPanel.jsx    #   Boss-to-agent chat
│       │   ├── Board.jsx            #   Kanban task board
│       │   ├── MemoryPanel.jsx      #   Memory inspector
│       │   ├── OuterChannelsOverlay.jsx # External channel config
│       │   ├── ContainerPanel.jsx   #   Docker container management
│       │   ├── CronPanel.jsx        #   Cron job scheduling
│       │   ├── FileManagerPanel.jsx #   File browser
│       │   ├── AgentSkillsPanel.jsx #   Skill management
│       │   ├── HirePanel.jsx        #   Agent hiring
│       │   ├── OnboardingWizard.jsx #   Multi-step onboarding wizard
│       │   ├── PromptEditor.jsx     #   System prompt editor
│       │   └── ...                  #   additional panels
│       ├── game/
│       │   ├── scenes/
│       │   │   └── OfficeScene.js   #   Main Phaser scene
│       │   └── tileConfig.js        #   Tile index mapping & styles
│       ├── auth/
│       │   └── AuthProvider.jsx     #   Auth context provider
│       ├── audio/
│       │   └── AmbienceAudio.js     #   Ambient sound effects
│       ├── i18n/                    #   Frontend translations (en/zh/ja)
│       ├── App.jsx                  #   Root component
│       ├── events.js                #   mitt event bus
│       ├── api.js                   #   API client
│       └── index.css                #   All styles
├── office/                          # Runtime data (Docker volume)
│   ├── agents/                      #   Per-agent memory & persona files
│   └── projects/                    #   Project workspaces
├── Dockerfile                       # Multi-stage build (Node 22 Alpine)
├── docker-compose.yml               # Single service, port 3000
├── docker-entrypoint.sh             # Container startup script
└── .env.example                     # Full configuration reference
```

---

## Configuration Reference

Configuration is split across two surfaces:

- **Environment variables** — runtime infrastructure (ports, paths, secrets, container limits, external tokens). Set in `Thinkroid_Space-Docker/<instance>/.env`.
- **`global_settings` table** — all AI model defaults and per-space preferences (space name, default brain/cerebellum/CE provider + model, Athena config, notifications, rules migration flag, etc.). Read/write through `GET/PUT /api/settings`.

Historical AI environment variables (`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `CEREBELLUM_*`, `BRAIN_MAX_TOKENS`, `CEREBELLUM_MAX_TOKENS`) have been retired. Models are resolved at runtime from the `providers` table and `default_{brain,cerebellum,context_engine}_*` keys in `global_settings`.

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend API port |
| `DB_PATH` | `/app/office/thinkroid-space.db` | SQLite file path inside the container |
| `AGENT_WORKSPACE` | `/app/workspace` | Agent-file isolation root |
| `SOURCE_DIR` | `main` | Worktree folder the compose file binds to |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | (auto-generated on first start) | JWT signing secret |
| `COOKIE_SECRET` | (auto-generated on first start) | Cookie signing secret |
| `TURNSTILE_SITE_KEY` | — | Cloudflare Turnstile site key (optional) |
| `TURNSTILE_SECRET_KEY` | — | Cloudflare Turnstile secret key (optional) |

### Docker Containers

| Variable | Default | Description |
|----------|---------|-------------|
| `DOCKER_SOCKET_PATH` | `/var/run/docker.sock` | Docker socket path |
| `DOCKER_HOST` | — | Remote Docker API (alternative to socket) |
| `HOST_DATA_DIR` | — | Host-side absolute path of `./office` (for Docker-in-Docker child mounts) |
| `HOST_WORKSPACE_DIR` | — | Host-side absolute path of `./workspace` |
| `HOST_SOURCE_DIR` | — | Host-side absolute path of the worktree |
| `DOCKER_WORKSPACE_HOST_PATH` | — | Legacy alias retained for backwards compatibility |
| `CONTAINER_CPU_QUOTA` | `50000` | CPU quota (50% of one core; `100000` = 100%) |
| `CONTAINER_MEMORY_LIMIT` | `512m` | Memory limit |
| `CONTAINER_MAX_PER_AGENT` | `5` | Max containers per agent |
| `CONTAINER_BACKEND` | `docker` | Container backend (`docker` or `coolify`) |

### External Integrations

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Discord adapter token (optional; per-channel tokens can also be stored per `outer_channels` row) |
| `TELEGRAM_BOT_TOKEN` | Telegram adapter token (optional) |
| `NOTIFICATIONS_SOURCE_URL` | Remote notice URL (default `https://www.thinkroid.space/notice.json`) |

Discord and Telegram integrations can also be fully managed through the **External Channels** system (`outer_channels` table) — each channel row stores its own credentials.

---

## Key Design Decisions

- **Phaser ↔ React communication** uses a mitt event bus (`events.js`), not direct coupling. Game state changes emit events that React panels subscribe to, and vice versa.
- **AI calls** are centralized in `services/ai.js`. All AI interactions go through this single module, which handles provider resolution, model selection, token tracking, and automatic backup model fallback. When the primary model fails after 3 retries (rate limit, 5xx, timeout), the module transparently retries with the configured backup model. Backup config is resolved in priority order: agent-level backup → global default backup → error. The `ai:backup:activated` hook event fires on fallback. All six call variants support this mechanism; the `*WithTools` variants accept a `backupConfigOverride` parameter for callers that manage their own config (e.g. Athena).
- **Task execution** is centralized in `taskExecutor.js`. `executeTask(taskId)` is the single entry point for running a task. Internal services (idleLoop, cronScheduler, delegate-task) call it directly — no internal HTTP `fetch()` calls and no auth bypass. `routes/tasks.js` is a thin HTTP wrapper around the same function. `createTaskInternal()` in the same module handles programmatic task creation with immediate execution.
- **Tool system** uses auto-discovery: any `.js` file in `services/tools/` that exports `{ defaultPermission, definition, executor }` is automatically registered at startup.
- **Tool permissions** have four levels: `auto` (execute immediately), `confirm` (Boss approval queue), `always_confirm` (per-agent hook via `tool_approval` capability — triggers `tryAgentApproval()` before execution), and `deny` (blocked). `checkPermission()` returns `always_confirm` as a distinct value; the tool dispatcher routes it through the designated approval agent found via `findAgentWithCapability('tool_approval')`.
- **Agent Templates** (`AGENT_TEMPLATES` in `governanceEngine.js`) define 11 pre-built role configurations (Manager, Accountant, InternalAuditor, Sentinel, Evaluator, ToolUseManager, NotificationReader, and others); the hire wizard adds a Custom entry for a total of 12 creation options. Calling `applyTemplate(agentId, templateId)` atomically sets the agent's persona, specialty, governance capabilities, and org role.
- **Governance capabilities** number 22 across 6 categories: `management` (6), `finance` (3), `quality` (1), `monitoring` (9), `evaluation` (2), `approval` (1). `kind` is one of `permission`, `hook`, or `skill`. The `tool_approval` capability (kind: `hook`, category: `approval`) designates an agent as the tool-use approver; its `params` field scopes which tools it covers. The `notification_reader` capability (kind: `hook`, category: `management`) designates an agent to filter governance notifications before they reach Boss. Agent color in the UI (`governance_color`) is computed server-side from the agent's highest-priority active capability category.
- **Governance event persistence** — `governanceRouter.js` centralizes all governance output. Every governance event (janitor, review, intervention, budget alert) is written to the dedicated `governance_events` table (decoupled from the `messages` table so general chat and audit trails don't collide). The Dashboard Governance tab reads it back via `GET /api/messages/governance-events`. The Message Center shows only notifications approved by the `notification_reader` agent (or auto-notify fallback for intervention/budget_alert).
- **No seed agents** — `db.js` no longer inserts default agents at startup. Agents are created by the user or via the Hire panel.
- **Capability-based lookups** — internal services use `findAgentWithCapability(capabilityId)` to locate the right specialist agent rather than hard-coded role name fallbacks.
- **Memory files** are stored on disk as plain Markdown under `office/agents/{name}/` (`persona.md`, `short_memory.md`, `long_memory.md`), managed by `src/office.js`. They are kept out of SQLite so they can be easily inspected and version-controlled. Offboarding bundles these files into `office/legacies/{name}/`.
- **SSE** is used for real-time updates (task execution, token stats, agent movement) instead of WebSockets, keeping the server stateless-friendly.
- **External notifications** are proxied through the backend (`/api/notifications/external`) to avoid CORS issues. The server caches the response for 24 hours. The frontend filters by install date, dismissed state, and user preferences.
