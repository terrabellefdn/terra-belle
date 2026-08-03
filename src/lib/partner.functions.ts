import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicServerClient } from "./supabase-public.server";

const schema = z.object({
  scopeKind: z.enum(["vertical", "project"]),
  verticalSlug: z.string().min(1).max(80),
  projectId: z.string().max(80).optional().nullable(),
  projectName: z.string().max(200).optional().nullable(),
  name: z.string().trim().min(2).max(120),
  organization: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  role: z.string().max(120).optional().nullable(),
  contribution: z.enum(["funding", "research", "operations", "community", "technology", "other"]),
  message: z.string().trim().min(20).max(1200),
});

export const submitPartnerApplication = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicServerClient();
    const { error } = await supabase.from("partner_applications").insert({
      scope_kind: data.scopeKind,
      vertical_slug: data.verticalSlug,
      project_id: data.projectId ?? null,
      project_name: data.projectName ?? null,
      name: data.name,
      organization: data.organization,
      email: data.email,
      role: data.role ?? null,
      contribution: data.contribution,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
