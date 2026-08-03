import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listContactMessages, updateContactStatus } from "@/lib/admin.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: MessagesPage,
});

const STATUSES = ["new", "reviewing", "replied", "closed"] as const;
type Status = (typeof STATUSES)[number];

function MessagesPage() {
  const list = useServerFn(listContactMessages);
  const update = useServerFn(updateContactStatus);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin", "messages"], queryFn: () => list() });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: Status }) => update({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      qc.invalidateQueries({ queryKey: ["admin", "audit"] });
    },
  });

  const rows = ((data ?? []) as any[]).filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[1.6rem] tracking-tight">Contact messages</h1>
          <p className="mt-1 text-[13px] text-mist">Submissions from the public contact form.</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[12px] transition ${
                filter === s ? "bg-ink text-white" : "border border-black/10 text-ink/70 hover:border-black/25"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-black/5 bg-white">
        {isLoading ? (
          <div className="p-6 text-sm text-mist">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-mist">No messages yet.</div>
        ) : (
          <ul className="divide-y divide-black/5">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] text-ink">
                      {r.name} · <span className="text-mist">{r.email}</span>
                    </div>
                    <div className="mt-1 text-[11.5px] text-mist">
                      {r.topic}
                      {r.organization ? ` · ${r.organization}` : ""} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-black/10 px-3 py-1 text-[11.5px] text-ink/70">
                    {r.status}
                  </span>
                </button>
                {open === r.id && (
                  <div className="border-t border-black/5 bg-[#fafaf7] px-5 py-4">
                    <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink/80">
                      {r.message}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={mut.isPending || r.status === s}
                          onClick={() => mut.mutate({ id: r.id, status: s })}
                          className={`rounded-full px-3 py-1.5 text-[12px] transition disabled:opacity-50 ${
                            r.status === s ? "bg-ink text-white" : "border border-black/10 hover:border-black/25"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <a
                        href={`mailto:${r.email}?subject=Re: Terra Belle — ${r.topic}`}
                        className="ml-auto rounded-full border border-black/10 px-4 py-1.5 text-[12px] hover:border-black/25"
                      >
                        Reply by email
                      </a>
                    </div>
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
