import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Define __dirname and __filename in ES module safely
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Initialize AI client
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", hasGeminiKey: !!geminiApiKey });
  });

  // ─── OG image generator — renders a beautiful per-room/per-topic SVG preview ───
  // Used by the og:image / twitter:image meta tags so shared links get rich previews.
  app.get("/api/og.svg", (req, res) => {
    const room = String(req.query.room || "").toUpperCase().slice(0, 24);
    const topic = String(req.query.topic || "").slice(0, 60);
    const challenge = String(req.query.challenge || "").slice(0, 60);

    // Decide headline + sub
    let badge = "LIVE QUIZZES";
    let headline = "SSlive";
    let sub = "Live AI quizzes, debates & challenges";
    let chip = "skill.sch";
    if (challenge) {
      badge = "🚀 CHALLENGE";
      headline = challenge;
      sub = "Can you beat the leaderboard?";
    } else if (topic) {
      badge = "🎯 QUIZ ON";
      headline = topic;
      sub = "AI-generated quiz from skill.sch";
    } else if (room) {
      badge = "📡 LIVE ROOM";
      headline = `Room ${room}`;
      sub = "Tap to join the live session";
    }

    // Escape XML special chars
    const esc = (s: string) => s.replace(/[<>&"']/g, ch => ({
      "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
    } as Record<string, string>)[ch]);

    // Truncate long headlines to ~24 chars per line for legibility
    const wrapWords = (s: string, max = 24): string[] => {
      const words = s.split(/\s+/);
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        if ((cur + " " + w).trim().length > max) { if (cur) lines.push(cur); cur = w; }
        else cur = (cur + " " + w).trim();
      }
      if (cur) lines.push(cur);
      return lines.slice(0, 3);
    };
    const headlineLines = wrapWords(headline, 22);

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="60%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.15" r="0.7">
      <stop offset="0%" stop-color="#fde68a" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#fb923c" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.4" fill="#ffffff" fill-opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Decorative pill in top-right -->
  <g transform="translate(880, 60)">
    <rect width="260" height="48" rx="24" fill="#ffffff" fill-opacity="0.15"/>
    <text x="130" y="32" font-family="Inter, sans-serif" font-size="18" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="1">${esc(chip.toUpperCase())}</text>
  </g>

  <!-- Logo cluster -->
  <g transform="translate(72, 80)">
    <circle cx="20" cy="20" r="20" fill="#fbbf24" opacity="0.9"/>
    <circle cx="44" cy="20" r="20" fill="#a855f7" opacity="0.9"/>
    <circle cx="68" cy="20" r="20" fill="#22d3ee" opacity="0.9"/>
    <text x="100" y="30" font-family="Plus Jakarta Sans, sans-serif" font-size="28" font-weight="800" fill="#fff">SSlive</text>
  </g>

  <!-- Badge -->
  <g transform="translate(72, 200)">
    <rect width="${badge.length * 14 + 36}" height="44" rx="22" fill="#fff" fill-opacity="0.18"/>
    <text x="${(badge.length * 14 + 36) / 2}" y="29" font-family="Inter, sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="2">${esc(badge)}</text>
  </g>

  <!-- Headline -->
  <g transform="translate(72, 280)">
    ${headlineLines.map((line, i) => `<text x="0" y="${i * 78}" font-family="Plus Jakarta Sans, sans-serif" font-size="68" font-weight="800" fill="#fff" letter-spacing="-1.5">${esc(line)}</text>`).join("\n    ")}
  </g>

  <!-- Subline -->
  <text x="72" y="${280 + headlineLines.length * 78 + 50}" font-family="Inter, sans-serif" font-size="26" font-weight="500" fill="#fff" fill-opacity="0.85" letter-spacing="-0.3">${esc(sub)}</text>

  <!-- Bottom URL -->
  <g transform="translate(72, 560)">
    <circle cx="8" cy="8" r="8" fill="#34d399"/>
    <text x="28" y="14" font-family="JetBrains Mono, monospace" font-size="20" font-weight="600" fill="#fff" fill-opacity="0.85">sslive.skill-sch.com</text>
  </g>

  <!-- Rocket icon bottom-right -->
  <text x="1110" y="580" font-size="80" text-anchor="end" opacity="0.85">🚀</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
    res.send(svg);
  });

  // AI Document Question Extraction Endpoint
  app.post("/api/quizzes/extract-document", async (req, res) => {
    try {
      const { textContent, limit } = req.body;

      if (!ai) {
        return res.status(500).json({
          error: "AI API Key is not configured on the server. Please add it via Settings > Secrets.",
        });
      }

      const prompt = `Extract highly educational classroom quiz questions from the following text document.
Document Text:
"""
${textContent}
"""
Max Questions: ${limit || 10}

Please output a JSON object containing the title of the quiz and an array of quiz questions extracted.
For multiple-choice questions, provide exactly 4 sensible options, and designate correctOptionIndex as the 0-based index of the correct option, and correctAnswer as the option content.
For true-false, set options to ["True", "False"], and designate the correctOptionIndex (0 for True, 1 for False).
For short-answer, options can be empty, correctOptionIndex should be -1, and correctAnswer should contain the main keyword or correct phrase.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a master educator. Read the provided text and reliably extract the core concepts perfectly mapped into a standard SSlive JSON assessment.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Inspiring title for the quiz related to the document text",
              },
              questions: {
                type: Type.ARRAY,
                description: "List of extracted quiz questions",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description: "The question statement clearly formatted",
                    },
                    type: {
                      type: Type.STRING,
                      description: "Must be 'multiple-choice', 'true-false', or 'short-answer'",
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Array of 4 options for MC, 2 options ['True', 'False'] for TF, or empty for SA",
                    },
                    correctAnswer: {
                      type: Type.STRING,
                      description: "The string text of the correct answer",
                    },
                    correctOptionIndex: {
                      type: Type.INTEGER,
                      description: "The 0-based index of correct option if MC/TF, or -1 for SA",
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "Socratic explanation of the concept and why the answer is correct",
                    },
                  },
                  required: ["text", "type", "options", "correctAnswer", "correctOptionIndex", "explanation"],
                },
              },
            },
            required: ["title", "questions"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from AI.");
      }

      const generatedQuiz = JSON.parse(responseText.trim());
      res.json(generatedQuiz);
    } catch (err: any) {
      console.error("AI Extraction Error:", err);
      res.status(500).json({ error: err.message || "Failed to extract questions with AI." });
    }
  });

  // AI Quiz Generation Endpoint
  app.post("/api/quizzes/generate", async (req, res) => {
    try {
      const { topic, gradeLevel, questionCount, quizType } = req.body;

      if (!ai) {
        return res.status(500).json({
          error: "Gemini API Key is not configured on the server. Please add it via Settings > Secrets.",
        });
      }

      const prompt = `Generate a highly educational classroom quiz about the topic: "${topic || "General Knowledge"}".
Grade Level: "${gradeLevel || "High School"}".
Number of Questions: ${questionCount || 5}.
Quiz Style: ${quizType || "Standard Classroom Quiz"}.

Please output a JSON object containing the title of the quiz and an array of quiz questions. Make sure questions are highly accurate, diverse (some multiple-choice, some true/false), and include clear, encouraging explanations.
For multiple-choice questions, provide exactly 4 sensible options, and designate correctOptionIndex as the 0-based index of the correct option, and correctAnswer as the option content.
For true-false, set options to ["True", "False"], and designate the correctOptionIndex (0 for True, 1 for False).
For short-answer, options can be empty, correctOptionIndex should be -1, and correctAnswer should contain the main keyword or correct phrase.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a classical Greek educator and master teacher. Your classroom questions are designed to challenge and inspire students. Ensure all correct answers are absolutely correct, explanations are warm, clear, and Socratic in nature, and options are well-crafted and not obviously silly.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Inspiring title for the quiz",
              },
              questions: {
                type: Type.ARRAY,
                description: "List of quiz questions",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description: "The question statement clearly formatted",
                    },
                    type: {
                      type: Type.STRING,
                      description: "Must be 'multiple-choice', 'true-false', or 'short-answer'",
                    },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Array of 4 options for MC, 2 options ['True', 'False'] for TF, or empty for SA",
                    },
                    correctAnswer: {
                      type: Type.STRING,
                      description: "The string text of the correct answer",
                    },
                    correctOptionIndex: {
                      type: Type.INTEGER,
                      description: "The 0-based index of correct option if MC/TF, or -1 for SA",
                    },
                    explanation: {
                      type: Type.STRING,
                      description: "Socratic explanation of the concept and why the answer is correct",
                    },
                  },
                  required: ["text", "type", "options", "correctAnswer", "correctOptionIndex", "explanation"],
                },
              },
            },
            required: ["title", "questions"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini.");
      }

      const generatedQuiz = JSON.parse(responseText.trim());
      res.json(generatedQuiz);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate quiz with AI." });
    }
  });

  // Inquiry AI Challenger Endpoint
  app.post("/api/inquiry/dialectic", async (req, res) => {
    try {
      const { question, studentAnswer, correctAnswer } = req.body;

      if (!ai) {
        // High fidelity fallback when API key is not present
        const fallbacks = [
          `If we accept your stance that "${studentAnswer}" holds true, what implications emerge when boundary conditions change?`,
          `How would you defend "${studentAnswer}" against Socrates’ claim that virtues must be structurally distinct from metrics?`,
          `If "${studentAnswer}" is the premise, does that mean the entire system must be optimized around it, even at the cost of collective balance?`,
          `Is there an alternative formulation where "${studentAnswer}" forms only one facet of a broader dialectic?`
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        return res.json({ prompt: randomFallback });
      }

      const prompt = `A student answered a question in our live classroom, and we want to offer a Socratic dialectic prompt that automatically challenges their understanding.
Question: "${question}"
Student's Chosen Answer: "${studentAnswer}"
Correct Answer: "${correctAnswer}"

Generate a single Socratic follow-up question directly challenging the student's premise/reasoning or asking them to defend/expand it under alternative assumptions.
Constraints: Must be max 2 sentences, sharp, highly intellectual, Socratic, and start directly without any hello/praise/greetings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are the Inquiry AI Challenger, a classical Greek dialectician. Your goal is to inspire critical thinking by posing razor-sharp Socratic questions without any fluff, praise, or lecturing.",
          temperature: 0.7,
        },
      });

      res.json({ prompt: response.text?.trim() || "What alternative premises could validate your choice here?" });
    } catch (err: any) {
      console.error("Dialectic Generation Error:", err);
      res.json({ prompt: `If we accept "${req.body.studentAnswer || 'this'}" as true, does it hold under all alternative conditions?` });
    }
  });

  // SSlive Dialogue Endpoint (AI SSlive Hints on Mistakes)
  app.post("/api/inquiry/hint", async (req, res) => {
    try {
      const { question, studentAnswer, correctAnswer } = req.body;

      if (!ai) {
        // High fidelity SSlive hint fallbacks
        const fallbacks = [
          `Consider whether the absolute nature of your answer accounts for fluid transitions, or if a more nuanced balance is required.`,
          `Recall that classical systems prioritized direct community dialogue; how does your choice reflect or conflict with that bedrock?`,
          `Look closely at the key terms inside the question — does your choice align with physical laws, or is it an artificial platform design?`,
          `Think about what happens to other stakeholders if we optimize purely for the metric mentioned in your answer.`
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        return res.json({ hint: randomFallback });
      }

      const prompt = `A student made a mistake in our classroom on a question. Instead of telling them the correct answer directly, we want to provide an SSlive hint that gently guides them to realize their mistake on their own.
Question: "${question}"
Student's Incorrect Answer: "${studentAnswer}"
Correct Answer: "${correctAnswer}"

Generate a short SSlive hint that encourages them to rethink their logic.
Constraints: Keep it under 2 sentences, encouraging but intellectually rigorous. Do NOT reveal the correct answer. Do not use greeting words or direct corrections.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a gentle yet brilliant SSlive tutor practicing maieutics — the art of helping someone give birth to truth. Never give the answer directly, always guide with soft SSlive hints and subtle questions.",
          temperature: 0.7,
        },
      });

      res.json({ hint: response.text?.trim() || "Consider the core definition of the concept again—how might it differ from your choice?" });
    } catch (err: any) {
      console.error("Hint Generation Error:", err);
      res.json({ hint: "Consider examining the direct premise of the question and look for subtle distinctions in the options." });
    }
  });

  // AI debate catalyst endpoint
  app.post("/api/debate/catalyst", async (req, res) => {
    try {
      const { prompt: topicPrompt, arguments: studentArgs } = req.body;
      const argsList = (studentArgs || []).map((a: any) => `"- ${a.author}: ${a.content}"`).join("\n");

      if (!ai) {
        const fallbacks = [
          "Catalyst Challenge: If digital networks are structural enablers, does human intent even matter? When algorithms reward reaction over reflection, who controls our moral agency?",
          "Catalyst Challenge: Consider how decentralized groups self-govern. Without a clear architecture, does human morality naturally optimize, or does it collapse into tribal echo chambers?",
          "Catalyst Challenge: What if we remove metrics entirely? If a system has no tracking, do we behave more ethically, or does the lack of visibility erode responsibility?"
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        return res.json({ catalyst: randomFallback });
      }

      const promptMsg = `We are conducting a live classroom debate.
Topic: "${topicPrompt}"
Recent Student Arguments:
${argsList || "No arguments recorded yet."}

Generate a single "AI Debate Catalyst" statement or cognitive disruptor. It should present a highly academic, razor-sharp critique or edge-case to challenge the ongoing assumptions of BOTH sides and ignite further critical thinking.
Constraints: Must be max 2-3 sentences, sharp, Socratic inside, starting directly without any wrapper words.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptMsg,
        config: {
          systemInstruction: "You are the AI Debate Facilitator, a legendary classical dialectician. Your goal is to keep classroom debates intellectually fiery and deep by injecting razor-sharp cognitive disruptors.",
          temperature: 0.8,
        }
      });

      res.json({ catalyst: response.text?.trim() || "Is there an underlying premise on both sides that we have completely failed to question?" });
    } catch (err: any) {
      console.error("Debate Catalyst Error:", err);
      res.json({ catalyst: "What if the entire framework of this discussion is flawed? If we remove the technology, does the moral issue still exist?" });
    }
  });

  // Paystack Initialize Endpoint
  app.post("/api/paystack/initialize", async (req, res) => {
    try {
      const { email, locationData } = req.body;
      const secretKey = process.env.PAYSTACK_SECRET_KEY;
      
      const callbackUrl = req.headers.referer ? new URL(req.headers.referer).origin + "?payment_success=true" : req.headers.origin + "?payment_success=true";

      if (!secretKey || secretKey === "") {
        // Mock simulation mode when no API key is provided
        console.log("No PAYSTACK_SECRET_KEY found. Running in simulation mode.");
        return res.json({ 
          data: { 
            authorization_url: callbackUrl 
          } 
        });
      }

      let currency = 'USD';
      let amount = 1000; // $10.00
      
      if (locationData && locationData.country_code === 'NG') {
        currency = 'NGN';
        amount = 500000; // 5000 Naira in kobo
      } else {
        currency = 'USD';
        amount = 1000; // 10 dollars in cents
      }

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email || "teacher@sslive.edu",
          amount: amount,
          currency: currency,
          callback_url: callbackUrl
        })
      });

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Paystack Init Error:", err);
      res.status(500).json({ error: "Failed to initialize payment." });
    }
  });

  // Serve static files in development & production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production bundle with dynamic OG tag injection for shared URLs
    const distPath = path.join(process.cwd(), 'dist');
    const fs = await import('fs');
    const indexPath = path.join(distPath, 'index.html');
    let baseHtml = "";
    try { baseHtml = fs.readFileSync(indexPath, "utf-8"); } catch {}

    app.use(express.static(distPath, { index: false }));
    app.get('*', (req, res) => {
      if (!baseHtml) return res.sendFile(indexPath);

      // Inspect query params for dynamic OG content
      const room = String(req.query.room || req.query.r || "").toUpperCase().slice(0, 24);
      const topic = String(req.query.topic || "").slice(0, 80);
      const challenge = String(req.query.challenge || "").slice(0, 80);

      // Pick title + description based on what kind of link this is
      let title = "SSlive — Live AI-powered quizzes for any classroom";
      let desc = "Real-time quizzes, debates, and challenges — powered by skill.sch.";
      let imgQuery = "";
      if (challenge) {
        title = `🚀 Challenge: ${challenge} · SSlive`;
        desc = `Can you beat the leaderboard? Join the live challenge on SSlive.`;
        imgQuery = `?challenge=${encodeURIComponent(challenge)}`;
      } else if (topic) {
        title = `🎯 Quiz on ${topic} · SSlive`;
        desc = `AI-generated live quiz on "${topic}" from skill.sch.`;
        imgQuery = `?topic=${encodeURIComponent(topic)}`;
      } else if (room) {
        title = `📡 Join Room ${room} · SSlive`;
        desc = `Tap to join the live session on SSlive — powered by skill.sch.`;
        imgQuery = `?room=${encodeURIComponent(room)}`;
      }

      const escape = (s: string) => s.replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      } as Record<string, string>)[ch]);

      const html = baseHtml
        .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
        .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(desc)}$2`)
        .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
        .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escape(desc)}$2`)
        .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escape(title)}$2`)
        .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escape(desc)}$2`)
        .replace(/(content="https:\/\/sslive\.skill-sch\.com\/api\/og\.svg)("")/g, `$1${imgQuery}$2`)
        .replace(/(content="https:\/\/sslive\.skill-sch\.com\/api\/og\.svg)(")/g, `$1${imgQuery}$2`);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Agora Live Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start severe:", error);
});
