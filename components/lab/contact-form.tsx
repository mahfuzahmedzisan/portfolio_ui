"use client"

import { type FormEvent, useState } from "react"

import { audio } from "@/components/three/audio/audio-manager"
import { useLab } from "@/lib/three/store"

const TYPES = [
  ["web-app", "Web application"],
  ["ecommerce", "E-commerce"],
  ["saas", "SaaS product"],
  ["api", "API / backend"],
  ["dashboard", "Admin dashboard"],
  ["3d", "3D / interactive"],
  ["support", "Maintenance & support"],
  ["other", "Something else"],
] as const

const BUDGETS = [
  ["not-sure", "Not sure yet"],
  ["under-1k", "Under $1k"],
  ["1k-5k", "$1k – $5k"],
  ["5k-15k", "$5k – $15k"],
  ["15k-plus", "$15k+"],
] as const

const field =
  "w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:border-pink-300/70 focus-visible:ring-2 focus-visible:ring-pink-300/40 focus-visible:outline-none"

/** The brief goes out by POST; the rocket on the launch pad leaves when the server confirms. */
export function ContactForm() {
  const status = useLab((s) => s.contactStatus)
  const setStatus = useLab((s) => s.setContactStatus)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    setStatus("sending")
    setError("")
    audio.play("click")
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message ?? "Something went wrong.")
      }
      form.reset()
      setStatus("sent")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.")
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-xl border border-pink-300/30 bg-pink-300/10 p-5">
        <p className="text-lg font-semibold text-white">Message sent.</p>
        <p className="mt-1 text-sm text-slate-300">Thanks. I will reply to your email soon.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 rounded-full border border-white/20 px-4 py-1.5 font-mono text-xs text-slate-200 transition hover:border-white/40 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3" aria-describedby={error ? "contact-error" : undefined}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Name
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={`${field} mt-1`} />
        </label>
        <label className="block text-xs text-slate-400">
          Email
          <input name="email" type="email" required maxLength={160} autoComplete="email" className={`${field} mt-1`} />
        </label>
        <label className="block text-xs text-slate-400">
          Project type
          <select name="projectType" defaultValue="web-app" className={`${field} mt-1`}>
            {TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-400">
          Budget
          <select name="budget" defaultValue="not-sure" className={`${field} mt-1`}>
            {BUDGETS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-xs text-slate-400">
        What are you building?
        <textarea name="message" required minLength={10} maxLength={3000} rows={4} className={`${field} mt-1 resize-y`} />
      </label>
      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {status === "error" ? (
        <p id="contact-error" role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full border border-pink-300/60 bg-pink-300/15 px-6 py-2.5 font-mono text-sm text-pink-100 transition hover:bg-pink-300/25 focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:outline-none disabled:opacity-50"
      >
        {status === "sending" ? "Launching…" : "Send message →"}
      </button>
    </form>
  )
}
