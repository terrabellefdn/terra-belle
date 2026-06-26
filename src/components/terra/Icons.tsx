/**
 * Always-alive icons. Each one represents a pillar and pulses /
 * rotates / ripples gently to reinforce the ecosystem metaphor.
 */

const STROKE = 1.4;

export function LeafIcon({ size = 28, color = "#0DBB63" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M6 26 C 6 14, 14 6, 26 6 C 26 18, 18 26, 6 26 Z"
        stroke={color} strokeWidth={STROKE} fill={color + "18"}
      >
        <animate attributeName="d" dur="6s" repeatCount="indefinite"
          values="M6 26 C 6 14, 14 6, 26 6 C 26 18, 18 26, 6 26 Z;
                  M6 26 C 4 13, 13 4, 26 6 C 28 19, 19 28, 6 26 Z;
                  M6 26 C 6 14, 14 6, 26 6 C 26 18, 18 26, 6 26 Z" />
      </path>
      <path d="M6 26 L 22 10" stroke={color} strokeWidth={STROKE} />
    </svg>
  );
}

export function SunIcon({ size = 28, color = "#F4B000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="5" stroke={color} strokeWidth={STROKE} fill={color + "33"} />
      <g stroke={color} strokeWidth={STROKE} strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
          <line key={d} x1="16" y1="3" x2="16" y2="7" transform={`rotate(${d} 16 16)`}>
            <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + (d % 3)}s`} repeatCount="indefinite" />
          </line>
        ))}
      </g>
    </svg>
  );
}

export function WaterIcon({ size = 28, color = "#0E46B8" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {[5, 9, 13].map((r, i) => (
        <circle key={r} cx="16" cy="16" r={r} stroke={color} strokeWidth={STROKE} opacity={0.7 - i * 0.2}>
          <animate attributeName="r" values={`${r};${r + 3};${r}`} dur={`${3 + i}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values={`${0.7 - i * 0.2};0;${0.7 - i * 0.2}`} dur={`${3 + i}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export function WindIcon({ size = 28, color = "#6B8CF7" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <g transform="translate(16 16)" stroke={color} strokeWidth={STROKE} strokeLinecap="round">
        <g>
          <line x1="0" y1="-10" x2="0" y2="-2" />
          <line x1="0" y1="-10" x2="0" y2="-2" transform="rotate(120)" />
          <line x1="0" y1="-10" x2="0" y2="-2" transform="rotate(240)" />
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite" />
        </g>
        <circle cx="0" cy="0" r="2" fill={color} />
      </g>
    </svg>
  );
}

export function NetworkIcon({ size = 28, color = "#111111" }: { size?: number; color?: string }) {
  const nodes = [
    [16, 4], [4, 14], [28, 14], [10, 26], [22, 26],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {nodes.map(([x, y], i) =>
        nodes.slice(i + 1).map(([x2, y2], j) => (
          <line key={`${i}-${j}`} x1={x} y1={y} x2={x2} y2={y2} stroke={color} strokeWidth="0.7" opacity="0.35" />
        ))
      )}
      {nodes.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2" fill={color}>
          <animate attributeName="opacity" values="0.4;1;0.4" dur={`${1.6 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export function ChartIcon({ size = 28, color = "#F4B000" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M4 24 L 11 16 L 17 20 L 28 6" stroke={color} strokeWidth={STROKE} fill="none">
        <animate attributeName="stroke-dasharray" values="0 60;60 0" dur="3s" repeatCount="indefinite" />
      </path>
      <line x1="4" y1="28" x2="28" y2="28" stroke={color} strokeWidth={STROKE} opacity="0.4" />
    </svg>
  );
}

export function AIIcon({ size = 28, color = "#6B8CF7" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="3" fill={color}>
        <animate attributeName="r" values="3;4.5;3" dur="2.4s" repeatCount="indefinite" />
      </circle>
      {[0, 60, 120, 180, 240, 300].map((d) => (
        <g key={d} transform={`rotate(${d} 16 16)`}>
          <line x1="16" y1="9" x2="16" y2="6" stroke={color} strokeWidth={STROKE} />
          <circle cx="16" cy="5" r="1.4" fill={color}>
            <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.8 + (d % 4) * 0.2}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}

export function CircleIcon({ size = 28, color = "#0DBB63" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="10" stroke={color} strokeWidth={STROKE} strokeDasharray="3 4">
        <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="14s" repeatCount="indefinite" />
      </circle>
      <path d="M11 16 L 15 20 L 21 12" stroke={color} strokeWidth={STROKE} fill="none" />
    </svg>
  );
}
