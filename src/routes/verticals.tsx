import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useMatches } from "@tanstack/react-router";
import { PageShell } from "@/components/terra/PageShell";
import { Section, Reveal } from "@/components/terra/Section";
import { Tilt } from "@/components/terra/Interactive";
import { CATEGORIES, VERTICALS, type VerticalCategory } from "@/lib/verticals-data";

export const Route = createFileRoute("/verticals")({
  head: () => ({
    meta: [
      { title: "Verticals — Terra Belle Foundation" },
      {
        name: "description",
        content:
          "Web3 carbon MRV and reforestation, hydroelectric green-hydrogen aviation, distributed renewables, direct air carbon removal, green construction and carbon mortar, vertical gardens, and conservation tourism with WildTracks.",
      },
      { property: "og:title", content: "Verticals — Terra Belle Foundation" },
      {
        property: "og:description",
        content:
          "The operating facets of Terra Belle — every vertical is a node in one regenerative loop.",
      },
    ],
  }),
  component: VerticalsLayout,
});

/**
 * Layout for /verticals and /verticals/$slug.
 *
 * The verticals homepage (intro + filter + grid) is ALWAYS rendered so that
 * landing on a slug URL still opens on the verticals homepage — the child
 * <Outlet /> renders the immersive detail below the grid while the address
 * bar reflects the chosen vertical.
 */
function VerticalsLayout() {
  const matches = useMatches();
  const activeSlug = useMemo(() => {
    for (const m of matches) {
      const p = m.params as { slug?: string };
      if (p?.slug) return p.slug;
    }
    return null;
  }, [matches]);

  const [filter, setFilter] = useState<VerticalCategory | "All">("All");

  const filtered = useMemo(
    () => (filter === "All" ? VERTICALS : VERTICALS.filter((v) => v.category === filter)),
    [filter],
  );

  return (
    <PageShell
      eyebrow="Operating Facets"
      title="The Verticals"
      intro="Each vertical is an independent engine of regeneration — and a node in the same circular system. Filter by domain, step inside any facet, then follow the journey loop through the whole ecosystem."
    >
      <Section id="verticals-grid">
        {/* Filter rail */}
        <div
          role="tablist"
          aria-label="Filter verticals by domain"
          className="mb-12 flex flex-wrap items-center gap-2"
        >
          {CATEGORIES.map((cat) => {
            const isActive = cat === filter;
            const count =
              cat === "All" ? VERTICALS.length : VERTICALS.filter((v) => v.category === cat).length;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isActive}
                onClick={() => setFilter(cat)}
                data-magnetic
                className={`group relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[12.5px] font-medium transition-all duration-500 ${
                  isActive
                    ? "border-ink bg-ink text-white shadow-[0_18px_50px_-20px_rgba(17,17,17,0.5)]"
                    : "border-black/10 bg-white/70 text-ink/70 backdrop-blur hover:border-black/25 hover:text-ink"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="filter-active-dot"
                    className="h-1.5 w-1.5 rounded-full bg-gold"
                  />
                )}
                <span>{cat}</span>
                <span
                  className={`text-[10px] tracking-widest ${
                    isActive ? "text-white/60" : "text-mist"
                  }`}
                >
                  {String(count).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((v, i) => {
              const Icon = v.Icon;
              const isSelected = activeSlug === v.slug;
              return (
                <motion.div
                  key={v.slug}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.98 }}
                  transition={{ duration: 0.55, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Tilt>
                    <Link
                      to="/verticals/$slug"
                      params={{ slug: v.slug }}
                      data-magnetic
                      aria-current={isSelected ? "page" : undefined}
                      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border p-8 backdrop-blur transition-all duration-500 ${
                        isSelected
                          ? "border-ink/20 bg-white shadow-[0_30px_70px_-30px_rgba(17,17,17,0.35)]"
                          : "border-black/5 bg-white/85 hover:shadow-[0_30px_70px_-30px_rgba(17,17,17,0.25)]"
                      }`}
                    >
                      <div
                        aria-hidden
                        className={`absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl transition-opacity duration-500 ${
                          isSelected ? "opacity-70" : "opacity-25 group-hover:opacity-60"
                        }`}
                        style={{ background: v.color }}
                      />
                      <div className="relative flex items-center gap-3">
                        <span
                          className="grid h-11 w-11 place-items-center rounded-2xl"
                          style={{ background: v.color + "18" }}
                        >
                          <Icon size={22} color={v.color} />
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.24em] text-mist">
                          {v.eyebrow}
                        </span>
                      </div>

                      <h2 className="relative mt-6 font-display text-[clamp(1.4rem,2.2vw,1.8rem)] leading-tight tracking-tight">
                        {v.title}
                      </h2>

                      <p className="relative mt-4 text-[14px] leading-relaxed text-mist">
                        {v.summary}
                      </p>

                      <div
                        className="relative mt-auto flex items-center justify-between pt-8 text-[10px] uppercase tracking-[0.24em]"
                        style={{ color: v.color }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{ background: v.color, boxShadow: `0 0 6px ${v.color}` }}
                          />
                          {v.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-ink/60 transition-transform duration-300 group-hover:translate-x-1">
                          {isSelected ? "Viewing ↓" : "Enter →"}
                        </span>
                      </div>
                    </Link>
                  </Tilt>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <Reveal>
            <p className="mt-16 text-center text-mist">No verticals in this domain yet.</p>
          </Reveal>
        )}
      </Section>

      {/* Detail slot — filled by /verticals/$slug */}
      <Outlet />
    </PageShell>
  );
}
