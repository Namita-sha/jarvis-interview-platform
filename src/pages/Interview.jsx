// src/pages/Interview.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { evaluateInterview } from "../lib/gemini";
import ArcReactor from "../components/ArcReactor";

export default function Interview() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [interview,      setInterview]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [currentIndex,   setCurrentIndex]   = useState(0);
  const [phase,          setPhase]          = useState("intro");
  const [fullTranscript, setFullTranscript] = useState([]);
  const [isEvaluating,   setIsEvaluating]   = useState(false);
  const [isListening,    setIsListening]    = useState(false);
  const [isSpeaking,     setIsSpeaking]     = useState(false);
  const [liveText,       setLiveText]       = useState("");
  const [pageError,      setPageError]      = useState("");

  const recRef   = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const finalRef = useRef("");

  useEffect(() => () => { synthRef.current?.cancel(); recRef.current?.stop(); }, []);

  useEffect(() => {
    getDoc(doc(db,"interviews",id)).then((snap) => {
      if (!snap.exists()) return navigate("/dashboard");
      const data = { id:snap.id, ...snap.data() };
      if (data.feedback) return navigate(`/feedback/${id}`);
      setInterview(data);
    }).catch(()=>setPageError("FAILED TO LOAD SESSION"))
      .finally(()=>setLoading(false));
  }, [id,navigate]);

  const speak = useCallback((text, onEnd) => {
    synthRef.current?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88; u.pitch = 0.78; u.volume = 1;
    const all = synthRef.current?.getVoices()||[];
    const v = all.find((v)=>v.name.includes("Google UK English Male"))
           || all.find((v)=>v.lang==="en-US")
           || all[0];
    if (v) u.voice = v;
    u.onstart = ()=>setIsSpeaking(true);
    u.onend   = ()=>{ setIsSpeaking(false); onEnd?.(); };
    u.onerror = ()=>{ setIsSpeaking(false); onEnd?.(); };
    synthRef.current?.speak(u);
  }, []);

  const speakQuestion = useCallback((index) => {
    if (!interview) return;
    const q = interview.questions[index];
    setPhase("speaking");
    setFullTranscript((p)=>[...p,{ role:"interviewer",content:q }]);
    speak(`Question ${index+1}. ${q}`, ()=>setPhase("listening"));
  }, [interview, speak]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return setPageError("SPEECH RECOGNITION UNAVAILABLE — USE CHROME");
    finalRef.current = ""; setLiveText("");
    const rec = new SR();
    recRef.current = rec;
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onstart  = ()=>setIsListening(true);
    rec.onresult = (e) => {
      let interim = "";
      for (let i=e.resultIndex; i<e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript+" ";
        else interim = e.results[i][0].transcript;
      }
      setLiveText(finalRef.current+interim);
    };
    rec.onerror = (e)=>{ setIsListening(false); if(e.error==="not-allowed") setPageError("MICROPHONE ACCESS DENIED"); };
    rec.onend   = ()=>setIsListening(false);
    rec.start();
  };

  const handleSubmit = () => {
    const answer  = liveText.trim() || "[NO RESPONSE CAPTURED]";
    const updated = [...fullTranscript,{ role:"candidate",content:answer }];
    setFullTranscript(updated);
    setLiveText(""); finalRef.current="";
    const next = currentIndex+1;
    if (next >= interview.questions.length) handleFinish(updated);
    else { setCurrentIndex(next); setTimeout(()=>speakQuestion(next), 400); }
  };

  const handleFinish = async (transcript) => {
    setPhase("complete"); setIsEvaluating(true);
    speak("Analysis complete. Processing your performance data now.", null);
    try {
      const feedback = await evaluateInterview({ transcript, role:interview.role, level:interview.level, techstack:interview.techstack });
      await updateDoc(doc(db,"interviews",id),{ feedback, transcript, finalized:true });
      navigate(`/feedback/${id}`);
    } catch(e) {
      console.error(e);
      setPageError("EVALUATION FAILED — CHECK GEMINI API KEY");
      setIsEvaluating(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight:"80vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20 }}>
      <ArcReactor size="lg" />
      <span className="hud-label-arc" style={{ letterSpacing:3 }}>LOADING SESSION DATA...</span>
    </div>
  );
  if (!interview) return null;

  const progress = Math.round((currentIndex/interview.questions.length)*100);

  return (
    <div className="page-wrapper hud-grid">
      <div className="iv-wrap">

        {/* Top bar */}
        <div className="iv-topbar">
          <div>
            <p className="hud-label-arc" style={{ marginBottom:5 }}>ACTIVE SESSION</p>
            <p className="iv-role">{interview.role?.toUpperCase()}</p>
            <p className="hud-label" style={{ marginTop:3 }}>{interview.level?.toUpperCase()} · {interview.type?.toUpperCase()}</p>
          </div>
          {phase!=="intro"&&phase!=="complete" && (
            <div style={{ textAlign:"right" }}>
              <p className="hud-label-arc" style={{ marginBottom:8 }}>
                {String(currentIndex+1).padStart(2,"0")} / {String(interview.questions.length).padStart(2,"0")}
              </p>
              <div style={{ width:140,height:3,background:"var(--j-border)",borderRadius:0,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${progress}%`,background:"linear-gradient(90deg,var(--j-arc-dim),var(--j-arc))",transition:"width 0.6s ease",boxShadow:"0 0 8px rgba(0,200,255,0.5)" }} />
              </div>
            </div>
          )}
        </div>

        {/* INTRO */}
        {phase==="intro" && (
          <div className="iv-center animate-fadeInUp">
            <ArcReactor size="xl" />
            <h2 className="iv-intro-h">READY TO INITIATE</h2>
            <p className="iv-intro-sub">
              I will read each question aloud. Activate your microphone, deliver your response,
              then submit to proceed to the next question.
            </p>
            <div style={{ display:"flex",flexWrap:"wrap",justifyContent:"center",gap:7,margin:"4px 0 8px" }}>
              {[`${interview.questions.length} QUESTIONS`,interview.level.toUpperCase(),interview.type.toUpperCase(),...interview.techstack.slice(0,3).map(t=>t.toUpperCase())].map((t)=>(
                <span key={t} className="hud-tag">{t}</span>
              ))}
            </div>
            <p className="hud-label" style={{ marginBottom:24 }}>⚠ REQUIRES GOOGLE CHROME FOR VOICE SUPPORT</p>
            <button className="btn-arc-solid" style={{ fontSize:14,padding:"15px 48px",letterSpacing:3 }}
              onClick={()=>speakQuestion(0)}>
              BEGIN SESSION →
            </button>
          </div>
        )}

        {/* INTERVIEW */}
        {(phase==="speaking"||phase==="listening") && (
          <div className="iv-body animate-fadeInUp">

            {/* Question panel */}
            <div className="hud-panel hud-panel-corners scan-panel iv-q-panel">
              <div style={{ position:"absolute",top:0,left:0,right:0,height:"1px",background:"linear-gradient(90deg,transparent,rgba(0,200,255,0.5),transparent)" }} />
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                {isSpeaking ? (
                  <>
                    <div style={{ display:"flex",alignItems:"flex-end",gap:2.5,height:18 }}>
                      {[0,1,2,3,4].map((i)=><div key={i} className="arc-wave-bar" style={{ animationDelay:`${i*.1}s`,height:6 }} />)}
                    </div>
                    <span className="hud-label-arc">JARVIS SPEAKING</span>
                  </>
                ) : (
                  <>
                    <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--j-arc)",boxShadow:"0 0 6px rgba(0,200,255,0.8)",display:"inline-block" }} />
                    <span className="hud-label">QUESTION {String(currentIndex+1).padStart(2,"0")} OF {String(interview.questions.length).padStart(2,"0")}</span>
                  </>
                )}
              </div>
              <p className="iv-q-text">{interview.questions[currentIndex]}</p>
            </div>

            {/* Transcript panel */}
            <div className="hud-panel iv-transcript-panel">
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
                {isListening ? (
                  <>
                    <span style={{ width:7,height:7,borderRadius:"50%",background:"var(--j-arc)",animation:"arcPulse 1s infinite",display:"inline-block",boxShadow:"0 0 8px rgba(0,200,255,0.8)" }} />
                    <span className="hud-label-arc">RECORDING INPUT</span>
                  </>
                ) : (
                  <span className="hud-label">CANDIDATE RESPONSE</span>
                )}
              </div>
              {liveText
                ? <p className="iv-transcript-text">
                    {liveText}
                    {isListening && <span className="iv-cursor" />}
                  </p>
                : <p className="iv-placeholder">
                    {phase==="listening"
                      ? (isListening?"TRANSMITTING...":"ACTIVATE MICROPHONE TO BEGIN RESPONSE")
                      : "STANDBY — AWAITING QUESTION COMPLETION"}
                  </p>
              }
            </div>

            {/* Controls */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:20,padding:"16px 0" }}>
              <div style={{ position:"relative" }}>
                {isListening && (
                  <div style={{ position:"absolute",inset:-16,borderRadius:"50%",border:"1px solid rgba(0,200,255,0.2)",animation:"ping 2s ease-in-out infinite" }} />
                )}
                <button
                  className={`iv-mic-btn ${isListening?"active":""} ${isSpeaking?"speaking":""}`}
                  disabled={phase==="speaking"||isSpeaking}
                  onClick={()=>isListening?recRef.current?.stop():startListening()}
                >
                  <ArcReactor size="md" animate={isListening} />
                  <span className="iv-mic-label">{isListening?"CLICK TO STOP":"ACTIVATE MIC"}</span>
                </button>
              </div>

              {!isListening && phase==="listening" && (
                <button className="btn-arc" style={{ fontSize:13,padding:"12px 36px",letterSpacing:2 }} onClick={handleSubmit}>
                  {liveText?"SUBMIT RESPONSE →":"SKIP QUESTION →"}
                </button>
              )}
            </div>

            {pageError && (
              <div className="iv-error">
                <span className="hud-label-arc">⚠ SYSTEM ALERT</span>
                <p>{pageError}</p>
              </div>
            )}
          </div>
        )}

        {/* COMPLETE */}
        {phase==="complete" && (
          <div className="iv-center animate-fadeInUp">
            <ArcReactor size="xl" animate={isEvaluating} />
            <h2 className="iv-intro-h" style={{ letterSpacing:4 }}>
              {isEvaluating?"ANALYSING DATA...":"ANALYSIS COMPLETE"}
            </h2>
            <p className="iv-intro-sub">
              {isEvaluating
                ? "Processing performance across 5 evaluation vectors. Estimated time: 15–30 seconds."
                : "Redirecting to performance report..."}
            </p>
            {isEvaluating && (
              <div style={{ display:"flex",gap:8,marginTop:8 }}>
                {[0,1,2].map((i)=>(
                  <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"var(--j-arc)",animation:`bounce 0.6s ease-in-out infinite alternate`,animationDelay:`${i*.15}s`,boxShadow:"0 0 8px rgba(0,200,255,0.6)" }} />
                ))}
              </div>
            )}
            {pageError && <p style={{ color:"rgba(0,200,255,0.6)",fontFamily:"JetBrains Mono,monospace",fontSize:12,marginTop:14,letterSpacing:1 }}>{pageError}</p>}
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-9px)}}
        .iv-wrap {
          width:100%; max-width:760px; margin:0 auto;
          padding:40px 24px 60px; flex:1; display:flex; flex-direction:column;
        }
        .iv-topbar {
          display:flex; justify-content:space-between; align-items:flex-start;
          margin-bottom:32px; padding-bottom:20px;
          border-bottom:1px solid var(--j-border);
          gap:16px;
        }
        .iv-role {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:22px; color:#E8F4FF; letter-spacing:3px;
        }
        .iv-center {
          flex:1; display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          text-align:center; gap:16px; padding:20px 0;
        }
        .iv-intro-h {
          font-family:"Exo 2",sans-serif; font-weight:800;
          font-size:clamp(24px,4vw,36px); color:#E8F4FF; letter-spacing:5px;
        }
        .iv-intro-sub {
          color:var(--j-muted); font-size:15px; line-height:1.8;
          max-width:480px; letter-spacing:0.2px;
        }
        .iv-body { flex:1; display:flex; flex-direction:column; gap:16px; }
        .iv-q-panel { padding:24px; position:relative; overflow:hidden; }
        .iv-q-text {
          font-family:"Exo 2",sans-serif; font-weight:600;
          font-size:clamp(16px,2.5vw,21px); color:#E8F4FF; line-height:1.6;
          letter-spacing:0.3px;
        }
        .iv-transcript-panel {
          flex:1; min-height:120px;
          background:var(--j-bg); border-radius:3px; padding:18px;
        }
        .iv-transcript-text { color:#E8F4FF; font-size:15px; line-height:1.8; }
        .iv-cursor {
          display:inline-block; width:2px; height:16px;
          background:var(--j-arc); margin-left:2px;
          animation:blink 0.7s infinite; vertical-align:middle;
          box-shadow:0 0 6px rgba(0,200,255,0.8);
        }
        .iv-placeholder {
          font-family:"JetBrains Mono",monospace; font-size:11px;
          color:rgba(74,122,155,0.4); letter-spacing:2px; line-height:1.8;
        }
        .iv-mic-btn {
          display:flex; flex-direction:column; align-items:center; gap:12px;
          background:none; border:none; cursor:pointer;
          padding:8px; transition:transform 0.2s;
        }
        .iv-mic-btn:hover:not(:disabled) { transform:scale(1.04); }
        .iv-mic-btn.speaking { opacity:0.4; cursor:not-allowed; }
        .iv-mic-btn:disabled { opacity:0.3; cursor:not-allowed; }
        .iv-mic-label {
          font-family:"JetBrains Mono",monospace; font-size:9px;
          letter-spacing:3px; color:var(--j-muted); text-transform:uppercase;
        }
        .iv-mic-btn.active .iv-mic-label { color:var(--j-arc); }
        .iv-error {
          padding:12px 16px; display:flex; flex-direction:column; gap:6px;
          background:rgba(0,200,255,0.04);
          border:1px solid rgba(0,200,255,0.15);
          border-radius:3px;
        }
        .iv-error p { color:var(--j-muted); font-size:13px; }
      `}</style>
    </div>
  );
}