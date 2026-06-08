/* progixHub — Env vars (the signature secure moment) */

function EnvVars({ projectId, toast }) {
  const seed = (window.ENV_VARS || {})[projectId] || [];
  const [vars, setVars] = React.useState(seed);
  const [revealed, setRevealed] = React.useState({});  // id -> true
  const [copiedId, setCopiedId] = React.useState(null);
  const [editing, setEditing] = React.useState(null);   // var obj or {new:true}
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [q, setQ] = React.useState("");

  React.useEffect(() => { setVars((window.ENV_VARS || {})[projectId] || []); setRevealed({}); }, [projectId]);

  const anyRevealed = Object.values(revealed).some(Boolean);
  const filtered = vars.filter((v) => !q || v.key.toLowerCase().includes(q.toLowerCase()));

  const toggle = (id) => setRevealed((r) => ({ ...r, [id]: !r[id] }));
  const revealAll = () => { if (anyRevealed) setRevealed({}); else { const all = {}; vars.forEach((v) => (all[v.id] = true)); setRevealed(all); } };
  const copy = (v) => {
    navigator.clipboard && navigator.clipboard.writeText(v.value).catch(() => {});
    setCopiedId(v.id); setTimeout(() => setCopiedId((c) => (c === v.id ? null : c)), 1400);
    toast("Copied to clipboard", "copy");
  };
  const saveVar = (data) => {
    if (editing && editing.id) {
      setVars((vs) => vs.map((v) => (v.id === editing.id ? { ...v, ...data, updated: "just now" } : v)));
      toast("Variable updated");
    } else {
      const id = "n" + Date.now();
      setVars((vs) => [{ id, updated: "just now", ...data }, ...vs]);
      setRevealed((r) => ({ ...r, [id]: false }));
      toast("Variable added", "copy");
    }
    setEditing(null);
  };
  const del = (v) => { setVars((vs) => vs.filter((x) => x.id !== v.id)); toast("Variable deleted"); };

  return (
    <div className="fade-in">
      {/* security banner */}
      <div className="row gap-12" style={{ padding: "12px 15px", background: "var(--blue-deep)", border: "1px solid var(--border-blue)", borderRadius: "var(--r)", marginBottom: 16 }}>
        <span style={{ color: "var(--blue-text)", display: "flex" }}><Icon.shield /></span>
        <div className="col" style={{ gap: 1 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)" }}>Values are masked by default</span>
          <span className="t-micro">Reveal is a deliberate, per-row action. Access is limited to signed-in Progix members.</span>
        </div>
        <div className="grow"></div>
        <span className="badge badge-blue badge-mono"><Icon.lock /> Encrypted at rest</span>
      </div>

      {vars.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<Icon.key />} title="No environment variables yet"
            text="Store the keys, tokens and connection strings this project needs. Values are encrypted and masked — revealed only when someone deliberately asks."
            action={<button className="btn btn-primary" onClick={() => setEditing({ new: true })}><Icon.plus />Add variable</button>} />
        </div>
      ) : (<>
        {/* toolbar */}
        <div className="row gap-12" style={{ marginBottom: 14 }}>
          <div className="search" style={{ flex: "1 1 220px", maxWidth: 300 }}>
            <Icon.search /><input placeholder="Filter keys…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="grow"></div>
          <button className="btn btn-sm" onClick={revealAll}>
            {anyRevealed ? <Icon.eyeOff /> : <Icon.eye />}{anyRevealed ? "Hide all" : "Reveal all"}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setEditing({ new: true })}><Icon.plus />Add variable</button>
        </div>

        <div className="panel" style={{ overflow: "hidden" }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ width: "30%" }}>Key</th>
              <th>Value</th>
              <th style={{ width: 132 }}>Scope</th>
              <th style={{ width: 120, textAlign: "right" }}>Updated</th>
              <th style={{ width: 116 }}></th>
            </tr></thead>
            <tbody>
              {filtered.map((v) => (
                <EnvRow key={v.id} v={v} revealed={!!revealed[v.id]} copied={copiedId === v.id}
                  onToggle={() => toggle(v.id)} onCopy={() => copy(v)} onEdit={() => setEditing(v)} onDelete={() => setConfirmDel(v)} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center" }} className="t-small">No keys match "{q}".</div>}
        </div>
        <div className="row gap-8 t-micro" style={{ marginTop: 12, color: "var(--text-3)" }}>
          <Icon.info /> {vars.length} variable{vars.length !== 1 ? "s" : ""} · last change synced 2h ago
        </div>
      </>)}

      {editing && <EnvEditor existing={editing.id ? editing : null} onClose={() => setEditing(null)} onSave={saveVar} />}
      {confirmDel && <Confirm title="Delete variable?" danger confirmLabel="Delete"
        body={<>This removes <span className="mono" style={{ color: "var(--text)" }}>{confirmDel.key}</span> from this project. Any service using it will lose access. This can't be undone.</>}
        onConfirm={() => del(confirmDel)} onClose={() => setConfirmDel(null)} />}
    </div>
  );
}

function EnvRow({ v, revealed, copied, onToggle, onCopy, onEdit, onDelete }) {
  return (
    <tr style={revealed ? { background: "rgba(224,165,59,0.05)" } : null}>
      <td style={{ position: "relative" }}>
        {revealed && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2.5, borderRadius: 2, background: "var(--amber)" }}></span>}
        <span className="mono" style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{v.key}</span>
      </td>
      <td>
        <div className="row gap-10" style={{ padding: "9px 0" }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            {revealed ? (
              <span className="mono reveal-val" style={{ fontSize: 12.5, color: "var(--text)", wordBreak: "break-all", lineHeight: 1.4 }}>{v.value}</span>
            ) : (
              <span className="row gap-8" style={{ color: "var(--text-3)" }}>
                <Icon.lock />
                <span className="mono" style={{ letterSpacing: 3, fontSize: 14, userSelect: "none" }}>••••••••••••</span>
              </span>
            )}
          </div>
          {revealed && <span className="badge badge-amber" style={{ height: 19, fontSize: 10, flex: "none" }}><span className="dot dot-amber"></span>Revealed</span>}
        </div>
      </td>
      <td><ScopeBadge scope={v.scope} /></td>
      <td style={{ textAlign: "right" }}><span className="t-micro" style={{ color: "var(--text-3)" }}>{v.updated}</span></td>
      <td>
        <div className="row gap-4 env-actions" style={{ justifyContent: "flex-end" }}>
          <button className="btn-icon sm" onClick={onToggle} title={revealed ? "Hide value" : "Reveal value"} aria-label="Reveal">
            {revealed ? <Icon.eyeOff /> : <Icon.eye />}
          </button>
          <button className="btn-icon sm" onClick={onCopy} title="Copy value" aria-label="Copy"
            style={copied ? { color: "var(--green)" } : null}>
            {copied ? <Icon.check /> : <Icon.copy />}
          </button>
          <button className="btn-icon sm" onClick={onEdit} title="Edit" aria-label="Edit"><Icon.edit /></button>
          <button className="btn-icon sm hover-danger" onClick={onDelete} title="Delete" aria-label="Delete"><Icon.trash /></button>
        </div>
      </td>
    </tr>
  );
}

function EnvEditor({ existing, onClose, onSave }) {
  const [key, setKey] = React.useState(existing ? existing.key : "");
  const [value, setValue] = React.useState(existing ? existing.value : "");
  const [scope, setScope] = React.useState(existing ? existing.scope : "production");
  const [show, setShow] = React.useState(!existing);
  const keyOk = /^[A-Z][A-Z0-9_]*$/.test(key);
  const canSave = keyOk && value.trim().length > 0;

  return (
    <Modal title={existing ? "Edit variable" : "Add variable"} onClose={onClose} width={520}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ key: key.trim(), value: value.trim(), scope })}>
          {existing ? "Save changes" : "Add variable"}
        </button>
      </>}>
      <div className="col gap-16">
        <div className="field">
          <label className="label" htmlFor="ek">Key</label>
          <input id="ek" className={`input mono ${key && !keyOk ? "invalid" : key ? "valid" : ""}`} placeholder="STRIPE_SECRET_KEY"
            value={key} onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))} autoFocus={!existing} spellCheck={false} />
          {key && !keyOk ? <span className="hint err">Use UPPER_SNAKE_CASE starting with a letter.</span> : <span className="hint">Uppercase letters, numbers and underscores.</span>}
        </div>
        <div className="field">
          <label className="label" htmlFor="ev">Value</label>
          <div className="input-wrap">
            <input id="ev" className="input mono" type={show ? "text" : "password"} style={{ paddingRight: 40 }}
              placeholder="sk_live_…" value={value} onChange={(e) => setValue(e.target.value)} spellCheck={false} />
            <button className="btn-icon sm" onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 4 }} aria-label="Toggle">
              {show ? <Icon.eyeOff /> : <Icon.eye />}
            </button>
          </div>
          <span className="hint row gap-6"><Icon.lock /> Encrypted before it's stored. Only shown when revealed.</span>
        </div>
        <div className="field">
          <label className="label">Scope</label>
          <div className="row gap-8">
            {["production", "preview", "development"].map((s) => (
              <button key={s} onClick={() => setScope(s)} className="row gap-8"
                style={{ flex: 1, height: 38, justifyContent: "center", borderRadius: "var(--r-sm)", fontSize: 12.5, fontWeight: 500,
                  border: `1px solid ${scope === s ? "var(--border-blue)" : "var(--border-1)"}`,
                  background: scope === s ? "var(--blue-tint)" : "var(--bg-2)",
                  color: scope === s ? "var(--blue-text)" : "var(--text-1)", transition: "all .14s var(--ease)" }}>
                {scope === s && <Icon.check />}{window.SCOPE_META[s].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { EnvVars });
