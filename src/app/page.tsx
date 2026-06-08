import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="text-muted-foreground font-mono text-sm">progixHub</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          The home base for every Progix project.
        </h1>
        <p className="text-muted-foreground max-w-prose">
          Create a project, link its Notion, Slack, and GitHub, and keep its environment variables
          and documents in one secured place. It’s to Progix projects what GitHub is to repos.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>One home per project</CardTitle>
            <CardDescription>
              The four surfaces — Notion explains, GitHub tracks, Slack coordinates, the repo
              enforces — linked from one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Projects, env vars, and documents, behind secured login.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operating model</CardTitle>
            <CardDescription>
              How work flows here: ground, plan, implement, verify, encode.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground font-mono text-sm">
            AGENTS.md · docs/INDEX.md · specs/
          </CardContent>
        </Card>
      </div>

      <footer className="text-muted-foreground text-sm">
        Run <code className="font-mono">pnpm verify</code> before every PR — it is the same gate CI
        runs.
      </footer>
    </main>
  );
}
