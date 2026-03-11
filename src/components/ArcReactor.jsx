// src/components/ArcReactor.jsx
// The iconic arc reactor ring system — used throughout the app as loader,
// logo, and decorative element. Sizes: sm / md / lg / xl

export default function ArcReactor({ size = "md", animate = true, children, className = "" }) {
  const sizes = {
    sm:  { outer:60,  ring1:50,  ring2:38,  core:28,  font:12, stroke:1.5 },
    md:  { outer:90,  ring1:76,  ring2:58,  core:42,  font:17, stroke:1.5 },
    lg:  { outer:130, ring1:112, ring2:86,  core:62,  font:24, stroke:2   },
    xl:  { outer:180, ring1:158, ring2:122, core:88,  font:32, stroke:2   },
  };
  const s = sizes[size];

  const ringStyle = (d, rev = false, opacity = 0.5) => ({
    position: "absolute",
    width: d, height: d,
    top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    borderRadius: "50%",
    border: `${s.stroke}px solid rgba(0,200,255,${opacity})`,
    animation: animate
      ? `${rev ? "arcSpinRev" : "arcSpin"} ${rev ? "6s" : "10s"} linear infinite`
      : "none",
    boxShadow: `0 0 ${d * 0.1}px rgba(0,200,255,${opacity * 0.4})`,
  });

  // Tick marks on outer ring
  const ticks = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: s.outer, height: s.outer,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* Outer ambient glow */}
      <div style={{
        position: "absolute",
        width: s.outer + 20, height: s.outer + 20,
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,200,255,0.08) 0%, transparent 70%)",
        animation: animate ? "arcPulse 3s ease-in-out infinite" : "none",
      }} />

      {/* Ring 1 — outer, slow spin, tick marks */}
      <svg
        width={s.ring1} height={s.ring1}
        viewBox={`0 0 ${s.ring1} ${s.ring1}`}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          animation: animate ? "arcSpin 14s linear infinite" : "none",
        }}
      >
        <circle
          cx={s.ring1/2} cy={s.ring1/2} r={s.ring1/2 - 2}
          fill="none" stroke="rgba(0,200,255,0.25)" strokeWidth={s.stroke}
        />
        {ticks.map((i) => {
          const angle = (i / 12) * 360;
          const rad   = (angle - 90) * (Math.PI / 180);
          const r     = s.ring1 / 2 - 2;
          const x1    = s.ring1/2 + (r - 4) * Math.cos(rad);
          const y1    = s.ring1/2 + (r - 4) * Math.sin(rad);
          const x2    = s.ring1/2 + r * Math.cos(rad);
          const y2    = s.ring1/2 + r * Math.sin(rad);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={i % 3 === 0 ? "rgba(0,200,255,0.7)" : "rgba(0,200,255,0.3)"}
              strokeWidth={i % 3 === 0 ? s.stroke : s.stroke * 0.7}
            />
          );
        })}
        {/* Arc segment — 1/4 of the ring, bright */}
        <circle
          cx={s.ring1/2} cy={s.ring1/2} r={s.ring1/2 - 2}
          fill="none" stroke="rgba(0,200,255,0.7)" strokeWidth={s.stroke + 0.5}
          strokeDasharray={`${(s.ring1/2 - 2) * 2 * Math.PI * 0.25} ${(s.ring1/2 - 2) * 2 * Math.PI * 0.75}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Ring 2 — middle, reverse spin */}
      <svg
        width={s.ring2} height={s.ring2}
        viewBox={`0 0 ${s.ring2} ${s.ring2}`}
        style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          animation: animate ? "arcSpinRev 8s linear infinite" : "none",
        }}
      >
        <circle
          cx={s.ring2/2} cy={s.ring2/2} r={s.ring2/2 - 2}
          fill="none" stroke="rgba(0,200,255,0.2)" strokeWidth={s.stroke}
        />
        {/* 3 bright arc segments */}
        {[0, 1, 2].map((i) => {
          const segLen = (s.ring2/2 - 2) * 2 * Math.PI;
          const dash   = segLen * 0.15;
          const gap    = segLen * (1/3 - 0.15);
          return (
            <circle key={i} cx={s.ring2/2} cy={s.ring2/2} r={s.ring2/2 - 2}
              fill="none" stroke="rgba(0,200,255,0.6)" strokeWidth={s.stroke + 0.5}
              strokeDasharray={`${dash} ${gap} ${dash} ${gap} ${dash} ${gap}`}
              strokeDashoffset={-i * segLen / 3}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Core */}
      <div style={{
        position: "relative",
        width: s.core, height: s.core,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,200,255,0.25) 0%, rgba(0,200,255,0.08) 50%, transparent 70%)",
        border: `${s.stroke}px solid rgba(0,200,255,0.5)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 20px rgba(0,200,255,0.3), inset 0 0 15px rgba(0,200,255,0.1)",
        animation: animate ? "arcGlow 3s ease-in-out infinite" : "none",
        zIndex: 2,
      }}>
        {children ? children : (
          <span style={{
            fontFamily: "JetBrains Mono, monospace",
            fontWeight: 700, color: "#00C8FF",
            fontSize: s.font,
            textShadow: "0 0 12px rgba(0,200,255,0.8)",
          }}>J</span>
        )}
      </div>
    </div>
  );
}