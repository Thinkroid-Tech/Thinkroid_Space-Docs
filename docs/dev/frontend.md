# Frontend Architecture

This document describes the frontend architecture of Thinkroid-Space for contributors.
The frontend lives in `Thinkroid_Space/<branch>/thinkroid-space-ui/`.

## Overview

| Concern | Technology |
|---------|-----------|
| Build tool | Vite |
| UI framework | React 18 (JSX, no TypeScript) |
| Game engine | Phaser 3 (pixel-art office scene) |
| State management | Centralized `useState` in `App.jsx` — no Redux or Zustand |
| Phaser ↔ React bridge | `mitt` event bus (`src/events.js`) |
| Styling | Single file: `src/index.css` |
| i18n | Custom hook `useT()`, three JSON dictionaries: `en`, `zh`, `ja` |
| Auth | `AuthProvider.jsx` context, JWT session cookies |
| API calls | `src/api.js` fetch wrapper — handles 401 interception |
| Real-time updates | `EventSource` SSE stream at `/api/events/stream` |

The Phaser canvas is mounted as a plain `<div id="game-container">`.
All React panels float above it in `<div class="ui-overlay">`.
When any panel is open, the canvas receives `pointer-events: none` so
mouse events do not pass through to the game.

---

## Application Structure

### Entry point

`src/main.jsx` wraps the app in `AuthProvider` and `LanguageProvider`, then renders `App`.
`AuthProvider` handles the full auth gate — it renders `LoginPage` in place of children
when the user is not authenticated.

### App.jsx — root component

`App.jsx` is the single source of truth for all panel visibility state.
There is intentionally no state management library: every `show*` flag is a
plain `useState` boolean at the top level of `App`.

**Panel toggle pattern** used throughout:

```js
const [showTaskBoard, setShowTaskBoard] = useState(false)
// rendered conditionally:
{showTaskBoard && <TaskBoard onClose={() => setShowTaskBoard(false)} />}
```

**All 20+ panel flags are declared at the top of `App`:**

| State var | Controls |
|-----------|---------|
| `selectedAgent` | `AgentPanel` (set by `agent:clicked` event) |
| `memoryAgent` | `MemoryPanel` (set by `memory:open` event) |
| `showDashboard` | `Dashboard` |
| `showTaskBoard` | `TaskBoard` |
| `showBossChat` | `BossChatPanel` |
| `showBulletin` | `BulletinBoard` |
| `showMeeting` | `MeetingRoom` |
| `showHirePanel` | `HirePanel` |
| `showOnboarding` | `OnboardingWizard` |
| `showBoard` | `Board` (kanban) |
| `showSpaceSettings` | `SpaceSettings` |
| `showApprovals` | `ApprovalPanel` |
| `showChatLog` | `ChatLog` |
| `showRecords` | `RecordsPanel` |
| `showOuterChannels` | `OuterChannelsOverlay` |
| `showDepartments` | `DepartmentPanel` |
| `showMessageCenter` | `MessageCenter` |
| `showSkillLibrary` | `SkillLibrary` |
| `showPromptEditor` | `PromptEditor` |
| `showFileManager` | `FileManagerPanel` |
| `showContainerPanel` | `ContainerPanel` |
| `showCronPanel` | `CronPanel` |
| `showUserMgmt` | `UserManagement` |

**Edit mode** is a secondary sub-mode with its own state cluster:
`editMode`, `editTool`, `selectedEditRoom`, `selectedEditItem`.
Entering edit mode emits `editMode:enter` to Phaser; exiting emits `editMode:exit`.

**Input blocking** — `hasOverlay` is a derived boolean that is `true` when
any panel is open. A `useLayoutEffect` emits `overlay:inputBlock` synchronously
whenever `hasOverlay` changes so Phaser can disable its input handler without
a frame delay.

**HUD layout:**
- `HUD` — always-visible top bar (space name, settings, edit mode toggle).
- Left sidebar: collapsible button groups for Work, Team, Comm categories.
- Right sidebar: collapsible Tools category.
- Boss chat: fixed bottom-right floating button.
- Mobile bottom nav: 4-category tab bar with pop-up item menus.
- Mobile float buttons: Athena, minimap, boss chat, chat overlay (mutually exclusive).
- `StatsBar` — always-visible bottom status bar (token usage, morale, etc.).
- `AthenaPanel` — AI assistant overlay, always mounted, toggled via `athena:toggle` event or `Cmd+/`.
- `ChatOverlay` — floating live chat feed (toggled via `chatoverlay:toggle`).

---

## Phaser Game Scene

### Entry: `src/game/index.js`

`createGame(containerId)` instantiates `Phaser.Game` with:
- Renderer: `Phaser.AUTO` (WebGL preferred)
- `pixelArt: true`
- `scale.mode: Phaser.Scale.RESIZE` — canvas fills the viewport
- Single scene: `OfficeScene`

The game instance is stored on `window.__PHASER_GAME__` for debugging.

### OfficeScene (`src/game/scenes/OfficeScene.js`)

The sole Phaser scene. It `async create()`s itself by fetching initial data
from the API before drawing anything.

**What it renders (in z-order):**

1. **Outdoor area** — grass/autumn tilemap surrounding the office.
2. **Office floor** — configurable floor style (wood, carpet, etc.) from `TILE_STYLES`.
3. **Room boundaries** — rooms fetched from `/api/rooms`, drawn as colored tile overlays.
4. **Room labels** — Phaser `Text` objects for each room name.
5. **Interactive items** — office furniture sprites from `office-items` spritesheet.
   Clicking a bulletin board, dashboard terminal, or outer-channels board opens the
   corresponding React panel via a mitt event.
6. **Door animations** — `door1` spritesheet animated on overlap.
7. **Agent sprites** — walking characters with 4-direction animations.
   Clicking an agent sprite emits `agent:clicked`.
8. **Minimap** — second `Phaser.Camera` rendered bottom-left (desktop) or
   toggled via floating button (mobile).
9. **Viewport indicator** — rectangle drawn on the minimap camera showing
   current main camera position.

**Agent lifecycle:**
- `loadAgentsFromAPI()` — fetches `/api/agents`, positions agents at their workspace tiles.
- `createAgents()` — creates Phaser sprites and name labels for each agent.
- `startSimulation()` — starts the idle movement tick.
- `reloadAgents()` — called on `office:reload` event; destroys existing sprites and re-fetches.

**Edit mode:**
When `editMode:enter` is received, the scene switches to a tile-editing pointer.
Tools (`room`, `wall`, `item`, `space-wall`) are set via `editTool:change`.
All edit mutations call backend REST endpoints and emit `editSuccess` / `editError`
back to React for toast display.

**Key methods:**

| Method | Purpose |
|--------|---------|
| `preload()` | Loads avatar spritesheets (50+ characters) and tilesets |
| `create()` | Async scene setup: fetch settings → draw map → load agents |
| `createMap()` | Draws all tile layers (outdoor, floor, rooms, items) |
| `createAgents()` | Instantiates agent sprites with walk animations |
| `update()` | Per-frame: camera drag, minimap viewport indicator sync |
| `loadAgentsFromAPI()` | Fetches agent roster and workspace positions |
| `reloadAgents()` | Full agent sprite teardown and re-creation |
| `handleTaskAssigned()` | Moves agent to workspace on task assignment |
| `handleTaskExecuting()` | Visual "working" state for agent |
| `handleTaskCompleted()` | Returns agent to idle state |

---

## Event Bus Protocol

`src/events.js` exports a single `mitt()` instance shared by both React and Phaser:

```js
import mitt from 'mitt'
export const events = mitt()
export default events
```

All components import this singleton. There is no typed event registry;
events are plain strings with an optional payload object.

### React → Phaser

| Event | Payload | Purpose |
|-------|---------|---------|
| `overlay:inputBlock` | `boolean` | Enable/disable Phaser input when a panel is open |
| `editMode:enter` | — | Switch scene to edit mode |
| `editMode:exit` | — | Exit edit mode |
| `editTool:change` | `{ tool: string \| null }` | Change active edit tool |
| `editItem:startPlace` | `{ registryItem }` | Begin item placement drag |
| `editItem:cancelPlace` | — | Cancel ongoing placement |
| `editItem:radiusChanged` | `{ registryId }` | Update item interaction radius |
| `editItem:rotate` | — | Rotate selected item 90° |
| `editItem:delete` | — | Delete selected item |
| `editRoom:refresh` | — | Force room tile redraw |
| `editItem:refresh` | — | Force item sprite redraw |
| `editRoom:deselected` | — | React closes the room properties panel |
| `minimap:toggle` | — | Show/hide minimap (mobile float button) |
| `minimap:hide` | — | Hide minimap |
| `chatoverlay:toggle` | — | Toggle floating chat overlay |
| `athena:toggle` | — | Open/close Athena panel |
| `athena:start-session` | `{ initialMessage, uiContextOverride }` | Start a new Athena session (e.g., onboarding) |
| `athena:restore-session` | — | Pop the Athena session stack |
| `theme:changed` | `string` | Notify Phaser to reload color palette |
| `space:visualRefresh` | — | Redraw tiles after office dimension change |
| `ambiance:updated` | `settings` | Update ambient audio settings |
| `office:reload` | — | Destroy and recreate the Phaser game |
| `boss:openChat` | — | Open BossChatPanel (from MessageCenter) |

### Phaser → React

| Event | Payload | Purpose |
|-------|---------|---------|
| `agent:clicked` | `{ name, role, ... }` | Open AgentPanel for the clicked agent |
| `bulletin:open` | — | Open BulletinBoard panel |
| `dashboard:open` | — | Open Dashboard panel |
| `outerChannels:open` | — | Open OuterChannelsOverlay |
| `board:open` | — | Open Kanban Board |
| `memory:open` | `{ agentId, displayName }` | Open MemoryPanel for an agent |
| `editRoom:selected` | `{ room }` | Open RoomPropertiesPanel |
| `editRoom:deselected` | — | Close RoomPropertiesPanel |
| `editItem:selected` | `{ item }` | Highlight item in ItemShopPanel |
| `editItem:deselected` | — | Clear item highlight |
| `editSuccess` | `{ message }` | Show success toast in EditToast |
| `editError` | `{ message }` | Show error toast in EditToast |
| `minimap:opened` | — | Notify React to close chat overlay and mobile menu |

### SSE → mitt (bridged in App.jsx)

SSE events from `/api/events/stream` are re-emitted on the mitt bus (most share the same name):

| SSE type | mitt event | Consumers |
|----------|-----------|-----------|
| `agent:move` | `agent:move` | OfficeScene (move sprite) |
| `agent:morale-changed` | `agent:morale-changed` | OfficeScene (update morale bar) |
| `agent:status` | `agent:status` | OfficeScene (update status icon) |
| `agent:thinking` | `agent:thinking` | OfficeScene (update thinking text) |
| `stats:refresh` | `stats:refresh` | StatsBar |
| `task:created`, `task:updated`, `task:completed` | same | TaskBoard, AgentTaskPanel (re-fetch on each) |
| `task:interrupted`, `task:resuming` | same | TaskBoard detail view |
| `agent:chat` | `agent:chat` | ChatOverlay, ChatLog |
| `bulletin:new` | `bulletin:new` | BulletinBoard |
| `approval:requested` | `approval:requested` | ApprovalToast, App badge count |
| `approval:resolved`, `approval:agent_decided` | same | ApprovalToast, App badge count |
| `meeting:started`, `meeting:speech`, `meeting:concluded` | same | MeetingRoom |
| `conversation:created`, `conversation:message`, `conversation:speech`, `conversation:concluded` | same | ChatWindow, ChatLog |
| `governance:new_event` | `governance:new_event` | Dashboard Governance tab re-fetches |
| `governance:${eventType}` | same | Dashboard / StatsBar / SpaceSettings — `eventType` values emitted today are `review`, `intervention`, `janitor`, `budget_alert`, and `tool_approval` |
| `notification:new` | `notification:new` | App badge count, MessageCenter |
| `cron:executed`, `cron:updated` | same | CronPanel |
| `outer_chat:incoming`, `outer_chat:auto_reply`, `outer_chat:sent` | same | OuterChannelsOverlay, ChatLog |
| `skills:updated` | `skills:updated` | SkillLibrary |

---

## Component Catalog

All `.jsx` files under `src/components/` are listed below.
"Key endpoints" lists the primary
REST paths the component calls directly.

### Core Panels

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `HUD.jsx` | Top bar: space name, settings button, edit mode toggle, user menu | `GET /api/settings` |
| `StatsBar.jsx` | Always-visible bottom bar: token budget, morale, task counts | `GET /api/agents`, `GET /api/tasks` (re-fetched on `stats:refresh` SSE) |
| `Dashboard.jsx` | Agent overview: status, morale, rest controls; governance review display | `GET /api/agents`, `POST /api/agents/:id/rest`, `GET /api/messages/governance-events` (reads the `governance_events` table) |
| `AgentPanel.jsx` | Clicked-agent detail panel with tabs for chat, tasks, settings, memory | `GET /api/settings/debug` |
| `AgentSettings.jsx` | Full per-agent configuration: models, tools, governance, avatar, persona | `GET /api/settings/avatars`, `GET /api/settings/providers`, `GET /api/tools` (compat) or `GET /api/skills/builtin-tools`, `GET /api/agents/governance/capabilities`, `GET /api/agents/governance/templates`, `GET /api/agents` |
| `AgentTaskPanel.jsx` | In-panel task list and task creation for a specific agent | `GET /api/tasks`, `GET /api/projects`, `POST /api/tasks` |
| `AgentSkillsPanel.jsx` | Per-agent skill assignment: toggle built-in tools and MCP skills | `GET /api/skills` |
| `MemoryPanel.jsx` | Agent long-term memory viewer and editor (multiple memory types) | `GET/PUT /api/agents/:id/memory/:type`, `GET /api/agents/:id/memory-stats`, `POST /api/agents/:id/memory/consolidate` |
| `SpaceSettings.jsx` | Global settings: providers, office layout, theme, idle loop, governance, debug | `GET/PUT /api/settings`, `GET/POST /api/settings/providers`, `GET /api/settings/debug` |

### Communication

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `BossChatPanel.jsx` | Boss-only chat: filters to `boss` + all `dm:*` channels that include the `boss` sentinel UUID, "New DM" dropdown with agent avatars, per-channel lazy loading (30/batch) | `GET /api/messages/all-chats?limit=50` (sidebar), `GET /api/messages?channel=...&limit=30` (per-channel), `GET /api/conversations/boss-unread` |
| `ChatWindow.jsx` | Reusable single-thread chat UI inside `AgentPanel`, lazy loading (50/batch) | `GET /api/messages?channel=...&limit=50`, `POST /api/messages/chat` |
| `ChatLog.jsx` | Full chat history viewer across all agents, unread indicators, per-channel lazy loading (30/batch) | `GET /api/messages/all-chats?limit=50` (sidebar), `GET /api/messages?channel=...&limit=30` (per-channel), `GET /api/conversations/boss-unread` |
| `ChatOverlay.jsx` | Floating live feed of recent agent messages, lazy loading (30/batch) | `GET /api/messages/all-chats?limit=30&before=...` |
| `BulletinBoard.jsx` | Read/post messages on the public bulletin channel | `GET /api/messages?channel=bulletin`, `POST /api/messages` |
| `MeetingRoom.jsx` | Start and observe AI multi-agent meetings in real time | `GET /api/meeting/list`, `GET /api/agents`, `POST /api/meeting/start` |
| `MessageCenter.jsx` | System notification inbox with read/unread management, search, filters, batch read/delete | `GET /api/notifications/filters`, `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`, `PUT /api/notifications/batch-read`, `DELETE /api/notifications/batch-delete`, `DELETE /api/notifications/delete-all-read` |
| `OuterChannelsOverlay.jsx` | Configure Discord/Telegram integrations and per-agent channel routing | `GET /api/outer-channels`, `GET /api/agents`, `POST/PUT /api/outer-channels`, `POST /api/outer-channels/test-config` |
| `AthenaPanel.jsx` | AI assistant overlay (Cmd+/): context-aware help, tool execution, multi-turn chat | `GET /api/athena/prompt-defaults`, `GET /api/athena/tools`, `POST /api/athena/chat`, `POST /api/athena/compact` |

### Admin

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `UserManagement.jsx` | User accounts and role/permission administration | `GET/POST /api/users`, `GET /api/users/permissions` |
| `DepartmentPanel.jsx` | Department (organization) create/edit and agent roster view | `GET /api/organizations`, `GET /api/agents/roster`, `POST /api/departments` |
| `HirePanel.jsx` | Agent roster management: view, fire, open onboarding wizard | `GET /api/agents`, `GET /api/legacies` |
| `PermissionSettings.jsx` | Per-agent tool permission overrides (embedded inside `AgentSettings`) | `GET /api/agents` |

### Task Management

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `TaskBoard.jsx` | Simple task list with create/filter/assign, driven by SSE `task:created` / `task:updated` / `task:completed` events | `GET /api/tasks`, `GET /api/agents`, `GET /api/projects`, `POST /api/tasks` |
| `Board.jsx` | Full kanban board: projects, tasks by status, batch-execute | `GET /api/projects`, `GET /api/organizations`, `GET /api/agents`, `POST /api/tasks`, `POST /api/tasks/batch-execute` |
| `TaskForm.jsx` | Reusable task creation form (modal) | `POST /api/tasks` |
| `TaskResult.jsx` | Read-only task result display (embedded in task detail views) | — |
| `ApprovalPanel.jsx` | Human-in-the-loop approval queue: review and decide pending requests | `GET /api/approvals`, `POST /api/approvals/:id/decide` |
| `ApprovalToast.jsx` | Auto-dismiss toast banner when approvals arrive via SSE | — (SSE-driven via `approval:requested`) |
| `RecordsPanel.jsx` | Searchable archive of meeting conclusions, notes, and reports | `GET /api/records` |

### Technical / System Tools

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `FileManagerPanel.jsx` | Browse, upload, download, rename, and delete workspace files | `GET /api/files/list`, `GET /api/files/search`, `POST /api/files/mkdir`, `POST /api/files/rename`, `POST /api/files/delete`, `POST /api/files/upload`, `GET /api/files/download` |
| `ContainerPanel.jsx` | Docker container status viewer and basic controls | `GET /api/containers` |
| `CronPanel.jsx` | Scheduled task manager: create cron jobs, view execution history | `GET /api/cron`, `GET /api/agents` |
| `SkillLibrary.jsx` | Manage custom skills and MCP servers; configure tool permissions | `GET /api/skills`, `GET /api/skills/mcp-servers`, `GET /api/skills/builtin-tools`, `GET/PUT /api/settings/tool-permissions`, `POST /api/skills`, `POST /api/skills/mcp-servers` |
| `PromptEditor.jsx` | Edit global system prompt templates and memory block templates | `GET/PUT /api/settings/scene-templates-default`, `GET /api/agents/:id/scene-templates` (Manager UUID resolved via `GET /api/agents?name=Manager`), `GET /api/settings/memory-blocks-default`, `GET /api/settings/governance-blocks-default` |
| `DebugLogPanel.jsx` | Live debug log viewer with clear capability (embedded in `SpaceSettings`) | `DELETE /api/settings/debug/logs` |

### Data / Debug Utilities

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `JsonTree.jsx` | Collapsible JSON tree renderer (used in debug views and `SpaceSettings`) | — |
| `BlockEditor.jsx` | Rich block-based prompt section editor (used in `PromptEditor`) | — |
| `OptionCards.jsx` | Reusable card-grid selection UI (used in `BossChatPanel` and onboarding) | — |

### Space Config / Edit Mode

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `EditToolbar.jsx` | Edit mode tool selector (room, wall, item, space-wall) | — |
| `EditToast.jsx` | Brief success/error toast during edit operations (SSE `editSuccess`/`editError`) | — |
| `ItemShopPanel.jsx` | Item placement picker for edit mode; shows item registry | `GET /api/items/registry` |
| `RoomPropertiesPanel.jsx` | Room name, type, style and owner settings for the selected room | — (edits via OfficeScene mutations) |

### Onboarding

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `OnboardingWizard.jsx` | Multi-step wizard shell that sequences the step components | — |
| `OnboardingStepTemplate.jsx` | Entry step — choose one of 11 `AGENT_TEMPLATES` or the Custom path (12 options total) | `GET /api/agents/agent-templates`, `GET /api/agents/governance/templates` |
| `OnboardingStepBasicInfo.jsx` | Agent name + avatar picker | `GET /api/settings/avatars` |
| `OnboardingStepPersona.jsx` | Role, specialty, persona description | — |
| `OnboardingStepDepartment.jsx` | Assign agent to department/org | `GET /api/organizations`, `GET /api/departments` |
| `OnboardingStepSkills.jsx` | Toggle skills and tools | `GET /api/skills`, `GET /api/tools` (compat) / `GET /api/skills/builtin-tools` |
| `OnboardingStepModels.jsx` | Select brain, cerebellum and context-engine providers / models | `GET /api/settings/providers` |
| `OnboardingStepExternalConnection.jsx` | External-agent connection setup for externally-hosted agents | `GET /api/external-agents`, `POST /api/external-agents/test-config` |
| `OnboardingStepLegacy.jsx` | Inherit a departed agent's legacy file | `GET /api/legacies` |
| `OnboardingStepReview.jsx` | Final review + submit: creates the agent, assigns capabilities, writes settings | `GET /api/settings/providers`, `POST /api/agents`, `PUT /api/agents/:id/settings`, `PUT /api/agents/:id/capabilities` |

### Auth

| Component | Purpose | Key API Endpoints |
|-----------|---------|-------------------|
| `LoginPage.jsx` | Full-screen login/setup form with optional Cloudflare Turnstile | (called via `AuthProvider` callbacks, not directly) |

---

## SSE Integration

The frontend opens a single persistent `EventSource` connection in the root
`App.useEffect`:

```js
const evtSource = new EventSource('/api/events/stream')
evtSource.onmessage = (e) => {
  const data = JSON.parse(e.data)
  // dispatch to mitt bus based on data.type
  events.emit(sseTypeToMittEvent(data.type), data)
}
```

The connection is closed on component unmount. Browser `EventSource` handles
automatic reconnect; no custom reconnection logic is needed.

Every per-agent SSE payload carries `agentId` (UUID) plus a pre-joined `displayName`. Frontend components key their `useState` maps by `agentId` and render `displayName` directly — no client-side JOIN to the agent list is needed.

**SSE event types handled:**

`agent:status`, `agent:thinking`, `agent:move`, `agent:chat`, `agent:morale-changed`,
`task:created`, `task:updated`, `task:completed`, `task:interrupted`, `task:resuming`, `task:update`,
`conversation:created`, `conversation:message`, `conversation:speech`, `conversation:concluded`,
`meeting:started`, `meeting:speech`, `meeting:concluded`, `bulletin:new`,
`notification:new`, `approval:requested`, `approval:agent_decided`, `approval:resolved`,
`governance:new_event`, `governance:${eventType}` (dynamic),
`cron:updated`, `cron:executed`, `outer_chat:incoming`, `outer_chat:auto_reply`, `outer_chat:sent`,
`stats:refresh`, `skills:updated`.

See the [Event Bus Protocol](#event-bus-protocol) table above for the full
SSE → mitt mapping.

---

## CSS Architecture

All styles live in a single file: `src/index.css`.
There are no CSS modules, no styled-components, and no Tailwind.

**Structure** (roughly top-to-bottom):
1. CSS custom property definitions on `:root` (color tokens, spacing, fonts).
2. Per-theme overrides using `[data-theme="dark"]` / `[data-theme="classic"]` etc.
   on `document.documentElement.dataset.theme`.
3. Base resets and layout (`#root`, `#game-container`, `.ui-overlay`).
4. Component-level blocks in the same order as the component catalog above.
5. Mobile media query block at the bottom.

**Class naming:** flat BEM-influenced names, e.g. `agent-panel`, `agent-panel__header`,
`panel-toggle-btn`, `mobile-nav-tab`. No strict BEM enforcement.

**Mobile breakpoint:** `@media (max-width: 768px)` — applied to switch from the
left/right sidebar button groups to the bottom tab navigation, hide the chat overlay
toggle, and adapt panel sizes to full-screen modals.
