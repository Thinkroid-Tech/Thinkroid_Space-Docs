# Containers & Code Execution

## What are Containers?

When agents need to run code, they do it inside containers — isolated environments that are completely separate from your main system. Think of a container as a temporary, disposable computer that only exists for the duration of a task. Whatever happens inside it stays inside it.

This means an agent can run Python scripts, compile code, process data, or spin up a web server without any risk of accidentally modifying your files or breaking anything on your machine.

---

## Temporary Containers

A temporary container is spun up, runs a command, returns the output, and then disappears. It's the right choice for one-off jobs where you just need a result.

Common use cases:

- Running a Python or Node script on a dataset
- Compiling a program and checking for errors
- Processing or transforming files (converting formats, resizing images, etc.)
- Running a test suite against a piece of code
- Quickly checking what a command outputs in a clean environment

Temporary containers are fast to start and automatically cleaned up — there's nothing to manage afterward.

---

## Service Containers

Service containers are different — they stay running. You use them when you need something that persists, like a web server, a database, or a background worker.

An agent can deploy a service container and then interact with it over time: querying the database, hitting API endpoints, checking status. You can also expose service containers on a local port if you want to access them from your browser.

Service containers keep running until you explicitly stop or remove them.

---

## Container Panel

The Container Panel gives you a live view of everything that's running. For each container you can see:

- Its name and which agent created it
- Current status (running, stopped, exited)
- Resource usage (CPU and memory)
- Full logs — everything the container has printed to its output

From the panel you can stop a running container, restart a stopped one, or remove it entirely. If a container is behaving unexpectedly, the logs are the first place to look.

---

## Resource Limits

To prevent a runaway process from consuming all your system resources, each agent has configurable limits:

- **CPU quota** — Maximum share of CPU the agent's containers can use
- **Memory cap** — Maximum RAM any single container can allocate
- **Container count** — Maximum number of containers the agent can have running at once

If an agent hits its limit, new container requests will be queued or rejected until resources free up. You can adjust these limits per agent in Agent Settings.

---

## Workspace Files

Each agent has a workspace — a dedicated folder for their files. When a container is started, that agent's workspace is automatically available inside the container. Agents can read input files from their workspace and write results back to it, making it easy to pass data between tasks without any manual file management.

---

## Shell Execution

Agents can also run shell commands directly on the host system, outside of a container. This is a more powerful option that gives access to your actual environment.

Because of that power, shell execution always requires your explicit approval before it runs. You'll see the exact command in the Approval Queue before anything happens. You can review it, and approve or deny. Nothing runs until you say so.

If you find yourself approving the same kinds of shell commands frequently, you can configure trusted patterns in Settings to allow them automatically.
