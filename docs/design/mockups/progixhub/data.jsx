/* progixHub — mock data. Strings kept in one place (i18n-ready, EN for this pass). */

const PROJECTS = [
  {
    id: "atlas",
    name: "Atlas Commerce",
    code: "ATL",
    desc: "Headless storefront + checkout for the Atlas retail group.",
    status: "active",
    accent: "#4C82FB",
    updated: "2h ago",
    members: ["AR", "MK", "JD", "SL"],
    surfaces: {
      notion: "atlas-commerce/overview",
      slack: "#proj-atlas",
      github: "progix/atlas-commerce",
      live: "atlas.shop",
    },
    envCount: 14, docCount: 9, feedbackCount: 3, openFeedback: 1,
  },
  {
    id: "halo",
    name: "Halo Identity",
    code: "HAL",
    desc: "Passwordless auth & SSO service for internal Progix products.",
    status: "active",
    accent: "#3FB97F",
    updated: "yesterday",
    members: ["TP", "RB", "MK"],
    surfaces: {
      notion: "halo/handbook",
      slack: "#proj-halo",
      github: "progix/halo-identity",
      live: "id.progix.io",
    },
    envCount: 22, docCount: 5, feedbackCount: 0, openFeedback: 0,
  },
  {
    id: "drift",
    name: "Drift Analytics",
    code: "DRF",
    desc: "Event pipeline and dashboards for product telemetry.",
    status: "at-risk",
    accent: "#E0A53B",
    updated: "3 days ago",
    members: ["JD", "SL"],
    surfaces: {
      notion: "drift/spec",
      slack: "#proj-drift",
      github: "progix/drift-analytics",
      live: "",
    },
    envCount: 8, docCount: 12, feedbackCount: 5, openFeedback: 2,
  },
  {
    id: "ember",
    name: "Ember Mobile",
    code: "EMB",
    desc: "React Native client for the Ember field-service app.",
    status: "active",
    accent: "#F0613B",
    updated: "5 days ago",
    members: ["RB", "AR", "TP", "MK", "JD"],
    surfaces: {
      notion: "ember/product",
      slack: "#proj-ember",
      github: "progix/ember-mobile",
      live: "",
    },
    envCount: 11, docCount: 7, feedbackCount: 8, openFeedback: 0,
  },
  {
    id: "north",
    name: "Northwind CMS",
    code: "NRT",
    desc: "Content platform migration for the Northwind editorial team.",
    status: "archived",
    accent: "#6B7488",
    updated: "Mar 2026",
    members: ["SL", "MK"],
    surfaces: {
      notion: "northwind/archive",
      slack: "#proj-north",
      github: "progix/northwind-cms",
      live: "cms.northwind.co",
    },
    envCount: 6, docCount: 4, feedbackCount: 2, openFeedback: 0,
  },
];

const ENV_VARS = {
  atlas: [
    { id: "e1", key: "DATABASE_URL", value: "postgres://atlas:9f3a@db.atlas.internal:5432/store", scope: "production", updated: "Apr 28" },
    { id: "e2", key: "STRIPE_SECRET_KEY", value: "sk_live_51Mq8aLkP3xZ7vR2nB9cF0wQ", scope: "production", updated: "Apr 28" },
    { id: "e3", key: "STRIPE_WEBHOOK_SECRET", value: "whsec_8Kp2mN4qR7tV0xY3zB6dF9", scope: "production", updated: "Apr 12" },
    { id: "e4", key: "REDIS_URL", value: "rediss://default:a1B2@cache.atlas.internal:6380", scope: "production", updated: "Mar 30" },
    { id: "e5", key: "NEXT_PUBLIC_API_URL", value: "https://api.atlas.shop", scope: "preview", updated: "Apr 28" },
    { id: "e6", key: "SENDGRID_API_KEY", value: "SG.x7Yp2Kq.9mNvR4tB0wL3zF6dC8aQ", scope: "production", updated: "Feb 18" },
    { id: "e7", key: "JWT_SIGNING_SECRET", value: "h8K2p9mN4qR7tV0xY3zB6dF1wL5cE", scope: "production", updated: "Apr 02" },
    { id: "e8", key: "ALGOLIA_ADMIN_KEY", value: "4f9a8b2c1d6e3f7a0b5c9d2e6f1a4b8c", scope: "development", updated: "Jan 22" },
  ],
  halo: [],
  drift: [
    { id: "d1", key: "SEGMENT_WRITE_KEY", value: "wK9mP2nQ7rT4vX1yZ5bD8fG", scope: "production", updated: "Apr 20" },
    { id: "d2", key: "CLICKHOUSE_DSN", value: "clickhouse://drift:5h2K@warehouse.internal:9000", scope: "production", updated: "Apr 20" },
    { id: "d3", key: "NEXT_PUBLIC_POSTHOG_KEY", value: "phc_9mNvR4tB0wL3zF6dC8aQx7Yp2Kq", scope: "preview", updated: "Apr 11" },
  ],
  ember: [
    { id: "m1", key: "API_BASE_URL", value: "https://api.ember.progix.io", scope: "production", updated: "Apr 26" },
    { id: "m2", key: "SENTRY_DSN", value: "https://b7f2a@o45.ingest.sentry.io/ember", scope: "production", updated: "Apr 26" },
    { id: "m3", key: "MAPBOX_ACCESS_TOKEN", value: "pk.eyJ1IjoicHJvZ2l4IiwiYSI6ImNrN", scope: "production", updated: "Apr 14" },
    { id: "m4", key: "ONESIGNAL_APP_ID", value: "9f3a7b2c-1d6e-4f7a-0b5c-9d2e6f1a4b8c", scope: "production", updated: "Apr 02" },
    { id: "m5", key: "CODEPUSH_DEPLOYMENT_KEY", value: "kY9mP2nQ7rT4vX1yZ5bD8fG3hJ6lM", scope: "preview", updated: "Mar 28" },
  ],
  north: [
    { id: "w1", key: "DATABASE_URL", value: "postgres://north:3a9f@db.northwind.co:5432/cms", scope: "production", updated: "Mar 2026" },
    { id: "w2", key: "CONTENTFUL_DELIVERY_TOKEN", value: "CFPAT-x7Yp2Kq9mNvR4tB0wL3zF6dC8", scope: "production", updated: "Mar 2026" },
  ],
};

const DOCUMENTS = {
  atlas: [
    { id: "doc1", kind: "file", name: "Atlas — Brand Guidelines.pdf", meta: "PDF · 4.2 MB", by: "MK", date: "Apr 24" },
    { id: "doc2", kind: "file", name: "Checkout API Contract v3.docx", meta: "DOCX · 88 KB", by: "JD", date: "Apr 19" },
    { id: "doc3", kind: "link", name: "Atlas — Figma Design File", meta: "figma.com", host: "figma", by: "SL", date: "Apr 22" },
    { id: "doc4", kind: "link", name: "Launch Assets (Drive folder)", meta: "drive.google.com", host: "drive", by: "AR", date: "Apr 17" },
    { id: "doc5", kind: "link", name: "atlas-storefront-export.zip", meta: "drive.google.com", host: "drive", by: "MK", date: "Apr 09" },
    { id: "doc6", kind: "note", name: "Production runbook & on-call", meta: "Edited by RB", by: "RB", date: "2h ago", preview: "Steps to roll back a bad deploy, escalation order, and the incident channel checklist…" },
    { id: "doc7", kind: "note", name: "Q2 scope & open questions", meta: "Edited by JD", by: "JD", date: "Apr 25", preview: "Phase 2 covers gift cards, store credit, and the loyalty tier rework. Open: tax engine…" },
  ],
  halo: [
    { id: "h1", kind: "note", name: "Architecture decision records", meta: "Edited by TP", by: "TP", date: "yesterday", preview: "ADR-014: move session store to Redis. ADR-015: drop legacy SAML support by Q3…" },
  ],
  drift: [],
  ember: [
    { id: "em1", kind: "link", name: "Ember — Figma Prototype", meta: "figma.com", host: "figma", by: "AR", date: "Apr 23" },
    { id: "em2", kind: "note", name: "App Store release checklist", meta: "Edited by RB", by: "RB", date: "Apr 18", preview: "Bump build number, regenerate screenshots, verify push entitlements, submit for review…" },
  ],
  north: [
    { id: "nw1", kind: "file", name: "Northwind — Migration Plan.pdf", meta: "PDF · 1.1 MB", by: "SL", date: "Mar 2026" },
  ],
};

const FEEDBACK = {
  atlas: [
    { id: "f1", rating: 5, name: "Dana Whitfield", org: "Atlas Retail Group", date: "Apr 26", msg: "The new checkout flow is dramatically faster. Our test customers had zero confusion at the payment step.", status: "open" },
    { id: "f2", rating: 4, name: "Marcus Lee", org: "Atlas Retail Group", date: "Apr 20", msg: "Looks great overall. One ask: can the order confirmation email include the estimated delivery window?", status: "read" },
    { id: "f3", rating: 5, name: "Dana Whitfield", org: "Atlas Retail Group", date: "Apr 11", msg: "Mobile experience feels really polished now. Thank you for the quick turnaround on the cart fixes.", status: "read" },
  ],
  halo: [], drift: [],
  ember: [
    { id: "ef1", rating: 5, name: "Priya Anand", org: "Ember Field Services", date: "Apr 24", msg: "The offline mode is a game changer for our technicians in the field. Syncs perfectly once they're back online.", status: "open" },
    { id: "ef2", rating: 4, name: "Tom Becker", org: "Ember Field Services", date: "Apr 15", msg: "Solid app. The job photos sometimes take a moment to upload on slow connections — otherwise great.", status: "read" },
  ],
  north: [],
};

const TEAM = {
  AR: { name: "Amara Reyes", color: "#4C82FB" },
  MK: { name: "Milo Kovač", color: "#3FB97F" },
  JD: { name: "Jordan Diaz", color: "#E0A53B" },
  SL: { name: "Sofia Lindqvist", color: "#B57BFF" },
  TP: { name: "Théo Petit", color: "#F0613B" },
  RB: { name: "Riya Banerjee", color: "#37C5E0" },
};

const STATUS_META = {
  active:   { label: "Active",   dot: "dot-green", badge: "badge-green" },
  "at-risk":{ label: "At risk",  dot: "dot-amber", badge: "badge-amber" },
  archived: { label: "Archived", dot: "dot-gray",  badge: "badge-gray" },
};

const SCOPE_META = {
  production:  { label: "Production",  cls: "badge-green" },
  preview:     { label: "Preview",     cls: "badge-blue" },
  development: { label: "Development", cls: "badge-gray" },
};

/* The one project shown on the external client feedback surface */
const CLIENT_CONTEXT = {
  project: "Atlas Commerce",
  org: "Atlas Retail Group",
  line: "You're reviewing the new storefront & checkout experience built by Progix.",
  by: "Progix · Product team",
};

/* Counts derive from the seeded data — single source of truth for cards + tabs */
PROJECTS.forEach((p) => {
  p.envCount = (ENV_VARS[p.id] || []).length;
  p.docCount = (DOCUMENTS[p.id] || []).length;
  p.feedbackCount = (FEEDBACK[p.id] || []).length;
  p.openFeedback = (FEEDBACK[p.id] || []).filter((f) => f.status === "open").length;
});

Object.assign(window, {
  PROJECTS, ENV_VARS, DOCUMENTS, FEEDBACK, TEAM, STATUS_META, SCOPE_META, CLIENT_CONTEXT,
});
