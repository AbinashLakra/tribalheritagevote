import React from 'react';

interface TribalRibbonBorderProps {
  className?: string;
  variant?: 'light' | 'dark';
}

/**
 * Traditional Adivasi / Warli dancing figures ribbon border.
 * Features repeating traditional dancing figures holding hands,
 * representing tribal community solidarity and festive celebration.
 */
export function TribalRibbonBorder({ className = '', variant = 'light' }: TribalRibbonBorderProps) {
  return (
    <div
      className={`w-full overflow-hidden border-y ${
        variant === 'dark'
          ? 'bg-blue-950/90 border-blue-800'
          : 'bg-[#fffaf3] border-blue-200'
      } ${className}`}
      aria-hidden="true"
    >
      <div className="flex w-[200%] md:w-full justify-between items-center py-1.5 px-2 select-none pointer-events-none opacity-90">
        <svg
          viewBox="0 0 1200 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-5 md:h-6"
          preserveAspectRatio="repeat"
        >
          {/* Pattern of 12 repeating dancing figures in Warli / Adivasi style */}
          {Array.from({ length: 24 }).map((_, i) => {
            const x = i * 50 + 10;
            // Alternating colors: forest green, terracotta, and gold
            const colors = ['#15803d', '#dc2626', '#d97706', '#2563eb'];
            const color = colors[i % colors.length];

            return (
              <g key={i} transform={`translate(${x}, 0)`}>
                {/* Head */}
                <circle cx="15" cy="6" r="3.5" fill={color} />
                {/* Torso: Two opposing triangles (traditional Warli hourglass shape) */}
                <polygon points="11,10 19,10 15,16" fill={color} />
                <polygon points="15,16 11,22 19,22" fill={color} />
                {/* Arms linked to adjacent figures */}
                <path
                  d="M11 11 L1 15 M19 11 L29 15"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Legs in dance stance */}
                <path
                  d="M13 22 L9 27 M17 22 L21 27"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                {/* Connecting join beads */}
                <circle cx="0" cy="15" r="1.5" fill="#f59e0b" />
                <circle cx="30" cy="15" r="1.5" fill="#f59e0b" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
