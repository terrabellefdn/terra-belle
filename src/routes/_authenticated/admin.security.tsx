import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { acknowledgeLoginEvent, listLoginEvents } from "@/lib/security.functions";

export const Route = createFileRoute("/_authenticated/admin/security")({
  component: SecurityPage,
});

function SecurityPage() {
  const list = useServerFn(listLoginEvents);
  const ack = useServerFn(acknowledgeLoginEvent);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "logins"], queryFn: () => list(), refetchInterval: 30_000 });
  const m = useMutation({
    mutationFn: (id: string) => ack({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "logins"] }),
  });
  const alerts = (data ?? []).filter((e) => e.suspicious && !e.acknowledged);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-[1.4rem] tracking-tight">Security</h1>
        <p className="mt-1 text-[12px] text-mist">
          Every admin sign-in requires a two-factor code. Sign-ins from a new country, a new device, or many IPs within an hour are flagged.
        </p>
      </div>
      <section className="rounded-2xl border border-black/5 bg-white p-5">
        <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">Open alerts · {alerts.length}</div>
        {alerts.length === 0 && <p className="mt-3 text-[13px] text-mist">No suspicious sign-ins.</p>}
        {alerts.map((e) => (
          <div key={e.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 p-4">
            <div className="text-[13px]">
              <div className="font-medium">{e.email} · {new Date(e.created_at).toLocaleString()}</div>
              <div className="text-red-700">{e.reasons.join(" · ")}</div>
              <div className="text-[11.5px] text-mist">{[e.ip, e.city, e.country].filter(Boolean).join(" · ")}</div>
            </div>
            <button onClick={() => m.mutate(e.id)} className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-[12px]">
              Mark as me
            </button>
          </div>
        ))}
      </section>
      <section className="overflow-x-auto rounded-2xl border border-black/5 bg-white p-5">
        <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist">Recent admin sign-ins</div>
        {isLoading ? (
          <p className="mt-3 text-sm text-mist">Loading…</p>
        ) : (
          <table className="mt-3 w-full text-left text-[12.5px]">
            <thead className="text-mist">
              <tr><th className="py-2">When</th><th>Who</th><th>IP</th><th>Location</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(data ?? []).map((e) => (
                <tr key={e.id} className="border-t border-black/5">
                  <td className="py-2">{new Date(e.created_at).toLocaleString()}</td>
                  <td>{e.email}</td>
                  <td>{e.ip ?? "—"}</td>
                  <td>{[e.city, e.country].filter(Boolean).join(", ") || "—"}</td>
                  <td>{e.suspicious ? (e.acknowledged ? "Reviewed" : "Suspicious") : "Normal"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
