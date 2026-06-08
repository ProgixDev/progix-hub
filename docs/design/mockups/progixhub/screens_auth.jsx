/* progixHub — Sign in (invite-only) */

function SignIn({ onSignedIn }) {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(null); // 'github' | 'magic'
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const github = () => { setLoading("github"); setTimeout(() => onSignedIn(), 1100); };
  const magic = (e) => {
    e.preventDefault();
    if (!valid) return;
    setLoading("magic");
    setTimeout(() => { setLoading(null); setSent(true); }, 900);
  };

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateColumns: "1.05fr 0.95fr", background: "var(--bg)" }}>
      {/* Left: form */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 40 }}>
        <div className="fade-in" style={{ width: "100%", maxWidth: 372 }}>
          <div style={{ marginBottom: 34 }}><Wordmark size={20} /></div>

          {!sent ? (<>
            <h1 className="t-h1" style={{ margin: 0 }}>Sign in to progixHub</h1>
            <p className="t-body" style={{ marginTop: 9, marginBottom: 28, color: "var(--text-2)" }}>
              Invite-only access for the Progix team.
            </p>

            <button className="btn btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={github} disabled={loading}>
              {loading === "github" ? <div className="spinner"></div> : <Brand.github />}
              Continue with GitHub
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", color: "var(--text-3)", fontSize: 12 }}>
              <div className="grow" style={{ height: 1, background: "var(--border)" }}></div>
              OR
              <div className="grow" style={{ height: 1, background: "var(--border)" }}></div>
            </div>

            <form className="col gap-12" onSubmit={magic}>
              <div className="field">
                <label className="label" htmlFor="email">Work email</label>
                <div className="input-wrap">
                  <span className="prefix-icon"><Icon.mail /></span>
                  <input id="email" className="input has-prefix" type="email" placeholder="you@progix.io"
                    value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" type="submit" style={{ width: "100%", justifyContent: "center" }} disabled={!valid || loading}>
                {loading === "magic" ? <div className="spinner"></div> : <Icon.sparkle />}
                Email me a magic link
              </button>
            </form>

            <p className="t-micro" style={{ marginTop: 22, lineHeight: 1.55, color: "var(--text-3)" }}>
              By continuing you agree to the Progix internal tooling policy. Lost access? Ping <span className="mono" style={{ color: "var(--text-2)" }}>#it-help</span>.
            </p>
          </>) : (
            <div className="fade-in">
              <div className="empty-icon" style={{ marginBottom: 20 }}><Icon.mail /></div>
              <h1 className="t-h1" style={{ margin: 0 }}>Check your email</h1>
              <p className="t-body" style={{ marginTop: 10, color: "var(--text-1)", lineHeight: 1.6 }}>
                We sent a magic link to <span className="mono" style={{ color: "var(--text)" }}>{email}</span>. It expires in 10 minutes.
              </p>
              <div className="panel" style={{ marginTop: 22, padding: 14, display: "flex", gap: 11, alignItems: "center", background: "var(--bg-1)" }}>
                <Icon.info />
                <span className="t-small">Demo: <button className="link-btn" onClick={onSignedIn} style={{ color: "var(--blue-text)", background: "none", border: "none", padding: 0, font: "inherit", textDecoration: "underline" }}>open the link</button> to continue.</span>
              </div>
              <button className="btn" style={{ marginTop: 18 }} onClick={() => setSent(false)}>← Use a different method</button>
            </div>
          )}
        </div>
      </div>

      {/* Right: brand panel */}
      <div style={{ position: "relative", overflow: "hidden", borderLeft: "1px solid var(--border)",
        background: "radial-gradient(120% 80% at 80% 0%, #11203f 0%, #0b0e18 55%, #0a0d16 100%)" }}>
        <SignInArt />
      </div>
    </div>
  );
}

function SignInArt() {
  return (
    <div style={{ position: "absolute", inset: 0, padding: 48, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* grid texture */}
      <div style={{ position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(76,130,251,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(76,130,251,0.05) 1px, transparent 1px)",
        backgroundSize: "44px 44px", maskImage: "radial-gradient(circle at 70% 30%, black, transparent 75%)" }}></div>

      <div style={{ position: "relative" }}>
        <span className="t-eyebrow">The Progix project registry</span>
      </div>

      {/* floating project card mock */}
      <div style={{ position: "relative", alignSelf: "center", width: 320 }}>
        <div className="card" style={{ padding: 18, boxShadow: "var(--shadow-pop)", transform: "rotate(-2deg)" }}>
          <div className="row gap-10" style={{ marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(150deg,#4C82FB,#2a5bd0)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 13 }}>ATL</div>
            <div className="col" style={{ gap: 3, minWidth: 0 }}>
              <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>Atlas Commerce</span>
              <span className="badge badge-green" style={{ height: 19, fontSize: 10.5 }}><span className="dot dot-green"></span>Active</span>
            </div>
          </div>
          <div className="row gap-8">
            {[<Brand.notion />, <Brand.slack />, <Brand.github />].map((g, i) => (
              <div key={i} style={{ width: 30, height: 30, borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--border-1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 18, height: 18 }}>{g}</div>
              </div>
            ))}
            <div className="grow"></div>
            <span className="badge badge-mono badge-gray" style={{ height: 22 }}><Icon.key /> 14</span>
          </div>
        </div>
        <div className="card" style={{ padding: 14, position: "absolute", top: 78, left: 70, right: -34, boxShadow: "var(--shadow-pop)", transform: "rotate(3deg)", background: "var(--bg-2)" }}>
          <div className="row gap-8" style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>
            <Icon.lock />
            <span style={{ color: "var(--text-1)" }}>STRIPE_SECRET_KEY</span>
            <div className="grow"></div>
            <span style={{ color: "var(--text-3)", letterSpacing: 2 }}>••••••••</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", maxWidth: 380 }}>
        <p style={{ fontSize: 17, lineHeight: 1.5, color: "var(--text-1)", fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>
          Every project's Notion, Slack, GitHub, documents and secrets — in one calm, trustworthy place.
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { SignIn });
