# API: Agents & Tasks

> **Agent identity.** Every per-agent endpoint uses `/api/agents/:id/*` where `:id` is the agent's UUID (`agents.id`). `agents.name` is mutable display text and is never used as a path parameter. To look an agent up by name, use `GET /api/agents?name=<name>`.

## Agents

Manage AI agents — settings, memory, capabilities, and governance.

### `GET /api/agents`
List all agents. Only human agents (`kind='human'`) appear in the roster; the built-in `system` and `boss` sentinel rows are never returned. API keys are masked.
Query: `?name=<string>` — optional exact-match name lookup, returns the single matching agent or an empty array.
Returns `Agent[]`. Each agent object includes `id` (UUID), `name`, and a computed `governance_color` field (hex string, e.g. `#ff8800`) derived server-side from the highest-priority active capability category. Used by the UI to tint the agent's office sprite.

### `POST /api/agents`
Create a new agent. Automatically creates a workspace room and initializes position. The server assigns a fresh UUID and writes per-agent directories (`office/agents/<uuid>/`, `workspace/agents/<uuid>/`) keyed on that UUID.
Body: `{ name, role?, avatar?, specialty?, model_brain?, brain_provider_id?, brain_max_tokens?, model_cerebellum?, cerebellum_provider_id?, cerebellum_max_tokens?, model_context_engine?, context_engine_provider_id?, context_engine_max_tokens?, shadow_mode? }`
Returns `Agent` (201). Requires `manage_agents`.

### `GET /api/agents/roster`
Team overview — lightweight list with active task count and department.
Returns `{ id, name, role, specialty, status, morale, max_concurrent, active_tasks, department }[]`.

### `GET /api/agents/governance/capabilities`
List all 22 governance capability definitions with category and kind metadata. Includes the `tool_approval` capability (kind: `hook`, category: `approval`, color: `#ff8800`).
Returns `{ capabilities, categories, kinds, kindLabels }`.

### `GET /api/agents/governance/templates`
List all 11 pre-configured Agent Templates from `AGENT_TEMPLATES` in `governanceEngine.js` (Manager, Accountant, InternalAuditor, Sentinel, Evaluator, ToolUseManager, NotificationReader, and others).
Returns `Template[]`.

### `GET /api/agents/agent-templates`
List all 11 Agent Templates defined in `AGENT_TEMPLATES` inside `governanceEngine.js`, plus a Custom entry used by the hire wizard (12 creation options total). Each template bundles a persona, specialty, governance capabilities, and org role into a single configuration that can be applied to any agent.
Returns `AgentTemplate[]` — each entry has `{ id, name, description, persona, specialty, capabilities, orgRole }`.

### `GET /api/agents/:id`
Get a single agent by UUID.
Returns `Agent`.

### `PUT /api/agents/:id`
Update agent fields. Masked API keys are ignored.

Passing `{ name: newName }` rewrites the single `agents.name` column and triggers three bounded sync writes before the response is returned:

1. The `ts.agent.name` label is refreshed on every Docker container owned by the agent. Containers are **not** rebuilt, and no docker object name changes. Label-refresh failures are best-effort: they are logged and increment a metric, but do not roll back the rename.
2. `workspace/agents/<uuid>/.alias` is rewritten to contain the new display name.
3. The `agent:renamed` hook fires once with `{ agentId, oldName, newName }`. Extensions and the SSE bridge use this event to invalidate cached display strings.

All FK references, filesystem directories, DM channel keys, Docker network and volume names, and SSE routing continue to resolve against the unchanged UUID.

Body: any subset of `{ name, role, avatar, specialty, model_brain, brain_provider_id, brain_max_tokens, model_cerebellum, cerebellum_provider_id, cerebellum_max_tokens, model_context_engine, context_engine_provider_id, context_engine_max_tokens, status, shadow_mode, morale }`
Returns `Agent`. Requires `manage_agents`.

### `DELETE /api/agents/:id`
Fire an agent immediately. Generates a legacy file (`office/legacies/<uuid>/`), cleans up management relations, and deletes the agent's workspace room and memory files (`office/agents/<uuid>/`, `workspace/agents/<uuid>/`).
Query: `?legacy=1` to skip re-generating an existing legacy.
Returns `204 No Content`. Requires `manage_agents`.

### `GET /api/agents/:id/subordinates`
List direct subordinates.
Returns `{ id, name, role, specialty, status, relation_type }[]`.

### `POST /api/agents/:id/subordinates`
Add a subordinate relationship.
Body: `{ subordinate_id }` (UUID)
Returns `{ id, manager_agent_id, subordinate_agent_id }` (201). Requires `manage_agents`.

### `DELETE /api/agents/:id/subordinates/:subId`
Remove a subordinate relationship. `:subId` is the subordinate's UUID.
Returns `{ ok: true }`. Requires `manage_agents`.

### `POST /api/agents/:id/offboard`
Run the offboarding flow (AI generates handover letter and legacy file) without deleting the agent.
Returns `{ success, agentName, handover, message }`. Requires `manage_agents`.

### `POST /api/agents/:id/learn/:legacyId`
Have an agent learn from a legacy directory; AI extracts and stores relevant memories. `:legacyId` identifies the legacy folder under `office/legacies/` by its original agent UUID.
Body: `{ instructions?, model? }` (`model`: `"brain"` or `"cerebellum"`)
Returns `{ success, extracted, reinforced, merged, message }`. Requires `manage_agents`.

> **Sentinel rows.** Calling any `GET/PUT /api/agents/:id/*` endpoint with the `system` (`00000000-0000-0000-0000-000000000001`) or `boss` (`00000000-0000-0000-0000-000000000002`) UUID returns `404` — sentinels own FK rows but are not addressable through the agent API.

---

## Agent Settings & Shadow Mode

### `GET /api/agents/:id/settings`
Get model and provider configuration for an agent by UUID. API keys are masked.
Returns full settings object (brain/cerebellum/context-engine provider IDs, models, limits, tools, avatar).

### `PUT /api/agents/:id/settings`
Update model/provider configuration by UUID.
Body: any subset of settings fields.
Returns `Agent`. Requires `manage_agents`.

### `GET /api/agents/:id/shadow-results`
List all shadow comparison results for a shadow-mode agent.
Returns `{ id, task_id, task_title, shadow_agent_id, original_agent_id, shadow_result, original_result, created_at }[]`.

### `POST /api/agents/:id/promote`
Promote a shadow-mode agent to a regular agent.
Returns `{ success, agent, message }`. Requires `manage_agents`.

---

## Governance & Capabilities

### `GET /api/agents/:id/capabilities`
Get all governance capabilities assigned to an agent.
Returns `AgentCapability[]`.

### `PUT /api/agents/:id/capabilities`
Batch-set governance capabilities for an agent.
Body: `{ capabilities: { id, enabled, params? }[] }`
Returns `{ results, capabilities }`. Requires `manage_agents`.

### `POST /api/agents/:id/capabilities/apply-template`
Apply a governance template to an agent. Calling this sets the agent's persona, specialty, capabilities, and org role atomically using `applyTemplate()` in `governanceEngine.js`.
Body: `{ template }` (e.g. `"Manager"`, `"Sentinel"`)
Returns `{ ...result, capabilities }`. Requires `manage_agents`.

> **Capability-based lookups** — internal services use `findAgentWithCapability(capabilityId)` to resolve role-specific agents at runtime (e.g. finding the `tool_approval` agent, the `output_review` agent) instead of relying on hard-coded name strings. The resolver returns a UUID.

### `GET /api/agents/:id/morale`
Get detailed morale metrics.
Returns `{ morale, status, needsRest, metrics: { consecutive_tasks, failRate, idleMinutes } }`.

### `POST /api/agents/:id/rest`
Trigger memory consolidation and reset the consecutive-task counter.
Returns `{ morale, status, consolidated, message }`. Requires `manage_agents`.

### `POST /api/agents/audit/:taskId`
Run an internal audit of a completed task using the agent with `output_review` capability.
Returns `{ taskId, taskTitle, assignedToId, auditReport, messageId, message }`. Requires `manage_agents`.

### `POST /api/agents/efficiency/check`
Run a global efficiency check; detects stuck tasks (in-progress > 30 min) and triggers interventions.
Returns `{ report, rawData, checkedAt }`. Requires `manage_agents`.

### `POST /api/agents/evaluator/review/:id`
Run a performance review for a single agent (`:id` is the UUID).
Returns `{ agentId, agentName, role, reviewReport, rawData, reviewedAt }`. Requires `manage_agents`.

### `POST /api/agents/evaluator/review-all`
Run a team-wide performance review for all non-evaluator agents.
Returns `{ overallReport, agentCount, agentDataList, reviewedAt }`. Requires `manage_agents`.

---

## Memory

### `GET /api/agents/:id/memory-entries`
Paginated structured-memory endpoint. **Currently a stub**: the implementation returns an empty `entries` array and `total: 0` regardless of the query params, pending the planned `ThinkroidMemory` migration (see Memory section in `database.md`). The `type` query param is accepted but not yet meaningful.
Query: `?type=<string>&page=1&limit=20`
Returns `{ entries: [], total: 0, page, limit }`.

### `PUT /api/agents/:id/memory-entries/:entryId`
**Stubbed in the current build.** Signature is routable, but because the list endpoint returns no entries, no real `entryId` exists to update today. Planned activation with the `ThinkroidMemory` migration.
Body: `{ tags?, importance? }`
Returns `{ success: true }` on write. Requires `manage_agents`.

### `DELETE /api/agents/:id/memory-entries/:entryId`
**Stubbed in the current build.** Same stub status as the `PUT` variant — reachable route, but with no addressable entries until structured memory ships.
Returns `{ success: true }`. Requires `manage_agents`.

### `GET /api/agents/:id/memory-stats`
Get memory statistics and configuration.
Returns `{ stats, config }`.

### `GET /api/agents/:id/memory-config`
Get the memory engine configuration.
Returns memory config object.

### `PUT /api/agents/:id/memory-config`
Update the memory engine configuration.
Body: memory config fields.
Returns `{ success: true }`. Requires `manage_agents`.

### `GET /api/agents/:id/memory/:type`
Read raw memory content. `type` must be one of `short`, `long`, `persona`, or `project` (anything else → 400). Backed by Markdown files under `office/agents/<uuid>/` — `short_memory.md`, `long_memory.md`, `persona.md` — and `office/projects/thinkroid-space/memory.md` for `project`. Skill memory is not exposed through this endpoint.
Returns `{ type, content }`.

### `PUT /api/agents/:id/memory/:type`
Write raw memory content. Same `type` whitelist as the GET variant (`short` / `long` / `persona` / `project`; any other value → 400).
Body: `{ content: string }`
Returns `{ success, type, message }`. Requires `manage_agents`.

### `POST /api/agents/:id/memory/consolidate`
Trigger memory consolidation (cerebellum compresses short-term into long-term).
Returns consolidation result. Requires `manage_agents`.

---

## Prompt Blocks

### `GET /api/agents/:id/governance-prompts`
Get custom governance prompt overrides.
Returns `{ prompts }`.

### `PUT /api/agents/:id/governance-prompts`
Update governance prompt overrides.
Body: `{ prompts: { [groupId]: blocks } }`
Returns `{ success: true }`. Requires `manage_agents`.

### `GET /api/agents/:id/scene-templates`
Get scene template block configuration with defaults and metadata.
Returns `{ scenes, defaults, meta }`.

### `PUT /api/agents/:id/scene-templates/:sceneId`
Update prompt blocks for a specific scene template.
Body: `{ blocks: Block[] }`
Returns `{ success: true }`. Requires `manage_agents`.

### `DELETE /api/agents/:id/scene-templates/:sceneId`
Reset a scene template to the global default.
Returns `{ success: true }`. Requires `manage_agents`.

### `GET /api/agents/:id/memory-blocks`
Get memory prompt block configuration (all groups) with defaults and metadata.
Returns `{ groups, defaults, meta }`.

### `PUT /api/agents/:id/memory-blocks/:groupId`
Update memory prompt blocks for a specific group.
Body: `{ blocks: Block[] }`
Returns `{ success: true }`. Requires `manage_agents`.

### `DELETE /api/agents/:id/memory-blocks/:groupId`
Reset a memory block group to the global default.
Returns `{ success: true }`. Requires `manage_agents`.

### `GET /api/agents/:id/governance-blocks`
Get governance prompt block configuration (all groups) with defaults and metadata.
Returns `{ groups, defaults, meta }`.

### `PUT /api/agents/:id/governance-blocks/:groupId`
Update governance prompt blocks for a specific group.
Body: `{ blocks: Block[] }`
Returns `{ success: true }`. Requires `manage_agents`.

### `DELETE /api/agents/:id/governance-blocks/:groupId`
Reset a governance block group to the global default.
Returns `{ success: true }`. Requires `manage_agents`.

---

## Tasks

### `GET /api/tasks`
List all tasks. Query: `?project_id=<uuid>&assigned_to_id=<uuid>`
Returns `Task[]`. Each task object carries `assigned_to_id` (UUID FK) plus a pre-joined `assigned_to_name` for display.

### `POST /api/tasks`
Create a task. Auto-triggers execution if the assigned agent is idle.
Body: `{ title, description?, assigned_to_id?, project_id? }`
Returns `Task` (201). Requires `manage_tasks`.

### `POST /api/tasks/batch-execute`
Trigger execution of multiple pending tasks simultaneously.
Body: `{ task_ids: string[] }`
Returns `{ triggered, results: { taskId, status, reason? }[] }`. Requires `manage_tasks`.

### `GET /api/tasks/export`
Export tasks as JSON or Markdown.
Query: `?format=json|markdown&project_id=&assigned_to_id=&status=&from=&to=`
Returns JSON array or Markdown file download.

### `GET /api/tasks/history`
Paginated and filtered task history.
Query: `?assigned_to_id=&status=&project_id=&page=1&limit=20`
Returns `{ tasks, pagination }`.

### `PUT /api/tasks/:id`
Update a task. Enforces valid status transitions.
Body: any subset of `{ title, description, assigned_to_id, status }`
Returns `Task`. Requires `manage_tasks`.

### `DELETE /api/tasks/:id`
Delete a task.
Returns `{ ok: true }`. Requires `manage_tasks`.

### `POST /api/tasks/:id/execute`
Execute a task. Thin HTTP wrapper around `executeTask()` that runs the full AI + tool-use loop and enforces per-agent concurrency limits. Returns `409 Conflict` if the task is not in `pending` state.
Returns `{ success, taskId, result, moraleWarning? }`. Requires `manage_tasks`.

> There is no `POST /api/tasks/:id/interrupt` or `POST /api/tasks/:id/retry` endpoint. Interruption is triggered by sending a Chat message through the `taskExecutor`'s interrupt label channel; retries are performed by writing `status` back to `pending` via `PUT /api/tasks/:id` (done by governance or Boss).

### `GET /api/tasks/:id/stream`
SSE stream for real-time task execution progress.
Returns SSE stream — event types: `connected`, `start`, `tool_use`, `done`, `error`.
