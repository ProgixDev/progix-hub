/* progixHub — Projects portfolio (list, search/filter, empty, loading) */

function ProjectsList({ projects, onOpen, onNew, toast }) {
  const [view, setView] = React.useState("grid");
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => { const t = setTimeout(() => setLoading(false), 850); return () => clearTimeout(t); }, []);

  const counts = React.useMemo(() => {
    const c = { all: projects.length, active: 0, "at-risk": 0, archived: 0 };
    projects.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [projects]);

  const filtered = projects.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false;
    if (q && !(p.name.toLowerCase().includes(q.toLowerCase()) || p.desc.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const filterTabs = [
    { v: "all", label: "All" },
    { v: "active", label: "Active" },
    { v: "at-risk", label: "At risk" },
    { v: "archived", label: "Archived" },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1180, margin: "0 auto", padding: "30px 34px 60px" }}>
      {/* Page header */}
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div className="col" style={{ gap: 6 }}>
          <span className="t-eyebrow">Portfolio</span>
          <h1 className="t-h1" style={{ margin: 0 }}>Projects</h1>
        </div>
        <button className="btn btn-primary" onClick={onNew}><Icon.plus />New project</button>
      </div>

      {/* Controls */}
      <div className="row gap-12" style={{ marginBottom: 18, flexWrap: "wrap" }}>
        <div className="search" style={{ flex: "1 1 260px", maxWidth: 360 }}>
          <Icon.search />
          <input placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="row" style={{ gap: 2, background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: 3 }}>
          {filterTabs.map((t) => (
            <button key={t.v} onClick={() => setFilter(t.v)} className="row gap-6"
              style={{ height: 28, padding: "0 11px", borderRadius: 5, border: "none", fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap",
                background: filter === t.v ? "var(--bg-3)" : "transparent",
                color: filter === t.v ? "var(--text)" : "var(--text-2)", transition: "all .14s var(--ease)" }}>
              {t.label}
              <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: filter === t.v ? "var(--blue-text)" : "var(--text-3)" }}>{counts[t.v] || 0}</span>
            </button>
          ))}
        </div>
        <div className="grow"></div>
        <Segmented value={view} onChange={setView} options={[
          { value: "grid", icon: <Icon.grid /> }, { value: "rows", icon: <Icon.rows /> },
        ]} />
      </div>

      {/* Body */}
      {loading ? (
        <SkeletonGrid view={view} />
      ) : filtered.length === 0 ? (
        q || filter !== "all"
          ? <NoResults q={q} onClear={() => { setQ(""); setFilter("all"); }} />
          : <ProjectsEmpty onNew={onNew} />
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(338px, 1fr))", gap: 16 }}>
          {filtered.map((p) => <ProjectCard key={p.id} p={p} onOpen={onOpen} toast={toast} />)}
        </div>
      ) : (
        <div className="panel" style={{ overflow: "hidden" }}>
          {filtered.map((p, i) => <ProjectRow key={p.id} p={p} onOpen={onOpen} toast={toast} last={i === filtered.length - 1} />)}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p, onOpen, toast }) {
  return (
    <div className="card card-hover" style={{ padding: 18, cursor: "pointer", display: "flex", flexDirection: "column" }}
      onClick={() => onOpen(p.id)} tabIndex={0} role="button"
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(p.id); }}>
      <div className="row gap-12" style={{ marginBottom: 13 }}>
        <ProjectMark p={p} size={40} />
        <div className="col grow" style={{ gap: 4, minWidth: 0 }}>
          <span className="t-h3 truncate">{p.name}</span>
          <StatusBadge status={p.status} />
        </div>
        <button className="btn-icon sm" onClick={(e) => { e.stopPropagation(); toast("Project menu"); }} aria-label="Menu"><Icon.dots /></button>
      </div>
      <p className="t-small" style={{ margin: 0, lineHeight: 1.5, minHeight: 38 }}>{p.desc}</p>

      <div className="row gap-8" style={{ margin: "15px 0 14px" }}>
        {["notion", "slack", "github"].map((k) => (
          <div key={k} className="surf-mini" title={k} onClick={(e) => { e.stopPropagation(); toast(`Opening ${k} ↗`); }}
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--border-1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .14s, transform .12s" }}>
            <div style={{ width: 18, height: 18 }}>{k === "notion" ? <Brand.notion /> : k === "slack" ? <Brand.slack /> : <Brand.github />}</div>
          </div>
        ))}
        {p.surfaces.live && (
          <div className="surf-mini" title="live" onClick={(e) => { e.stopPropagation(); toast("Opening live ↗"); }}
            style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--border-1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <div style={{ width: 17, height: 17 }}><Brand.live /></div>
          </div>
        )}
      </div>

      <div className="divider" style={{ marginBottom: 13 }}></div>

      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row gap-12">
          <span className="row gap-6 t-micro" title="Environment variables"><Icon.key /> {p.envCount}</span>
          <span className="row gap-6 t-micro" title="Documents"><Icon.fileText /> {p.docCount}</span>
          {p.openFeedback > 0 && <span className="badge badge-blue" style={{ height: 19, fontSize: 10.5 }}>{p.openFeedback} new</span>}
        </div>
        <AvatarStack ids={p.members} size={24} max={4} />
      </div>
    </div>
  );
}

function ProjectRow({ p, onOpen, toast, last }) {
  return (
    <div className="proj-row row gap-14" onClick={() => onOpen(p.id)} tabIndex={0} role="button"
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(p.id); }}
      style={{ padding: "13px 18px", borderBottom: last ? "none" : "1px solid var(--border)", cursor: "pointer", transition: "background .12s" }}>
      <ProjectMark p={p} size={36} />
      <div className="col" style={{ gap: 3, width: 230, minWidth: 0 }}>
        <span className="t-h3 truncate">{p.name}</span>
        <span className="t-micro truncate">{p.desc}</span>
      </div>
      <div style={{ width: 104 }}><StatusBadge status={p.status} /></div>
      <div className="row gap-6">
        {["notion", "slack", "github"].map((k) => (
          <div key={k} style={{ width: 26, height: 26, borderRadius: 7, background: "var(--bg-2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 15, height: 15 }}>{k === "notion" ? <Brand.notion /> : k === "slack" ? <Brand.slack /> : <Brand.github />}</div>
          </div>
        ))}
      </div>
      <div className="grow"></div>
      <span className="row gap-6 t-micro none"><Icon.key /> {p.envCount}</span>
      <span className="row gap-6 t-micro none" style={{ width: 44 }}><Icon.fileText /> {p.docCount}</span>
      <span className="t-micro none" style={{ width: 92, textAlign: "right", color: "var(--text-3)" }}>{p.updated}</span>
      <AvatarStack ids={p.members} size={22} max={3} />
    </div>
  );
}

function ProjectMark({ p, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.26, flex: "none",
      background: `linear-gradient(150deg, ${p.accent}, ${shade(p.accent, -26)})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 700, fontSize: size * 0.32, letterSpacing: "-0.02em",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)" }}>{p.code}</div>
  );
}

function ProjectsEmpty({ onNew }) {
  return (
    <div className="panel" style={{ marginTop: 6 }}>
      <EmptyState icon={<Icon.grid />} title="No projects yet"
        text="A project is the home base for everything you build — its Notion, Slack, GitHub, documents and secrets in one place. Create your first to get started."
        action={<button className="btn btn-primary" onClick={onNew}><Icon.plus />New project</button>} />
    </div>
  );
}

function NoResults({ q, onClear }) {
  return (
    <div className="panel" style={{ marginTop: 6 }}>
      <EmptyState icon={<Icon.search />} title="No matching projects"
        text={q ? `Nothing matches "${q}". Try a different search or clear your filters.` : "No projects match the current filter."}
        action={<button className="btn" onClick={onClear}>Clear filters</button>} />
    </div>
  );
}

function SkeletonGrid({ view }) {
  if (view === "rows") {
    return (
      <div className="panel" style={{ overflow: "hidden" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="row gap-14" style={{ padding: "14px 18px", borderBottom: i === 4 ? "none" : "1px solid var(--border)" }}>
            <div className="skel" style={{ width: 36, height: 36, borderRadius: 9 }}></div>
            <div className="col gap-6" style={{ width: 230 }}><div className="skel" style={{ width: "70%", height: 12 }}></div><div className="skel" style={{ width: "95%", height: 9 }}></div></div>
            <div className="skel" style={{ width: 80, height: 20, borderRadius: 99 }}></div>
            <div className="grow"></div>
            <div className="skel" style={{ width: 90, height: 10 }}></div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(338px, 1fr))", gap: 16 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card" style={{ padding: 18 }}>
          <div className="row gap-12" style={{ marginBottom: 14 }}>
            <div className="skel" style={{ width: 40, height: 40, borderRadius: 11 }}></div>
            <div className="col gap-6 grow"><div className="skel" style={{ width: "60%", height: 13 }}></div><div className="skel" style={{ width: 70, height: 18, borderRadius: 99 }}></div></div>
          </div>
          <div className="skel" style={{ width: "100%", height: 10, marginBottom: 7 }}></div>
          <div className="skel" style={{ width: "80%", height: 10 }}></div>
          <div className="row gap-8" style={{ marginTop: 16 }}>
            {[0, 1, 2].map((j) => <div key={j} className="skel" style={{ width: 32, height: 32, borderRadius: 8 }}></div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { ProjectsList, ProjectCard, ProjectMark });
