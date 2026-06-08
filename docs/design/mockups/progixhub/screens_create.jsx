/* progixHub — Create / edit project (paste links, validation, previews) */

const LINK_SPEC = {
  notion: { name: "Notion", glyph: <Brand.notion />, ph: "https://notion.so/atlas-overview", match: /notion\.(so|site)\//i, hint: "Paste the project's Notion page" },
  slack:  { name: "Slack",  glyph: <Brand.slack />,  ph: "https://progix.slack.com/archives/C04…", match: /slack\.com\//i, hint: "Paste the project's Slack channel" },
  github: { name: "GitHub", glyph: <Brand.github />, ph: "https://github.com/progix/atlas-commerce", match: /github\.com\//i, hint: "Paste the project's repository" },
  live:   { name: "Live URL", glyph: <Brand.live />, ph: "https://atlas.shop", match: /^https?:\/\/.+\..+/i, hint: "Production or staging URL", optional: true },
};

function CreateProject({ existing, onCancel, onSave, toast }) {
  const isEdit = !!existing;
  const [name, setName] = React.useState(existing ? existing.name : "");
  const [desc, setDesc] = React.useState(existing ? existing.desc : "");
  const [links, setLinks] = React.useState({
    notion: existing ? hostify("notion", existing.surfaces.notion) : "",
    slack: existing ? hostify("slack", existing.surfaces.slack) : "",
    github: existing ? hostify("github", existing.surfaces.github) : "",
    live: existing && existing.surfaces.live ? "https://" + existing.surfaces.live : "",
  });
  const [saving, setSaving] = React.useState(false);
  const [touched, setTouched] = React.useState({});

  const code = (name.trim().slice(0, 3) || "—").toUpperCase();
  const linkState = (k) => {
    const v = links[k].trim();
    if (!v) return "empty";
    return LINK_SPEC[k].match.test(v) ? "valid" : "invalid";
  };
  const nameOk = name.trim().length >= 2;
  const requiredLinksOk = ["notion", "slack", "github"].every((k) => linkState(k) === "valid");
  const noInvalid = Object.keys(LINK_SPEC).every((k) => linkState(k) !== "invalid");
  const canSave = nameOk && requiredLinksOk && noInvalid;

  const save = () => {
    if (!canSave) { setTouched({ name: true, notion: true, slack: true, github: true, live: true }); return; }
    setSaving(true);
    setTimeout(() => { onSave({ name: name.trim(), desc: desc.trim(), code, links }); }, 800);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: "0 auto", padding: "30px 28px 70px" }}>
      <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginBottom: 18 }}>← Back to projects</button>

      <div className="row gap-14" style={{ marginBottom: 4 }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, flex: "none",
          background: nameOk ? "linear-gradient(150deg,#4C82FB,#2a5bd0)" : "var(--bg-2)",
          border: nameOk ? "none" : "1px dashed var(--border-strong)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: nameOk ? "#fff" : "var(--text-3)", fontWeight: 700, fontSize: 16, transition: "all .2s var(--ease)" }}>{code}</div>
        <div className="col" style={{ gap: 4 }}>
          <h1 className="t-h1" style={{ margin: 0 }}>{isEdit ? "Edit project" : "New project"}</h1>
          <span className="t-small">{isEdit ? "Update details and surface links." : "Name it, then paste its surfaces. You can change everything later."}</span>
        </div>
      </div>

      <div className="panel" style={{ padding: 22, marginTop: 22, display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="field">
          <label className="label" htmlFor="pname">Project name</label>
          <input id="pname" className="input" placeholder="e.g. Atlas Commerce" value={name}
            onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} autoFocus />
          {touched.name && !nameOk && <span className="hint err">Give the project a name (2+ characters).</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="pdesc">Description <span className="opt">optional</span></label>
          <input id="pdesc" className="input" placeholder="One line on what this project is." value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div className="divider"></div>

        <div className="col" style={{ gap: 5 }}>
          <span className="t-h3">Surfaces</span>
          <span className="t-small">Paste each link. progixHub keeps them one click away — it doesn't sync their contents.</span>
        </div>

        {Object.keys(LINK_SPEC).map((k) => (
          <LinkField key={k} k={k} spec={LINK_SPEC[k]} value={links[k]} state={linkState(k)}
            touched={touched[k]}
            onChange={(v) => setLinks((l) => ({ ...l, [k]: v }))}
            onBlur={() => setTouched((t) => ({ ...t, [k]: true }))} />
        ))}
      </div>

      <div className="row" style={{ justifyContent: "space-between", marginTop: 20 }}>
        <span className="t-micro row gap-6"><Icon.shield /> Links are visible to Progix team members only.</span>
        <div className="row gap-10">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ minWidth: 132, justifyContent: "center" }}>
            {saving ? <div className="spinner"></div> : isEdit ? <Icon.check /> : <Icon.plus />}
            {isEdit ? "Save changes" : "Create project"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LinkField({ k, spec, value, state, touched, onChange, onBlur }) {
  const showErr = touched && state === "invalid";
  return (
    <div className="field">
      <label className="label">
        <span style={{ width: 18, height: 18, display: "inline-flex" }}>{spec.glyph}</span>
        {spec.name} {spec.optional && <span className="opt">optional</span>}
      </label>
      <div className="input-wrap">
        <input className={`input mono ${showErr ? "invalid" : state === "valid" ? "valid" : ""}`} style={{ paddingRight: 40 }}
          placeholder={spec.ph} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} spellCheck={false} />
        {state === "valid" && <span style={{ position: "absolute", right: 12, color: "var(--green)", display: "flex" }}><Icon.checkCircle /></span>}
        {showErr && <span style={{ position: "absolute", right: 12, color: "var(--red)", display: "flex" }}><Icon.alert /></span>}
      </div>
      {showErr ? (
        <span className="hint err">That doesn't look like a {spec.name} link. Expected something like {spec.ph}</span>
      ) : state === "valid" ? (
        <LinkPreview k={k} value={value} />
      ) : (
        <span className="hint">{spec.hint}</span>
      )}
    </div>
  );
}

function LinkPreview({ k, value }) {
  const spec = LINK_SPEC[k];
  let path = value.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="fade-in row gap-10" style={{ marginTop: 2, padding: "9px 11px", background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: "var(--r-sm)" }}>
      <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{spec.glyph}</div>
      <div className="col" style={{ gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{spec.name} linked</span>
        <span className="t-micro mono truncate" style={{ maxWidth: 420 }}>{path}</span>
      </div>
      <div className="grow"></div>
      <span className="badge badge-green" style={{ height: 20 }}><Icon.check /> Valid</span>
    </div>
  );
}

function hostify(k, v) {
  if (!v) return "";
  const base = { notion: "https://notion.so/", slack: "https://progix.slack.com/archives/", github: "https://github.com/" }[k] || "https://";
  return base + v.replace(/^#/, "");
}

Object.assign(window, { CreateProject });
