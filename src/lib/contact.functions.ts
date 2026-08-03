import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { publicServerClient } from "./supabase-public.server";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  organization: z.string().trim().max(160).optional().nullable(),
  topic: z.enum(["general", "partnership", "media", "research", "careers", "support"]),
  message: z.string().trim().min(20, "Tell us a little more (20+ characters)").max(2000),
});

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const supabase = publicServerClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      organization: data.organization ?? null,
      topic: data.topic,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
