import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLog } from "@/lib/admin.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditPage,
});

function AuditPage() {
  const list = useServerFn(listAuditLog);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "audit"], queryFn: () => list() });
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const rows = (data ?? []) as any[];
  const kinds = ["all", ...Array.from(new Set(rows.map((r) => r.entity_type)))];
  const shown = rows.filter((r) => filter === "all" || r.entity_type === filter);

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.6rem] tracking-tight">Audit log</h1>
          <p className="mt-1 text-[13px] text-mist">
            Every content edit and status change, with who made it and when.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {kinds.map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1.5 text-[12px] transition ${
                filter === k ? "bg-ink text-white" : "border border-black/10 text-ink/70 hover:border-black/25"
              }`}
            >
              {k.replace("_", " ")}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        {isLoading ? (
          <div className="p-6 text-sm text-mist">Loading…</div>
        ) : shown.length === 0 ? (
          <div className="p-6 text-sm text-mist">No admin activity recorded yet.</div>
        ) : (
          <ul className="divide-y divide-black/5">
            {shown.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] text-ink">{r.summary}</div>
                    <div className="mt-1 text-[11.5px] text-mist">
                      {r.actor_email ?? r.actor_id ?? "unknown"} · {r.action} ·{" "}
                      {r.entity_id ?? "—"}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11.5px] text-mist">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </button>
                {open === r.id && (
                  <div className="grid gap-3 border-t border-black/5 bg-[#fafaf7] px-5 py-4 md:grid-cols-2">
                    <Json label="Before" value={r.before_data} />
                    <Json label="After" value={r.after_data} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Json({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">{label}</div>
      <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-black/5 bg-white p-3 text-[11.5px] leading-relaxed text-ink/80">
        {value ? JSON.stringify(value, null, 2) : "—"}
      </pre>
    </div>
  );
}
