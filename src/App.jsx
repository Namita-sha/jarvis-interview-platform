// src/App.jsx — FIXED for redirect auth
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import Interview from "./pages/Interview";
import Feedback from "./pages/Feedback";
import Navbar from "./components/Navbar";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jarvis-bg">
        <div className="w-10 h-10 border-2 border-jarvis-border border-t-jarvis-cyan rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jarvis-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-jarvis-border border-t-jarvis-cyan rounded-full animate-spin" />
          <p className="text-jarvis-muted text-xs font-mono">Loading JARVIS...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-jarvis-bg grid-bg">
        <Navbar />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/setup"     element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="/interview/:id" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/feedback/:id"  element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}