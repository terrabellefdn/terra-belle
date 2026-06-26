/**
 * Organic flowing divider — energy currents morphing between sections.
 * No hard edges; uses the logo's curved geometry as inspiration.
 */
export function EnergyDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className="relative h-32 w-full overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className={`absolute inset-0 h-full w-full ${flip ? "scale-y-[-1]" : ""}`}
      >
        <defs>
          <linearGradient id="divFlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F4B000" stopOpacity="0" />
            <stop offset="25%" stopColor="#F4B000" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#0DBB63" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#0E46B8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#6B8CF7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="divFlow2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0E46B8" stopOpacity="0" />
            <stop offset="50%" stopColor="#0DBB63" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F4B000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M -50 100 C 280 30, 560 170, 760 100 S 1240 30, 1500 110"
          stroke="url(#divFlow)"
          strokeWidth="1"
          fill="none"
        >
          <animate attributeName="d"
            dur="14s" repeatCount="indefinite"
            values="M -50 100 C 280 30, 560 170, 760 100 S 1240 30, 1500 110;
                    M -50 110 C 280 170, 560 30, 760 110 S 1240 170, 1500 90;
                    M -50 100 C 280 30, 560 170, 760 100 S 1240 30, 1500 110"
          />
        </path>
        <path
          d="M -50 130 C 320 90, 640 180, 880 120 S 1260 60, 1500 140"
          stroke="url(#divFlow2)"
          strokeWidth="0.8"
          fill="none"
        >
          <animate attributeName="d"
            dur="20s" repeatCount="indefinite"
            values="M -50 130 C 320 90, 640 180, 880 120 S 1260 60, 1500 140;
                    M -50 120 C 320 180, 640 70, 880 140 S 1260 180, 1500 100;
                    M -50 130 C 320 90, 640 180, 880 120 S 1260 60, 1500 140"
          />
        </path>
      </svg>
    </div>
  );
}
