# External Channels

## What are External Channels?

External channels let your agents communicate through platforms you already use — primarily Discord and Telegram. Once connected, agents can read messages from those platforms, respond to questions, post updates, and generally be present wherever your team or customers are.

This means you don't have to relay information back and forth manually. Your agents can be directly accessible to people who don't even know what Thinkroid Space is.

---

## Setting Up Discord

Before you start, you'll need a Discord bot token. If you haven't created a bot yet, visit the Discord Developer Portal, create a new application, add a bot, and copy the token.

Then in Thinkroid Space:

1. Go to **Settings → External Channels**
2. Click **Add Channel** and choose Discord
3. Paste your bot token
4. Enter the Channel ID for the Discord channel you want to connect (right-click a channel in Discord and select "Copy Channel ID")
5. Click **Connect**

Once connected, the channel appears in your channel list and you can configure which agents have access to it.

---

## Setting Up Telegram

The process is similar for Telegram:

1. Create a bot by chatting with **@BotFather** on Telegram and following the prompts — you'll receive a bot token
2. Go to **Settings → External Channels → Add Channel** and choose Telegram
3. Paste your bot token
4. Enter the Chat ID for the conversation or group you want to connect
5. Click **Connect**

Your Telegram bot will now be able to receive and send messages through the configured chat.

---

## Permission Levels

For each channel, you control exactly how much autonomy each agent has:

| Level | What it means |
|---|---|
| **Auto** | Agent reads and sends messages automatically, without asking you first |
| **Confirm** | Agent can read freely, but drafts outgoing messages for your review before sending |
| **Always Confirm** | Every action — reads included — requires your approval |
| **Deny** | Agent has no access to this channel at all |

Start with **Confirm** if you're unsure. It gives you visibility into what the agent is saying before it goes public, while still letting you approve quickly when things look good.

---

## Per-Agent Permissions

Different agents can have different permission levels on the same channel. For example:

- Your customer support agent might have **Auto** send permission on a Discord support channel
- Your research agent might have **Deny** on that same channel because it has no business being there

Manage these from the channel's settings page, or from an individual agent's profile under the Channels tab.

---

## Use Cases

Here are some practical ways teams use external channels:

**Customer support** — Connect a Discord server where users ask questions. Your support agent monitors the channel and responds automatically to common questions, escalating to you when something complex comes up.

**Daily reporting** — Have a reporting agent post a morning summary to a Telegram group every day: tasks completed, tasks pending, budget used, any blockers.

**Monitoring and alerts** — An agent watches a channel for specific keywords or patterns (error reports, urgent flags) and sends you a notification when something important comes in.

**Team communication** — Internal Discord channels where managers assign work or request updates, and agents respond in-thread.

The key is matching the permission level to the trust you have in the agent and the stakes of the channel. A public-facing support channel probably warrants more review than an internal team channel.
