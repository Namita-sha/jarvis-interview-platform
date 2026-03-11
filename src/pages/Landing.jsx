// src/pages/Landing.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ArcReactor from "../components/ArcReactor";

export default function Landing() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSignIn = async () => {
    setLoading(true); setError("");
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      const msgs = {
        "auth/popup-blocked":           "Popup blocked. Click the 🚫 icon in your address bar → Allow popups from localhost.",
        "auth/popup-closed-by-user":    "Authentication window closed. Please try again.",
        "auth/cancelled-popup-request": "Request cancelled. Please try again.",
      };
      setError(msgs[err.code] || `ERROR: ${err.code}`);
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper hud-grid">

      {/* Ambient glow */}
      <div className="land-glow" />

      <div className="land-wrap">
        <div className="land-content animate-fadeInUp">

          {/* Arc reactor hero */}
          <div className="land-reactor">
            <ArcReactor size="xl" />
          </div>

          {/* Badge */}
          <div className="hud-badge">
            <span style={{ width:6,height:6,borderRadius:"50%",background:"#00C8FF",boxShadow:"0 0 8px rgba(0,200,255,0.8)",display:"inline-block",animation:"arcPulse 2s infinite" }} />
            AI INTERVIEW PLATFORM
          </div>

          {/* Headline */}
          <h1 className="land-h1">
            MASTER EVERY<br />
            <span className="holo-text">INTERVIEW</span>
          </h1>

          <p className="land-sub">
            JARVIS conducts real voice interviews, evaluates your answers
            with precision AI analysis, and delivers detailed performance
            feedback — engineered to make you interview-ready.
          </p>

          {/* Feature readout */}
          <div className="land-features">
            {[
              { code:"01", label:"VOICE INTERACTION" },
              { code:"02", label:"AI EVALUATION"     },
              { code:"03", label:"SCORE BREAKDOWN"   },
              { code:"04", label:"FREE ACCESS"       },
            ].map((f) => (
              <div key={f.code} className="land-feature">
                <span className="land-feat-code">{f.code}</span>
                <span className="land-feat-label">{f.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button onClick={handleSignIn} disabled={loading} className="btn-arc-solid land-cta">
            {loading ? (
              <><ArcReactor size="sm" animate />&nbsp;&nbsp;AUTHENTICATING...</>
            ) : (
              <><GoogleIcon />AUTHENTICATE WITH GOOGLE</>
            )}
          </button>

          {error && (
            <div className="land-error">
              <span className="hud-label-arc">⚠ SYSTEM ALERT</span>
              <p>{error}</p>
            </div>
          )}

          <p className="land-note">
            ── NO CREDIT CARD &nbsp;·&nbsp; BROWSER-NATIVE &nbsp;·&nbsp; SECURE AUTH ──
          </p>
        </div>
      </div>

      <style>{`
        .land-glow {
          position:fixed; top:-200px; left:50%; transform:translateX(-50%);
          width:800px; height:600px;
          background:radial-gradient(ellipse, rgba(0,200,255,0.04) 0%, transparent 70%);
          pointer-events:none;
        }
        .land-wrap {
          flex:1; display:flex; align-items:center; justify-content:center;
          padding:60px 24px 80px;
          min-height:calc(100vh - 65px);
        }
        .land-content {
          max-width:640px; width:100%;
          display:flex; flex-direction:column;
          align-items:center; text-align:center; gap:0;
          position:relative; z-index:1;
        }
        .land-reactor { margin-bottom:36px; }
        .land-h1 {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:clamp(42px,7vw,80px); line-height:1.05;
          color:#E8F4FF; letter-spacing:4px;
          margin:24px 0 18px;
          text-shadow:0 0 40px rgba(0,200,255,0.08);
        }
        .land-sub {
          font-size:clamp(14px,1.8vw,17px); color:var(--j-muted);
          line-height:1.85; max-width:500px; margin-bottom:32px;
          letter-spacing:0.2px;
        }
        .land-features {
          display:grid; grid-template-columns:repeat(2,1fr);
          gap:10px; width:100%; max-width:440px;
          margin-bottom:40px;
        }
        .land-feature {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px;
          background:var(--j-bg3);
          border:1px solid var(--j-border);
          border-radius:3px;
          transition:border-color 0.2s;
        }
        .land-feature:hover { border-color:var(--j-border2); }
        .land-feat-code {
          font-family:"JetBrains Mono",monospace;
          font-size:10px; color:var(--j-arc); letter-spacing:1px;
          flex-shrink:0;
        }
        .land-feat-label {
          font-family:"JetBrains Mono",monospace;
          font-size:10px; color:var(--j-muted); letter-spacing:2px;
          text-align:left;
        }
        .land-cta { font-size:13px; padding:14px 36px; letter-spacing:2px; }
        .land-error {
          margin-top:18px; padding:14px 18px;
          background:rgba(0,200,255,0.04);
          border:1px solid rgba(0,200,255,0.15);
          border-radius:3px; max-width:480px;
          display:flex; flex-direction:column; gap:6px; text-align:left;
        }
        .land-error p { color:var(--j-muted); font-size:13px; line-height:1.6; }
        .land-note {
          margin-top:28px; font-family:"JetBrains Mono",monospace;
          font-size:9px; letter-spacing:2px;
          color:rgba(74,122,155,0.3); text-transform:uppercase;
        }
      `}</style>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}