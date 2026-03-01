// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav style={{ borderBottom: "1px solid #0E2040", background: "rgba(7,11,20,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link to={user ? "/dashboard" : "/"} style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <div style={{ position:"relative", width:32, height:32 }}>
            <div style={{
              position:"absolute", inset:0, borderRadius:"50%",
              border:"1px solid rgba(0,229,255,0.4)",
              animation:"pingSlow 2s ease infinite"
            }} />
            <div style={{
              width:32, height:32, borderRadius:"50%",
              border:"1px solid rgba(0,229,255,0.7)",
              background:"#0D1425",
              display:"flex", alignItems:"center", justifyContent:"center"
            }}>
              <span style={{ color:"#00E5FF", fontFamily:"JetBrains Mono,monospace", fontWeight:700, fontSize:13 }}>J</span>
            </div>
          </div>
          <span style={{ fontFamily:"Exo 2,sans-serif", fontWeight:700, fontSize:20, color:"#E6F7FF", letterSpacing:2 }}>
            JAR<span style={{ color:"#00E5FF" }}>VIS</span>
          </span>
        </Link>

        {/* Right */}
        {user && (
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <Link to="/setup" style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"8px 16px", borderRadius:6,
              border:"1px solid rgba(0,229,255,0.4)",
              color:"#00E5FF", textDecoration:"none",
              fontFamily:"Exo 2,sans-serif", fontWeight:600, fontSize:14,
              transition:"all 0.2s"
            }}>
              <span>+</span><span>New Interview</span>
            </Link>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=0D1425&color=00E5FF`}
                alt={user.displayName}
                style={{ width:32, height:32, borderRadius:"50%", border:"1px solid #0E2040" }}
              />
              <button
                onClick={handleLogout}
                style={{ background:"none", border:"none", color:"#7DD3FC", cursor:"pointer", fontSize:14, fontFamily:"DM Sans,sans-serif" }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}