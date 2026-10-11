import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { VERTICALS } from "./verticals-data";

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  verticalSlug: z.string().max(80).optional().nullable(),
  location: z.string().trim().max(160).optional().nullable(),
  description: z.string().trim().min(40).max(4000),
  resources: z.string().trim().max(1200).optional().nullable(),
});

export const assessProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured for this app yet.");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const { createLovableAiGatewayRunIdFetch } = await import("./ai/run-id");

    const catalog = VERTICALS.map((v) => `- ${v.slug}: ${v.title}`).join("\n");
    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    const instructions = `You are Terra Belle Foundation's partnership analyst. Terra Belle runs a closed-loop regenerative ecosystem across these verticals:\n${catalog}\n\nAssess a partner's proposed sustainability project. Respond in concise Markdown with exactly these sections:\n## Alignment score\nA score out of 100 and a one-line verdict.\n## Best-fit verticals\nBullet list of 1-3 vertical names from the list above and why.\n## Strengths\n## Risks & gaps\n## Tailored next steps\nA numbered list of 4-6 concrete actions for the partner.\nBe honest and specific; never invent facts about the partner.`;

    const prompt = [
      `Project title: ${data.title}`,
      data.verticalSlug ? `Partner's suggested vertical: ${data.verticalSlug}` : null,
      data.location ? `Location: ${data.location}` : null,
      `Description: ${data.description}`,
      data.resources ? `Resources/partners they bring: ${data.resources}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions,
        messages: [{ role: "user", content: prompt }],
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const text = await result.text;
      if (!text.trim()) throw new Error("The assessment came back empty. Please try again later.");
      return { assessment: text };
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode;
      if (status === 429) throw new Error("Too many requests right now — please wait a minute and try again.");
      if (status === 402) throw new Error("AI credits have run out for this workspace.");
      if (status === 403) throw new Error("AI access is currently blocked for this workspace.");
      throw new Error(e instanceof Error ? e.message : "Assessment failed.");
    }
  });
