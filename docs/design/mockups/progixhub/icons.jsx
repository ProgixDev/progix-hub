/* progixHub — icon set. Stroke icons (currentColor) + brand glyphs. */
const S = ({ d, w = 24, fill, sw = 1.7, children, vb = "0 0 24 24" }) =>
  React.createElement("svg", { width: 16, height: 16, viewBox: vb, fill: fill || "none", stroke: fill ? "none" : "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", style: { flex: "none" } },
    children || React.createElement("path", { d }));

const Icon = {
  search:   () => <S d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3" />,
  plus:     () => <S d="M12 5v14M5 12h14" sw={1.9} />,
  eye:      () => <S><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></S>,
  eyeOff:   () => <S><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a16.7 16.7 0 0 1-2.2 3.06M6.6 6.6C3.7 8.3 2 12 2 12s3.5 7 10 7a9.5 9.5 0 0 0 4.1-.94M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="m3 3 18 18" /></S>,
  copy:     () => <S><rect x="8.5" y="8.5" width="12" height="12" rx="2.4" /><path d="M16 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5" /></S>,
  check:    () => <S d="m4.5 12.5 5 5 10-11" sw={2} />,
  checkCircle: () => <S><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5L16 9" /></S>,
  lock:     () => <S><rect x="4.5" y="10.5" width="15" height="10" rx="2.4" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></S>,
  shield:   () => <S><path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 8.5 4.1-.9 7-4.3 7-8.5V6l-7-3Z" /><path d="m9 12 2 2 4-4.2" /></S>,
  edit:     () => <S d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14 7l3 3" />,
  trash:    () => <S><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" /></S>,
  file:     () => <S d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5" />,
  fileText: () => <S><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></S>,
  link:     () => <S d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5M14 10a4 4 0 0 0-5.66 0l-3 3A4 4 0 0 0 11 18.66l1.5-1.5" />,
  note:     () => <S><path d="M5 4.5h14a1 1 0 0 1 1 1v9l-5 5H6a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" /><path d="M20 14.5h-5v5M8.5 9h7M8.5 12.5h4" /></S>,
  upload:   () => <S d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />,
  download: () => <S d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" />,
  mail:     () => <S><rect x="3" y="5" width="18" height="14" rx="2.4" /><path d="m4 7 8 6 8-6" /></S>,
  arrowRight: () => <S d="M5 12h14m-5-6 6 6-6 6" />,
  arrowUpRight: () => <S d="M7 17 17 7M8 7h9v9" />,
  chevronDown: () => <S d="m6 9 6 6 6-6" sw={1.9} />,
  chevronRight: () => <S d="m9 6 6 6-6 6" sw={1.9} />,
  command:  () => <S d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" />,
  settings: () => <S><circle cx="12" cy="12" r="3" /><path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4.6 13H4.4a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.7l-.1-.1A2 2 0 1 1 8.4 3.4l.1.1A1.6 1.6 0 0 0 11 4.6V4.4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21.4 11h.2a2 2 0 1 1 0 4h-.2Z" /></S>,
  grid:     () => <S><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></S>,
  rows:     () => <S><rect x="3.5" y="4.5" width="17" height="5" rx="1.6" /><rect x="3.5" y="14.5" width="17" height="5" rx="1.6" /></S>,
  folder:   () => <S d="M4 6.5A1.5 1.5 0 0 1 5.5 5h3.7a1.5 1.5 0 0 1 1.2.6l.9 1.2a1.5 1.5 0 0 0 1.2.6h6A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 4 17.5v-11Z" />,
  star:     () => <S d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  x:        () => <S d="M6 6l12 12M18 6 6 18" sw={1.9} />,
  alert:    () => <S><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17.5v.01" /></S>,
  info:     () => <S><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></S>,
  filter:   () => <S d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />,
  clock:    () => <S><circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" /></S>,
  user:     () => <S><circle cx="12" cy="8" r="4" /><path d="M5 20a7 7 0 0 1 14 0" /></S>,
  logout:   () => <S d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" />,
  key:      () => <S><circle cx="8" cy="15" r="4.5" /><path d="M11.2 11.8 19 4m-3 0 3 3m-5 2 2.5 2.5" /></S>,
  send:     () => <S d="M21 4 3 11l7 2.5L13 21l8-17Zm0 0-11 9.5" />,
  refresh:  () => <S d="M3.5 12a8.5 8.5 0 0 1 14.5-6m1.5-2.5V6h-4M20.5 12a8.5 8.5 0 0 1-14.5 6m-1.5 2.5V18h4" />,
  external: () => <S d="M14 4h6v6M20 4l-9 9M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />,
  dots:     () => <S fill="currentColor"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></S>,
  globe:    () => <S><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" /></S>,
  zip:      () => <S><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M11 3v3m0 2v0m0 2v0m0 2h2v3h-2v-3Z" /></S>,
  image:    () => <S><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m5 18 5-5 4 4 2.5-2.5L20 17" /></S>,
  sparkle:  () => <S d="M12 3.5l1.6 5.1 5.1 1.6-5.1 1.6L12 17l-1.6-5.2L5.3 10l5.1-1.6L12 3.5ZM19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" fill="currentColor" />,
  drag:     () => <S fill="currentColor"><circle cx="9" cy="6" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="18" r="1.4" /></S>,
};

/* ---- Brand glyphs (recognizable, simplified) ---- */
const Brand = {
  notion: () => (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="2.5" width="19" height="19" rx="3.2" fill="#fff" stroke="#0a0d16" strokeWidth="0.6" />
      <path d="M7 7.4l8.2-.6c.5 0 .7.05.9.25l1.5 1.3c.18.16.1.4-.25.42l-8.5.5-1.9-1.4c-.18-.13-.06-.4.05-.47Z" fill="#0a0d16" opacity="0" />
      <path d="M8 8.1v7.6c0 .4.2.55.65.5l.7-.06V10.6l4 5.2c.2.27.36.35.7.33l1.1-.07c.3-.02.42-.18.42-.45V8.1c0-.27-.13-.4-.45-.38l-.85.05c-.3.02-.42.16-.42.44v4.85L10.2 8c-.18-.25-.35-.33-.7-.31l-1 .06c-.32.02-.5.16-.5.36Z" fill="#0a0d16" />
    </svg>
  ),
  slack: () => (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6.2 14.7a1.85 1.85 0 1 1-1.85-1.85H6.2v1.85Z" fill="#E01E5A" /><path d="M7.15 14.7a1.85 1.85 0 0 1 3.7 0v4.6a1.85 1.85 0 1 1-3.7 0v-4.6Z" fill="#E01E5A" />
      <path d="M9 6.15A1.85 1.85 0 1 1 10.85 4.3v1.85H9Z" fill="#36C5F0" /><path d="M9 7.1a1.85 1.85 0 0 1 0 3.7H4.4a1.85 1.85 0 1 1 0-3.7H9Z" fill="#36C5F0" />
      <path d="M17.55 9a1.85 1.85 0 1 1 1.85 1.85h-1.85V9Z" fill="#2EB67D" /><path d="M16.6 9a1.85 1.85 0 0 1-3.7 0V4.4a1.85 1.85 0 1 1 3.7 0V9Z" fill="#2EB67D" />
      <path d="M14.75 17.55a1.85 1.85 0 1 1-1.85 1.85v-1.85h1.85Z" fill="#ECB22E" /><path d="M14.75 16.6a1.85 1.85 0 0 1 0-3.7h4.6a1.85 1.85 0 1 1 0 3.7h-4.6Z" fill="#ECB22E" />
    </svg>
  ),
  github: () => (
    <svg viewBox="0 0 24 24" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2.6A9.4 9.4 0 0 0 9 21c.47.09.64-.2.64-.45v-1.6c-2.6.57-3.16-1.25-3.16-1.25-.43-1.08-1.04-1.37-1.04-1.37-.85-.58.06-.57.06-.57.94.07 1.43.97 1.43.97.84 1.43 2.2 1.02 2.73.78.08-.6.33-1.02.6-1.25-2.08-.24-4.27-1.04-4.27-4.64 0-1.02.37-1.86.96-2.52-.1-.24-.42-1.2.09-2.5 0 0 .78-.25 2.56.96a8.9 8.9 0 0 1 4.66 0c1.78-1.21 2.56-.96 2.56-.96.51 1.3.19 2.26.09 2.5.6.66.96 1.5.96 2.52 0 3.61-2.2 4.4-4.29 4.63.34.3.64.87.64 1.76v2.6c0 .26.17.55.65.45A9.4 9.4 0 0 0 12 2.6Z" fill="#E8ECF6" />
    </svg>
  ),
  live: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#4C82FB" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" />
    </svg>
  ),
  figma: () => (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M8.5 3h3.5v6H8.5a3 3 0 1 1 0-6Z" fill="#F24E1E" /><path d="M12 3h3.5a3 3 0 0 1 0 6H12V3Z" fill="#FF7262" />
      <path d="M12 9h3.5a3 3 0 0 1 0 6H12V9Z" fill="#1ABCFE" /><path d="M8.5 9H12v6H8.5a3 3 0 1 1 0-6Z" fill="#A259FF" />
      <path d="M8.5 15H12v3a3 3 0 1 1-3.5-3Z" fill="#0ACF83" />
    </svg>
  ),
  drive: () => (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M8.4 3.5h7.2l5.4 9.3h-7.2L8.4 3.5Z" fill="#FFCF63" /><path d="M3 17.8 6.6 11.5l5.4 9.3H5.4L3 17.8Z" fill="#11A861" /><path d="M21 12.8 17.4 19H6.6l3.6-6.2H21Z" fill="#4688F1" />
    </svg>
  ),
};

/* progixHub wordmark */
const Wordmark = ({ size = 17, dim = false }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: size, fontWeight: 600, letterSpacing: "-0.02em", color: dim ? "var(--text-1)" : "var(--text)" }}>
    <LogoMark size={size + 5} />
    <span>progix<span style={{ color: "var(--blue)" }}>Hub</span></span>
  </span>
);
const LogoMark = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={{ flex: "none" }}>
    <rect x="1" y="1" width="26" height="26" rx="8" fill="#101A33" stroke="rgba(76,130,251,0.5)" strokeWidth="1" />
    <circle cx="14" cy="14" r="3" fill="#4C82FB" />
    <circle cx="14" cy="6.6" r="2" fill="#7CA2FF" /><circle cx="20.4" cy="17.7" r="2" fill="#7CA2FF" /><circle cx="7.6" cy="17.7" r="2" fill="#7CA2FF" />
    <path d="M14 9v2.2M16.4 15.4l1.7 1M11.6 15.4l-1.7 1" stroke="#4C82FB" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

Object.assign(window, { Icon, Brand, Wordmark, LogoMark });
