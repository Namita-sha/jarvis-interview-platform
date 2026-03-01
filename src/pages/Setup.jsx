// src/pages/Setup.jsx
// User fills in interview preferences — then AI generates questions

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { generateQuestions } from "../lib/gemini";

// Available tech options
const TECH_OPTIONS = [
  "React", "Vue", "Angular", "Next.js", "TypeScript", "JavaScript",
  "Node.js", "Express", "Python", "Django", "FastAPI", "Java", "Spring Boot",
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes",
  "AWS", "Git", "GraphQL", "REST API", "Flutter", "React Native",
];

const ROLES = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "React Developer", "Node.js Developer", "Python Developer",
  "Software Engineer", "Data Engineer", "DevOps Engineer",
  "Mobile Developer", "UI/UX Developer",
];

export default function Setup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    role: "",
    customRole: "",
    level: "Junior",
    type: "Technical",
    amount: 5,
    techstack: [],
  });

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Role, Step 2: Tech, Step 3: Config
  const [error, setError] = useState("");

  // Toggle a tech item in the list
  const toggleTech = (tech) => {
    setForm((prev) => ({
      ...prev,
      techstack: prev.techstack.includes(tech)
        ? prev.techstack.filter((t) => t !== tech)
        : [...prev.techstack, tech],
    }));
  };

  // Start the interview — generate questions and save to Firebase
  const handleStart = async () => {
    setError("");
    const role = form.role === "Other" ? form.customRole : form.role;

    if (!role) return setError("Please enter a job role.");
    if (form.techstack.length === 0) return setError("Please select at least one technology.");

    setLoading(true);
    try {
      // 1. Generate questions with AI
      const questions = await generateQuestions({
        role,
        level: form.level,
        techstack: form.techstack,
        type: form.type,
        amount: form.amount,
      });

      // 2. Save interview to Firestore
      const docRef = await addDoc(collection(db, "interviews"), {
        userId: user.uid,
        role,
        level: form.level,
        type: form.type,
        techstack: form.techstack,
        questions,
        finalized: false,
        feedback: null,
        transcript: [],
        createdAt: serverTimestamp(),
      });

      // 3. Navigate to the interview page
      navigate(`/interview/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to generate interview. Check your API key and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      
      {/* Header */}
      <div className="mb-10">
        <p className="text-jarvis-muted text-xs font-mono tracking-widest uppercase mb-2">
          Configure Interview
        </p>
        <h1 className="font-display font-bold text-3xl text-jarvis-text">
          Set Up Your <span className="text-jarvis-cyan">Session</span>
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border transition-all duration-200 ${
                step >= s
                  ? "border-jarvis-cyan bg-jarvis-cyan/20 text-jarvis-cyan"
                  : "border-jarvis-border text-jarvis-muted"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`flex-1 h-px w-12 transition-all duration-200 ${
                  step > s ? "bg-jarvis-cyan/50" : "bg-jarvis-border"
                }`}
              />
            )}
          </div>
        ))}
        <span className="ml-3 text-jarvis-muted text-xs font-mono">
          {step === 1 ? "Role" : step === 2 ? "Tech Stack" : "Settings"}
        </span>
      </div>

      <div className="bg-jarvis-card border border-jarvis-border rounded-lg p-6 space-y-6">

        {/* ─── STEP 1: ROLE ─── */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-3">
                Job Role
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setForm((p) => ({ ...p, role: r }))}
                    className={`px-3 py-2 rounded text-sm text-left font-body transition-all duration-150 border ${
                      form.role === r
                        ? "border-jarvis-cyan bg-jarvis-cyan/10 text-jarvis-cyan"
                        : "border-jarvis-border text-jarvis-muted hover:border-jarvis-cyan/30 hover:text-jarvis-text"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  onClick={() => setForm((p) => ({ ...p, role: "Other" }))}
                  className={`px-3 py-2 rounded text-sm text-left font-body transition-all duration-150 border ${
                    form.role === "Other"
                      ? "border-jarvis-cyan bg-jarvis-cyan/10 text-jarvis-cyan"
                      : "border-jarvis-border text-jarvis-muted hover:border-jarvis-cyan/30"
                  }`}
                >
                  Other...
                </button>
              </div>
              {form.role === "Other" && (
                <input
                  type="text"
                  placeholder="e.g., Blockchain Developer"
                  value={form.customRole}
                  onChange={(e) => setForm((p) => ({ ...p, customRole: e.target.value }))}
                  className="w-full bg-jarvis-bg border border-jarvis-border rounded px-4 py-2.5 text-jarvis-text placeholder-jarvis-muted/50 focus:outline-none focus:border-jarvis-cyan text-sm font-body"
                />
              )}
            </div>

            <button
              onClick={() => {
                if (!form.role && !form.customRole) return setError("Select a role first");
                setError("");
                setStep(2);
              }}
              disabled={!form.role}
              className="w-full py-3 rounded bg-jarvis-cyan text-jarvis-bg font-display font-bold hover:bg-jarvis-cyan/90 transition-colors disabled:opacity-40"
            >
              Next → Tech Stack
            </button>
          </>
        )}

        {/* ─── STEP 2: TECH STACK ─── */}
        {step === 2 && (
          <>
            <div>
              <label className="block text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-3">
                Select Tech Stack ({form.techstack.length} selected)
              </label>
              <div className="flex flex-wrap gap-2">
                {TECH_OPTIONS.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={`px-3 py-1.5 rounded text-sm font-mono transition-all duration-150 border ${
                      form.techstack.includes(tech)
                        ? "border-jarvis-cyan bg-jarvis-cyan/10 text-jarvis-cyan"
                        : "border-jarvis-border text-jarvis-muted hover:border-jarvis-cyan/30 hover:text-jarvis-text"
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded border border-jarvis-border text-jarvis-muted font-display font-semibold hover:border-jarvis-cyan/30 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => {
                  if (form.techstack.length === 0) return setError("Select at least one tech");
                  setError("");
                  setStep(3);
                }}
                className="flex-1 py-3 rounded bg-jarvis-cyan text-jarvis-bg font-display font-bold hover:bg-jarvis-cyan/90 transition-colors"
              >
                Next → Settings
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 3: SETTINGS ─── */}
        {step === 3 && (
          <>
            {/* Experience Level */}
            <div>
              <label className="block text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-3">
                Experience Level
              </label>
              <div className="flex gap-2">
                {["Junior", "Mid", "Senior"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setForm((p) => ({ ...p, level: lvl }))}
                    className={`flex-1 py-2.5 rounded text-sm font-display font-semibold border transition-all duration-150 ${
                      form.level === lvl
                        ? "border-jarvis-cyan bg-jarvis-cyan/10 text-jarvis-cyan"
                        : "border-jarvis-border text-jarvis-muted hover:border-jarvis-cyan/30"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Type */}
            <div>
              <label className="block text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-3">
                Question Type
              </label>
              <div className="flex gap-2">
                {["Technical", "Behavioral", "Mixed"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((p) => ({ ...p, type: t }))}
                    className={`flex-1 py-2.5 rounded text-sm font-display font-semibold border transition-all duration-150 ${
                      form.type === t
                        ? "border-jarvis-cyan bg-jarvis-cyan/10 text-jarvis-cyan"
                        : "border-jarvis-border text-jarvis-muted hover:border-jarvis-cyan/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-3">
                Number of Questions: <span className="text-jarvis-cyan">{form.amount}</span>
              </label>
              <input
                type="range"
                min={3}
                max={10}
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: parseInt(e.target.value) }))}
                className="w-full accent-jarvis-cyan"
              />
              <div className="flex justify-between text-jarvis-muted text-xs font-mono mt-1">
                <span>3 (Quick)</span>
                <span>7 (Standard)</span>
                <span>10 (Full)</span>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-jarvis-bg rounded border border-jarvis-border text-sm">
              <p className="text-jarvis-muted font-mono text-xs uppercase tracking-widest mb-2">Session Summary</p>
              <div className="space-y-1 text-jarvis-muted">
                <p>Role: <span className="text-jarvis-text">{form.role === "Other" ? form.customRole : form.role}</span></p>
                <p>Level: <span className="text-jarvis-text">{form.level}</span></p>
                <p>Type: <span className="text-jarvis-text">{form.type}</span></p>
                <p>Questions: <span className="text-jarvis-text">{form.amount}</span></p>
                <p>Stack: <span className="text-jarvis-text">{form.techstack.join(", ")}</span></p>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded border border-jarvis-border text-jarvis-muted font-display font-semibold hover:border-jarvis-cyan/30 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleStart}
                disabled={loading}
                className="flex-1 py-3 rounded bg-jarvis-cyan text-jarvis-bg font-display font-bold hover:bg-jarvis-cyan/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-jarvis-bg/30 border-t-jarvis-bg rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  "Launch Interview →"
                )}
              </button>
            </div>
          </>
        )}

        {error && step !== 3 && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}