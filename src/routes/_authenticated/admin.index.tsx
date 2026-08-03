import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function fmtDuration(ms: number) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function AdminOverview() {
  const fn = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => fn(),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) return <div className="text-mist text-sm">Loading…</div>;

  const stats = [
    { label: "Visits · 24h", value: data.views24h.toLocaleString() },
    { label: "Visits · 7d", value: data.views7d.toLocaleString() },
    { label: "Visits · 30d", value: data.views30d.toLocaleString() },
    { label: "Sessions · 30d", value: data.sessions.toLocaleString() },
    { label: "Avg. time on page", value: fmtDuration(data.avgTimeMs) },
    { label: "Applications", value: `${data.appsTotal} (${data.appsNew} new)` },
    { label: "Messages", value: `${data.messagesTotal} (${data.messagesNew} new)` },
  ];

  const max = Math.max(1, ...data.series.map((s) => s.count));

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="font-display text-[1.6rem] tracking-tight">Overview</h1>
        <p className="mt-1 text-[13px] text-mist">
          Live metrics from Terra Belle's visitors and partners. Bots and internal traffic excluded.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">{s.label}</div>
            <div className="mt-3 font-display text-[1.5rem] leading-none">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-6">
        <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">Visits · last 30 days</div>
        <div className="mt-6 flex h-40 items-end gap-1">
          {data.series.length === 0 && <div className="text-sm text-mist">No visits yet.</div>}
          {data.series.map((s) => (
            <div
              key={s.day}
              className="flex-1 rounded-t bg-ink/80 transition hover:bg-ink"
              style={{ height: `${(s.count / max) * 100}%` }}
              title={`${s.day} — ${s.count}`}
            />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Top pages · 30d" rows={data.topPaths.map((p) => ({ label: p.path, count: p.count }))} />
        <Panel title="Referrers" rows={data.referrers} />
        <Panel title="Devices" rows={data.devices} />
        <Panel title="Browsers" rows={data.browsers} />
        <Panel title="Operating systems" rows={data.systems} />
        <Panel title="Countries" rows={data.countries} />
      </div>
    </div>
  );
}

function Panel({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const total = rows.reduce((a, b) => a + b.count, 0) || 1;
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6">
      <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">{title}</div>
      <ul className="mt-4 grid gap-2.5">
        {rows.length === 0 && <li className="py-1 text-sm text-mist">No data yet.</li>}
        {rows.map((r) => (
          <li key={r.label} className="grid gap-1">
            <div className="flex items-center justify-between gap-4">
              <span className="truncate text-[13px] text-ink">{r.label}</span>
              <span className="shrink-0 text-[12.5px] text-mist">{r.count.toLocaleString()}</span>
            </div>
            <div className="h-1 rounded-full bg-black/5">
              <div className="h-1 rounded-full bg-ink/70" style={{ width: `${(r.count / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
