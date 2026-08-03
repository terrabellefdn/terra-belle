import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PageShell } from "@/components/terra/PageShell";
import { contactSchema, submitContactMessage } from "@/lib/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Terra Belle Foundation" },
      {
        name: "description",
        content:
          "Reach the Terra Belle Foundation team for partnerships, research collaboration, media or general enquiries.",
      },
      { property: "og:title", content: "Contact — Terra Belle Foundation" },
      {
        property: "og:description",
        content: "Partnerships, research collaboration, media and general enquiries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const TOPICS = [
  { value: "general", label: "General enquiry" },
  { value: "partnership", label: "Partnership" },
  { value: "media", label: "Media & press" },
  { value: "research", label: "Research collaboration" },
  { value: "careers", label: "Careers" },
  { value: "support", label: "Support" },
] as const;

const inp =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none transition focus:border-ink";

function ContactPage() {
  const send = useServerFn(submitContactMessage);
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization: "",
    topic: "general" as (typeof TOPICS)[number]["value"],
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse({
      ...form,
      organization: form.organization || null,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        next[String(i.path[0])] = i.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setState("sending");
    try {
      await send({ data: parsed.data });
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <PageShell
      eyebrow="Connect · Terra Belle"
      title="Start a conversation"
      intro="Whether you steward land, capital, research or community — there is a place for you inside the loop. Tell us what you're building and we'll route you to the right vertical."
    >
      <section className="relative mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
          <aside className="grid content-start gap-6">
            <div className="rounded-3xl border border-black/5 bg-white/70 p-6 backdrop-blur sm:p-8">
              <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">The Foundation</div>
              <p className="mt-4 text-[14px] leading-relaxed text-ink/80">
                Terra Belle Foundation builds and funds regenerative infrastructure across MRV and
                reforestation, aviation R&amp;D, distributed green energy, direct air capture, green
                construction, vertical gardens and conservation tourism — operated as one continuous loop.
              </p>
              <dl className="mt-6 grid gap-4 text-[13.5px]">
                <Row label="Email">
                  <a className="hover:text-ink" href="mailto:odinga.billy@lucene.co">
                    odinga.billy@lucene.co
                  </a>
                </Row>
                <Row label="Phone">
                  <a className="hover:text-ink" href="tel:+254727750097">
                    +254 727 750097
                  </a>
                </Row>
                <Row label="Instagram">
                  <a
                    className="hover:text-ink"
                    href="https://instagram.com/terrabellefoundation"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    @terrabellefoundation
                  </a>
                </Row>
                <Row label="TikTok">
                  <a
                    className="hover:text-ink"
                    href="https://tiktok.com/@terrabellefdn"
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    @terrabellefdn
                  </a>
                </Row>
              </dl>
            </div>

            <div className="rounded-3xl border border-black/5 bg-gradient-to-br from-gold/10 via-green/5 to-earth/10 p-6 sm:p-8">
              <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">Response time</div>
              <p className="mt-3 text-[14px] leading-relaxed text-ink/80">
                We reply to most enquiries within two working days. Partnership applications are
                reviewed alongside the vertical leads they concern.
              </p>
            </div>
          </aside>

          <div className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8">
            {state === "done" ? (
              <div className="grid place-items-center py-16 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-green/15 text-[22px] text-green">
                  ✓
                </div>
                <h2 className="mt-6 font-display text-[1.6rem] tracking-tight">Message received</h2>
                <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-mist">
                  Thank you, {form.name.split(" ")[0] || "friend"}. Your message is logged with our team and
                  we'll reply to {form.email} shortly.
                </p>
                <button
                  onClick={() => {
                    setForm({ name: "", email: "", organization: "", topic: "general", message: "" });
                    setState("idle");
                  }}
                  className="mt-8 rounded-full border border-black/10 px-5 py-2.5 text-[12.5px] hover:border-black/25"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid gap-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full name" error={errors["name"]}>
                    <input
                      className={inp}
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </Field>
                  <Field label="Email" error={errors["email"]}>
                    <input
                      type="email"
                      className={inp}
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </Field>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Organization (optional)" error={errors["organization"]}>
                    <input
                      className={inp}
                      value={form.organization}
                      onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                    />
                  </Field>
                  <Field label="Topic" error={errors["topic"]}>
                    <select
                      className={inp}
                      value={form.topic}
                      onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value as any }))}
                    >
                      {TOPICS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Message" error={errors["message"]}>
                  <textarea
                    rows={6}
                    className={inp}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  />
                </Field>

                {state === "error" && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
                    We couldn't send that just now. Please try again, or email odinga.billy@lucene.co.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={state === "sending"}
                  data-magnetic
                  className="mt-1 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {state === "sending" ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-black/5 pb-3">
      <dt className="text-[10.5px] uppercase tracking-[0.24em] text-mist">{label}</dt>
      <dd className="text-right text-ink/80">{children}</dd>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[10.5px] uppercase tracking-[0.24em] text-mist">{label}</span>
      {children}
      {error && <span className="text-[12px] text-red-600">{error}</span>}
    </label>
  );
}
