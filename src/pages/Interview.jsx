// src/pages/Interview.jsx — FIXED (useRef imported, uses hooks from components)

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { evaluateInterview } from "../lib/gemini";
import MicButton from "../components/MicButton";

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("intro");
  const [fullTranscript, setFullTranscript] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [pageError, setPageError] = useState("");

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const finalTranscriptRef = useRef("");

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      synthRef.current?.cancel();
      recognitionRef.current?.stop();
    };
  }, []);

  // ── Fetch interview ──
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const snap = await getDoc(doc(db, "interviews", id));
        if (!snap.exists()) return navigate("/dashboard");
        const data = { id: snap.id, ...snap.data() };
        if (data.feedback) return navigate(`/feedback/${id}`);
        setInterview(data);
      } catch (err) {
        setPageError("Failed to load interview.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id, navigate]);

  // ── Speak text aloud ──
  const speak = useCallback((text, onEnd) => {
    synthRef.current?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.85;
    utterance.volume = 1;

    const voices = synthRef.current?.getVoices() || [];
    const preferred = voices.find(
      (v) => v.name.includes("Google") || v.lang === "en-US"
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => { setIsSpeaking(false); onEnd?.(); };
    utterance.onerror = () => { setIsSpeaking(false); onEnd?.(); };

    synthRef.current?.speak(utterance);
  }, []);

  // ── Speak a question by index ──
  const speakQuestion = useCallback((index) => {
    if (!interview) return;
    const q = interview.questions[index];
    setPhase("speaking");
    setFullTranscript((prev) => [...prev, { role: "interviewer", content: q }]);
    speak(`Question ${index + 1}. ${q}`, () => setPhase("listening"));
  }, [interview, speak]);

  // ── Start interview ──
  const handleStart = () => speakQuestion(0);

  // ── Mic button click ──
  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      startListening();
    }
  };

  // ── Start listening ──
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPageError("Speech recognition not supported. Please use Google Chrome.");
      return;
    }

    finalTranscriptRef.current = "";
    setLiveTranscript("");
    setPageError("");

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + " ";
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      setLiveTranscript(finalTranscriptRef.current + interim);
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        setPageError("Microphone access denied. Please allow microphone in browser settings.");
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // ── Submit answer ──
  const handleSubmitAnswer = () => {
    const answer = liveTranscript.trim() || "[No answer provided]";
    const updatedTranscript = [
      ...fullTranscript,
      { role: "candidate", content: answer },
    ];
    setFullTranscript(updatedTranscript);
    setLiveTranscript("");
    finalTranscriptRef.current = "";

    const nextIndex = currentIndex + 1;
    if (nextIndex >= interview.questions.length) {
      handleFinish(updatedTranscript);
    } else {
      setCurrentIndex(nextIndex);
      setTimeout(() => speakQuestion(nextIndex), 500);
    }
  };

  // ── Finish & evaluate ──
  const handleFinish = async (transcript) => {
    setPhase("complete");
    setIsEvaluating(true);
    speak("Thank you. I am now analyzing your responses.", null);

    try {
      const feedback = await evaluateInterview({
        transcript,
        role: interview.role,
        level: interview.level,
        techstack: interview.techstack,
      });

      await updateDoc(doc(db, "interviews", id), {
        feedback,
        transcript,
        finalized: true,
      });

      navigate(`/feedback/${id}`);
    } catch (err) {
      console.error(err);
      setPageError("Failed to evaluate. Please check your Gemini API key.");
      setIsEvaluating(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-jarvis-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-jarvis-border border-t-jarvis-cyan rounded-full animate-spin" />
          <p className="text-jarvis-muted font-mono text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  const progress = (currentIndex / interview.questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-6 py-8">

      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-jarvis-cyan font-display font-semibold capitalize">{interview.role}</p>
          <p className="text-jarvis-muted text-xs font-mono">{interview.level} · {interview.type}</p>
        </div>
        {phase !== "intro" && phase !== "complete" && (
          <div className="text-right">
            <p className="text-jarvis-muted text-xs font-mono mb-1">
              {currentIndex + 1} / {interview.questions.length}
            </p>
            <div className="w-32 h-1 bg-jarvis-border rounded-full overflow-hidden">
              <div
                className="h-full bg-jarvis-cyan transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── INTRO ── */}
      {phase === "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center animate-slide-up">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border border-jarvis-cyan/20 animate-ping-slow" />
            <div className="w-24 h-24 rounded-full border border-jarvis-cyan/50 flex items-center justify-center bg-jarvis-card">
              <span className="font-mono font-bold text-jarvis-cyan text-3xl">J</span>
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-2xl text-jarvis-text mb-3">Ready to Begin</h2>
            <p className="text-jarvis-muted max-w-md leading-relaxed">
              JARVIS will read each question aloud. Click the mic, speak your answer clearly,
              click mic again to stop, then submit.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-xs font-mono">
            {[`${interview.questions.length} Questions`, interview.level, interview.type,
              ...interview.techstack.slice(0, 3)
            ].map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-jarvis-card border border-jarvis-border rounded text-jarvis-muted">
                {tag}
              </span>
            ))}
          </div>

          <p className="text-jarvis-muted/50 text-xs font-mono flex items-center gap-1">
            <span>⚠</span> Use Google Chrome for best voice support
          </p>

          <button
            onClick={handleStart}
            className="px-10 py-4 rounded bg-jarvis-cyan text-jarvis-bg font-display font-bold text-lg hover:bg-jarvis-cyan/90 transition-all shadow-cyan"
          >
            Begin Interview →
          </button>
        </div>
      )}

      {/* ── INTERVIEW ── */}
      {(phase === "speaking" || phase === "listening") && (
        <div className="flex-1 flex flex-col gap-6 animate-fade-in">

          {/* Question card */}
          <div className="relative bg-jarvis-card border border-jarvis-border rounded-xl p-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-jarvis-cyan/30 to-transparent" />
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-jarvis-cyan/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-jarvis-cyan/40" />

            <div className="flex items-center justify-between mb-4">
              <p className="text-jarvis-muted text-xs font-mono uppercase tracking-widest">
                {isSpeaking ? (
                  <span className="text-jarvis-blue flex items-center gap-2">
                    <span className="flex gap-0.5 items-end">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="waveform-bar bg-jarvis-blue/70 w-0.5"
                          style={{ animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </span>
                    JARVIS speaking...
                  </span>
                ) : (
                  `Question ${currentIndex + 1} of ${interview.questions.length}`
                )}
              </p>
            </div>

            <p className="text-jarvis-text font-display font-medium text-xl leading-relaxed">
              {interview.questions[currentIndex]}
            </p>
          </div>

          {/* Live transcript */}
          <div className="relative flex-1 min-h-32 bg-jarvis-bg border border-jarvis-border rounded-lg p-4 overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-jarvis-cyan/30" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-jarvis-cyan/30" />

            <p className="text-jarvis-muted text-xs font-mono uppercase tracking-widest mb-2">
              {isListening ? (
                <span className="text-jarvis-cyan flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-jarvis-cyan animate-pulse inline-block" />
                  Listening...
                </span>
              ) : "Your Answer"}
            </p>

            {liveTranscript ? (
              <p className="text-jarvis-text font-body leading-relaxed">
                {liveTranscript}
                {isListening && (
                  <span className="inline-block ml-0.5 w-0.5 h-4 bg-jarvis-cyan animate-pulse align-middle" />
                )}
              </p>
            ) : (
              <p className="text-jarvis-muted/40 font-mono text-sm">
                {phase === "listening"
                  ? isListening ? "Speak your answer..." : "Click the mic button below to start answering"
                  : "Waiting for question to finish reading..."}
              </p>
            )}
          </div>

          {/* Mic + Submit */}
          <div className="flex flex-col items-center gap-10 py-4">
            <MicButton
              isListening={isListening}
              isProcessing={false}
              isSpeaking={isSpeaking}
              disabled={phase === "speaking" || isSpeaking}
              onClick={handleMicClick}
            />

            {!isListening && phase === "listening" && (
              <button
                onClick={handleSubmitAnswer}
                className="px-8 py-3 rounded border border-jarvis-cyan text-jarvis-cyan font-display font-semibold hover:bg-jarvis-cyan/10 transition-colors"
              >
                {liveTranscript ? "Submit Answer →" : "Skip Question →"}
              </button>
            )}
          </div>

          {pageError && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm text-center">
              {pageError}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLETE ── */}
      {phase === "complete" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full border border-jarvis-cyan/40 flex items-center justify-center">
            {isEvaluating ? (
              <div className="w-8 h-8 border-2 border-jarvis-border border-t-jarvis-cyan rounded-full animate-spin" />
            ) : (
              <span className="text-2xl text-green-400">✓</span>
            )}
          </div>
          <h2 className="font-display font-bold text-2xl text-jarvis-text">
            {isEvaluating ? "Analyzing your performance..." : "Complete!"}
          </h2>
          <p className="text-jarvis-muted max-w-sm text-center">
            {isEvaluating ? "Scoring across 5 categories. Takes 15–30 seconds." : "Redirecting..."}
          </p>
          {isEvaluating && (
            <div className="flex gap-1.5">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-jarvis-cyan animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          {pageError && (
            <p className="text-red-400 text-sm text-center max-w-sm">{pageError}</p>
          )}
        </div>
      )}
    </div>
  );
}