import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { actorEmail, assertAdminOnly, assertStaff, diffFields, writeAudit } from "./admin.server";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    const [views24, views7, views30, appsTotal, appsNew, msgsTotal, msgsNew, rowsRes] =
      await Promise.all([
        supabaseAdmin.from("page_views").select("id", { count: "exact", head: true }).eq("is_bot", false).gte("created_at", since24h),
        supabaseAdmin.from("page_views").select("id", { count: "exact", head: true }).eq("is_bot", false).gte("created_at", since7d),
        supabaseAdmin.from("page_views").select("id", { count: "exact", head: true }).eq("is_bot", false).gte("created_at", since30d),
        supabaseAdmin.from("partner_applications").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("partner_applications").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }),
        supabaseAdmin.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabaseAdmin
          .from("page_views")
          .select("path, created_at, device_type, browser, os, country, session_id, duration_ms, referrer")
          .eq("is_bot", false)
          .gte("created_at", since30d)
          .limit(20000),
      ]);

    const rows = (rowsRes.data ?? []) as any[];

    const tally = (key: string) => {
      const counts: Record<string, number> = {};
      rows.forEach((r) => {
        const v = r[key];
        if (!v) return;
        counts[v] = (counts[v] ?? 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, count]) => ({ label, count }));
    };

    const topPaths = tally("path").map((r) => ({ path: r.label, count: r.count }));

    const daily: Record<string, number> = {};
    rows.forEach((r) => {
      const day = String(r.created_at).slice(0, 10);
      daily[day] = (daily[day] ?? 0) + 1;
    });
    const series = Object.entries(daily)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({ day, count }));

    const durations = rows.map((r) => r.duration_ms).filter((d): d is number => typeof d === "number" && d > 0);
    const avgTimeMs = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

    const sessions = new Set(rows.map((r) => r.session_id).filter(Boolean)).size;

    const referrers = (() => {
      const counts: Record<string, number> = {};
      rows.forEach((r) => {
        if (!r.referrer) return;
        let host = "direct";
        try {
          host = new URL(r.referrer).hostname;
        } catch {
          host = String(r.referrer).slice(0, 60);
        }
        counts[host] = (counts[host] ?? 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([label, count]) => ({ label, count }));
    })();

    return {
      views24h: views24.count ?? 0,
      views7d: views7.count ?? 0,
      views30d: views30.count ?? 0,
      appsTotal: appsTotal.count ?? 0,
      appsNew: appsNew.count ?? 0,
      messagesTotal: msgsTotal.count ?? 0,
      messagesNew: msgsNew.count ?? 0,
      sessions,
      avgTimeMs,
      topPaths,
      series,
      devices: tally("device_type"),
      browsers: tally("browser"),
      systems: tally("os"),
      countries: tally("country"),
      referrers,
    };
  });

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("partner_applications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "reviewing", "contacted", "closed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("partner_applications")
      .select("status, name, organization")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("partner_applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await writeAudit({
      actorId: context.userId,
      actorEmail: await actorEmail(context.supabase),
      action: "application.status_changed",
      entityType: "partner_application",
      entityId: data.id,
      summary: `Status ${before?.status ?? "?"} → ${data.status}${before?.organization ? ` (${before.organization})` : ""}`,
      before: before ? { status: before.status } : null,
      after: { status: data.status },
    });
    return { ok: true };
  });

export const listContactMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateContactStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "reviewing", "replied", "closed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("contact_messages")
      .select("status, name")
      .eq("id", data.id)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from("contact_messages")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    await writeAudit({
      actorId: context.userId,
      actorEmail: await actorEmail(context.supabase),
      action: "contact.status_changed",
      entityType: "contact_message",
      entityId: data.id,
      summary: `Status ${before?.status ?? "?"} → ${data.status}${before?.name ? ` (${before.name})` : ""}`,
      before: before ? { status: before.status } : null,
      after: { status: data.status },
    });
    return { ok: true };
  });

export const listVerticalsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("verticals").select("*").order("slug");
    return data ?? [];
  });

export const upsertVertical = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        slug: z.string().min(1).max(80),
        title: z.string().max(200).optional().nullable(),
        short: z.string().max(120).optional().nullable(),
        summary: z.string().max(2000).optional().nullable(),
        hero: z.string().max(2000).optional().nullable(),
        mission: z.string().max(2000).optional().nullable(),
        vision: z.string().max(2000).optional().nullable(),
        active: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: before } = await supabaseAdmin
      .from("verticals")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    const { error } = await supabaseAdmin.from("verticals").upsert(
      { ...data, updated_at: new Date().toISOString(), updated_by: context.userId },
      { onConflict: "slug" },
    );
    if (error) throw new Error(error.message);

    const changed = diffFields(before as any, data as any);
    await writeAudit({
      actorId: context.userId,
      actorEmail: await actorEmail(context.supabase),
      action: before ? "vertical.updated" : "vertical.created",
      entityType: "vertical",
      entityId: data.slug,
      summary: changed.length ? `Edited: ${changed.join(", ")}` : "Saved with no changes",
      before: before ?? null,
      after: data,
    });
    return { ok: true };
  });

export const listAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: editor } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "editor",
    });
    return { isAdmin: !!admin, isEditor: !!editor, userId: context.userId };
  });
