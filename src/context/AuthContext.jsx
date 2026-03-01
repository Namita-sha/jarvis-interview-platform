// src/context/AuthContext.jsx
// Uses signInWithPopup — works because vite.config.js already has:
// "Cross-Origin-Opener-Policy": "same-origin-allow-popups"

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#070B14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          width: 40, height: 40,
          border: "2px solid #0E2040",
          borderTopColor: "#00E5FF",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}