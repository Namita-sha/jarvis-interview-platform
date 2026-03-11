// src/pages/Setup.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { generateQuestions } from "../lib/gemini";
import ArcReactor from "../components/ArcReactor";

const ROLES = [
  "Frontend Developer","Backend Developer","Full Stack Developer",
  "React Developer","Node.js Developer","Python Developer",
  "Software Engineer","Data Engineer","DevOps Engineer","Mobile Developer",
];
const TECHS = [
  "React","Vue","Angular","Next.js","TypeScript","JavaScript",
  "Node.js","Express","Python","Django","FastAPI","Java",
  "MongoDB","PostgreSQL","MySQL","Redis","Docker","AWS",
  "Git","GraphQL","React Native","Flutter","Tailwind CSS","Spring Boot",
];

export default function Setup() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [step,     setStep]    = useState(1);
  const [form,     setForm]    = useState({ role:"", customRole:"", level:"Junior", type:"Technical", amount:5, techstack:[] });
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");

  const toggleTech = (t) =>
    setForm((p) => ({ ...p, techstack: p.techstack.includes(t) ? p.techstack.filter((x)=>x!==t) : [...p.techstack,t] }));

  const handleStart = async () => {
    const role = form.role === "Other" ? form.customRole.trim() : form.role;
    if (!role) return setError("ROLE NOT SPECIFIED");
    if (!form.techstack.length) return setError("NO TECHNOLOGIES SELECTED");
    setLoading(true); setError("");
    try {
      const questions = await generateQuestions({ role, level:form.level, techstack:form.techstack, type:form.type, amount:form.amount });
      const ref = await addDoc(collection(db,"interviews"), {
        userId:user.uid, role, level:form.level, type:form.type,
        techstack:form.techstack, questions, finalized:false, feedback:null,
        transcript:[], createdAt:serverTimestamp(),
      });
      navigate(`/interview/${ref.id}`);
    } catch(e) {
      console.error(e);
      setError("QUESTION GENERATION FAILED — CHECK GEMINI API KEY IN .ENV");
      setLoading(false);
    }
  };

  const stepLabels = ["TARGET ROLE", "TECH STACK", "PARAMETERS"];

  return (
    <div className="page-wrapper hud-grid">
      <div className="container-sm" style={{ paddingTop:48, paddingBottom:64 }}>

        {/* Header */}
        <div className="animate-fadeInUp" style={{ marginBottom:32 }}>
          <p className="hud-label" style={{ marginBottom:8 }}>MISSION CONFIGURATION</p>
          <h1 className="setup-title">
            CONFIGURE <span className="holo-text">SESSION</span>
          </h1>
        </div>

        {/* Step indicator */}
        <div className="steps animate-fadeInUp" style={{ marginBottom:28 }}>
          {stepLabels.map((label, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center" }}>
              <div className={`step-node ${step>i+1?"done":step===i+1?"active":""}`}>
                {step>i+1 ? "✓" : String(i+1).padStart(2,"0")}
              </div>
              {i < stepLabels.length-1 && <div className={`step-connector ${step>i+1?"done":""}`} />}
            </div>
          ))}
          <span className="hud-label-arc" style={{ marginLeft:16 }}>{stepLabels[step-1]}</span>
        </div>

        {/* Panel */}
        <div className="hud-panel hud-panel-corners scan-panel animate-fadeInUp" style={{ padding:30 }}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div>
              <p className="hud-label" style={{ marginBottom:16 }}>SELECT TARGET ROLE</p>
              <div className="role-grid">
                {ROLES.map((r) => (
                  <button key={r} onClick={() => setForm((p)=>({...p,role:r}))}
                    className={`role-btn ${form.role===r?"active":""}`}>{r}</button>
                ))}
                <button onClick={() => setForm((p)=>({...p,role:"Other"}))}
                  className={`role-btn ${form.role==="Other"?"active":""}`}>CUSTOM ROLE...</button>
              </div>
              {form.role === "Other" && (
                <input className="hud-input" style={{ marginTop:14 }}
                  placeholder="Enter custom role..."
                  value={form.customRole}
                  onChange={(e)=>setForm((p)=>({...p,customRole:e.target.value}))} />
              )}
              {error && <p className="err-txt">{error}</p>}
              <button className="btn-arc-solid" style={{ width:"100%",marginTop:22,justifyContent:"center",letterSpacing:2 }}
                onClick={()=>{ if(!form.role) return setError("ROLE NOT SPECIFIED"); setError(""); setStep(2); }}>
                CONFIRM ROLE →
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <div>
              <p className="hud-label" style={{ marginBottom:6 }}>SELECT TECHNOLOGIES</p>
              <p className="hud-label-arc" style={{ marginBottom:16 }}>{form.techstack.length} SELECTED</p>
              <div className="tech-grid">
                {TECHS.map((t) => (
                  <button key={t} onClick={()=>toggleTech(t)}
                    className={`tech-btn ${form.techstack.includes(t)?"active":""}`}>{t}</button>
                ))}
              </div>
              {error && <p className="err-txt">{error}</p>}
              <div style={{ display:"flex",gap:10,marginTop:22 }}>
                <button className="btn-ghost-arc" style={{ flex:1,justifyContent:"center" }} onClick={()=>setStep(1)}>← BACK</button>
                <button className="btn-arc-solid" style={{ flex:2,justifyContent:"center",letterSpacing:2 }}
                  onClick={()=>{ if(!form.techstack.length) return setError("NO TECHNOLOGIES SELECTED"); setError(""); setStep(3); }}>
                  CONFIRM STACK →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <div style={{ display:"flex",flexDirection:"column",gap:24 }}>

              <div>
                <p className="hud-label" style={{ marginBottom:12 }}>EXPERIENCE LEVEL</p>
                <div style={{ display:"flex",gap:8 }}>
                  {["Junior","Mid","Senior"].map((l) => (
                    <button key={l} onClick={()=>setForm((p)=>({...p,level:l}))}
                      className={form.level===l?"btn-arc-solid":"btn-ghost-arc"}
                      style={{ flex:1,justifyContent:"center",letterSpacing:2,fontSize:12 }}>{l.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="hud-label" style={{ marginBottom:12 }}>QUESTION TYPE</p>
                <div style={{ display:"flex",gap:8 }}>
                  {["Technical","Behavioral","Mixed"].map((t) => (
                    <button key={t} onClick={()=>setForm((p)=>({...p,type:t}))}
                      className={form.type===t?"btn-arc-solid":"btn-ghost-arc"}
                      style={{ flex:1,justifyContent:"center",letterSpacing:2,fontSize:12 }}>{t.toUpperCase()}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:10 }}>
                  <p className="hud-label">QUESTION COUNT</p>
                  <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:16,color:"#00C8FF",fontWeight:700,textShadow:"0 0 12px rgba(0,200,255,0.6)" }}>
                    {String(form.amount).padStart(2,"0")}
                  </span>
                </div>
                <input type="range" min={3} max={10} value={form.amount}
                  onChange={(e)=>setForm((p)=>({...p,amount:+e.target.value}))}
                  style={{ width:"100%",accentColor:"#00C8FF" }} />
                <div style={{ display:"flex",justifyContent:"space-between",marginTop:5 }}>
                  <span className="hud-label">03 — QUICK</span>
                  <span className="hud-label">10 — FULL</span>
                </div>
              </div>

              {/* Mission briefing */}
              <div className="setup-brief">
                <p className="hud-label-arc" style={{ marginBottom:12 }}>MISSION BRIEFING</p>
                {[
                  ["ROLE",       form.role==="Other"?form.customRole:form.role],
                  ["LEVEL",      form.level.toUpperCase()],
                  ["TYPE",       form.type.toUpperCase()],
                  ["QUESTIONS",  String(form.amount).padStart(2,"0")],
                  ["STACK",      form.techstack.join(" · ")],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:"flex",gap:12,marginBottom:7,alignItems:"flex-start" }}>
                    <span className="hud-label" style={{ minWidth:90,flexShrink:0 }}>{k}</span>
                    <span style={{ fontFamily:"JetBrains Mono,monospace",fontSize:12,color:"#E8F4FF",lineHeight:1.5 }}>{v}</span>
                  </div>
                ))}
              </div>

              {error && <p className="err-txt">{error}</p>}

              <div style={{ display:"flex",gap:10 }}>
                <button className="btn-ghost-arc" style={{ flex:1,justifyContent:"center" }} onClick={()=>setStep(2)}>← BACK</button>
                <button className="btn-arc-solid" style={{ flex:2,justifyContent:"center",letterSpacing:2 }}
                  onClick={handleStart} disabled={loading}>
                  {loading
                    ? <><ArcReactor size="sm" />&nbsp;&nbsp;GENERATING...</>
                    : "LAUNCH MISSION →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .setup-title {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:clamp(28px,5vw,44px); color:#E8F4FF; letter-spacing:4px;
        }
        .steps { display:flex; align-items:center; }
        .step-node {
          width:32px; height:32px; border-radius:50%;
          border:1px solid var(--j-border); background:var(--j-bg2);
          color:var(--j-muted); font-family:"JetBrains Mono",monospace;
          font-size:11px; display:flex; align-items:center; justify-content:center;
          transition:all 0.2s; flex-shrink:0; letter-spacing:0;
        }
        .step-node.active { border-color:var(--j-arc); background:rgba(0,200,255,0.1); color:var(--j-arc); box-shadow:0 0 12px rgba(0,200,255,0.2); }
        .step-node.done   { border-color:var(--j-arc); background:var(--j-arc); color:var(--j-bg); font-weight:700; }
        .step-connector   { width:32px; height:1px; background:var(--j-border); transition:background 0.2s; }
        .step-connector.done { background:var(--j-arc); box-shadow:0 0 6px rgba(0,200,255,0.4); }
        .role-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        .role-btn {
          padding:11px 14px; text-align:left; border-radius:3px;
          border:1px solid var(--j-border); background:var(--j-bg2);
          color:var(--j-muted); font-family:"JetBrains Mono",monospace; font-size:12px;
          cursor:pointer; transition:all 0.15s; letter-spacing:0.3px;
        }
        .role-btn:hover { border-color:var(--j-border2); color:var(--j-white); }
        .role-btn.active { border-color:var(--j-arc); background:rgba(0,200,255,0.08); color:var(--j-arc); box-shadow:0 0 10px rgba(0,200,255,0.1); }
        .tech-grid { display:flex; flex-wrap:wrap; gap:7px; }
        .tech-btn {
          padding:6px 12px; border-radius:2px;
          border:1px solid var(--j-border); background:var(--j-bg2);
          color:var(--j-muted); font-family:"JetBrains Mono",monospace; font-size:11px;
          cursor:pointer; transition:all 0.15s; letter-spacing:0.5px;
        }
        .tech-btn:hover { border-color:var(--j-border2); color:var(--j-white); }
        .tech-btn.active { border-color:var(--j-arc); background:rgba(0,200,255,0.08); color:var(--j-arc); }
        .setup-brief {
          background:var(--j-bg); border:1px solid var(--j-border);
          border-radius:3px; padding:18px;
        }
        .err-txt {
          font-family:"JetBrains Mono",monospace; font-size:11px;
          color:rgba(0,200,255,0.7); letter-spacing:1px; margin-top:8px;
        }
      `}</style>
    </div>
  );
}