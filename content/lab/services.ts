/** Client-safe services content: shared by the 3D platform and the HTML panel. */

export type ServiceModel = "Svc_Fullstack" | "Svc_Ecom" | "Svc_Saas" | "Svc_Api" | "Svc_Admin" | "Svc_3d" | "Svc_Support"

export type LabService = {
  id: string
  /** Node in `services.glb` drawn on this service's pedestal. */
  model: ServiceModel
  title: string
  /** Short label under the 3D card. */
  short: string
  summary: string
  deliverables: string[]
  stack: string[]
  /** A typical range, not a quote. */
  timeline: string
  accent: string
}

export const services: LabService[] = [
  {
    id: "full-stack",
    model: "Svc_Fullstack",
    title: "Full-stack web applications",
    short: "Full-stack",
    summary: "Complete products from schema to interface: typed APIs, authentication, and a UI that stays fast under real data.",
    deliverables: ["Next.js front end", "Laravel or Node API", "Auth and roles", "Deployed and documented"],
    stack: ["Next.js", "React", "TypeScript", "Laravel", "PostgreSQL"],
    timeline: "4–10 weeks",
    accent: "#22D3EE",
  },
  {
    id: "ecommerce",
    model: "Svc_Ecom",
    title: "E-commerce & multi-vendor stores",
    short: "E-commerce",
    summary: "Catalogues, carts, checkout and vendor tooling, built to survive sale-day traffic and messy inventory.",
    deliverables: ["Storefront and checkout", "Vendor or tenant dashboards", "Payments and orders", "SEO-ready product pages"],
    stack: ["Next.js", "Laravel", "PostgreSQL", "Redis", "Stripe"],
    timeline: "6–12 weeks",
    accent: "#FBBF24",
  },
  {
    id: "saas",
    model: "Svc_Saas",
    title: "SaaS development",
    short: "SaaS",
    summary: "Multi-tenant products with billing, onboarding and the admin tooling that lets a small team run them.",
    deliverables: ["Multi-tenant architecture", "Subscriptions and billing", "Onboarding flows", "Usage and audit logs"],
    stack: ["Laravel", "Next.js", "PostgreSQL", "Redis", "Docker"],
    timeline: "8–16 weeks",
    accent: "#C084FC",
  },
  {
    id: "api",
    model: "Svc_Api",
    title: "API & backend development",
    short: "API & backend",
    summary: "Secure, versioned REST APIs with queues, caching and tests, ready for web and mobile clients.",
    deliverables: ["REST or JSON:API endpoints", "Queues and scheduled jobs", "Rate limiting and caching", "OpenAPI documentation"],
    stack: ["Laravel", "PHP", "PostgreSQL", "Redis", "Docker"],
    timeline: "2–8 weeks",
    accent: "#34D399",
  },
  {
    id: "dashboards",
    model: "Svc_Admin",
    title: "Admin, ERP & POS dashboards",
    short: "Dashboards",
    summary: "Operational software for inventory, orders and reports, designed around the people who use it all day.",
    deliverables: ["Role-based admin panel", "Reports and exports", "Inventory and POS flows", "Audit trail"],
    stack: ["Next.js", "Tailwind", "Laravel", "PostgreSQL"],
    timeline: "4–12 weeks",
    accent: "#38BDF8",
  },
  {
    id: "interactive-3d",
    model: "Svc_3d",
    title: "3D & interactive web experiences",
    short: "3D & WebGL",
    summary: "Scroll-driven 3D sites and product viewers that look striking and still load fast and read well.",
    deliverables: ["React Three Fiber scenes", "Optimised GLB assets", "Lite mode for weak devices", "Accessible HTML content"],
    stack: ["Three.js", "React Three Fiber", "GSAP", "Blender"],
    timeline: "3–8 weeks",
    accent: "#F472B6",
  },
  {
    id: "support",
    model: "Svc_Support",
    title: "Maintenance, optimisation & support",
    short: "Support",
    summary: "Performance audits, upgrades, bug fixing and monthly care for products that are already live.",
    deliverables: ["Performance audit", "Framework upgrades", "Monitoring and fixes", "Monthly retainer option"],
    stack: ["Next.js", "Laravel", "Docker", "Sentry"],
    timeline: "Ongoing or 1–3 weeks",
    accent: "#FF5A4E",
  },
]
