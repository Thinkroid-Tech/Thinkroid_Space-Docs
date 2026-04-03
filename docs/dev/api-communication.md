# API: Communication & Content

## Messages

### `GET /api/messages/all-chats`
Get all DM and bulletin messages with cursor-based pagination.
Query: `?limit=100&before=<ISO timestamp>` — Returns `Message[]`.

### `GET /api/messages`
List messages with cursor-based pagination, optionally filtered by channel.
Query: `?channel=<string>&limit=50&before=<ISO timestamp>` — default limit 50, max 500. Returns `Message[]` in ascending order.

### `POST /api/messages/chat`
Send a message to an AI chat channel and receive an AI reply. The `boss` channel routes through the Manager agent and auto-creates tasks on `[CREATE_TASK]` markers.
Body: `{ channel, content, agentName?, agentRole?, priority? }`
Returns `{ id, channel, sender, content, created_at, autoCreatedTasks? }`. Requires `send_messages`.

### `POST /api/messages`
Post a raw message to any channel (no AI reply).
Body: `{ channel?, sender?, content }`
Returns `Message` (201). Requires `send_messages`.

### `DELETE /api/messages/:id`
Delete a message.
Returns `{ ok: true }`. Requires `send_messages`.

---

## Conversations

### `GET /api/conversations`
List conversations with optional filters.
Query: `?type=meeting|dm&participant=<agentName>&status=active|archived` — Returns `Conversation[]`.

### `GET /api/conversations/unread`
Get unread conversation summaries for a specific agent.
Query: `?agent=<agentName>` (required) — Returns `{ conversationId, channel, type, topic, unreadCount }[]`.

### `GET /api/conversations/boss-unread`
Get conversations with unread messages for the Boss.
Returns `{ conversationId, channel, type, topic, unreadCount }[]`.

### `GET /api/conversations/boss-read-marks`
Get all Boss read mark records.
Returns `{ message_id }[]`.

### `GET /api/conversations/:id`
Get a conversation with its most recent 50 messages.
Returns `Conversation` with `participants[]` and `messages[]`.

### `GET /api/conversations/:id/messages`
Get paginated messages for a conversation.
Query: `?limit=50&before=<ISO timestamp>` — Returns `Message[]`.

### `POST /api/conversations`
Create a new conversation.
Body: `{ type, participants: string[], topic?, maxRounds? }`
Returns `Conversation` (201). Requires `manage_conversations`.

### `POST /api/conversations/:id/messages`
Send a message into a conversation as Boss.
Body: `{ content, sender?, priority? }`
Returns `Message` (201). Requires `manage_conversations`.

### `POST /api/conversations/:id/conclude`
End a conversation and generate an AI conclusion summary.
Returns `{ conclusion, recordId, ... }`. Requires `manage_conversations`.

### `POST /api/conversations/:id/read`
Mark a conversation as read for an agent.
Body: `{ agent: string, lastMessageId? }` — Returns `{ ok: true }`. Requires `manage_conversations`.

### `POST /api/conversations/:id/boss-read`
Batch-mark messages as read for the Boss.
Body: `{ messageIds: string[] }` — Returns `{ ok, marked: number }`. Requires `manage_conversations`.

---

## Outer Channels

External communication channels (Discord, Telegram, etc.).

### `GET /api/outer-channels`
List all external channel configurations.
Returns `OuterChannel[]`.

### `POST /api/outer-channels`
Create an external channel.
Body: `{ name, type, theme?, rules?, permissions?, config?, owner_agent? }`
Returns `OuterChannel` (201).

### `POST /api/outer-channels/discord-channels`
Fetch text channels from all Discord guilds accessible by the given bot token.
Body: `{ bot_token }` — Returns `{ id, name, guild, guildId }[]`.

### `POST /api/outer-channels/telegram-chats`
Fetch recent chats from a Telegram bot token.
Body: `{ bot_token }` — Returns `{ id, title, type }[]`.

### `POST /api/outer-channels/test-config`
Test a channel adapter connection using an unsaved configuration.
Body: `{ type, config }` — Returns `{ ok, message? }`.

### `PUT /api/outer-channels/:id`
Update an external channel. Toggling `enabled` automatically starts/stops the listener.
Body: any subset of channel fields. Returns `OuterChannel`.

### `DELETE /api/outer-channels/:id`
Delete an external channel and stop its listener.
Returns `{ ok: true, deleted: string }`.

### `POST /api/outer-channels/:id/test`
Test the connection of a saved channel using its stored config.
Returns `{ ok, message? }`.

### `POST /api/outer-channels/:id/send`
Send a message to an external channel as Boss. Also stores it locally.
Body: `{ message }` — Returns `{ ok, channel, sender }`.

---

## Meeting

### `GET /api/meeting/list`
List past meeting records (up to 50 most recent).
Returns `{ id, topic, caller, participants, conclusion, channel, recordId, created_at }[]`.

### `GET /api/meeting/:meetingId/messages`
Get all messages from a specific meeting.
Returns `Message[]`.

### `POST /api/meeting/start`
Start a meeting — runs one round of agent speaking, generates a conclusion, returns when complete.
Body: `{ topic, participants: string[] }`
Returns `{ success, meetingId, topic, participants, conclusion, messages }`. Requires `manage_conversations`.

---

## Notifications

### `GET /api/notifications`
List Boss notifications. `pending` shows the latest per agent; `read` shows most recently read.
Query: `?status=pending|read&limit=50` — Returns `BossNotification[]`.

### `PUT /api/notifications/read-all`
Mark all pending notifications as read.
Returns `{ success: true, count: number }`.

### `PUT /api/notifications/:id/read`
Mark a notification (and all other pending ones from the same agent) as read.
Returns `{ success: true, count: number }`.

---

## Events (SSE)

### `GET /api/events/stream`
Open a persistent SSE connection. Receives all system events from the server.
Returns SSE stream (`text/event-stream`). Initial event: `{ type: "connected" }`.

| Event | Payload |
|-------|---------|
| `agent:status` | `{ agentName, status }` |
| `agent:morale-changed` | `{ agentName, morale, status, needsRest }` |
| `agent:chat` | `{ channel, sender, target, message, priority }` |
| `task:created` | `{ taskId, title, assigned_to, unassigned }` |
| `task:updated` | `{ taskId, status, deleted? }` |
| `task:interrupted` | `{ taskId, agentName, interruptedBy, snapshotRecordId }` |
| `task:resuming` | `{ taskId, agentName }` |
| `task:completed` | `{ taskId, agentName, result }` |
| `stats:refresh` | `{}` |
| `approval:resolved` | `{ approvalId, toolName, agentName, decision, pendingCount }` |
| `notification:new` | `{ ...notification, pendingCount }` |
| `cron:updated` | `{ action, jobId }` |
| `skills:updated` | `{ serverId }` |
| `meeting:started` | `{ meetingId, topic, caller, participants, channel }` |
| `outer_chat:sent` | `{ channelId, channelName, sender, message }` |
