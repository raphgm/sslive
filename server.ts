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
    // Serve production bundle
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Agora Live Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start severe:", error);
});
