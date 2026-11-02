import { HeroTitle } from "@/components/lab/hero-title"
import { LabShell } from "@/components/lab/lab-shell"
import { ProjectList } from "@/components/lab/project-list"
import { Reveal } from "@/components/lab/reveal"
import { SkillList } from "@/components/lab/skill-list"
import { experiences, profile, projects, skills } from "@/content/lab/mock"

const panel = "pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#05070D]/60 p-6 backdrop-blur-md md:p-8"
const eyebrow = "font-mono text-[11px] tracking-[0.3em] uppercase"

/**
 * Every station's content is plain server-rendered HTML; the canvas behind it
 * is decoration. Section heights set the scroll distance between stations.
 */
export default function LabPage() {
  return (
    <LabShell skills={skills} experiences={experiences} projects={projects}>
      <main id="lab-track" className="pointer-events-none">
        <section id="client" aria-labelledby="client-title" className="relative h-[150svh]">
          <div className="sticky top-0 flex h-svh items-end px-6 pb-24 md:items-center md:px-16 md:pb-0">
            <div className="pointer-events-auto max-w-2xl">
              <p className={`${eyebrow} text-cyan-300`}>01 · Browser City · GET /mahfuz-ahmed</p>
              <div id="client-title" className="mt-4">
                <HeroTitle>{profile.name}</HeroTitle>
              </div>
              <p className="mt-3 text-lg text-slate-300 md:text-xl">
                {profile.role} · {profile.location}
              </p>
              <p className="mt-6 max-w-xl text-pretty text-slate-400">{profile.headline}</p>
              <a
                href="#tunnel"
                className="mt-8 inline-flex rounded-full border border-cyan-300/50 bg-cyan-300/10 px-5 py-2.5 font-mono text-sm text-cyan-100 transition hover:bg-cyan-300/20 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
              >
                Send request ↓
              </a>
            </div>
          </div>
        </section>

        <section id="tunnel" aria-labelledby="tunnel-title" className="relative h-[150svh]">
          <div className="sticky top-0 flex h-svh items-end px-6 pb-24 md:items-center md:px-16 md:pb-0">
            <Reveal className={panel}>
              <p className={`${eyebrow} text-cyan-200`}>02 · Fiber Tunnel · in transit</p>
              <h2 id="tunnel-title" className="mt-3 text-3xl font-semibold text-white">
                About the request
              </h2>
              <p className="mt-4 text-slate-300">{profile.bio}</p>
              <dl className="mt-6 grid grid-cols-3 gap-3 font-mono text-xs">
                {[
                  ["latency", "38ms"],
                  ["hops", "7"],
                  ["protocol", "HTTP/2"],
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

        <section id="engine" aria-labelledby="engine-title" className="relative h-[150svh]">
          <div className="sticky top-0 flex h-svh items-end px-6 pb-24 md:items-center md:px-16 md:pb-0">
            <Reveal className={panel}>
              <p className={`${eyebrow} text-[#FF6A5F]`}>03 · Laravel Engine · services</p>
              <h2 id="engine-title" className="mt-3 text-3xl font-semibold text-white">
                Skills & experience
              </h2>
              <div className="mt-5">
                <SkillList skills={skills} />
              </div>
              <h3 className="mt-6 font-mono text-xs tracking-widest text-slate-500 uppercase">Job queue</h3>
              <ol className="mt-3 space-y-3">
                {experiences.map((xp) => (
                  <li key={xp.id} className="border-l border-[#FF2D20]/50 pl-3">
                    <p className="text-sm text-white">
                      {xp.role} <span className="text-slate-500">@ {xp.company}</span>
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">{xp.period}</p>
                    <p className="mt-1 text-sm text-slate-400">{xp.summary}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        <section id="vault" aria-labelledby="vault-title" className="relative h-svh">
          <div className="flex h-svh items-end px-6 pb-24 md:items-center md:px-16 md:pb-0">
            <Reveal className={panel}>
              <p className={`${eyebrow} text-emerald-300`}>04 · Database Vault · SELECT * FROM projects</p>
              <h2 id="vault-title" className="mt-3 text-3xl font-semibold text-white">
                Selected projects
              </h2>
              <div className="mt-5">
                <ProjectList projects={projects} />
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#05070D] px-6 py-10 font-mono text-xs text-slate-500 md:px-16">
        Prototype · The Request · next stations: Gateway, Cache Archive, Response Highway.
      </footer>
    </LabShell>
  )
}
