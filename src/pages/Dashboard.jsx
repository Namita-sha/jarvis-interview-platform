// src/pages/Dashboard.jsx
// Shows all past interviews and stats

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import InterviewCard from "../components/InterviewCard";

export default function Dashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, [user]);

  const fetchInterviews = async () => {
    try {
      // Query Firestore for this user's interviews, newest first
      const q = query(
        collection(db, "interviews"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInterviews(data);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const completedInterviews = interviews.filter((i) => i.feedback);
  const avgScore = completedInterviews.length
    ? Math.round(
        completedInterviews.reduce((sum, i) => sum + (i.feedback?.totalScore || 0), 0) /
          completedInterviews.length
      )
    : 0;
  const bestScore = completedInterviews.length
    ? Math.max(...completedInterviews.map((i) => i.feedback?.totalScore || 0))
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <p className="text-jarvis-muted text-sm font-mono mb-1">
            Welcome back,
          </p>
          <h1 className="font-display font-bold text-3xl text-jarvis-text">
            {user?.displayName?.split(" ")[0] || "Candidate"}
          </h1>
        </div>
        <Link
          to="/setup"
          className="inline-flex items-center gap-2 px-6 py-3 rounded border border-jarvis-cyan bg-jarvis-cyan/10 text-jarvis-cyan font-display font-semibold hover:bg-jarvis-cyan/20 transition-all duration-200 shadow-cyan/30 hover:shadow-cyan"
        >
          <span className="text-xl">+</span>
          <span>New Interview</span>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Sessions", value: interviews.length, unit: "" },
          { label: "Completed", value: completedInterviews.length, unit: "" },
          { label: "Average Score", value: avgScore, unit: "/100" },
          { label: "Best Score", value: bestScore, unit: "/100" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="relative bg-jarvis-card border border-jarvis-border rounded-lg p-4 corner-tl corner-br overflow-hidden"
          >
            <p className="text-jarvis-muted text-xs font-mono mb-1">{stat.label}</p>
            <p className="font-display font-bold text-2xl text-jarvis-cyan">
              {stat.value}
              <span className="text-jarvis-muted text-sm">{stat.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Interviews List */}
      <div>
        <h2 className="font-display font-semibold text-lg text-jarvis-text mb-6 flex items-center gap-3">
          <span>Recent Interviews</span>
          <div className="flex-1 h-px bg-jarvis-border" />
        </h2>

        {loading ? (
          // Loading skeleton
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-jarvis-card border border-jarvis-border rounded-lg animate-pulse" />
            ))}
          </div>
        ) : interviews.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full border border-jarvis-border flex items-center justify-center mb-4">
              <span className="text-2xl">🎙</span>
            </div>
            <p className="text-jarvis-text font-display font-semibold text-lg mb-2">
              No interviews yet
            </p>
            <p className="text-jarvis-muted text-sm mb-6">
              Start your first mock interview to get AI-powered feedback
            </p>
            <Link
              to="/setup"
              className="px-6 py-2.5 rounded border border-jarvis-cyan text-jarvis-cyan font-display text-sm hover:bg-jarvis-cyan/10 transition-colors"
            >
              Start First Interview
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}