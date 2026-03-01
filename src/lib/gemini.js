// src/lib/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const getClient = () => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key || key.includes("your_") || key === "undefined") {
    throw new Error("VITE_GEMINI_API_KEY is missing in your .env file. Get a free key at https://aistudio.google.com/apikey");
  }
  return new GoogleGenerativeAI(key);
};

// ── Generate Questions ────────────────────────────────────────────────────────
export async function generateQuestions({ role, level, techstack, type, amount }) {
  const genAI = getClient();
  // Use gemini-1.5-flash — works with all recent SDK versions
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an expert technical interviewer. Generate exactly ${amount} interview questions.

Job Role: ${role}
Experience Level: ${level}
Tech Stack: ${techstack.join(", ")}
Question Type: ${type}

RULES:
- Return ONLY a valid JSON array of strings, nothing else
- No markdown, no backticks, no explanation before or after
- No special characters like /, *, #, @
- Questions must be clear and suitable for reading aloud
- For Senior level, include architecture and system design

Example format: ["Question one", "Question two", "Question three"]

Generate ${amount} questions now:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);
    if (!Array.isArray(questions)) throw new Error("Not an array");
    return questions.slice(0, amount);
  } catch (error) {
    console.error("Question generation error:", error);
    // Fallback questions so the interview can still proceed
    return Array.from({ length: amount }, (_, i) => [
      `Tell me about your experience with ${techstack[0] || role}.`,
      `What challenges have you faced as a ${level} ${role}?`,
      `How do you approach debugging a complex problem?`,
      `Describe a project you're most proud of.`,
      `How do you stay updated with new technologies in your field?`,
      `What does good code quality mean to you?`,
      `How do you handle tight deadlines and pressure?`,
      `Describe your experience working in a team environment.`,
      `What are your strengths and areas for improvement?`,
      `Where do you see yourself in the next 2 years?`,
    ][i % 10]);
  }
}

// ── Evaluate Interview ────────────────────────────────────────────────────────
export async function evaluateInterview({ transcript, role, level, techstack }) {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  if (!transcript || transcript.length === 0) {
    throw new Error("No transcript to evaluate");
  }

  const formattedTranscript = transcript
    .map((e) => `${e.role.toUpperCase()}: ${e.content}`)
    .join("\n\n");

  const prompt = `You are a strict professional interviewer evaluating a mock interview.

Role: ${role} | Level: ${level} | Stack: ${techstack.join(", ")}

TRANSCRIPT:
${formattedTranscript}

Evaluate strictly. Return ONLY this exact JSON structure with no other text:
{
  "totalScore": <0-100>,
  "categoryScores": [
    {"name":"Communication Skills","score":<0-100>,"comment":"<2-3 sentences>"},
    {"name":"Technical Knowledge","score":<0-100>,"comment":"<2-3 sentences>"},
    {"name":"Problem Solving","score":<0-100>,"comment":"<2-3 sentences>"},
    {"name":"Cultural & Role Fit","score":<0-100>,"comment":"<2-3 sentences>"},
    {"name":"Confidence & Clarity","score":<0-100>,"comment":"<2-3 sentences>"}
  ],
  "strengths": ["<strength 1>","<strength 2>","<strength 3>"],
  "areasForImprovement": ["<area 1>","<area 2>","<area 3>"],
  "finalAssessment": "<3-4 sentences overall summary and hiring recommendation>"
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json|```/g, "").trim();
    const feedback = JSON.parse(cleaned);
    return feedback;
  } catch (error) {
    console.error("Evaluation error:", error);
    throw error; // Let caller handle — shows error on feedback page
  }
}