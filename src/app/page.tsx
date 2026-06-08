import { AppShell, type RecentProject } from "@/components/app-shell/app-shell";
import { GitHubGlyph, LiveGlyph, NotionGlyph, SlackGlyph } from "@/components/brand/surface-glyphs";
import { PlusIcon } from "@/components/ui/icons";
import { StatusBadge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Projects portfolio — the app home. Painted-door: data is static placeholder until
 * the project-creation feature wires Supabase (see docs/product/prd.md scope #1).
 */

type Status = "Active" | "At risk" | "Archived";

type DemoProject = {
  id: string;
  name: string;
  initials: string;
  avatar: string; // tailwind gradient classes
  status: Status;
  description: string;
  surfaces: Array<"notion" | "slack" | "github" | "live">;
  envs: number;
  docs: number;
  hasNew?: boolean;
};

const STATUS_TONE: Record<Status, NonNullable<BadgeProps["tone"]>> = {
  Active: "green",
  "At risk": "amber",
  Archived: "neutral",
};

const PROJECTS: DemoProject[] = [
  {
    id: "atlas",
    name: "Atlas Commerce",
    initials: "ATL",
    avatar: "from-[#3b6fe6] to-[#4c82fb]",
    status: "Active",
    description: "Headless storefront + checkout for the Atlas retail group.",
    surfaces: ["notion", "slack", "github", "live"],
    envs: 8,
    docs: 7,
    hasNew: true,
  },
  {
    id: "halo",
    name: "Halo Identity",
    initials: "HAL",
    avatar: "from-[#1f9d6b] to-[#3fb97f]",
    status: "Active",
    description: "Passwordless auth & SSO service for internal Progix products.",
    surfaces: ["notion", "slack", "github", "live"],
    envs: 0,
    docs: 1,
  },
  {
    id: "drift",
    name: "Drift Analytics",
    initials: "DRF",
    avatar: "from-[#c98a2b] to-[#e0a53b]",
    status: "At risk",
    description: "Event pipeline and dashboards for product telemetry.",
    surfaces: ["notion", "slack", "github"],
    envs: 3,
    docs: 0,
  },
  {
    id: "ember",
    name: "Ember Mobile",
    initials: "EMB",
    avatar: "from-[#d8543a] to-[#f0613b]",
    status: "Active",
    description: "React Native client for the Ember field-service app.",
    surfaces: ["notion", "slack", "github"],
    envs: 5,
    docs: 2,
    hasNew: true,
  },
  {
    id: "northwind",
    name: "Northwind CMS",
    initials: "NRT",
    avatar: "from-[#4a5469] to-[#6b7488]",
    status: "Archived",
    description: "Content platform migration for the Northwind editorial team.",
    surfaces: ["notion", "slack", "github", "live"],
    envs: 2,
    docs: 1,
  },
];

const RECENT: RecentProject[] = [
  { id: "atlas", name: "Atlas Commerce", initials: "AT", tone: "green" },
  { id: "halo", name: "Halo Identity", initials: "HA", tone: "green" },
  { id: "drift", name: "Drift Analytics", initials: "DR", tone: "amber" },
  { id: "ember", name: "Ember Mobile", initials: "EM", tone: "green" },
  { id: "northwind", name: "Northwind CMS", initials: "NR", tone: "neutral" },
];

const FILTERS: Array<{ label: string; count: number; active?: boolean }> = [
  { label: "All", count: 5, active: true },
  { label: "Active", count: 3 },
  { label: "At risk", count: 1 },
  { label: "Archived", count: 1 },
];

function SurfaceChip({ kind }: { kind: DemoProject["surfaces"][number] }) {
  const glyph = {
    notion: <NotionGlyph size={15} />,
    slack: <SlackGlyph size={15} />,
    github: <GitHubGlyph size={15} />,
    live: <LiveGlyph size={15} />,
  }[kind];
  return (
    <span className="bg-bg-2 border-line-1 flex size-7 items-center justify-center rounded-md border">
      {glyph}
    </span>
  );
}

function ProjectCard({ project }: { project: DemoProject }) {
  return (
    <article className="bg-card border-line hover:border-line-strong rounded-xl border p-4 transition-colors">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-9 flex-none items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-semibold text-white",
            project.avatar,
          )}
        >
          {project.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-text truncate text-[15px] font-semibold">{project.name}</h2>
          <StatusBadge tone={STATUS_TONE[project.status]} className="mt-1">
            {project.status}
          </StatusBadge>
        </div>
      </div>

      <p className="text-text-2 mt-3 line-clamp-2 text-[13px]">{project.description}</p>

      <div className="mt-3 flex items-center gap-2">
        {project.surfaces.map((s) => (
          <SurfaceChip key={s} kind={s} />
        ))}
      </div>

      <div className="border-line text-text-2 mt-4 flex items-center gap-3 border-t pt-3 font-mono text-[11px]">
        <span>⚿ {project.envs}</span>
        <span>▤ {project.docs}</span>
        {project.hasNew && (
          <StatusBadge tone="blue" className="h-[18px] px-2 text-[10px]">
            1 new
          </StatusBadge>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <AppShell title="Projects" recent={RECENT}>
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="t-eyebrow">Portfolio</p>
            <h1 className="text-text mt-1 text-[26px] font-semibold tracking-tight">Projects</h1>
          </div>
          <button
            type="button"
            className="bg-blue text-primary-foreground hover:bg-blue-hover flex h-9 items-center gap-2 rounded-md px-3.5 text-[13.5px] font-medium shadow-[0_6px_18px_rgba(76,130,251,0.28)] transition-colors"
          >
            <PlusIcon className="size-4" />
            New project
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="border-line-1 bg-bg-inset flex h-9 min-w-64 flex-1 items-center rounded-md border px-3">
            <input
              type="search"
              placeholder="Search projects…"
              aria-label="Search projects"
              className="placeholder:text-text-3 w-full bg-transparent text-[13.5px] outline-none"
            />
          </div>
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium transition-colors",
                  f.active ? "bg-bg-2 text-text" : "text-text-2 hover:bg-bg-2 hover:text-text",
                )}
              >
                {f.label}
                <span className="text-text-3 font-mono text-[11px]">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
