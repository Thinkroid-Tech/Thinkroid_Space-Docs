# Athena DOM Bridge

Athena 通过 `data-athena-*` HTML 属性与 UI 面板交互，实现对任意面板的读取、填写和点击操作。

## Overview

**Problem**: Athena could navigate panels and fill the onboarding wizard, but could not read arbitrary panel content, fill fields in other panels, or click buttons.

**Solution**: Data attribute tagging (`data-athena-*`) + centralized `uiBridge.js` utility. Each form field and button gets a `data-athena-field` or `data-athena-action` attribute. The UIBridge scans these tags to read/fill/click on demand.

**Why tags over DOM structure scanning:**
- Explicit opt-in — only tagged elements are accessible, no false positives
- Stable targeting — `data-athena-field="settings.space_name"` won't break when CSS or labels change
- i18n-proof — field keys are stable, not language-dependent display text
- Easy audit — `grep -r 'data-athena' src/components/` shows all Athena-accessible elements

---

## Three Backend Tools

| Tool | Permission | Description |
|------|-----------|-------------|
| `athena_read_ui` | auto | Scan the active panel — returns all fields (names, labels, current values), buttons, and display texts |
| `athena_fill_field` | confirm | Set the value of a form field by its `data-athena-field` name |
| `athena_click_button` | confirm | Click a button by its `data-athena-action` name |

**Usage pattern**: always call `athena_read_ui` first to discover what is available, then fill/click as needed.

---

## Data Attribute Reference

| Attribute | Target | Example |
|-----------|--------|---------|
| `data-athena-panel` | Panel container | `data-athena-panel="settings"` |
| `data-athena-page-prompt` | Panel container | `data-athena-page-prompt="Space Settings. Tab 1: ..."` |
| `data-athena-field` | input/select/textarea | `data-athena-field="settings.space_name"` |
| `data-athena-label` | Same element as field | `data-athena-label="Space Name"` |
| `data-athena-action` | button | `data-athena-action="settings.save"` |
| `data-athena-dangerous` | Destructive buttons | `data-athena-dangerous="true"` |
| `data-athena-text` | Display-only elements | `data-athena-text="dashboard.total_tokens"` |

---

## Naming Convention

- Format: `{panel}.{name}` — e.g., `settings.space_name`, `cron.schedule`, `dept.name`
- Field names must be **unique across all panels**
- Labels must be **English** (Athena understands via context; labels are for AI display only)

---

## Page Prompt Guidelines

Each panel container must have `data-athena-page-prompt` with 1-3 sentences covering:
1. Panel name and purpose
2. Major sections or tabs
3. Key capabilities

**Example:**
```jsx
<div className="space-settings-modal"
  data-athena-panel="settings"
  data-athena-page-prompt="Space Settings. Tab 1 (Providers): Add/edit/delete AI providers with API keys, base URLs, models, and pricing. Tab 2 (Models): Space name, language, default Brain/Cerebellum/Context Engine provider+model selection, office dimensions. Tab 3 (Debug): Debug logging toggle, max tool rounds, log viewer."
>
```

---

## Rules for New Panels

1. **MUST** add `data-athena-panel` + `data-athena-page-prompt` to the panel container
2. **MUST** tag all form fields with `data-athena-field` + `data-athena-label`
3. **MUST** tag all action buttons with `data-athena-action`
4. **MUST** mark destructive buttons with `data-athena-dangerous="true"`
5. **SHOULD** tag important display-only values with `data-athena-text`

---

## UIBridge (`uiBridge.js`)

Plain ES module at `thinkroid-space-ui/src/uiBridge.js`. No React dependency. Three exported functions:

- **`scanUI()`** — finds the topmost visible `[data-athena-panel]` container, scans all tagged fields/buttons/texts within it, returns structured JSON
- **`fillField(fieldName, value)`** — locates element by `data-athena-field`, sets value using React-compatible native setter + dispatches `input`/`change` events
- **`clickButton(actionName, confirmDangerous)`** — locates element by `data-athena-action`, checks dangerous guard, calls `.click()`

---

## Context Limits

| Item | Limit |
|------|-------|
| Field values | truncated at 400 chars |
| Text content | truncated at 500 chars |
| Select options | max 30 per dropdown |
| Fields per scan | max 100 |
| Buttons per scan | max 50 |
| Texts per scan | max 50 |

---

## Communication Flow

```
Read:  Athena tool → SSE { type: "ui_read", request_id }
                   → AthenaPanel handles SSE → scanUI()
                   → POST /api/athena/ui-result/:requestId
                   → Promise resolves in backend tool executor

Fill:  Athena tool → SSE { type: "ui_fill", request_id, field, value }
                   → AthenaPanel handles SSE → fillField(field, value)
                   → POST /api/athena/ui-result/:requestId
                   → Promise resolves

Click: Athena tool → SSE { type: "ui_click", request_id, action, confirmDangerous }
                   → AthenaPanel handles SSE → clickButton(action, confirmDangerous)
                   → POST /api/athena/ui-result/:requestId
                   → Promise resolves
```

The UIBridge events are streamed on the per-request `POST /api/athena/chat` SSE response (not the global `/api/events/stream`), alongside the Athena chat tokens and inline approval events.

This matches the existing approval flow pattern (`pendingAthenaApprovals` → `pendingUIRequests`).

---

## Dangerous Action Guard

Buttons tagged with `data-athena-dangerous="true"` are blocked unless `confirmDangerous: true` is explicitly passed to `athena_click_button`. This prevents accidental deletion or irreversible actions.

---

## Panel Coverage

~43 panel files are tagged, including:

- **Settings**: SpaceSettings, GovernancePanel, PermissionSettings, UserManagement
- **Agents**: AgentPanel, AgentSettings, AgentSkillsPanel, AgentTaskPanel, HirePanel
- **Wizard**: SetupWizard, OnboardingWizard and all 9 OnboardingStep*.jsx components (Template, BasicInfo, Persona, Department, Skills, Models, ExternalConnection, Legacy, Review)
- **Tasks/Projects**: TaskBoard, Board, Dashboard
- **Communication**: BossChatPanel, BulletinBoard, MeetingRoom, ChatLog, MessageCenter, ChatWindow
- **Infrastructure**: CronPanel, ContainerPanel, ExternalAgentsPanel, OuterChannelsOverlay
- **Content**: SkillLibrary, PromptEditor, FileManagerPanel, MemoryPanel, RecordsPanel
- **Other**: ApprovalPanel, RoomPropertiesPanel, BlockEditor, DepartmentPanel
- **Display-only**: TaskResult, DebugLogPanel, ChatOverlay, StatsBar, HUD, NotificationBar, ItemShopPanel, AthenaPanel
