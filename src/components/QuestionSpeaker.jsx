// src/components/QuestionSpeaker.jsx
// Handles text-to-speech — JARVIS reads questions aloud using Web Speech API
// Exposes both a hook (useQuestionSpeaker) and a visual component (QuestionSpeaker)

import { useState, useRef, useCallback, useEffect } from "react";
import { checkSpeechSupport } from "../lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// useQuestionSpeaker — custom hook for all TTS logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hook that wraps SpeechSynthesis with a clean API
 *
 * Returns:
 *   - isSpeaking: boolean
 *   - speak(text, onEnd): reads text aloud, calls onEnd when done
 *   - stop(): cancels current speech
 *   - supported: boolean
 */
export function useQuestionSpeaker() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const { synthesis: supported } = checkSpeechSupport();

  // Cancel speech when component unmounts
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
    };
  }, []);

  // Some browsers load voices asynchronously — wait for them
  const getPreferredVoice = useCallback(() => {
    const voices = synthRef.current?.getVoices() || [];

    // Priority order — try to find the most natural-sounding voice
    const preferenceOrder = [
      (v) => v.name === "Google UK English Male",
      (v) => v.name === "Google US English",
      (v) => v.name.includes("Google") && v.lang.startsWith("en"),
      (v) => v.name.includes("Microsoft") && v.lang.startsWith("en"),
      (v) => v.lang === "en-US" && !v.localService,
      (v) => v.lang.startsWith("en"),
    ];

    for (const test of preferenceOrder) {
      const found = voices.find(test);
      if (found) return found;
    }

    return null; // Use browser default
  }, []);

  const speak = useCallback(
    (text, onEnd) => {
      if (!supported) {
        console.warn("Speech synthesis not supported in this browser.");
        onEnd?.();
        return;
      }

      // Cancel any current speech first
      synthRef.current?.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Voice settings — calm, professional, slightly robotic
      utterance.rate = 0.88;     // Slightly slower than default (1.0) for clarity
      utterance.pitch = 0.85;    // Slightly lower = more authoritative/robotic
      utterance.volume = 1.0;

      // Set preferred voice
      const voice = getPreferredVoice();
      if (voice) utterance.voice = voice;

      // Events
      utterance.onstart = () => setIsSpeaking(true);

      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      utterance.onerror = (event) => {
        // "interrupted" is not really an error — it happens when we cancel intentionally
        if (event.error !== "interrupted" && event.error !== "canceled") {
          console.error("Speech synthesis error:", event.error);
        }
        setIsSpeaking(false);
        onEnd?.();
      };

      // Speak!
      synthRef.current?.speak(utterance);

      // Chrome bug fix: speechSynthesis sometimes pauses if the tab loses focus
      // This keepAlive interval prevents that
      const keepAlive = setInterval(() => {
        if (synthRef.current?.speaking) {
          synthRef.current?.pause();
          synthRef.current?.resume();
        } else {
          clearInterval(keepAlive);
        }
      }, 10000);

      // Clean up keepAlive when done
      utterance.onend = () => {
        clearInterval(keepAlive);
        setIsSpeaking(false);
        onEnd?.();
      };
    },
    [supported, getPreferredVoice]
  );

  const stop = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop, supported };
}

// ─────────────────────────────────────────────────────────────────────────────
// QuestionSpeaker — Visual Component
// Drop this into a page to show a question card that auto-reads aloud
// ─────────────────────────────────────────────────────────────────────────────

/**
 * QuestionSpeaker component
 *
 * Props:
 *   - question: string — the question text to display and speak
 *   - questionNumber: number — e.g. 1, 2, 3
 *   - totalQuestions: number
 *   - onDoneSpeaking: function — called when AI finishes reading the question
 *   - autoSpeak: boolean — start speaking as soon as question changes (default: true)
 */
export default function QuestionSpeaker({
  question,
  questionNumber,
  totalQuestions,
  onDoneSpeaking,
  autoSpeak = true,
}) {
  const { isSpeaking, speak, stop, supported } = useQuestionSpeaker();
  const [hasSpoken, setHasSpoken] = useState(false);
  const prevQuestionRef = useRef(null);

  // Auto-speak whenever the question changes
  useEffect(() => {
    if (!question) return;
    if (question === prevQuestionRef.current) return; // Don't repeat same question

    prevQuestionRef.current = question;
    setHasSpoken(false);

    if (autoSpeak && supported) {
      // Small delay so UI renders first
      const timer = setTimeout(() => {
        speak(`Question ${questionNumber}. ${question}`, () => {
          setHasSpoken(true);
          onDoneSpeaking?.();
        });
      }, 400);
      return () => clearTimeout(timer);
    } else if (!supported) {
      // If no TTS, immediately fire callback so user can still type/answer
      onDoneSpeaking?.();
    }
  }, [question, questionNumber, autoSpeak, supported, speak, onDoneSpeaking]);

  const handleReplayClick = () => {
    setHasSpoken(false);
    speak(`Question ${questionNumber}. ${question}`, () => {
      setHasSpoken(true);
    });
  };

  if (!question) return null;

  return (
    <div className="relative bg-jarvis-card border border-jarvis-border rounded-xl p-6 overflow-hidden">
      
      {/* Top glowing border — active while speaking */}
      <div
        className={`absolute top-0 left-0 right-0 h-px transition-opacity duration-500 ${
          isSpeaking ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(90deg, transparent, #00E5FF, transparent)",
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-jarvis-cyan/40" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-jarvis-cyan/40" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Speaker icon / waveform */}
          {isSpeaking ? (
            <div className="flex items-end gap-0.5 h-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-jarvis-cyan"
                  style={{
                    height: `${8 + Math.sin(i * 1.2) * 6}px`,
                    animation: `waveform 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : (
            <svg className="w-4 h-4 text-jarvis-muted" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
              />
            </svg>
          )}

          <span className="text-jarvis-muted text-xs font-mono uppercase tracking-widest">
            {isSpeaking ? (
              <span className="text-jarvis-cyan">JARVIS speaking</span>
            ) : (
              `Question ${questionNumber} of ${totalQuestions}`
            )}
          </span>
        </div>

        {/* Replay button — shown after question is done speaking */}
        {!isSpeaking && hasSpoken && supported && (
          <button
            onClick={handleReplayClick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-jarvis-border text-jarvis-muted text-xs font-mono hover:border-jarvis-cyan/40 hover:text-jarvis-cyan transition-colors"
            title="Replay question"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            </svg>
            Replay
          </button>
        )}
      </div>

      {/* Question text */}
      <p className="text-jarvis-text font-display font-medium text-xl leading-relaxed">
        {question}
      </p>

      {/* TTS not supported notice */}
      {!supported && (
        <div className="mt-4 p-2 bg-yellow-900/20 border border-yellow-500/20 rounded text-yellow-400/70 text-xs font-mono">
          ⚠ Voice reading requires Chrome. Reading in text mode.
        </div>
      )}
    </div>
  );
}