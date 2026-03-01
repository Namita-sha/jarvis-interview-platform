// src/components/InterviewCard.jsx
// Card shown on the dashboard for each past interview

import { Link } from "react-router-dom";

// Tech stack color mapping
const TECH_COLORS = {
  react: "#61DAFB",
  "node.js": "#68A063",
  typescript: "#3178C6",
  javascript: "#F7DF1E",
  python: "#3776AB",
  java: "#ED8B00",
  mongodb: "#47A248",
  postgresql: "#336791",
  "next.js": "#FFFFFF",
  vue: "#4FC08D",
  angular: "#DD0031",
  docker: "#2496ED",
};

const getTechColor = (tech) => {
  return TECH_COLORS[tech.toLowerCase()] || "#00E5FF";
};

// Score color based on value
const getScoreColor = (score) => {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-jarvis-cyan";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
};

// Format date nicely
const formatDate = (timestamp) => {
  if (!timestamp) return "Unknown date";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function InterviewCard({ interview }) {
  const { id, role, level, type, techstack, feedback, createdAt, finalized } = interview;
  const score = feedback?.totalScore;

  return (
    <div className="group relative bg-jarvis-card border border-jarvis-border rounded-lg p-5 hover:border-jarvis-cyan/40 transition-all duration-300 hover:shadow-cyan/20 hover:shadow-lg flex flex-col gap-4 overflow-hidden">
      
      {/* Top glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-jarvis-cyan/0 to-transparent group-hover:via-jarvis-cyan/50 transition-all duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-jarvis-text capitalize">
            {role}
          </h3>
          <p className="text-jarvis-muted text-xs mt-1 font-mono">
            {level} · {type}
          </p>
        </div>

        {/* Score badge */}
        {score !== undefined ? (
          <div className="flex flex-col items-center">
            <span className={`font-display font-bold text-xl ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-jarvis-muted text-xs">/100</span>
          </div>
        ) : (
          <span className="px-2 py-1 rounded text-xs bg-jarvis-border text-jarvis-muted font-mono">
            {finalized ? "Processing" : "Not taken"}
          </span>
        )}
      </div>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-1.5">
        {(techstack || []).slice(0, 4).map((tech) => (
          <span
            key={tech}
            className="px-2 py-0.5 rounded text-xs font-mono border border-jarvis-border"
            style={{ color: getTechColor(tech) }}
          >
            {tech}
          </span>
        ))}
        {(techstack || []).length > 4 && (
          <span className="px-2 py-0.5 rounded text-xs font-mono border border-jarvis-border text-jarvis-muted">
            +{techstack.length - 4}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-jarvis-border">
        <p className="text-jarvis-muted text-xs font-mono">{formatDate(createdAt)}</p>

        <div className="flex gap-2">
          {feedback ? (
            <Link
              to={`/feedback/${id}`}
              className="px-3 py-1.5 rounded text-xs border border-jarvis-cyan/40 text-jarvis-cyan font-display hover:bg-jarvis-cyan/10 transition-colors"
            >
              View Feedback
            </Link>
          ) : (
            <Link
              to={`/interview/${id}`}
              className="px-3 py-1.5 rounded text-xs border border-jarvis-blue/40 text-jarvis-blue font-display hover:bg-jarvis-blue/10 transition-colors"
            >
              Start Interview
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}