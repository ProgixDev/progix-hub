/* progixHub — App shell + root router */

function App() {
  const [auth, setAuth] = React.useState("out");           // 'out' | 'in'
  const [view, setView] = React.useState("projects");       // projects | create | detail | feedback
  const [projectId, setProjectId] = React.useState(null);
  const [tab, setTab] = React.useState("env");
  const [editing, setEditing] = React.useState(false);
  const [projects, setProjects] = React.useState(window.PROJECTS);
  const [toasts, setToasts] = React.useState([]);
  const [cmdk, setCmdk] = React.useState(false);
  const [prevView, setPrevView] = React.useState("projects"); // for returning from client demo

  const toast = React.useCallback((msg, type) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2200);
  }, []);

  const project = projects.find((p) => p.id === projectId);

  const openProject = (id) => { setProjectId(id); setTab("env"); setEditing(false); setView("detail"); };
  const goProjects = () => { setView("projects"); setProjectId(null); };
  const newProject = () => { setEditing(false); setView("create"); };
  const openClient = (id) => { setPrevView(view); setView("feedback"); };

  // global keyboard: cmd/ctrl+K, and "n" for new when on projects
  React.useEffect(() => {
    if (auth !== "in") return;
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdk((o) => !o); }
      else if (e.key === "n" && !cmdk && view === "projects" && !isTyping(e)) { e.preventDefault(); newProject(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [auth, cmdk, view]);

  if (auth === "out") return (<>
    <SignIn onSignedIn={() => { setAuth("in"); setView("projects"); }} />
    <ToastHost toasts={toasts} />
  </>);

  if (view === "feedback") return (<>
    <ClientFeedback onExitDemo={() => setView(prevView === "feedback" ? "projects" : prevView)} />
    <ToastHost toasts={toasts} />
  </>);

  const saveProject = (data) => {
    if (editing && project) {
      setProjects((ps) => ps.map((p) => p.id === project.id ? {
        ...p, name: data.name, desc: data.desc, code: data.code,
        surfaces: { notion: strip(data.links.notion), slack: strip(data.links.slack), github: strip(data.links.github), live: strip(data.links.live) },
      } : p));
      toast("Project updated"); setView("detail");
    } else {
      const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 16) + "-" + Math.floor(Math.random() * 99);
      const np = {
        id, name: data.name, code: data.code, desc: data.desc || "No description yet.",
        status: "active", accent: "#4C82FB", updated: "just now", members: ["AR"],
        surfaces: { notion: strip(data.links.notion), slack: strip(data.links.slack), github: strip(data.links.github), live: strip(data.links.live) },
        envCount: 0, docCount: 0, feedbackCount: 0, openFeedback: 0,
      };
      setProjects((ps) => [np, ...ps]);
      toast("Project created", "copy");
      setProjectId(id); setTab("env"); setView("detail");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar projects={projects} active={view === "detail" ? projectId : view} onProjects={goProjects} onNew={newProject} onOpenProject={openProject} onCmdk={() => setCmdk(true)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar view={view} project={project} onCmdk={() => setCmdk(true)} onSignOut={() => { setAuth("out"); setView("projects"); }} toast={toast} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {view === "projects" && <ProjectsList projects={projects} onOpen={openProject} onNew={newProject} toast={toast} />}
          {view === "create" && <CreateProject existing={editing ? project : null} onCancel={() => setView(editing ? "detail" : "projects")} onSave={saveProject} toast={toast} />}
          {view === "detail" && project && <ProjectDetail project={project} tab={tab} onTab={setTab} onBack={goProjects} onEdit={() => { setEditing(true); setView("create"); }} toast={toast} onOpenClient={openClient} />}
        </div>
      </div>

      <CommandMenu open={cmdk} onClose={() => setCmdk(false)} projects={projects}
        actions={{ newProject, goProjects, openProject, openClient, signOut: () => setAuth("out") }} />
      <ToastHost toasts={toasts} />
    </div>
  );
}

function Sidebar({ projects, active, onProjects, onNew, onOpenProject, onCmdk }) {
  const recent = projects.slice(0, 5);
  return (
    <aside style={{ width: 240, flex: "none", background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "16px 12px" }}>
      <div style={{ padding: "4px 8px 14px" }}><Wordmark size={16} /></div>

      <button className="btn btn-sm" onClick={onCmdk} style={{ justifyContent: "space-between", marginBottom: 14, background: "var(--bg-inset)", color: "var(--text-2)" }}>
        <span className="row gap-8"><Icon.search />Search…</span>
        <span className="row gap-3"><span className="kbd">⌘</span><span className="kbd">K</span></span>
      </button>

      <nav className="col gap-2">
        <NavItem icon={<Icon.grid />} label="Projects" active={active === "projects" || active === "create"} onClick={onProjects} />
        <NavItem icon={<Icon.settings />} label="Settings" muted />
      </nav>

      <div className="t-eyebrow" style={{ padding: "20px 10px 8px", fontSize: 10 }}>Recent</div>
      <nav className="col gap-1" style={{ overflow: "auto", flex: 1 }}>
        {recent.map((p) => (
          <button key={p.id} onClick={() => onOpenProject(p.id)} className="row gap-9 nav-proj"
            style={{ padding: "7px 9px", borderRadius: "var(--r-sm)", border: "none", background: active === p.id ? "var(--bg-2)" : "transparent", color: active === p.id ? "var(--text)" : "var(--text-1)", textAlign: "left", width: "100%" }}>
            <span style={{ width: 20, height: 20, borderRadius: 5, flex: "none", background: `linear-gradient(150deg,${p.accent},${window.shade(p.accent, -26)})`, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.code}</span>
            <span className="truncate" style={{ fontSize: 13, flex: 1 }}>{p.name}</span>
            <span className={`dot ${window.STATUS_META[p.status].dot}`} style={{ width: 6, height: 6, borderRadius: 99 }}></span>
          </button>
        ))}
      </nav>

      <button className="btn btn-primary btn-sm" onClick={onNew} style={{ justifyContent: "center", marginTop: 12 }}><Icon.plus />New project</button>
    </aside>
  );
}

function NavItem({ icon, label, active, muted, onClick }) {
  return (
    <button onClick={onClick} disabled={muted} className="row gap-10"
      style={{ padding: "8px 10px", borderRadius: "var(--r-sm)", border: "none", width: "100%", textAlign: "left",
        background: active ? "var(--blue-tint)" : "transparent",
        color: active ? "var(--blue-text)" : muted ? "var(--text-3)" : "var(--text-1)", fontSize: 13.5, fontWeight: 500,
        cursor: muted ? "default" : "pointer", transition: "background .12s" }}>
      <span style={{ display: "flex", width: 18 }}>{icon}</span>{label}
      {muted && <span className="grow"></span>}
      {muted && <span className="t-micro" style={{ color: "var(--text-3)" }}>soon</span>}
    </button>
  );
}

function Topbar({ view, project, onCmdk, onSignOut, toast }) {
  const [menu, setMenu] = React.useState(false);
  const title = view === "projects" ? "Projects" : view === "create" ? "New project" : project ? project.name : "";
  return (
    <header style={{ height: 56, flex: "none", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 20px", gap: 14, background: "rgba(10,13,22,0.7)", backdropFilter: "blur(8px)", position: "relative", zIndex: 5 }}>
      <div className="row gap-9 t-small" style={{ color: "var(--text-2)", flex: "none", minWidth: 0 }}>
        <Icon.grid />
        <span style={{ color: "var(--text)", fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      </div>
      <div className="grow"></div>
      <button className="btn btn-sm btn-ghost" onClick={onCmdk}><Icon.command />Commands</button>
      <button className="btn-icon" onClick={() => toast("All caught up")} title="Notifications"><Icon.clock /></button>
      <div style={{ position: "relative" }}>
        <button onClick={() => setMenu((m) => !m)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}><Avatar id="AR" size={32} ring={menu ? "var(--border-blue)" : "transparent"} /></button>
        {menu && (<>
          <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setMenu(false)}></div>
          <div className="card fade-in" style={{ position: "absolute", top: 42, right: 0, width: 210, padding: 6, zIndex: 10, boxShadow: "var(--shadow-pop)" }}>
            <div className="row gap-10" style={{ padding: "9px 10px" }}>
              <Avatar id="AR" size={34} />
              <div className="col" style={{ gap: 1 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Amara Reyes</span><span className="t-micro mono">amara@progix.io</span></div>
            </div>
            <div className="divider" style={{ margin: "5px 0" }}></div>
            <MenuRow icon={<Icon.user />} label="Account" onClick={() => { setMenu(false); toast("Account settings"); }} />
            <MenuRow icon={<Icon.settings />} label="Preferences" onClick={() => { setMenu(false); toast("Preferences"); }} />
            <div className="divider" style={{ margin: "5px 0" }}></div>
            <MenuRow icon={<Icon.logout />} label="Sign out" onClick={onSignOut} />
          </div>
        </>)}
      </div>
    </header>
  );
}

function MenuRow({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="row gap-10 menu-row" style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--r-sm)", border: "none", background: "transparent", color: "var(--text-1)", fontSize: 13, textAlign: "left" }}>
      <span style={{ display: "flex", width: 16, color: "var(--text-2)" }}>{icon}</span>{label}
    </button>
  );
}

function ToastHost({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.type === "copy" ? <span className="ic-ok"><Icon.check /></span> : t.type === "info" ? <Icon.info /> : <span className="ic-ok"><Icon.checkCircle /></span>}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function isTyping(e) { const t = e.target; return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable); }
function strip(url) { if (!url) return ""; return url.replace(/^https?:\/\//, "").replace(/\/$/, ""); }

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
