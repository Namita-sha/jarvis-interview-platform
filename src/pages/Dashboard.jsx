// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import InterviewCard from "../components/InterviewCard";
import ArcReactor from "../components/ArcReactor";

export default function Dashboard() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { fetchInterviews(); }, [user]);

  const fetchInterviews = async () => {
    try {
      const q = query(
        collection(db, "interviews"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setInterviews(snap.docs.map((d) => ({ id:d.id, ...d.data() })));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const completed = interviews.filter((i) => i.feedback);
  const avgScore  = completed.length ? Math.round(completed.reduce((s,i) => s+(i.feedback?.totalScore||0),0)/completed.length) : 0;
  const bestScore = completed.length ? Math.max(...completed.map((i) => i.feedback?.totalScore||0)) : 0;

  const stats = [
    { label:"TOTAL SESSIONS", value:interviews.length, unit:""     },
    { label:"COMPLETED",      value:completed.length,  unit:""     },
    { label:"AVERAGE SCORE",  value:avgScore,           unit:"/100" },
    { label:"PEAK SCORE",     value:bestScore,          unit:"/100" },
  ];

  return (
    <div className="page-wrapper hud-grid">
      <div className="container" style={{ paddingTop:48, paddingBottom:64 }}>

        {/* Header */}
        <div className="db-header animate-fadeInUp">
          <div className="db-header-left">
            <p className="hud-label" style={{ marginBottom:8 }}>OPERATOR PROFILE</p>
            <h1 className="db-name">
              {user?.displayName?.split(" ")[0]?.toUpperCase() || "OPERATOR"}
            </h1>
            <p className="hud-label-arc" style={{ marginTop:6 }}>
            
            </p>
          </div>
          <div className="db-header-right">
            <ArcReactor size="md" />
            <Link to="/setup" className="btn-arc-solid" style={{ letterSpacing:2 }}>
              + INITIATE INTERVIEW
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="db-stats animate-fadeInUp" style={{ animationDelay:"0.08s" }}>
          {stats.map((s, i) => (
            <div key={s.label} className="hud-panel hud-panel-corners db-stat" style={{ animationDelay:`${i*0.06}s` }}>
              <p className="hud-label" style={{ marginBottom:10 }}>{s.label}</p>
              <p className="db-stat-val">
                {s.value}
                <span className="db-stat-unit">{s.unit}</span>
              </p>
              {/* mini arc bar */}
              <div className="db-stat-arc">
                <div className="hud-bar" style={{ marginTop:12 }}>
                  <div className="hud-bar-fill" style={{ width:`${Math.min(100,(s.value/Math.max(10,s.value))*100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interviews */}
        <div className="animate-fadeInUp" style={{ animationDelay:"0.16s" }}>
          <div className="hud-divider" style={{ marginBottom:24 }}>
            <span className="hud-label">RECENT SESSIONS</span>
          </div>

          {loading ? (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:20 }}>
              <ArcReactor size="md" />
              <span className="hud-label-arc">RETRIEVING DATA...</span>
            </div>
          ) : interviews.length === 0 ? (
            <div className="db-empty">
              <ArcReactor size="lg" />
              <h3 className="db-empty-title">NO SESSIONS LOGGED</h3>
              <p className="db-empty-sub">Initiate your first interview session to begin performance tracking</p>
              <Link to="/setup" className="btn-arc-solid" style={{ marginTop:28, letterSpacing:2 }}>
                INITIATE FIRST SESSION →
              </Link>
            </div>
          ) : (
            <div className="db-grid">
              {interviews.map((iv) => <InterviewCard key={iv.id} interview={iv} />)}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .db-header {
          display:flex; justify-content:space-between; align-items:flex-end;
          margin-bottom:36px; gap:16px; flex-wrap:wrap;
          padding-bottom:24px;
          border-bottom:1px solid var(--j-border);
        }
        .db-header-right { display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
        .db-name {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:clamp(32px,5vw,52px);
          color:#E8F4FF; letter-spacing:4px; line-height:1.1;
          text-shadow:0 0 30px rgba(0,200,255,0.1);
        }
        .db-stats {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:12px; margin-bottom:44px;
        }
        @media(max-width:768px){ .db-stats{grid-template-columns:repeat(2,1fr);} }
        .db-stat { padding:20px 22px; }
        .db-stat-val {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:44px; color:#00C8FF; line-height:1;
          text-shadow:0 0 20px rgba(0,200,255,0.4);
        }
        .db-stat-unit { font-size:14px; color:var(--j-muted); font-weight:400; margin-left:2px; }
        .db-grid {
          display:grid; grid-template-columns:repeat(3,1fr); gap:16px;
        }
        @media(max-width:900px){ .db-grid{grid-template-columns:repeat(2,1fr);} }
        @media(max-width:580px){ .db-grid{grid-template-columns:1fr;} }
        .db-empty {
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          padding:80px 24px; text-align:center; gap:16px;
        }
        .db-empty-title {
          font-family:"Exo 2",sans-serif; font-weight:700;
          font-size:20px; color:#E8F4FF; letter-spacing:3px;
          margin-top:8px;
        }
        .db-empty-sub { color:var(--j-muted); font-size:14px; max-width:360px; line-height:1.7; }
      `}</style>
    </div>
  );
}