/** A checklist sub-step on a feature card. */
export type ChecklistStep = { label: string; done: boolean };

/**
 * Prebuilt feature blocks (spec 025). Drag one onto a phase and it becomes a rich feature card with
 * the brand colour, category, and a starter checklist. The catalog is plain data so it can grow
 * without migrations; cards store the chosen block in `plan_items.meta`.
 */
export type FeatureBlock = {
  /** Stable catalog key, stored in meta.feature. */
  key: string;
  name: string;
  category: FeatureCategory;
  /** Brand colour for the card tile. */
  color: string;
};

export const FEATURE_CATEGORIES = [
  "Payments",
  "Auth",
  "Email",
  "Messaging",
  "Push",
  "Analytics",
  "AI",
  "Media",
  "Storage",
  "Database",
  "Monitoring",
  "Search",
  "Maps",
  "CMS",
  "Infra",
  "Productivity",
  "Scheduling",
  "Flags",
  "Mobile",
  "Support",
] as const;
export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

// A pragmatic, recognisable set across the modern app stack — 110+ blocks.
export const FEATURE_BLOCKS: FeatureBlock[] = [
  // Payments
  { key: "stripe", name: "Stripe", category: "Payments", color: "#635bff" },
  { key: "paypal", name: "PayPal", category: "Payments", color: "#0070ba" },
  { key: "paddle", name: "Paddle", category: "Payments", color: "#fddc00" },
  { key: "lemonsqueezy", name: "Lemon Squeezy", category: "Payments", color: "#ffc233" },
  { key: "square", name: "Square", category: "Payments", color: "#3e4348" },
  { key: "braintree", name: "Braintree", category: "Payments", color: "#000000" },
  { key: "adyen", name: "Adyen", category: "Payments", color: "#0abf53" },
  { key: "razorpay", name: "Razorpay", category: "Payments", color: "#0c2451" },
  { key: "plaid", name: "Plaid", category: "Payments", color: "#000000" },
  { key: "chargebee", name: "Chargebee", category: "Payments", color: "#ff7846" },
  { key: "recurly", name: "Recurly", category: "Payments", color: "#7546ff" },
  // Auth
  { key: "auth0", name: "Auth0", category: "Auth", color: "#eb5424" },
  { key: "clerk", name: "Clerk", category: "Auth", color: "#6c47ff" },
  { key: "supabase-auth", name: "Supabase Auth", category: "Auth", color: "#3ecf8e" },
  { key: "firebase-auth", name: "Firebase Auth", category: "Auth", color: "#ffca28" },
  { key: "workos", name: "WorkOS", category: "Auth", color: "#6363f1" },
  { key: "okta", name: "Okta", category: "Auth", color: "#007dc1" },
  { key: "stytch", name: "Stytch", category: "Auth", color: "#19303d" },
  { key: "magic", name: "Magic", category: "Auth", color: "#6851ff" },
  { key: "nextauth", name: "NextAuth", category: "Auth", color: "#1f6feb" },
  { key: "kinde", name: "Kinde", category: "Auth", color: "#0a0a0a" },
  // Email
  { key: "resend", name: "Resend", category: "Email", color: "#000000" },
  { key: "sendgrid", name: "SendGrid", category: "Email", color: "#1a82e2" },
  { key: "postmark", name: "Postmark", category: "Email", color: "#ffde00" },
  { key: "mailgun", name: "Mailgun", category: "Email", color: "#f06b66" },
  { key: "loops", name: "Loops", category: "Email", color: "#1a1a1a" },
  { key: "customerio", name: "Customer.io", category: "Email", color: "#7131ff" },
  { key: "mailchimp", name: "Mailchimp", category: "Email", color: "#ffe01b" },
  { key: "sendinblue", name: "Brevo", category: "Email", color: "#0b996e" },
  // Messaging
  { key: "twilio", name: "Twilio", category: "Messaging", color: "#f22f46" },
  { key: "vonage", name: "Vonage", category: "Messaging", color: "#871fff" },
  { key: "messagebird", name: "Bird", category: "Messaging", color: "#2481d7" },
  { key: "sendbird", name: "Sendbird", category: "Messaging", color: "#742ddd" },
  { key: "stream", name: "Stream", category: "Messaging", color: "#005fff" },
  { key: "pubnub", name: "PubNub", category: "Messaging", color: "#ce2026" },
  { key: "pusher", name: "Pusher", category: "Messaging", color: "#300d4f" },
  { key: "agora", name: "Agora", category: "Messaging", color: "#099dfd" },
  { key: "daily", name: "Daily", category: "Messaging", color: "#1f2d3d" },
  { key: "livekit", name: "LiveKit", category: "Messaging", color: "#00b2ff" },
  // Push
  { key: "onesignal", name: "OneSignal", category: "Push", color: "#e54b4d" },
  { key: "fcm", name: "Firebase Messaging", category: "Push", color: "#ffca28" },
  { key: "knock", name: "Knock", category: "Push", color: "#e95744" },
  { key: "courier", name: "Courier", category: "Push", color: "#9d4dfa" },
  { key: "novu", name: "Novu", category: "Push", color: "#0081f1" },
  { key: "expo-push", name: "Expo Push", category: "Push", color: "#000020" },
  // Analytics
  { key: "posthog", name: "PostHog", category: "Analytics", color: "#f54e00" },
  { key: "mixpanel", name: "Mixpanel", category: "Analytics", color: "#7856ff" },
  { key: "amplitude", name: "Amplitude", category: "Analytics", color: "#1f6dff" },
  { key: "segment", name: "Segment", category: "Analytics", color: "#52bd95" },
  { key: "ga4", name: "Google Analytics", category: "Analytics", color: "#e8710a" },
  { key: "plausible", name: "Plausible", category: "Analytics", color: "#5850ec" },
  { key: "fathom", name: "Fathom", category: "Analytics", color: "#9269f0" },
  { key: "heap", name: "Heap", category: "Analytics", color: "#3c39d8" },
  { key: "june", name: "June", category: "Analytics", color: "#ff5e3a" },
  // AI
  { key: "openai", name: "OpenAI", category: "AI", color: "#10a37f" },
  { key: "anthropic", name: "Anthropic", category: "AI", color: "#d97757" },
  { key: "cohere", name: "Cohere", category: "AI", color: "#39594d" },
  { key: "replicate", name: "Replicate", category: "AI", color: "#000000" },
  { key: "huggingface", name: "Hugging Face", category: "AI", color: "#ffd21e" },
  { key: "pinecone", name: "Pinecone", category: "AI", color: "#1c17ff" },
  { key: "weaviate", name: "Weaviate", category: "AI", color: "#00c9a7" },
  { key: "langchain", name: "LangChain", category: "AI", color: "#1c3c3c" },
  { key: "elevenlabs", name: "ElevenLabs", category: "AI", color: "#000000" },
  { key: "deepgram", name: "Deepgram", category: "AI", color: "#13ef93" },
  { key: "assemblyai", name: "AssemblyAI", category: "AI", color: "#2545fc" },
  { key: "mistral", name: "Mistral", category: "AI", color: "#fa520f" },
  { key: "perplexity", name: "Perplexity", category: "AI", color: "#1fb8cd" },
  // Media
  { key: "mux", name: "Mux", category: "Media", color: "#fa50b5" },
  { key: "cloudinary", name: "Cloudinary", category: "Media", color: "#3448c5" },
  { key: "imgix", name: "imgix", category: "Media", color: "#c0ff00" },
  { key: "bunny", name: "Bunny", category: "Media", color: "#ff7a00" },
  { key: "livepeer", name: "Livepeer", category: "Media", color: "#00eb88" },
  { key: "cf-stream", name: "Cloudflare Stream", category: "Media", color: "#f6821f" },
  { key: "uploadthing", name: "UploadThing", category: "Media", color: "#e11d48" },
  // Storage
  { key: "s3", name: "Amazon S3", category: "Storage", color: "#e25444" },
  { key: "r2", name: "Cloudflare R2", category: "Storage", color: "#f6821f" },
  { key: "supabase-storage", name: "Supabase Storage", category: "Storage", color: "#3ecf8e" },
  { key: "gcs", name: "Google Cloud Storage", category: "Storage", color: "#4285f4" },
  { key: "backblaze", name: "Backblaze B2", category: "Storage", color: "#e21e29" },
  // Database
  { key: "supabase-db", name: "Supabase", category: "Database", color: "#3ecf8e" },
  { key: "planetscale", name: "PlanetScale", category: "Database", color: "#000000" },
  { key: "neon", name: "Neon", category: "Database", color: "#00e599" },
  { key: "mongodb", name: "MongoDB", category: "Database", color: "#47a248" },
  { key: "redis", name: "Redis", category: "Database", color: "#ff4438" },
  { key: "upstash", name: "Upstash", category: "Database", color: "#00e9a3" },
  { key: "turso", name: "Turso", category: "Database", color: "#4ff8d2" },
  { key: "prisma", name: "Prisma", category: "Database", color: "#2d3748" },
  { key: "drizzle", name: "Drizzle", category: "Database", color: "#c5f74f" },
  // Monitoring
  { key: "sentry", name: "Sentry", category: "Monitoring", color: "#362d59" },
  { key: "datadog", name: "Datadog", category: "Monitoring", color: "#632ca6" },
  { key: "logrocket", name: "LogRocket", category: "Monitoring", color: "#764abc" },
  { key: "bugsnag", name: "Bugsnag", category: "Monitoring", color: "#4949e7" },
  { key: "newrelic", name: "New Relic", category: "Monitoring", color: "#00ac69" },
  { key: "betterstack", name: "Better Stack", category: "Monitoring", color: "#6271ff" },
  { key: "axiom", name: "Axiom", category: "Monitoring", color: "#1a1a1a" },
  // Search
  { key: "algolia", name: "Algolia", category: "Search", color: "#003dff" },
  { key: "meilisearch", name: "Meilisearch", category: "Search", color: "#ff5caa" },
  { key: "typesense", name: "Typesense", category: "Search", color: "#d52196" },
  { key: "elastic", name: "Elasticsearch", category: "Search", color: "#fec514" },
  // Maps
  { key: "mapbox", name: "Mapbox", category: "Maps", color: "#000000" },
  { key: "google-maps", name: "Google Maps", category: "Maps", color: "#34a853" },
  { key: "radar", name: "Radar", category: "Maps", color: "#000257" },
  { key: "here", name: "HERE", category: "Maps", color: "#48dad0" },
  // CMS
  { key: "sanity", name: "Sanity", category: "CMS", color: "#f03e2f" },
  { key: "contentful", name: "Contentful", category: "CMS", color: "#2478cc" },
  { key: "strapi", name: "Strapi", category: "CMS", color: "#4945ff" },
  { key: "prismic", name: "Prismic", category: "CMS", color: "#5163ba" },
  { key: "storyblok", name: "Storyblok", category: "CMS", color: "#0ab3af" },
  { key: "payload", name: "Payload", category: "CMS", color: "#000000" },
  // Infra
  { key: "vercel", name: "Vercel", category: "Infra", color: "#000000" },
  { key: "netlify", name: "Netlify", category: "Infra", color: "#00c7b7" },
  { key: "railway", name: "Railway", category: "Infra", color: "#0b0d0e" },
  { key: "render", name: "Render", category: "Infra", color: "#5b4dff" },
  { key: "fly", name: "Fly.io", category: "Infra", color: "#7b3ff2" },
  { key: "cloudflare", name: "Cloudflare", category: "Infra", color: "#f6821f" },
  { key: "aws", name: "AWS", category: "Infra", color: "#ff9900" },
  { key: "docker", name: "Docker", category: "Infra", color: "#2496ed" },
  // Productivity
  { key: "slack", name: "Slack", category: "Productivity", color: "#4a154b" },
  { key: "discord", name: "Discord", category: "Productivity", color: "#5865f2" },
  { key: "notion", name: "Notion", category: "Productivity", color: "#000000" },
  { key: "linear", name: "Linear", category: "Productivity", color: "#5e6ad2" },
  { key: "github", name: "GitHub", category: "Productivity", color: "#1f2328" },
  { key: "zapier", name: "Zapier", category: "Productivity", color: "#ff4f00" },
  // Scheduling
  { key: "calcom", name: "Cal.com", category: "Scheduling", color: "#111827" },
  { key: "calendly", name: "Calendly", category: "Scheduling", color: "#006bff" },
  // Flags
  { key: "launchdarkly", name: "LaunchDarkly", category: "Flags", color: "#405bff" },
  { key: "statsig", name: "Statsig", category: "Flags", color: "#194b7d" },
  { key: "flagsmith", name: "Flagsmith", category: "Flags", color: "#1d1d39" },
  { key: "growthbook", name: "GrowthBook", category: "Flags", color: "#7b45e6" },
  // Mobile / Subscriptions
  { key: "revenuecat", name: "RevenueCat", category: "Mobile", color: "#f25a5a" },
  { key: "adapty", name: "Adapty", category: "Mobile", color: "#fd7a5e" },
  { key: "superwall", name: "Superwall", category: "Mobile", color: "#7c4dff" },
  { key: "expo", name: "Expo", category: "Mobile", color: "#000020" },
  { key: "branch", name: "Branch", category: "Mobile", color: "#3155ff" },
  { key: "appsflyer", name: "AppsFlyer", category: "Mobile", color: "#00c2c7" },
  // Support
  { key: "intercom", name: "Intercom", category: "Support", color: "#1f8ded" },
  { key: "zendesk", name: "Zendesk", category: "Support", color: "#03363d" },
  { key: "crisp", name: "Crisp", category: "Support", color: "#1972f5" },
  { key: "front", name: "Front", category: "Support", color: "#a857ff" },
  { key: "plain", name: "Plain", category: "Support", color: "#000000" },
];

// Starter checklist by category — pragmatic sub-steps a dev actually does to ship the integration.
const CATEGORY_CHECKLIST: Record<FeatureCategory, string[]> = {
  Payments: [
    "Create account & API keys",
    "Add SDK / client",
    "Build checkout flow",
    "Handle webhooks",
    "Test in sandbox",
  ],
  Auth: [
    "Set up project & keys",
    "Wire sign-in / sign-up",
    "Protect routes & sessions",
    "Add social providers",
    "Handle sign-out",
  ],
  Email: [
    "Verify sending domain",
    "Add API key",
    "Build templates",
    "Send transactional email",
    "Track opens / bounces",
  ],
  Messaging: [
    "Provision account",
    "Add SDK",
    "Send a test message",
    "Handle inbound / webhooks",
    "Add delivery status",
  ],
  Push: [
    "Register app & keys",
    "Request notification permission",
    "Store device tokens",
    "Send a test push",
    "Handle taps / deep links",
  ],
  Analytics: [
    "Add SDK & key",
    "Identify users",
    "Track key events",
    "Build a funnel / dashboard",
    "Verify in live data",
  ],
  AI: [
    "Get API key",
    "Add SDK",
    "Build the first prompt / call",
    "Stream / handle responses",
    "Add rate-limit & error handling",
  ],
  Media: [
    "Create account & key",
    "Upload / ingest pipeline",
    "Transform / encode",
    "Serve via CDN",
    "Test playback / delivery",
  ],
  Storage: [
    "Create bucket",
    "Add credentials",
    "Upload flow",
    "Signed URLs / access rules",
    "Test download",
  ],
  Database: [
    "Provision instance",
    "Connect & env vars",
    "Define schema / migrations",
    "Wire queries",
    "Add indexes & backups",
  ],
  Monitoring: [
    "Add SDK / DSN",
    "Capture errors",
    "Add source maps / context",
    "Set up alerts",
    "Verify an event lands",
  ],
  Search: [
    "Create index",
    "Add API keys",
    "Sync / index data",
    "Build search UI",
    "Tune relevance",
  ],
  Maps: [
    "Get API key",
    "Add map component",
    "Render markers",
    "Geocode / search",
    "Handle interactions",
  ],
  CMS: [
    "Create space / project",
    "Model content types",
    "Connect API",
    "Render content",
    "Set up preview / webhooks",
  ],
  Infra: [
    "Create project",
    "Connect repo / env vars",
    "Configure build",
    "Set up domains",
    "Add CI / deploy checks",
  ],
  Productivity: [
    "Create app / token",
    "Add integration",
    "Wire the key action",
    "Handle events / webhooks",
    "Test the flow",
  ],
  Scheduling: [
    "Connect calendar",
    "Add booking widget",
    "Set availability",
    "Handle bookings / webhooks",
    "Test end-to-end",
  ],
  Flags: [
    "Create project & key",
    "Add SDK",
    "Define first flag",
    "Gate a feature",
    "Set up targeting",
  ],
  Mobile: [
    "Create account & keys",
    "Add SDK",
    "Configure products / paywall",
    "Restore / sync entitlements",
    "Test on device",
  ],
  Support: [
    "Create workspace",
    "Add widget / SDK",
    "Identify users",
    "Route conversations",
    "Test inbound message",
  ],
};

export const BLOCK_BY_KEY = new Map(FEATURE_BLOCKS.map((b) => [b.key, b]));

/** dataTransfer MIME for dragging a block from the palette onto the canvas. */
export const DRAG_MIME = "application/x-feature-block";

/** A 1–2 letter monogram for the brand tile. */
export function monogram(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** A fresh checklist (all unchecked) for a block, from its category template. */
export function checklistFor(block: FeatureBlock): ChecklistStep[] {
  return CATEGORY_CHECKLIST[block.category].map((label) => ({ label, done: false }));
}
