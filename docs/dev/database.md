# Database Overview

Thinkroid Space uses SQLite (via `better-sqlite3`) with a synchronous API. The schema is defined in `db.js` using `CREATE TABLE IF NOT EXISTS` statements with additive `ALTER TABLE` migrations for backwards compatibility.

The database file is stored at the path set by the `DB_PATH` environment variable, defaulting to `thinkroid-space.db` in the project root.

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
    @me/memory/<agent>/{short,long,skill}.json  — on disk, managed by memoryManager.js
    agent:<id>:memory_config                     — stored in global_settings KV

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
| `agents` | Every AI employee in the system. No default agents are seeded at startup — all agents are created by the user or by applying an Agent Template. | Links to `providers` for Brain/Cerebellum/Context Engine; agents belong to orgs and departments via membership tables |
| `tasks` | Work unit lifecycle tracking from pending through completion or failure; supports subtask hierarchy | Assigned to agents by name; belongs to `projects`; self-referential parent/child via `parent_task_id` |
| `projects` | Groups tasks under an organizational or agent owner | Owned by either an `organization` or an `agent`; contains many `tasks` |

---

## 2. Communication

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `messages` | All messages across every channel (bulletin board, DMs, meeting channels, boss channel) | Belongs to a `conversation` via `conversation_id` |
| `conversations` | One record per channel, tracking type, participants, round count, and status | Optionally linked to a `room` and a `record` (meeting conclusion) |
| `read_cursors` | Tracks each agent's read position within a conversation for unread-message detection | Composite key on `(agent_name, conversation_id)`; references `messages` |
| `user_read_marks` | Records which messages have been read by the human user (Boss) | References `messages` |
| `records` | Knowledge artifacts produced by agents: meeting conclusions, notes, reports | Created by agents; linked to conversations via `conversations.record_id` |
| `boss_notifications` | Pending notifications surfaced to the human operator in the message center | References `agents` and `messages` |

---

## 3. Spatial

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `spaces` | Top-level office map; a single default space is created at startup | Parent of `rooms` and `placed_items` |
| `rooms` | Named areas within a space: workspaces, meeting rooms, break rooms | Belongs to `spaces`; optionally owned by an `agent` |
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
| `agent_capabilities` | Which of the 22 governance capabilities are active for each agent (e.g. `task_assignment`, `orphan_detection`, `tool_approval`, `notification_reader`); the `params` JSON column scopes capability behaviour (e.g. which tools the `tool_approval` agent covers) | References `agents`; unique per `(agent_id, capability_id)` |
| `tool_approvals` | Pending and resolved approval requests for `confirm`/`always_confirm`-level tools. The `decided_by TEXT` column records which agent (or `'boss'`) made the approval decision. | References `agents`, `tasks`, and `spaces`; stores execution context and resume state |
| `rules` | Rules injected into agent system prompts; stores `category` and `title` alongside `content`, with optional JSON `condition` (`{ scenes: string[], agents?: string[], hint?: string }`) | Scoped via `scope` + `scope_id` to one of `company`/`org`/`dept`/`project`/`room` |

---

## 6. Memory

Agent memory is **not** stored in SQLite. Each agent's short-term, long-term, and skill memory is persisted as JSON files at `@me/memory/<agent_name>/{short,long,skill}.json` inside the workspace volume, managed by `services/memoryManager.js`. Per-agent memory capacity and forgetting-curve parameters are stored under the key `agent:<id>:memory_config` in the `global_settings` KV table.

| Store | Purpose | Location |
|-------|---------|----------|
| short-term / long-term / skill memory | Structured memory entries per agent; tracks importance, decay, and retrieval frequency | `@me/memory/<agent>/{short,long,skill}.json` (workspace volume) |
| memory-config | Per-agent memory capacity limits and forgetting-curve parameters | `global_settings` row keyed `agent:<id>:memory_config` |

### `governance_events`

Governance events are persisted in their own `governance_events` table (decoupled from the generic `messages` table): `id, sender, content, event_type, priority, created_at`.
# Database: System Tables

> See also: [Back to top](#database-overview) | [Core Tables](#core)

---

## 7. AI and Debug

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `providers` | Reusable AI provider configurations (base URL, API key, model, rate limits) that agents reference by ID instead of storing credentials inline | Referenced by `agents` for Brain, Cerebellum, and Context Engine |
| `token_usage` | Accounting ledger with one row per AI API call, recording token consumption and estimated cost | References `agents` by name and optionally `tasks` |
| `debug_logs` | Full AI request/response payloads; only written when `debug_mode` is enabled in global settings | Standalone; recreated on schema change (old data not preserved) |
| `shadow_results` | Comparison records from shadow mode: shadow agent output vs original agent output on the same task | References `tasks` |

---

## 8. Scheduling

| Table | Purpose | Key Relationships |
|-------|---------|-------------------|
| `cron_jobs` | Scheduled recurring jobs: governance routines, task dispatches, and scripts; tracks last/next run and execution stats | Optionally linked to an `agent`; governance jobs map to a `capability_id` |
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
| `outer_channels` | External integration endpoints: Discord, Slack, Email, webhooks; stores credentials and per-channel rules | Standalone; `owner_agent` references an agent by name |

---

## All Indexes

Indexes are grouped by domain. The rationale is consistent: columns used in frequent `WHERE` filters or joins are indexed to avoid full-table scans as the dataset grows.

| Domain | Indexed tables (reason) |
|--------|------------------------|
| Core | `agents(name)` — looked up by name constantly; `tasks(status, assigned_to, project_id)` — task queue polling and filtering; `projects(owner_type+owner_id, status)` — owner lookups |
| Communication | `messages(channel, conversation_id, priority)` — channel feed queries; `conversations(type, status, channel)` — active conversation lookups; `read_cursors(agent_name)` — per-agent unread checks; `records(type, created_by)` — knowledge base filtering; `outer_channels(type)` — channel type filtering |
| Spatial | `rooms(space_id, type, owner_agent_id)` — room listing per space; `item_registry(category)` — item palette filtering; `placed_items(space_id, room_id, registry_id)` — rendering and spatial queries |
| Organization | `organizations(type, space_id)`; `org_members(org_id, agent_id)`; `departments(org_id, parent_dept_id)`; `dept_members(dept_id, agent_id)`; `management_relations(manager_agent_id, subordinate_agent_id)` — hierarchy traversal |
| Governance | `tool_approvals(status)` — pending approval queue; `rules(scope, category)`; `agent_capabilities(agent_id, capability_id)`; `governance_events(event_type, created_at)` |
| Memory | File-backed (`@me/memory/<agent>/{short,long,skill}.json`); index/access patterns implemented in `services/memoryManager.js` |
| AI and Debug | `token_usage(agent_name, created_at)` — cost reporting by agent and time range; `shadow_results(task_id)` |
| Scheduling | `cron_jobs(enabled, agent_id)` — scheduler polling; `cron_executions(cron_job_id, started_at)` — execution history |
| Skills | `agent_skills(agent_id+scope, skill_id)`; `skills(type, mcp_server_id)` |
| Auth | `login_attempts(identifier+created_at, ip_address+created_at)` — brute-force rate limiting |
