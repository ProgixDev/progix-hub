/* progixHub — shared UI primitives */

function Avatar({ id, size = 26, ring }) {
  const m = (window.TEAM || {})[id] || { name: id, color: "#4C82FB" };
  return (
    <div title={m.name} style={{
      width: size, height: size, borderRadius: "50%", flex: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.4, fontWeight: 600, color: "#fff",
      background: `linear-gradient(150deg, ${m.color}, ${shade(m.color, -22)})`,
      boxShadow: ring ? `0 0 0 2px ${ring}` : "none",
      fontFamily: "var(--sans)", letterSpacing: "-0.01em",
    }}>{id}</div>
  );
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

function AvatarStack({ ids, max = 4, size = 26 }) {
  const show = ids.slice(0, max);
  const extra = ids.length - show.length;
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {show.map((id, i) => (
        <div key={id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: show.length - i }}>
          <Avatar id={id} size={size} ring="var(--bg-1)" />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -8, width: size, height: size, borderRadius: "50%",
          background: "var(--bg-3)", border: "1px solid var(--border-1)", boxShadow: "0 0 0 2px var(--bg-1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10.5, color: "var(--text-1)", fontWeight: 600,
        }}>+{extra}</div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const m = (window.STATUS_META || {})[status];
  if (!m) return null;
  return <span className={`badge ${m.badge}`}><span className={`dot ${m.dot}`}></span>{m.label}</span>;
}

function ScopeBadge({ scope }) {
  const m = (window.SCOPE_META || {})[scope];
  if (!m) return null;
  return <span className={`badge badge-mono ${m.cls}`}>{m.label}</span>;
}

function Modal({ title, sub, onClose, children, footer, width }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" style={width ? { maxWidth: width } : null} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="col" style={{ gap: 2 }}>
            <div className="t-h3">{title}</div>
            {sub && <div className="t-small">{sub}</div>}
          </div>
          <button className="btn-icon sm" onClick={onClose} aria-label="Close"><Icon.x /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div className="empty fade-in">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

function Spinner({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-2)", fontSize: 13 }}>
      <div className="spinner"></div>{label}
    </div>
  );
}

/* Confirm dialog */
function Confirm({ title, body, confirmLabel, danger, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose} width={440}
      footer={<>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </>}>
      <div className="t-body" style={{ lineHeight: 1.6 }}>{body}</div>
    </Modal>
  );
}

/* Surface link chip used in project header + cards */
function SurfaceLink({ kind, value, onToast }) {
  const map = {
    notion: { glyph: <Brand.notion />, name: "Notion", host: "notion.so/" },
    slack:  { glyph: <Brand.slack />,  name: "Slack",  host: "slack.com/" },
    github: { glyph: <Brand.github />, name: "GitHub", host: "github.com/" },
    live:   { glyph: <Brand.live />,   name: "Live",   host: "" },
  };
  const m = map[kind];
  if (!value) {
    return (
      <button className="surface empty" onClick={() => onToast && onToast(`Add a ${m.name} link in project settings`)}>
        <div className="glyph" style={{ opacity: 0.5 }}>{m.glyph}</div>
        <div className="s-meta"><span className="s-name" style={{ color: "var(--text-2)" }}>Add {m.name}</span></div>
        <span className="s-arrow"><Icon.plus /></span>
      </button>
    );
  }
  return (
    <a className="surface" href="#" onClick={(e) => { e.preventDefault(); onToast && onToast(`Opening ${m.name} ↗`); }}>
      <div className="glyph">{m.glyph}</div>
      <div className="s-meta">
        <span className="s-name">{m.name}</span>
        <span className="s-sub mono">{value}</span>
      </div>
      <span className="s-arrow"><Icon.arrowUpRight /></span>
    </a>
  );
}

/* Segmented control */
function Segmented({ value, onChange, options }) {
  return (
    <div style={{ display: "inline-flex", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className="row gap-6"
          style={{
            height: 28, padding: "0 11px", borderRadius: 5, border: "none",
            background: value === o.value ? "var(--bg-3)" : "transparent",
            color: value === o.value ? "var(--text)" : "var(--text-2)",
            fontSize: 12.5, fontWeight: 500,
            boxShadow: value === o.value ? "var(--shadow-1)" : "none",
            transition: "all .14s var(--ease)",
          }}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Avatar, AvatarStack, StatusBadge, ScopeBadge, Modal, EmptyState, Spinner, Confirm, SurfaceLink, Segmented, shade });
