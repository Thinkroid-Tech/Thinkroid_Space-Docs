# Hooks & Extensions

The hook system is the primary extensibility surface of Thinkroid Space. It lets you observe, react to, and in some cases cancel any significant event in the system — without modifying core server code.

## Overview

Every meaningful server-side action emits one or more named hook events. Examples include an agent being created, a task completing, an AI call returning, a governance review firing, or a message being sent to an external channel. Extensions subscribe to these events using a simple `register(hooks)` function and react to them with async handlers.

### HookManager architecture

The `HookManager` (singleton exported as `hooks` from `hookManager.js`) maintains a `Map` of hook name to an ordered list of registered handlers. Each entry in the list carries the handler function, a numeric priority, and a human-readable label.

When an event fires, handlers are called in ascending priority order — **lower numbers execute first**. The default priority is `100`, so internal system handlers that must run first are typically registered at priority `10`.

There are two execution strategies:

| Strategy | Method | Behaviour |
|----------|--------|-----------|
| Fire-and-forget | `emit()` | Calls every handler in priority order. A handler that throws is logged but does not prevent subsequent handlers from running. |
| Cancellable chain | `emitWaterfall()` | Calls handlers in priority order. If any handler returns `{ cancel: true, reason }` the chain stops immediately and the caller receives `{ cancelled: true, reason }`. Errors in a handler are logged and skipped — they do not cancel the chain. |

---

## HookManager API

### `hooks.on(name, handler, options?)`

Register a handler for a named hook.

```js
import { hooks } from '../services/hookManager.js';

hooks.on('task:complete:after', async (data) => {
  console.log('Task finished:', data.task.title);
}, { priority: 50, label: 'my-logger' });
```

**Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | — | Hook name (see Complete Hook Reference below) |
| `handler` | `async Function` | — | Called with the hook's data payload |
| `options.priority` | `number` | `100` | Execution order — lower runs first |
| `options.label` | `string` | `''` | Human-readable identifier used in error logs |

### `hooks.off(name, handler)`

Deregister a previously registered handler. You must pass the same function reference that was passed to `on()`.

```js
const myHandler = async (data) => { /* ... */ };
hooks.on('agent:create:after', myHandler);
// later...
hooks.off('agent:create:after', myHandler);
```

### `hooks.emit(name, data)`

Fire all handlers for a hook. Returns a `Promise<void>`. Individual handler errors are caught, logged to stderr, and do not abort the remaining handlers.

```js
await hooks.emit('task:complete:after', { task });
```

### `hooks.emitWaterfall(name, data)`

Fire handlers in order. Any handler may cancel the operation by returning `{ cancel: true, reason: string }`. Returns `Promise<{ cancelled: boolean, reason?: string }>`.

```js
const result = await hooks.emitWaterfall('task:execute:before', { task });
if (result.cancelled) {
  throw new Error(`Blocked by hook: ${result.reason}`);
}
```

A handler that wants to allow the operation should return `undefined` (or any value without `cancel: true`).

### `hooks.listAll()`

Returns an array of all registered handler descriptors — useful for debugging.

```js
const all = hooks.listAll();
// [{ hook: 'task:complete:after', label: 'my-logger', priority: 50 }, ...]
```

---

## Complete Hook Reference

Hook names follow a consistent `noun:verb:timing` convention. `:before` hooks are waterfalls (can cancel). `:after` hooks are fire-and-forget (observational).

### Agent

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `agent:create:after` | No | `{ agent }` — the newly created agent row |
| `agent:update:after` | No | `{ agent }` — updated agent row |
| `agent:delete:before` | Yes | `{ agentId }` — id of agent about to be deleted |
| `agent:delete:after` | No | `{ agentId }` |
| `agent:offboard:after` | No | `{ agent }` — agent that was offboarded |
| `agent:learn:after` | No | `{ agentId, memory }` — extracted memory entry |
| `agent:morale:changed` | No | `{ agentId, morale, delta }` |
| `agent:status:changed` | No | `{ agentId, status }` — new status string |

### Task

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `task:create:after` | No | `{ task }` — newly created task row |
| `task:execute:before` | Yes | `{ task }` — task about to begin execution |
| `task:execute:after` | No | `{ task }` — task execution started |
| `task:complete:after` | No | `{ task }` — task finished successfully |
| `task:fail:after` | No | `{ task, error }` |
| `task:interrupt:after` | No | `{ task }` — task was interrupted |

### AI — Simple Calls

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `ai:call:before` | Yes | `{ scope, agentName, messages }` — `scope` is `brain`, `cerebellum`, or `context_engine` |
| `ai:call:after` | No | `{ scope, agentName, response, tokensUsed }` |

### AI — Tool Loop

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `ai:toolloop:start` | No | `{ agentName, taskId }` |
| `ai:toolloop:end` | No | `{ agentName, taskId, rounds, result }` |
| `ai:round:before` | Yes | `{ agentName, round, messages }` |
| `ai:round:after` | No | `{ agentName, round, response }` |

### AI — Tool Execution

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `ai:tool:before` | Yes | `{ agentName, toolName, args }` |
| `ai:tool:after` | No | `{ agentName, toolName, args, result }` |
| `ai:tool:denied` | No | `{ agentName, toolName, reason }` |
| `ai:tool:approval` | No | `{ agentName, toolName, approvalId, status }` |

### AI — System Events

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `ai:token:recorded` | No | `{ agentName, tokens, model }` |
| `ai:context:trimmed` | No | `{ agentName, before, after }` — message counts |
| `ai:retry` | No | `{ agentName, attempt, error }` |
| `ai:rounds:exceeded` | No | `{ agentName, maxRounds }` |
| `ai:interrupt` | No | `{ agentName, reason }` |

### Governance

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `governance:review:after` | No | `{ taskId, taskTitle, reviewer, report, timestamp }` |
| `governance:intervention:after` | No | `{ taskId, taskTitle, agentName, reason, minutesElapsed, interventionAgent, report, timestamp }` |
| `governance:janitor:after` | No | `{ cleaned }` — summary of janitor cleanup pass |
| `governance:budget:alert` | No | `{ agentName, tokens, threshold }` |

### Memory

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `memory:extract:after` | No | `{ agentId, memories }` — array of extracted memory strings |

### Conversation

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `conversation:create:after` | No | `{ conversation }` |
| `conversation:message:after` | No | `{ conversationId, message }` |
| `conversation:conclude:after` | No | `{ conversationId, summary }` |

### Meeting

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `meeting:start:after` | No | `{ meeting }` |
| `meeting:speech:after` | No | `{ meetingId, agentName, content }` |
| `meeting:conclude:after` | No | `{ meetingId, minutes }` |

### Approval

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `approval:decide:after` | No | `{ approvalId, toolName, agentName, decision, decidedBy }` |

### Skill & MCP

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `skill:create:after` | No | `{ skill }` |
| `skill:delete:after` | No | `{ skillId }` |
| `skill:toggle:after` | No | `{ skillId, enabled }` |
| `skill:bind:after` | No | `{ skillId, agentId }` |
| `skill:unbind:after` | No | `{ skillId, agentId }` |
| `mcp:connect:after` | No | `{ skillId, serverName }` |
| `mcp:disconnect:after` | No | `{ skillId, serverName }` |

### Settings

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `settings:update:after` | No | `{ key, value }` — changed setting |
| `settings:permission:update` | No | `{ toolName, allowed }` |

### Org

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `org:create:after` | No | `{ org }` |
| `org:delete:after` | No | `{ orgId }` |
| `org:member:add:after` | No | `{ orgId, agentId }` |
| `org:member:remove:after` | No | `{ orgId, agentId }` |

### Department

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `dept:create:after` | No | `{ dept }` |
| `dept:update:after` | No | `{ dept }` |
| `dept:delete:after` | No | `{ deptId }` |
| `dept:member:add:after` | No | `{ deptId, agentId }` |
| `dept:member:remove:after` | No | `{ deptId, agentId }` |

### Project

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `project:create:after` | No | `{ project }` |
| `project:delete:after` | No | `{ projectId }` |

### Message

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `message:chat:before` | Yes | `{ channel, sender, content }` |
| `message:chat:after` | No | `{ channel, sender, content, messageId }` |
| `message:send:after` | No | `{ channel, messageId }` |

### Athena

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `athena:chat:before` | Yes | `{ userMessage, context }` |
| `athena:chat:after` | No | `{ userMessage, response }` |

### Idle Behaviour

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `idle:action:before` | Yes | `{ agentId, action }` |
| `idle:action:after` | No | `{ agentId, action, result }` |

### Channel (External Integrations)

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `channel:create:after` | No | `{ channel }` |
| `channel:delete:after` | No | `{ channelId }` |
| `channel:incoming:after` | No | `{ channelId, platform, sender, content }` |
| `channel:reply:after` | No | `{ channelId, content }` |

### Container

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `container:stop:after` | No | `{ containerId, name }` |
| `container:remove:after` | No | `{ containerId, name }` |

### Auth

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `auth:login:after` | No | `{ userId }` |
| `auth:setup:after` | No | `{ userId }` — first-time setup completed |

### Cron

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `cron:execute:before` | Yes | `{ jobId, agentId, command }` |
| `cron:execute:after` | No | `{ jobId, agentId, result }` |

### System

| Hook Name | Waterfall? | Data Shape |
|-----------|-----------|------------|
| `system:ready` | No | `{}` — emitted once when server startup completes |
| `system:sse:broadcast` | No | `{ type, data }` — forward an event to all connected SSE clients |

---

## Writing an Extension

Extensions are plain ES Module files that export a single `register` function. Drop a `.js` file in the `extensions/` directory and it will be loaded automatically on the next server start.

### File location

```
thinkroid-space-server/
  src/
    extensions/          <-- place your extension here
      my-extension.js
```

The directory is created automatically by `hookSetup.js` if it does not exist.

### Required export

```js
export async function register(hooks) {
  // hooks is the HookManager singleton
}
```

The `register` function receives the live `hooks` instance. It may be `async` — the loader `await`s it before moving on to the next file.

### Example extension — task audit logger

This extension writes a structured audit entry to a local JSON file every time a task completes or fails.

```js
// src/extensions/task-audit.js

import fs from 'fs';
import path from 'path';

const LOG_PATH = path.resolve('/data/task-audit.jsonl');

function append(entry) {
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n');
}

export async function register(hooks) {
  hooks.on('task:complete:after', async ({ task }) => {
    append({
      event: 'complete',
      taskId: task.id,
      title: task.title,
      assignedTo: task.assigned_to,
      ts: new Date().toISOString()
    });
  }, { priority: 200, label: 'task-audit:complete' });

  hooks.on('task:fail:after', async ({ task, error }) => {
    append({
      event: 'fail',
      taskId: task.id,
      title: task.title,
      error: error?.message,
      ts: new Date().toISOString()
    });
  }, { priority: 200, label: 'task-audit:fail' });
}
```

### Example extension — block a tool via waterfall

This extension prevents agents from running the `shell_exec` tool outside business hours.

```js
// src/extensions/business-hours-guard.js

export async function register(hooks) {
  hooks.on('ai:tool:before', async ({ agentName, toolName }) => {
    if (toolName !== 'shell_exec') return;

    const hour = new Date().getHours();
    if (hour < 9 || hour >= 18) {
      return {
        cancel: true,
        reason: `shell_exec is restricted outside business hours (agent: ${agentName})`
      };
    }
  }, { priority: 5, label: 'business-hours-guard' });
}
```

### Priority guidelines

| Range | Intended use |
|-------|-------------|
| `1–9` | Critical gates — security, auth, hard policy enforcement |
| `10–49` | System-level wiring (SSE bridge runs at `10`) |
| `50–99` | Application logic that must run before defaults |
| `100` | Default (most extensions should use this) |
| `101–999` | Observability, logging, analytics |

---

## Built-in Hook Wiring

`hookSetup.js` is called once during server startup (`setupHooks(hooks)`). It establishes two pieces of wiring before any extensions are loaded.

### SSE bridge (priority 10)

```js
hooks.on('system:sse:broadcast', ({ type, data }) => {
  broadcastAgentEvent(type, data);
}, { priority: 10, label: 'sse-bridge' });
```

Any code that calls `hooks.emit('system:sse:broadcast', { type, data })` pushes a real-time event to every connected browser client. This is the canonical way to push live updates from deep within server logic without importing the SSE route directly.

### Extension auto-discovery

After the SSE bridge is registered, `setupHooks` scans `src/extensions/` for `.js` files and calls each file's `register(hooks)` function in filesystem order.

- If the `extensions/` directory does not exist it is created automatically and a log message is printed.
- Files that do not export a `register` function are silently skipped.
- A file that throws during `register` logs the error and does not prevent other extensions from loading.

### Governance triggers (hookSetup Phase 2)

The governance functions in `governanceTriggers.js` are currently called inline by the task executor rather than through hooks, and are documented here for completeness:

| Internal function | Effectively equivalent hook | Trigger condition |
|-------------------|-----------------------------|--------------------|
| `onTaskCompleted(task)` | `governance:review:after` | Task status transitions to `completed`; output review fires at a configurable sampling rate (default 30%) if an `output_review` governance agent exists |
| `onTaskStuck(task, minutesElapsed)` | `governance:intervention:after` | Task remains `in_progress` beyond the configured timeout; the task is marked `blocked`, the assigned agent returns to `idle`, and an intervention agent generates a report |

Both functions broadcast their results to connected clients via `broadcastAgentEvent`, which in turn maps to `system:sse:broadcast`.

### Governance output routing (governanceRouter.js)

`services/governanceRouter.js` is the centralized gateway for all governance output. Every governance action calls `persistGovernanceOutput()`, which:

1. Writes a record to the messages table with `channel='governance'`
2. Broadcasts the corresponding SSE event (`governance:review`, `governance:intervention`, `governance:janitor:after`, `governance:budget:alert`)
3. Calls `routeGovernanceNotification()` to decide whether to notify Boss

**Notification routing flow:**

```
Governance action → persistGovernanceOutput()
  → Write to messages (channel='governance')
  → Broadcast SSE event
  → routeGovernanceNotification()
    → notification_reader agent assigned?
        → AI call: NOTIFY | SKIP
    → No reader?
        → auto-notify only intervention + budget_alert
```

**Channel reference:**

| Channel | Data Source | Purpose |
|---------|-------------|---------|
| Boss Chat (Manager) | `messages channel='boss'` + `dm:Boss:*` | Boss ↔ Agent conversations (manager channel + DMs) |
| Message Center | `boss_notifications` | Filtered governance notifications (see MessageCenter section below) |
| Dashboard → Governance | `messages channel='governance'` | Full governance audit log (DB-backed, persistent) |
| Chat Log | `messages` (dm:, bulletin, meeting:) | Agent-to-agent chat |

Note: Agent Settings chat and Boss Chat share the same DM channel (`dm:Boss:AgentName`), so conversations are unified across both views.

**notification_reader capability:**

Assigning the `notification_reader` capability (kind: `hook`) to an agent makes that agent the governance notification filter. Before Boss is notified, the system calls the agent's Brain to evaluate the governance event summary and return `NOTIFY` or `SKIP`. This prevents low-signal events from cluttering the Boss inbox while keeping the full audit trail in the governance channel.

A built-in `NotificationReader` entry in `AGENT_TEMPLATES` (one of the 11 pre-configured templates in `governanceEngine.js`) ships pre-configured for this role — apply it from the Hire panel to enable filtering immediately.

Fallback (no `notification_reader` assigned): only `intervention` and `budget_alert` events automatically notify Boss.

**Data migration:**

On server startup, any `[Auto Review]` or `[Intervention]` messages previously stored with `channel='boss'` are automatically migrated to `channel='governance'`.

---

### MessageCenter (`boss_notifications`)

MessageCenter is the Boss's filtered notification inbox. Notifications arrive here after `governanceRouter.js` routes them through the `notification_reader` evaluation step.

**UI features:**

- **Inline expand/collapse** — click a notification to expand its full content in-place; does not navigate to BossChatPanel
- **Markdown rendering** — expanded content rendered via ReactMarkdown + remarkGfm + rehypeHighlight (tables, code blocks, lists, inline code)
- **Preview limit** — 4000 chars
- **Category badge** — each item shows a colored badge for its event type (`review`, `intervention`, `janitor`, `budget_alert`, etc.)
- **Lazy loading** — 20 items per page, appends on scroll
- **Batch operations** — Read All, Select & Read, Delete All, Select & Delete; confirm dialogs for destructive actions
- **Server-side search** — activates at 3+ characters, 400ms debounce
- **Sort** — Newest / Oldest / Agent name
- **Sender filter** — multi-select agent name checkboxes
- **Category filter** — multi-select event type checkboxes
- **Date range filter** — From/To date picker toggle

**Schema change:** `boss_notifications` table carries a `category` column (event type string).

**API endpoints** (all under `/api/notifications/` — the historical `/api/notifications/boss/*` prefix has been retired):

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications/filters` | Available senders and categories for filter dropdowns |
| `GET` | `/api/notifications` | Paginated, filtered list — accepts `?search=&sort=&sender=&category=&from=&to=&before=&limit=&offset=` |
| `PUT` | `/api/notifications/:id/read` | Mark one (plus peers from the same agent) as read |
| `PUT` | `/api/notifications/read-all` | Mark all pending as read |
| `PUT` | `/api/notifications/batch-read` | Mark selected IDs as read |
| `DELETE` | `/api/notifications/batch-delete` | Delete selected IDs |
| `DELETE` | `/api/notifications/delete-all-read` | Delete all read notifications |

---

## Frequently Asked Questions

**Can an extension remove a system handler?**

Yes. `hooks.off(name, handler)` accepts any handler reference. However, removing the built-in `sse-bridge` handler will break real-time updates for all connected clients — do not remove it unless you are replacing it with your own SSE implementation.

**Are hook handlers called in parallel?**

No. Handlers on the same hook are called sequentially in priority order. This is intentional: it makes waterfall cancellation deterministic and avoids race conditions when multiple handlers write to the same resource.

**What happens if my handler is slow?**

`emit()` awaits each handler before moving to the next. A slow handler delays all subsequent handlers and delays the caller. Keep handlers fast. For heavy work (file I/O, external HTTP calls, database writes) consider buffering and processing asynchronously inside the handler.

**Can I emit hooks from within an extension?**

Yes. You have the full `hooks` instance. Emitting hooks from within a handler is safe, but watch out for infinite loops — for example, do not emit `task:complete:after` from inside a `task:complete:after` handler.

**Can extensions be hot-reloaded?**

No. Extensions are loaded once at startup via `import()`. To apply changes, restart the server (`docker compose down && docker compose up -d --build` in production, or `npm run dev` in local development).
