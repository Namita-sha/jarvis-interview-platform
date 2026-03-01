// src/pages/Feedback.jsx
// Displays AI evaluation results with detailed scores

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import ProgressRing from "../components/ProgressRing";

const CATEGORY_ICONS = {
  "Communication Skills": "💬",
  "Technical Knowledge": "🧠",
  "Problem Solving": "🔧",
  "Cultural & Role Fit": "🤝",
  "Confidence & Clarity": "⚡",
};

const getScoreLabel = (score) => {
  if (score >= 85) return { label: "Excellent", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" };
  if (score >= 70) return { label: "Good", color: "text-jarvis-cyan", bg: "bg-jarvis-cyan/10 border-jarvis-cyan/30" };
  if (score >= 55) return { label: "Average", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" };
  return { label: "Needs Work", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" };
};

const formatDate = (timestamp) => {
  if (!timestamp) return "Unknown";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function Feedback() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const snap = await getDoc(doc(db, "interviews", id));
      if (snap.exists()) setInterview({ id: snap.id, ...snap.data() });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-jarvis-border border-t-jarvis-cyan rounded-full animate-spin" />
      </div>
    );
  }

  if (!interview?.feedback) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-jarvis-muted">Feedback not found.</p>
        <Link to="/dashboard" className="text-jarvis-cyan hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const { feedback, role, level, type, techstack, createdAt } = interview;
  const overallLabel = getScoreLabel(feedback.totalScore);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 animate-fade-in">
      
      {/* Header */}
      <div className="mb-10">
        <p className="text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-2">
          Interview Evaluation
        </p>
        <h1 className="font-display font-bold text-3xl text-jarvis-text capitalize">
          {role} <span className="text-jarvis-muted font-normal text-xl">— {level}</span>
        </h1>
        <p className="text-jarvis-muted text-sm mt-1 font-mono">{formatDate(createdAt)}</p>
      </div>

      {/* Score hero section */}
      <div className="bg-jarvis-card border border-jarvis-border rounded-xl p-8 mb-8 flex flex-col sm:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <ProgressRing score={feedback.totalScore} size={150} strokeWidth={10} />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-mono mb-3 ${overallLabel.bg}`}>
            <span className={overallLabel.color}>{overallLabel.label}</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-jarvis-text mb-3">
            Overall Performance
          </h2>
          <p className="text-jarvis-muted leading-relaxed">
            {feedback.finalAssessment}
          </p>
        </div>
      </div>

      {/* Category scores */}
      <div className="mb-8">
        <h2 className="font-display font-semibold text-lg text-jarvis-text mb-5 flex items-center gap-3">
          <span>Score Breakdown</span>
          <div className="flex-1 h-px bg-jarvis-border" />
        </h2>

        <div className="space-y-4">
          {feedback.categoryScores?.map((cat, i) => {
            const catLabel = getScoreLabel(cat.score);
            return (
              <div
                key={i}
                className="bg-jarvis-card border border-jarvis-border rounded-lg p-5 hover:border-jarvis-cyan/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span>{CATEGORY_ICONS[cat.name] || "📊"}</span>
                    <span className="font-display font-semibold text-jarvis-text">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-mono ${catLabel.color}`}>{catLabel.label}</span>
                    <span className={`font-display font-bold text-lg ${catLabel.color}`}>
                      {cat.score}
                      <span className="text-jarvis-muted text-sm font-normal">/100</span>
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-1.5 bg-jarvis-border rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${cat.score}%`,
                      background: cat.score >= 80 ? "#4ade80" : cat.score >= 60 ? "#00E5FF" : cat.score >= 40 ? "#facc15" : "#f87171",
                    }}
                  />
                </div>

                <p className="text-jarvis-muted text-sm leading-relaxed">{cat.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        {/* Strengths */}
        <div className="bg-jarvis-card border border-green-400/20 rounded-lg p-5">
          <h3 className="font-display font-semibold text-green-400 mb-4 flex items-center gap-2">
            <span>✦</span>
            <span>Strengths</span>
          </h3>
          <ul className="space-y-2">
            {feedback.strengths?.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-jarvis-muted">
                <span className="text-green-400 mt-0.5 flex-shrink-0">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for improvement */}
        <div className="bg-jarvis-card border border-yellow-400/20 rounded-lg p-5">
          <h3 className="font-display font-semibold text-yellow-400 mb-4 flex items-center gap-2">
            <span>◈</span>
            <span>Areas to Improve</span>
          </h3>
          <ul className="space-y-2">
            {feedback.areasForImprovement?.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-jarvis-muted">
                <span className="text-yellow-400 mt-0.5 flex-shrink-0">→</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tech stack used */}
      <div className="mb-8">
        <p className="text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-3">Tech Stack Evaluated</p>
        <div className="flex flex-wrap gap-2">
          {techstack?.map((t) => (
            <span key={t} className="px-3 py-1 rounded border border-jarvis-border text-jarvis-cyan/70 text-sm font-mono">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-jarvis-border">
        <Link
          to="/dashboard"
          className="flex-1 py-3 rounded border border-jarvis-border text-jarvis-muted font-display font-semibold text-center hover:border-jarvis-cyan/30 hover:text-jarvis-cyan transition-all"
        >
          ← Dashboard
        </Link>
        <Link
          to="/setup"
          className="flex-1 py-3 rounded bg-jarvis-cyan text-jarvis-bg font-display font-bold text-center hover:bg-jarvis-cyan/90 transition-all shadow-cyan"
        >
          New Interview
        </Link>
      </div>
    </div>
  );
}