/* progixHub — ⌘K command palette */

function CommandMenu({ open, onClose, projects, actions }) {
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current && inputRef.current.focus(), 30); } }, [open]);

  const commands = React.useMemo(() => {
    const cmds = [
      { id: "new", group: "Actions", label: "Create new project", icon: <Icon.plus />, kbd: "N", run: actions.newProject },
      { id: "projects", group: "Actions", label: "Go to all projects", icon: <Icon.grid />, run: actions.goProjects },
      { id: "client", group: "Actions", label: "Open client feedback page", icon: <Icon.external />, run: () => actions.openClient() },
      { id: "signout", group: "Actions", label: "Sign out", icon: <Icon.logout />, run: actions.signOut },
    ];
    projects.forEach((p) => cmds.push({
      id: "p-" + p.id, group: "Projects", label: p.name, sub: p.code, status: p.status,
      icon: <div style={{ width: 18, height: 18, borderRadius: 5, background: `linear-gradient(150deg,${p.accent},${window.shade(p.accent, -26)})`, color: "#fff", fontSize: 8.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.code}</div>,
      run: () => actions.openProject(p.id),
    }));
    return cmds;
  }, [projects, actions]);

  const filtered = commands.filter((c) => !q || c.label.toLowerCase().includes(q.toLowerCase()) || (c.sub && c.sub.toLowerCase().includes(q.toLowerCase())));
  const groups = filtered.reduce((acc, c) => { (acc[c.group] = acc[c.group] || []).push(c); return acc; }, {});
  const flat = filtered;

  React.useEffect(() => { setSel(0); }, [q]);
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "Escape") { onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, flat.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); const c = flat[sel]; if (c) { onClose(); c.run(); } }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, flat, sel, onClose]);

  if (!open) return null;
  let idx = -1;
  return (
    <div className="overlay" style={{ paddingTop: "12vh", alignItems: "flex-start" }} onMouseDown={onClose}>
      <div className="cmdk fade-in" onMouseDown={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 580, background: "var(--bg-1)", border: "1px solid var(--border-1)", borderRadius: "var(--r-lg)", boxShadow: "var(--shadow-pop)", overflow: "hidden" }}>
        <div className="row gap-10" style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-2)", display: "flex" }}><Icon.search /></span>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects or run a command…"
            style={{ flex: 1, border: "none", background: "none", outline: "none", color: "var(--text)", fontSize: 15 }} />
          <span className="kbd">ESC</span>
        </div>
        <div style={{ maxHeight: 380, overflow: "auto", padding: 8 }}>
          {flat.length === 0 && <div style={{ padding: 28, textAlign: "center" }} className="t-small">No results for "{q}"</div>}
          {Object.keys(groups).map((g) => (
            <div key={g} style={{ marginBottom: 6 }}>
              <div className="t-eyebrow" style={{ padding: "8px 10px 5px", fontSize: 10 }}>{g}</div>
              {groups[g].map((c) => {
                idx++; const active = idx === sel; const myIdx = idx;
                return (
                  <button key={c.id} onMouseEnter={() => setSel(myIdx)} onClick={() => { onClose(); c.run(); }}
                    className="row gap-11" style={{ width: "100%", textAlign: "left", padding: "9px 10px", borderRadius: "var(--r-sm)", border: "none",
                      background: active ? "var(--blue-tint)" : "transparent", color: active ? "var(--text)" : "var(--text-1)", transition: "background .1s" }}>
                    <span style={{ display: "flex", color: active ? "var(--blue-text)" : "var(--text-2)", width: 18 }}>{c.icon}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap" }}>{c.label}</span>
                    {c.sub && <span className="t-micro mono">{c.sub}</span>}
                    {c.status && <span style={{ marginLeft: 2 }}><StatusBadge status={c.status} /></span>}
                    <span className="grow"></span>
                    {c.kbd && <span className="kbd">{c.kbd}</span>}
                    {active && <span style={{ color: "var(--blue-text)", display: "flex" }}><Icon.arrowRight /></span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="row gap-14" style={{ padding: "9px 14px", borderTop: "1px solid var(--border)", color: "var(--text-3)", fontSize: 11 }}>
          <span className="row gap-6"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="row gap-6"><span className="kbd">↵</span> select</span>
          <span className="grow"></span>
          <span className="row gap-6"><Wordmark size={12} /></span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CommandMenu });
