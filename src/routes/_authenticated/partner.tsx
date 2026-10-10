import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { listMyApplications } from "@/lib/security.functions";
import { checkIsAdmin } from "@/lib/admin.functions";
import { VERTICALS } from "@/lib/verticals-data";

export const Route = createFileRoute("/_authenticated/partner")({
  head: () => ({
    meta: [
      { title: "Partner portal — Terra Belle Foundation" },
      { name: "description", content: "Track your Terra Belle partnership applications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PartnerPortal,
});

function PartnerPortal() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const list = useServerFn(listMyApplications);
  const role = useServerFn(checkIsAdmin);
  const apps = useQuery({ queryKey: ["partner", "apps"], queryFn: () => list() });
  const staff = useQuery({ queryKey: ["admin", "role"], queryFn: () => role() });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="font-display tracking-tight">Terra Belle</Link>
        <div className="flex items-center gap-3 text-[12px] text-mist">
          {(staff.data?.isAdmin || staff.data?.isEditor) && (
            <Link to="/admin" className="rounded-full bg-ink px-3 py-1.5 text-white">Admin portal</Link>
          )}
          <button
            onClick={async () => {
              await qc.cancelQueries();
              qc.clear();
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="rounded-full border border-black/10 px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="mt-10 text-[10.5px] uppercase tracking-[0.28em] text-mist">Partner portal</div>
      <h1 className="mt-2 font-display text-[2rem] tracking-tight">Welcome{user.email ? `, ${user.email}` : ""}</h1>
      <p className="mt-2 text-[13.5px] text-mist">
        Applications submitted with this email appear here with their current status.
      </p>

      <div className="mt-8 grid gap-3">
        {apps.isLoading && <div className="text-sm text-mist">Loading…</div>}
        {apps.data?.length === 0 && (
          <div className="rounded-2xl border border-black/5 bg-white p-6 text-[13.5px]">
            No applications yet. <Link to="/verticals" className="underline">Explore the verticals</Link> to join one as a partner.
          </div>
        )}
        {apps.data?.map((a) => {
          const v = VERTICALS.find((x) => x.slug === a.vertical_slug);
          return (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-5">
              <div>
                <div className="text-[14px] font-medium">{a.project_name ?? v?.title ?? a.vertical_slug}</div>
                <div className="mt-1 text-[12px] text-mist">
                  {a.scope_kind === "project" ? "Project" : "Vertical"} · {a.contribution} · {a.organization} ·{" "}
                  {new Date(a.created_at).toLocaleDateString()}
                </div>
              </div>
              <span className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em]">{a.status}</span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
