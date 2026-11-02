import type { BlockOf, ProjectSource } from "./schema"

type Source = ProjectSource
type Arch = Pick<BlockOf<"architecture">, "nodes" | "edges">
type Metric = BlockOf<"metrics">["items"][number]
type Milestone = BlockOf<"timeline">["items"][number]

const image = (slug: string, file: string, alt: string, caption?: string) => ({
  src: `/lab-media/${slug}/${file}.webp`,
  alt,
  width: 1280,
  height: 800,
  caption,
})

/** The usual request path, reused (and tweaked) by most architecture diagrams. */
const requestPath = (service: string, data = "PostgreSQL", queue = "Redis queue"): Arch => ({
  nodes: [
    { id: "client", label: "Browser", kind: "client", x: 0, y: 0 },
    { id: "edge", label: "Edge cache", kind: "edge", x: 1, y: -1 },
    { id: "bff", label: "Next.js BFF", kind: "service", x: 1, y: 1 },
    { id: "api", label: service, kind: "service", x: 2, y: 0 },
    { id: "queue", label: queue, kind: "queue", x: 3, y: -1 },
    { id: "db", label: data, kind: "data", x: 3, y: 1 },
  ],
  edges: [
    { from: "client", to: "edge", label: "GET" },
    { from: "client", to: "bff", label: "session" },
    { from: "edge", to: "api" },
    { from: "bff", to: "api", label: "Bearer" },
    { from: "api", to: "queue", label: "dispatch" },
    { from: "api", to: "db", label: "SQL" },
    { from: "queue", to: "db" },
  ],
})

type Story = {
  slug: string
  title: string
  brief: string[]
  challenge: string[]
  bullets: string[]
  metrics: Metric[]
  arch: Arch
  archCaption: string
  gallery: [string, string, string]
  layout: "orbit" | "wall" | "stack"
  timeline: Milestone[]
  quote?: { text: string; author: string; role: string }
  code?: { title: string; language: string; code: string; caption?: string }
  video?: string
  model?: boolean
  stack: string[]
}

/** Builds the block list every case study shares, in reading order. */
function story(s: Story): Source["blocks"] {
  const blocks: Source["blocks"] = [
    { id: "brief", type: "chapter", kicker: "01 · request", title: "The brief" },
    { id: "brief-text", type: "richText", paragraphs: s.brief },
    { id: "impact", type: "metrics", title: "Response time, in numbers", items: s.metrics },
  ]
  if (s.video) {
    blocks.push({
      id: "walkthrough",
      type: "video",
      title: "Walkthrough",
      src: `/lab-media/${s.slug}/loop.mp4`,
      poster: `/lab-media/${s.slug}/poster.webp`,
      caption: s.video,
      loop: true,
    })
  }
  blocks.push(
    {
      id: "screens",
      type: "gallery",
      title: "Screens",
      layout: s.layout,
      images: s.gallery.map((caption, i) => image(s.slug, `gallery-${i + 1}`, `${s.title} screen ${i + 1}: ${caption}`, caption)),
    },
    { id: "build", type: "chapter", kicker: "02 · processing", title: "How it was built" },
    { id: "challenge", type: "richText", heading: "The hard part", paragraphs: s.challenge, bullets: s.bullets },
    { id: "architecture", type: "architecture", title: "Request path", caption: s.archCaption, ...s.arch },
  )
  if (s.model) {
    blocks.push({
      id: "hardware",
      type: "model",
      title: "The edge node",
      src: "/lab-media/models/edge-node.glb",
      caption: "Drag to orbit the unit that runs the on-site cache.",
      scale: 1.6,
      hotspots: [
        { position: [-0.5, 0.1, 0.55], label: "Status LEDs", text: "One per worker; the dashboard mirrors them live." },
        { position: [0.7, 0.75, -0.3], label: "LTE uplink", text: "Fails over from wired in under two seconds." },
        { position: [0, -0.12, 0.55], label: "Heartbeat strip", text: "Pulses on every sync with the central API." },
      ],
    })
  }
  if (s.code) blocks.push({ id: "code", type: "code", ...s.code })
  blocks.push(
    {
      id: "redesign",
      type: "beforeAfter",
      title: "Before and after",
      before: image(s.slug, "before", `${s.title} before the rebuild`),
      after: image(s.slug, "after", `${s.title} after the rebuild`),
      caption: "Drag the divider to compare.",
    },
    { id: "outcome", type: "chapter", kicker: "03 · response", title: "What shipped" },
    { id: "timeline", type: "timeline", title: "Timeline", items: s.timeline },
  )
  if (s.quote) blocks.push({ id: "quote", type: "quote", ...s.quote })
  blocks.push(
    { id: "stack", type: "techStack", title: "Stack", items: s.stack },
    {
      id: "next",
      type: "cta",
      title: "Building something like this?",
      text: "I take projects end to end, from the first pixel to the last row.",
      links: [
        { label: "Start a request", href: "/lab#response" },
        { label: "Back to the archive", href: "/lab/projects" },
      ],
    },
  )
  return blocks
}

type Meta = Omit<Source, "blocks" | "cover" | "stack" | "tags"> & { tags?: string[] }

function project(meta: Meta, s: Omit<Story, "slug" | "title">): Source {
  return {
    ...meta,
    stack: s.stack,
    tags: meta.tags ?? s.stack.slice(0, 2),
    cover: image(meta.slug, "cover", `${meta.title} cover`),
    blocks: story({ ...s, slug: meta.slug, title: meta.title }),
  }
}

export const PROJECT_SOURCES: Source[] = [
  project(
    {
      id: 1,
      slug: "commerce-engine",
      title: "Commerce Engine",
      subtitle: "Headless storefront with a Laravel order pipeline",
      summary: "Headless storefront with a Laravel order pipeline and a Next.js edge cache.",
      category: "product",
      year: 2026,
      role: "Lead full-stack",
      duration: "5 months",
      client: "Retail group",
      accent_color: "#34D399",
      scene: "grid",
      featured: true,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["Next.js", "Laravel", "PostgreSQL", "Redis", "TypeScript"],
      brief: [
        "A retail group was outgrowing a monolithic storefront: every flash sale took the checkout down with it.",
        "The ask was a storefront that stays fast under burst traffic, with an order pipeline the ops team can trust.",
      ],
      challenge: [
        "Catalog pages had to be cached at the edge while stock and prices stayed correct to the second.",
        "Orders needed exactly-once processing across payment webhooks, inventory holds and fulfilment.",
      ],
      bullets: ["Tag-based ISR revalidation per product", "Idempotent order jobs keyed by payment intent", "Read replicas for catalog queries"],
      metrics: [
        { label: "Checkout p95", value: 180, unit: "ms" },
        { label: "Conversion lift", value: 23, unit: "%", prefix: "+" },
        { label: "Peak orders / min", value: 1200 },
        { label: "Edge cache hit", value: 96, unit: "%" },
      ],
      arch: requestPath("Laravel orders API"),
      archCaption: "Catalog reads end at the edge; writes go through the BFF to an idempotent queue.",
      gallery: ["Storefront", "Ops dashboard", "Mobile checkout"],
      layout: "orbit",
      video: "Scrolling the storefront, the ops dashboard and mobile checkout.",
      timeline: [
        { date: "Jan", title: "Discovery", text: "Traffic replay of the last three sales." },
        { date: "Feb", title: "Order pipeline", text: "Queue-first checkout behind feature flags." },
        { date: "Apr", title: "Edge catalog", text: "ISR with per-product tags." },
        { date: "May", title: "Launch", text: "First sale with zero checkout errors." },
      ],
      quote: { text: "Our biggest sale ever, and nobody on the team had to stay up for it.", author: "Head of eCommerce", role: "Retail group" },
      code: {
        title: "Idempotent order job",
        language: "php",
        code: `final class PlaceOrder implements ShouldQueue, ShouldBeUnique
{
    public function __construct(public string $paymentIntent) {}

    public function uniqueId(): string
    {
        return $this->paymentIntent;
    }

    public function handle(Orders $orders): void
    {
        $orders->placeFromIntent($this->paymentIntent);
    }
}`,
      },
    },
  ),
  project(
    {
      id: 2,
      slug: "realtime-ops-board",
      title: "Realtime Ops Board",
      subtitle: "Live operations over websockets, scoped per role",
      summary: "Live operations dashboard over Reverb websockets with role-based views.",
      category: "platform",
      year: 2025,
      role: "Full-stack",
      duration: "3 months",
      client: "Logistics company",
      accent_color: "#22D3EE",
      scene: "ocean",
      featured: true,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["React", "Laravel", "Redis", "TypeScript", "Docker"],
      brief: [
        "Dispatchers were refreshing six spreadsheets to know where a truck was.",
        "The board had to show every vehicle, job and exception live, with each role seeing only what it should.",
      ],
      challenge: [
        "Thousands of position updates per minute had to reach the browser without melting it.",
        "Private channels needed the same authorization rules as the REST API.",
      ],
      bullets: ["Reverb channels authorized by policies", "Server-side batching into 250 ms frames", "Virtualized lists for 5k rows"],
      metrics: [
        { label: "Update latency", value: 120, unit: "ms" },
        { label: "Concurrent users", value: 340 },
        { label: "Calls to dispatch", value: 41, unit: "%", prefix: "-" },
      ],
      arch: {
        nodes: [
          { id: "client", label: "Ops board", kind: "client", x: 0, y: 0 },
          { id: "ws", label: "Reverb", kind: "edge", x: 1, y: -1 },
          { id: "api", label: "Laravel API", kind: "service", x: 1, y: 1 },
          { id: "queue", label: "Redis streams", kind: "queue", x: 2, y: -1 },
          { id: "db", label: "PostgreSQL", kind: "data", x: 2, y: 1 },
          { id: "gps", label: "GPS feed", kind: "service", x: 3, y: 0 },
        ],
        edges: [
          { from: "gps", to: "queue", label: "positions" },
          { from: "queue", to: "ws", label: "batch" },
          { from: "ws", to: "client", label: "push" },
          { from: "client", to: "api", label: "REST" },
          { from: "api", to: "db" },
          { from: "queue", to: "db" },
        ],
      },
      archCaption: "Positions stream through Redis, get batched, and are pushed over authorized channels.",
      gallery: ["Live board", "Event topology", "Driver app"],
      layout: "wall",
      video: "The board reacting to a live exception.",
      model: true,
      timeline: [
        { date: "Week 1", title: "Shadowing", text: "A day on the dispatch floor." },
        { date: "Week 4", title: "Channels", text: "Policies shared by REST and websockets." },
        { date: "Week 9", title: "Rollout", text: "Two depots, then all eleven." },
      ],
      quote: { text: "It's the first screen everyone opens in the morning.", author: "Operations lead", role: "Logistics company" },
    },
  ),
  project(
    {
      id: 3,
      slug: "media-pipeline",
      title: "Media Pipeline",
      subtitle: "Resumable uploads, HLS transcoding, custom player",
      summary: "Resumable uploads, HLS transcoding and a custom video player.",
      category: "platform",
      year: 2025,
      role: "Backend lead",
      duration: "4 months",
      client: null,
      accent_color: "#F59E0B",
      scene: "forge",
      featured: true,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["Laravel", "Docker", "Next.js", "PostgreSQL", "TypeScript"],
      brief: ["Editors were uploading 4 GB files over hotel Wi-Fi and losing them at 97%.", "The pipeline needed resumable uploads, adaptive streaming and a player that feels native."],
      challenge: ["Uploads had to survive dropped connections and browser restarts.", "Transcoding could not block the API or blow up storage costs."],
      bullets: ["tus protocol with signed upload tokens", "FFmpeg HLS ladders on a separate queue", "Poster frames picked from scene changes"],
      metrics: [
        { label: "Failed uploads", value: 98, unit: "%", prefix: "-" },
        { label: "Time to first frame", value: 0.8, unit: "s" },
        { label: "Storage saved", value: 37, unit: "%" },
      ],
      arch: requestPath("Laravel media API", "Object storage", "Transcode queue"),
      archCaption: "Uploads go straight to tusd; hooks hand finished files to a transcode queue.",
      gallery: ["Custom player", "Upload manager", "Hook handler"],
      layout: "stack",
      video: "Upload, resume after a drop, then adaptive playback.",
      timeline: [
        { date: "Month 1", title: "tus uploads", text: "Resumable uploads with signed tokens." },
        { date: "Month 2", title: "HLS ladder", text: "Four renditions per upload." },
        { date: "Month 4", title: "Player", text: "Video.js with custom controls." },
      ],
      code: {
        title: "Upload hook guard",
        language: "ts",
        code: `export async function POST(request: Request) {
  const hook = await verifyTusHook(request)
  if (hook.type !== "post-finish") return new Response(null, { status: 204 })
  await api.media.finish(hook.upload.id, { token: hook.upload.metaData.token })
  return new Response(null, { status: 204 })
}`,
      },
    },
  ),
  project(
    {
      id: 4,
      slug: "gatekeeper-bff",
      title: "Gatekeeper BFF",
      subtitle: "Session-first auth layer between Next.js and Laravel",
      summary: "A backend-for-frontend that keeps tokens off the browser and every request accounted for.",
      category: "open-source",
      year: 2026,
      role: "Author",
      duration: "Ongoing",
      client: null,
      accent_color: "#A78BFA",
      scene: "nebula",
      featured: true,
      live_url: null,
      source_url: "https://github.com/",
    },
    {
      stack: ["Next.js", "TypeScript", "Laravel", "Redis"],
      brief: ["Most Next.js plus Laravel apps leak API tokens into the browser.", "Gatekeeper keeps them server-side behind an encrypted session and a strict Origin gate."],
      challenge: ["Every mutating request needed CSRF-safe handling without breaking streaming responses.", "Session rotation had to work across tabs and devices."],
      bullets: ["Origin and Fetch-Metadata gates", "Encrypted, rotating session cookies", "Per-route rate limits backed by Redis"],
      metrics: [
        { label: "Tokens in the browser", value: 0 },
        { label: "Added latency", value: 4, unit: "ms" },
        { label: "Test coverage", value: 94, unit: "%" },
      ],
      arch: requestPath("Laravel Sanctum", "Session store", "Rate limiter"),
      archCaption: "The browser only ever talks to the BFF; the BFF holds the token.",
      gallery: ["Middleware chain", "Request graph", "Audit dashboard"],
      layout: "wall",
      timeline: [
        { date: "v0.1", title: "Session proxy", text: "Encrypted cookie, server-held token." },
        { date: "v0.4", title: "Origin gates", text: "Fetch-Metadata checks on every write." },
        { date: "v1.0", title: "Stable", text: "Used in three production apps." },
      ],
      code: {
        title: "Origin gate",
        language: "ts",
        code: `export function assertSameOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site")
  if (site && site !== "same-origin") throw new Forbidden("cross-site")
  const origin = request.headers.get("origin")
  if (origin && origin !== env.SITE_URL) throw new Forbidden("origin")
}`,
      },
    },
  ),
  project(
    {
      id: 5,
      slug: "the-request",
      title: "The Request",
      subtitle: "This portfolio, as one HTTP request",
      summary: "A scroll-driven 3D journey through the stack, built with React Three Fiber and Blender.",
      category: "experiment",
      year: 2026,
      role: "Design and build",
      duration: "Ongoing",
      client: null,
      accent_color: "#F472B6",
      scene: "nebula",
      featured: true,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["Three.js", "React", "Next.js", "TypeScript", "Tailwind"],
      brief: ["A portfolio that shows the work instead of listing it.", "You travel as a request from the browser to the database and back, meeting skills and projects on the way."],
      challenge: ["Keeping a full 3D scene under a few hundred kilobytes while staying readable without WebGL.", "Every station had to be real, indexable HTML first."],
      bullets: ["Meshopt GLBs baked in Blender", "Adaptive quality tiers with a poster fallback", "Spline camera driven by Lenis scroll"],
      metrics: [
        { label: "3D payload", value: 540, unit: "KB" },
        { label: "Stations", value: 6 },
        { label: "Frame rate on integrated GPU", value: 55, unit: "fps" },
      ],
      arch: {
        nodes: [
          { id: "client", label: "Browser City", kind: "client", x: 0, y: 0 },
          { id: "tunnel", label: "Fiber Tunnel", kind: "edge", x: 1, y: -1 },
          { id: "engine", label: "Laravel Engine", kind: "service", x: 2, y: 0 },
          { id: "vault", label: "Database Vault", kind: "data", x: 3, y: 1 },
          { id: "archive", label: "Archive", kind: "data", x: 3, y: -1 },
          { id: "response", label: "Response", kind: "queue", x: 1, y: 1 },
        ],
        edges: [
          { from: "client", to: "tunnel" },
          { from: "tunnel", to: "engine" },
          { from: "engine", to: "vault" },
          { from: "vault", to: "archive" },
          { from: "vault", to: "response" },
          { from: "response", to: "client", label: "200 OK" },
        ],
      },
      archCaption: "The journey itself is the architecture diagram.",
      gallery: ["Case study player", "Shader work", "Station overview"],
      layout: "orbit",
      video: "A full pass through the journey.",
      model: true,
      timeline: [
        { date: "Oct", title: "Concept", text: "The request as a story." },
        { date: "Nov", title: "Prototype", text: "Four stations and the vault." },
        { date: "Next", title: "Universe", text: "Archive, case studies and the response." },
      ],
    },
  ),
  project(
    {
      id: 6,
      slug: "clinic-booking",
      title: "Clinic Booking",
      subtitle: "Appointments, reminders and a doctor's day view",
      summary: "Patient booking with SMS reminders and a calm day view for doctors.",
      category: "client",
      year: 2024,
      role: "Full-stack",
      duration: "10 weeks",
      client: "Private clinic",
      accent_color: "#60A5FA",
      scene: "ocean",
      featured: false,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["Laravel", "PHP", "PostgreSQL", "Tailwind"],
      brief: ["Front-desk staff spent half the day on the phone moving appointments.", "Patients now book and reschedule themselves; doctors see a calm, single-screen day."],
      challenge: ["Double bookings had to be impossible, even with two receptionists on the same slot.", "Reminders needed to respect quiet hours and patient language."],
      bullets: ["Slot locks with database exclusion constraints", "Localized SMS and email reminders", "Day view that works on a tablet"],
      metrics: [
        { label: "No-shows", value: 52, unit: "%", prefix: "-" },
        { label: "Phone bookings", value: 70, unit: "%", prefix: "-" },
        { label: "Double bookings", value: 0 },
      ],
      arch: requestPath("Laravel booking API", "PostgreSQL", "Reminder queue"),
      archCaption: "Bookings hold a slot lock; reminders run on their own schedule.",
      gallery: ["Patient booking", "Doctor's day view", "Clinic site"],
      layout: "stack",
      timeline: [
        { date: "Week 1", title: "Front desk", text: "Mapping how bookings really happen." },
        { date: "Week 6", title: "Self-service", text: "Patients book and reschedule online." },
        { date: "Week 10", title: "Reminders", text: "SMS with quiet hours." },
      ],
      quote: { text: "The phone finally stopped ringing.", author: "Practice manager", role: "Private clinic" },
    },
  ),
  project(
    {
      id: 7,
      slug: "metric-forge",
      title: "Metric Forge",
      subtitle: "Event analytics on plain PostgreSQL",
      summary: "Product analytics without a data warehouse: partitioned Postgres and rollups.",
      category: "product",
      year: 2024,
      role: "Backend",
      duration: "3 months",
      client: null,
      accent_color: "#FB923C",
      scene: "forge",
      featured: false,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["PostgreSQL", "Redis", "Docker", "Laravel"],
      brief: ["A startup needed funnels and retention charts but not a five-figure warehouse bill.", "Metric Forge keeps raw events in partitioned Postgres and serves rollups in milliseconds."],
      challenge: ["Ingesting bursts of events without locking the tables used by dashboards.", "Keeping rollups fresh without recomputing the world."],
      bullets: ["Monthly partitions with BRIN indexes", "Incremental rollups every minute", "Redis buffer in front of inserts"],
      metrics: [
        { label: "Events / day", value: 18, unit: "M" },
        { label: "Dashboard query p95", value: 45, unit: "ms" },
        { label: "Infra cost vs warehouse", value: 88, unit: "%", prefix: "-" },
      ],
      arch: requestPath("Ingest API", "Partitioned Postgres", "Redis buffer"),
      archCaption: "Events buffer in Redis, land in partitions, and roll up incrementally.",
      gallery: ["Funnels", "Rollup SQL", "Partition map"],
      layout: "wall",
      timeline: [
        { date: "Month 1", title: "Ingest", text: "Buffered inserts at 2k events per second." },
        { date: "Month 2", title: "Rollups", text: "Incremental materialized views." },
        { date: "Month 3", title: "Dashboards", text: "Funnels and retention." },
      ],
      code: {
        title: "Incremental rollup",
        language: "sql",
        code: `insert into daily_events (day, event, total)
select date_trunc('day', created_at), name, count(*)
from events
where created_at >= :since
group by 1, 2
on conflict (day, event) do update set total = excluded.total;`,
      },
    },
  ),
  project(
    {
      id: 8,
      slug: "prism-ui",
      title: "Prism UI",
      subtitle: "Design system on Tailwind 4 and React 19",
      summary: "Token-driven component system shared by four products.",
      category: "open-source",
      year: 2025,
      role: "Author",
      duration: "Ongoing",
      client: null,
      accent_color: "#E879F9",
      scene: "nebula",
      featured: false,
      live_url: null,
      source_url: "https://github.com/",
    },
    {
      stack: ["React", "Tailwind", "TypeScript", "Next.js"],
      brief: ["Four products, four slightly different buttons.", "Prism turns one set of design tokens into accessible components every app can share."],
      challenge: ["Theming had to work at runtime without shipping CSS-in-JS.", "Every component needed keyboard and screen-reader parity."],
      bullets: ["CSS variables generated from tokens", "Headless primitives with styled variants", "Visual regression tests per variant"],
      metrics: [
        { label: "Components", value: 64 },
        { label: "Products using it", value: 4 },
        { label: "UI bugs reported", value: 60, unit: "%", prefix: "-" },
      ],
      arch: {
        nodes: [
          { id: "tokens", label: "Design tokens", kind: "data", x: 0, y: 0 },
          { id: "build", label: "Token build", kind: "service", x: 1, y: 0 },
          { id: "css", label: "CSS variables", kind: "edge", x: 2, y: -1 },
          { id: "lib", label: "Components", kind: "service", x: 2, y: 1 },
          { id: "apps", label: "Products", kind: "client", x: 3, y: 0 },
        ],
        edges: [
          { from: "tokens", to: "build" },
          { from: "build", to: "css" },
          { from: "build", to: "lib", label: "types" },
          { from: "css", to: "apps" },
          { from: "lib", to: "apps" },
        ],
      },
      archCaption: "Tokens compile to CSS variables and typed variants.",
      gallery: ["Docs site", "Mobile kit", "Token source"],
      layout: "orbit",
      timeline: [
        { date: "v1", title: "Tokens", text: "One source for color, type and spacing." },
        { date: "v2", title: "Tailwind 4", text: "Theme variables, no config file." },
        { date: "v3", title: "React 19", text: "Actions-ready form controls." },
      ],
    },
  ),
  project(
    {
      id: 9,
      slug: "shipyard",
      title: "Shipyard",
      subtitle: "Zero-downtime deploys for Laravel on Docker",
      summary: "Self-hosted deploy pipeline with health-checked container swaps.",
      category: "platform",
      year: 2024,
      role: "DevOps",
      duration: "6 weeks",
      client: null,
      accent_color: "#4ADE80",
      scene: "grid",
      featured: false,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["Docker", "Laravel", "Redis", "PostgreSQL"],
      brief: ["Deploys meant a maintenance page and a held breath.", "Shipyard builds images once, runs migrations safely, and swaps containers only when they are healthy."],
      challenge: ["Migrations and queue workers had to survive a deploy mid-job.", "Rollbacks needed to be one command, not a runbook."],
      bullets: ["Expand-and-contract migrations", "Graceful queue worker drain", "Blue/green swap behind the proxy"],
      metrics: [
        { label: "Deploy downtime", value: 0, unit: "s" },
        { label: "Deploy time", value: 3, unit: "min" },
        { label: "Rollback", value: 20, unit: "s" },
      ],
      arch: requestPath("Laravel app", "PostgreSQL", "Worker pool"),
      archCaption: "Traffic only moves to the new containers after they pass health checks.",
      gallery: ["Pipeline config", "Deploy history", "Health topology"],
      layout: "stack",
      timeline: [
        { date: "Week 1", title: "One image", text: "Build once, promote everywhere." },
        { date: "Week 3", title: "Safe migrations", text: "Expand, deploy, contract." },
        { date: "Week 6", title: "Blue/green", text: "Health-gated swaps." },
      ],
    },
  ),
  project(
    {
      id: 10,
      slug: "classroom-live",
      title: "Classroom Live",
      subtitle: "Live classes with recordings and quizzes",
      summary: "Live classes, recordings and in-class quizzes for a tutoring network.",
      category: "client",
      year: 2023,
      role: "Full-stack",
      duration: "4 months",
      client: "Tutoring network",
      accent_color: "#FACC15",
      scene: "ocean",
      featured: false,
      live_url: null,
      source_url: null,
    },
    {
      stack: ["Next.js", "Laravel", "PostgreSQL", "Docker"],
      brief: ["Tutors were juggling three tools to teach one class.", "Classroom Live puts the class, the recording and the quiz in one place."],
      challenge: ["Quizzes had to sync to every student at the same moment.", "Recordings needed to be ready minutes after class, not hours."],
      bullets: ["Server-timed quiz rounds", "Recording ingest through the media pipeline", "Offline-friendly student view"],
      metrics: [
        { label: "Weekly classes", value: 900 },
        { label: "Recording ready", value: 6, unit: "min" },
        { label: "Tools replaced", value: 3 },
      ],
      arch: requestPath("Laravel classes API", "PostgreSQL", "Media queue"),
      archCaption: "Live rounds are server-timed; recordings flow through the media pipeline.",
      gallery: ["Live class", "Student app", "Tutor dashboard"],
      layout: "wall",
      timeline: [
        { date: "Month 1", title: "Classes", text: "Scheduling and join links." },
        { date: "Month 3", title: "Quizzes", text: "Server-timed rounds." },
        { date: "Month 4", title: "Recordings", text: "Ready six minutes after class." },
      ],
    },
  ),
]
