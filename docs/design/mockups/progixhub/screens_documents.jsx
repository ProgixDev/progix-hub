/* progixHub — Documents (files, links, notes) */

function Documents({ projectId, toast }) {
  const seed = (window.DOCUMENTS || {})[projectId] || [];
  const [docs, setDocs] = React.useState(seed);
  const [filter, setFilter] = React.useState("all");
  const [drag, setDrag] = React.useState(false);
  const [uploading, setUploading] = React.useState(null);
  const [noteEdit, setNoteEdit] = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [addLink, setAddLink] = React.useState(false);

  React.useEffect(() => { setDocs((window.DOCUMENTS || {})[projectId] || []); }, [projectId]);

  const tabs = [
    { v: "all", label: "All", n: docs.length },
    { v: "file", label: "Files", n: docs.filter((d) => d.kind === "file").length },
    { v: "link", label: "Links", n: docs.filter((d) => d.kind === "link").length },
    { v: "note", label: "Notes", n: docs.filter((d) => d.kind === "note").length },
  ];
  const shown = docs.filter((d) => filter === "all" || d.kind === filter);

  const simulateUpload = (fname) => {
    const name = fname || "design-handoff-v2.fig";
    setUploading({ name, pct: 0 });
    let pct = 0;
    const iv = setInterval(() => {
      pct += Math.random() * 26 + 10;
      if (pct >= 100) {
        clearInterval(iv);
        setUploading(null);
        setDocs((d) => [{ id: "u" + Date.now(), kind: "file", name, meta: "FIG · 2.1 MB", by: "AR", date: "just now" }, ...d]);
        toast("File uploaded", "copy");
      } else setUploading({ name, pct });
    }, 240);
  };
  const saveNote = (data) => {
    if (noteEdit && noteEdit.id) {
      setDocs((d) => d.map((x) => (x.id === noteEdit.id ? { ...x, ...data, date: "just now" } : x)));
      toast("Note saved");
    } else {
      setDocs((d) => [{ id: "n" + Date.now(), kind: "note", by: "AR", date: "just now", meta: "Edited by AR", ...data }, ...d]);
      toast("Note created");
    }
    setNoteEdit(null);
  };
  const saveLink = (data) => {
    setDocs((d) => [{ id: "l" + Date.now(), kind: "link", by: "AR", date: "just now", ...data }, ...d]);
    setAddLink(false); toast("Link added");
  };
  const del = (doc) => { setDocs((d) => d.filter((x) => x.id !== doc.id)); toast("Removed"); };

  return (
    <div className="fade-in">
      {/* toolbar */}
      <div className="row gap-12" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <div className="row" style={{ gap: 2, background: "var(--bg-1)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: 3 }}>
          {tabs.map((t) => (
            <button key={t.v} onClick={() => setFilter(t.v)} className="row gap-6"
              style={{ height: 28, padding: "0 11px", borderRadius: 5, border: "none", fontSize: 12.5, fontWeight: 500,
                background: filter === t.v ? "var(--bg-3)" : "transparent", color: filter === t.v ? "var(--text)" : "var(--text-2)" }}>
              {t.label}<span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--text-3)" }}>{t.n}</span>
            </button>
          ))}
        </div>
        <div className="grow"></div>
        <button className="btn btn-sm" onClick={() => setAddLink(true)}><Icon.link />Add link</button>
        <button className="btn btn-sm" onClick={() => setNoteEdit({ new: true })}><Icon.note />New note</button>
        <button className="btn btn-primary btn-sm" onClick={() => simulateUpload()}><Icon.upload />Upload</button>
      </div>

      {/* dropzone */}
      <div className={`dropzone ${drag ? "drag" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; simulateUpload(f ? f.name : null); }}
        onClick={() => simulateUpload()}
        style={{ marginBottom: 18 }}>
        {uploading ? (
          <div className="col" style={{ gap: 9, width: "100%", maxWidth: 340 }}>
            <div className="row gap-8 t-small"><Icon.file /> <span className="mono truncate">{uploading.name}</span><span className="grow"></span><span className="mono" style={{ color: "var(--blue-text)" }}>{Math.round(uploading.pct)}%</span></div>
            <div style={{ height: 5, background: "var(--bg-3)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: uploading.pct + "%", background: "var(--blue)", borderRadius: 99, transition: "width .2s" }}></div>
            </div>
          </div>
        ) : (<>
          <div className="row gap-10" style={{ color: drag ? "var(--blue-text)" : "var(--text-2)" }}>
            <Icon.upload />
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{drag ? "Drop to upload" : "Drag files here, or click to browse"}</span>
          </div>
          <span className="t-micro" style={{ marginTop: 5 }}>PDF, DOCX, images, ZIP — up to 50 MB</span>
        </>)}
      </div>

      {shown.length === 0 ? (
        <div className="panel">
          <EmptyState icon={<Icon.folder />} title={docs.length === 0 ? "No documents yet" : "Nothing here yet"}
            text={docs.length === 0
              ? "Keep the project's files, external links and in-app notes together — uploads, Figma and Drive links, and runbooks all in one place."
              : `No ${filter}s in this project yet.`}
            action={docs.length === 0 ? <div className="row gap-10"><button className="btn" onClick={() => setAddLink(true)}><Icon.link />Add link</button><button className="btn btn-primary" onClick={() => simulateUpload()}><Icon.upload />Upload a file</button></div> : null} />
        </div>
      ) : (
        <div className="col gap-10">
          {shown.map((d) => <DocItem key={d.id} d={d} onOpen={() => d.kind === "note" ? setNoteEdit(d) : toast(d.kind === "link" ? "Opening link ↗" : "Downloading…", d.kind === "file" ? "copy" : "info")}
            onEdit={() => d.kind === "note" && setNoteEdit(d)} onDelete={() => setConfirmDel(d)} toast={toast} />)}
        </div>
      )}

      {noteEdit && <NoteEditor existing={noteEdit.id ? noteEdit : null} onClose={() => setNoteEdit(null)} onSave={saveNote} />}
      {addLink && <LinkEditor onClose={() => setAddLink(false)} onSave={saveLink} />}
      {confirmDel && <Confirm title="Remove document?" danger confirmLabel="Remove"
        body={<>Remove <span style={{ color: "var(--text)" }}>{confirmDel.name}</span> from this project?</>}
        onConfirm={() => del(confirmDel)} onClose={() => setConfirmDel(null)} />}
    </div>
  );
}

function DocItem({ d, onOpen, onEdit, onDelete, toast }) {
  const icon = { file: <Icon.fileText />, link: <Icon.link />, note: <Icon.note /> }[d.kind];
  const tint = { file: "var(--blue-text)", link: "#B57BFF", note: "var(--green)" }[d.kind];
  const hostGlyph = d.host === "figma" ? <Brand.figma /> : d.host === "drive" ? <Brand.drive /> : null;
  return (
    <div className="card card-hover doc-item row gap-13" style={{ padding: "13px 15px", cursor: "pointer" }} onClick={onOpen}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flex: "none", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-2)", border: "1px solid var(--border-1)", color: tint }}>
        {hostGlyph ? <div style={{ width: 20, height: 20 }}>{hostGlyph}</div> : icon}
      </div>
      <div className="col grow" style={{ gap: 3, minWidth: 0 }}>
        <div className="row gap-8" style={{ minWidth: 0 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600 }} className="truncate">{d.name}</span>
          {d.kind === "link" && <span className="badge badge-gray" style={{ height: 18, fontSize: 10 }}><Icon.external />link</span>}
          {d.kind === "note" && <span className="badge badge-green" style={{ height: 18, fontSize: 10 }}>note</span>}
        </div>
        {d.kind === "note" && d.preview
          ? <span className="t-micro truncate" style={{ maxWidth: 540 }}>{d.preview}</span>
          : <span className="t-micro mono">{d.meta}</span>}
      </div>
      <div className="col none" style={{ alignItems: "flex-end", gap: 3, marginRight: 4 }}>
        <Avatar id={d.by} size={22} />
      </div>
      <span className="t-micro none" style={{ width: 64, textAlign: "right", color: "var(--text-3)" }}>{d.date}</span>
      <div className="row gap-4 doc-actions none">
        {d.kind === "file" && <button className="btn-icon sm" onClick={(e) => { e.stopPropagation(); toast("Downloading…", "copy"); }} title="Download"><Icon.download /></button>}
        {d.kind === "link" && <button className="btn-icon sm" onClick={(e) => { e.stopPropagation(); toast("Opening ↗"); }} title="Open"><Icon.external /></button>}
        {d.kind === "note" && <button className="btn-icon sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit"><Icon.edit /></button>}
        <button className="btn-icon sm hover-danger" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Remove"><Icon.trash /></button>
      </div>
    </div>
  );
}

function NoteEditor({ existing, onClose, onSave }) {
  const [name, setName] = React.useState(existing ? existing.name : "");
  const [body, setBody] = React.useState(existing ? (existing.body || existing.preview || "") : "");
  const canSave = name.trim().length > 0;
  return (
    <Modal title={existing ? "Edit note" : "New note"} sub="Rich-text notes live inside progixHub." onClose={onClose} width={620}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave({ name: name.trim(), body: body.trim(), preview: body.trim().slice(0, 120) })}>{existing ? "Save note" : "Create note"}</button>
      </>}>
      <div className="col gap-16">
        <input className="input" style={{ fontSize: 17, fontWeight: 600 }} placeholder="Note title" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <div className="note-toolbar row gap-2">
          {["B", "I", "H", "•", "</>"].map((t, i) => <button key={i} className="btn-icon sm" tabIndex={-1} style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{t}</button>)}
        </div>
        <textarea className="textarea" style={{ minHeight: 200 }} placeholder="Write the runbook, decisions, or context the team needs…" value={body} onChange={(e) => setBody(e.target.value)}></textarea>
      </div>
    </Modal>
  );
}

function LinkEditor({ onClose, onSave }) {
  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const valid = /^https?:\/\/.+\..+/.test(url);
  const host = url.includes("figma") ? "figma" : url.includes("google") || url.includes("drive") ? "drive" : null;
  const meta = (() => { try { return new URL(url).hostname.replace("www.", ""); } catch { return "external link"; } })();
  return (
    <Modal title="Add external link" sub="Figma, Drive, design ZIPs — anything with a URL." onClose={onClose} width={520}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={!valid || !name.trim()} onClick={() => onSave({ name: name.trim(), meta, host })}>Add link</button>
      </>}>
      <div className="col gap-16">
        <div className="field"><label className="label">Label</label>
          <input className="input" placeholder="e.g. Atlas — Figma Design File" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
        <div className="field"><label className="label">URL</label>
          <input className={`input mono ${url && !valid ? "invalid" : url ? "valid" : ""}`} placeholder="https://figma.com/file/…" value={url} onChange={(e) => setUrl(e.target.value)} spellCheck={false} />
          {url && !valid && <span className="hint err">Enter a full URL starting with http(s)://</span>}</div>
      </div>
    </Modal>
  );
}

Object.assign(window, { Documents });
