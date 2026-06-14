import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Check API Key health
app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: "ok",
    hasGeminiKey: hasKey,
    time: new Date().toISOString(),
  });
});

// Parse CV text using Gemini 3.5 Flash schema validation
app.post("/api/parse-cv", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== "string") {
      res.status(400).json({ error: "rawText parameter is required and must be a string." });
      return;
    }

    const ai = getGemini();
    const prompt = `Extract all details from the following resume text and format them strictly according to the requested JSON schema.\n\nResume Raw Text:\n${rawText}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert resume parser. Read raw copy-pasted or extracted resume text and structure it in a clean format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING, description: "Full Name of the person" },
            email: { type: Type.STRING, description: "Contact email" },
            phone: { type: Type.STRING, description: "Contact phone number" },
            summary: { type: Type.STRING, description: "Professional summary or introductory statement" },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Extracted keywords of technical or professional skills",
            },
            experience: {
              type: Type.ARRAY,
              description: "Work experience entries key milestones",
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  company: { type: Type.STRING },
                  duration: { type: Type.STRING, description: "Timeframe (e.g., Mar'26 - Present, etc.)" },
                  description: { type: Type.STRING, description: "Main achievements and duties (bullet list or summary)" },
                },
                required: ["role", "company"],
              },
            },
            education: {
              type: Type.ARRAY,
              description: "Educational degrees",
              items: {
                type: Type.OBJECT,
                properties: {
                  degree: { type: Type.STRING },
                  institution: { type: Type.STRING },
                  year: { type: Type.STRING },
                },
                required: ["degree", "institution"],
              },
            },
          },
        },
      },
    });

    const textOutput = response.text || "{}";
    try {
      res.json(JSON.parse(textOutput));
    } catch (parseError: any) {
      console.error("JSON parse failure on Gemini output. Raw text:", textOutput, parseError);
      res.status(500).json({ error: "Successfully retrieved raw CV details, but the structured JSON output is malformed. Please try submitting again." });
    }
  } catch (error: any) {
    console.error("Parse CV Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred during CV parsing." });
  }
});

// In-memory chat sessions cache
const chatSessions = new Map<string, any>();

// Chat endpoint to converse about the CV
app.post("/api/chat", async (req, res) => {
  try {
    const { message, cvText, chatId, history } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "message parameter is required." });
      return;
    }
    if (!chatId || typeof chatId !== "string") {
      res.status(400).json({ error: "chatId parameter is required." });
      return;
    }

    const ai = getGemini();
    let chat = chatSessions.get(chatId);

    if (!chat) {
      const systemInstruction = `You are "Randhir's CV AI Assistant", an advanced, friendly, and professional conversational AI.
You have full access to Randhir's CV / Resume.
Your goal is to answer any questions about Randhir Jha, his credentials, work experience, projects, skills, education, and suitability for various roles.

Here is the full text of Randhir's CV for your reference:
=== BEGIN CV TEXT ===
${cvText || "No CV loaded yet. Please ask the user to load their CV or connect to their Google Drive to look for [CV_Randhir_Jha_Mar'26]."}
=== END CV TEXT ===

Guidelines:
1. Always base your answers primarily on the CV text above. Be accurate, honest, and professional.
2. If the user asks a question not related to the CV, answer it politely but always redirect the focus back to Randhir's profile and CV context (e.g., "While I can help with general questions, I'm here to advise you on Randhir's professional backgrounds. To help you evaluate, would you like to know about his skills or experiences in...?").
3. Do not invent details or exaggerate qualifications that do not exist or cannot be inferred logically from the CV.
4. Keep the formatting neat and readable with markdown bullets where appropriate.
5. You can also analyze the candidate's fitness for a specific job description if the user provides one!`;

      const formattedHistory = Array.isArray(history)
        ? history.map((h: any) => ({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }],
          }))
        : [];

      chat = ai.chats.create({
        model: "gemini-2.0-flash",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });

      // Maintain chatSessions cache bounds
      if (chatSessions.size >= 500) {
        const oldestKey = chatSessions.keys().next().value;
        if (oldestKey) {
          chatSessions.delete(oldestKey);
        }
      }
      chatSessions.set(chatId, chat);
    }

    const response = await chat.sendMessage({ message });
    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred during the conversation." });
  }
});

// Fetch and clean GitHub projects for rooneyroynew
app.get("/api/github-projects", async (req, res) => {
  try {
    const response = await fetch("https://api.github.com/users/rooneyroynew/repos", {
      headers: {
        "User-Agent": "express-server-app",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API response error: ${response.status} ${response.statusText}`);
    }

    const repos = (await response.json()) as any[];
    if (!Array.isArray(repos)) {
      throw new Error("Invalid response format from GitHub API");
    }

    const cleanedRepos = repos.map((repo: any) => ({
      name: repo.name || "",
      description: repo.description || "",
      language: repo.language || "",
      url: repo.html_url || repo.url || "",
      updated_at: repo.updated_at || "",
    }));

    res.json(cleanedRepos);
  } catch (error: any) {
    console.error("GitHub Projects Error:", error);
    res.status(500).json({ error: error?.message || "An error occurred while fetching projects." });
  }
});

// Handle Vite in dev or static serving in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Vite server setup failed:", err);
  process.exit(1);
});
