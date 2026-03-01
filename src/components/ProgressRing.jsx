// src/components/ProgressRing.jsx
// Animated circular score display

export default function ProgressRing({ score, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (score >= 80) return "#4ade80"; // green
    if (score >= 60) return "#00E5FF"; // cyan
    if (score >= 40) return "#facc15"; // yellow
    return "#f87171"; // red
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0E2040"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      
      {/* Score text in center */}
      <div className="absolute flex flex-col items-center">
        <span
          className="font-display font-bold leading-none"
          style={{ fontSize: size * 0.22, color: getColor() }}
        >
          {score}
        </span>
        <span className="text-jarvis-muted font-mono" style={{ fontSize: size * 0.1 }}>
          /100
        </span>
      </div>
    </div>
  );
}