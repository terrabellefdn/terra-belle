import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/terra/PageShell";
import { PlanetChapter } from "@/components/terra/Chapters";

export const Route = createFileRoute("/planet")({
  head: () => ({
    meta: [
      { title: "The Planet — Terra Belle Foundation" },
      {
        name: "description",
        content:
          "Understand the interdependent climate, biodiversity, energy and capital challenges Terra Belle is built to address.",
      },
      { property: "og:title", content: "The Planet — Terra Belle Foundation" },
      {
        property: "og:description",
        content: "One biosphere, one interdependent system, one coordinated response.",
      },
    ],
  }),
  component: PlanetPage,
});

function PlanetPage() {
  return (
    <PageShell
      eyebrow="Chapter 02 · Understand"
      title="The Planet"
      intro="Our greatest challenges are deeply connected — climate, biodiversity, energy access, food security and capital flows are signals from one interdependent system asking for one coordinated answer."
    >
      <PlanetChapter />
    </PageShell>
  );
}
