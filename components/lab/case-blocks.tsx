import type { Block, LabCaseStudy, ProjectImage } from "@/content/lab/projects"

const card = "pointer-events-auto rounded-2xl border border-white/10 bg-[#05070D]/65 p-6 backdrop-blur-md md:p-8"
const kicker = "font-mono text-[11px] tracking-[0.3em] uppercase"

function Img({ image, className }: { image: ProjectImage; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local case-study stills with known dimensions
    <img src={image.src} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" className={className} />
  )
}

function BlockView({ block, accent }: { block: Block; accent: string }) {
  switch (block.type) {
    case "chapter":
      return (
        <header className="pt-10">
          <p className={kicker} style={{ color: accent }}>
            {block.kicker}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white md:text-4xl">{block.title}</h2>
        </header>
      )
    case "richText":
      return (
        <div className={card}>
          {block.heading ? <h3 className="text-xl font-semibold text-white">{block.heading}</h3> : null}
          {block.paragraphs.map((p) => (
            <p key={p} className="mt-3 text-slate-300 first:mt-0">
              {p}
            </p>
          ))}
          {block.bullets ? (
            <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
              {block.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full" style={{ background: accent }} />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )
    case "gallery":
      return (
        <figure className={card}>
          <figcaption className="mb-4 text-lg font-semibold text-white">{block.title}</figcaption>
          <div className="grid gap-3 sm:grid-cols-2">
            {block.images.map((image) => (
              <figure key={image.src}>
                <Img image={image} className="h-auto w-full rounded-lg border border-white/10" />
                {image.caption ? <figcaption className="mt-1 text-xs text-slate-500">{image.caption}</figcaption> : null}
              </figure>
            ))}
          </div>
        </figure>
      )
    case "video":
      return (
        <figure className={card}>
          <figcaption className="mb-3 text-lg font-semibold text-white">{block.title}</figcaption>
          <video
            src={block.src}
            poster={block.poster}
            muted
            playsInline
            controls
            loop={block.loop}
            preload="none"
            className="w-full rounded-lg border border-white/10"
          />
          {block.caption ? <p className="mt-2 text-xs text-slate-500">{block.caption}</p> : null}
        </figure>
      )
    case "metrics":
      return (
        <div className={card}>
          <h3 className="text-lg font-semibold text-white">{block.title}</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {block.items.map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 p-3">
                <dd className="text-2xl font-semibold" style={{ color: accent }}>
                  {item.prefix}
                  {item.value.toLocaleString("en-US")}
                  {item.unit}
                </dd>
                <dt className="mt-1 font-mono text-[11px] text-slate-400">{item.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      )
    case "techStack":
      return (
        <div className={card}>
          <h3 className="text-lg font-semibold text-white">{block.title}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {block.items.map((item) => (
              <li key={item} className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-xs text-slate-300">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )
    case "timeline":
      return (
        <div className={card}>
          <h3 className="text-lg font-semibold text-white">{block.title}</h3>
          <ol className="mt-4 border-l border-white/15">
            {block.items.map((item) => (
              <li key={item.title} className="relative pb-5 pl-5 last:pb-0">
                <span aria-hidden className="absolute top-1.5 -left-[5px] size-2.5 rounded-full" style={{ background: accent }} />
                <p className="font-mono text-[11px] text-slate-500">{item.date}</p>
                <p className="mt-0.5 text-sm font-medium text-white">{item.title}</p>
                <p className="text-sm text-slate-400">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )
    case "architecture":
      return (
        <div className={card}>
          <h3 className="text-lg font-semibold text-white">{block.title}</h3>
          <ul className="mt-3 space-y-1.5 font-mono text-xs text-slate-300">
            {block.edges.map((edge) => {
              const label = (id: string) => block.nodes.find((n) => n.id === id)?.label ?? id
              return (
                <li key={`${edge.from}-${edge.to}`}>
                  {label(edge.from)} <span style={{ color: accent }}>→</span> {label(edge.to)}
                  {edge.label ? <span className="text-slate-500"> · {edge.label}</span> : null}
                </li>
              )
            })}
          </ul>
          {block.caption ? <p className="mt-3 text-xs text-slate-500">{block.caption}</p> : null}
        </div>
      )
    case "beforeAfter":
      return (
        <div className={card}>
          <h3 className="mb-4 text-lg font-semibold text-white">{block.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Before", block.before],
              ["After", block.after],
            ].map(([label, image]) => (
              <figure key={label as string}>
                <Img image={image as ProjectImage} className="h-auto w-full rounded-lg border border-white/10" />
                <figcaption className="mt-1 font-mono text-[11px] text-slate-400">{label as string}</figcaption>
              </figure>
            ))}
          </div>
          {block.caption ? <p className="mt-3 text-xs text-slate-500">{block.caption}</p> : null}
        </div>
      )
    case "quote":
      return (
        <blockquote className={card}>
          <p className="text-lg text-white">“{block.text}”</p>
          <footer className="mt-3 text-sm text-slate-400">
            {block.author}, {block.role}
          </footer>
        </blockquote>
      )
    case "code":
      return (
        <figure className={card}>
          <figcaption className="mb-3 text-lg font-semibold text-white">{block.title}</figcaption>
          <pre className="overflow-x-auto rounded-lg bg-black/50 p-4 font-mono text-xs leading-relaxed text-slate-200">
            <code>{block.code}</code>
          </pre>
          {block.caption ? <p className="mt-2 text-xs text-slate-500">{block.caption}</p> : null}
        </figure>
      )
    case "cta":
      return (
        <div className={card}>
          <h3 className="text-xl font-semibold text-white">{block.title}</h3>
          <p className="mt-2 text-slate-300">{block.text}</p>
          <p className="mt-4 flex flex-wrap gap-3">
            {block.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full border px-4 py-1.5 font-mono text-sm text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                style={{ borderColor: accent }}
              >
                {l.label}
              </a>
            ))}
          </p>
        </div>
      )
    case "model":
      return (
        <div className={card}>
          <h3 className="text-lg font-semibold text-white">{block.title}</h3>
          {block.caption ? <p className="mt-2 text-sm text-slate-400">{block.caption}</p> : null}
        </div>
      )
  }
}

/** Renders a case study's content blocks as plain HTML; the 3D scene behind it is decoration. */
export function CaseBlocks({ study }: { study: LabCaseStudy }) {
  return (
    <div className="space-y-8">
      {study.blocks.map((block) => (
        <BlockView key={block.id} block={block} accent={study.accent_color} />
      ))}
    </div>
  )
}
