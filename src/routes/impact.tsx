import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/terra/PageShell";
import { ImpactChapter } from "@/components/terra/Chapters";

export const Route = createFileRoute("/impact")({
  head: () => ({
    meta: [
      { title: "The Impact Engine — Terra Belle Foundation" },
      {
        name: "description",
        content:
          "A living, openly published dashboard of clean energy generated, carbon reduced, communities reached and capital mobilised.",
      },
      { property: "og:title", content: "The Impact Engine — Terra Belle Foundation" },
      {
        property: "og:description",
        content: "Impact is measured by what keeps growing.",
      },
    ],
  }),
  component: ImpactPage,
});

function ImpactPage() {
  return (
    <PageShell
      eyebrow="Chapter 05 · Connect"
      title="The Impact Engine"
      intro="A living dashboard, not an annual report. Every metric is auditable, openly published, and connected to the others — because outcomes never stand alone."
    >
      <ImpactChapter />
    </PageShell>
  );
}
