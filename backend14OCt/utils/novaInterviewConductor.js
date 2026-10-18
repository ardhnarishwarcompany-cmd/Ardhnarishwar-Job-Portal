import { ollamaChat } from "./ollamaClient.js";
import { sanitizeTranscript } from "./answerQuality.js";

const ROLE_BANKS = [
  {
    match: /(software|developer|engineer|frontend|backend|full.?stack|react|node|javascript|typescript|python|java|devops|qa|tester|data|tech|it|web)/i,
    questions: [
      ["Role & experience", "Please walk me through your software development experience and the type of projects you have worked on."],
      ["Technical fundamentals", "Which technologies are strongest for you, and how have you used them in a real project?"],
      ["Problem solving", "Tell me about a difficult technical problem you solved. How did you find the root cause and what was the result?"],
      ["Architecture", "Describe a project where you had to make an important design or architecture decision. What trade-offs did you consider?"],
      ["Debugging & quality", "Tell me about a production bug or quality issue you handled. How did you investigate it and prevent it from happening again?"],
      ["Collaboration", "Describe a disagreement with a developer, tester, product owner, or manager. How did you resolve it?"],
      ["Delivery", "How do you prioritize work when you have multiple tasks, changing requirements, and a tight deadline?"],
      ["Role fit", "Why are you a strong fit for this role, and what would you aim to improve or deliver in your first 90 days?"],
    ],
  },
  {
    match: /(human resource|hr\b|recruit|talent|hr executive|hr manager|people)/i,
    questions: [
      ["HR & introduction", "Please walk me through your HR or recruitment experience and the kind of roles or teams you have supported."],
      ["Sourcing", "How do you source and shortlist candidates for a difficult or hard-to-fill position?"],
      ["Screening", "What do you look for during an initial candidate screening, and how do you keep the process fair and consistent?"],
      ["Stakeholder management", "Tell me about a time a hiring manager and a candidate had different expectations. How did you handle it?"],
      ["Candidate experience", "How would you handle a candidate who is unhappy about delays or lack of communication during recruitment?"],
      ["Conflict handling", "Describe a workplace conflict you helped resolve. What approach did you take?"],
      ["Metrics", "Which recruitment or HR metrics do you consider important, and how have you used data to improve a process?"],
      ["Role fit", "What makes you a strong fit for this HR role, and what value would you aim to deliver in your first 90 days?"],
    ],
  },
  {
    match: /(sales|business development|bdm|account manager|relationship manager|inside sales|field sales)/i,
    questions: [
      ["Sales experience", "Please describe your sales or business development experience and the customers or markets you have handled."],
      ["Prospecting", "How do you identify and prioritize prospects when you need to build a new sales pipeline?"],
      ["Discovery", "How do you understand a customer's real need before proposing a product or service?"],
      ["Objection handling", "Tell me about a difficult customer objection you handled. What did you say and what happened next?"],
      ["Closing", "Describe a deal you successfully closed. What was the key factor that helped you win it?"],
      ["Targets", "How do you organize your work when you have aggressive monthly targets and several active opportunities?"],
      ["Relationships", "How do you maintain a strong customer relationship after the sale?"],
      ["Role fit", "Why are you a strong fit for this sales role, and what would you target in your first 90 days?"],
    ],
  },
  {
    match: /(finance|account|accountant|accounts|audit|tax|banking|financial)/i,
    questions: [
      ["Finance experience", "Please summarize your finance or accounting experience and the types of responsibilities you have handled."],
      ["Accuracy", "What checks do you perform to keep financial records accurate and complete?"],
      ["Problem solving", "Tell me about a financial or accounting discrepancy you found. How did you investigate and resolve it?"],
      ["Reporting", "Describe a financial report or analysis you prepared and how it helped a manager make a decision."],
      ["Compliance", "How do you stay organized when working with deadlines, policies, audits, or compliance requirements?"],
      ["Stakeholders", "Tell me about a time you had to explain a financial issue to someone without a finance background."],
      ["Priorities", "How do you manage several urgent finance tasks at the same time, especially around a closing deadline?"],
      ["Role fit", "Why are you a strong fit for this finance role, and what value would you aim to deliver in your first 90 days?"],
    ],
  },
  {
    match: /(marketing|digital marketing|seo|social media|content|brand|performance marketing)/i,
    questions: [
      ["Marketing experience", "Please walk me through your marketing experience and the campaigns or channels you have managed."],
      ["Strategy", "How do you turn a business goal into a practical marketing plan?"],
      ["Campaign execution", "Tell me about a campaign you worked on. What did you do, and what result did it achieve?"],
      ["Measurement", "Which marketing metrics do you use to decide whether a campaign is working?"],
      ["Optimization", "Describe a campaign that was not performing well. How did you diagnose the problem and improve it?"],
      ["Content & audience", "How do you adapt a message for different audiences or channels?"],
      ["Priorities", "How do you balance several campaigns, deadlines, and stakeholder requests at the same time?"],
      ["Role fit", "Why are you a strong fit for this marketing role, and what would you aim to achieve in your first 90 days?"],
    ],
  },
  {
    match: /(customer service|customer support|bpo|call center|voice|non.?voice|support executive|client support)/i,
    questions: [
      ["Customer service", "Please describe your customer service or support experience and the type of customers you have handled."],
      ["Difficult customer", "Tell me about a difficult customer interaction. How did you calm the situation and reach a useful outcome?"],
      ["Communication", "How do you make sure a customer understands your explanation when they are confused or frustrated?"],
      ["Problem solving", "Describe a customer issue that was not straightforward. How did you investigate it and resolve it?"],
      ["Prioritization", "How do you manage several customer requests when many of them appear urgent?"],
      ["Quality", "What does good customer service mean to you, and how do you measure whether you are delivering it?"],
      ["Teamwork", "Tell me about a time you worked with another team to resolve a customer problem."],
      ["Role fit", "Why are you a strong fit for this support role, and what value would you aim to deliver in your first 90 days?"],
    ],
  },
];

const GENERAL_PLAN = [
  ["Introduction", "Please introduce yourself, summarize your professional background, and tell me why you are interested in this role."],
  ["Role knowledge", "What is the most important skill for this role, and how have you used that skill in a real work situation?"],
  ["Problem solving", "Tell me about a difficult problem you solved. How did you identify the cause, what did you do, and what was the result?"],
  ["Communication", "Tell me about a time you had to explain a complex task or idea to someone who was not familiar with it."],
  ["Teamwork", "Describe a time you had a disagreement with a teammate or stakeholder. How did you handle it?"],
  ["Ownership", "Tell me about a task or project where you took ownership from start to finish. What did you achieve?"],
  ["Priorities", "How do you decide what to work on first when you have multiple deadlines and changing priorities?"],
  ["Role fit", "What makes you a strong fit for this role, and what value would you aim to deliver in your first 90 days?"],
];

// Extra questions per role bank (same order as ROLE_BANKS). Interviews can run up to
// 15 questions, so every role needs more than the original 8 distinct questions.
const ROLE_EXTRAS = [
  // Software / IT
  [
    ["Testing", "How do you test your own code before it goes to review or production, and what kinds of tests do you write?"],
    ["Code quality", "What do you look for when reviewing a teammate's code, and how do you give feedback that is useful and respectful?"],
    ["Performance", "Tell me about a time you found and fixed a performance problem. How did you measure it before and after?"],
    ["Security", "What security practices do you follow when building or maintaining an application?"],
    ["Learning", "How do you learn a new framework or tool quickly, and can you give a recent example?"],
    ["Deployment", "Walk me through how your code moves from your machine to production. Which tools and checks are involved?"],
    ["Leadership", "Describe a time you mentored a junior developer or led a small piece of work. What did you do?"],
    ["Learning from failure", "Tell me about a technical decision you would make differently today. What did you learn from it?"],
  ],
  // HR / Recruitment
  [
    ["Onboarding", "How do you make sure a new employee feels welcome and productive in their first weeks?"],
    ["Retention", "What steps have you taken to improve employee engagement or reduce attrition?"],
    ["Compliance", "How do you stay compliant with labour laws and statutory requirements such as PF, ESI, or company policy?"],
    ["Fairness", "How do you reduce bias when shortlisting and interviewing candidates?"],
    ["Offers", "A selected candidate declines the offer at the last moment. What do you do?"],
    ["Performance management", "Describe how you have supported a manager dealing with an underperforming employee."],
    ["High-volume hiring", "How do you manage a high-volume hiring drive with a tight deadline and limited resources?"],
    ["Tools", "Which HR or applicant tracking tools have you used, and how did they improve your work?"],
  ],
  // Sales
  [
    ["Negotiation", "Tell me about a negotiation where the customer pushed hard on price. How did you protect the value of the deal?"],
    ["Lost deals", "Describe a deal you lost. What did you learn, and what did you change afterwards?"],
    ["Pipeline reporting", "How do you keep your pipeline and forecasts accurate, and which CRM tools do you use?"],
    ["Cold outreach", "Walk me through how you approach a cold call or first message to a prospect who does not know you."],
    ["Upselling", "How do you identify and win an upsell or cross-sell opportunity with an existing customer?"],
    ["Competition", "How do you respond when a customer says a competitor offers a better price or product?"],
    ["Collaboration", "Tell me about a time you worked with marketing, operations, or support to close or keep a customer."],
    ["Product knowledge", "How do you learn a new product well enough to sell it confidently?"],
  ],
  // Finance / Accounting
  [
    ["Tools", "Which accounting software, ERP, or Excel techniques do you use most, and how do they help your accuracy?"],
    ["Budgeting", "Tell me about a time actual results differed from the budget. How did you analyse and explain the variance?"],
    ["Taxation", "How do you make sure tax filings such as GST or TDS are prepared correctly and on time?"],
    ["Audit", "Describe your experience supporting an internal or external audit. What did you prepare, and what was the outcome?"],
    ["Process improvement", "Tell me about a finance process you improved or automated. What was the impact?"],
    ["Ethics", "What would you do if a senior colleague asked you to adjust a figure in a way that did not feel right?"],
    ["Cash flow", "How do you monitor cash flow and working capital, and what actions do you take when cash is tight?"],
    ["Reconciliation", "Walk me through how you handle month-end bank and ledger reconciliations."],
  ],
  // Marketing
  [
    ["Budget allocation", "How do you decide how to split a limited marketing budget across channels?"],
    ["Channels", "Which channel, such as SEO, paid ads, email, or social media, have you worked with most, and what results did it deliver?"],
    ["Testing", "Tell me about an A/B test you ran. What did you test, and what did you learn?"],
    ["Brand", "How do you keep messaging consistent with the brand across different campaigns and teams?"],
    ["Sales alignment", "How do you work with the sales team to make sure marketing generates quality leads?"],
    ["Learning from failure", "Describe a campaign that failed. What went wrong and what would you do differently?"],
    ["Analytics tools", "Which analytics or marketing tools do you rely on, and how do you turn their data into decisions?"],
    ["Trends", "How do you stay up to date with marketing trends, and what is one you have recently applied?"],
  ],
  // Customer support
  [
    ["Service levels", "How do you keep response and resolution times within target when the volume of requests suddenly rises?"],
    ["Escalation", "When do you escalate a customer issue, and how do you hand it over so the customer does not have to repeat themselves?"],
    ["Documentation", "How do you record customer issues and solutions so that the team can reuse the knowledge?"],
    ["Resilience", "How do you stay calm and positive after several difficult customer interactions in a row?"],
    ["Feedback", "How do you use customer feedback or satisfaction scores to improve the way you work?"],
    ["Process improvement", "Tell me about a time you suggested a change that reduced repeat complaints or handling time."],
    ["Channels", "Which support channels have you handled, such as phone, email, or chat, and how does your approach change between them?"],
    ["Ownership", "Tell me about a mistake you made with a customer. How did you take responsibility and fix it?"],
  ],
];

const GENERAL_EXTRAS = [
  ["Learning", "Tell me about something new you had to learn quickly at work. How did you approach it?"],
  ["Strengths", "What are your strongest professional strengths, and what is one area you are actively improving?"],
  ["Failure", "Describe a time something you worked on did not go as planned. What did you learn?"],
  ["Initiative", "Tell me about a time you noticed a problem and took the initiative to fix it without being asked."],
  ["Pressure", "Describe a high-pressure situation at work and how you kept your performance steady."],
  ["Feedback", "How do you respond to critical feedback? Please share a real example."],
  ["Process improvement", "Tell me about a time you improved the way a task or process was done. What changed as a result?"],
  ["Career goals", "Where do you want your career to be in the next three to five years, and how does this role help you get there?"],
];

// Role-independent questions, phrased around the target role. Used as a safety net so an
// interview of up to 15 questions never runs out of new questions or repeats one.
const DEEP_DIVE_POOL = [
  ["Achievement", "Looking back at your career, which accomplishment are you most proud of, and why does it matter for {roleRole}?"],
  ["Mistakes", "Tell me about a mistake you made at work. What did you learn, and what do you do differently now?"],
  ["Staying current", "How do you keep your skills up to date for {roleRole}, and what have you learned recently?"],
  ["Adaptability", "Describe a time you had to adapt quickly when plans or priorities changed suddenly."],
  ["Feedback", "Tell me about feedback that changed the way you work. What did you do with it?"],
  ["Improvement", "Give me an example of a time you made a process or routine better. What was the impact?"],
  ["Pressure", "Describe the most stressful situation you have faced at work. How did you handle it?"],
  ["Organisation", "Which habits or tools help you stay organised and productive in {roleRole}?"],
  ["Mentoring", "Tell me about a time you helped a colleague succeed. What did you do?"],
  ["Challenges", "What part of {roleRole} do you find most challenging, and how do you deal with it?"],
  ["Decision making", "Describe a decision you had to make with incomplete information. How did you decide?"],
  ["Career goals", "Where do you see your career in three to five years, and how does {roleRole} fit that path?"],
  ["Self-awareness", "What would your previous manager say are your biggest strengths and your main area for improvement?"],
  ["Going further", "Tell me about a time you went beyond your job description to get a result."],
];

const pickRolePlan = (jobTitle = "") => {
  const title = String(jobTitle || "").trim();
  const bank = ROLE_BANKS.find((item) => item.match.test(title));
  const extras = bank ? ROLE_EXTRAS[ROLE_BANKS.indexOf(bank)] || [] : GENERAL_EXTRAS;
  const source = [...(bank?.questions || GENERAL_PLAN), ...extras];
  return source.map(([category, prompt]) => ({ category, prompt }));
};

const buildDeepDivePool = (jobTitle = "") => {
  const title = String(jobTitle || "").trim();
  const roleRole = title ? `the ${title} role` : "this role";
  return DEEP_DIVE_POOL.map(([category, prompt]) => ({
    category,
    prompt: prompt.replace(/\{roleRole\}/g, roleRole),
  }));
};

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 15;
const DEFAULT_QUESTIONS = 8;

export const clampQuestionCount = (value) => {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return DEFAULT_QUESTIONS;
  return Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, n));
};

const totalFor = (ctx, plan) => clampQuestionCount(ctx?.totalQuestions || plan?.length || DEFAULT_QUESTIONS);

const buildSystemPrompt = (ctx) => `You are Recruweb's professional AI interviewer.
You are interviewing "${ctx.candidateName || "the candidate"}" for the role "${ctx.jobTitle || "the role"}".
The interview has ${ctx.totalQuestions || DEFAULT_QUESTIONS} questions in total. Ask one question at a time.
If the candidate asks you to repeat, clarify, rephrase, or give a neutral example, keep the SAME question active. Do not evaluate that request as an answer and do not advance.
Never reveal scoring criteria or coach the candidate toward an answer.`;

const clamp = (value, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number(value) || 0));

const fallbackEvaluation = (answer, category = "") => {
  const text = String(answer || "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const lower = text.toLowerCase();
  const detail = Math.min(35, Math.round(words.length * 0.45));
  const example = /(example|project|client|customer|result|achieved|implemented|resolved|experience|because|therefore)/i.test(text) ? 20 : 0;
  const structure = /(first|then|next|finally|situation|task|action|result|step)/i.test(text) ? 15 : 0;
  const communication = clamp(35 + detail + (words.length >= 35 ? 15 : 0) + (/[.!?]/.test(text) ? 5 : 0));
  const skills = clamp(30 + detail + example + structure);
  const technical = /technical|software|finance|marketing|sales|support|situational|problem solving/i.test(category)
    ? clamp(30 + detail + example + (/(api|database|sql|javascript|python|system|debug|testing|process|workflow|security|server|software|tool|customer|client|recruit|hiring|campaign|revenue)/i.test(lower) ? 20 : 0))
    : clamp(45 + example + Math.round(detail * 0.5));
  // A very short reply cannot earn the baseline points: scale everything by how much the
  // candidate actually said (full credit from ~20 words). Empty replies score 0.
  const lengthFactor = Math.min(1, words.length / 20);
  const scaled = (value) => Math.round(value * lengthFactor);
  const score = Math.round((communication * 0.35 + skills * 0.4 + technical * 0.25) * lengthFactor * 10) / 10;
  return {
    score,
    skills: scaled(skills),
    communication: scaled(communication),
    technical: scaled(technical),
    relevance: scaled(skills),
    clarity: scaled(communication),
    depth: scaled((skills + technical) / 2),
    evidence: words.length ? (example ? scaled(80) : scaled(35)) : 0,
    note: lengthFactor < 1
      ? "The answer was too short to evaluate reliably (structured fallback evaluator)."
      : "Browser transcript was evaluated with the structured fallback evaluator.",
  };
};

const scoreAnswer = async (ctx, answer, question) => {
  try {
    const raw = await ollamaChat({
      system:
        'You are a strict, fair interview evaluator. Return ONLY JSON with keys: ' +
        '{"score":0-100,"skills":0-100,"communication":0-100,"technical":0-100,' +
        '"relevance":0-100,"clarity":0-100,"depth":0-100,"evidence":0-100,"note":"short note"}. ' +
        "Judge only the candidate's actual answer. Do not invent experience. " +
        "A response is an answer if it meaningfully attempts the question; do not require a perfect or keyword-matching answer to advance. " +
        "If the response is off-topic, unrelated to the question, or meaningless (for example a stock phrase like thank you, a random sentence, or filler), score every field below 10.",
      messages: [{
        role: "user",
        content: `Target role: ${ctx.jobTitle || "General"}\nCategory: ${question?.category || "General"}\nQuestion: ${question?.prompt || ""}\nCandidate answer: ${answer}`,
      }],
      maxTokens: 240,
      temperature: 0.15,
      json: true,
    });
    const p = JSON.parse(raw);
    return {
      score: Math.round(clamp(p.score) * 10) / 10,
      skills: Math.round(clamp(p.skills)),
      communication: Math.round(clamp(p.communication)),
      technical: Math.round(clamp(p.technical)),
      relevance: Math.round(clamp(p.relevance)),
      clarity: Math.round(clamp(p.clarity)),
      depth: Math.round(clamp(p.depth)),
      evidence: Math.round(clamp(p.evidence)),
      note: String(p.note || ""),
    };
  } catch {
    return fallbackEvaluation(answer, question?.category);
  }
};

const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const detectIntent = (answer) => {
  const text = normalize(answer);
  if (!text) return "empty";

  // Keep explicit repeat/clarification requests out of answer scoring.
  if (
    /\b(can|could|would|will)\s+you\s+(please\s+)?(repeat|say that again|ask that again)\b/.test(text) ||
    /\b(please\s+)?repeat(?:\s+the)?\s+question\b/.test(text) ||
    /\brepeat\s+(it|that|again|question)\b/.test(text) ||
    /\b(ask|say)\s+(it|that|the question)\s+again\b/.test(text) ||
    /\b(can|could)\s+you\s+ask\s+(the\s+question\s+)?again\b/.test(text) ||
    /\b(i\s+didn'?t|i\s+did not)\s+(hear|understand|get)\b/.test(text) ||
    /^again[.!?]*$/.test(text) ||
    /^repeat[.!?]*$/.test(text) ||
    /^question[.!?]*again$/.test(text)
  ) return "repeat";

  if (
    /\b(i\s+(do not|don't|did not|didn't)\s+understand)\b/.test(text) ||
    /\bwhat\s+do\s+you\s+mean\b/.test(text) ||
    /\bcan\s+you\s+(explain|clarify|rephrase)\b/.test(text) ||
    /\bcould\s+you\s+(explain|clarify|rephrase)\b/.test(text) ||
    /\b(in|with)\s+(simpler|simple)\s+(words|language)\b/.test(text)
  ) return "clarification";

  if (/\b(can|could|would)\s+you\s+(give|provide)\s+(me\s+)?an?\s+example\b/.test(text) || /\bwhat kind of example\b/.test(text)) {
    return "example";
  }

  if (/\b(skip|next question|move to the next question)\b/.test(text) && text.split(/\s+/).length <= 12) {
    return "skip";
  }

  return "answer";
};

const clarificationResponse = (question, kind, count) => {
  const prompt = question?.prompt || "";
  if (kind === "repeat") {
    return `Of course. I'll repeat the question once: ${prompt}`;
  }
  if (kind === "example") {
    return `Sure. I'm asking you to describe a real situation related to this question and explain what you personally did and what happened as a result. The question is: ${prompt}`;
  }
  if (count >= 2) {
    return `No problem. Let me make it even simpler. In practical terms, I'm asking: ${prompt}`;
  }
  return `No problem. Let me rephrase it more simply. ${prompt}`;
};

const withTimeout = (promise, ms, fallback) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);

const wordSet = (text) => new Set(normalize(text).replace(/[^a-z0-9 ]/g, " ").split(" ").filter((w) => w.length > 3));
// Share of the shorter question's meaningful words that also appear in the other question.
const similarity = (a, b) => {
  const A = wordSet(a), B = wordSet(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  A.forEach((w) => { if (B.has(w)) common += 1; });
  return common / Math.min(A.size, B.size);
};
const SIMILARITY_LIMIT = 0.7;
const tooSimilar = (a, b) => normalize(a) === normalize(b) || similarity(a, b) >= SIMILARITY_LIMIT;

const isNewQuestion = (prompt, plan) => !(plan || []).some((q) => tooSimilar(prompt, q.prompt));

const wordCount = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;

// Safety net used only when the AI model is slow, unavailable, or keeps repeating itself.
// Draws from the role bank first, then from the deep-dive pool, and always returns a
// question that has not been asked in this interview.
const fallbackQuestion = (jobTitle, plan) => {
  const candidates = [...pickRolePlan(jobTitle), ...buildDeepDivePool(jobTitle)];
  const fresh = candidates.find((q) => isNewQuestion(q.prompt, plan));
  if (fresh) return { ...fresh, type: "new_topic", source: "fallback" };

  // Practically unreachable (30+ distinct questions vs. a 15-question maximum), but if it
  // ever happens pick the candidate that is least similar to what was already asked.
  const asked = plan || [];
  const leastSimilar = candidates
    .map((q) => ({ q, score: Math.max(0, ...asked.map((a) => similarity(q.prompt, a.prompt))) }))
    .sort((x, y) => x.score - y.score)[0];
  return { ...leastSimilar.q, type: "new_topic", source: "fallback" };
};

const parseQuestionJson = (raw) => {
  try {
    const cleaned = String(raw || "").replace(/```json|```/g, "").trim();
    const p = JSON.parse(cleaned);
    const prompt = String(p.prompt || p.question || "").trim();
    if (!prompt) return null;
    return {
      category: String(p.category || "Role question").trim().slice(0, 60),
      prompt,
      type: p.type === "followup" ? "followup" : "new_topic",
    };
  } catch {
    return null;
  }
};

const transcriptForPrompt = (transcript = [], limit = 8) =>
  transcript
    .filter((t) => (t.role === "robot" || t.role === "candidate") && t.content && t.phase !== "approval")
    .slice(-limit)
    .map((t) => `${t.role === "robot" ? "Interviewer" : "Candidate"}: ${String(t.content).slice(0, 500)}`)
    .join("\n");

/**
 * Generates the opening question (no answer yet) or the next question based on the
 * candidate's last answer. Every question is written by the AI for the target role.
 */
const generateQuestion = async ({ jobTitle, candidateName, plan, transcript, lastAnswer, mode, position, total }) => {
  const asked = (plan || []).map((q, i) => `${i + 1}. ${q.prompt}`).join("\n") || "(none yet)";
  const role = jobTitle || "the role";
  const modeRules = mode === "opening"
    ? `Write the OPENING question. Ask the candidate to describe their experience and the work they have done that is directly relevant to the "${role}" role.`
    : mode === "followup"
      ? `Write ONE FOLLOW-UP question that digs into something specific the candidate just said (a tool, project, decision, number, claim, or vague point). Quote or reference their exact words so it is clearly a reaction to their answer. Do not change the topic.`
      : `Write ONE NEW question on a different important area of the "${role}" role that has not been covered yet.`;
  try {
    const raw = await ollamaChat({
      system:
        `You are a professional interviewer hiring for the role "${role}". ` +
        `Every question must be specific to this role: its real skills, tools, scenarios, and responsibilities. ` +
        `Ask exactly one question, spoken naturally, under 45 words. Never repeat or reword an earlier question, and never revisit a topic already covered unless you are following up on the candidate's last answer. ` +
        `Never reveal scoring. Return ONLY JSON: {"type":"${mode === "followup" ? "followup" : "new_topic"}","category":"short topic label","prompt":"the question"}.`,
      messages: [{
        role: "user",
        content:
          `Candidate: ${candidateName || "Candidate"}\nRole: ${role}\nQuestion ${position} of ${total}.\n` +
          `Questions already asked:\n${asked}\n\n` +
          (transcript ? `Recent conversation:\n${transcript}\n\n` : "") +
          (lastAnswer ? `Candidate's latest answer: ${String(lastAnswer).slice(0, 900)}\n\n` : "") +
          modeRules,
      }],
      maxTokens: 160,
      temperature: 0.5,
      json: true,
    });
    const q = parseQuestionJson(raw);
    if (!q || wordCount(q.prompt) < 4 || !isNewQuestion(q.prompt, plan)) return null;
    return { ...q, type: mode === "opening" ? "opening" : q.type, source: "ai" };
  } catch {
    return null;
  }
};

const QUESTION_GEN_TIMEOUT_MS = 30000;

const decideNextQuestion = async (ctx, plan, answer, idx, total) => {
  const recent = plan.slice(-2);
  const consecutiveFollowUps = recent.filter((q) => q.type === "followup").length;
  const meaningful = wordCount(answer) >= 8;
  // Follow up on real answers, but never twice in a row more than 2 times, so the whole role is covered.
  const mode = meaningful && consecutiveFollowUps < 2 ? "followup" : "new_topic";
  const attempt = (m) => withTimeout(
    generateQuestion({
      jobTitle: ctx.jobTitle,
      candidateName: ctx.candidateName,
      plan,
      transcript: transcriptForPrompt(ctx.transcript),
      lastAnswer: answer,
      mode: m,
      position: idx + 2,
      total,
    }),
    QUESTION_GEN_TIMEOUT_MS,
    null,
  );
  const startedAt = Date.now();
  let generated = await attempt(mode);
  // The model sometimes repeats itself. Retry once with a fresh topic (only if the model is responding quickly).
  if (!generated && Date.now() - startedAt < 10000) generated = await attempt("new_topic");
  return generated || fallbackQuestion(ctx.jobTitle, plan);
};

// Returns the question at nextIndex: a legacy pre-planned one if it exists, otherwise AI-generated.
const resolveNextQuestion = async (ctx, plan, answer, idx, total) => {
  const nextIndex = idx + 1;
  if (plan[nextIndex]) return { question: plan[nextIndex], plan };
  const question = await decideNextQuestion(ctx, plan, answer, idx, total);
  return { question, plan: [...plan.slice(0, nextIndex), question] };
};

export const getInterviewPlan = (jobTitle = "") => pickRolePlan(jobTitle);

export const startNovaInterview = async ({ candidateName, jobTitle, totalQuestions = DEFAULT_QUESTIONS }) => {
  const total = clampQuestionCount(totalQuestions);
  const ctx = { candidateName, jobTitle, totalQuestions: total };
  let greeting = `Hello ${candidateName || "there"}, welcome to your Recruweb interview. I’ll be conducting your interview today for the ${jobTitle || "role"} position. Please answer naturally and take your time. If you do not understand a question, you can ask me to repeat or explain it. I’ll wait for your answer before moving to the next question.`;

  const greetingPromise = ollamaChat({
    system: buildSystemPrompt(ctx),
    messages: [{
      role: "user",
      content: `Give a warm, concise spoken welcome for the candidate. Say that you are their Recruweb AI interviewer, mention the target role, explain that they can ask to repeat or clarify a question, and say that you will move forward only after their answer. Do not ask the first question yet.`,
    }],
    maxTokens: 150,
    temperature: 0.35,
  }).catch(() => "");

  const openingPromise = withTimeout(
    generateQuestion({ jobTitle, candidateName, plan: [], transcript: "", lastAnswer: "", mode: "opening", position: 1, total }),
    QUESTION_GEN_TIMEOUT_MS,
    null,
  );

  const [generatedGreeting, opening] = await Promise.all([greetingPromise, openingPromise]);
  if (generatedGreeting?.trim()) greeting = generatedGreeting.trim();

  const first = opening || { ...pickRolePlan(jobTitle)[0], type: "opening", source: "fallback" };
  return {
    greeting,
    firstQuestion: first.prompt,
    phase: "core",
    // The plan only ever contains questions that have actually been asked. Follow-ups are added live.
    questionPlan: [first],
    totalQuestions: total,
  };
};

export const processNovaAnswer = async (ctx, answer, { timedOut = false, timeoutReason = "max_time" } = {}) => {
  const plan = ctx.questionPlan?.length ? ctx.questionPlan : [fallbackQuestion(ctx.jobTitle, [])];
  const total = totalFor(ctx, plan);
  const idx = Number(ctx.questionIndex || 0);
  const question = plan[idx];
  const rawAnswer = String(answer || "").trim();
  const intent = detectIntent(rawAnswer);
  // Speech-to-text noise (e.g. "Thank you." or stray foreign words from silent audio) is not
  // an answer. Repeat / clarify / skip requests keep their original wording.
  const safeAnswer = intent === "answer" ? sanitizeTranscript(rawAnswer) : rawAnswer;
  const unclearSpeech = intent === "answer" && Boolean(rawAnswer) && !safeAnswer;
  const nowIso = () => new Date().toISOString();

  const concludeResult = ({ transcript, scores, answers, newPlan, response, feedbackScore, action = "conclude", recommendation }) => {
    const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    const avgOf = (key) => Math.round(
      (answers.reduce((sum, item) => sum + Number(item[key] || 0), 0) / Math.max(answers.length, 1)) * 10
    ) / 10;
    return {
      phase: "closing",
      phaseTurns: 0,
      turns: (ctx.turns || 0) + 1,
      questionIndex: idx + 1,
      questionPlan: newPlan,
      transcript,
      scores,
      answerEvaluations: answers,
      askedQuestions: newPlan.map((q) => q.prompt),
      action,
      response,
      score: feedbackScore,
      done: true,
      advance: true,
      avgScore: avg,
      evaluationSummary: {
        skills: avgOf("skills"),
        communication: avgOf("communication"),
        technical: avgOf("technical"),
        overall: avg,
        answeredQuestions: answers.filter((a) => a.answer).length,
        timedOutQuestions: answers.filter((a) => a.timedOut).length,
        totalQuestions: total,
      },
      aiRecommendation: recommendation || (avg >= 60 ? "PASS" : "FAIL"),
    };
  };

  // Conversation intents are never scored and never advance questionIndex.
  if (["repeat", "clarification", "example"].includes(intent)) {
    const previousClarifications = (ctx.transcript || []).filter(
      (item) => item.role === "candidate" && item.intent && ["repeat", "clarification", "example"].includes(item.intent) && Number(item.questionIndex) === idx,
    ).length;
    const response = clarificationResponse(question, intent, previousClarifications + 1);
    const now = nowIso();
    return {
      phase: "core",
      phaseTurns: ctx.phaseTurns || idx,
      turns: ctx.turns || 0,
      questionIndex: idx,
      questionPlan: plan,
      questionStartedAt: ctx.questionStartedAt || new Date(),
      transcript: [
        ...(ctx.transcript || []),
        { role: "candidate", content: safeAnswer, intent, questionIndex: idx, timestamp: now },
        { role: "robot", content: response, intent, questionIndex: idx, category: question?.category, timestamp: now },
      ],
      scores: ctx.scores || [],
      answerEvaluations: ctx.answerEvaluations || [],
      askedQuestions: plan.map((q) => q.prompt),
      action: intent === "repeat" ? "repeat_question" : "clarify_question",
      response,
      done: false,
      advance: false,
      intent,
      evaluationSummary: ctx.evaluationSummary || null,
      aiRecommendation: null,
    };
  }

  if (intent === "skip") {
    const now = nowIso();
    const response = `Okay, we'll skip this question and continue.`;
    const skipped = {
      questionIndex: idx,
      category: question?.category,
      question: question?.prompt,
      answer: "",
      skipped: true,
      score: null,
      timedOut: false,
    };
    const answers = [...(ctx.answerEvaluations || []), skipped];
    const baseTranscript = [...(ctx.transcript || []), { role: "candidate", content: safeAnswer, intent, questionIndex: idx, timestamp: now }, { role: "robot", content: response, timestamp: now }];
    if (idx + 1 >= total) {
      return concludeResult({ transcript: baseTranscript, scores: ctx.scores || [], answers, newPlan: plan, response, feedbackScore: null, action: "conclude", recommendation: "REVIEW" });
    }
    const { question: nextQuestion, plan: newPlan } = await resolveNextQuestion(ctx, plan, "", idx, total);
    return {
      phase: "core",
      phaseTurns: idx + 1,
      turns: (ctx.turns || 0) + 1,
      questionIndex: idx + 1,
      questionPlan: newPlan,
      questionStartedAt: new Date(),
      transcript: [...baseTranscript, { role: "robot", content: nextQuestion.prompt, category: nextQuestion.category, questionIndex: idx + 1, timestamp: now }],
      scores: ctx.scores || [],
      answerEvaluations: answers,
      askedQuestions: newPlan.map((q) => q.prompt),
      action: "skip_question",
      response: `${response} ${nextQuestion.prompt}`,
      done: false,
      advance: true,
      evaluationSummary: null,
      aiRecommendation: null,
    };
  }

  // Any meaningful non-conversational response is treated as an answer.
  // Correctness affects the score, not whether the interview advances.
  const transcript = [...(ctx.transcript || []), {
    role: "candidate",
    content: safeAnswer || "[No answer provided]",
    intent: "answer",
    ...(unclearSpeech ? { unclearSpeech: true } : {}),
    category: question?.category,
    questionIndex: idx,
    timedOut,
    timeoutReason: timedOut ? timeoutReason : null,
    timestamp: nowIso(),
  }];

  const isLast = idx + 1 >= total;

  // Score the answer and write the next question at the same time to keep the wait short.
  const scorePromise = safeAnswer
    ? scoreAnswer(ctx, safeAnswer, question)
    : Promise.resolve({
        score: 0, skills: 0, communication: 0, technical: 0,
        relevance: 0, clarity: 0, depth: 0, evidence: 0,
        note: unclearSpeech
          ? "No clear spoken answer was detected in the recording."
          : "No answer was received before the configured time limit.",
      });
  const nextPromise = isLast ? Promise.resolve(null) : resolveNextQuestion({ ...ctx, transcript }, plan, safeAnswer, idx, total);
  const [feedback, next] = await Promise.all([scorePromise, nextPromise]);

  const scores = [...(ctx.scores || []), feedback.score];
  const answers = [...(ctx.answerEvaluations || []), {
    questionIndex: idx,
    category: question?.category,
    question: question?.prompt,
    questionType: question?.type || "planned",
    answer: safeAnswer,
    timedOut,
    skipped: false,
    ...feedback,
  }];

  if (isLast) {
    const closing = "Thank you. That completes your interview. Your responses have been recorded successfully. Please wait for the results while the hiring team reviews your responses.";
    return concludeResult({
      transcript: [...transcript, { role: "robot", content: closing, timestamp: nowIso() }],
      scores, answers, newPlan: plan, response: closing, feedbackScore: feedback.score,
    });
  }

  const nextQuestion = next.question;
  return {
    phase: "core",
    phaseTurns: idx + 1,
    turns: (ctx.turns || 0) + 1,
    questionIndex: idx + 1,
    questionPlan: next.plan,
    questionStartedAt: new Date(),
    transcript: [...transcript, {
      role: "robot",
      content: nextQuestion.prompt,
      category: nextQuestion.category,
      questionType: nextQuestion.type,
      questionIndex: idx + 1,
      timestamp: nowIso(),
    }],
    scores,
    answerEvaluations: answers,
    askedQuestions: next.plan.map((q) => q.prompt),
    action: "ask_question",
    response: nextQuestion.prompt,
    score: feedback.score,
    done: false,
    advance: true,
    evaluationSummary: null,
    aiRecommendation: null,
  };
};

export { scoreAnswer };
