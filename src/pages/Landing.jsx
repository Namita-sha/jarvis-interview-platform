// src/pages/Landing.jsx — FINAL CENTERED VERSION
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      const messages = {
        "auth/popup-blocked":         "Popup blocked! Click the 🚫 icon in Edge's address bar → Allow popups from localhost.",
        "auth/popup-closed-by-user":  "You closed the window. Please try again.",
        "auth/cancelled-popup-request": "Please try again.",
      };
      setError(messages[err.code] || `Error: ${err.code}`);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070B14",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
      fontFamily: "DM Sans, sans-serif",
    }}>

      {/* Background glow blobs */}
      <div style={{
        position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)",
        width:500, height:500, borderRadius:"50%",
        background:"rgba(0,229,255,0.04)", filter:"blur(80px)", pointerEvents:"none"
      }} />
      <div style={{
        position:"absolute", bottom:"20%", right:"15%",
        width:300, height:300, borderRadius:"50%",
        background:"rgba(30,144,255,0.04)", filter:"blur(60px)", pointerEvents:"none"
      }} />

      {/* Content — strictly centered */}
      <div style={{ maxWidth:680, width:"100%", textAlign:"center", position:"relative", zIndex:1 }}>

        {/* JARVIS icon */}
        <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
          <div style={{ position:"relative", width:72, height:72 }}>
            <div style={{
              position:"absolute", inset:-8, borderRadius:"50%",
              border:"1px solid rgba(0,229,255,0.15)",
              animation:"pingSlow 2s ease infinite"
            }} />
            <div style={{
              width:72, height:72, borderRadius:"50%",
              border:"2px solid rgba(0,229,255,0.5)",
              background:"#0D1425",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              <span style={{ fontFamily:"JetBrains Mono,monospace", fontWeight:700, color:"#00E5FF", fontSize:24 }}>J</span>
            </div>
          </div>
        </div>

        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          padding:"6px 16px", borderRadius:99,
          border:"1px solid rgba(0,229,255,0.25)",
          background:"rgba(0,229,255,0.05)",
          marginBottom:24,
        }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#00E5FF", animation:"pulse 2s infinite" }} />
          <span style={{ color:"#00E5FF", fontSize:11, fontFamily:"JetBrains Mono,monospace", letterSpacing:3, textTransform:"uppercase" }}>
            AI Interview Intelligence
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:"Exo 2, sans-serif",
          fontWeight:800,
          fontSize:"clamp(40px, 8vw, 80px)",
          lineHeight:1.05,
          marginBottom:24,
          color:"#E6F7FF",
        }}>
          Master Every<br />
          <span style={{
            background:"linear-gradient(90deg,#00E5FF,#1E90FF,#00E5FF,#7DD3FC,#00E5FF)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text",
            backgroundClip:"text",
            WebkitTextFillColor:"transparent",
            animation:"shimmer 4s linear infinite",
            display:"inline-block",
          }}>
            Interview
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          color:"#7DD3FC",
          fontSize:"clamp(15px, 2.5vw, 19px)",
          lineHeight:1.7,
          maxWidth:520,
          margin:"0 auto 40px",
        }}>
          JARVIS conducts real voice interviews, listens to your answers,
          and gives you brutally honest AI feedback — so you're ready for the real thing.
        </p>

        {/* Feature pills */}
        <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:10, marginBottom:44 }}>
          {[
            { icon:"🎙", label:"Voice Interaction" },
            { icon:"🧠", label:"AI Evaluation" },
            { icon:"📊", label:"Detailed Scoring" },
            { icon:"🆓", label:"100% Free" },
          ].map((f) => (
            <div key={f.label} style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"8px 16px", borderRadius:99,
              border:"1px solid #0E2040",
              background:"#0D1425",
              color:"#7DD3FC",
              fontSize:14,
            }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          style={{
            display:"inline-flex", alignItems:"center", gap:12,
            padding:"16px 40px",
            borderRadius:8,
            background: loading ? "rgba(0,229,255,0.6)" : "#00E5FF",
            color:"#070B14",
            border:"none",
            fontFamily:"Exo 2, sans-serif",
            fontWeight:700,
            fontSize:18,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow:"0 0 30px rgba(0,229,255,0.35)",
            transition:"all 0.2s",
          }}
        >
          {loading ? (
            <>
              <div style={{
                width:20, height:20,
                border:"2px solid rgba(7,11,20,0.3)",
                borderTopColor:"#070B14",
                borderRadius:"50%",
                animation:"spin 1s linear infinite"
              }} />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google — It's Free</span>
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div style={{
            marginTop:20, padding:"14px 18px",
            background:"rgba(239,68,68,0.1)",
            border:"1px solid rgba(239,68,68,0.3)",
            borderRadius:8,
            color:"#fca5a5",
            fontSize:14,
            textAlign:"left",
            lineHeight:1.6,
          }}>
            <strong style={{ display:"block", marginBottom:4 }}>⚠ Sign-in issue:</strong>
            {error}
          </div>
        )}

        <p style={{ marginTop:32, color:"rgba(125,211,252,0.3)", fontSize:11, fontFamily:"JetBrains Mono,monospace", letterSpacing:2 }}>
          NO CREDIT CARD · NO DOWNLOAD · WORKS IN BROWSER
        </p>
      </div>

      {/* Keyframe styles injected inline */}
      <style>{`
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pingSlow { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}