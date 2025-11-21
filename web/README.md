# Atlas Desktop Orchestrator

Atlas Desktop Orchestrator is a web-based control deck for planning and managing personal desktop automations. Capture the software you rely on, draft natural-language intents, promote them into reusable workflows, and keep an execution queue in sync while you work.

## Key Capabilities

- **Command console** – Describe tasks in natural language and receive an immediately runnable playbook tailored to your tools.
- **Software inventory** – Catalog each desktop application, launch command, and operating notes so the agent always knows what to use.
- **Automation queue** – Track in-flight jobs, cycle their status as you work, and turn frequently-used runs into workflows with a single click.
- **Workflow library** – Store reusable runbooks with cadence notes for fast recall and sharing.
- **Integration checklist** – Follow best practices for wiring the UI to local scripts, voice macros, or shortcut triggers.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to explore the dashboard. Changes in `app/page.tsx` update automatically.

## Production Build

Create an optimized production bundle:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run start
```

## Deploying

The project is optimized for Vercel. Deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-090b4aec
```

After the deployment finishes, verify the production URL:

```bash
curl https://agentic-090b4aec.vercel.app
```

## Customization Tips

- Seed the software library with every app the agent should control, including launch scripts or CLI triggers.
- Use the automation queue to test-drive a new flow; once it feels right, promote it into the workflow library.
- Pair the web dashboard with a lightweight local listener (AppleScript, PowerShell, AutoHotkey, or Shortcuts) for hands-free automation.
