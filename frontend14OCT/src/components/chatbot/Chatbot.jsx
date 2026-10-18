import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, X, MicOff, Volume2, VolumeX } from "lucide-react";

// ─── Shared Girl Avatar SVG ───────────────────────────────────────────────────
const GirlAvatar = ({ size = 40, className = "" }) => (
  <span className={`ai3d-av ${className}`} style={{ width: size, height: size }}>
    <img src="/ardhnarishwar-logo.png" alt="Ardhnarishwar" />
  </span>
);

const QUICK_REPLIES = [
  "Find Python jobs in Bangalore",
  "What jobs match my skills?",
  "Salary for React developer with 3 years exp",
  "Improve my resume for ATS",
  "Career path for AI developer",
  "Learning roadmap for full stack",
  "Check my application status",
  "Skills needed for DevOps",
];

// ─── Lightweight markdown renderer (no extra npm package needed) ─────────────
// The AI assistant's replies use **bold**, ### headers, --- dividers and
// "- " bullet lists. Previously these were shown as raw text (literal
// asterisks/hashes). This turns them into real styled elements instead.
const renderInline = (text, keyPrefix) => {
  // Matches **bold** or *italic* (not overlapping — bold's ** is consumed first).
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-slate-900">
          {boldMatch[1]}
        </strong>
      );
    }
    const italicMatch = part.match(/^\*([^*]+)\*$/);
    if (italicMatch) {
      return (
        <em key={`${keyPrefix}-i-${i}`} className="italic text-slate-700">
          {italicMatch[1]}
        </em>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${i}`}>{part}</React.Fragment>;
  });
};

const renderMarkdownLite = (text) => {
  const lines = String(text || "").split("\n");
  const nodes = [];
  let listBuffer = [];

  const flushList = (key) => {
    if (listBuffer.length) {
      nodes.push(
        <ul key={`ul-${key}`} className="list-disc pl-4 my-1 space-y-0.5">
          {listBuffer.map((item, i) => (
            <li key={`li-${key}-${i}`}>{renderInline(item, `li-${key}-${i}`)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (/^#{2,4}\s+/.test(trimmed)) {
      flushList(idx);
      const headerText = trimmed.replace(/^#{2,4}\s+/, "");
      nodes.push(
        <div key={`h-${idx}`} className="font-bold text-slate-900 mt-1.5 mb-0.5">
          {renderInline(headerText, `h-${idx}`)}
        </div>
      );
      return;
    }

    if (/^---+$/.test(trimmed)) {
      flushList(idx);
      nodes.push(<hr key={`hr-${idx}`} className="my-2 border-slate-200" />);
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }

    flushList(idx);
    if (trimmed === "") {
      nodes.push(<div key={`sp-${idx}`} className="h-1" />);
    } else {
      nodes.push(
        <div key={`p-${idx}`}>{renderInline(line, `p-${idx}`)}</div>
      );
    }
  });

  flushList("end");
  return nodes;
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I'm Aria, your Job Assistant 👋\nHow can I help you today?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typing]);

  // ─── Simple Bot Replies ─────────────────────────────────────
  const getBotReply = (text) => {
    const msg = text.toLowerCase();

    if (msg.includes("job")) {
      return "You can apply for jobs directly from the Jobs page 🚀";
    }

    if (msg.includes("resume")) {
      return "Go to Profile section to upload or update your resume 📄";
    }

    if (msg.includes("recruiter")) {
      return "Recruiters can be contacted through the company profile page 👨‍💼";
    }

    if (msg.includes("ai")) {
      return "AI Job Matching helps you find jobs based on your skills 🤖";
    }

    return "Thanks for your message 😊";
  };

  // ─── Add Bot Message ────────────────────────────────────────
  const addBotMsg = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  // ─── Voice Recognition ──────────────────────────────────────
  const handleVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.start();

    setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  };

  // Voice output can be controlled independently from microphone input.
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const latestRequestIdRef = useRef(0);
  const voiceEnabledRef = useRef(true);
  const lastSpeechTextRef = useRef("");
  const speechPositionRef = useRef(0);
  const currentSpeechRef = useRef(null);

  const cleanSpeechText = (value) => {
    let text = String(value ?? "");

    // Remove code blocks completely
    text = text.replace(/```[\s\S]*?```/g, " ");
    text = text.replace(/`[^`]*`/g, " ");

    // Keep readable link labels, remove URLs and destinations
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
    text = text.replace(/https?:\/\/\S+|www\.\S+/gi, " ");

    // Remove HTML and markdown heading/quote markers
    text = text.replace(/<[^>]*>/g, " ");
    text = text.replace(/^\s{0,3}#{1,6}\s*/gm, "");
    text = text.replace(/^\s*>\s?/gm, "");

    // Remove hashtag-only words, but preserve normal words
    text = text.replace(/(^|\s)#[\p{L}\p{N}_-]+/gu, "$1");
    text = text.replace(/#/g, " ");

    // Remove bullets and numbered list markers, keeping their content
    text = text.replace(/^\s*[-*+•▪◦‣]\s+/gm, "");
    text = text.replace(/^\s*\d{1,3}[.)]\s+/gm, "");

    // Remove markdown table separators and formatting characters
    text = text.replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, " ");
    text = text.replace(/[|*_~]/g, " ");

    // Remove emoji and decorative pictographs
    text = text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, " ");

    // Convert dash punctuation to natural pauses
    text = text.replace(/[—–]+/g, ". ");
    text = text.replace(/(^|\s)-(?=\s|$)/gm, "$1 ");

    // Normalize whitespace and punctuation
    text = text.replace(/[ \t]+/g, " ");
    text = text.replace(/[ \t]*\n[ \t]*/g, "\n");
    text = text.replace(/\n{2,}/g, ". ");
    text = text.replace(/\s+([,.;!?])/g, "$1");
    text = text.replace(/([,.;!?])(?=\S)/g, "$1 ");
    text = text.replace(/([.!?])(?:\s*[.!?])+/g, "$1");

    // Skip empty or symbol-only lines
    text = text.split("\n")
      .map(line => line.trim())
      .filter(line => /[\p{L}\p{N}]/u.test(line))
      .join(". ");

    return text.replace(/\s+/g, " ").trim();
  };

  const speak = (text, resume = false) => {
    if (!resume) {
      lastSpeechTextRef.current = cleanSpeechText(text);
      speechPositionRef.current = 0;
    }

    if (!voiceEnabledRef.current || !("speechSynthesis" in window)) return;
    if (typeof window.SpeechSynthesisUtterance === "undefined") return;

    const fullText = lastSpeechTextRef.current;
    const startPosition = resume ? speechPositionRef.current : 0;
    const remainingText = fullText.slice(startPosition).trimStart();

    if (!remainingText) return;

    const speech = new window.SpeechSynthesisUtterance(remainingText);
    speech.lang = "en-US";

    speech.onboundary = (event) => {
      if (currentSpeechRef.current === speech &&
          typeof event.charIndex === "number") {
        speechPositionRef.current = Math.min(
          fullText.length,
          startPosition + event.charIndex
        );
      }
    };

    speech.onend = () => {
      if (currentSpeechRef.current === speech) {
        currentSpeechRef.current = null;
        speechPositionRef.current = 0;
        lastSpeechTextRef.current = "";
      }
    };

    currentSpeechRef.current = speech;
    window.speechSynthesis.speak(speech);
  };

  const toggleAssistantVoice = () => {
    const next = !voiceEnabledRef.current;
    voiceEnabledRef.current = next;
    setVoiceEnabled(next);

    if (!("speechSynthesis" in window)) return;

    if (!next) {
      window.speechSynthesis.cancel();
      currentSpeechRef.current = null;
    } else {
      speak(lastSpeechTextRef.current, true);
    }
  };

  // ─── Send Message ───────────────────────────────────────────
//   const sendMessage = async (msg) => {
//     const text = (msg || input).trim();

//     if (!text) return;

//     const time = new Date().toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//     setMessages((prev) => [
//       ...prev,
//       {
//         from: "user",
//         text,
//         time,
//       },
//     ]);

//     setInput("");
//     setTyping(true);

//     // setTimeout(() => {
//     //   const reply = getBotReply(text);

//     //   setTyping(false);

//     //   addBotMsg(reply);

//     //   speak(reply);
//     // }, 800);
//     try {
//   const response = await fetch(
//     `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/chat/message`,
//     {
//       method: "POST",

//       headers: {
//         "Content-Type": "application/json",
//       },

//       body: JSON.stringify({
//         message: text,
//       }),
//     }
//   );

//   const data = await response.json();

//   setTyping(false);

//   if (data.success) {
//     addBotMsg(data.reply);

//     speak(data.reply);
//   } else {
//     addBotMsg("Something went wrong");
//   }
// } catch (error) {
//   console.log(error);

//   setTyping(false);

//   addBotMsg("Server Error");
// }
//   };

const sendMessage = async (msg) => {
    const currentRequestId = ++latestRequestIdRef.current;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    currentSpeechRef.current = null;
    lastSpeechTextRef.current = "";
    speechPositionRef.current = 0;

  const text = (msg || input).trim();

  if (!text) return;

  const time = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  setMessages((prev) => [
    ...prev,
    {
      from: "user",
      text,
      time,
    },
  ]);

  setInput("");

  setTyping(true);

  try {
    const conversationHistory = messages.slice(-6).map((m) => ({
      from: m.from,
      text: m.text,
    }));

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/chat/message`,
      {
        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: text,
          conversation: conversationHistory,
        }),
      }
    );

    const data = await response.json();

    if (currentRequestId !== latestRequestIdRef.current) return;

    setTyping(false);

    if (data.success) {
      addBotMsg(data.reply);

      if (currentRequestId === latestRequestIdRef.current) speak(data.reply);
    } else if (data.needsAuth) {
      addBotMsg(data.message + "\n\n💡 Please log in to access personalized features.");
    } else {
      addBotMsg(data.message || "Something went wrong");
    }
  } catch (error) {
    console.log(error);

    setTyping(false);

    addBotMsg("Server Error");
  }
};

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="w-[calc(100vw-2.5rem)] max-w-[360px] rounded-3xl overflow-hidden shadow-2xl shadow-blue-300/40 border border-blue-200 bg-white flex flex-col"
            style={{ maxHeight: "520px" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <GirlAvatar
                  size={42}
                  className="rounded-full ring-2 ring-white/40"
                />

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-sm">Aria</p>

                <p className="text-white/70 text-xs">
                  Job Assistant • Online
                </p>
              </div>

              <button
                type="button"
                onClick={toggleAssistantVoice}
                aria-label={voiceEnabled ? "Turn assistant voice off" : "Turn assistant voice on"}
                aria-pressed={voiceEnabled}
                title={voiceEnabled ? "Voice ON" : "Voice OFF"}
                className="ai-volume-toggle"
              >
                {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
              </button>

              <motion.button
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(false)}
                className="btn-close no-shift flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gradient-to-b from-blue-50/50 to-white"
              style={{ minHeight: 0 }}
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-2 ${
                      msg.from === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {msg.from === "bot" && (
                      <GirlAvatar
                        size={40}
                        className="flex-shrink-0 mt-1 rounded-full"
                      />
                    )}

                    <div
                      className={`max-w-[75%] flex flex-col gap-0.5 ${
                        msg.from === "user"
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.from === "user"
                            ? "whitespace-pre-line bg-gradient-to-br from-blue-600 to-cyan-600 text-white rounded-br-sm shadow-md"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                        }`}
                      >
                        {msg.from === "bot" ? renderMarkdownLite(msg.text) : msg.text}
                      </div>

                      <span className="text-[10px] text-slate-400 px-1">
                        {msg.time}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {typing && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2 items-end"
                  >
                    <GirlAvatar
                      size={40}
                      className="flex-shrink-0 rounded-full"
                    />

                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                          }}
                          className="h-2 w-2 rounded-full bg-blue-400"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((q) => (
                  <motion.button
                    key={q}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-100 bg-white px-3 py-3">
              <div
                className={`flex items-center gap-2 rounded-2xl border bg-slate-50 px-3 py-2 transition-all ${
                  listening
                    ? "border-rose-400 ring-2 ring-rose-400/20"
                    : "border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20"
                }`}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && sendMessage()
                  }
                  placeholder={
                    listening
                      ? "Listening..."
                      : "Ask me anything..."
                  }
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none min-w-0"
                />

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleVoice}
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                    listening
                      ? "bg-rose-500 text-white animate-pulse"
                      : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                  }`}
                >
                  {listening ? (
                    <MicOff className="h-3.5 w-3.5" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md hover:shadow-blue-300 transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen((v) => !v)}
        className="ai-assistant-launcher relative flex h-14 w-14 items-center justify-center rounded-full transition-shadow duration-300"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="av"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <img src="/ardhnarishwar-logo.png" alt="Ardhnarishwar" className="rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>


      </motion.button>
    </div>
  );
};

export default Chatbot;
