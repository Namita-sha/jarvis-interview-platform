import { useEffect, useState, useRef } from "react";

const BOOT_LINES = [
  { text: "INITIALIZING JARVIS v3.0...", delay: 0 },
  { text: "NEURAL INTERFACE: ONLINE", delay: 600 },
  { text: "SPEECH SYNTHESIS: ONLINE", delay: 1100 },
  { text: "AI CORE: ONLINE", delay: 1600 },
  { text: "ALL SYSTEMS OPERATIONAL", delay: 2200 },
];

const INTRO_SPEECH = `
Allow me to introduce myself.

I am JARVIS — a virtual artificial intelligence.

Systems are now fully operational.
All functions running at optimal capacity.

How may I assist you today?
`;

export default function JarvisIntro({ onComplete }) {
  const [phase, setPhase] = useState("boot");
  const [visibleLines, setVisible] = useState([]);
  const [speechText, setSpeechText] = useState("");
  const [bars, setBars] = useState(Array(28).fill(4));

  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);
  const animRef = useRef(null);
  const startupSoundRef = useRef(null);
  const humRef = useRef(null);

  // BOOT
  useEffect(() => {
    startupSoundRef.current = new Audio("/sounds/jarvis-startup.mp3");
    startupSoundRef.current.volume = 0.6;
    startupSoundRef.current.play().catch(() => {});

    BOOT_LINES.forEach(({ text, delay }) => {
      setTimeout(() => {
        setVisible((p) => [...p, text]);
      }, delay);
    });

    setTimeout(() => setPhase("speaking"), 2900);

    return () => {
      startupSoundRef.current?.pause();
    };
  }, []);

  // SPEAKING
  useEffect(() => {
    if (phase !== "speaking") return;

    humRef.current = new Audio("/sounds/arc-hum.mp3");
    humRef.current.loop = true;
    humRef.current.volume = 0.12;
    humRef.current.play().catch(() => {});

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(INTRO_SPEECH);
      utterance.rate = 0.88;
      utterance.pitch = 0.78;

      utterance.onend = () => {
        setTimeout(() => setPhase("done"), 800);
      };

      synthRef.current.cancel();
      synthRef.current.speak(utterance);
    };

    setTimeout(speak, 200);

    // typing effect
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      setSpeechText(INTRO_SPEECH.slice(0, i));
      if (i >= INTRO_SPEECH.length) clearInterval(timerRef.current);
    }, 35);

    // waveform
    animRef.current = setInterval(() => {
      setBars(Array(28).fill(0).map(() =>
        Math.floor(Math.random() * 40) + 4
      ));
    }, 120);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(animRef.current);
    };
  }, [phase]);

  // DONE
  useEffect(() => {
    if (phase === "done") {
      humRef.current?.pause();
      clearInterval(animRef.current);
      setBars(Array(28).fill(4));
      setTimeout(() => onComplete(), 700);
    }
  }, [phase, onComplete]);

  // SKIP
  const skip = () => {
    synthRef.current.cancel();
    startupSoundRef.current?.pause();
    humRef.current?.pause();
    clearInterval(timerRef.current);
    clearInterval(animRef.current);
    onComplete();
  };

  return (
    <div className={`ji-overlay hud-grid ${phase === "done" ? "ji-fade-out" : ""}`}>
      <div className="ji-center hud-panel hud-panel-corners scan-panel">

        <h1 className="ji-title holo-text">
          JAR<span className="pink">VIS</span>
        </h1>

        {phase === "boot" && (
          <div className="ji-boot">
            {visibleLines.map((line, i) => (
              <div key={i} className="ji-boot-line">
                [OK] {line}
              </div>
            ))}
          </div>
        )}

        {phase === "speaking" && (
          <>
            <div className="ji-waveform">
              {bars.map((h, i) => (
                <div key={i} className="ji-bar" style={{ height: h }} />
              ))}
            </div>

            <div className="ji-speech">
              {speechText}
              <span className="cursor" />
            </div>
          </>
        )}

        {phase === "done" && (
          <div className="ji-ready">READY</div>
        )}

        <button className="ji-skip" onClick={skip}>
          SKIP INTRO
        </button>
      </div>

      <style>{`
        .ji-overlay {
          position: fixed;
          inset: 0;
          background: var(--j-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: opacity 0.7s ease;
        }

        .ji-fade-out { opacity: 0; }

        .ji-center {
          text-align: center;
          max-width: 600px;
          padding: 30px;
        }

        .ji-title {
          font-size: 64px;
          font-weight: 800;
          letter-spacing: 6px;
        }

        .pink { color: var(--j-arc); }

        .ji-boot {
          margin-top: 30px;
          font-family: monospace;
          color: var(--j-muted);
          text-align: left;
        }

        .ji-boot-line {
          margin-bottom: 8px;
          animation: fadeIn 0.3s ease-out;
        }

        .ji-waveform {
          margin: 30px auto;
          display: flex;
          gap: 3px;
          height: 50px;
          align-items: center;
          justify-content: center;
        }

        .ji-bar {
          width: 3px;
          background: var(--j-arc);
          border-radius: 2px;
          transition: height 0.1s ease;
          box-shadow: 0 0 6px rgba(0,200,255,0.5);
        }

        .ji-speech {
          margin-top: 20px;
          font-size: 15px;
          line-height: 1.7;
          color: var(--j-white);
          min-height: 120px;
          text-align: left;
        }

        .cursor {
          display: inline-block;
          width: 2px;
          height: 18px;
          background: var(--j-arc);
          margin-left: 3px;
          animation: blink 0.8s infinite;
        }

        .ji-ready {
          margin-top: 30px;
          letter-spacing: 4px;
          color: var(--j-arc);
        }

        .ji-skip {
          margin-top: 40px;
          background: transparent;
          border: 1px solid var(--j-border);
          color: var(--j-muted);
          padding: 10px 18px;
          cursor: pointer;
          transition: 0.2s;
        }

        .ji-skip:hover {
          border-color: var(--j-arc);
          color: var(--j-white);
        }

        @keyframes blink {
          0%,100% { opacity:1 }
          50% { opacity:0 }
        }

        @keyframes fadeIn {
          from { opacity:0; transform:translateX(-6px) }
          to { opacity:1; transform:translateX(0) }
        }
      `}</style>
    </div>
  );
}