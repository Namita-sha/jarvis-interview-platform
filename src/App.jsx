// src/App.jsx
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing     from "./pages/Landing";
import Dashboard   from "./pages/Dashboard";
import Setup       from "./pages/Setup";
import Interview   from "./pages/Interview";
import Feedback    from "./pages/Feedback";
import Navbar      from "./components/Navbar";
import JarvisIntro from "./components/JarvisIntro";
import ArcReactor  from "./components/ArcReactor";
import Footer from "./components/Footer";

function Spinner() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#06090F",
      gap: 20,
    }}>
      <ArcReactor size="lg" />
      <p style={{
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 10,
        letterSpacing: 4,
        color: "rgba(0,200,255,0.4)",
      }}>
        INITIALIZING...
      </p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show intro once per session for unauthenticated visitors.
  // After intro completes it stores the flag and re-renders into normal routing.
  const [introShown, setIntroShown] = useState(() =>
    sessionStorage.getItem("jarvis_intro_shown") === "true"
  );

  const handleIntroComplete = () => {
    sessionStorage.setItem("jarvis_intro_shown", "true");
    setIntroShown(true);
  };

  if (loading) return <Spinner />;

  // ── Show JARVIS intro as a full-page experience (no overlay, no navbar) ──
  // Only shown to unauthenticated users who haven't seen it yet this session.
  if (!introShown && !user) {
    return <JarvisIntro onComplete={handleIntroComplete} />;
  }

  // ── Normal app shell ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#06090F",
      display: "flex",
      flexDirection: "column",
    }}>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/setup"
          element={<ProtectedRoute><Setup /></ProtectedRoute>}
        />
        <Route
          path="/interview/:id"
          element={<ProtectedRoute><Interview /></ProtectedRoute>}
        />
        <Route
          path="/feedback/:id"
          element={<ProtectedRoute><Feedback /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}