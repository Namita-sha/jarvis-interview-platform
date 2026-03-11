// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ArcReactor from "./ArcReactor";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="nav">
      {/* Top accent line */}
      <div className="nav-topline" />

      <div className="container">
        <div className="nav-inner">

          <Link to={user ? "/dashboard" : "/"} className="nav-logo">
            <ArcReactor size="sm" />
            <div className="nav-logo-text">
              <span className="nav-name">JAR<span className="nav-arc">VIS</span></span>
              <span className="nav-tagline">AI INTERVIEW PLATFORM</span>
            </div>
          </Link>

          {user && (
            <div className="nav-right">
              <Link to="/setup" className="btn-arc" style={{ padding:"8px 18px", fontSize:12 }}>
                + NEW INTERVIEW
              </Link>
              <div className="nav-user">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=0A0F1A&color=00C8FF`}
                  alt={user.displayName}
                  className="nav-avatar"
                />
                <button
                  onClick={async () => { await logout(); navigate("/"); }}
                  className="btn-ghost-arc"
                  style={{ padding:"7px 14px", fontSize:11 }}
                >
                  LOGOUT
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .nav {
          position:sticky; top:0; z-index:50;
          background:rgba(6,9,15,0.92);
          backdrop-filter:blur(20px);
          border-bottom:1px solid var(--j-border);
        }
        .nav-topline {
          height:1px;
          background:linear-gradient(90deg,transparent,rgba(0,200,255,0.5),transparent);
        }
        .nav-inner {
          height:64px; display:flex;
          align-items:center; justify-content:space-between;
        }
        .nav-logo {
          display:flex; align-items:center; gap:14px; text-decoration:none;
        }
        .nav-logo-text { display:flex; flex-direction:column; gap:2px; }
        .nav-name {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:20px; color:#E8F4FF; letter-spacing:3px;
        }
        .nav-arc {
          color:#00C8FF;
          text-shadow:0 0 16px rgba(0,200,255,0.7);
        }
        .nav-tagline {
          font-family:"JetBrains Mono",monospace;
          font-size:8px; letter-spacing:3px;
          color:rgba(0,200,255,0.35); text-transform:uppercase;
        }
        .nav-right { display:flex; align-items:center; gap:14px; }
        .nav-user  { display:flex; align-items:center; gap:10px; }
        .nav-avatar {
          width:30px; height:30px; border-radius:50%;
          border:1px solid var(--j-border2);
          box-shadow:0 0 8px rgba(0,200,255,0.15);
        }
      `}</style>
    </nav>
  );
}