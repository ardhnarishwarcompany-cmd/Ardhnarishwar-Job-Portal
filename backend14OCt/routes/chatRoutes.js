import express from "express";
import { optionalAuthenticateToken } from "../middleware/isAuthenticated.js";
import { handleChatMessage } from "../utils/assistantOrchestrator.js";

const router = express.Router();

const FRIENDLY_FALLBACK =
  "I am having trouble answering right now. Please try again in a moment, or ask me to find jobs, check your applications, or look up a company on the portal.";

router.post("/message", optionalAuthenticateToken, async (req, res) => {
  try {
    const { message, conversation = [] } = req.body;
    const userId = req.id || null;

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const result = await handleChatMessage(message.trim(), conversation, userId);

    if (result.needsAuth) {
      return res.status(401).json({
        success: false,
        message: result.reply,
        needsAuth: true,
        intent: result.intent,
      });
    }

    res.json({
      success: true,
      reply: result.reply,
      intent: result.intent,
      confidence: result.confidence,
      entities: result.entities,
      toolResults: result.toolResults,
    });
  } catch (error) {
    // Never leak internal error details to the user.
    console.error("[chat] request failed:", error.code || error.message);
    res.status(200).json({
      success: true,
      reply: FRIENDLY_FALLBACK,
      intent: "GENERAL_CONVERSATION",
    });
  }
});

export default router;
