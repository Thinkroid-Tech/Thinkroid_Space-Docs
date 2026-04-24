# Database Overview

Thinkroid Space uses SQLite (via `better-sqlite3`) with a synchronous API. The schema is defined in `db.js` using `CREATE TABLE IF NOT EXISTS` statements with additive `ALTER TABLE` migrations for backwards compatibility.

The database file is stored at the path set by the `DB_PATH` environment variable, defaulting to `thinkroid-space.db` in the project root.

## Agent identity model

`agents.id` (UUID v4) is the system-wide identity key. Every cross-table reference is a UUID FK to `agents.id`; `agents.name` is mutable display text and never appears as a foreign key.

- **`agents.kind`** — `TEXT` column with CHECK constraint `kind IN ('human', 'system', 'boss')`. Defaults to `'human'` for user-created rows.
- **`human_agents`** — a view over `agents` that filters `WHERE kind = 'human'`. Any query that should see only real employees (the office roster, task-assignment candidates, morale rollups) reads from this view.
- **Sentinel rows** — `db.js` seeds two non-human actors at init so FK references to "system-generated" or "the operator" can be satisfied without a user-created agent:

  | Name | UUID | Kind |
  |------|------|------|
  | `system` | `00000000-0000-0000-0000-000000000001` | `system` |
  | `boss`   | `00000000-0000-0000-0000-000000000002` | `boss` |

  Sentinels own rows in `messages`, `governance_events`, `tool_approvals`, `token_usage`, etc. but are excluded from the roster by `human_agents`.
- **Rename cost** — `PUT /api/agents/:id` with a `name` change rewrites a single column. No FK data needs to be migrated, no DM channel is renamed, no filesystem path moves. Docker `ts.agent.name` labels are refreshed lazily on next container action (the `ts.agent.id` label is the identity of record).

## Entity-Relationship Overview

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│   providers  │◄──────│    agents    │──────►│   tasks      │
└─────────────┘       └──────┬───────┘       └──────┬───────┘
                              │                       │
                    ┌─────────┼──────────┐            │
                    ▼         ▼          ▼            ▼
             ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
             │org_members│ │dept_   │ │agent_    │ │ projects │
             └─────┬─────┘ │members │ │capabilit.│ └──────────┘
                   │       └────┬───┘ └──────────┘
                   ▼            ▼
          ┌──────────────┐ ┌────────────┐
          │organizations │ │departments │
          └──────┬───────┘ └────────────┘
                 │
                 ▼
            ┌─────────┐
            │ spaces  │──────►┌──────────┐──────►┌─────────────┐
            └─────────┘       │  rooms   │       │placed_items │
                              └──────────┘       └──────┬──────┘
                                                        │
                                                        ▼
                                               ┌───────────────┐
                                               │ item_registry │
                                               └───────────────┘

┌─────────────────┐   ┌──────────────┐   ┌───────────────────┐
│  conversations  │◄──│   messages   │──►│  read_cursors     │
└─────────────────┘   └──────────────┘   └───────────────────┘

┌──────────────┐   ┌────────────────┐   ┌──────────────────┐
│  cron_jobs   │──►│cron_executions │   │ governance_events│
└──────────────┘   └────────────────┘   └──────────────────┘

  Memory store (NOT a SQL table):
    office/agents/<uuid>/{persona,short_memory,long_memory}.md  — Markdown, managed by src/office.js
    office/projects/thinkroid-space/memory.md                    — project-shared Markdown
    office/legacies/<uuid>/                                      — offboarding snapshot
    agent:<uuid>:memory_config                                   — stored in global_settings KV

┌───────────┐   ┌────────────────┐   ┌─────────────────┐
│   skills  │◄──│  agent_skills  │   │   mcp_servers   │
└───────────┘   └────────────────┘   └─────────────────┘

┌───────────┐   ┌────────────────────┐   ┌──────────────────┐
│   users   │──►│ user_permissions   │   │  login_attempts  │
└───────────┘   └────────────────────┘   └──────────────────┘
```

## Migration Strategy

Schema changes are applied additively via `ALTER TABLE` wrapped in `try/catch`, making `initDB()` safe to run against an existing database at any time. Columns that already exist are never re-created and no data is dropped.

---

## Table Reference

| Page | Sections |
|------|----------|
| [Core Tables](#core) | Core, Communication, Spatial, Organization, Governance, Memory |
| [System Tables](#ai-and-debug) | AI and Debug, Scheduling, Skills, Auth, Config, External, All Indexes |
# Database: Core Tables

> See also: [Back to top](#database-overview) | [System Tables](#ai-and-debug)

---

## 1. Core

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `agents` | Every actor in the system, identified by UUID `id`. `kind` is one of `human`/`system`/`boss`; two sentinel rows (`system`, `boss`) are seeded at init. No default *human* agents are seeded — human employees are created by the user or by applying an Agent Template. | Links to `providers` for Brain/Cerebellum/Context Engine; human agents belong to orgs and departments via membership tables |
| `tasks` | Work unit lifecycle tracking from pending through completion or failure; supports subtask hierarchy | `assigned_to_id` and `delegated_by_id` are UUID FKs to `agents.id` (both `ON DELETE SET NULL`); belongs to `projects`; self-referential parent/child via `parent_task_id` |
| `projects` | Groups tasks under an organizational or agent owner | Owned by either an `organization` or an `agent` (UUID FK); contains many `tasks` |

---

## 2. Communication

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `messages` | All messages across every channel (bulletin board, DMs, meeting channels, boss channel). DM channel keys follow `dm:<uuid_low>:<uuid_high>` (two UUIDs sorted lexicographically). | `sender_id` FK to `agents.id`; belongs to a `conversation` via `conversation_id` |
| `conversations` | One record per channel, tracking type, participants, round count, and status. `participants` is a JSON column holding an array of agent UUIDs. | `created_by_id` FK to `agents.id`; optionally linked to a `room` and a `record` (meeting conclusion) |
| `read_cursors` | Tracks each agent's read position within a conversation for unread-message detection | Composite primary key `(agent_id, conversation_id)`; `agent_id` FK to `agents.id`; references `messages` |
| `user_read_marks` | Records which messages have been read by the human user (Boss) | References `messages` |
| `records` | Knowledge artifacts produced by agents: meeting conclusions, notes, reports. **Lives in an isolated SQLite file** `office/records.db`, not in the main Space DB — see the "Record store isolation" note below for the integrity model. | `agent_id` is a UUID matching `agents.id` (validated at the write layer rather than enforced by SQL FK, because SQL FKs cannot cross database files); linked to conversations via `conversations.record_id` |
| `boss_notifications` | Pending notifications surfaced to the human operator in the message center | `agent_id` FK to `agents.id`; references `messages`. The redundant `agent_name` column has been retired. |

---

## 3. Spatial

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `spaces` | Top-level office map; a single default space is created at startup | Parent of `rooms` and `placed_items` |
| `rooms` | Named areas within a space: workspaces, meeting rooms, break rooms | Belongs to `spaces`; `owner_agent_id` is a UUID FK to `agents.id` with `ON DELETE SET NULL` (firing the owner detaches the room instead of deleting it) |
| `item_registry` | Catalog of all placeable item types with visual and interaction parameters | Referenced by `placed_items` |
| `placed_items` | Instances of items actually placed in the office | Belongs to `spaces`; optionally scoped to a `room`; typed via `item_registry` |

---

## 4. Organization

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `organizations` | Top-level logical groupings of agents (companies, teams) | Linked to a `space`; contains agents via `org_members` |
| `org_members` | Many-to-many join between organizations and agents | References `organizations` and `agents`; unique per `(org_id, agent_id)` |
| `departments` | Sub-units within an organization; supports nested hierarchy | Belongs to `organizations`; self-referential parent via `parent_dept_id`; has a `head_agent_id` |
| `dept_members` | Many-to-many join between departments and agents | References `departments` and `agents`; unique per `(dept_id, agent_id)` |
| `management_relations` | Derived reporting lines between agents, auto-synced from org/department structure | References `agents` twice (manager + subordinate); rows with `relation_type != 'manual'` are regenerated by `syncManagementRelations()` — never edit them directly |

---

## 5. Governance

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `agent_capabilities` | Which of the 22 governance capabilities are active for each agent (e.g. `task_assignment`, `orphan_detection`, `tool_approval`, `notification_reader`); the `params` JSON column scopes capability behaviour (e.g. which tools the `tool_approval` agent covers) | `agent_id` is a `NOT NULL` UUID FK to `agents.id` with `ON DELETE CASCADE` — firing an agent atomically clears its capability assignments; unique per `(agent_id, capability_id)` |
| `tool_approvals` | Pending and resolved approval requests for `confirm`/`always_confirm`-level tools. The `decided_by_id` UUID column records which agent made the approval decision; the `boss` sentinel UUID (`00000000-0000-0000-0000-000000000002`) is used when the human operator approves. | FKs to `agents.id`, `tasks`, and `spaces`; stores execution context and resume state |
| `rules` | Rules injected into agent system prompts; stores `category` and `title` alongside `content`, with optional JSON `condition` (`{ scenes: string[], agents?: string[], hint?: string }`) | Scoped via `scope` + `scope_id` to one of `company`/`org`/`dept`/`project`/`room` |

---

## 6. Memory

Agent memory is **not** stored in SQLite. Each agent's persona, short-term, and long-term memory is persisted as plain Markdown files under `office/agents/<uuid>/` on disk, managed by `src/office.js` (`readMemory` / `writeMemory`). When an agent is offboarded, these files are bundled into `office/legacies/<uuid>/` as a handover archive. Because paths are keyed on the immutable UUID, renaming an agent does not move any memory files. Per-agent memory capacity and forgetting-curve parameters are stored under the key `agent:<uuid>:memory_config` in the `global_settings` KV table.

| Store | Purpose | Location |
|-------|---------|----------|
| persona | Static role identity written by `applyTemplate()` or `update_self_profile` | `office/agents/<uuid>/persona.md` |
| short_memory | Recent context, working memory | `office/agents/<uuid>/short_memory.md` |
| long_memory | Consolidated long-term knowledge | `office/agents/<uuid>/long_memory.md` |
| project memory | Shared per-project notes | `office/projects/thinkroid-space/memory.md` |
| legacy archive | Snapshot of the above at offboarding time | `office/legacies/<uuid>/` |
| memory-config | Per-agent memory capacity limits and forgetting-curve parameters | `global_settings` row keyed `agent:<uuid>:memory_config` |

Skill memory is not currently persisted on disk as a dedicated file; the `ThinkroidMemory` module mentioned in `src/office.js` comments (targeting `CeAccessView` / `CerebellumL1View`) is planned but not yet shipped, and no code path writes a `skill_memory.md` today. Backup, inspection, and offboarding tooling should therefore target only the files listed above.

### `governance_events`

Governance events are persisted in their own `governance_events` table (decoupled from the generic `messages` table): `id, sender_id, content, event_type, priority, created_at`. `sender_id` is a UUID FK to `agents.id`; system-generated governance events reference the `system` sentinel UUID.

### Record store isolation

The `records` table does not live in the main Space database — it lives in a dedicated SQLite file `office/records.db`. This preserves the Phase 11 design property that a container's record corpus is a single portable file (easy to export, archive, or attach separate PRAGMA tuning for) and keeps the main DB free of the record-store's high-write-rate workload.

Because SQL foreign keys cannot cross database files, `records.agent_id` cannot be enforced by a `REFERENCES agents(id)` constraint. Integrity is instead guaranteed by three application-layer gates:

1. **Write-time validation.** Every code path that writes an `agent_id` into `records.db` (`POST /api/records`, the `write_record` tool, governance artifacts) calls a shared helper that rejects anything that isn't a valid UUID present in `agents.id`. Invalid writes return `400` and never touch disk.
2. **Delete hook.** `DELETE /api/agents/:id` synchronously calls `recordStore.deleteByAgent(agentId)` after the main-DB transaction commits. The hook is best-effort: a failure is logged as a warning but does not roll back the agent delete. The weekly cron (below) is the safety net for missed deletes.
3. **Weekly orphan sweep.** The seeded `orphan_records_cleanup` cron job runs every Monday at 03:00, scans `records.db` for rows whose `agent_id` is no longer in `agents.id`, deletes them, and exposes `records_orphan_count` on the `/api/metrics` admin endpoint so orphan accumulation is observable.

```
  Memory paths:
    office/agents/<uuid>/{persona,short_memory,long_memory}.md   — managed by src/office.js
    office/projects/thinkroid-space/memory.md                     — project-shared Markdown
    office/legacies/<uuid>/                                       — offboarding snapshot
    agent:<uuid>:memory_config                                    — stored in global_settings KV
```

# Database: System Tables

> See also: [Back to top](#database-overview) | [Core Tables](#core)

---

## 7. AI and Debug

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `providers` | Reusable AI provider configurations (base URL, API key, model, rate limits) that agents reference by ID instead of storing credentials inline | Referenced by `agents` for Brain, Cerebellum, and Context Engine |
| `token_usage` | Accounting ledger with one row per AI API call, recording token consumption and estimated cost | `agent_id` FK to `agents.id`; optionally references `tasks`. The redundant `agent_name` column has been retired. |
| `debug_logs` | Full AI request/response payloads; only written when `debug_mode` is enabled in global settings | Standalone; the redundant `agent_name` column has been retired — rows reference `agent_id` directly. Recreated on schema change (old data not preserved) |
| `shadow_results` | Comparison records from shadow mode: shadow agent output vs original agent output on the same task | `shadow_agent_id` and `original_agent_id` FKs to `agents.id`; references `tasks` |

---

## 8. Scheduling

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `cron_jobs` | Scheduled recurring jobs: governance routines, task dispatches, and scripts; tracks last/next run and execution stats. The `type` column is one of `task` / `governance` / `script` / `system`. A built-in `orphan_records_cleanup` row (`type = 'system'`, `schedule = '0 3 * * 1'`, owned by the `system` sentinel) runs every Monday at 03:00 and sweeps the isolated `office/records.db` for rows whose `agent_id` no longer exists in `agents.id`; the resulting orphan count is surfaced through `/api/metrics`. | `assigned_to_id` and `created_by_id` FKs to `agents.id`; governance jobs map to a `capability_id` |
| `cron_executions` | Execution log for each cron job fire, recording status, timing, and any created task | References `cron_jobs`; optionally references `tasks` |

---

## 9. Skills

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `mcp_servers` | MCP (Model Context Protocol) server configurations for external tool integrations; stores connection info and discovered tools | Referenced by `skills` |
| `skills` | Skill definitions: bundles of tools with optional system prompt injections; can be builtin, MCP-backed, or custom | References `mcp_servers` for MCP-type skills |
| `agent_skills` | Binding table: which skills are assigned to which agents and in which engine scope (brain, cerebellum, context_engine) | References `agents` and `skills`; unique per `(agent_id, skill_id, scope)` |

---

## 10. Auth

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `users` | Human user accounts for multi-user authentication | Parent of `user_permissions` |
| `user_permissions` | Fine-grained permission overrides for individual users, supplementing role-based defaults | References `users` (cascades on delete) |
| `login_attempts` | Brute-force protection: tracks login attempts per identifier and IP address | Standalone; indexed for fast rate-limit lookups by identifier and IP |

---

## 11. Config

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `global_settings` | Key-value store for all system-wide configuration (space name, debug mode, active space ID, etc.) | Standalone; read at startup and via the settings API |

---

## 12. External

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `outer_channels` | External integration endpoints: Discord, Slack, Email, webhooks; stores credentials and per-channel rules | `owner_agent_id` FK to `agents.id` |

---

## All Indexes

Indexes are grouped by domain. The rationale is consistent: columns used in frequent `WHERE` filters or joins are indexed to avoid full-table scans as the dataset grows.

| Domain | Indexed tables (reason) |
|--------|------------------------|
| Core | `agents(name)` — unique lookup by display name; `agents(kind)` — sentinel filtering; `tasks(status, assigned_to_id, project_id)` — task queue polling and filtering; `projects(owner_type+owner_id, status)` — owner lookups |
| Communication | `messages(channel, conversation_id, priority)` — channel feed queries; `messages(sender_id)` — sender lookups; `conversations(type, status, channel)` — active conversation lookups; `read_cursors(agent_id)` — per-agent unread checks; `records(type, created_by_id)` — knowledge base filtering; `outer_channels(type)` — channel type filtering |
| Spatial | `rooms(space_id, type, owner_agent_id)` — room listing per space; `item_registry(category)` — item palette filtering; `placed_items(space_id, room_id, registry_id)` — rendering and spatial queries |
| Organization | `organizations(type, space_id)`; `org_members(org_id, agent_id)`; `departments(org_id, parent_dept_id)`; `dept_members(dept_id, agent_id)`; `management_relations(manager_agent_id, subordinate_agent_id)` — hierarchy traversal |
| Governance | `tool_approvals(status)` — pending approval queue; `rules(scope, category)`; `agent_capabilities(agent_id, capability_id)`; `governance_events(event_type, created_at)` |
| Memory | File-backed Markdown under `office/agents/<uuid>/{persona,short_memory,long_memory}.md`; read/write through `src/office.js` |
| AI and Debug | `token_usage(agent_id, created_at)` — cost reporting by agent and time range; `shadow_results(task_id)` |
| Scheduling | `cron_jobs(enabled, assigned_to_id)` — scheduler polling; `cron_executions(cron_job_id, started_at)` — execution history |
| Skills | `agent_skills(agent_id+scope, skill_id)`; `skills(type, mcp_server_id)` |
| Auth | `login_attempts(identifier+created_at, ip_address+created_at)` — brute-force rate limiting |
