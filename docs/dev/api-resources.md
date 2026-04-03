# API: Resources & Admin

## Containers

Manage Docker containers with the `ts.managed=true` label.

### `GET /api/containers`
List all managed Docker containers. Returns `503` if Docker is unavailable.
Returns `{ name, image, status, state, agent, type, ports, created }[]`.

### `GET /api/containers/:name/logs`
Get stdout/stderr logs from a managed container.
Query: `?tail=200&since=<unix|10m|2h|1d>` — Returns `{ stdout, stderr }`.

### `POST /api/containers/:name/stop`
Stop a managed container.
Body: `{ force?: boolean }` — Returns `{ ok: true }`. Requires `manage_containers`.

### `DELETE /api/containers/:name`
Remove a managed container. Query: `?force=true`
Returns `{ ok: true }`. Requires `manage_containers`.

---

## Files

Workspace file manager (paths are relative to workspace root).

### `GET /api/files/list`
List directory contents. Query: `?path=.`
Returns `{ name, type, size, mtime }[]`.

### `GET /api/files/read`
Read a file's text content. Returns metadata only for binary or oversized (>10 MB) files.
Query: `?path=<filepath>` — Returns `{ isBinary, tooLarge?, size, mtime, totalLines?, content }`.

### `GET /api/files/download`
Download a file, or download a folder as a ZIP archive.
Query: `?path=<filepath or directory>`.

### `POST /api/files/upload`
Upload files via multipart form. Max 50 MB per file, up to 20 files.
Query: `?path=.` (target directory). Body: `multipart/form-data` with `files[]`.
Returns `{ uploaded, files: { name, size }[] }`.

### `POST /api/files/mkdir`
Create a directory (recursive).
Body: `{ path }` — Returns `{ created }`.

### `POST /api/files/rename`
Rename or move a file or directory.
Body: `{ oldPath, newPath }` — Returns `{ renamed: { from, to } }`.

### `DELETE /api/files/delete`
Delete a file or directory (recursive).
Body: `{ path }` — Returns `{ deleted }`.

### `GET /api/files/search`
Search by glob pattern and/or content regex.
Query: `?pattern=<glob>&content=<regex>&path=.&max_results=50`
Returns `{ results: { path, type?, line?, content? }[] }`.

---

## Rooms

### `GET /api/rooms`
List all rooms in the current space.
Returns `Room[]`.

### `GET /api/rooms/:id`
Get a single room.
Returns `Room`.

### `POST /api/rooms`
Create a room. Validates bounds don't partially overlap existing rooms.
Body: `{ name, bounds_x, bounds_y, bounds_w, bounds_h, type?, walls?, owner_agent_id?, theme?, rules?, access? }`
Returns `Room` (201). Requires `manage_spaces`.

### `PUT /api/rooms/:id`
Update a room. If bounds change without explicit walls, segments are proportionally rescaled. Item positions cascade.
Body: any subset of room fields. Returns `Room`. Requires `manage_spaces`.

### `DELETE /api/rooms/:id`
Delete a room.
Returns `204 No Content`. Requires `manage_spaces`.

### `PUT /api/rooms/:id/walls`
Update wall segments for one side of a room.
Body: `{ side: "top"|"bottom"|"left"|"right", segments: { start, length, type }[] }`
Returns `Room`. Requires `manage_spaces`.

---

## Items

### `GET /api/items/registry`
List all registered item types. Query: `?category=<string>`
Returns `RegistryItem[]`.

### `GET /api/items/registry/:id`
Get a single registered item type.
Returns `RegistryItem`.

### `GET /api/items/registry/:id/interact-tiles`
Get interactable tile coordinates for an item.
Query: `?spaceId=<uuid>&placedItemId=<uuid>` — Returns `{ x, y }[]`.

### `PUT /api/items/registry/:id`
Update a registered item's `interact_radius` (clamped 1–10).
Body: `{ interact_radius }` — Returns `RegistryItem`. Requires `manage_spaces`.

### `GET /api/items`
List all placed items in the current space. Query: `?room_id=<uuid>`
Returns `PlacedItem[]`.

### `POST /api/items`
Place an item. Validates bounds and collision.
Body: `{ registry_id, tile_x, tile_y, room_id?, rotation? }`
Returns `PlacedItem` (201). Requires `manage_spaces`.

### `PUT /api/items/:id`
Move or rotate a placed item. Validates bounds and collision.
Body: `{ tile_x?, tile_y?, rotation?, room_id? }` — Returns `PlacedItem`. Requires `manage_spaces`.

### `DELETE /api/items/:id`
Remove a placed item.
Returns `204 No Content`. Requires `manage_spaces`.

---

## Departments

### `GET /api/departments`
List departments. Query: `?org_id=<uuid>&parent_dept_id=<uuid|null>`
Returns `Department[]`.

### `GET /api/departments/:id`
Get a department with its members and child departments.
Returns `Department` with `members[]` and `children[]`.

### `POST /api/departments`
Create a department. Auto-adds the department head as a member.
Body: `{ org_id, name, description?, head_agent_id?, parent_dept_id?, specialty? }`
Returns `Department` (201).

### `PUT /api/departments/:id`
Update a department. Changing the head auto-adds the new head as member.
Body: any subset of department fields. Returns `Department`.

### `DELETE /api/departments/:id`
Delete a department and all child departments recursively. Clears management relations.
Returns `{ ok: true }`.

### `POST /api/departments/:id/members`
Add an agent to a department.
Body: `{ agent_id }` — Returns `{ id, dept_id, agent_id }` (201).

### `DELETE /api/departments/:id/members/:agentId`
Remove an agent from a department.
Returns `{ ok: true }`.

---

## Organizations

### `GET /api/organizations`
List all organizations.
Returns `Organization[]`.

### `GET /api/organizations/:id`
Get an organization with its member list.
Returns `Organization` with `members[]`.

### `POST /api/organizations`
Create an organization. Automatically creates a default "Daily Chore" project.
Body: `{ name, description?, type?, space_id?, rules? }`
Returns `Organization` (201).

### `PUT /api/organizations/:id`
Update an organization.
Body: any subset of organization fields. Returns `Organization`.

### `DELETE /api/organizations/:id`
Delete an organization and all its member records.
Returns `204 No Content`.

### `POST /api/organizations/:id/members`
Add an agent to an organization.
Body: `{ agent_id, role? }` — Returns `{ id, org_id, agent_id, role }` (201).

### `DELETE /api/organizations/:id/members/:agentId`
Remove an agent from an organization.
Returns `204 No Content`.

---

## Users

All routes require the `admin` role. Roles have fixed permissions (no per-user overrides):

| Permission | Admin | User | Viewer |
|-----------|:-----:|:----:|:------:|
| manage_users | Yes | — | — |
| manage_agents | Yes | Yes | — |
| manage_tasks | Yes | Yes | — |
| send_messages | Yes | Yes | — |
| manage_settings | Yes | Yes | — |
| manage_containers | Yes | Yes | — |
| manage_spaces | Yes | Yes | — |
| manage_rules | Yes | Yes | — |
| manage_conversations | Yes | Yes | — |
| manage_records | Yes | Yes | — |
| manage_cron | Yes | Yes | — |
| use_athena | Yes | Yes | — |
| view | Yes | Yes | Yes |

### `GET /api/users/permissions`
List all available permission definitions and role defaults.
Returns `{ permissions, roleDefaults }`.

### `GET /api/users/limits`
Return per-role account limits and current counts.
Returns `{ limits: { admin: 1, user: 2, viewer: 2 }, counts: { admin, user, viewer } }`.

### `GET /api/users`
List all users with permission overrides.
Returns `{ id, username, displayName, role, lockedUntil, createdAt, updatedAt }[]`.

### `POST /api/users`
Create a new user. Enforces per-role limits (1 admin, 2 users, 2 viewers) — returns 400 if the role is at capacity.
Body: `{ username, password, displayName, role }` (`role`: `"admin"` | `"user"` | `"viewer"`)
Returns User (201).

### `GET /api/users/:id`
Get a user by ID with permission overrides.
Returns User with permissions.

### `PUT /api/users/:id`
Update a user. Role changes are subject to per-role limits — returns 400 if the target role is at capacity.
Body: any subset of `{ username, displayName, role, password }`. Returns User.

### `DELETE /api/users/:id`
Delete a user (cannot delete your own account).
Returns `{ ok: true }`.

### `POST /api/users/:id/unlock`
Unlock a locked user account.
Returns `{ ok: true }`.

---

## Auth

### `GET /api/auth/status`
Check initialization status and current session.
Returns `{ initialized, authenticated, turnstileSiteKey }`. No auth required.

### `POST /api/auth/setup`
First-time setup: create the initial admin account. Fails if any user already exists.
Body: `{ username, password, displayName, spaceName? }`
Returns `{ user }` (201) + sets `ts_session` cookie. No auth required.

### `POST /api/auth/login`
Log in. Supports Turnstile CAPTCHA, rate limiting, and lockout after 5 failed attempts.
Body: `{ username, password, turnstileToken? }`
Returns `{ user }` + sets `ts_session` cookie. No auth required.

### `POST /api/auth/logout`
Log out. Clears the `ts_session` cookie.
Returns `{ ok: true }`. No auth required.

### `GET /api/auth/me`
Get the currently authenticated user.
Returns `{ user: { id, username, displayName, role } }`.

---

## Approvals

### `GET /api/approvals`
List tool approvals. Query: `?status=pending|all`
Returns `ToolApproval[]`.

### `POST /api/approvals/:id/decide`
Approve or deny a pending tool approval. On approval, executes the tool and resumes the suspended agent loop.
Body: `{ decision: "approved" | "denied" }` — Returns `{ ok: true, decision }`.

---

## Projects

### `GET /api/projects`
List projects with optional filters. Query: `?owner_type=org|agent&owner_id=<uuid>&status=active|archived`
Returns `Project[]`.

### `POST /api/projects`
Create a project.
Body: `{ name, owner_id, owner_type?, description?, rules? }`
Returns `Project` (201).

### `GET /api/projects/:id`
Get a project by ID.
Returns `Project`.

### `PUT /api/projects/:id`
Update a project.
Body: any subset of `{ name, description, status, rules }`. Returns `Project`.

### `DELETE /api/projects/:id`
Delete a project. Cannot delete default projects; tasks migrate to the owner's default project.
Returns `204 No Content`.

---

## Records

### `GET /api/records`
List records with optional filtering and search.
Query: `?type=note|meeting_conclusion|task_snapshot&created_by=<agentName>&q=<search>&limit=50`
Returns `Record[]`.

### `GET /api/records/:id`
Get a record by ID.
Returns `Record`.

### `POST /api/records`
Create a record.
Body: `{ name, content, type?, created_by?, links?, access? }`
Returns `Record` (201). Requires `manage_records`.

### `PUT /api/records/:id`
Update a record.
Body: any subset of `{ name, content, links, access }`. Returns `Record`. Requires `manage_records`.

### `DELETE /api/records/:id`
Delete a record.
Returns `{ ok: true }`. Requires `manage_records`.

---

## Rules

### `GET /api/rules/scopes`
List all available rule scopes with entity names.
Returns `{ type, id, label }[]` — e.g. `{ type: "dept", id: "uuid", label: "Engineering (department)" }`.

### `GET /api/rules`
List rules with optional filters.
Query: `?scope=company|project|org|dept|room&scope_id=<uuid>`
Returns `Rule[]` with parsed `condition` object.

### `GET /api/rules/effective/:scope`
Get effective merged rules for a scope. Company rules form the base; scope-specific rules override by category.
Returns `Rule[]`.

### `POST /api/rules`
Create a rule.
Body: `{ scope, scope_id?, category, title, content, enabled?, condition? }`
`condition` format: `{ scenes?: string[], agents?: string[], hint?: string }`
Returns `Rule` (201). Requires `manage_rules`.

### `PUT /api/rules/:id`
Update a rule.
Body: any subset of `{ scope, scope_id, category, title, content, enabled, condition }`.
Returns `Rule`. Requires `manage_rules`.

### `DELETE /api/rules/:id`
Delete a rule.
Returns `204 No Content`. Requires `manage_rules`.

---

## Spaces

### `GET /api/spaces/current`
Get the current space configuration with auto-repaired wall data.
Returns `Space`.

### `PUT /api/spaces/current`
Update the current space's name or dimensions.
Body: `{ name?, width?, height? }` — Returns `Space`. Requires `manage_spaces`.

### `PUT /api/spaces/current/walls`
Update wall segments for one side of the space boundary.
Body: `{ side: "top"|"bottom"|"left"|"right", segments: { start, length, type }[] }`
Returns `Space`. Requires `manage_spaces`.

### `GET /api/spaces/current/grid`
Get the computed tile grid (walkable/blocked tiles) for pathfinding.
Returns tile grid object.

### `GET /api/spaces/current/path`
Run A* pathfinding between two tile coordinates.
Query: `?fromX=&fromY=&toX=&toY=&agentId=<uuid>` — Returns `{ path: { x, y }[] }`.

---

## Legacies

### `GET /api/legacies`
List all legacy files from departed agents.
Returns legacy summary array.

### `GET /api/legacies/:name`
Read a legacy file's full content.
Returns legacy object.

### `DELETE /api/legacies/:name`
Permanently delete a legacy file directory.
Returns `{ success: true }`. Requires `manage_agents`.
