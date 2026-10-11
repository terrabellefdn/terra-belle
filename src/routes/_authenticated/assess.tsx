import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { assessProject } from "@/lib/assess.functions";
import { VERTICALS } from "@/lib/verticals-data";

export const Route = createFileRoute("/_authenticated/assess")({
  head: () => ({
    meta: [
      { title: "Project alignment assessment — Terra Belle Foundation" },
      { name: "description", content: "Describe a proposed sustainability project and get an AI alignment assessment with tailored next steps." },
      { property: "og:title", content: "Project alignment assessment — Terra Belle" },
      { property: "og:description", content: "AI-assisted alignment assessment for partner sustainability projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssessPage,
});

function renderMd(md: string) {
  return md.split("\n").map((line, i) => {
    const t = line.trim();
    if (t.startsWith("## ")) return <h3 key={i} className="mt-6 font-display text-[1.15rem] tracking-tight">{t.slice(3)}</h3>;
    if (/^[-*] /.test(t)) return <li key={i} className="ml-5 list-disc text-[13.5px] leading-relaxed">{strip(t.slice(2))}</li>;
    if (/^\d+\. /.test(t)) return <li key={i} className="ml-5 list-decimal text-[13.5px] leading-relaxed">{strip(t.replace(/^\d+\. /, ""))}</li>;
    if (!t) return null;
    return <p key={i} className="mt-2 text-[13.5px] leading-relaxed">{strip(t)}</p>;
  });
}
const strip = (s: string) => s.replace(/\*\*/g, "");

function AssessPage() {
  const run = useServerFn(assessProject);
  const [form, setForm] = useState({ title: "", verticalSlug: "", location: "", description: "", resources: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.title.trim().length < 3) return setError("Please add a project title.");
    if (form.description.trim().length < 40) return setError("Please describe the project in at least 40 characters.");
    setLoading(true);
    setResult(null);
    try {
      const r = await run({ data: { ...form, verticalSlug: form.verticalSlug || null } });
      setResult(r.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assessment failed.");
    } finally {
      setLoading(false);
    }
  }

  const field = "mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none focus:border-black/30";
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6">
      <Link to="/partner" className="text-[12px] text-mist underline">← Partner portal</Link>
      <div className="mt-8 text-[10.5px] uppercase tracking-[0.28em] text-mist">Alignment assessment</div>
      <h1 className="mt-2 font-display text-[2rem] tracking-tight">Propose a project</h1>
      <p className="mt-2 text-[13.5px] text-mist">Describe your idea and get an instant assessment of how it fits Terra Belle's ecosystem, plus tailored next steps.</p>

      <form onSubmit={submit} className="mt-8 grid gap-4">
        <label className="text-[12px] text-mist">Project title
          <input className={field} value={form.title} onChange={set("title")} maxLength={160} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-[12px] text-mist">Closest vertical (optional)
            <select className={field} value={form.verticalSlug} onChange={set("verticalSlug")}>
              <option value="">Not sure</option>
              {VERTICALS.map((v) => <option key={v.slug} value={v.slug}>{v.title}</option>)}
            </select>
          </label>
          <label className="text-[12px] text-mist">Location (optional)
            <input className={field} value={form.location} onChange={set("location")} maxLength={160} />
          </label>
        </div>
        <label className="text-[12px] text-mist">Project description
          <textarea className={field} rows={6} value={form.description} onChange={set("description")} maxLength={4000}
            placeholder="Goals, who benefits, timeline, expected impact…" />
        </label>
        <label className="text-[12px] text-mist">What you bring (optional)
          <textarea className={field} rows={3} value={form.resources} onChange={set("resources")} maxLength={1200}
            placeholder="Funding, land, expertise, partners…" />
        </label>
        {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[13px] text-destructive">{error}</div>}
        <button disabled={loading} className="justify-self-start rounded-full bg-ink px-6 py-3 text-[13px] text-white disabled:opacity-50">
          {loading ? "Assessing… this can take a minute" : "Generate assessment"}
        </button>
      </form>

      {result && (
        <section className="mt-10 rounded-3xl border border-black/5 bg-white p-6 sm:p-8">
          {renderMd(result)}
          <p className="mt-6 text-[11.5px] text-mist">AI-generated guidance — the Terra Belle team reviews all formal applications.</p>
        </section>
      )}
    </main>
  );
}
