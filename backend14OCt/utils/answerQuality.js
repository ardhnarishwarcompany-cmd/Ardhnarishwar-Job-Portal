// Helpers that keep speech-to-text noise out of interview answers.
//
// Whisper-style models often "hallucinate" text when the audio is silent or only has
// background noise: stock phrases ("Thank you."), stray foreign words, or random short
// sentences. Those must never be treated (or scored) as a real candidate answer.

const normalizeText = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

// Phrases Whisper is known to invent for silent / noisy audio. Only matched when the
// WHOLE transcript is one of these, so a real answer that contains "thank you" is fine.
const HALLUCINATED_WHOLE_PHRASES = new Set([
  "thank you",
  "thank you very much",
  "thank you so much",
  "thanks",
  "thanks a lot",
  "thank you for watching",
  "thanks for watching",
  "thank you for listening",
  "thanks for listening",
  "thank you everyone",
  "bye",
  "bye bye",
  "goodbye",
  "see you",
  "see you next time",
  "see you in the next video",
  "you",
  "the end",
  "so",
  "okay",
  "ok",
  "hmm",
  "uh",
  "um",
  "yeah",
  "oh",
  "please subscribe",
  "like and subscribe",
]);

const HALLUCINATED_PATTERNS = [
  /amara\.org/i,
  /subtitles?\s+(by|from)/i,
  /(please\s+)?subscribe\s+to\s+(my|our|the)\s+channel/i,
  /thanks?\s+for\s+watching/i,
  /transcribed\s+by/i,
  /www\.[a-z0-9-]+\.[a-z]{2,}/i,
];

const wordsOf = (text) => normalizeText(text).split(" ").filter(Boolean);

// True when most letters are outside the Latin alphabet (e.g. stray Chinese/Arabic text
// appearing in an English interview).
const isMostlyNonLatin = (text) => {
  const letters = String(text || "").match(/\p{L}/gu) || [];
  if (!letters.length) return false;
  const latin = letters.filter((ch) => /[A-Za-z\u00C0-\u024F]/.test(ch)).length;
  return latin / letters.length < 0.6;
};

// The same word/phrase looping ("you you you you", "thank you thank you thank you").
const isRepetitionLoop = (text) => {
  const words = wordsOf(text);
  if (words.length < 4) return false;
  const distinct = new Set(words);
  return distinct.size <= Math.max(1, Math.floor(words.length / 4));
};

/**
 * Returns the cleaned transcript, or "" when the text is not a genuine spoken answer
 * (silence hallucination, stray foreign script, or a repetition loop).
 */
export const sanitizeTranscript = (text) => {
  const trimmed = String(text || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  if (isMostlyNonLatin(trimmed)) return "";
  if (HALLUCINATED_PATTERNS.some((re) => re.test(trimmed))) return "";
  if (HALLUCINATED_WHOLE_PHRASES.has(normalizeText(trimmed))) return "";
  if (isRepetitionLoop(trimmed)) return "";
  return trimmed;
};

/**
 * Whisper "verbose_json" returns per-segment confidence signals. Drop segments that the
 * model itself thinks are silence / repetition, and return the remaining text.
 * Falls back to the plain `text` field when no segments are available.
 */
export const textFromWhisperResponse = (data) => {
  if (!data) return "";
  const segments = Array.isArray(data.segments) ? data.segments : null;
  if (!segments) return String(data.text || "").trim();

  const kept = segments.filter((seg) => {
    const noSpeech = Number(seg.no_speech_prob);
    const logProb = Number(seg.avg_logprob);
    const compression = Number(seg.compression_ratio);
    if (Number.isFinite(noSpeech) && noSpeech > 0.85) return false;
    if (Number.isFinite(noSpeech) && Number.isFinite(logProb) && noSpeech > 0.6 && logProb < -0.8) return false;
    if (Number.isFinite(compression) && compression > 2.4) return false;
    return String(seg.text || "").trim().length > 0;
  });

  return kept.map((seg) => String(seg.text).trim()).join(" ").replace(/\s+/g, " ").trim();
};
