import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/terra/PageShell";
import { CircularChapter } from "@/components/terra/Chapters";

export const Route = createFileRoute("/circular")({
  head: () => ({
    meta: [
      { title: "The Circular Economy — Terra Belle Foundation" },
      {
        name: "description",
        content:
          "Energy, capital, knowledge and regeneration circulate as a single loop — each output becomes another system's input.",
      },
      { property: "og:title", content: "The Circular Economy — Terra Belle Foundation" },
      {
        property: "og:description",
        content: "Nothing is wasted. Everything creates new value.",
      },
    ],
  }),
  component: CircularPage,
});

function CircularPage() {
  return (
    <PageShell
      eyebrow="Chapter 04 · Discover"
      title="The Circular Economy"
      intro="Follow any current — energy, capital, knowledge, regeneration — to see cause become effect across the entire ecosystem."
    >
      <CircularChapter />
    </PageShell>
  );
}
