// Client-side Groq Llama caller for SSLive.
//
// Why client-side? SSLive is deployed to Azure Static Web Apps which does NOT run
// the Express server.ts file — only /api/* Azure Functions. So any fetch to
// /api/quizzes/generate 404s in production. By calling Groq directly from the
// browser with the public Groq key, the AI features Just Work without a backend.
//
// Configure via .env:  VITE_GROQ_API_KEY=gsk_...

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const FAST_MODEL = "llama-3.1-8b-instant";
const SMART_MODEL = "llama-3.3-70b-versatile";

const getKey = (): string => {
  const k =
    (import.meta as any).env?.VITE_GROQ_API_KEY ||
    (import.meta as any).env?.VITE_API_KEY ||
    "";
  return String(k || "").trim();
};

export const isGroqConfigured = (): boolean => !!getKey();

interface GroqOpts {
  model?: string;
  systemPrompt?: string;
  jsonMode?: boolean;
  retries?: number;
  temperature?: number;
}

async function groqChat(userPrompt: string, opts: GroqOpts = {}): Promise<string> {
  const key = getKey();
  if (!key) {
    throw new Error(
      "AI is not configured. Set VITE_GROQ_API_KEY in your environment (get a free key at https://console.groq.com).",
    );
  }

  const body = {
    model: opts.model || FAST_MODEL,
    messages: [
      ...(opts.systemPrompt ? [{ role: "system", content: opts.systemPrompt }] : []),
      { role: "user", content: userPrompt },
    ],
    temperature: opts.temperature ?? 0.7,
    ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
  };

  let attempt = 0;
  const maxAttempts = (opts.retries ?? 2) + 1;
  let lastErr: unknown = null;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      const resp = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        let msg = errText;
        try {
          const parsed = JSON.parse(errText);
          msg = parsed?.error?.message || parsed?.message || errText;
        } catch {}
        throw new Error(msg || `Groq HTTP ${resp.status}`);
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === "string" && content.length > 0) return content;
      throw new Error("Groq returned an empty response.");
    } catch (e) {
      lastErr = e;
      if (attempt >= maxAttempts) break;
      // Exponential backoff: 400ms, 800ms
      await new Promise(r => setTimeout(r, 400 * attempt));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Groq request failed.");
}

// ─── Quiz generation ────────────────────────────────────────────────────────
export interface GeneratedQuestion {
  text: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  options: string[];
  correctAnswer: string;
  correctOptionIndex: number;
  explanation: string;
}

export interface GeneratedQuizPayload {
  title: string;
  questions: GeneratedQuestion[];
}

export async function generateQuizWithGroq(opts: {
  topic: string;
  gradeLevel?: string;
  questionCount?: number;
  quizStyle?: string;
  enabledTypes?: { multipleChoice?: boolean; trueFalse?: boolean; shortAnswer?: boolean };
  companionText?: string;
}): Promise<GeneratedQuizPayload> {
  const count = Math.max(1, Math.min(50, opts.questionCount || 5));
  const grade = opts.gradeLevel || "High School";

  const types: string[] = [];
  if (opts.enabledTypes?.multipleChoice !== false) types.push("multiple-choice");
  if (opts.enabledTypes?.trueFalse) types.push("true-false");
  if (opts.enabledTypes?.shortAnswer) types.push("short-answer");
  if (types.length === 0) types.push("multiple-choice");

  const companion = (opts.companionText || "").slice(0, 4000);

  const prompt = `Generate exactly ${count} highly educational classroom quiz questions on the topic: "${opts.topic.slice(0, 800)}".

Grade Level: ${grade}
Allowed question types: ${types.join(", ")}
${opts.quizStyle ? `Quiz style: ${opts.quizStyle}` : ""}
${companion ? `Companion source material (refer to this for accuracy):\n"""\n${companion}\n"""` : ""}

Return ONLY a JSON object — no commentary — matching this schema exactly:
{
  "title": "string — a short, inspiring title for the quiz",
  "questions": [
    {
      "text": "string — the question",
      "type": "multiple-choice" | "true-false" | "short-answer",
      "options": ["string", ...],
      "correctAnswer": "string — the option content or short keyword",
      "correctOptionIndex": number,
      "explanation": "string — 1–2 sentence Socratic explanation"
    }
  ]
}

Rules:
- multiple-choice MUST have EXACTLY 4 options; correctOptionIndex 0–3.
- true-false MUST have options ["True","False"]; correctOptionIndex 0 or 1.
- short-answer MUST have empty options and correctOptionIndex -1; put the keyword in correctAnswer.
- Mix difficulty across the questions.
- Be factually accurate. If the topic is speculative or future-dated, frame questions about underlying concepts, not predictions.`;

  const raw = await groqChat(prompt, {
    jsonMode: true,
    model: count > 10 || companion ? SMART_MODEL : FAST_MODEL,
    systemPrompt:
      "You are a master classroom teacher. Return ONLY valid JSON matching the user's schema. Never include explanations, markdown fences, or prose outside the JSON object.",
    retries: 2,
    temperature: 0.6,
  });

  // Strip any accidental markdown fences just in case
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned an invalid response. Please try again.");
  }

  const title = String(parsed.title || "AI Generated Quiz");
  const rawQs: any[] = Array.isArray(parsed.questions) ? parsed.questions : [];

  const questions: GeneratedQuestion[] = rawQs
    .map(q => {
      const type: GeneratedQuestion["type"] =
        q.type === "true-false" ? "true-false" : q.type === "short-answer" ? "short-answer" : "multiple-choice";
      let options: string[] = Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : [];
      let correctOptionIndex = typeof q.correctOptionIndex === "number" ? q.correctOptionIndex : -1;
      let correctAnswer = String(q.correctAnswer || "");

      if (type === "true-false") {
        options = ["True", "False"];
        if (correctOptionIndex !== 0 && correctOptionIndex !== 1) {
          correctOptionIndex = correctAnswer.toLowerCase().startsWith("t") ? 0 : 1;
        }
        correctAnswer = options[correctOptionIndex];
      } else if (type === "short-answer") {
        options = [];
        correctOptionIndex = -1;
      } else {
        // multiple-choice — coerce to 4 options
        while (options.length < 4) options.push(`Option ${options.length + 1}`);
        if (options.length > 4) options = options.slice(0, 4);
        if (correctOptionIndex < 0 || correctOptionIndex > 3) {
          const matchIdx = options.findIndex(o => o.trim().toLowerCase() === correctAnswer.trim().toLowerCase());
          correctOptionIndex = matchIdx >= 0 ? matchIdx : 0;
        }
        correctAnswer = options[correctOptionIndex];
      }

      return {
        text: String(q.text || "").trim(),
        type,
        options,
        correctAnswer,
        correctOptionIndex,
        explanation: String(q.explanation || "").trim(),
      };
    })
    .filter(q => q.text.length > 0);

  if (questions.length === 0) {
    throw new Error("AI didn't return any usable questions. Please try a more specific topic.");
  }

  return { title, questions };
}
