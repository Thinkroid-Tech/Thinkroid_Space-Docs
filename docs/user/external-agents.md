# External Agents

External Agents let you connect an existing AI agent — one you already run, like [OpenClaw](https://openclaw.ai) or any other OpenAI-compatible service — into Thinkroid Space as a full citizen.

An external agent behaves exactly like any other agent in your office: it has a workspace room, avatar, can be assigned tasks, shows up on the Dashboard, and participates in the office. The key difference is that Thinkroid proxies task execution to your agent's own AI endpoint rather than running it through the built-in Brain model.

---

## What Are External Agents?

| Internal Agent | External Agent |
|----------------|----------------|
| Runs on Thinkroid's Brain/Cerebellum/Context Engine | Runs on its own AI backend (you supply the endpoint) |
| Memory managed by Thinkroid | Memory managed by the external agent (or passed through) |
| Configured via AgentSettings | Configured via External Agents panel |
| Tools executed locally | Tools bridged from Thinkroid to the external agent |

Use external agents when:
- You already have a specialized AI agent set up elsewhere and want it in your office
- You prefer a different AI stack for certain tasks while keeping everything visible in one place

---

## How to Connect an External Agent

### Option 1 — Onboarding Wizard

1. Click **Hire** in the HUD to open the wizard.
2. On the Template step, select **External Agent**.
3. Fill in the agent's name, specialty, and avatar.
4. On the Connection step, enter the endpoint URL, API key, and model name.
5. Click **Test Connection** to verify the endpoint responds.
6. Complete the remaining steps and click **Hire**.

### Option 2 — External Agents Panel

1. Open the **External Agents** panel from the **Comms** section in the left sidebar.
2. Click **Add External Agent**.
3. Fill in the connection form (see Connection Settings below).
4. Click **Test** to verify, then **Save**.

---

## Connection Settings

| Field | Description |
|-------|-------------|
| **Endpoint URL** | The base URL of the OpenAI-compatible API (e.g. `http://localhost:8080/v1` or `https://api.my-agent.com/v1`) |
| **API Key** | API key for authenticating to the external endpoint (leave empty if the endpoint requires no auth) |
| **Model** | Model name to pass in chat completion requests |

---

## Memory Modes

External agents support two modes for how conversation history is handled:

### No Local Memory *(default)*

Thinkroid sends **no conversation history** with each request. The external agent is responsible for maintaining its own memory and context. Choose this if your external agent already manages memory internally.

### Passthrough Context

Thinkroid includes **recent conversation history** in each request, trimmed to fit within a configured token limit. This is useful if your external agent is stateless but can benefit from recent context.

Set the **Context Token Limit** to control how many tokens of history are included. Older turns are trimmed first when the limit is reached.

---

## Tool Bridging

When tool bridging is enabled, Thinkroid tools are exposed to the external agent as standard OpenAI function definitions. The external agent can call them just like any other tool, and Thinkroid executes them on its side.

**Namespace prefix** — To avoid name conflicts with tools the external agent already knows, enable the `ts__` namespace prefix. For example, Thinkroid's `file_read` tool will appear to the external agent as `ts__file_read`.

Tool bridging is off by default. Enable it in the External Agents panel when editing a connection.

---

## Connection Token (Callbacks)

Each external agent has a **connection token** — a secret token the external agent can use to call back into Thinkroid. For example, it can post messages, check task status, or update records.

The token is separate from your login session and does not expire unless you rotate it.

**How to use:**
- Include the token in the `X-Callback-Token` header when calling `/api/external-agents/callback`.
- Rotate the token at any time in the External Agents panel → **Manage Token** → **Rotate**.

> **Note:** Callback endpoints are rate-limited to 60 requests per minute per token.

---

## Testing a Connection

Before saving or after changing the endpoint, click **Test Connection** in the External Agents panel. Thinkroid sends a minimal chat request to the endpoint and reports whether it received a valid response. A green check means the connection is working; a red error shows the response or error code.

---

## What's Next?

- [Agents](./agents.md) — manage your full team including external agents
- [Tasks & Projects](./tasks.md) — assign tasks to external agents
- [Settings](./settings.md) — global options and providers
