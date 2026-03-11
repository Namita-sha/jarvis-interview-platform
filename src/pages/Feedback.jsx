// src/pages/Feedback.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import ArcReactor from "../components/ArcReactor";

const fmtDate = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month:"long",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit" });
};

const scoreLabel = (s) => s>=85?"OPTIMAL":s>=70?"PROFICIENT":s>=55?"ADEQUATE":"BELOW THRESHOLD";

const CATS = {
  "Communication Skills": "01",
  "Technical Knowledge":  "02",
  "Problem Solving":      "03",
  "Cultural & Role Fit":  "04",
  "Confidence & Clarity": "05",
};

function ScoreRing({ score, size=150 }) {
  const r    = (size-14)/2;
  const circ = r*2*Math.PI;
  const off  = circ - (score/100)*circ;
  return (
    <div style={{ position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
      {/* Glow */}
      <div style={{ position:"absolute",inset:-10,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,200,255,0.08) 0%,transparent 70%)",animation:"arcPulse 3s infinite" }} />
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)",position:"absolute" }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--j-border)" strokeWidth={10} />
        {/* Fill */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="#00C8FF" strokeWidth={10} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition:"stroke-dashoffset 1.2s ease",filter:"drop-shadow(0 0 6px rgba(0,200,255,0.6))" }}
        />
        {/* Tick marks */}
        {Array.from({length:20},(_,i)=>{
          const a = (i/20)*360;
          const rd = (a-90)*(Math.PI/180);
          const ro = size/2-2;
          return <line key={i}
            x1={size/2+(ro-5)*Math.cos(rd)} y1={size/2+(ro-5)*Math.sin(rd)}
            x2={size/2+ro*Math.cos(rd)} y2={size/2+ro*Math.sin(rd)}
            stroke={i%5===0?"rgba(0,200,255,0.4)":"rgba(0,200,255,0.15)"} strokeWidth={i%5===0?1.5:0.8}
          />;
        })}
      </svg>
      <div style={{ textAlign:"center",position:"relative",zIndex:1 }}>
        <div style={{ fontFamily:"Exo 2,sans-serif",fontWeight:800,fontSize:size*0.22,color:"#00C8FF",lineHeight:1,textShadow:"0 0 20px rgba(0,200,255,0.6)" }}>{score}</div>
        <div style={{ fontFamily:"JetBrains Mono,monospace",fontSize:size*0.09,color:"var(--j-muted)" }}>/100</div>
      </div>
    </div>
  );
}

export default function Feedback() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(()=>{
    getDoc(doc(db,"interviews",id))
      .then((s)=>{ if(s.exists()) setInterview({id:s.id,...s.data()}); })
      .finally(()=>setLoading(false));
  },[id]);

  if (loading) return (
    <div style={{ minHeight:"80vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20 }}>
      <ArcReactor size="lg" />
      <span className="hud-label-arc" style={{ letterSpacing:3 }}>RETRIEVING REPORT...</span>
    </div>
  );

  if (!interview?.feedback) return (
    <div style={{ minHeight:"80vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16 }}>
      <p className="hud-label-arc">REPORT NOT FOUND</p>
      <Link to="/dashboard" className="btn-arc-solid">RETURN TO BASE</Link>
    </div>
  );

  const { feedback,role,level,techstack,createdAt } = interview;

  return (
    <div className="page-wrapper hud-grid">
      <div className="container" style={{ paddingTop:48,paddingBottom:64 }}>

        {/* Header */}
        <div className="animate-fadeInUp" style={{ marginBottom:32,paddingBottom:24,borderBottom:"1px solid var(--j-border)" }}>
          <p className="hud-label" style={{ marginBottom:8 }}>PERFORMANCE REPORT</p>
          <h1 style={{ fontFamily:"Exo 2,sans-serif",fontWeight:800,fontSize:"clamp(24px,4vw,40px)",color:"#E8F4FF",letterSpacing:3,textTransform:"uppercase" }}>
            {role}
          </h1>
          <div style={{ display:"flex",gap:16,marginTop:8,flexWrap:"wrap" }}>
            <span className="hud-label">{level?.toUpperCase()}</span>
            <span className="hud-label">·</span>
            <span className="hud-label-arc">{fmtDate(createdAt)}</span>
          </div>
        </div>

        {/* Score hero */}
        <div className="hud-panel hud-panel-corners scan-panel animate-fadeInUp" style={{ padding:36,marginBottom:20,display:"flex",gap:40,alignItems:"center",flexWrap:"wrap" }}>
          <ScoreRing score={feedback.totalScore} size={160} />
          <div style={{ flex:1,minWidth:200 }}>
            <div className="hud-badge" style={{ marginBottom:16 }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"#00C8FF",boxShadow:"0 0 8px rgba(0,200,255,0.8)",display:"inline-block" }} />
              {scoreLabel(feedback.totalScore)}
            </div>
            <h2 style={{ fontFamily:"Exo 2,sans-serif",fontWeight:700,fontSize:20,color:"#E8F4FF",letterSpacing:2,marginBottom:14 }}>
              OVERALL ASSESSMENT
            </h2>
            <p style={{ color:"var(--j-muted)",lineHeight:1.85,fontSize:14 }}>{feedback.finalAssessment}</p>
          </div>
        </div>

        {/* Category scores */}
        <div className="animate-fadeInUp" style={{ animationDelay:"0.1s",marginBottom:20 }}>
          <div className="hud-divider" style={{ marginBottom:16 }}>
            <span className="hud-label">EVALUATION VECTORS</span>
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {feedback.categoryScores?.map((cat,i)=>(
              <div key={i} className="hud-panel" style={{ padding:20 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <span className="hud-label-arc">{CATS[cat.name]||String(i+1).padStart(2,"0")}</span>
                    <span style={{ fontFamily:"Exo 2,sans-serif",fontWeight:600,fontSize:15,color:"#E8F4FF",letterSpacing:1 }}>
                      {cat.name.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontFamily:"Exo 2,sans-serif",fontWeight:800,fontSize:24,color:"#00C8FF",textShadow:"0 0 16px rgba(0,200,255,0.5)" }}>
                    {cat.score}<span style={{ fontSize:11,color:"var(--j-muted)" }}>/100</span>
                  </span>
                </div>
                <div className="hud-bar" style={{ marginBottom:10 }}>
                  <div className="hud-bar-fill" style={{ width:`${cat.score}%` }} />
                </div>
                <p style={{ color:"var(--j-muted)",fontSize:13,lineHeight:1.75 }}>{cat.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="animate-fadeInUp" style={{ animationDelay:"0.18s",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20 }}>
          <div className="hud-panel hud-panel-corners" style={{ padding:22 }}>
            <p className="hud-label-arc" style={{ marginBottom:16,letterSpacing:3 }}>STRENGTHS IDENTIFIED</p>
            <ul style={{ listStyle:"none",display:"flex",flexDirection:"column",gap:10 }}>
              {feedback.strengths?.map((s,i)=>(
                <li key={i} style={{ display:"flex",gap:10,color:"var(--j-muted)",fontSize:13,lineHeight:1.7 }}>
                  <span style={{ color:"var(--j-arc)",flexShrink:0,fontFamily:"JetBrains Mono,monospace",fontSize:11 }}>→</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="hud-panel hud-panel-corners" style={{ padding:22 }}>
            <p className="hud-label" style={{ marginBottom:16,letterSpacing:3 }}>AREAS FOR IMPROVEMENT</p>
            <ul style={{ listStyle:"none",display:"flex",flexDirection:"column",gap:10 }}>
              {feedback.areasForImprovement?.map((a,i)=>(
                <li key={i} style={{ display:"flex",gap:10,color:"var(--j-muted)",fontSize:13,lineHeight:1.7 }}>
                  <span style={{ color:"var(--j-arc-dim)",flexShrink:0,fontFamily:"JetBrains Mono,monospace",fontSize:11 }}>→</span>{a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tech stack */}
        <div className="animate-fadeInUp" style={{ marginBottom:36 }}>
          <p className="hud-label" style={{ marginBottom:12 }}>TECHNOLOGIES EVALUATED</p>
          <div style={{ display:"flex",flexWrap:"wrap",gap:7 }}>
            {techstack?.map((t)=><span key={t} className="hud-tag" style={{ color:"rgba(0,200,255,0.6)" }}>{t.toUpperCase()}</span>)}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display:"flex",gap:12,flexWrap:"wrap",borderTop:"1px solid var(--j-border)",paddingTop:28 }}>
          <Link to="/dashboard" className="btn-ghost-arc" style={{ flex:1,justifyContent:"center",minWidth:140,letterSpacing:2 }}>← MISSION LOGS</Link>
          <Link to="/setup" className="btn-arc-solid" style={{ flex:2,justifyContent:"center",minWidth:180,letterSpacing:2 }}>INITIATE NEW SESSION →</Link>
        </div>
      </div>
    </div>
  );
}