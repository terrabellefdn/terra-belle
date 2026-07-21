"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { VERTICALS, getVerticalIndex, type Vertical } from "@/lib/verticals-data";

/**
 * Journey Loop — a horizontal, keyboard-navigable rail of every vertical
 * shown on each vertical detail page. Motion language mirrors the chapter
 * rail (gear-indent SideTimeline): roving tabindex, arrow / Home / End
 * keys, aria-live announcement, gold gradient glow on the active node,
 * fade-in reveal.
 */
export function JourneyLoop({ active }: { active: Vertical }) {
  const activeIdx = getVerticalIndex(active.slug);
  const listRef = useRef<HTMLOListElement>(null);
  const [announce, setAnnounce] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setAnnounce(
      `Vertical ${activeIdx + 1} of ${VERTICALS.length}: ${active.short}. ${active.category}.`,
    );
  }, [activeIdx, active.short, active.category]);

  const prev = VERTICALS[(activeIdx - 1 + VERTICALS.length) % VERTICALS.length];
  const next = VERTICALS[(activeIdx + 1) % VERTICALS.length];

  const onKey = (e: KeyboardEvent<HTMLOListElement>) => {
    const list = listRef.current;
    if (!list) return;
    const items = Array.from(list.querySelectorAll<HTMLAnchorElement>("a[data-loop-node]"));
    const currentEl = document.activeElement as HTMLElement | null;
    const currentIdx = items.findIndex((el) => el === currentEl);
    const from = currentIdx >= 0 ? currentIdx : activeIdx;

    let target = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") target = (from + 1) % items.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      target = (from - 1 + items.length) % items.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = items.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      // Let the link handle its own activation
      return;
    } else return;

    e.preventDefault();
    items[target]?.focus();
  };

  return (
    <section
      aria-label="Journey through connected verticals"
      className="relative overflow-hidden rounded-[1.5rem] border border-black/5 bg-white/80 p-5 backdrop-blur sm:rounded-[2rem] sm:p-8 md:p-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-ink/15 to-transparent sm:block"
      />

      {/* Header */}
      <div className="relative flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="text-[10.5px] uppercase tracking-[0.24em] text-mist sm:text-[11px] sm:tracking-[0.28em]">The Journey Loop</div>
          <div className="mt-2 font-display text-[clamp(1.25rem,3.6vw,2rem)] leading-tight tracking-tight">
            Step through the ecosystem
          </div>
          <div className="mt-2 text-[12.5px] text-mist sm:text-[13px]">
            {activeIdx + 1} of {VERTICALS.length} · {active.category}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/verticals/$slug"
            params={{ slug: prev.slug }}
            data-magnetic
            aria-label={`Previous vertical: ${prev.short}`}
            className="group inline-flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-2 text-[11.5px] font-medium backdrop-blur transition hover:border-black/25 sm:px-4 sm:text-[12px]"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            <span className="truncate max-w-[9rem]">{prev.short}</span>
          </Link>
          <Link
            to="/verticals/$slug"
            params={{ slug: next.slug }}
            data-magnetic
            aria-label={`Next vertical: ${next.short}`}
            className="group inline-flex min-w-0 items-center gap-2 rounded-full bg-ink px-3 py-2 text-[11.5px] font-medium text-white transition hover:shadow-[0_18px_50px_-20px_rgba(244,176,0,0.55)] sm:px-4 sm:text-[12px]"
          >
            <span className="truncate max-w-[9rem]">{next.short}</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>

      {/* Rail */}
      <ol
        ref={listRef}
        role="list"
        onKeyDown={onKey}
        className="relative mt-8 grid grid-cols-2 gap-2.5 sm:mt-10 sm:flex sm:flex-wrap sm:items-stretch sm:gap-3"
      >
        {VERTICALS.map((v, i) => {
          const isActive = v.slug === active.slug;
          return (
            <li key={v.slug} className="min-w-0 sm:flex-1 sm:basis-[140px]">
              <Link
                to="/verticals/$slug"
                params={{ slug: v.slug }}
                data-loop-node
                data-magnetic
                tabIndex={isActive ? 0 : -1}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Vertical ${i + 1} of ${VERTICALS.length}: ${v.short}${
                  isActive ? ", current" : ""
                }`}
                onClick={() => navigate({ to: "/verticals/$slug", params: { slug: v.slug } })}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border p-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                  isActive
                    ? "border-ink/20 bg-white shadow-[0_18px_50px_-20px_rgba(17,17,17,0.28)]"
                    : "border-black/5 bg-white/60 hover:border-black/20 hover:bg-white/85"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="journey-active-glow"
                    aria-hidden
                    className="absolute inset-0 -z-10 opacity-70"
                    style={{
                      background: `radial-gradient(120% 80% at 50% 0%, ${v.color}22 0%, transparent 70%)`,
                    }}
                    transition={{ type: "spring", stiffness: 240, damping: 30 }}
                  />
                )}

                <div className="flex items-center justify-between">
                  <span
                    className="inline-block h-2 w-2 rounded-full transition-all duration-500"
                    style={{
                      background: v.color,
                      boxShadow: isActive ? `0 0 12px ${v.color}` : `0 0 4px ${v.color}80`,
                    }}
                  />
                  <span className="text-[9.5px] uppercase tracking-[0.24em] text-mist">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <div
                  className={`mt-3 font-display text-[13.5px] leading-snug tracking-tight ${
                    isActive ? "text-ink" : "text-ink/70 group-hover:text-ink"
                  }`}
                >
                  {v.short}
                </div>

                <div className="mt-auto pt-3 text-[9.5px] uppercase tracking-[0.24em] text-mist">
                  {v.category}
                </div>

                {/* Underline sweep — motion mirrors chapter rail */}
                <span
                  aria-hidden
                  className={`absolute bottom-0 left-0 h-[2px] w-full origin-left transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                  style={{
                    background: `linear-gradient(90deg, ${v.color}, transparent)`,
                  }}
                />
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="sr-only" role="status" aria-live="polite">
        {announce}
      </div>
    </section>
  );
}
