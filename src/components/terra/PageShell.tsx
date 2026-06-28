"use client";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SmoothScroll } from "./SmoothScroll";
import { EnergyCursor } from "./Cursor";
import { ParticleNetwork } from "./ParticleNetwork";
import { TopNav } from "./Nav";
import { EnergyDivider } from "./Divider";
import { FlowProvider } from "./FlowContext";

/**
 * Shared chrome for sub-pages (Planet, Ecosystem, Circular, Impact, Verticals).
 * Provides the floating nav, ambient background systems, and a "Return to the
 * journey" footer that loops users back to the cinematic landing experience.
 */
export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SmoothScroll />
      <ParticleNetwork />
      <EnergyCursor />
      <FlowProvider>
        <TopNav />

        <main className="relative z-10">
          <section className="relative mx-auto w-full max-w-7xl px-6 pt-40 pb-16 md:pt-48 md:pb-24">
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-mist">
              <span className="inline-block h-px w-8 bg-mist/40" />
              {eyebrow}
            </div>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6vw,5rem)] leading-[0.98] tracking-[-0.02em] text-balance">
              {title}
            </h1>
            {intro && (
              <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-mist">{intro}</p>
            )}
          </section>

          {children}

          <EnergyDivider />

          <section className="relative mx-auto w-full max-w-7xl px-6 py-24 text-center">
            <div className="text-[11px] uppercase tracking-[0.28em] text-mist">Return to the loop</div>
            <div className="mt-4 font-display text-[clamp(1.8rem,3.4vw,2.8rem)] leading-tight tracking-tight">
              Every pathway leads back to the whole.
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                data-magnetic
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-ink px-6 py-3 text-[12.5px] font-medium text-white transition-all duration-300 hover:shadow-[0_22px_60px_-15px_rgba(244,176,0,0.6)]"
              >
                <span className="relative z-10">Re-enter the journey</span>
                <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">↻</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-gold via-green to-earth transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0" />
              </Link>
              <Link
                to="/verticals"
                data-magnetic
                className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-5 py-2.5 text-[12.5px] font-medium backdrop-blur transition hover:border-black/20"
              >
                Explore the verticals →
              </Link>
            </div>
          </section>
        </main>
      </FlowProvider>
    </>
  );
}
