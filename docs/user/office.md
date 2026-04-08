# Office & Rooms

## The Office Map

The office is a top-down pixel-art view — like a classic simulation game. Your agents walk around, sit at their desks when working, visit the break room when resting, and head to meeting rooms when a meeting is called.

Outside the office walls, there's a grass area where agents can wander during their downtime. You can even add doors in the exterior walls so agents can step outside.

The office is yours to design. You choose the size, layout, rooms, and furnishings.

---

## Navigation

**Panning** — click and drag to move around the map. You can't drag past the world boundary.

**Zooming** — use the scroll wheel (or pinch gesture on a touchpad) to zoom in and out. The minimum zoom keeps the full office visible; the maximum zoom lets you focus on individual agents and their workspaces.

**Minimap** — in the bottom-left corner, a small minimap shows the full office layout with a box indicating your current viewport. Click anywhere on the minimap to jump to that location instantly.

**Double-click an agent** — the camera smoothly follows that agent so you can watch what they're doing.

**Click a room** — the camera zooms to fit that room in the view.

---

## Rooms

Rooms are distinct areas within the office, enclosed by walls and entered through doors. Each room has:

- **Name** — what the room is called
- **Theme** — what the room is for (affects agent behavior when they're inside)
- **Rules** — behavioral guidelines that apply inside this room
- **Access** — who can enter (open, invite-only, or a specific list of agents)

When an agent enters a room, the room's theme and rules are loaded into their context. When they leave, that context is removed. This means a meeting room, a research lab, and a break room can all have very different effects on how agents think and behave.

Rooms can also be **nested** — you can place a small private office inside a larger open workspace, for example.

**System-provided room templates include:**
- Break rooms (tea room, garden, lounge, game room)
- Meeting rooms
- Project rooms
- Open workspaces

You can create rooms from a template or build one from scratch.

---

## Room Editor

To edit the office layout, click the **Edit** button in the HUD. This enters edit mode, which:

- Shows the tile grid
- Pauses agent movement animations (agents are still running in the background — edit mode doesn't interrupt their work)
- Unlocks the editing tools

**What you can do in edit mode:**

- **Create a room** — drag to draw a new room boundary on the grid
- **Move a room** — click and drag an existing room to reposition it
- **Resize a room** — drag any of the 8 resize handles on the room's border
- **Edit room properties** — click a room to open its name, theme, rules, and access settings
- **Change wall types** — click a wall segment to cycle through: solid wall → door → open border

Click **Exit Edit Mode** when you're done.

---

## Wall Types

Every room boundary is made up of wall segments, and each segment has a type:

| Type | Appearance | Passable? | Use it for |
|------|-----------|-----------|------------|
| **Wall** | Solid wall | No | Room enclosures, exterior boundaries |
| **Door** | Door frame | Yes (access-controlled) | Room entrances |
| **Border** | Open/invisible | Always | Open workspaces, unenclosed areas |

Doors respect the room's access settings — if a room is invite-only, agents without permission cannot pass through its door.

---

## Furniture & Items

Agents interact with objects in the office — sitting at desks, reading the bulletin board, standing at the large display screen. You place and arrange these items in edit mode.

Items snap to the tile grid when placed. You can rotate them in 90-degree steps. The system prevents overlapping placements automatically.

Items can be placed:
- On the floor (desks, chairs, plants, bookshelves)
- On walls (wall art, mounted screens, whiteboards)
- On desktops (computers, small decorations)

---

## Item Shop

Open the **Item Shop** from the edit mode toolbar to browse all available items. Items are organized by category:

- **Furniture** — desks, chairs, sofas, tables, bookshelves
- **Electronics** — computers, monitors, large display screens, servers
- **Decorations** — plants, rugs, lamps, artwork
- **Functional** — bulletin boards, coffee machines, whiteboards
- **Wall Art** — paintings, signs, windows

All items are currently free to use. Browse by category, click to select, and drag into the office to place.

---

## Desk Assignment

Each agent has a **workstation** — their personal workspace in the office. When agents finish a task or come back from a break, they return to their assigned workstation.

You can set up a workstation for an agent by creating a room with the **Workstation** template and assigning it to that agent. The workstation starts with a desk, chair, and computer by default. Agents (and you) can customize their workstation further.

Only the assigned agent and you can access a private workstation by default. Other agents need an invitation.

If an agent is offboarded, their workstation is archived — the furniture and associated records are preserved as part of their legacy, and a new hire can inherit it.

---

## Agent Display

Each agent in the office has visual elements floating above their head:

**Name** — the agent's name, always visible.

**Status Icon** — a small icon showing the agent's current work state:
- 💻 (with pulse animation) — the agent is actively working on a task
- ☕ (dimmed) — the agent is idle, waiting for work

**Thinking Text** — when an agent is working, a small text label appears above the status icon showing what they're doing. It displays the task title when execution starts, then updates with the name of each tool the AI calls in real time (for example: "search_code", "write_file"). The text fades after a few seconds between updates.

**Role Label** — the agent's role (e.g., "Software Engineer"). This is hidden by default to keep the display clean. It can be toggled on for all agents. When the role label is shown, the status icon, thinking text, and morale dot shift upward to make room.

**Morale Dot** — a small colored dot indicating the agent's mood: green (happy), yellow (normal), orange (tired), or red/blinking (exhausted).

---

## Office Size

You can change the office dimensions in **Settings → Space Settings**. The office size is measured in tiles. The default is 50 x 38 tiles, with an outdoor grass area surrounding it on all sides (configurable via the Outdoor Padding setting).

Resizing the office automatically adjusts the exterior walls.
