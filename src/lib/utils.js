// src/lib/utils.js
// Helper utility functions used across the app

// ─── DATE FORMATTING ─────────────────────────────────────────────────────────

/**
 * Formats a Firestore timestamp or JS Date into a readable string
 * e.g. "Mar 15, 2024 at 10:30 AM"
 */
export function formatDate(timestamp) {
  if (!timestamp) return "Unknown date";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Returns a relative time string like "2 days ago", "just now"
 */
export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(timestamp);
}

// ─── SCORE UTILITIES ─────────────────────────────────────────────────────────

/**
 * Returns color class and label based on score 0-100
 */
export function getScoreInfo(score) {
  if (score >= 85) return { label: "Excellent", color: "#4ade80", tailwind: "text-green-400", bg: "bg-green-400/10 border-green-400/30" };
  if (score >= 70) return { label: "Good", color: "#00E5FF", tailwind: "text-jarvis-cyan", bg: "bg-jarvis-cyan/10 border-jarvis-cyan/30" };
  if (score >= 55) return { label: "Average", color: "#facc15", tailwind: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" };
  if (score >= 40) return { label: "Below Average", color: "#fb923c", tailwind: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" };
  return { label: "Needs Work", color: "#f87171", tailwind: "text-red-400", bg: "bg-red-400/10 border-red-400/30" };
}

/**
 * Calculates average score from an array of interviews
 */
export function calcAverageScore(interviews) {
  const withFeedback = interviews.filter((i) => i.feedback?.totalScore != null);
  if (!withFeedback.length) return 0;
  const total = withFeedback.reduce((sum, i) => sum + i.feedback.totalScore, 0);
  return Math.round(total / withFeedback.length);
}

// ─── TECH STACK UTILITIES ────────────────────────────────────────────────────

// Maps tech names to their brand colors
const TECH_COLORS = {
  react: "#61DAFB",
  "next.js": "#FFFFFF",
  vue: "#4FC08D",
  angular: "#DD0031",
  svelte: "#FF3E00",
  typescript: "#3178C6",
  javascript: "#F7DF1E",
  "node.js": "#68A063",
  express: "#68A063",
  python: "#3776AB",
  django: "#092E20",
  fastapi: "#009688",
  java: "#ED8B00",
  "spring boot": "#6DB33F",
  mongodb: "#47A248",
  postgresql: "#336791",
  mysql: "#4479A1",
  redis: "#DC382D",
  docker: "#2496ED",
  kubernetes: "#326CE5",
  aws: "#FF9900",
  firebase: "#FFCA28",
  graphql: "#E10098",
  tailwindcss: "#06B6D4",
  flutter: "#02569B",
  "react native": "#61DAFB",
  git: "#F05032",
};

/**
 * Returns a brand color for a given tech name, or default cyan
 */
export function getTechColor(tech) {
  return TECH_COLORS[tech.toLowerCase()] || "#00E5FF";
}

// ─── STRING UTILITIES ─────────────────────────────────────────────────────────

/**
 * Capitalizes first letter of each word
 */
export function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Truncates text to a max length, adding ellipsis
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

// ─── BROWSER COMPATIBILITY ────────────────────────────────────────────────────

/**
 * Checks if the browser supports the Web Speech API (both synthesis + recognition)
 */
export function checkSpeechSupport() {
  const synthesis = "speechSynthesis" in window;
  const recognition = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  return { synthesis, recognition, full: synthesis && recognition };
}

/**
 * Returns browser name for user-facing messages
 */
export function getBrowserName() {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  return "your browser";
}

// ─── TRANSCRIPT UTILITIES ─────────────────────────────────────────────────────

/**
 * Formats a raw transcript array into a readable string
 * Used when displaying conversation history
 */
export function formatTranscriptForDisplay(transcript) {
  return transcript
    .map((entry) => {
      const speaker = entry.role === "interviewer" ? "JARVIS" : "You";
      return `${speaker}: ${entry.content}`;
    })
    .join("\n\n");
}

/**
 * Estimates how many minutes an interview took based on transcript length
 */
export function estimateDuration(transcript) {
  const totalWords = transcript.reduce((sum, t) => sum + t.content.split(" ").length, 0);
  const minutes = Math.ceil(totalWords / 130); // avg speaking pace ~130 wpm
  return minutes;
}

// ─── RANDOM UTILITIES ─────────────────────────────────────────────────────────

/**
 * Generates a random greeting for the dashboard
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Returns a motivational tip based on score
 */
export function getMotivationalTip(score) {
  if (score >= 85) return "Outstanding performance! You're ready for real interviews.";
  if (score >= 70) return "Solid effort! Work on weak areas and you'll nail it.";
  if (score >= 55) return "Good foundation. Keep practicing — consistency builds confidence.";
  if (score >= 40) return "Room to grow. Review the feedback and try again tomorrow.";
  return "Don't get discouraged — every attempt makes you sharper. Keep going!";
}