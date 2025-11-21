# Agentic Desktop Orchestrator

This repository contains a Next.js application that delivers a web-based control deck for planning and supervising personal desktop automations. The full source code lives in the `web/` directory.

## Project Layout

- `web/` – Next.js + Tailwind app with the command console, software library, workflow planner, and automation queue.
- `web/.vercel/` – Deployment metadata created automatically by the Vercel CLI after running `vercel deploy`.

## Quick Start

1. Install dependencies:
   ```bash
   cd web
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to use the dashboard.

## Production Build & Deploy

```bash
cd web
npm run build
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-090b4aec
curl https://agentic-090b4aec.vercel.app
```

## Live Deployment

- Production URL: https://agentic-090b4aec.vercel.app

## Notes

- The UI helps you describe intents, map them to installed software, and promote routines into reusable workflows.
- Wire the web client to local scripts (AppleScript, PowerShell, AutoHotkey, Shortcuts, etc.) to execute commands on your desktop.
