// src/components/InterviewCard.jsx
import { Link } from "react-router-dom";

const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
};

export default function InterviewCard({ interview }) {
  const { id, role, level, type, techstack, feedback, createdAt } = interview;
  const score = feedback?.totalScore;

  return (
    <div className="ivc scan-panel">
      {/* Top accent */}
      <div className="ivc-topline" />

      {/* Corner brackets */}
      <div className="ivc-c ivc-tl" />
      <div className="ivc-c ivc-br" />

      {/* Header */}
      <div className="ivc-header">
        <div>
          <p className="hud-label-arc" style={{ marginBottom:6 }}>{type?.toUpperCase()} SESSION</p>
          <h3 className="ivc-role">{role}</h3>
          <p className="hud-label" style={{ marginTop:4 }}>{level?.toUpperCase()}</p>
        </div>
        {score != null ? (
          <div className="ivc-score-wrap">
            <span className="ivc-score">{score}</span>
            <span className="ivc-score-unit">/100</span>
          </div>
        ) : (
          <span className="ivc-pending">PENDING</span>
        )}
      </div>

      {/* Score arc bar */}
      {score != null && (
        <div className="hud-bar" style={{ margin:"12px 0" }}>
          <div className="hud-bar-fill" style={{ width:`${score}%` }} />
        </div>
      )}

      {/* Stack */}
      <div className="ivc-tags">
        {(techstack||[]).slice(0,4).map((t) => (
          <span key={t} className="hud-tag">{t}</span>
        ))}
        {(techstack||[]).length > 4 && (
          <span className="hud-tag">+{techstack.length-4}</span>
        )}
      </div>

      {/* Footer */}
      <div className="ivc-footer">
        <span className="hud-label">{fmtDate(createdAt)}</span>
        {feedback
          ? <Link to={`/feedback/${id}`} className="btn-arc"   style={{ padding:"7px 16px", fontSize:11 }}>VIEW REPORT</Link>
          : <Link to={`/interview/${id}`} className="btn-arc-solid" style={{ padding:"7px 16px", fontSize:11 }}>INITIATE</Link>
        }
      </div>

      <style>{`
        .ivc {
          background:var(--j-bg3); border:1px solid var(--j-border);
          border-radius:4px; padding:22px; position:relative; overflow:hidden;
          display:flex; flex-direction:column; gap:12px;
          transition:border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .ivc:hover {
          border-color:var(--j-border2);
          box-shadow:0 0 24px rgba(0,200,255,0.07);
          transform:translateY(-2px);
        }
        .ivc-topline {
          position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(0,200,255,0),transparent);
          transition:background 0.2s;
        }
        .ivc:hover .ivc-topline {
          background:linear-gradient(90deg,transparent,rgba(0,200,255,0.5),transparent);
        }
        .ivc-c { position:absolute; width:8px; height:8px; border-color:rgba(0,200,255,0.3); border-style:solid; }
        .ivc-tl { top:0; left:0; border-width:1px 0 0 1px; }
        .ivc-br { bottom:0; right:0; border-width:0 1px 1px 0; }
        .ivc-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .ivc-role {
          font-family:"Exo 2",sans-serif; font-weight:700;
          font-size:16px; color:#E8F4FF; text-transform:capitalize; letter-spacing:0.5px;
        }
        .ivc-score-wrap { text-align:right; flex-shrink:0; }
        .ivc-score {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:28px; color:#00C8FF;
          text-shadow:0 0 16px rgba(0,200,255,0.5);
        }
        .ivc-score-unit { font-size:12px; color:var(--j-muted); margin-left:1px; }
        .ivc-pending {
          font-family:"JetBrains Mono",monospace; font-size:9px;
          padding:4px 9px; border:1px solid var(--j-border);
          background:var(--j-bg2); color:var(--j-muted); letter-spacing:2px;
          border-radius:2px;
        }
        .ivc-tags { display:flex; flex-wrap:wrap; gap:5px; }
        .ivc-footer {
          display:flex; align-items:center; justify-content:space-between;
          padding-top:12px; border-top:1px solid var(--j-border);
          margin-top:auto;
        }
      `}</style>
    </div>
  );
}