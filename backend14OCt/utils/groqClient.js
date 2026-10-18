import axios from "axios";

export const isGroqConfigured = () => Boolean(process.env.GROQ_API_KEY);

export const groqChat = async ({
  system,
  messages = [],
  maxTokens = 500,
  temperature = 0.7,
  json = false,
}) => {
  if (!process.env.GROQ_API_KEY) {
    const err = new Error("GROQ_API_KEY missing in backend .env");
    err.code = "NO_GROQ_KEY";
    throw err;
  }
  const modelsToTry = [
    process.env.GROQ_MODEL,
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "llama3-8b-8192",
    "gemma2-9b-it",
  ].filter(Boolean);

  let lastError;
  for (const model of [...new Set(modelsToTry)]) {
    try {
      const body = {
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: maxTokens,
        temperature,
      };
      if (json) body.response_format = { type: "json_object" };
      const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", body, {
        headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
        timeout: 60000,
      });
      return response.data?.choices?.[0]?.message?.content || "";
    } catch (err) {
      lastError = err;
      if (err.response?.status !== 404) throw err;
    }
  }
  throw lastError;
};
