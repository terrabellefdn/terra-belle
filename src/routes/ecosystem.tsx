import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/terra/PageShell";
import { EcosystemChapter } from "@/components/terra/Chapters";

export const Route = createFileRoute("/ecosystem")({
  head: () => ({
    meta: [
      { title: "The Ecosystem — Terra Belle Foundation" },
      {
        name: "description",
        content:
          "Ten interlocking domains — technology, intelligence, capital, land, communities — operating as one living organism.",
      },
      { property: "og:title", content: "The Ecosystem — Terra Belle Foundation" },
      {
        property: "og:description",
        content: "Progress happens when every system strengthens the next.",
      },
    ],
  }),
  component: EcosystemPage,
});

function EcosystemPage() {
  return (
    <PageShell
      eyebrow="Chapter 03 · Discover"
      title="The Ecosystem"
      intro="Technology powers intelligence, intelligence routes capital, capital regenerates land, land sustains communities — and communities, in turn, redefine what technology is for."
    >
      <EcosystemChapter />
    </PageShell>
  );
}
