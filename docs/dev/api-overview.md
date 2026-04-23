# API Overview

Base URL: `/api/`

## Authentication

All endpoints (except auth) require a valid JWT token via `ts_session` cookie. The session is issued at login and verified on every request.

Endpoints protected with `requirePermission(perm)` additionally check that the authenticated user has the named permission. Endpoints using `requireAdmin` require the `admin` role.

## Common Patterns

- **IDs**: UUID v4
- **Agent identity**: every per-agent path uses the UUID (`/api/agents/:id/*`). `agents.name` is mutable display text and never appears as a path parameter. Look up by name via `GET /api/agents?name=<string>`.
- **Sentinel agents**: the `system` (`00000000-0000-0000-0000-000000000001`) and `boss` (`00000000-0000-0000-0000-000000000002`) UUIDs are reserved non-human actors; per-agent endpoints return `404` for these UUIDs.
- **Timestamps**: ISO 8601
- **Error response**: `{ "error": "message" }`
- **All request/response bodies**: JSON (`Content-Type: application/json`)
- **Auth cookie**: `ts_session` (HttpOnly)

---

## Resources

- [API: Agents & Tasks](api-agents.md) — Agent management, memory, governance, tasks
- [API: Settings & Configuration](api-settings.md) — Global settings, providers, Athena, skills, cron
- [API: Communication & Content](api-communication.md) — Messages, conversations, outer channels, meetings, notifications, SSE events
- [API: Resources & Admin](api-resources.md) — Containers, files, rooms, items, departments, organizations, users, auth, approvals, projects, records, rules, spaces, legacies
