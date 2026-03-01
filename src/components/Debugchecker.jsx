// src/components/DebugChecker.jsx
// TEMPORARY debug tool — shows you exactly what's misconfigured
// DELETE this file and remove it from Landing.jsx once everything works

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function DebugChecker() {
  const [checks, setChecks] = useState([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    runChecks();
  }, []);

  const runChecks = () => {
    const results = [];

    // 1. Check each env variable
    const envVars = [
      "VITE_FIREBASE_API_KEY",
      "VITE_FIREBASE_AUTH_DOMAIN",
      "VITE_FIREBASE_PROJECT_ID",
      "VITE_FIREBASE_STORAGE_BUCKET",
      "VITE_FIREBASE_MESSAGING_SENDER_ID",
      "VITE_FIREBASE_APP_ID",
      "VITE_GEMINI_API_KEY",
    ];

    envVars.forEach((key) => {
      const val = import.meta.env[key];
      const exists = val && val !== "undefined" && !val.includes("your_");
      results.push({
        label: key,
        ok: exists,
        value: exists ? val.slice(0, 12) + "..." : "❌ MISSING or placeholder",
        fix: exists ? null : `Add ${key}=your_actual_value to your .env file`,
      });
    });

    // 2. Check Firebase can initialize
    try {
      const apps = getApps();
      results.push({
        label: "Firebase initialized",
        ok: apps.length > 0,
        value: apps.length > 0 ? `${apps.length} app(s)` : "Not initialized",
        fix: apps.length === 0 ? "Firebase config is invalid. Check your API key." : null,
      });
    } catch (e) {
      results.push({ label: "Firebase initialized", ok: false, value: e.message, fix: "Fix Firebase config in .env" });
    }

    // 3. Check auth domain format
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "";
    const authDomainValid = authDomain.endsWith(".firebaseapp.com");
    results.push({
      label: "Auth domain format",
      ok: authDomainValid,
      value: authDomain || "missing",
      fix: authDomainValid ? null : "Should be: your-project-id.firebaseapp.com",
    });

    // 4. Check browser speech support
    const speechSynthOk = "speechSynthesis" in window;
    const speechRecOk = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    results.push({
      label: "Text-to-Speech (browser)",
      ok: speechSynthOk,
      value: speechSynthOk ? "Supported ✓" : "Not supported",
      fix: speechSynthOk ? null : "Use Google Chrome",
    });
    results.push({
      label: "Speech Recognition (browser)",
      ok: speechRecOk,
      value: speechRecOk ? "Supported ✓" : "Not supported",
      fix: speechRecOk ? null : "Use Google Chrome for microphone support",
    });

    setChecks(results);
  };

  const testSignIn = async () => {
    setTesting(true);
    try {
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      };
      const app = getApps()[0];
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      alert(`✅ Sign-in works! Logged in as: ${result.user.displayName}`);
    } catch (e) {
      alert(`❌ Sign-in failed:\n\n${e.code}\n${e.message}\n\nSee fix guide below.`);
    } finally {
      setTesting(false);
    }
  };

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto bg-jarvis-darker border border-jarvis-cyan/30 rounded-xl shadow-cyan p-4 text-xs font-mono">
      <div className="flex items-center justify-between mb-3">
        <span className="text-jarvis-cyan font-bold text-sm">🔧 JARVIS Debug Panel</span>
        <span className={`px-2 py-0.5 rounded ${failed === 0 ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
          {passed}/{checks.length} OK
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {checks.map((c, i) => (
          <div key={i} className={`p-2 rounded border ${c.ok ? "border-green-500/20 bg-green-900/10" : "border-red-500/30 bg-red-900/10"}`}>
            <div className="flex items-start justify-between gap-2">
              <span className={c.ok ? "text-green-400" : "text-red-400"}>
                {c.ok ? "✓" : "✗"} {c.label}
              </span>
            </div>
            <div className="text-jarvis-muted mt-0.5 truncate">{c.value}</div>
            {c.fix && <div className="text-yellow-400 mt-1">→ {c.fix}</div>}
          </div>
        ))}
      </div>

      <button
        onClick={testSignIn}
        disabled={testing}
        className="w-full py-2 rounded bg-jarvis-cyan text-jarvis-bg font-bold hover:bg-jarvis-cyan/80 transition-colors disabled:opacity-50"
      >
        {testing ? "Testing..." : "Test Google Sign-In Now"}
      </button>

      <p className="text-jarvis-muted/50 mt-2 text-center">Remove this panel before deploying</p>
    </div>
  );
}