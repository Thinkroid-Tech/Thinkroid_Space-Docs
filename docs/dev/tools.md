# Agent Tools

Thinkroid Space agents interact with the world through tools. All tools are auto-discovered from `thinkroid-space-server/src/services/tools/` by `registry.js` — each tool file exports `{ defaultPermission, definition, executor }`. The registry currently loads **50 built-in tools**: 8 file / shell / web, 6 container, 1 introspection, 8 collaboration, 6 task / project, 3 record & memory, 2 spatial, 1 reasoning, 1 skill, 1 scheduling, and 13 Athena UI-bridge tools. The 13 Athena tools carry a `specialRoleExclusive: 'athena'` registry marker so only the Athena agent can call them; eleven default-allow tools (e.g. `chat_with`, `shell_exec`, `delegate_task`, `call_meeting`) carry a `roleBlacklist: ['athena']` marker that denies Athena access while leaving them open to every other agent.

---

## Movement & Perception

| Tool | Description |
|------|-------------|
| `move_to` | Move to a location in the office. Destinations: `meeting_room`, `break_room`, `own_workspace`, `bulletin_board`, `dashboard_screen`, `agent:<AgentName>` (resolved server-side to the target's UUID), or `x,y` coordinates. Must move to a location before interacting with people or things there. |
| `perceive_surroundings` | Look around to see current room, nearby colleagues, and nearby items. Use before deciding where to move or who to interact with. |

## Communication

| Tool | Description |
|------|-------------|
| `chat_with` | Send a chat message to a specific colleague. Use for casual conversations, discussing work, or socializing with nearby agents. |
| `check_messages` | Check inbox for recent direct messages. Configurable lookback window (default 10 min, max 60 min). Check regularly and reply using `chat_with`. |
| `post_bulletin` | Post a message to the office bulletin board for everyone to see. Use for announcements, thoughts, or updates. |
| `read_bulletin` | Read recent messages from the office bulletin board. |
| `check_outer_chat` | Check recent messages from external communication channels (Discord, Telegram). Returns messages from channels the agent has permission to access. |
| `send_outer_chat` | Send a message to an external communication channel. Requires Boss approval. |
| `notify_boss` | Send a message to the Boss when information is important enough for their attention. Use for reporting issues, requesting decisions, or sharing critical updates — not for routine status. |
| `call_meeting` | Call a meeting with specific colleagues to discuss a topic. Each participant speaks in turn, then a summary/conclusion is generated and saved as a permanent Record. |

## Task & Project Management

| Tool | Description |
|------|-------------|
| `check_my_tasks` | Check assigned tasks. Returns pending and in-progress tasks by default. |
| `complete_task` | Mark the current task complete and submit the result. The result is attached to the task row and broadcast via `task:completed`. |
| `delegate_task` | Delegate a new sub-task to a direct subordinate. Input: `{ title, description, assign_to, project? }`; the caller must be the assignee's direct manager. The sub-task is created and automatically executed. |
| `reject_task` | Reject the current task and send it back to the assigner. Input: `{ reason }` (taskId is taken from the executor context). Only valid when the task is `in_progress`. |
| `list_projects` | List all projects in the workspace. Shows active projects by default. |
| `get_project_detail` | Get detailed information about a specific project, including its rules and active task count. |
| `cron_schedule` | Create, update, delete, or list scheduled cron jobs. Supports two types: `task` (creates a Task on schedule) and `script` (runs a command in container/shell, requires Boss approval). Standard 5-field cron syntax. |

## File Operations

All file tools support workspace routing with prefixes:
- `@me/` — personal workspace
- `@project:{id}/` — project workspace
- `@org:{id}/` — organization workspace
- No prefix — auto-routes to project workspace (if in task) or personal workspace

| Tool | Description |
|------|-------------|
| `file_read` | Read the contents of a file. |
| `file_write` | Write content to a file. Creates the file if it does not exist. |
| `file_edit` | Edit a file by replacing an exact string match. |
| `file_search` | Search for files by name pattern (glob) and/or content (regex). |
| `file_delete` | Delete a file or directory in the workspace. |

## Container & Execution

Agents can run code and deploy services in sandboxed Docker containers. Workspace files are mounted at `/workspace` inside containers.

All six container tools accept an `agent_id` parameter (UUID). When an agent calls a container tool, `agent_id` defaults to the caller's own UUID pulled from the execution context, so agents do not usually need to supply it explicitly. Docker objects themselves carry no display name — containers are named `ts_<uuid>_<scope>_<shortId>` (scope ∈ `sandbox` / `deploy` / `service`), networks are `ts-net-<uuid>`, and volumes are `ts-vol-<uuid>_<type>`. A `ts.agent.name` Docker label is maintained for debugging only and is refreshed on rename without rebuilding the container.

| Tool | Description |
|------|-------------|
| `container_run` | Run a command in a temporary Docker container and return output. Container is automatically removed after execution. Example: `container_run({ image: "python:3.12-slim", command: "python /workspace/script.py" })` |
| `container_deploy` | Deploy a long-running service container (web server, database). Returns container name and mapped ports. |
| `container_list` | List Docker containers belonging to an agent. Parameter `agent_id` (UUID) selects the target; legacy callers that still pass `agent` as a display name are resolved via a compatibility lookup on `agents.name` and logged as deprecated. Response shows name, image, status, ports, and type (sandbox/service). |
| `container_logs` | Fetch recent stdout/stderr from a container. |
| `container_stop` | Stop a running container. |
| `container_remove` | Remove a container. Should be stopped first unless `force=true`. |
| `shell_exec` | Execute a shell command in the workspace. All commands require Boss approval. |

## Web Access

| Tool | Description |
|------|-------------|
| `web_search` | Search the web using DuckDuckGo. Returns results with titles, URLs, and snippets. |
| `web_fetch` | Fetch a URL and return text content. Strips HTML by default; set `raw=true` for original HTML. |

## Records, Self & Memory

| Tool | Description |
|------|-------------|
| `read_record` | Look up a Record by name or ID and return its content. |
| `write_record` | Create or update a Record (notes, meeting conclusions, reports). |
| `recall` | Recall all memories related to a topic or query. Returns keyword-matched memory fragments within a token budget. |
| `update_self_profile` | Update own persona description and/or specialty. Changes take effect immediately. |
| `deep_think` | Trigger deep thinking mode to recall more memories with lower filtering thresholds. Use for complex tasks that need more background information. |
| `install_skill` | Request installation of a new skill or tool. Supports `mcp_server`, `skill_url`, or `builtin_skill` types. Requires Boss approval. |

---

## Adding a Custom Tool

Create a new `.js` file in `thinkroid-space-server/src/services/tools/`:

```javascript
export default {
  // 'auto' = execute immediately, 'confirm' = Boss approval queue,
  // 'always_confirm' = routed to approval agent (tool_approval capability),
  // 'deny' = blocked entirely
  defaultPermission: 'auto',

  definition: {
    type: 'function',
    function: {
      name: 'my_tool_name',
      description: 'What this tool does — shown to the agent.',
      parameters: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'Description of param1'
          }
        },
        required: ['param1']
      }
    }
  },

  async executor(args, ctx) {
    // args = parsed parameters from the AI
    // ctx = { agentId, spaceId, taskId, sessionId, mode }
    //   — built by buildToolContext({ agentId, sessionId, mode }); identity is
    //   the UUID. Display names are resolved lazily via the registry if needed.
    const { param1 } = args;

    // ... do work ...

    return 'Result string shown to the agent';
  }
};
```

The tool is auto-discovered on server startup — no registration needed.

### Permission Levels

| Level | Behavior |
|-------|----------|
| `auto` | Executes immediately, no approval needed |
| `confirm` | Queued for Boss approval before execution |
| `always_confirm` | Routed to the designated tool-approval agent (see below) |
| `deny` | Blocked entirely |

Permissions can be overridden per-agent through the governance system. `checkPermission()` in `tools/permissions.js` returns `always_confirm` as a distinct string — it is never collapsed into `confirm`.

---

### Tool Approval Agent Flow

When `checkPermission()` returns `always_confirm`, the tool dispatcher (`tools/index.js`) calls `tryAgentApproval()` instead of queuing for the Boss:

1. `findAgentWithCapability('tool_approval')` locates the designated approver agent. If none is found, execution falls back to the standard Boss-approval queue.
2. The approver agent's `params` field on the `tool_approval` capability scopes which tools it covers. Tools outside that scope bypass agent approval and fall through to Boss approval normally.
3. `tryAgentApproval()` sends the pending tool call to the approver agent as a task; the approver responds with `approve` or `reject`.
4. The decision and the approver's UUID (`decided_by_id`) are written to the `tool_approvals` table before execution proceeds or the tool call is cancelled. When the human operator approves through the Boss queue, the `boss` sentinel UUID (`00000000-0000-0000-0000-000000000002`) is recorded.

This allows governance agents (e.g. a security reviewer) to approve or reject sensitive tool calls autonomously without requiring the human Boss to act on every request.

---

## Athena Tools

Athena ships with 13 UI-bridge tools in the same `services/tools/` registry; these carry a `specialRoleExclusive: 'athena'` registry marker so they are exposed only to the Athena agent (`special_role='athena'`) and filtered out of every other agent's tool list.

| Tool | Description |
|------|-------------|
| `athena_query_space` | Read workspace data (agents, tasks, settings) to answer user questions. |
| `athena_query_agents` | Query agent details (roster, specialty, current task, governance capabilities). |
| `athena_query_tasks` | Query tasks across projects with status / assignee filters. |
| `athena_query_settings` | Read individual keys from `global_settings`. |
| `athena_create_task` | Create a new task on behalf of the user (Boss-side creation). |
| `athena_send_message` | Send a message into a chat channel on the user's behalf. |
| `athena_update_setting` | Update a `global_settings` key after inline approval. |
| `athena_fill_onboarding` | Pre-fill Agent Onboarding Wizard fields based on the user conversation. |
| `athena_present_options` | Render clickable option cards below Athena's response for multi-step choices. |
| `athena_navigate` | Open a UI panel via SSE event from backend to frontend (e.g. `hire`, `departments`, `bossChat`, `settings`, `dashboard`, `taskBoard`, `board`, `governance`, `skills`, `meeting`, `approvals`, `bulletin`, `chatLog`, `messageCenter`, `records`, `outerChannels`, `prompts`, `fileManager`, `containers`, `cron`, `userMgmt`, `externalAgents`). |
| `athena_read_ui` | Scan the topmost visible panel via `uiBridge.scanUI()` and return structured JSON of fields/buttons/texts. |
| `athena_fill_field` | Locate a form input by `data-athena-field` and set its value (via `uiBridge.fillField()`). Requires inline approval. |
| `athena_click_button` | Click a button by `data-athena-action` (via `uiBridge.clickButton()`). Destructive buttons (`data-athena-dangerous="true"`) require `confirmDangerous`. Requires inline approval. |

Inline approvals for the write-type Athena tools are streamed back on the per-request `POST /api/athena/chat` SSE response (`approval_needed` event) and resolved through `POST /api/athena/approve/:approvalId`. MCP tools installed via `install_skill` are exposed under the `mcp__{serverName}__{toolName}` namespace (see `design/tools.md`).
