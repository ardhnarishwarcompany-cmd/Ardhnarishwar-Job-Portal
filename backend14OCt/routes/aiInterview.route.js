import express from "express";
import { ollamaChat } from "../utils/ollamaClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const reply = await ollamaChat({
      system: `You are an advanced AI Interview Assistant.

Your responsibilities:
- Conduct technical interviews
- Ask interview questions one by one
- Evaluate answers
- Give improvement tips
- Support Java, MERN Stack, React, Node.js, HR and DSA interviews
- Keep responses professional and short
- Give a score out of 10 occasionally
`,
      messages: [{ role: "user", content: message }],
      maxTokens: 300,
      temperature: 0.7,
    });

    if (!reply?.trim()) {
      return res.status(500).json({
        success: false,
        message: "No reply received from AI service",
      });
    }

    res.json({ success: true, reply: reply.trim() });
  } catch (error) {
    console.error("AI Interview Error:", error.code || error.message);
    res.status(500).json({
      success: false,
      message: "AI Interview service is currently unavailable.",
    });
  }
});

export default router;