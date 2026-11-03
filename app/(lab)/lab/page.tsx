import { ContactForm } from "@/components/lab/contact-form"
import { HeroTitle } from "@/components/lab/hero-title"
import { ProjectList } from "@/components/lab/project-list"
import { Reveal } from "@/components/lab/reveal"
import { RotatingText } from "@/components/lab/rotating-text"
import { ServicesPanel } from "@/components/lab/services-panel"
import { SetScene } from "@/components/lab/set-scene"
import { SkillList } from "@/components/lab/skill-list"
import { experiences, profile, projects, skills } from "@/content/lab/mock"
import { services } from "@/content/lab/services"

const panel = "pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#05070D]/60 p-6 backdrop-blur-md md:p-8"
const widePanel = "pointer-events-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#05070D]/60 p-6 backdrop-blur-md md:p-8"
const eyebrow = "font-mono text-[11px] tracking-[0.3em] uppercase"
const stage = "sticky top-0 flex h-svh items-end px-6 pb-24 md:items-center md:px-16 md:pb-0"
const link =
  "text-slate-400 transition hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"

const FOCUS = ["Full-stack developer", "SaaS builder", "Laravel + Next.js", "3D for the web"]
const since = experiences.at(-1)?.period.match(/\d{4}/)?.[0] ?? "2024"

/**
 * Every section is plain server-rendered HTML; the canvas behind it is the experience, not the
 * content. The sections follow `STATIONS` in order, and each is 150svh so that the scroll
 * distance between camera stops stays equal (the last one is one screen tall).
 */
export default function LabPage() {
  return (
    <>
      <SetScene scene={{ kind: "journey" }} />
      <div id="lab-track" className="pointer-events-none">
        <main>
          <section id="client" aria-labelledby="client-title" className="relative h-[150svh]">
            <div className={stage}>
              <div className="pointer-events-auto max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 font-mono text-[11px] text-emerald-200">
                  <span aria-hidden className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34D399]" />
                  Available for new projects
                </p>
                <div id="client-title" className="mt-5">
                  <HeroTitle>{profile.name}</HeroTitle>
                </div>
                <p className="mt-3 text-lg text-slate-200 md:text-xl">
                  <RotatingText items={FOCUS} className="text-cyan-200" /> · {profile.location}
                </p>
                <p className="mt-5 max-w-xl text-pretty text-slate-400">{profile.headline}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#contact"
                    className="inline-flex rounded-full border border-cyan-300/60 bg-cyan-300/15 px-5 py-2.5 font-mono text-sm text-cyan-50 transition hover:bg-cyan-300/25 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                  >
                    Hire me
                  </a>
                  <a
                    href="#vault"
                    className="inline-flex rounded-full border border-white/20 px-5 py-2.5 font-mono text-sm text-slate-200 transition hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none"
                  >
                    View projects ↓
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section id="tunnel" aria-labelledby="tunnel-title" className="relative h-[150svh]">
            <div className={stage}>
              <Reveal className={panel}>
                <p className={`${eyebrow} text-cyan-200`}>About</p>
                <h2 id="tunnel-title" className="mt-3 text-3xl font-semibold text-white">
                  The developer behind the request
                </h2>
                <p className="mt-4 text-slate-300">{profile.bio}</p>
                <dl className="mt-6 grid grid-cols-3 gap-3 font-mono text-xs">
                  {[
                    ["featured projects", String(projects.length)],
                    ["core technologies", String(skills.length)],
                    ["building since", since],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-white/10 p-3">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="mt-1 text-cyan-100">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </section>

          <section id="services" aria-labelledby="services-title" className="relative h-[150svh]">
            <div className={stage}>
              <Reveal className={widePanel}>
                <p className={`${eyebrow} text-fuchsia-300`}>Services</p>
                <h2 id="services-title" className="mt-3 text-3xl font-semibold text-white">
                  What I can build for you
                </h2>
                <div className="mt-5">
                  <ServicesPanel services={services} />
                </div>
              </Reveal>
            </div>
          </section>

          <section id="vault" aria-labelledby="vault-title" className="relative h-[150svh]">
            <div className={stage}>
              <Reveal className={panel}>
                <p className={`${eyebrow} text-emerald-300`}>Projects</p>
                <h2 id="vault-title" className="mt-3 text-3xl font-semibold text-white">
                  Selected projects
                </h2>
                <div className="mt-5">
                  <ProjectList projects={projects} skills={skills} />
                </div>
              </Reveal>
            </div>
          </section>

          <section id="engine" aria-labelledby="engine-title" className="relative h-[150svh]">
            <div className={stage}>
              <Reveal className={panel}>
                <p className={`${eyebrow} text-[#FF6A5F]`}>Skills</p>
                <h2 id="engine-title" className="mt-3 text-3xl font-semibold text-white">
                  Tech stack
                </h2>
                <div className="mt-5">
                  <SkillList skills={skills} projects={projects} />
                </div>
              </Reveal>
            </div>
          </section>

          <section id="experience" aria-labelledby="experience-title" className="relative h-[150svh]">
            <div className="sticky top-0 flex h-svh items-end px-6 pb-24 md:items-center md:justify-end md:pr-36 md:pl-16 md:pb-0">
              <Reveal className={panel}>
                <p className={`${eyebrow} text-amber-300`}>Experience</p>
                <h2 id="experience-title" className="mt-3 text-3xl font-semibold text-white">
                  Where I have worked
                </h2>
                <ol className="mt-6 border-l border-amber-300/30">
                  {experiences.map((xp, i) => (
                    <li key={xp.id} className="relative pb-6 pl-5 last:pb-0">
                      <span
                        aria-hidden
                        className="absolute top-1.5 -left-[5px] size-2.5 rounded-full"
                        style={{ background: xp.color, boxShadow: `0 0 12px ${xp.color}`, opacity: i === 0 ? 1 : 0.7 }}
                      />
                      <p className="font-mono text-[11px] tracking-wider uppercase" style={{ color: xp.color }}>
                        {xp.period}
                      </p>
                      <p className="mt-1 text-sm text-white">{xp.role}</p>
                      <p className="font-mono text-[11px] text-slate-400">{xp.company}</p>
                      {xp.summary ? <p className="mt-1 text-sm text-slate-400">{xp.summary}</p> : null}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>
          </section>

          <section id="contact" aria-labelledby="contact-title" className="relative h-[150svh]">
            <div className={stage}>
              <Reveal className={widePanel}>
                <p className={`${eyebrow} text-pink-300`}>Contact</p>
                <h2 id="contact-title" className="mt-3 text-3xl font-semibold text-white">
                  Tell me about your idea
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Or write directly:{" "}
                  <a href={`mailto:${profile.email}`} className="text-pink-200 underline-offset-4 hover:underline">
                    {profile.email}
                  </a>
                </p>
                <div className="mt-5">
                  <ContactForm />
                </div>
              </Reveal>
            </div>
          </section>
        </main>

        <footer id="footer" className="pointer-events-none relative flex h-svh flex-col justify-end px-6 pb-8 md:px-16">
          <h2 className="sr-only">{profile.name}</h2>
          <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 font-mono text-xs text-slate-400">
            <nav aria-label="Quick links" className="flex flex-wrap gap-x-5 gap-y-2">
              {[
                ["Home", "#client"],
                ["About", "#tunnel"],
                ["Services", "#services"],
                ["Projects", "#vault"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a key={href} href={href} className={link}>
                  {label}
                </a>
              ))}
              {profile.socials.map((social) => (
                <a key={social.label} href={social.url} target="_blank" rel="noreferrer" className={link}>
                  {social.label}
                </a>
              ))}
            </nav>
            <p>© {new Date().getFullYear()} {profile.name}</p>
          </div>
        </footer>
      </div>
    </>
  )
}
