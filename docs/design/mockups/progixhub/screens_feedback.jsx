/* progixHub — Client feedback page (external, link-gated, no account) */

function ClientFeedback({ onExitDemo }) {
  const c = window.CLIENT_CONTEXT;
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [msg, setMsg] = React.useState("");
  const [name, setName] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const canSend = rating > 0 && msg.trim().length > 2;

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  const submit = (e) => {
    e.preventDefault();
    if (!canSend) return;
    setSending(true);
    setTimeout(() => { setSending(false); setDone(true); }, 950);
  };

  return (
    <div style={{ height: "100vh", overflow: "auto", background: "radial-gradient(120% 70% at 50% 0%, #11203f 0%, #0a0d16 60%)" }}>
      {/* demo exit ribbon */}
      <div style={{ position: "fixed", top: 14, right: 14, zIndex: 10 }}>
        <button className="btn btn-sm" onClick={onExitDemo} style={{ background: "rgba(20,25,40,0.7)", backdropFilter: "blur(6px)" }}><Icon.arrowRight /> Back to admin (demo)</button>
      </div>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "8vh 24px 60px", minHeight: "100%" }}>
        {/* brand line */}
        <div className="row gap-8" style={{ justifyContent: "center", marginBottom: 30 }}>
          <Wordmark size={16} dim />
        </div>

        {!done ? (
          <div className="card fade-in" style={{ padding: 0, overflow: "hidden", boxShadow: "var(--shadow-pop)" }}>
            {/* context header */}
            <div style={{ padding: "22px 26px 20px", borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg, rgba(76,130,251,0.08), transparent)" }}>
              <span className="t-eyebrow">Feedback requested</span>
              <h1 className="t-h1" style={{ fontSize: 22, margin: "8px 0 8px" }}>{c.project}</h1>
              <p className="t-body" style={{ margin: 0, color: "var(--text-1)", lineHeight: 1.6 }}>{c.line}</p>
              <div className="row gap-8" style={{ marginTop: 12 }}>
                <span className="badge badge-gray"><Icon.user /> {c.org}</span>
                <span className="badge badge-blue badge-mono"><Icon.lock /> Private link</span>
              </div>
            </div>

            <form className="col gap-22" style={{ padding: 26 }} onSubmit={submit}>
              {/* rating */}
              <div className="field" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
                <label className="label" style={{ justifyContent: "center" }}>How is the project going for you?</label>
                <div className="row gap-8" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button type="button" key={i} onClick={() => setRating(i)} onMouseEnter={() => setHover(i)}
                      aria-label={`${i} star${i > 1 ? "s" : ""}`}
                      style={{ background: "none", border: "none", padding: 4, cursor: "pointer",
                        transform: (hover || rating) >= i ? "scale(1.06)" : "scale(1)", transition: "transform .12s var(--ease)" }}>
                      <svg width="34" height="34" viewBox="0 0 24 24"
                        fill={(hover || rating) >= i ? "var(--amber)" : "none"}
                        stroke={(hover || rating) >= i ? "var(--amber)" : "var(--text-3)"} strokeWidth="1.6" strokeLinejoin="round">
                        <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="t-small mono" style={{ height: 16, color: (hover || rating) ? "var(--amber)" : "var(--text-3)" }}>
                  {ratingLabels[hover || rating] || "Tap to rate"}
                </span>
              </div>

              <div className="field">
                <label className="label" htmlFor="cmsg">Your feedback</label>
                <textarea id="cmsg" className="textarea" style={{ minHeight: 120 }} placeholder="What's working well? What could be better?" value={msg} onChange={(e) => setMsg(e.target.value)}></textarea>
              </div>

              <div className="field">
                <label className="label" htmlFor="cname">Your name <span className="opt">optional</span></label>
                <input id="cname" className="input" placeholder="So the team knows who to thank" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <button className="btn btn-primary btn-lg" type="submit" disabled={!canSend || sending} style={{ width: "100%", justifyContent: "center" }}>
                {sending ? <div className="spinner"></div> : <Icon.send />}Send feedback
              </button>
              <p className="t-micro" style={{ textAlign: "center", color: "var(--text-3)", margin: 0 }}>
                Only the Progix team working on {c.project} can see this. You won't be added to anything.
              </p>
            </form>
          </div>
        ) : (
          <div className="card fade-in" style={{ padding: "44px 30px", textAlign: "center", boxShadow: "var(--shadow-pop)" }}>
            <div className="confirm-check" style={{ margin: "0 auto 22px", width: 64, height: 64, borderRadius: "50%", background: "var(--green-tint)", border: "1px solid rgba(63,185,127,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--green)" }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m4.5 12.5 5 5 10-11" /></svg>
            </div>
            <h1 className="t-h1" style={{ fontSize: 22, margin: 0 }}>Thank you{name ? `, ${name.split(" ")[0]}` : ""}!</h1>
            <div className="row gap-4" style={{ justifyContent: "center", margin: "14px 0" }}><Stars value={rating} size={18} /></div>
            <p className="t-body" style={{ color: "var(--text-1)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto" }}>
              Your feedback went straight to the team working on {c.project}. They read every response — you don't need to do anything else.
            </p>
            <button className="btn" style={{ marginTop: 24 }} onClick={() => { setDone(false); setRating(0); setMsg(""); setName(""); }}>Leave more feedback</button>
          </div>
        )}

        <p className="t-micro" style={{ textAlign: "center", marginTop: 26, color: "var(--text-3)" }}>Powered by progixHub · {c.by}</p>
      </div>
    </div>
  );
}

Object.assign(window, { ClientFeedback });
