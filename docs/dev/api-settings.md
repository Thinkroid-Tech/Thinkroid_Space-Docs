# API: Settings & Configuration

## Settings

### `GET /api/settings`
Read all global settings (space name, provider IDs, office dimensions, ambiance, theme, idle loop, debug mode, etc.).
Returns key-value settings object. Includes `debug_mode` (`"true"` or `"false"`).

### `PUT /api/settings`
Batch-update global settings. Body is a flat `{ key: value, ... }` map — any subset of allowed keys. Automatically rescales room walls when office dimensions change.
Returns `{ success: true }`. Requires `manage_settings`.

> The `GET/PUT /api/settings/:key` single-key variants do not exist — all KV reads and writes go through the root batch endpoints.

### `GET /api/settings/check-custom-prompts`
Check whether any agent has custom scene or governance prompt overrides.
Returns `{ hasCustom: boolean, agents: string[] }`.

---

## Backup Model Fallback

Each AI model type (Brain, Cerebellum, Context Engine, Athena) supports a backup model that is used automatically when the primary model fails.

**What it does**: When the primary model fails after 3 retries (rate limit, server error, timeout, etc.), the system transparently switches to the configured backup model and retries up to 3 more times. If the backup also fails, the error is thrown. The `ai:backup:activated` hook event fires when a fallback is triggered.

**Where to configure it:**

| Location | Scope |
|----------|-------|
| SpaceSettings → Models tab | Global default backup for Brain, Cerebellum, Context Engine |
| AgentSettings → Models tab | Per-agent backup Brain and Cerebellum override |
| AthenaPanel → Settings | Athena-specific backup model |

**Priority chain**: Agent-level backup → Global default backup → Error

**Backup fields in agent settings** (`GET /PUT /api/agents/:name/settings`):

| Field | Description |
|-------|-------------|
| `backup_brain_provider_id` | Backup provider for this agent's Brain |
| `backup_brain_model` | Backup model name for Brain (overrides provider default) |
| `backup_cerebellum_provider_id` | Backup provider for this agent's Cerebellum |
| `backup_cerebellum_model` | Backup model name for Cerebellum |

**Backup fields in global settings** (`GET /PUT /api/settings`):

| Field | Description |
|-------|-------------|
| `backup_default_brain_provider_id` | Global default backup provider for Brain |
| `backup_default_brain_model` | Global default backup Brain model |
| `backup_default_cerebellum_provider_id` | Global default backup Cerebellum provider |
| `backup_default_cerebellum_model` | Global default backup Cerebellum model |
| `backup_default_context_engine_provider_id` | Global default backup Context Engine provider |
| `backup_default_context_engine_model` | Global default backup Context Engine model |
| `backup_athena_provider_id` | Backup provider for Athena |
| `backup_athena_model` | Backup Athena model |

---

## Providers

### `GET /api/settings/providers`
List all AI provider configurations. API keys are masked.
Returns `Provider[]`.

### `POST /api/settings/providers`
Add a new AI provider.
Body: `{ name, base_url?, api_key?, model?, rate_limits?, context_limits? }`
Returns `Provider` (201). Requires `manage_settings`.

### `PUT /api/settings/providers/:id`
Update a provider. Masked API keys are ignored.
Body: any subset of provider fields.
Returns `Provider`. Requires `manage_settings`.

### `DELETE /api/settings/providers/:id`
Delete a provider.
Returns `204 No Content`. Requires `manage_settings`.

### `POST /api/settings/providers/:id/test`
Test connectivity for all models in a provider.
Returns `{ success, results: { model, status, latency?, reply?, code?, message? }[] }`. Requires `manage_settings`.

---

## Debug

### `GET /api/settings/debug`
Get debug mode status.
Returns `{ enabled: boolean }`.

### `PUT /api/settings/debug`
Toggle debug mode.
Body: `{ enabled: boolean }`
Returns `{ enabled: boolean }`. Requires `admin` role.

### `GET /api/settings/debug/logs`
Get paginated debug logs. Query: `?page=1&limit=20&agent_name=`
Returns `{ logs, pagination }`.

### `DELETE /api/settings/debug/logs`
Clear all debug logs.
Returns `{ success: true }`. Requires `manage_settings`.

---

## Tool Permissions

### `GET /api/settings/tool-permissions`
List all built-in tools with their default permissions and global boss overrides.
Returns `{ name, defaultPermission, override, effectivePermission }[]`.

### `PUT /api/settings/tool-permissions/:toolName`
Set a global boss override for a tool's permission level. `always_confirm` tools cannot be overridden.
Body: `{ permission: "auto" | "confirm" | null }` (null removes the override)
Returns `{ toolName, defaultPermission, override, effectivePermission }`. Requires `manage_settings`.

---

## Global Prompt Defaults

### `GET /api/settings/scene-templates-default`
Get the global default scene template blocks.
Returns `{ templates }`.

### `PUT /api/settings/scene-templates-default`
Save the global default scene template blocks.
Body: `{ templates: object }` — Requires `manage_settings`.

### `GET /api/settings/memory-prompts-default`
Get the global default memory prompt blocks.
Returns `{ prompts }`.

### `PUT /api/settings/memory-prompts-default`
Save the global default memory prompt blocks.
Body: `{ prompts: object }` — Requires `manage_settings`.

### `GET /api/settings/governance-prompts-default`
Get the global default governance prompt blocks.
Returns `{ prompts }`.

### `PUT /api/settings/governance-prompts-default`
Save the global default governance prompt blocks.
Body: `{ prompts: object }` — Requires `manage_settings`.

### `GET /api/settings/memory-blocks-default`
Get all global memory block groups with custom overrides, defaults, and metadata.
Returns `{ groups, defaults, meta }`.

### `PUT /api/settings/memory-blocks-default/:groupId`
Update a global memory block group. Pass `null` for blocks to restore defaults.
Body: `{ blocks: Block[] | null }` — Requires `manage_settings`.

### `DELETE /api/settings/memory-blocks-default/:groupId`
Reset a global memory block group to built-in defaults.
Returns `{ success: true }`. Requires `manage_settings`.

### `GET /api/settings/governance-blocks-default`
Get all global governance block groups with custom overrides, defaults, and metadata.
Returns `{ groups, defaults, meta }`.

### `PUT /api/settings/governance-blocks-default/:groupId`
Update a global governance block group.
Body: `{ blocks: Block[] | null }` — Requires `manage_settings`.

### `DELETE /api/settings/governance-blocks-default/:groupId`
Reset a global governance block group to built-in defaults.
Returns `{ success: true }`. Requires `manage_settings`.

### `GET /api/settings/avatars`
List all available avatar options grouped by category.
Returns `{ avatars: { id, label, category }[] }`.

---

## Athena

### `POST /api/athena/chat`
Send a message to Athena. Returns an SSE stream of text and tool-call events.
Body: `{ message, sessionId, uiContext?, mode? }` (`mode`: `"ask"` | `"plan"` | `"auto_edit"` | `"full_auto"`)
Returns SSE stream — events: `{ content }`, `{ tool, status: "calling" }`, `{ type: "approval_needed", approvalId, toolName, args }`, `"[DONE]"`. Requires `use_athena`.

### `GET /api/athena/history`
Get Athena chat history for a session. Query: `?sessionId=<string>`
Returns `Message[]`.

### `DELETE /api/athena/history`
Clear Athena chat history for a session. Query: `?sessionId=<string>`
Returns `{ ok: true }`. Requires `use_athena`.

### `POST /api/athena/compact`
Manually compact Athena chat history for a session.
Body: `{ sessionId: string }` — Returns `{ ok, compacted, removed?, remaining? }`. Requires `use_athena`.

### `GET /api/athena/prompt-defaults`
Get built-in default identity prompt and feature knowledge text.
Returns `{ identity: string, feature_knowledge: string }`.

### `GET /api/athena/tools`
List all tools available to Athena with their enabled status and approval mode.
Returns `{ name, description, enabled, approvalMode, defaultPermission }[]`.

### `POST /api/athena/approve/:approvalId`
Resolve a pending inline tool approval.
Body: `{ approved: boolean }` — Returns `{ ok: true }`. Requires `use_athena`.

### `POST /api/athena/ui-result/:requestId`
Return the result of a UIBridge request (read / fill / click) back to the Athena tool executor.
Body: UIBridge result payload. Requires `use_athena`.

---

## Skills

All Skills, MCP server, and per-agent tool-binding endpoints live under the single `/api/skills` prefix. A legacy `/api/mcp/*` prefix does not exist — MCP endpoints are exposed as `/api/skills/mcp-servers/*`. A compat endpoint `GET /api/tools` also returns the registered tool definitions for UI consumption.

### `GET /api/skills/builtin-tools`
List all built-in tool definitions.
Returns `{ name, description, defaultPermission, parameters }[]`.

### `GET /api/skills/mcp-servers`
List all registered MCP servers with connection status and tool counts.
Returns `MCPServer[]`.

### `POST /api/skills/mcp-servers`
Register a new MCP server. Automatically creates a corresponding skill.
Body: `{ name, transport, command?, args?, env?, url?, auth_type?, auth_value? }`
Returns `MCPServer` with `skill_id` (201).

### `PUT /api/skills/mcp-servers/:id`
Update an MCP server configuration.
Body: any subset of server fields. Returns `MCPServer`.

### `DELETE /api/skills/mcp-servers/:id`
Delete an MCP server, disconnect it, and remove its associated skill.
Returns `{ success: true }`.

### `POST /api/skills/mcp-servers/:id/connect`
Connect to an MCP server and discover its tools.
Returns `MCPServer`.

### `POST /api/skills/mcp-servers/:id/disconnect`
Disconnect from an MCP server.
Returns `MCPServer`.

### `POST /api/skills/mcp-servers/:id/discover`
Re-discover tools from a connected MCP server.
Returns `{ tools_count, tools: Tool[] }`.

### `GET /api/skills/agent/:agentId/bindings`
Get all skill bindings for an agent.
Returns `AgentSkillBinding[]`.

### `POST /api/skills/agent/:agentId/bindings`
Bind a skill to an agent.
Body: `{ skill_id, scope? }` (`scope`: `"brain"` or `"cerebellum"`)
Returns `AgentSkillBinding` (201).

### `PUT /api/skills/agent/:agentId/bindings/:bindingId`
Toggle a skill binding or change its scope.
Body: `{ enabled?, scope? }` — Returns `AgentSkillBinding`.

### `DELETE /api/skills/agent/:agentId/bindings/:bindingId`
Remove a skill binding from an agent.
Returns `{ success: true }`.

### `GET /api/skills/agent/:agentId/tool-permissions`
Get per-agent tool permission overrides.
Returns `{ [toolName]: "auto" | "confirm" | "deny" }`.

### `PUT /api/skills/agent/:agentId/tool-permissions`
Set per-agent tool permission overrides (replaces the entire map).
Body: `{ [toolName]: "auto" | "confirm" | "deny" }`.

### `GET /api/skills`
List all skills. Query: `?type=mcp|custom|builtin`
Returns `Skill[]`.

### `POST /api/skills`
Create a custom skill.
Body: `{ name, description?, icon?, system_prompt?, bundled_tools? }`
Returns `Skill` (201).

### `GET /api/skills/:id`
Get a skill by ID with tool list.
Returns `Skill`.

### `PUT /api/skills/:id`
Update a skill.
Body: any subset of `{ name, description, icon, system_prompt, bundled_tools, config_values }`
Returns `Skill`.

### `DELETE /api/skills/:id`
Delete a skill (cannot delete built-ins). Also removes the associated MCP server.
Returns `{ success: true }`.

### `POST /api/skills/:id/toggle`
Toggle a skill's enabled state.
Returns `Skill`.

---

## Cron

### `GET /api/cron`
List all cron jobs. Query: `?type=governance|task|script&agent_id=<uuid>`
Returns `CronJob[]`.

### `GET /api/cron/:id`
Get a cron job with its last 10 execution records.
Returns `CronJob` with `executions: CronExecution[]`.

### `POST /api/cron`
Create a new cron job.
Body: `{ name, cron_expression, type?, description?, task_title?, task_description?, assigned_to?, script?, execution_env?, require_approval_each_run? }`
Returns `CronJob` (201). Requires `manage_cron`.

### `PUT /api/cron/:id`
Update a cron job. Modifying a non-boss-created job's script resets its approval.
Body: any updatable field. Returns `CronJob`. Requires `manage_cron`.

### `DELETE /api/cron/:id`
Delete a cron job. Governance jobs are disabled (not deleted); others are physically removed.
Returns `{ ok: true }`. Requires `manage_cron`.

### `POST /api/cron/:id/run`
Trigger immediate execution, ignoring the schedule.
Returns `{ ok: true }` or execution result. Requires `manage_cron`.

### `POST /api/cron/:id/approve`
Approve a script-type cron job and register its schedule.
Returns `CronJob`. Requires `manage_cron`.

### `POST /api/cron/executions/:id/approve`
Approve a single pending execution (for jobs with `require_approval_each_run`).
Returns `{ success, ...result }`. Requires `manage_cron`.

### `GET /api/cron/:id/history`
Get paginated execution history. Query: `?limit=20&offset=0`
Returns `{ total, limit, offset, executions: CronExecution[] }`.

---

## External Notifications

The notification system pulls announcements from a remote JSON file and serves them to the frontend through a cached proxy endpoint.

### `GET /api/notifications/external`

Returns cached external notifications from `https://www.thinkroid.space/notice.json`.

**Caching**: Server-side in-memory cache with 24-hour TTL. First request triggers the fetch; subsequent requests serve from cache until expiry.

**Filtering**: Notices are split by the system install date (`notifications_started_at` in `global_settings`, auto-set on first access):
- `date >= install date` — all notices returned
- `date < install date` — only the 3 most recent returned

**Response**: `Notice[]`

```json
[
  { "id": "2026-04-02-sec", "tag": "[Security Update]", "message": "Critical update", "date": "2026-04-02" },
  { "id": "2026-03-28-feat", "message": "New feature available", "date": "2026-03-28" }
]
```

### notice.json Format

The source file hosted at `thinkroid.space/notice.json` must be a JSON array of notice objects:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier (e.g. `"2026-04-02-sec"`). Used for dismissal tracking. |
| `message` | string | yes | The notification text displayed in the marquee. |
| `date` | string | yes | Publication date in `YYYY-MM-DD` format. Used for filtering and sorting. |
| `tag` | string | no | Optional tag. `"[Security Update]"` bypasses the user's notification toggle. |

### Settings

| Key | Default | Description |
|-----|---------|-------------|
| `notifications_enabled` | `'true'` | When `'false'`, only `[Security Update]` notices are shown. Stored in `global_settings`. |
| `notifications_started_at` | (auto-set) | System install date (`YYYY-MM-DD`). Auto-written on first access. Used to filter old notices. |

### Frontend Behavior

- The `NotificationBar` component renders a fixed banner above the HUD when notices are available
- Dismissed notice IDs are stored in `localStorage` key `thinkroid_dismissed_notices`
- `[Security Update]` tagged notices always display regardless of the `notifications_enabled` setting
- Multiple notices scroll horizontally with a 40-second marquee animation
