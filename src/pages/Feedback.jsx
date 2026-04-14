// src/pages/Feedback.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { evaluateInterview } from "../lib/gemini";
import ProgressRing from "../components/ProgressRing";

const CATEGORY_ICONS = {
  "Communication Skills": "💬",
  "Technical Knowledge":  "🧠",
  "Problem Solving":      "🔧",
  "Cultural & Role Fit":  "🤝",
  "Confidence & Clarity": "⚡",
};

const getScoreLabel = (score) => {
  if (score >= 85) return { label: "Excellent",  color: "rgba(0,210,255,0.95)", border: "rgba(0,210,255,0.2)"  };
  if (score >= 70) return { label: "Good",        color: "rgba(0,200,255,0.75)", border: "rgba(0,200,255,0.15)" };
  if (score >= 55) return { label: "Average",     color: "rgba(0,180,255,0.55)", border: "rgba(0,180,255,0.12)" };
  return             { label: "Needs Work",       color: "rgba(0,160,255,0.35)", border: "rgba(0,160,255,0.1)"  };
};

const formatDate = (timestamp) => {
  if (!timestamp) return "Unknown";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function Feedback() {
  const { id } = useParams();
  const [interview, setInterview]      = useState(null);
  const [loading, setLoading]          = useState(true);
  const [reEvalLoading, setReEvalLoad] = useState(false);
  const [reEvalMsg, setReEvalMsg]      = useState("");

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, "interviews", id));
      if (snap.exists()) setInterview({ id: snap.id, ...snap.data() });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReEvaluate = async () => {
    if (!interview?.transcript || interview.transcript.length === 0) {
      setReEvalMsg("❌ No transcript found. Please complete a new interview session.");
      return;
    }
    setReEvalLoad(true);
    setReEvalMsg("⏳ Re-evaluating with Gemini AI...");
    try {
      const feedback = await evaluateInterview({
        transcript: interview.transcript,
        role:       interview.role,
        level:      interview.level,
        techstack:  interview.techstack,
      });
      await updateDoc(doc(db, "interviews", id), { feedback });
      setReEvalMsg("✅ Re-evaluation complete!");
      await fetchData();
    } catch (err) {
      console.error(err);
      setReEvalMsg("❌ Failed: " + err.message);
    } finally {
      setReEvalLoad(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh" }}>
        <div style={{
          width:40, height:40,
          border:"2px solid rgba(0,200,255,0.15)",
          borderTop:"2px solid rgba(0,200,255,0.8)",
          borderRadius:"50%",
          animation:"spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!interview?.feedback) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"80vh", gap:16 }}>
        <p style={{ color:"rgba(255,255,255,0.3)", fontFamily:"JetBrains Mono,monospace" }}>
          Feedback not available.
        </p>
        <Link to="/dashboard" style={{ color:"rgba(0,200,255,0.7)", textDecoration:"none" }}>
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const { feedback, role, level, techstack, createdAt } = interview;
  const overall = getScoreLabel(feedback.totalScore);

  return (
    <div style={{ maxWidth:860, margin:"0 auto", padding:"40px 24px 0" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom:32 }}>
        <p style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", marginBottom:8 }}>
          PERFORMANCE REPORT
        </p>
        <h1 style={{ fontFamily:"Exo 2,sans-serif", fontWeight:700, fontSize:28, color:"#E8F4FF", textTransform:"capitalize", margin:0 }}>
          {role} <span style={{ color:"rgba(255,255,255,0.25)", fontWeight:400, fontSize:18 }}>— {level}</span>
        </h1>
        <p style={{ fontFamily:"JetBrains Mono,monospace", fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:6 }}>
          {formatDate(createdAt)}
        </p>
      </div>

      {/* ── Score Hero ── */}
      <div style={{
        background:"#0D1117", border:"1px solid rgba(0,200,255,0.12)",
        borderRadius:8, padding:32, marginBottom:24,
        display:"flex", flexDirection:"column", gap:24, alignItems:"center",
      }}>
        <div style={{ display:"flex", flexDirection:"row", gap:32, alignItems:"center", flexWrap:"wrap", justifyContent:"center" }}>
          <ProgressRing score={feedback.totalScore} size={140} strokeWidth={10} />
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{
              display:"inline-block", padding:"4px 12px", borderRadius:4,
              border:`1px solid ${overall.border}`,
              color: overall.color,
              fontFamily:"JetBrains Mono,monospace", fontSize:11, letterSpacing:2,
              marginBottom:12, textTransform:"uppercase",
            }}>
              {overall.label}
            </div>
            <h2 style={{ fontFamily:"Exo 2,sans-serif", fontWeight:700, fontSize:20, color:"#E8F4FF", margin:"0 0 10px" }}>
              Overall Assessment
            </h2>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14, lineHeight:1.7, margin:0 }}>
              {feedback.finalAssessment}
            </p>
          </div>
        </div>

        {/* Re-evaluate */}
        <div style={{ width:"100%", borderTop:"1px solid rgba(0,200,255,0.08)", paddingTop:20 }}>
          {reEvalMsg && (
            <p style={{
              fontFamily:"JetBrains Mono,monospace", fontSize:12,
              color: reEvalMsg.startsWith("✅") ? "rgba(0,210,255,0.8)"
                   : reEvalMsg.startsWith("❌") ? "rgba(255,80,80,0.8)"
                   : "rgba(0,200,255,0.7)",
              marginBottom:12, textAlign:"center",
            }}>
              {reEvalMsg}
            </p>
          )}
          <button
            onClick={handleReEvaluate}
            disabled={reEvalLoading}
            style={{
              display:"block", width:"100%", padding:"12px",
              background:"transparent",
              border:"1px solid rgba(0,200,255,0.25)",
              color:"rgba(0,200,255,0.7)",
              fontFamily:"JetBrains Mono,monospace", fontSize:12, letterSpacing:2,
              cursor: reEvalLoading ? "not-allowed" : "pointer",
              borderRadius:4, opacity: reEvalLoading ? 0.4 : 1,
              transition:"all 0.2s",
            }}
            onMouseEnter={e => { e.target.style.background = "rgba(0,200,255,0.04)"; e.target.style.borderColor = "rgba(0,200,255,0.4)"; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.borderColor = "rgba(0,200,255,0.25)"; }}
          >
            {reEvalLoading ? "⏳ EVALUATING..." : "↺ RE-EVALUATE WITH AI"}
          </button>
        </div>
      </div>

      {/* ── Category Scores ── */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontFamily:"Exo 2,sans-serif", fontWeight:600, fontSize:16, color:"rgba(255,255,255,0.6)", marginBottom:16, display:"flex", alignItems:"center", gap:12, letterSpacing:2 }}>
          EVALUATION VECTORS
          <div style={{ flex:1, height:1, background:"rgba(0,200,255,0.08)" }} />
        </h2>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {feedback.categoryScores?.map((cat, i) => {
            const lbl = getScoreLabel(cat.score);
            return (
              <div key={i} style={{
                background:"#0D1117",
                border:"1px solid rgba(0,200,255,0.08)",
                borderRadius:6, padding:20,
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:15 }}>{CATEGORY_ICONS[cat.name] || "◈"}</span>
                    <span style={{ fontFamily:"Exo 2,sans-serif", fontWeight:600, color:"rgba(232,244,255,0.85)", fontSize:14 }}>
                      {String(i+1).padStart(2,"0")} {cat.name}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, color:lbl.color, letterSpacing:1 }}>{lbl.label}</span>
                    <span style={{ fontFamily:"Exo 2,sans-serif", fontWeight:700, fontSize:20, color:lbl.color }}>
                      {cat.score}<span style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>/100</span>
                    </span>
                  </div>
                </div>

                {/* Score bar — all cyan, opacity encodes level */}
                <div style={{ height:2, background:"rgba(255,255,255,0.05)", borderRadius:2, overflow:"hidden", marginBottom:10 }}>
                  <div style={{
                    height:"100%", width:`${cat.score}%`, borderRadius:2,
                    background: cat.score >= 80 ? "rgba(0,210,255,0.85)"
                              : cat.score >= 60 ? "rgba(0,200,255,0.6)"
                              : cat.score >= 40 ? "rgba(0,190,255,0.35)"
                              : "rgba(0,170,255,0.2)",
                    transition:"width 1s ease",
                  }} />
                </div>

                <p style={{ color:"rgba(255,255,255,0.35)", fontSize:13, lineHeight:1.6, margin:0 }}>{cat.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Strengths & Improvements ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24 }}>

        {/* Strengths — slightly brighter cyan accent */}
        <div style={{
          background:"#0D1117",
          border:"1px solid rgba(0,200,255,0.12)",
          borderLeft:"2px solid rgba(0,210,255,0.35)",
          borderRadius:6, padding:20,
        }}>
          <h3 style={{
            fontFamily:"JetBrains Mono,monospace", fontWeight:600,
            color:"rgba(0,210,255,0.7)",
            marginBottom:14, fontSize:10, letterSpacing:3, textTransform:"uppercase",
          }}>
            ✦ Strengths Identified
          </h3>
          <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
            {feedback.strengths?.map((s, i) => (
              <li key={i} style={{ display:"flex", gap:8, fontSize:13, color:"rgba(255,255,255,0.4)", lineHeight:1.5 }}>
                <span style={{ color:"rgba(0,210,255,0.5)", flexShrink:0 }}>→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for improvement — dimmer cyan accent */}
        <div style={{
          background:"#0D1117",
          border:"1px solid rgba(0,200,255,0.08)",
          borderLeft:"2px solid rgba(0,200,255,0.18)",
          borderRadius:6, padding:20,
        }}>
          <h3 style={{
            fontFamily:"JetBrains Mono,monospace", fontWeight:600,
            color:"rgba(0,190,255,0.45)",
            marginBottom:14, fontSize:10, letterSpacing:3, textTransform:"uppercase",
          }}>
            ◈ Areas for Improvement
          </h3>
          <ul style={{ listStyle:"none", padding:0, margin:0, display:"flex", flexDirection:"column", gap:10 }}>
            {feedback.areasForImprovement?.map((a, i) => (
              <li key={i} style={{ display:"flex", gap:8, fontSize:13, color:"rgba(255,255,255,0.35)", lineHeight:1.5 }}>
                <span style={{ color:"rgba(0,190,255,0.3)", flexShrink:0 }}>→</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Tech Stack ── */}
      <div style={{ marginBottom:24 }}>
        <p style={{ fontFamily:"JetBrains Mono,monospace", fontSize:10, letterSpacing:3, color:"rgba(255,255,255,0.2)", textTransform:"uppercase", marginBottom:10 }}>
          TECHNOLOGIES EVALUATED
        </p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {techstack?.map((t) => (
            <span key={t} style={{
              padding:"4px 12px", borderRadius:3,
              border:"1px solid rgba(0,200,255,0.15)",
              color:"rgba(0,200,255,0.5)",
              fontFamily:"JetBrains Mono,monospace", fontSize:11,
              letterSpacing:1,
            }}>
              {t.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div style={{ display:"flex", gap:12, marginBottom:0, flexWrap:"wrap" }}>
        <Link to="/dashboard" style={{
          flex:1, minWidth:140, padding:"12px 20px", textAlign:"center",
          background:"transparent", border:"1px solid rgba(0,200,255,0.15)",
          color:"rgba(255,255,255,0.4)", fontFamily:"Exo 2,sans-serif",
          fontWeight:600, fontSize:13, borderRadius:4, textDecoration:"none",
          transition:"all 0.2s",
        }}
          onMouseEnter={e => { e.target.style.borderColor="rgba(0,200,255,0.4)"; e.target.style.color="rgba(0,200,255,0.8)"; }}
          onMouseLeave={e => { e.target.style.borderColor="rgba(0,200,255,0.15)"; e.target.style.color="rgba(255,255,255,0.4)"; }}
        >
          ← MISSION LOGS
        </Link>
        <Link to="/setup" style={{
          flex:1, minWidth:140, padding:"12px 20px", textAlign:"center",
          background:"rgba(0,200,255,0.9)", border:"none",
          color:"#06090F", fontFamily:"Exo 2,sans-serif",
          fontWeight:700, fontSize:13, borderRadius:4, textDecoration:"none",
        }}>
          INITIATE NEW SESSION →
        </Link>
      </div>

      {/* ── Copyright Footer ── */}
      <div style={{
        marginTop:48, paddingTop:20,
        borderTop:"1px solid rgba(0,200,255,0.06)",
        textAlign:"center",
        fontFamily:"JetBrains Mono,monospace",
        fontSize:10, letterSpacing:2,
        color:"rgba(255,255,255,0.12)",
        textTransform:"uppercase",
        paddingBottom:32,
      }}>
        © {new Date().getFullYear()} JARVIS INTERVIEW PLATFORM · ALL RIGHTS RESERVED · BUILT BY NAMITA
      </div>

    </div>
  );
}