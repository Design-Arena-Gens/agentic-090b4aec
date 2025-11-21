"use client";

import { useEffect, useMemo, useState } from "react";

type Software = {
  id: string;
  name: string;
  category: string;
  description: string;
  launchCommand: string;
  pinned?: boolean;
};

type PlanStep = {
  id: string;
  title: string;
  detail: string;
  softwareId?: string;
};

type Workflow = {
  id: string;
  title: string;
  intent: string;
  cadence: string;
  steps: PlanStep[];
};

type CommandJob = {
  id: string;
  command: string;
  createdAt: string;
  status: "pending" | "in-progress" | "done";
  plan: PlanStep[];
};

type Scenario = {
  id: string;
  keywords: string[];
  steps: Array<{
    title: string;
    detail: string;
    software?: string;
  }>;
};

const STORAGE_KEYS = {
  software: "atlas-desktop-software",
  workflows: "atlas-desktop-workflows",
};

const defaultSoftware: Software[] = [
  {
    id: "notion",
    name: "Notion",
    category: "Documentation",
    description: "Project wiki, daily journals, and quick capture database.",
    launchCommand: "open -a Notion",
    pinned: true,
  },
  {
    id: "vscode",
    name: "Visual Studio Code",
    category: "Development",
    description: "Primary code editor with project-specific profiles and tasks.",
    launchCommand: "code",
    pinned: true,
  },
  {
    id: "figma",
    name: "Figma",
    category: "Design",
    description: "Interface design, prototyping, and asset export workflows.",
    launchCommand: "open -a Figma",
  },
  {
    id: "arc",
    name: "Arc Browser",
    category: "Research",
    description: "Browser spaces for docs, dashboards, and experimentation.",
    launchCommand: "open -a Arc",
  },
  {
    id: "obsidian",
    name: "Obsidian",
    category: "Knowledge Base",
    description: "Local knowledge graph and long-form archival notes.",
    launchCommand: "open -a Obsidian",
  },
];

const defaultWorkflows: Workflow[] = [
  {
    id: "daily-standup",
    title: "Daily Standup Prep",
    intent: "Summarize yesterday, plan today, and surface blockers.",
    cadence: "Weekdays · 08:45",
    steps: [
      {
        id: "standup-1",
        title: "Capture quick notes",
        detail: "Open Notion daily journal and drop bullet list of wins, blockers, and focus.",
        softwareId: "notion",
      },
      {
        id: "standup-2",
        title: "Review task board",
        detail: "Check the sprint board in Linear and flag anything needing support.",
      },
      {
        id: "standup-3",
        title: "Draft update snippet",
        detail: "Use VS Code snippets to produce Slack-ready status update.",
        softwareId: "vscode",
      },
    ],
  },
  {
    id: "design-refresh",
    title: "Design Refresh Loop",
    intent: "Prepare assets, sync comments, and export deliverables for a design iteration.",
    cadence: "As needed",
    steps: [
      {
        id: "design-1",
        title: "Sync prototype",
        detail: "Open Figma file, accept comments, and snapshot current frames.",
        softwareId: "figma",
      },
      {
        id: "design-2",
        title: "Update documentation",
        detail: "Log decisions in Notion design log and link latest prototype.",
        softwareId: "notion",
      },
      {
        id: "design-3",
        title: "Automate export",
        detail: "Run VS Code task `npm run export:figma` to push production assets.",
        softwareId: "vscode",
      },
    ],
  },
  {
    id: "research-sprint",
    title: "Research Sprint",
    intent: "Collect references, cluster findings, and draft insights.",
    cadence: "Weekly",
    steps: [
      {
        id: "research-1",
        title: "Capture sources",
        detail: "Use Arc split view to collect tabs and auto-organize by topic.",
        softwareId: "arc",
      },
      {
        id: "research-2",
        title: "Synthesize notes",
        detail: "Transfer highlights into Obsidian canvas and map connections.",
        softwareId: "obsidian",
      },
      {
        id: "research-3",
        title: "Publish recap",
        detail: "Drop summary into Notion research hub and assign follow-ups.",
        softwareId: "notion",
      },
    ],
  },
];

const statusLabel: Record<CommandJob["status"], string> = {
  pending: "Queued",
  "in-progress": "Running",
  done: "Completed",
};

const statusStyle: Record<CommandJob["status"], string> = {
  pending: "bg-slate-800/70 text-slate-200 border border-slate-700/60",
  "in-progress": "bg-sky-500/20 text-sky-200 border border-sky-400/30",
  done: "bg-emerald-500/10 text-emerald-200 border border-emerald-400/30",
};

const keywordScenarios: Scenario[] = [
  {
    id: "sync",
    keywords: ["sync", "align", "status"],
    steps: [
      {
        title: "Check comms",
        detail: "Scan inbox and chat for new context before automating any updates.",
      },
      {
        title: "Prep summary",
        detail: "Draft summary bullets and confirm wording before broadcasting updates.",
      },
    ],
  },
  {
    id: "design",
    keywords: ["design", "mockup", "prototype", "figma"],
    steps: [
      {
        title: "Launch design workspace",
        detail: "Collect latest comments and open shared libraries inside Figma space.",
        software: "figma",
      },
      {
        title: "Sync specs",
        detail: "Update implementation notes in Notion or VS Code workspace.",
      },
    ],
  },
  {
    id: "deploy",
    keywords: ["deploy", "release", "ship", "build"],
    steps: [
      {
        title: "Run verification",
        detail: "Execute test suite locally and confirm green checks before deployment.",
        software: "vscode",
      },
      {
        title: "Create release notes",
        detail: "Assemble concise change log and QA check list for stakeholders.",
      },
    ],
  },
  {
    id: "research",
    keywords: ["research", "investigate", "analysis", "insights"],
    steps: [
      {
        title: "Open research stack",
        detail: "Arrange Arc spaces with search queries and reference dashboards.",
        software: "arc",
      },
      {
        title: "Capture findings",
        detail: "Log key insights in Obsidian vault and tag follow-up questions.",
        software: "obsidian",
      },
    ],
  },
  {
    id: "meeting",
    keywords: ["meeting", "call", "recording", "notes"],
    steps: [
      {
        title: "Prep agenda",
        detail: "Pull latest agenda doc and confirm talking points.",
        software: "notion",
      },
      {
        title: "Launch capture tools",
        detail: "Ready recorder, screen share, and note-taking template before joining.",
      },
    ],
  },
];

const uid = () => Math.random().toString(36).slice(2, 9);

const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getNextStatus = (status: CommandJob["status"]): CommandJob["status"] => {
  switch (status) {
    case "pending":
      return "in-progress";
    case "in-progress":
      return "done";
    default:
      return "pending";
  }
};

const filterMatchingWorkflows = (query: string, workflows: Workflow[]) => {
  const lower = query.toLowerCase();
  return workflows.filter((workflow) => {
    const haystack = `${workflow.title} ${workflow.intent}`.toLowerCase();
    return lower.split(/\s+/).some((token) => token && haystack.includes(token));
  });
};

const includeSoftwareMatches = (query: string, software: Software[]): PlanStep[] => {
  const lower = query.toLowerCase();
  const matches = software.filter((app) => {
    const haystack = `${app.name} ${app.category} ${app.description}`.toLowerCase();
    return haystack.includes(lower) || lower.includes(app.name.toLowerCase());
  });

  return matches.slice(0, 4).map((app) => ({
    id: uid(),
    title: `Launch ${app.name}`,
    detail: app.launchCommand
      ? `Run "${app.launchCommand}" from your terminal or launcher.`
      : `Trigger ${app.name} using your preferred app launcher.`,
    softwareId: app.id,
  }));
};

const buildPlan = (
  command: string,
  software: Software[],
  workflows: Workflow[],
): PlanStep[] => {
  const trimmed = command.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLowerCase();
  const steps: PlanStep[] = [];

  keywordScenarios.forEach((scenario) => {
    if (scenario.keywords.some((keyword) => lower.includes(keyword))) {
      scenario.steps.forEach((step) => {
        steps.push({
          id: uid(),
          title: step.title,
          detail: step.detail,
          softwareId: step.software,
        });
      });
    }
  });

  const workflowMatches = filterMatchingWorkflows(lower, workflows);
  if (workflowMatches.length > 0) {
    steps.push({
      id: uid(),
      title: `Reference workflow: ${workflowMatches[0].title}`,
      detail: workflowMatches[0].steps
        .map((step, index) => `${index + 1}. ${step.title}`)
        .join(" · "),
      softwareId: workflowMatches[0].steps[0]?.softwareId,
    });
  }

  steps.push(...includeSoftwareMatches(lower, software));

  if (!steps.length) {
    steps.push(
      {
        id: uid(),
        title: "Clarify outcome",
        detail: "Break the request into 2-3 bullet goals so the desktop agent can prioritize.",
      },
      {
        id: uid(),
        title: "Select tools",
        detail: "Decide which installed applications best match the task and prepare launch commands.",
      },
      {
        id: uid(),
        title: "Confirm automation window",
        detail: "Block focus time and ensure prerequisite services are signed in before executing steps.",
      },
    );
  }

  return steps.slice(0, 6);
};

export default function Home() {
  const loadInitialSoftware = (): Software[] => {
    if (typeof window === "undefined") return defaultSoftware;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.software);
      if (!stored) return defaultSoftware;
      const parsed = JSON.parse(stored) as Software[];
      return parsed.length ? parsed : defaultSoftware;
    } catch (error) {
      console.warn("Failed to parse software cache", error);
      return defaultSoftware;
    }
  };

  const loadInitialWorkflows = (): Workflow[] => {
    if (typeof window === "undefined") return defaultWorkflows;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.workflows);
      if (!stored) return defaultWorkflows;
      const parsed = JSON.parse(stored) as Workflow[];
      return parsed.length ? parsed : defaultWorkflows;
    } catch (error) {
      console.warn("Failed to parse workflow cache", error);
      return defaultWorkflows;
    }
  };

  const [software, setSoftware] = useState<Software[]>(loadInitialSoftware);
  const [workflows, setWorkflows] = useState<Workflow[]>(loadInitialWorkflows);
  const [softwareDraft, setSoftwareDraft] = useState({
    name: "",
    category: "Automation",
    launchCommand: "",
    description: "",
  });
  const [commandInput, setCommandInput] = useState("");
  const [automationQueue, setAutomationQueue] = useState<CommandJob[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.software, JSON.stringify(software));
  }, [software]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.workflows, JSON.stringify(workflows));
  }, [workflows]);

  const planPreview = useMemo(
    () => buildPlan(commandInput, software, workflows),
    [commandInput, software, workflows],
  );

  const pinnedSoftware = useMemo(
    () => software.filter((entry) => entry.pinned),
    [software],
  );

  const handleSoftwareSubmit = () => {
    const name = softwareDraft.name.trim();
    if (!name) return;

    const payload: Software = {
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + uid(),
      name,
      category: softwareDraft.category.trim() || "Automation",
      description:
        softwareDraft.description.trim() ||
        "Add notes so the agent understands how to use this tool.",
      launchCommand: softwareDraft.launchCommand.trim(),
    };

    setSoftware((current) => [payload, ...current]);
    setSoftwareDraft({ name: "", category: "Automation", launchCommand: "", description: "" });
  };

  const handleQueueCommit = () => {
    const trimmed = commandInput.trim();
    if (!trimmed) return;

    const plan = buildPlan(trimmed, software, workflows);
    const job: CommandJob = {
      id: uid(),
      command: trimmed,
      createdAt: new Date().toISOString(),
      status: "pending",
      plan,
    };

    setAutomationQueue((current) => [job, ...current]);
    setCommandInput("");
  };

  const handleStatusCycle = (jobId: string) => {
    setAutomationQueue((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: getNextStatus(job.status),
            }
          : job,
      ),
    );
  };

  const handlePromoteToWorkflow = (job: CommandJob) => {
    const title = job.command
      .split(" ")
      .slice(0, 4)
      .join(" ")
      .replace(/^[a-z]/, (match) => match.toUpperCase());

    const workflow: Workflow = {
      id: `workflow-${uid()}`,
      title: title || "Custom Automation",
      intent: job.command,
      cadence: "On demand",
      steps: job.plan.length
        ? job.plan
        : [
            {
              id: uid(),
              title: "Document desired outcome",
              detail: "Describe the goal, constraints, and success criteria.",
            },
          ],
    };

    setWorkflows((current) => [workflow, ...current]);
  };

  return (
    <main className="min-h-screen w-full pb-24">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 pt-12 lg:px-10">
        <header className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-8 backdrop-blur">
            <span className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
              Atlas Control Deck
            </span>
            <h1 className="mt-4 text-4xl font-semibold text-slate-50 lg:text-5xl">
              Orchestrate your desktop with a command-driven personal agent.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-6 text-slate-300">
              Draft intents, map them to the tools you already use, and turn them into
              reusable workflows the moment inspiration strikes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              {pinnedSoftware.map((app) => (
                <span
                  key={app.id}
                  className="rounded-full border border-slate-700/80 bg-slate-800/60 px-4 py-1"
                >
                  {app.name}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                Next focus block
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-50">
                Capture high-impact command, ship faster.
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Use the command console to describe what you want done. Atlas turns it into
                a runbook you can execute or promote into a reusable workflow.
              </p>
            </div>
            <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40 p-6 backdrop-blur">
              <h3 className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">
                Quick Start
              </h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>1. Add every desktop app the agent should know about.</li>
                <li>2. Describe your next task in the command console.</li>
                <li>3. Cycle job status as you work and promote frequent flows.</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <article className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-8 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
                  Command console
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">
                  Tell the agent what to handle next.
                </h2>
              </div>
              <button
                onClick={handleQueueCommit}
                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
              >
                Queue plan
              </button>
            </div>
            <textarea
              value={commandInput}
              onChange={(event) => setCommandInput(event.target.value)}
              placeholder="Example: prepare weekly design sync by compiling feedback, exporting assets, and emailing recap"
              className="mt-6 h-36 w-full rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4 text-base text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            />
            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
                Suggested runbook
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {planPreview.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-100">{step.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-300">
                      {step.detail}
                    </p>
                    {step.softwareId && (
                      <span className="mt-3 inline-flex rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-200">
                        {software.find((app) => app.id === step.softwareId)?.name || "Custom"}
                      </span>
                    )}
                  </div>
                ))}
                {!planPreview.length && (
                  <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/30 p-4 text-sm text-slate-400">
                    Draft an intent above to see suggestions.
                  </div>
                )}
              </div>
            </div>
          </article>

          <aside className="grid gap-6">
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
                Add desktop tool
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={softwareDraft.name}
                  onChange={(event) =>
                    setSoftwareDraft((draft) => ({ ...draft, name: event.target.value }))
                  }
                  placeholder="Application name"
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                />
                <input
                  value={softwareDraft.category}
                  onChange={(event) =>
                    setSoftwareDraft((draft) => ({ ...draft, category: event.target.value }))
                  }
                  placeholder="Category (e.g. Automation, Design)"
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                />
                <input
                  value={softwareDraft.launchCommand}
                  onChange={(event) =>
                    setSoftwareDraft((draft) => ({ ...draft, launchCommand: event.target.value }))
                  }
                  placeholder="Launch command or automation shortcut"
                  className="w-full rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                />
                <textarea
                  value={softwareDraft.description}
                  onChange={(event) =>
                    setSoftwareDraft((draft) => ({ ...draft, description: event.target.value }))
                  }
                  placeholder="How should the agent use this tool?"
                  className="h-24 w-full rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
              <button
                onClick={handleSoftwareSubmit}
                className="mt-4 w-full rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
              >
                Save tool
              </button>
            </div>

            <div className="rounded-3xl border border-slate-700/60 bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent p-6 text-sm text-indigo-100">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                Voice macro tip
              </h3>
              <p className="mt-3 leading-relaxed">
                Pair this dashboard with a local voice trigger (e.g. macOS Shortcuts,
                AutoHotkey) that calls a small script posting your command to the console.
                Atlas will keep the plan in sync so you can follow along visually.
              </p>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-8 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
                  Workflow library
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-50">
                  Promote repeatable flows into shareable playbooks.
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-950/40 p-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                      {workflow.cadence}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-100">
                      {workflow.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">{workflow.intent}</p>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-200">
                    {workflow.steps.map((step) => (
                      <li
                        key={step.id}
                        className="rounded-xl border border-slate-800/60 bg-slate-900/50 px-3 py-2"
                      >
                        <p className="font-medium">{step.title}</p>
                        <p className="text-xs text-slate-400">{step.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {!workflows.length && (
                <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/40 p-6 text-sm text-slate-400">
                  Queue a command and elevate it to your workflow library.
                </div>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                Automation queue
              </p>
              <div className="mt-4 space-y-3">
                {automationQueue.map((job) => (
                  <div
                    key={job.id}
                    className="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-950/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                          {formatTime(job.createdAt)}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-100">
                          {job.command}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleStatusCycle(job.id)}
                        className={`${statusStyle[job.status]} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition`}
                      >
                        {statusLabel[job.status]}
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {job.plan.map((step) => (
                        <li key={step.id} className="rounded-xl bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                          {step.title}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => handlePromoteToWorkflow(job)}
                      className="w-full rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
                    >
                      Promote to workflow
                    </button>
                  </div>
                ))}
                {!automationQueue.length && (
                  <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-950/30 p-6 text-sm text-slate-400">
                    Queue a command to begin your automation runbook.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-700/60 bg-slate-900/70 p-6 backdrop-blur">
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                Desktop integration checklist
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>
                  <span className="font-semibold text-slate-100">1. Local relay script:</span> Use
                  a small Node or Python bridge to watch Atlas webhooks and trigger commands
                  through AppleScript, PowerShell, or AutoHotkey.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">2. Secure credentials:</span>
                  Store launcher secrets in your OS keychain and expose only the minimal
                  automation endpoints.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">3. Safety gates:</span> Require
                  confirmation for destructive actions and keep a manual override hotkey
                  ready.
                </li>
                <li>
                  <span className="font-semibold text-slate-100">4. Audit trail:</span> Log every
                  automated step back into Notion or Obsidian so future runs can be
                  improved.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
