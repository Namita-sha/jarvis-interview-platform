// src/components/VoiceRecorder.jsx
// Handles all microphone recording logic using Web Speech API
// This component is used inside Interview.jsx
// It exposes: start, stop, transcript, isListening, error

import { useState, useRef, useCallback, useEffect } from "react";
import { checkSpeechSupport, getBrowserName } from "../lib/utils";

/**
 * useVoiceRecorder — custom hook that encapsulates all recording logic
 *
 * Returns:
 *   - isListening: boolean — is the mic currently active?
 *   - transcript: string — the finalized spoken text
 *   - liveTranscript: string — text as it's being spoken (includes interim)
 *   - error: string — any error message
 *   - startListening: function — begin recording
 *   - stopListening: function — stop recording
 *   - resetTranscript: function — clear current transcript
 *   - supported: boolean — does this browser support speech recognition?
 */
export function useVoiceRecorder() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef(""); // Tracks accumulated final transcript
  const { recognition: supported } = checkSpeechSupport();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!supported) {
      setError(
        `Speech recognition is not supported in ${getBrowserName()}. Please use Google Chrome for the best experience.`
      );
      return;
    }

    setError("");
    finalTranscriptRef.current = "";
    setLiveTranscript("");
    setTranscript("");

    // Create Speech Recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Settings
    recognition.continuous = true;       // Keep listening until manually stopped
    recognition.interimResults = true;   // Show words as they're being spoken
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    // ── Event: Recognition started ──
    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    // ── Event: Got speech result ──
    recognition.onresult = (event) => {
      let interimText = "";

      // Loop through results from the last processed index
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          // Final result — add to accumulated transcript
          finalTranscriptRef.current += text + " ";
        } else {
          // Interim result — show live but don't save yet
          interimText = text;
        }
      }

      // Update live display (final + what's still being said)
      setLiveTranscript(finalTranscriptRef.current + interimText);
    };

    // ── Event: Error occurred ──
    recognition.onerror = (event) => {
      switch (event.error) {
        case "not-allowed":
        case "permission-denied":
          setError(
            "Microphone access was denied. Please click the 🔒 icon in your browser's address bar and allow microphone access, then refresh."
          );
          break;
        case "no-speech":
          setError("No speech detected. Please speak closer to your microphone.");
          break;
        case "audio-capture":
          setError("No microphone found. Please connect a microphone and try again.");
          break;
        case "network":
          setError("Network error during speech recognition. Please check your connection.");
          break;
        case "aborted":
          // User intentionally stopped — not really an error
          break;
        default:
          setError(`Speech recognition error: ${event.error}. Please try again.`);
      }
      setIsListening(false);
    };

    // ── Event: Recognition ended (auto or manual) ──
    recognition.onend = () => {
      setIsListening(false);
      // Save the final accumulated transcript
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        setTranscript(finalText);
      }
    };

    // ── Start! ──
    try {
      recognition.start();
    } catch (err) {
      // Happens if you call start() when already running
      setError("Could not start recording. Please refresh and try again.");
      setIsListening(false);
    }
  }, [supported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Save whatever was recorded
      const finalText = finalTranscriptRef.current.trim();
      if (finalText) {
        setTranscript(finalText);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = "";
    setTranscript("");
    setLiveTranscript("");
    setError("");
  }, []);

  return {
    isListening,
    transcript,
    liveTranscript,
    error,
    supported,
    startListening,
    stopListening,
    resetTranscript,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VoiceRecorder — Visual Component
// Use this when you want the full recording UI in one drop-in component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * VoiceRecorder component
 *
 * Props:
 *   - onTranscriptReady(text): called when user stops recording with their answer
 *   - disabled: boolean — disable recording (e.g., while AI is speaking)
 *   - placeholder: string — shown in transcript box when empty
 */
export default function VoiceRecorder({ onTranscriptReady, disabled = false, placeholder }) {
  const {
    isListening,
    liveTranscript,
    transcript,
    error,
    supported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecorder();

  const [submitted, setSubmitted] = useState(false);

  // When user stops talking and we have text, let parent know
  const handleSubmit = () => {
    const answer = liveTranscript || transcript;
    if (onTranscriptReady) {
      onTranscriptReady(answer.trim());
    }
    setSubmitted(true);
    resetTranscript();
  };

  const handleSkip = () => {
    if (onTranscriptReady) {
      onTranscriptReady("");
    }
    resetTranscript();
  };

  const handleRetry = () => {
    setSubmitted(false);
    resetTranscript();
  };

  const displayText = liveTranscript || transcript;

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Browser not supported warning */}
      {!supported && (
        <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-400 text-sm flex items-start gap-2">
          <span className="flex-shrink-0">⚠</span>
          <span>
            Speech recognition requires Google Chrome. Please open this page in Chrome for the full voice experience.
          </span>
        </div>
      )}

      {/* Live transcript display */}
      <div className="relative min-h-28 bg-jarvis-bg border border-jarvis-border rounded-lg p-4 overflow-hidden transition-all duration-200">
        
        {/* Scanning line animation when active */}
        {isListening && (
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-jarvis-cyan/40 to-transparent animate-pulse"
            style={{ top: "50%" }}
          />
        )}

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-jarvis-cyan/40" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-jarvis-cyan/40" />

        <p className="text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-2">
          {isListening ? (
            <span className="text-jarvis-cyan flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-jarvis-cyan animate-pulse inline-block" />
              Recording...
            </span>
          ) : (
            "Your Answer"
          )}
        </p>

        {displayText ? (
          <p className="text-jarvis-text font-body leading-relaxed">
            {displayText}
            {/* Blinking cursor while recording */}
            {isListening && (
              <span className="inline-block ml-0.5 w-0.5 h-4 bg-jarvis-cyan animate-pulse align-middle" />
            )}
          </p>
        ) : (
          <p className="text-jarvis-muted/40 font-mono text-sm">
            {placeholder || (isListening ? "Speak your answer..." : "Click the mic to start")}
          </p>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm flex items-start gap-2">
          <span className="flex-shrink-0 mt-0.5">✕</span>
          <span>{error}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">

        {/* Mic toggle button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled || !supported || submitted}
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center border-2 
            transition-all duration-300
            disabled:opacity-40 disabled:cursor-not-allowed
            ${isListening
              ? "border-jarvis-cyan bg-jarvis-cyan/20 text-jarvis-cyan shadow-cyan"
              : "border-jarvis-border bg-jarvis-card text-jarvis-muted hover:border-jarvis-cyan/50 hover:text-jarvis-cyan"
            }
          `}
        >
          {/* Pulse ring while listening */}
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full border border-jarvis-cyan/30 animate-ping" />
              <span className="absolute inset-[-8px] rounded-full border border-jarvis-cyan/10 animate-ping"
                style={{ animationDelay: "0.3s" }}
              />
            </>
          )}

          {/* Icon */}
          {isListening ? (
            // Stop icon
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            // Mic icon
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
          )}
        </button>

        {/* Submit / Skip buttons — shown when not recording */}
        {!isListening && !submitted && (
          <div className="flex gap-2">
            {displayText && (
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded border border-jarvis-cyan text-jarvis-cyan font-display font-semibold text-sm hover:bg-jarvis-cyan/10 transition-colors"
              >
                Submit Answer →
              </button>
            )}
            <button
              onClick={displayText ? handleRetry : handleSkip}
              className="px-5 py-2.5 rounded border border-jarvis-border text-jarvis-muted font-display text-sm hover:border-jarvis-cyan/30 hover:text-jarvis-cyan transition-colors"
            >
              {displayText ? "Re-record" : "Skip →"}
            </button>
          </div>
        )}
      </div>

      {/* Hint text */}
      <p className="text-center text-jarvis-muted/50 text-xs font-mono">
        {isListening
          ? "Speaking... click the button again to stop"
          : displayText
          ? "Review your answer above, then submit or re-record"
          : "Click the mic button, speak your answer, then click again to stop"}
      </p>
    </div>
  );
}