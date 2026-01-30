require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- ENHANCED LOCAL RESPONSES ---------------- */

const ENHANCED_RESPONSES = {
  greetings: [
    "Hello! I'm Gemini AI, your intelligent assistant. How can I help you today? 😊",
    "Hi there! Ready to explore ideas and answer your questions.",
    "Welcome! I'm here to help. Let's begin!",
  ],
  questions: [
    "That's a great question. Let me explain clearly...",
    "Nice question — here's the breakdown...",
    "Good thinking. Here's what you should know...",
  ],
  coding: [
    "Let's look at a clean coding solution...",
    "Here’s a clear and efficient approach...",
    "I'll explain this step by step...",
  ],
  creative: [
    "Love this idea! Here's something creative...",
    "Let's get imaginative...",
    "Here's a creative take on that...",
  ],
  general: [
    "Here’s a clear explanation...",
    "Let me explain that simply...",
    "Here’s what you need to know...",
  ],
};

/* ---------------- MIDDLEWARE ---------------- */

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json({ limit: "10mb" }));

/* ---------------- HEALTH ---------------- */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Gemini Chat API",
    timestamp: new Date().toISOString(),
  });
});

/* ---------------- SUGGESTIONS ---------------- */

app.get("/api/suggestions", (req, res) => {
  const suggestions = [
    "Explain quantum computing like I'm 10",
    "How do neural networks learn?",
    "Write a short poem about AI",
    "Explain relativity simply",
  ];

  res.json({
    success: true,
    suggestions: suggestions.sort(() => 0.5 - Math.random()).slice(0, 4),
  });
});

/* ---------------- CHAT ---------------- */

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const API_KEY = process.env.GEMINI_API_KEY;

    /* ----------- GEMINI MODE ----------- */
    if (API_KEY && API_KEY.length > 20) {
      const formattedConversation = conversation.map((msg) => ({
        role: msg.role || "user",
        parts: [{ text: msg.content || "" }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              ...formattedConversation,
              { role: "user", parts: [{ text: message }] },
            ],
            generationConfig: {
              temperature: 0.7,
              topP: 0.95,
              maxOutputTokens: 1000,
            },
          }),
        },
      );

      const data = await response.json();

if (!response.ok) {
  console.error("Gemini error:", JSON.stringify(data, null, 2));

  return res.status(502).json({
    success: false,
    source: "gemini",
    error: data.error?.message || JSON.stringify(data),
  });
}


      return res.json({
        success: true,
        source: "gemini",
        response: data.candidates[0].content.parts[0].text,
        timestamp: new Date().toISOString(),
      });
    }

    /* ----------- LOCAL FALLBACK ----------- */

    const lower = message.toLowerCase();
    let category = "general";

    if (/(hi|hello|hey)/.test(lower)) category = "greetings";
    else if (/(code|python|javascript)/.test(lower)) category = "coding";
    else if (/(story|poem|write)/.test(lower)) category = "creative";
    else if (lower.includes("?")) category = "questions";

    const base =
      ENHANCED_RESPONSES[category][
        Math.floor(Math.random() * ENHANCED_RESPONSES[category].length)
      ];

    res.json({
      success: true,
      source: "local",
      response: base,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/* ---------------- REGENERATE ---------------- */

app.post("/api/regenerate", (req, res) => {
  const { lastMessage } = req.body;

  res.json({
    success: true,
    response: `Let me rephrase that:\n\n${lastMessage}`,
    timestamp: new Date().toISOString(),
  });
});

/* ---------------- START ---------------- */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `⚙️ Mode: ${process.env.GEMINI_API_KEY ? "Gemini API Enabled" : "Local Mode"}`,
  );
});
