import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { publicServerClient } from "./supabase-public.server";
import { geoFromHeaders, isExcludedTraffic, parseDevice } from "./analytics.server";

const viewSchema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(500).optional().nullable(),
  userAgent: z.string().max(500).optional().nullable(),
  sessionId: z.string().max(80).optional().nullable(),
  viewKey: z.string().min(6).max(120),
  language: z.string().max(40).optional().nullable(),
  screen: z.string().max(40).optional().nullable(),
});

export const logPageView = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => viewSchema.parse(d))
  .handler(async ({ data }) => {
    const header = (n: string) => getRequestHeader(n) ?? null;
    const ua = data.userAgent ?? header("user-agent");
    const host = header("host") ?? header("x-forwarded-host");

    if (isExcludedTraffic({ path: data.path, host, userAgent: ua })) {
      return { ok: true, skipped: true };
    }

    const { deviceType, browser, os } = parseDevice(ua);
    const { country, city } = geoFromHeaders(header);
    const supabase = publicServerClient();

    // view_key has a unique index — repeated/rapid navigations to the same
    // path within the same session collapse into one row.
    const { error } = await supabase.from("page_views").insert({
      path: data.path,
      referrer: data.referrer ?? null,
      user_agent: ua ? ua.slice(0, 500) : null,
      session_id: data.sessionId ?? null,
      view_key: data.viewKey,
      device_type: deviceType,
      browser,
      os,
      country,
      city,
      language: data.language ?? null,
      screen: data.screen ?? null,
      is_bot: false,
    });

    if (error && error.code !== "23505") return { ok: false, skipped: false };
    return { ok: true, skipped: false };
  });

export const recordViewDuration = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ viewKey: z.string().min(6).max(120), durationMs: z.number().int().min(0).max(6 * 3600 * 1000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = publicServerClient();
    await supabase
      .from("page_views")
      .update({ duration_ms: data.durationMs })
      .eq("view_key", data.viewKey);
    return { ok: true };
  });
