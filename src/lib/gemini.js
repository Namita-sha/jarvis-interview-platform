// src/lib/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key.includes("your_") || key === "undefined") {
    throw new Error("VITE_GEMINI_API_KEY is missing. Get a free key at https://aistudio.google.com/apikey");
  }
  return new GoogleGenerativeAI(key);
};

// ── Generate Questions ────────────────────────────────────────────────────────
export async function generateQuestions({ role, level, techstack, type, amount }) {
  const genAI = getClient();
  // ✅ Updated to gemini-2.0-flash (1.5-flash-latest is deprecated)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are an expert technical interviewer. Generate exactly ${amount} interview questions.

Job Role: ${role}
Experience Level: ${level}
Tech Stack: ${techstack.join(", ")}
Question Type: ${type}

RULES:
- Return ONLY a valid JSON array of strings, nothing else
- No markdown, no backticks, no explanation before or after
- Questions must be clear and suitable for reading aloud
- For Senior level, include architecture and system design questions

Example format: ["Question one here", "Question two here"]

Generate ${amount} questions now:`;

  try {
    const result   = await model.generateContent(prompt);
    const text     = result.response.text().trim();
    const cleaned  = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);
    if (!Array.isArray(questions)) throw new Error("Not an array");
    return questions.slice(0, amount);
  } catch (error) {
    console.error("Question generation error:", error);
    return Array.from({ length: amount }, (_, i) => [
      `Tell me about your experience with ${techstack[0] || role}.`,
      `What challenges have you faced as a ${level} ${role}?`,
      `How do you approach debugging a complex problem?`,
      `Describe a recent project you are proud of and your specific contributions.`,
      `How do you stay current with new technologies in your field?`,
      `What does clean, maintainable code mean to you?`,
      `How do you handle disagreements with teammates about technical decisions?`,
      `Walk me through how you would design a simple REST API.`,
      `What are your biggest technical strengths?`,
      `Where do you see yourself growing in the next two years?`,
    ][i % 10]);
  }
}

// ── Evaluate Interview ────────────────────────────────────────────────────────
export async function evaluateInterview({ transcript, role, level, techstack }) {
  const genAI = getClient();
  // ✅ Updated to gemini-2.0-flash (1.5-flash-latest is deprecated)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  if (!transcript || transcript.length === 0) {
    throw new Error("No transcript to evaluate");
  }

  const candidateAnswers = transcript
    .filter((e) => e.role === "candidate")
    .map((e, i) => `ANSWER ${i + 1}: ${e.content}`)
    .join("\n\n");

  const interviewerQuestions = transcript
    .filter((e) => e.role === "interviewer")
    .map((e, i) => `QUESTION ${i + 1}: ${e.content}`)
    .join("\n\n");

  const hasRealAnswers = transcript
    .filter((e) => e.role === "candidate")
    .some((e) => e.content && e.content !== "[NO RESPONSE CAPTURED]" && e.content.length > 10);

  if (!hasRealAnswers) {
    return {
      totalScore: 5,
      categoryScores: [
        { name: "Communication Skills", score: 5,  comment: "No verbal responses were captured during the session. The microphone may not have been active, or answers were not submitted. Cannot evaluate communication without candidate input." },
        { name: "Technical Knowledge",  score: 5,  comment: "No technical responses were provided. To receive a score, please ensure your microphone is working and you submit answers to each question." },
        { name: "Problem Solving",      score: 5,  comment: "No problem-solving demonstrations were captured. Please retry the session with an active microphone." },
        { name: "Cultural & Role Fit",  score: 5,  comment: "Unable to assess role fit without candidate responses. Please retry the session." },
        { name: "Confidence & Clarity", score: 5,  comment: "No speech input was detected. Ensure microphone permissions are granted in your browser and retry." },
      ],
      strengths: [
        "You attempted the interview session — that takes initiative",
        "The session configuration was correctly set up",
        "Ready to retry with microphone active",
      ],
      areasForImprovement: [
        "Enable microphone access: go to browser settings and allow microphone for this site",
        "Speak clearly into your microphone after clicking the mic button — wait for the recording indicator",
        "Submit each answer before moving to the next question using the Submit button",
      ],
      finalAssessment: "No candidate responses were captured in this session. This is almost always a microphone issue. Please check that your browser has microphone permission enabled, use Google Chrome for best compatibility, and retry the interview. Your score will reflect your actual answers once responses are captured.",
    };
  }

  const prompt = `You are a senior technical interviewer at a top tech company. Evaluate this interview transcript fairly but critically.

POSITION: ${role} (${level} level)
TECH STACK TESTED: ${techstack.join(", ")}

INTERVIEW QUESTIONS ASKED:
${interviewerQuestions}

CANDIDATE RESPONSES:
${candidateAnswers}

CRITICAL EVALUATION RULES:
1. Read the actual answers carefully. Base scores ONLY on what the candidate actually said.
2. Score each category from 0-100. Do NOT default to 0 if an answer was given.
3. A partial answer showing some knowledge should score 30-50.
4. A decent answer with relevant points should score 55-75.
5. A strong, detailed, correct answer should score 76-90.
6. An exceptional answer showing deep expertise should score 91-100.
7. If the candidate gave no answer or said "[NO RESPONSE CAPTURED]", score that question at 5-10 only.
8. The totalScore must be the weighted average of categoryScores.
9. Comments must be 2-4 sentences referencing what the candidate ACTUALLY said.
10. areasForImprovement must be SPECIFIC to what was said, not generic advice.

Return ONLY this exact JSON — no markdown, no extra text, no backticks:
{
  "totalScore": <weighted average of the 5 category scores as integer>,
  "categoryScores": [
    {"name":"Communication Skills","score":<0-100>,"comment":"<2-4 sentences about how clearly and confidently they communicated>"},
    {"name":"Technical Knowledge","score":<0-100>,"comment":"<2-4 sentences assessing technical accuracy and depth>"},
    {"name":"Problem Solving","score":<0-100>,"comment":"<2-4 sentences on their approach to problems>"},
    {"name":"Cultural & Role Fit","score":<0-100>,"comment":"<2-4 sentences on enthusiasm, professionalism, and role fit>"},
    {"name":"Confidence & Clarity","score":<0-100>,"comment":"<2-4 sentences on how confidently and clearly they expressed themselves>"}
  ],
  "strengths": [
    "<specific strength 1>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "areasForImprovement": [
    "<specific gap with concrete suggestion>",
    "<specific area 2 with concrete suggestion>",
    "<specific area 3 with concrete suggestion>"
  ],
  "finalAssessment": "<4-5 sentences: overall impression, key highlights, key gaps, and a clear hiring recommendation>"
}`;

  try {
    const result  = await model.generateContent(prompt);
    const text    = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, "").trim();

    const jsonStart = cleaned.indexOf("{");
    const jsonEnd   = cleaned.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found in response");

    const jsonStr  = cleaned.slice(jsonStart, jsonEnd + 1);
    const feedback = JSON.parse(jsonStr);

    if (typeof feedback.totalScore !== "number") throw new Error("Invalid totalScore");
    if (!Array.isArray(feedback.categoryScores))  throw new Error("Invalid categoryScores");

    // Recalculate totalScore as true average
    const avg = Math.round(
      feedback.categoryScores.reduce((s, c) => s + (c.score || 0), 0) / feedback.categoryScores.length
    );
    feedback.totalScore = avg;

    return feedback;
  } catch (error) {
    console.error("Evaluation error:", error);
    throw error; // Re-throw so caller knows it failed
  }
}