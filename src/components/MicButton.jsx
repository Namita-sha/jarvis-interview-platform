// src/components/MicButton.jsx
// The animated microphone button — the heart of the UI

export default function MicButton({ isListening, isProcessing, isSpeaking, onClick, disabled }) {
  
  // Determine current state
  const getState = () => {
    if (isProcessing) return "processing";
    if (isSpeaking) return "speaking";
    if (isListening) return "listening";
    return "idle";
  };

  const state = getState();

  return (
    <div className="relative flex items-center justify-center">
      
      {/* Outer pulse rings — only when listening */}
      {isListening && (
        <>
          <div className="absolute w-40 h-40 rounded-full border border-jarvis-cyan/20 animate-ping-slow" />
          <div
            className="absolute w-32 h-32 rounded-full border border-jarvis-cyan/30 animate-ping-slow"
            style={{ animationDelay: "0.3s" }}
          />
        </>
      )}

      {/* Glow when speaking */}
      {isSpeaking && (
        <div className="absolute w-36 h-36 rounded-full bg-jarvis-blue/10 animate-pulse" />
      )}

      {/* Main button */}
      <button
        onClick={onClick}
        disabled={disabled || isProcessing || isSpeaking}
        className={`
          relative z-10 w-24 h-24 rounded-full flex items-center justify-center
          border-2 transition-all duration-300
          font-display font-semibold text-sm
          disabled:cursor-not-allowed
          ${state === "listening"
            ? "border-jarvis-cyan bg-jarvis-cyan/20 text-jarvis-cyan shadow-cyan animate-glow"
            : state === "processing"
            ? "border-jarvis-blue/50 bg-jarvis-blue/10 text-jarvis-blue"
            : state === "speaking"
            ? "border-jarvis-blue bg-jarvis-blue/20 text-jarvis-blue"
            : "border-jarvis-border bg-jarvis-card text-jarvis-muted hover:border-jarvis-cyan/60 hover:text-jarvis-cyan hover:shadow-cyan"
          }
        `}
      >
        {state === "processing" ? (
          // Spinning arc
          <div className="w-8 h-8 border-2 border-jarvis-blue/30 border-t-jarvis-blue rounded-full animate-spin" />
        ) : state === "speaking" ? (
          // Waveform when speaking
          <div className="flex items-center gap-0.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="waveform-bar bg-jarvis-blue" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : state === "listening" ? (
          // Mic icon when listening
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        ) : (
          // Mic icon at idle
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* State label */}
      <div className="absolute -bottom-8 text-xs font-mono text-jarvis-muted text-center whitespace-nowrap">
        {state === "idle" && "Click to answer"}
        {state === "listening" && <span className="text-jarvis-cyan">● Recording...</span>}
        {state === "processing" && <span className="text-jarvis-blue">Processing...</span>}
        {state === "speaking" && <span className="text-jarvis-blue">JARVIS speaking...</span>}
      </div>
    </div>
  );
}