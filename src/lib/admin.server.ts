/**
 * Server-only helpers for the admin portal. Kept out of *.functions.ts so the
 * server-fn splitter never drops them from the handler chunk.
 */

export async function assertStaff(supabase: any, userId: string) {
  const { data: admin, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (admin) return { isAdmin: true };
  const { data: editor } = await supabase.rpc("has_role", { _user_id: userId, _role: "editor" });
  if (!editor) throw new Error("Forbidden");
  return { isAdmin: false };
}

export async function assertAdminOnly(supabase: any, userId: string) {
  const { data: admin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!admin) throw new Error("Forbidden");
}

export async function actorEmail(supabase: any): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user?.email ?? null;
}

export async function writeAudit(entry: {
  actorId: string;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: entry.actorId,
    actor_email: entry.actorEmail,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    summary: entry.summary,
    before_data: (entry.before ?? null) as any,
    after_data: (entry.after ?? null) as any,
  });
}

export function diffFields(before: Record<string, any> | null, after: Record<string, any>) {
  const changed: string[] = [];
  for (const key of Object.keys(after)) {
    if (!before || JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null)) {
      changed.push(key);
    }
  }
  return changed;
}
