import { useEffect, useState, useRef, useCallback } from "react";

// ─── Phase order: boot → scan → greet → done ────────────────────────────────

const BOOT_LINES = [
  { text: "Initializing Neural Interface...",  delay: 300  },
  { text: "Loading Candidate Profile...",       delay: 900  },
  { text: "Analyzing Cognitive Patterns...",    delay: 1600 },
  { text: "All systems nominal.",               delay: 2300 },
];

const SCAN_STATS = [
  { label: "Confidence Index",   final: "72%",         duration: 1800 },
{ label: "Analytical Ability", final: "Processing",  duration: 2400 },
{ label: "Verbal Precision",   final: "Evaluating",  duration: 2200 },
{ label: "Response Latency",   final: "Measuring",   duration: 2100 },
];

const GREETING_SPEECH = "How may I assist you today?";

// ─── Utility: typewriter hook ────────────────────────────────────────────────
function useTypewriter(text, speed = 38, active = true) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed, active]);
  return displayed;
}

// ─── Animated stat counter ───────────────────────────────────────────────────
function StatRow({ label, final, duration, startDelay }) {
  const [val, setVal]     = useState("···");
  const [done, setDone]   = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => {
      const chars = "█▓▒░01∆∇◈◇";
      let elapsed = 0;
      const step  = 60;
      const iv = setInterval(() => {
        elapsed += step;
        if (elapsed >= duration) {
          setVal(final);
          setDone(true);
          clearInterval(iv);
        } else {
          setVal(chars[Math.floor(Math.random() * chars.length)] +
                 chars[Math.floor(Math.random() * chars.length)] +
                 chars[Math.floor(Math.random() * chars.length)]);
        }
      }, step);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t0);
  }, [final, duration, startDelay]);

  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className={`stat-dots`}>{"·".repeat(18)}</span>
      <span className={`stat-val ${done ? "stat-done" : "stat-scramble"}`}>{val}</span>
    </div>
  );
}

// ─── Circular HUD ring ───────────────────────────────────────────────────────
function HudRing({ size = 220, progress = 0, strokeColor = "#00C8FF" }) {
  const r   = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="hud-ring-svg">
      {/* outer deco ticks */}
      {Array.from({ length: 36 }).map((_, i) => {
        const angle = (i * 10 * Math.PI) / 180;
        const isMajor = i % 9 === 0;
        const r1 = size / 2 - 4;
        const r2 = r1 - (isMajor ? 12 : 6);
        return (
          <line
            key={i}
            x1={size / 2 + r1 * Math.cos(angle)}
            y1={size / 2 + r1 * Math.sin(angle)}
            x2={size / 2 + r2 * Math.cos(angle)}
            y2={size / 2 + r2 * Math.sin(angle)}
            stroke={strokeColor}
            strokeWidth={isMajor ? 1.5 : 0.5}
            opacity={isMajor ? 0.6 : 0.2}
          />
        );
      })}
      {/* track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={strokeColor} strokeWidth={1} opacity={0.1} />
      {/* progress arc */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={strokeColor} strokeWidth={2}
        strokeDasharray={circ}
        strokeDashoffset={circ - (circ * progress) / 100}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.05s linear" }}
      />
      {/* inner ring */}
      <circle cx={size/2} cy={size/2} r={r * 0.72} fill="none"
        stroke={strokeColor} strokeWidth={0.5} opacity={0.15} />
      {/* center dot */}
      <circle cx={size/2} cy={size/2} r={5} fill={strokeColor} opacity={0.6} />
      <circle cx={size/2} cy={size/2} r={2} fill={strokeColor} />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function JarvisIntro({ onComplete }) {
  const [phase, setPhase]           = useState("black");   // black|boot|scan|greet|done
  const [bootLines, setBootLines]   = useState([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [personalGreet, setPersonalGreet] = useState("");
  const [greetActive, setGreetActive]  = useState(false);

  const startupRef = useRef(null);
  const humRef     = useRef(null);
  const synthRef   = useRef(window.speechSynthesis);
  const animRef    = useRef(null);
  const skipRef    = useRef(false);

  const greetTyped = useTypewriter(personalGreet, 40, greetActive);

  // ── skip handler ────────────────────────────────────────────────────────
  const skip = useCallback(() => {
    if (skipRef.current) return;
    skipRef.current = true;
    synthRef.current.cancel();
    startupRef.current?.pause();
    humRef.current?.pause();
    clearInterval(animRef.current);
    setPhase("done");
    setTimeout(onComplete, 400);
  }, [onComplete]);

  // keyboard skip
  useEffect(() => {
    const handler = (e) => { if (e.key === "Enter") skip(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [skip]);

  // ── Phase: black → boot ─────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      
      startupRef.current = new Audio("/sounds/jarvis-startup.mp3");
      startupRef.current.volume = 0.55;
      startupRef.current.play().catch(() => {});
      setPhase("boot");
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // ── Phase: boot lines ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "boot") return;
    BOOT_LINES.forEach(({ text, delay }) => {
      setTimeout(() => {
        if (!skipRef.current) setBootLines((p) => [...p, text]);
      }, delay);
    });
    setTimeout(() => { if (!skipRef.current) setPhase("scan"); }, 3000);
  }, [phase]);

  // ── Phase: scan ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "scan") return;

    humRef.current = new Audio("/sounds/arc-hum.mp3");
    humRef.current.loop   = true;
    humRef.current.volume = 0.1;
    humRef.current.play().catch(() => {});

    // spin the ring
    let p = 0;
    animRef.current = setInterval(() => {
      p = Math.min(p + 0.8, 100);
      setScanProgress(p);
      if (p >= 100) {
        clearInterval(animRef.current);
        setTimeout(() => { if (!skipRef.current) setPhase("greet"); }, 600);
      }
    }, 30);

    // speak scan line
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(
  "I am JARVIS — a virtual artificial intelligence."
);
      u.rate  = 0.85;
      u.pitch = 0.75;
      synthRef.current.cancel();
      synthRef.current.speak(u);
    }, 400);

    return () => clearInterval(animRef.current);
  }, [phase]);

  // ── Phase: greet ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "greet") return;

    const name = localStorage.getItem("orix_user_name") ||
                 localStorage.getItem("jarvis_user_name") || "";

    const fullGreet = name
      ? `${GREETING_SPEECH} Ready to evaluate you, ${name}.`
      : GREETING_SPEECH;

    setPersonalGreet(fullGreet);
    setGreetActive(true);

    // speak it
    setTimeout(() => {
      const u = new SpeechSynthesisUtterance(fullGreet);
      u.rate  = 0.85;
      u.pitch = 0.75;
      u.onend = () => { if (!skipRef.current) setTimeout(() => setPhase("done"), 700); };
      synthRef.current.cancel();
      synthRef.current.speak(u);
    }, 300);
  }, [phase]);

  // ── Phase: done ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "done") return;
    humRef.current?.pause();
    if (!skipRef.current) setTimeout(onComplete, 600);
  }, [phase, onComplete]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`ji-root ${phase === "done" ? "ji-out" : phase === "black" ? "ji-black" : ""}`}
      onClick={skip}
    >

      {/* ── BOOT phase ── */}
      {(phase === "boot") && (
        <div className="ji-boot-wrap">
          {bootLines.map((line, i) => (
            <div key={i} className="ji-boot-line">
              <span className="ji-ok">[  OK  ]</span> {line}
            </div>
          ))}
          <span className="ji-cursor-block" />
        </div>
      )}

      {/* ── SCAN phase ── */}
      {phase === "scan" && (
        <div className="ji-scan-wrap">
          <div className="ji-ring-area">
            <HudRing size={230} progress={scanProgress} />
            <div className="ji-ring-label">
              <span className="ji-ring-pct">{Math.round(scanProgress)}%</span>
              <span className="ji-ring-sub">SCANNING</span>
            </div>
          </div>

          <div className="ji-stats-panel">
            <div className="ji-stats-title">CANDIDATE ANALYSIS</div>
            {SCAN_STATS.map((s, i) => (
              <StatRow key={s.label} {...s} startDelay={i * 300} />
            ))}
          </div>

          <p className="ji-scan-voice">
            "Allow me to introduce myself.
            I am JARVIS — a virtual artificial intelligence.

Systems are now fully operational.
All functions running at optimal capacity."
          </p>
        </div>
      )}

      {/* ── GREET phase ── */}
      {phase === "greet" && (
        <div className="ji-greet-wrap">
          <div className="ji-greet-line">
            {greetTyped}
            <span className="ji-cursor-inline" />
          </div>
        </div>
      )}

      {/* ── Skip hint ── */}
      {phase !== "black" && phase !== "done" && (
        <div className="ji-skip-hint">
          Press <kbd>Enter</kbd> or click anywhere to skip
        </div>
      )}

      {/* ── styles ── */}
      <style>{`
        .ji-root {
          position: fixed; inset: 0;
          background: #000;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          z-index: 9999;
          cursor: pointer;
          transition: opacity 0.8s ease;
          overflow: hidden;
        }
        .ji-black { opacity: 0; }
        .ji-out   { opacity: 0; pointer-events: none; }

        /* subtle scanline overlay */
        .ji-root::before {
          content: "";
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,200,255,0.015) 2px,
            rgba(0,200,255,0.015) 4px
          );
          pointer-events: none;
        }

        /* ── BOOT ── */
        .ji-boot-wrap {
          font-family: "JetBrains Mono", "Courier New", monospace;
          font-size: clamp(11px, 1.6vw, 14px);
          line-height: 2;
          color: rgba(0, 200, 255, 0.75);
          text-align: left;
          width: min(600px, 90vw);
          padding: 0 24px;
        }
        .ji-boot-line {
          animation: bootFade 0.25s ease-out both;
        }
        .ji-ok {
          color: rgba(0, 200, 100, 0.8);
          margin-right: 10px;
        }
        .ji-cursor-block {
          display: inline-block;
          width: 10px; height: 16px;
          background: rgba(0,200,255,0.7);
          animation: blink 0.7s infinite;
          vertical-align: middle;
          margin-top: 8px;
        }

        /* ── SCAN ── */
        .ji-scan-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
          width: min(700px, 92vw);
          animation: fadeUp 0.5s ease-out both;
        }
        .ji-ring-area {
          position: relative;
          width: 230px; height: 230px;
          flex-shrink: 0;
        }
        .hud-ring-svg { position: absolute; top: 0; left: 0; }
        .ji-ring-label {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 4px;
          pointer-events: none;
        }
        .ji-ring-pct {
          font-family: "JetBrains Mono", monospace;
          font-size: 28px; font-weight: 500;
          color: #00C8FF;
          letter-spacing: 2px;
        }
        .ji-ring-sub {
          font-family: "JetBrains Mono", monospace;
          font-size: 9px; letter-spacing: 4px;
          color: rgba(0,200,255,0.4);
        }

        .ji-stats-panel {
          width: 100%;
          max-width: 480px;
        }
        .ji-stats-title {
          font-family: "JetBrains Mono", monospace;
          font-size: 9px; letter-spacing: 4px;
          color: rgba(0,200,255,0.3);
          margin-bottom: 16px;
          text-align: center;
        }
        .stat-row {
          display: flex; align-items: center;
          gap: 8px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,200,255,0.06);
        }
        .stat-label {
          font-family: "JetBrains Mono", monospace;
          font-size: 12px; color: rgba(0,200,255,0.5);
          letter-spacing: 1px;
          min-width: 160px;
        }
        .stat-dots {
          flex: 1;
          font-family: "JetBrains Mono", monospace;
          font-size: 10px; color: rgba(0,200,255,0.12);
          letter-spacing: 2px;
          overflow: hidden;
        }
        .stat-val {
          font-family: "JetBrains Mono", monospace;
          font-size: 13px; font-weight: 500;
          min-width: 90px; text-align: right;
          letter-spacing: 1px;
        }
        .stat-scramble { color: rgba(0,200,255,0.3); }
        .stat-done     { color: #00C8FF; transition: color 0.3s; }

        .ji-scan-voice {
          font-size: 15px;
          color: rgba(232,244,255,0.35);
          font-style: italic;
          letter-spacing: 0.5px;
          text-align: center;
          margin: 0;
        }

        /* ── GREET ── */
        .ji-greet-wrap {
          display: flex; align-items: center; justify-content: center;
          padding: 0 32px;
          animation: fadeUp 0.4s ease-out both;
        }
        .ji-greet-line {
          font-family: "Exo 2", "JetBrains Mono", monospace;
          font-size: clamp(22px, 4vw, 40px);
          font-weight: 600;
          color: #E8F4FF;
          letter-spacing: 2px;
          text-align: center;
          line-height: 1.4;
        }
        .ji-cursor-inline {
          display: inline-block;
          width: 3px; height: clamp(22px, 4vw, 40px);
          background: #00C8FF;
          margin-left: 4px;
          vertical-align: middle;
          animation: blink 0.7s infinite;
        }

        /* ── skip hint ── */
        .ji-skip-hint {
          position: fixed; bottom: 32px; left: 50%;
          transform: translateX(-50%);
          font-family: "JetBrains Mono", monospace;
          font-size: 10px; letter-spacing: 2px;
          color: rgba(0,200,255,0.2);
          white-space: nowrap;
          pointer-events: none;
        }
        .ji-skip-hint kbd {
          background: rgba(0,200,255,0.07);
          border: 1px solid rgba(0,200,255,0.15);
          padding: 1px 6px;
          border-radius: 2px;
          font-family: inherit;
          font-size: inherit;
          color: rgba(0,200,255,0.35);
        }

        /* ── keyframes ── */
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bootFade  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
      `}</style>
    </div>
  );
}