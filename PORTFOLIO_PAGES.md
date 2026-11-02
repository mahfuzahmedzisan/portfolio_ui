# 3D Developer Portfolio: Pages ও Sections এর সম্পূর্ণ তালিকা

> লক্ষ্য: Remote job ও freelance marketplace-এ hire rate বাড়ানো।
> সাইটের সব পেজ 3D হবে। কিন্তু content, SEO ও performance যেন 3D-র নিচে চাপা না পড়ে।

---

## ০. ডিজাইন নীতি (সব পেজের জন্য প্রযোজ্য)

- **3D = অভিজ্ঞতা, HTML = তথ্য।** নাম, সার্ভিস, প্রজেক্টের বিবরণ সবসময় real HTML-এ থাকবে। 3D canvas থাকবে ব্যাকগ্রাউন্ডে বা ইন্টারঅ্যাকটিভ লেয়ারে, যাতে Google ও screen reader কনটেন্ট পড়তে পারে।
- **একটা persistent 3D scene:** পেজ বদলালে scene রিলোড হবে না, camera এক জায়গা থেকে অন্য জায়গায় সরবে। এতে সাইট একটা "জগৎ" মনে হবে এবং লোডও কম লাগবে।
- **Performance fallback:** দুর্বল ডিভাইস বা `prefers-reduced-motion` হলে Lite mode (static ছবি বা হালকা সিন)।
- **Skip / Lite toggle:** যে 3D দেখতে চায় না, তার জন্য সবসময় একটা বাটন।
- **১০০+ প্রজেক্টের জন্য:** 3D-তে instanced rendering ও virtualization ব্যবহার করতে হবে। একসাথে সব কার্ড 3D object হিসেবে লোড করা যাবে না।
- **Mobile:** আলাদা সরলীকৃত 3D সিন, ছোট texture, কম polygon।
- **প্রতিটা পেজে** অন্তত একটা "Hire Me" CTA থাকবে।

---

## ১. সব পেজে থাকা Global Elements

### Navbar
- লোগো / নাম
- Links: Home, Projects, Services, Blog, About, Contact
- "Hire Me" বাটন (highlighted)
- Availability badge (সবুজ ডট: "নতুন প্রজেক্টের জন্য Available")
- 3D / Lite mode toggle
- Dark / Light mode toggle
- সার্চ আইকন (Cmd/Ctrl + K)

### Footer
- Quick links
- Social links (GitHub, LinkedIn, Upwork, Fiverr, Freelancer, X ইত্যাদি)
- ইমেইল ও WhatsApp
- Newsletter সাবস্ক্রিপশন
- Copyright ও Legal links

### Floating / Utility
- Floating "Hire Me" বা WhatsApp বাটন
- Global search palette (প্রজেক্ট, ব্লগ, পেজ সার্চ)
- Scroll progress indicator
- Custom cursor (ঐচ্ছিক, শুধু desktop)
- Sound toggle (ঐচ্ছিক, ডিফল্ট mute)
- Cookie / Analytics consent banner
- Page transition animation (camera movement)

---

## ২. Home (`/`)

**3D concept:** পুরো সাইটের মূল জগৎ। Scroll করলে camera এগোয়, প্রতিটা সেকশনে scene বদলায়।

1. **Loading / Intro screen**
   - প্রগ্রেস ইন্ডিকেটর, ব্র্যান্ড অ্যানিমেশন
   - "Skip intro" বাটন
2. **Hero**
   - নাম, এক লাইনের value proposition
   - Typing / rotating text (যেমন: Full-stack Developer · SaaS Builder · 3D Web)
   - CTA: "Hire Me", "View Projects"
   - Availability badge
   - বড় 3D scene (floating objects, interactive room বা particle logo)
3. **Marketplace Proof / Trust bar**
   - Upwork, Fiverr ইত্যাদির রেটিং, Top Rated badge, completed jobs
   - প্রোফাইল লিংক
4. **Stats / Numbers**
   - প্রজেক্ট সংখ্যা (100+, অটো-আপডেট), অভিজ্ঞতার বছর, happy clients, দেশ সংখ্যা
   - Animated counter
5. **About সংক্ষেপে**
   - ছোট ইন্ট্রো, ছবি বা 3D অ্যাভাটার, "আরও জানো" লিংক
6. **Services সামারি**
   - ৪-৬টা কার্ড, "সব সার্ভিস দেখো" লিংক
7. **Featured Projects**
   - সেরা ৬-৮টা প্রজেক্ট (3D carousel বা gallery)
   - "সব প্রজেক্ট দেখো (১০০+)" বাটন
8. **Tech Stack**
   - 3D floating আইকন বা orbiting sphere
   - Hover করলে স্কিলের নাম ও সংশ্লিষ্ট প্রজেক্ট সংখ্যা
9. **Process / কীভাবে কাজ করি**
   - Discovery → Design → Development → Delivery → Support
   - 3D path বা স্টেপ-বাই-স্টেপ অ্যানিমেশন
10. **Testimonials**
    - ২-৩টা সেরা রিভিউ, প্ল্যাটফর্ম লোগো সহ
11. **Latest Blog / Case Studies**
    - ২-৩টা লেটেস্ট পোস্ট
12. **Final CTA**
    - "চলো একসাথে কাজ করি" সেকশন, Contact লিংক ও ইমেইল

---

## ৩. About (`/about`)

**3D concept:** তোমার workspace বা desk-এর 3D সিন, এক একটা object-এ ক্লিক করলে এক একটা গল্প।

1. Hero: ছবি বা 3D অ্যাভাটার, শিরোনাম
2. তোমার গল্প (কীভাবে ডেভেলপার হলে, কী ধরনের কাজ ভালোবাসো)
3. Work philosophy / মূল্যবোধ
4. কোন ধরনের ক্লায়েন্ট ও প্রজেক্টে কাজ করতে চাও
5. Skills সামারি
6. Career timeline (3D path বা interactive timeline)
7. Tools ও workflow (কোন tool দিয়ে কাজ করো)
8. ব্যক্তিগত দিক: শখ, fun facts, ভাষা, টাইমজোন
9. Resume ডাউনলোড বাটন
10. CTA

---

## ৪. Projects (`/projects`)

**3D concept:** Gallery বা Museum। প্রতিটা প্রজেক্ট একটা frame বা floating card। ১০০+ হওয়ায় virtualized grid ও instanced rendering বাধ্যতামূলক।

1. Page header: শিরোনাম, মোট প্রজেক্ট সংখ্যা (ডেটাবেস থেকে অটো)
2. Search bar
3. Filters
   - ক্যাটাগরি: E-commerce, SaaS, Dashboard / Admin, API / Backend, CMS, Mobile, 3D / WebGL, Landing Page, অন্যান্য
   - Tech stack: React, Next.js, Laravel, Node.js, Django, Livewire ইত্যাদি
   - ইন্ডাস্ট্রি, সাল, প্রজেক্টের ধরন (Client / Personal / Open source)
4. Sorting: Newest, Featured, Most viewed
5. View toggle: 3D Gallery / Grid / List
6. Pinned Featured প্রজেক্ট
7. Project cards
   - থাম্বনেইল বা ছোট ভিডিও প্রিভিউ, টাইটেল, এক লাইনের বিবরণ
   - টেক ট্যাগ, Live / GitHub আইকন
8. Pagination বা "Load more" / infinite scroll
9. Empty state (ফিল্টারে কিছু না মিললে)
10. CTA: "পছন্দের কিছু পেলে না? আলোচনা করো"

**ডেটা মডেল (সংক্ষেপে):** slug, title, summary, category, tags, techStack, year, role, client, thumbnail, gallery, liveUrl, githubUrl, featured, order, content (MDX)। প্রজেক্ট যত বাড়বে, CMS বা ডেটাবেস থেকে আসবে, কোডে hardcode না।

---

## ৫. Project Details (`/projects/[slug]`)

**3D concept:** প্রজেক্টের device mockup (laptop / phone) 3D-তে ঘোরানো যায়, স্ক্রিনে live ডেমো বা স্ক্রিনশট।

1. Hero: টাইটেল, ক্যাটাগরি, সাল, তোমার ভূমিকা
2. 3D device mockup বা ডেমো ভিডিও
3. Quick info sidebar: Client, Duration, Role, Tech stack, Status
4. Overview
5. Problem / Challenge
6. Solution / Approach
7. Key features
8. Architecture / Tech decisions (কেন এই স্ট্যাক)
9. স্ক্রিনশট গ্যালারি (lightbox)
10. Results / Impact (সংখ্যা সহ, যদি থাকে)
11. Client testimonial (যদি থাকে)
12. Lessons learned
13. Live link ও GitHub link বাটন
14. Previous / Next প্রজেক্ট
15. Related projects
16. CTA: "এরকম কিছু দরকার?"

---

## ৬. Services (`/services`)

**3D concept:** প্রতিটা সার্ভিস একটা আলাদা 3D object বা platform।

1. Hero: কী কী সমাধান দাও
2. সার্ভিস তালিকা
   - Full-stack web application
   - E-commerce / Multi-vendor / Multi-tenant
   - SaaS development
   - API ও backend development
   - Admin dashboard / ERP / POS
   - 3D / Interactive web experience
   - Maintenance, optimization ও support
3. প্রতিটা সার্ভিসে: কী পাবে, deliverables, ব্যবহৃত টেক, আনুমানিক সময়, সংশ্লিষ্ট প্রজেক্ট
4. কীভাবে কাজ করি (Process)
5. Engagement মডেল: Fixed price, Hourly, Monthly retainer
6. সংশ্লিষ্ট Testimonials
7. FAQ
8. CTA

---

## ৭. Blog / Case Studies (`/blog`)

**3D concept:** লাইব্রেরি বা bookshelf। হালকা 3D, কারণ পড়ার পেজ দ্রুত হওয়া দরকার।

1. Page header
2. ক্যাটাগরি ট্যাব: All, Case Studies, Tutorials, Articles, Updates
3. Search ও ট্যাগ ফিল্টার
4. Featured পোস্ট
5. পোস্ট কার্ড: থাম্বনেইল, টাইটেল, তারিখ, পড়ার সময়, ট্যাগ
6. Pagination
7. Newsletter সাবস্ক্রিপশন
8. RSS ফিড লিংক

---

## ৮. Blog Post Details (`/blog/[slug]`)

1. Hero: টাইটেল, তারিখ, পড়ার সময়, ক্যাটাগরি, কভার ইমেজ
2. Sticky Table of Contents
3. মূল কনটেন্ট (কোড হাইলাইটিং, ছবি, ডায়াগ্রাম, embed)
4. **Case study হলে অতিরিক্ত:** Background, Challenge, Approach, Solution, Result (সংখ্যা সহ), Learnings
5. Share বাটন
6. লেখক বক্স
7. Related posts
8. Newsletter / Hire Me CTA
9. মন্তব্য (ঐচ্ছিক)
10. Previous / Next পোস্ট

---

## ৯. Skills / Tech Stack (`/skills`)

**3D concept:** Orbiting skill sphere বা skill galaxy, ক্লিক করলে সংশ্লিষ্ট প্রজেক্ট ফিল্টার হয়ে `/projects`-এ যায়।

1. Hero
2. ক্যাটাগরি: Frontend, Backend, Database, DevOps / Cloud, Tools, 3D / Creative
3. প্রতিটা স্কিলে: অভিজ্ঞতার বছর, দক্ষতার স্তর, কতগুলো প্রজেক্টে ব্যবহার করেছো
4. Certifications
5. বর্তমানে যা শিখছো
6. CTA

---

## ১০. Resume / Experience (`/resume`)

1. সংক্ষিপ্ত সারাংশ
2. Work experience timeline
3. Education
4. Certifications ও Achievements
5. Skills সামারি
6. PDF CV ডাউনলোড
7. প্রোফাইল লিংক (LinkedIn, GitHub, marketplace)

---

## ১১. Testimonials (`/testimonials`)

1. Hero: রেটিং সামারি
2. সব রিভিউ (প্ল্যাটফর্ম অনুযায়ী ফিল্টার: Upwork, Fiverr, Direct)
3. ক্লায়েন্টের নাম, দেশ, প্রজেক্টের লিংক
4. ভেরিফিকেশন (স্ক্রিনশট বা প্ল্যাটফর্ম লিংক)
5. Video testimonial (যদি থাকে)
6. CTA

---

## ১২. Pricing / Packages (`/pricing`) *(ঐচ্ছিক)*

1. প্যাকেজ কার্ড: Starter, Standard, Premium (বা "Starting from" রেট)
2. প্রতিটায় কী কী অন্তর্ভুক্ত
3. তুলনা টেবিল
4. Custom quote অপশন
5. পেমেন্ট শর্ত ও রিভিশন পলিসি
6. FAQ
7. CTA

---

## ১৩. Lab / Playground (`/lab`) *(ঐচ্ছিক)*

1. ছোট 3D experiments ও interactive demos
2. প্রতিটায়: ডেমো, সংক্ষিপ্ত বিবরণ, ব্যবহৃত টেক, source code লিংক
3. Open source contributions

---

## ১৪. Contact / Hire Me (`/contact`)

**3D concept:** শেষ গন্তব্য। Scene-এ একটা "launch pad" বা "mailbox", ফর্ম সাবমিট করলে অ্যানিমেশন।

1. Hero: "তোমার আইডিয়া নিয়ে কথা বলি"
2. Contact form: নাম, ইমেইল, প্রজেক্টের ধরন, বাজেট রেঞ্জ, টাইমলাইন, বিবরণ, ফাইল আপলোড (ঐচ্ছিক)
3. সরাসরি যোগাযোগ: ইমেইল, WhatsApp, LinkedIn, Telegram
4. Call বুকিং (Calendly বা Cal.com)
5. Availability স্ট্যাটাস, টাইমজোন, কাজের সময়
6. Response time ("২৪ ঘণ্টার মধ্যে উত্তর")
7. Marketplace প্রোফাইল লিংক ("Upwork-এ হায়ার করো")
8. ছোট FAQ
9. Success / Error state

---

## ১৫. FAQ (`/faq`) *(ঐচ্ছিক, Contact বা Pricing-এ মার্জ করা যায়)*

1. Availability ও টাইমজোন
2. যোগাযোগ ও রিপোর্টিং পদ্ধতি
3. Revision পলিসি
4. পেমেন্ট শর্ত
5. Maintenance ও সাপোর্ট
6. NDA ও কোড ownership
7. কোন টেক ও প্রজেক্ট নাও / নাও না

---

## ১৬. সিস্টেম ও Legal পেজ

- `/404`: 3D থিমের "হারিয়ে গেছো" পেজ, Home ও Projects লিংক সহ
- `/privacy-policy`
- `/terms`
- `/thank-you`: ফর্ম সাবমিটের পর
- `/sitemap.xml`, `/robots.txt`, `/rss.xml`

---

## ১৭. রুট সারাংশ

| পেজ | রুট | অগ্রাধিকার |
|---|---|---|
| Home | `/` | Must |
| About | `/about` | Must |
| Projects | `/projects` | Must |
| Project Details | `/projects/[slug]` | Must |
| Services | `/services` | Must |
| Blog / Case Studies | `/blog` | Must |
| Blog Post | `/blog/[slug]` | Must |
| Contact / Hire Me | `/contact` | Must |
| Testimonials | `/testimonials` | Should |
| Resume | `/resume` | Should |
| Skills | `/skills` | Should |
| Pricing | `/pricing` | Optional |
| Lab | `/lab` | Optional |
| FAQ | `/faq` | Optional |
| 404 / Legal / Thank you | `/404` ইত্যাদি | Must |

---

## ১৮. SEO ও Technical চেকলিস্ট

- প্রতিটা পেজে আলাদা `title`, `description`, Open Graph ছবি
- প্রতিটা প্রজেক্ট ও ব্লগে dynamic OG image
- Structured data (Person, Project, Article, Review)
- Sitemap ও robots.txt
- Image optimization, lazy loading, compressed GLB (Draco / Meshopt)
- Core Web Vitals লক্ষ্য: LCP < 2.5s, CLS < 0.1
- Analytics (কোন প্রজেক্ট ও পেজ বেশি দেখা হচ্ছে)
- Accessibility: keyboard navigation, alt text, reduced motion সাপোর্ট

---

## ১৯. প্রস্তাবিত স্ট্যাক

- **Framework:** Next.js (App Router)
- **3D:** React Three Fiber, Drei, Three.js
- **Animation:** GSAP, Framer Motion
- **কনটেন্ট:** MDX বা Headless CMS (Sanity / Strapi) বা Laravel API, কারণ প্রজেক্ট ১০০+ এবং বাড়বে
- **ফর্ম / ইমেইল:** Server action বা API route + Resend / Nodemailer
- **হোস্টিং:** Vercel
