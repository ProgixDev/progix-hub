/* progixHub — Project detail (header + surfaces + tabs) */

function ProjectDetail({ project, tab, onTab, onBack, onEdit, toast, onOpenClient }) {
  const p = project;
  const tabs = [
    { v: "env", label: "Env vars", icon: <Icon.key />, count: p.envCount },
    { v: "docs", label: "Documents", icon: <Icon.fileText />, count: p.docCount },
    { v: "feedback", label: "Feedback", icon: <Icon.star />, count: p.feedbackCount },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 34px 70px" }}>
      {/* breadcrumb */}
      <div className="row gap-8" style={{ marginBottom: 18 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ paddingLeft: 8 }}>← Projects</button>
        <span className="t-micro" style={{ color: "var(--text-3)" }}>/</span>
        <span className="t-micro mono" style={{ color: "var(--text-2)" }}>{p.code}</span>
      </div>

      {/* header */}
      <div className="row gap-16" style={{ alignItems: "flex-start", marginBottom: 22 }}>
        <ProjectMark p={p} size={56} />
        <div className="col grow" style={{ gap: 8, minWidth: 0 }}>
          <div className="row gap-12" style={{ flexWrap: "wrap" }}>
            <h1 className="t-h1" style={{ margin: 0 }}>{p.name}</h1>
            <StatusBadge status={p.status} />
          </div>
          <p className="t-body" style={{ margin: 0, color: "var(--text-2)" }}>{p.desc}</p>
          <div className="row gap-14" style={{ marginTop: 3 }}>
            <span className="t-micro row gap-6" style={{ color: "var(--text-3)" }}><Icon.clock /> Updated {p.updated}</span>
            <AvatarStack ids={p.members} size={22} max={5} />
          </div>
        </div>
        <div className="row gap-8 none">
          <button className="btn btn-sm" onClick={() => { onOpenClient(p.id); }}><Icon.external />Client link</button>
          <button className="btn btn-sm" onClick={onEdit}><Icon.edit />Edit</button>
        </div>
      </div>

      {/* surfaces */}
      <div className="surfaces-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 11, marginBottom: 26 }}>
        <SurfaceLink kind="notion" value={p.surfaces.notion} onToast={toast} />
        <SurfaceLink kind="slack" value={p.surfaces.slack} onToast={toast} />
        <SurfaceLink kind="github" value={p.surfaces.github} onToast={toast} />
        <SurfaceLink kind="live" value={p.surfaces.live} onToast={toast} />
      </div>

      {/* tabs */}
      <div className="tabs" style={{ marginBottom: 22 }}>
        {tabs.map((t) => (
          <button key={t.v} className={`tab ${tab === t.v ? "active" : ""}`} onClick={() => onTab(t.v)}>
            {t.icon}{t.label}<span className="count">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "env" && <EnvVars projectId={p.id} toast={toast} />}
      {tab === "docs" && <Documents projectId={p.id} toast={toast} />}
      {tab === "feedback" && <FeedbackTab projectId={p.id} toast={toast} onOpenClient={() => onOpenClient(p.id)} />}
    </div>
  );
}

function FeedbackTab({ projectId, toast, onOpenClient }) {
  const seed = (window.FEEDBACK || {})[projectId] || [];
  const [items, setItems] = React.useState(seed);
  React.useEffect(() => { setItems((window.FEEDBACK || {})[projectId] || []); }, [projectId]);

  const avg = items.length ? (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(1) : "—";

  const copyLink = () => { navigator.clipboard && navigator.clipboard.writeText("https://progixhub.io/c/atlas-7fa3"); toast("Client link copied", "copy"); };

  if (items.length === 0) {
    return (
      <div className="fade-in panel">
        <EmptyState icon={<Icon.star />} title="No feedback yet"
          text="Share a link-gated page where the client can leave a rating and a message — no account, no access to anything else. Their responses show up here."
          action={<div className="row gap-10"><button className="btn" onClick={copyLink}><Icon.copy />Copy client link</button><button className="btn btn-primary" onClick={onOpenClient}><Icon.external />Preview page</button></div>} />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="row gap-12" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <div className="panel row gap-14" style={{ padding: "12px 16px", alignItems: "center" }}>
          <div className="col" style={{ gap: 1 }}>
            <span className="t-h1" style={{ fontSize: 24, margin: 0 }}>{avg}</span>
            <Stars value={Math.round(avg)} size={13} />
          </div>
          <div className="divider" style={{ width: 1, height: 34, background: "var(--border)" }}></div>
          <div className="col" style={{ gap: 1 }}>
            <span className="t-h3">{items.length}</span>
            <span className="t-micro">response{items.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="grow"></div>
        <button className="btn btn-sm" onClick={copyLink}><Icon.copy />Copy client link</button>
        <button className="btn btn-sm" onClick={onOpenClient}><Icon.external />Preview page</button>
      </div>

      <div className="col gap-12">
        {items.map((f) => (
          <div key={f.id} className="card" style={{ padding: 16 }}>
            <div className="row gap-12" style={{ marginBottom: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", flex: "none", background: "var(--bg-3)", border: "1px solid var(--border-1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{f.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</div>
              <div className="col grow" style={{ gap: 1 }}>
                <div className="row gap-8"><span style={{ fontSize: 13.5, fontWeight: 600 }}>{f.name}</span>{f.status === "open" && <span className="badge badge-blue" style={{ height: 18, fontSize: 10 }}>New</span>}</div>
                <span className="t-micro">{f.org}</span>
              </div>
              <div className="col none" style={{ alignItems: "flex-end", gap: 3 }}>
                <Stars value={f.rating} size={13} />
                <span className="t-micro" style={{ color: "var(--text-3)" }}>{f.date}</span>
              </div>
            </div>
            <p className="t-body" style={{ margin: 0, lineHeight: 1.6, color: "var(--text-1)" }}>{f.msg}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stars({ value, size = 16, onPick }) {
  return (
    <div className="row gap-3" role={onPick ? "radiogroup" : undefined}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} onClick={onPick ? () => onPick(i) : undefined}
          style={{ width: size, height: size, color: i <= value ? "var(--amber)" : "var(--text-3)", display: "flex", cursor: onPick ? "pointer" : "default", transition: "transform .1s" }}>
          <svg viewBox="0 0 24 24" fill={i <= value ? "var(--amber)" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" /></svg>
        </span>
      ))}
    </div>
  );
}

Object.assign(window, { ProjectDetail, Stars });
