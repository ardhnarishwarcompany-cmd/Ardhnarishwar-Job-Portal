import axios from "axios";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
// Was 90000ms. On production, where Ollama usually isn't reachable at all,
// a 90s wait (x2 per message - once for intent classification, once for the
// reply) can blow past the server/proxy timeout before Groq ever gets a
// chance to answer. Fail fast instead; local dev can override via env if a
// slower local machine genuinely needs more time.
const DEFAULT_TIMEOUT = Number(process.env.OLLAMA_TIMEOUT_MS) || 6000;
const NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 4096;
const KEEP_ALIVE = process.env.OLLAMA_KEEP_ALIVE || "10m";

// Circuit breaker: once an Ollama call fails, stop trying it for a cooldown
// window and go straight to Groq. Without this, every single chat message
// pays the full connection/timeout cost twice even when Ollama is known to
// be down (e.g. always, on production).
const UNAVAILABLE_TTL_MS = Number(process.env.OLLAMA_UNAVAILABLE_TTL_MS) || 120000; // 2 min
let unavailableSince = 0;

// Manual override: set OLLAMA_DISABLED=true (e.g. in your local .env) to
// always skip straight to Groq. Useful when Ollama is technically reachable
// but too slow on your hardware (a 3B/1.5B model on CPU can take tens of
// seconds per reply) - this keeps local testing fast and consistent with
// how production behaves (Ollama unreachable there, Groq-only).
const isManuallyDisabled = () => String(process.env.OLLAMA_DISABLED || "").toLowerCase() === "true";

const isCoolingDown = () => isManuallyDisabled() || (unavailableSince && Date.now() - unavailableSince < UNAVAILABLE_TTL_MS);
const markUnavailable = () => {
  unavailableSince = Date.now();
};
const markAvailable = () => {
  unavailableSince = 0;
};

const skippedError = () => {
  const err = new Error("Ollama recently unreachable; skipping retry until cooldown expires.");
  err.code = "OLLAMA_SKIPPED_COOLDOWN";
  return err;
};

export const OLLAMA_MODEL_ID = OLLAMA_MODEL;

export const isOllamaConfigured = () => true;

const buildOptions = ({ maxTokens, temperature, numCtx }) => ({
  num_predict: maxTokens,
  temperature,
  num_ctx: numCtx || NUM_CTX,
  top_p: 0.9,
  repeat_penalty: 1.05,
});

export const ollamaChat = async ({
  system,
  messages = [],
  maxTokens = 500,
  temperature = 0.7,
  json = false,
  stream = false,
  numCtx,
}) => {
  if (isCoolingDown()) throw skippedError();

  const body = {
    model: OLLAMA_MODEL,
    messages: [{ role: "system", content: system }, ...messages],
    stream,
    keep_alive: KEEP_ALIVE,
    options: buildOptions({ maxTokens, temperature, numCtx }),
  };

  if (json) {
    body.format = "json";
  }

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/chat`,
      body,
      {
        headers: { "Content-Type": "application/json" },
        timeout: DEFAULT_TIMEOUT,
      }
    );

    markAvailable();

    if (stream) {
      return response.data;
    }

    return response.data?.message?.content || "";
  } catch (error) {
    markUnavailable();
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      const err = new Error("Ollama server is not running or unreachable. Please start Ollama with 'ollama serve'.");
      err.code = "OLLAMA_CONNECTION_ERROR";
      throw err;
    }
    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      const err = new Error("Ollama request timed out. The model may be taking too long to respond.");
      err.code = "OLLAMA_TIMEOUT";
      throw err;
    }
    if (error.response?.status === 404) {
      const err = new Error(`Ollama model '${OLLAMA_MODEL}' not found. Please run 'ollama pull ${OLLAMA_MODEL}'.`);
      err.code = "OLLAMA_MODEL_NOT_FOUND";
      throw err;
    }
    const err = new Error(`Ollama error: ${error.response?.data?.error || error.message}`);
    err.code = "OLLAMA_ERROR";
    throw err;
  }
};

export const ollamaGenerate = async ({
  system,
  prompt,
  maxTokens = 500,
  temperature = 0.7,
  json = false,
  numCtx,
}) => {
  if (isCoolingDown()) throw skippedError();

  const body = {
    model: OLLAMA_MODEL,
    system,
    prompt,
    stream: false,
    keep_alive: KEEP_ALIVE,
    options: buildOptions({ maxTokens, temperature, numCtx }),
  };

  if (json) {
    body.format = "json";
  }

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      body,
      {
        headers: { "Content-Type": "application/json" },
        timeout: DEFAULT_TIMEOUT,
      }
    );

    markAvailable();

    return response.data?.response || "";
  } catch (error) {
    markUnavailable();
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      const err = new Error("Ollama server is not running or unreachable. Please start Ollama with 'ollama serve'.");
      err.code = "OLLAMA_CONNECTION_ERROR";
      throw err;
    }
    if (error.code === "ETIMEDOUT" || error.code === "ECONNABORTED") {
      const err = new Error("Ollama request timed out. The model may be taking too long to respond.");
      err.code = "OLLAMA_TIMEOUT";
      throw err;
    }
    if (error.response?.status === 404) {
      const err = new Error(`Ollama model '${OLLAMA_MODEL}' not found. Please run 'ollama pull ${OLLAMA_MODEL}'.`);
      err.code = "OLLAMA_MODEL_NOT_FOUND";
      throw err;
    }
    const err = new Error(`Ollama error: ${error.response?.data?.error || error.message}`);
    err.code = "OLLAMA_ERROR";
    throw err;
  }
};

export const isOllamaReachable = async () => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
    const models = response.data?.models || [];
    return models.some((m) => m?.name === OLLAMA_MODEL || m?.name?.startsWith(`${OLLAMA_MODEL.split(":")[0]}:`));
  } catch {
    return false;
  }
};