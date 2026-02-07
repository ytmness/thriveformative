"use client";

interface WaveDividerProps {
  flip?: boolean;
  className?: string;
  variant?: "primary" | "subtle" | "accent";
}

export default function WaveDivider({
  flip = false,
  className = "",
  variant = "primary",
}: WaveDividerProps) {
  const opacityMap = {
    primary: { back: 0.06, mid: 0.14, front: 0.24 },
    subtle: { back: 0.04, mid: 0.08, front: 0.14 },
    accent: { back: 0.08, mid: 0.18, front: 0.32 },
  };

  const o = opacityMap[variant];

  return (
    <div
      className={`wave-divider ${flip ? "wave-flip" : ""} ${className}`}
      aria-hidden="true"
    >
      <svg
        className="wave-svg"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back wave — slowest drift, widest curves */}
        <path
          className="wave-layer wave-back"
          d="M0,30 C360,85 720,5 1080,50 C1260,68 1380,35 1440,42 L1440,120 L0,120 Z"
          style={{ fillOpacity: o.back }}
        />
        {/* Middle wave — medium rhythm */}
        <path
          className="wave-layer wave-mid"
          d="M0,52 C240,92 480,18 720,58 C960,92 1200,28 1440,52 L1440,120 L0,120 Z"
          style={{ fillOpacity: o.mid }}
        />
        {/* Front wave — closest, most visible */}
        <path
          className="wave-layer wave-front"
          d="M0,68 C200,98 420,42 660,72 C900,98 1140,48 1440,68 L1440,120 L0,120 Z"
          style={{ fillOpacity: o.front }}
        />
      </svg>
    </div>
  );
}
