import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "./admin.server";

function uaFamily(ua: string) {
  const b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Other";
  const o = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Other";
  return `${b}/${o}`;
}

/** Records a staff sign-in to the admin portal and flags anomalies. */
export const recordAdminLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: editor } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "editor" });
    if (!admin && !editor) return { ok: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ip = (getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for") || "").split(",")[0].trim() || null;
    const ua = (getRequestHeader("user-agent") || "").slice(0, 400);
    const country = getRequestHeader("cf-ipcountry") || getRequestHeader("x-vercel-ip-country") || null;
    const city = getRequestHeader("cf-ipcity") || getRequestHeader("x-vercel-ip-city") || null;

    const { data: prior } = await supabaseAdmin
      .from("admin_login_events")
      .select("ip, user_agent, country, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    const rows = prior ?? [];
    const reasons: string[] = [];
    if (rows.length) {
      if (country && !rows.some((r) => r.country === country)) reasons.push(`New country: ${country}`);
      if (ua && !rows.some((r) => r.user_agent && uaFamily(r.user_agent) === uaFamily(ua))) reasons.push(`New device: ${uaFamily(ua)}`);
      const hourAgo = Date.now() - 3600_000;
      const ips = new Set(rows.filter((r) => new Date(r.created_at).getTime() > hourAgo).map((r) => r.ip).filter(Boolean));
      if (ip) ips.add(ip);
      if (ips.size >= 3) reasons.push(`${ips.size} different IPs within an hour`);
    }
    await supabaseAdmin.from("admin_login_events").insert({
      user_id: context.userId,
      email: (context.claims as any)?.email ?? null,
      ip, user_agent: ua, country, city,
      aal: (context.claims as any)?.aal ?? null,
      suspicious: reasons.length > 0,
      reasons,
    });
    return { ok: true, suspicious: reasons.length > 0, reasons };
  });

export const listLoginEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_login_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const acknowledgeLoginEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertStaff(context.supabase, context.userId, context.claims);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_login_events").update({ acknowledged: true }).eq("id", data.id);
    return { ok: true };
  });

/** Partner portal: applications submitted with the signed-in user's email (RLS-scoped). */
export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("partner_applications")
      .select("id, scope_kind, vertical_slug, project_name, organization, contribution, status, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
