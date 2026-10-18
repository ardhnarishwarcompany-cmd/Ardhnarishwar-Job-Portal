import { ollamaChat } from "./ollamaClient.js";
import { groqChat, isGroqConfigured } from "./groqClient.js";

export const CHAT_INTENTS = [
  "JOB_SEARCH",
  "JOB_RECOMMENDATION",
  "JOB_MARKET",
  "SALARY",
  "SKILLS",
  "SKILL_GAP",
  "CAREER_GUIDANCE",
  "LEARNING_ROADMAP",
  "RESUME_HELP",
  "RESUME_IMPROVEMENT",
  "INTERVIEW",
  "COMPANY_INFO",
  "JOB_DESCRIPTION",
  "APPLICATION_STATUS",
  "PROFILE_SKILLS",
  "GENERAL_CONVERSATION",
  "CLARIFICATION",
];

// Intents that need a logged-in user for personalised data.
export const AUTH_REQUIRED_INTENTS = [
  "JOB_RECOMMENDATION",
  "APPLICATION_STATUS",
  "PROFILE_SKILLS",
  "SKILL_GAP",
  "RESUME_HELP",
  "RESUME_IMPROVEMENT",
];

const AMBIGUOUS_CONFIDENCE = 70;

const ROLE_TERMS = [
  "ai developer", "ai engineer", "ml engineer", "machine learning engineer", "machine learning developer",
  "data scientist", "data analyst", "data engineer", "business analyst", "analytics engineer",
  "full stack developer", "fullstack developer", "full stack engineer", "frontend developer", "front end developer",
  "backend developer", "back end developer", "software developer", "software engineer", "web developer",
  "mobile developer", "android developer", "ios developer", "flutter developer", "devops engineer",
  "cloud engineer", "site reliability engineer", "sre", "qa engineer", "test engineer", "sdet",
  "security engineer", "cybersecurity analyst", "network engineer", "product manager", "project manager",
  "business development manager", "sales executive", "account executive", "digital marketing executive",
  "content writer", "technical writer", "graphic designer", "ui ux designer", "ux designer", "ui designer",
  "hr executive", "recruiter", "data entry operator", "customer support executive", "operations analyst",
  "react developer", "angular developer", "vue developer", "node developer", "node js developer",
  "java developer", "python developer", "dotnet developer", ".net developer", "c sharp developer",
  "c plus plus developer", "cpp developer", "golang developer", "go developer", "rust developer",
  "php developer", "ruby developer", "swift developer", "kotlin developer", "scala developer",
  "r developer", "matlab developer", "sap developer", "etl developer", "power bi developer",
  "tableau developer", "machine learning", "deep learning", "generative ai", "devops", "cybersecurity",
  "digital marketing", "software testing", "web development", "app development", "ui/ux design",
];
const SKILL_TERMS = [
  "python", "java", "javascript", "typescript", "react", "node.js", "node", "angular", "vue", "svelte",
  "html", "css", "sass", "tailwind", "next.js", "nuxt", "redux", "django", "flask", "fastapi",
  "spring boot", "spring", "express", "nestjs", "php", "laravel", "ruby on rails", "rails", "dotnet",
  ".net", "c#", "c++", "javaScript", "golang", "rust", "kotlin", "swift", "scala", "r", "matlab",
  "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "kafka", "rabbitmq", "graphql",
  "rest", "restful", "microservices", "git", "github", "gitlab", "jenkins", "ci/cd", "docker",
  "kubernetes", "terraform", "ansible", "aws", "azure", "gcp", "google cloud", "linux", "nginx",
  "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras",
  "scikit-learn", "pandas", "numpy", "llm", "langchain", "rag", "prompt engineering", "llamaindex",
  "tableau", "power bi", "powerbi", "excel", "statistics", "spark", "hadoop", "kafka streams",
  "selenium", "cypress", "playwright", "jest", "pytest", "junit", "postman", "figma", "blender",
];

const CITY_TERMS = [
  "bangalore", "bengaluru", "mumbai", "delhi", "new delhi", "noida", "hyderabad", "chennai",
  "pune", "kolkata", "gurgaon", "gurugram", "noida", "ahmedabad", "jaipur", "indore", "kochi",
  "coimbatore", "chandigarh", "lucknow", "bhopal", "patna", "nagpur", "visakhapatnam", "thiruvananthapuram",
  "london", "dubai", "singapore", "new york", "san francisco", "sydney", "melbourne", "toronto",
  "berlin", "germany", "uk", "united states", "usa", "canada", "australia", "ireland", "netherlands",
];

const EXPERIENCE_TERMS = [
  "fresher", "entry level", "entry-level", "beginner", "junior", "mid level", "mid-level",
  "intermediate", "senior", "lead", "principal", "staff", "manager", "intern", "internship",
];

const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsTerm = (text, term) => new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(term)}([^a-z0-9+#.]|$)`, "i").test(text);

// ─── Rule table (weighted, evaluated in priority order) ───────────────────────
// Specific intents carry a high weight so that a generic catch-all pattern such
// as "what is ..." can never outrank a real intent.
const INTENT_WEIGHT = {
  APPLICATION_STATUS: 3,
  COMPANY_INFO: 3,
  RESUME_IMPROVEMENT: 3,
  RESUME_HELP: 3,
  PROFILE_SKILLS: 3,
  SKILL_GAP: 3,
  SKILLS: 3,
  JOB_MARKET: 3,
  SALARY: 3,
  JOB_RECOMMENDATION: 3,
  JOB_SEARCH: 3,
  JOB_DESCRIPTION: 3,
  CAREER_GUIDANCE: 3,
  LEARNING_ROADMAP: 3,
  INTERVIEW: 3,
  CLARIFICATION: 3,
  GENERAL_CONVERSATION: 1,
};

const RULES = [
  {
    intent: "APPLICATION_STATUS",
    patterns: [
      /\bmy application status\b/,
      /\bapplication status\b/,
      /\bstatus of my applications?\b/,
      /\bwhere did i apply\b/,
      /\bwhich (jobs?|companies) (did i|have i) applied\b/,
      /\bapplications? (i|we) (have|has) (made|submitted)\b/,
      /\bpending applications?\b/,
      /\bcheck my applications?\b/,
    ],
  },
  {
    intent: "COMPANY_INFO",
    patterns: [
      /\btell me about\b/,
      /\babout (the )?(company|employer|startup|firm|organisation|organization)\b/,
      /\bcompany (info|details|profile|overview)\b/,
      /\bwhat does [a-z0-9 .&'-]+ (do|offer|stand for)\b/,
      /\bdetails (of|about) [A-Z]/,
      /\bhow (is|are) [A-Z][\w.& ]{2,30} (as a (company|employer)|reputation|company)\b/,
      /\bwork at [A-Z]/,
    ],
  },
  {
    intent: "RESUME_IMPROVEMENT",
    patterns: [
      /\bats\b/,
      /\bresume (score|review|critique|feedback|check|rating)\b/,
      /\b(improve|optimi[sz]e|fix) (my |the )?(resume|cv) (for )?(ats|keyword|matching)\b/,
      /\bwhy (is|are) (my |the )?resume not matching\b/,
      /\bmake (my |the )?(resume|cv) (ats|recruiter) friendly\b/,
    ],
  },
  {
    intent: "RESUME_HELP",
    patterns: [
      /\b(help|how) (do i|to|can i) (write|build|create|make|improve|fix|prepare) (my |a |an |the )?(resume|cv)\b/,
      /\b(improve|rewrite|write|build|create|fix|prepare) (my |our |a |an |the )?(resume|cv)\b/,
      /\bresume (help|tips|advice|feedback|rewrite|writing)\b/,
      /\b(cv|resume) (help|tips|advice|feedback|rewrite)\b/,
      /\bhelp me with (my )?(resume|cv|profile)\b/,
      /\bsummary section\b/,
      /\bcover letter\b/,
    ],
  },
  {
    intent: "PROFILE_SKILLS",
    patterns: [
      /\bmy profile\b/,
      /\b(improve|complete|update) my profile\b/,
      /\b(what|which) skills (do i have|are on)\b/,
      /\bskills on my (profile|account)\b/,
      /\b(add|update) (my )?skills\b/,
    ],
  },
  {
    intent: "SKILL_GAP",
    patterns: [
      /\bskill gap\b/,
      /\b(missing|gap) (skills?)\b/,
      /\bam i (ready|qualified|eligible)\b/,
      /\bcompare (my |the )?(resume|cv|profile) (with|to|against)\b/,
      /\b(match|compare) (my |the )?(resume|cv|skills) (with|to|against) (this|the|that|a|an)? ?(job|jd|description|role|posting)\b/,
      /\bwhat (skills )?(do i|am i) (still )?(need|missing)\b/,
      /\bdo i (have|need) all (the )?skills\b/,
    ],
  },
  {
    intent: "SKILLS",
    patterns: [
      /\bwhat skills\b/,
      /\bwhich skills\b/,
      /\bskills? (do i|should i|to) (need|learn|require|have|know)\b/,
      /\bskills? (needed|required|necessary) (for|to|to be)\b/,
      /\b(learn|learning) (which|what) skills\b/,
      /\bwhat (should i|do i) learn\b/,
      /\bwhat (technology|technologies|tech stack|stack|tools)\b/,
      /\bskills? for (a|an|the)? ?[a-z+#.]+/,
    ],
  },
  {
    intent: "JOB_MARKET",
    patterns: [
      /\bin demand\b/,
      /\b(job|market|hiring) (market|trend|trends|outlook|growth)\b/,
      /\bmarket (trend|trends|outlook|growth|share|size)\b/,
      /\b(hiring|recruitment) trend\b/,
      /\bgrowing (roles?|fields?|demand)\b/,
      /\bfuture (of|for) (jobs?|roles?|careers?)\b/,
      /\bhow is the .*(market|industry|field)\b/,
      /\bindustry (outlook|trends?)\b/,
    ],
  },
  {
    intent: "SALARY",
    patterns: [
      /\bsalary\b/,
      /\bcompensation\b/,
      /\bpay (scale|range|check)\b/,
      /\bhow much (do|should|would) (i|they|we) (get|earn|make|be paid)\b/,
      /\b(ctc|ctc range|in hand|per annum|per month|paycheck)\b/,
      /\bwhat (package|pay)\b/,
      /\bexpected (salary|pay)\b/,
    ],
  },
  {
    intent: "JOB_RECOMMENDATION",
    patterns: [
      /\brecommend (some )?(jobs?|roles?|companies)\b/,
      /\b(jobs?|roles?|openings?) (that )?(match|fit|suit) (my|our)\b/,
      /\b(match|fit) (my|our) (skills|profile)\b/,
      /\bsuitable (jobs?|roles?)\b/,
      /\bjobs? for me\b/,
      /\bbased on my (profile|skills)\b/,
      /\bsuggest (some )?(jobs?|roles?)\b/,
      /\bshow (my )?(recommended|suitable) (jobs?|roles?)\b/,
    ],
  },
  {
    intent: "JOB_SEARCH",
    patterns: [
      /\b(find|search|show|list|browse|look for|get|give|display)\b[^?!.]*\b(jobs?|vacancies|openings?|positions?|roles?)\b/,
      /\b(jobs?|vacancies|openings?|positions?)\b[^?!.]*\b(available|open|listed|hiring|vacant)\b/,
      /\bhiring (for|in)\b/,
      /\bapply (for|to)\b/,
      /\bjob (opening|listings?|search|board)\b/,
    ],
  },
  {
    intent: "JOB_DESCRIPTION",
    patterns: [
      /\bjob description\b/,
      /\banalyze (this|the) (jd|job description|posting)\b/,
      /\bexplain (this|the) (jd|job description|posting|role)\b/,
      /\b(what|which) (skills|requirements) (does|do) (this|the) (job|role|posting) (require|need)\b/,
      /\bwhat does (this|the) (job|role) (require|need|involve)\b/,
      /\bjd\s*[:=]/,
    ],
  },
  {
    intent: "CAREER_GUIDANCE",
    patterns: [
      /\bcareer (path|paths|guidance|advice|options?|choice|in)\b/,
      /\b(how (do|can|should) i become|how (do|can|should) (i )?(get|start) (in)?to)\b/,
      /\b(should i (become|pursue|choose|switch|go for)|which (role|career|field|domain|track) should i)\b/,
      /\b(career|switching|transition)(ing)? (from|to|into)\b/,
      /\b(is|are) (a|an) .{2,30} (career|role|job) (good|worth|right) (for me|option)?\b/,
      /\bafter (my )?(graduation|graduating|degree|b\.?tech|bca|b\.?sc|mca|12th|college)\b/,
      /\b(is|are) .{2,25} (a|an) (good|right|best) (career|field|option|role)\b/,
    ],
  },
  {
    intent: "LEARNING_ROADMAP",
    patterns: [
      /\broad ?map\b/,
      /\b(learning|study|training) (plan|path|order)\b/,
      /\b(study|training) plan\b/,
      /\bcurriculum\b/,
      /\bwhat (should i|do i|to) learn\b/,
      /\bwhat (should i|do i) learn (first|next)\b/,
      /\b(where|how) (do i|should i) (start|begin)\b/,
      /\b(learn|learning) (first|next) (step|thing)?s?\b/,
      /\bstep by step\b/,
      /\bhow long (will it take|to learn|does it take)\b/,
    ],
  },
  {
    intent: "INTERVIEW",
    patterns: [
      /\binterview (prep|preparation|question|questions|tips|help|process)\b/,
      /\b(prep|prepare|revision) (me |for |my )?(interview|interviews)\b/,
      /\bmock interview\b/,
      /\bhow (do|can) i (crack|ace|prepare for) (an? )?interview\b/,
      /\binterview (in|on) \d/,
      /\bapplicant tracking interview\b/,
    ],
  },
  {
    intent: "CLARIFICATION",
    patterns: [
      /^(help|assist) me[!.?]*$/,
      /^(i (need|want) )?(help|guidance|advice|assistance)( me)?[!.?]*$/,
      /^(what|how|where) (do|can|should) i do[?!. ]*$/,
      /^(help|what|how)\b[^?!.]*$/,
      /^(i (want|need) (a )?job)$/,
    ],
  },
  {
    intent: "GENERAL_CONVERSATION",
    patterns: [
      /^(hi|hey|hello|yo|hola|namaste|good (morning|afternoon|evening))\b/,
      /^(thanks|thank you|thx|ok|okay|k|cool|nice|great|awesome|got it|understood)\b/,
      /\bhow are you\b/,
      /\bwho are you\b/,
      /\bwhat can you (do|help)\b/,
      /\bardhnarishwar\b/,
      /\bwhat is ardhnarishwar\b/,
      /\brecruweb\b/,
      /\bwhat is recruweb\b/,
      /\b(what|what's|what is) (an?|the) [a-z ]{3,40}\??$/,
      /\bwhat is [a-z ]{3,40}\??$/,
      /\bexplain [a-z ]{3,60}\??$/,
      /\b(placement|placements|campus drive|off campus|aptitude round)\b/,
      /\bhow (should|do) i prepare\b/,
    ],
  },
];

const followUpMarkers = [
  /\b(this|that|these|those|it|they)\b/,
  /\b(first|next|then|also|more|else)\b/,
  /\b(as|like) (well|that|mentioned)\b/,
  /\bsame\b/,
  /\bfor (it|that|this)\b/,
];

const scoreRules = (text) => {
  let best = null;

  for (const rule of RULES) {
    let matches = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) matches += 1;
    }
    if (!matches) continue;

    const score = matches * (INTENT_WEIGHT[rule.intent] || 1);
    if (!best || score > best.score) best = { intent: rule.intent, score };
  }

  if (!best) return null;
  return { intent: best.intent, confidence: Math.min(96, 72 + (best.score - 1) * 6) };
};

export const extractEntities = (text, options = {}) => {
  const lower = clean(text).toLowerCase();
  const entities = {};

  const role = ROLE_TERMS.find((term) => containsTerm(lower, term));
  if (role) {
    entities.role = role;
    entities.targetRole = role;
  }

  const location = CITY_TERMS.find((term) => containsTerm(lower, term));
  if (location) entities.location = location.replace(/\b\./g, "").trim();

  if (/\b(remote|work from home|wfh)\b/.test(lower)) entities.location = "remote";
  else if (/\bhybrid\b/.test(lower)) entities.jobType = "Hybrid";
  else if (/\b(on-?site)\b/.test(lower)) entities.jobType = "On-site";

  const years = lower.match(/(\d+)\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/);
  if (years) entities.experience = `${years[1]} years`;
  else {
    const level = EXPERIENCE_TERMS.find((term) => containsTerm(lower, term));
    if (level) entities.experience = level;
  }

  const skills = SKILL_TERMS.filter((skill) => containsTerm(lower, skill))
    .map((skill) => (skill === "node" ? "Node.js" : skill === "r" ? "R" : skill));
  if (skills.length) entities.skills = [...new Set(skills)].slice(0, 8);

  if (/\b(job description|jd)\b[^?!.]*[:=]/i.test(lower)) entities.hasJobDescription = true;

  const company = extractCompanyQuery(text, options.intent);
  if (company) entities.company = company;

  return entities;
};

const COMPANY_QUERY_STOP_WORDS = new Set([
  "i", "we", "you", "what", "how", "why", "who", "where", "when", "tell", "show", "find", "search",
  "hello", "hi", "hey", "my", "the", "a", "an", "please", "help", "there", "any", "some", "this", "that",
  "is", "are", "was", "does", "do", "can", "should", "would", "salary", "resume", "cv", "career", "skills",
  "check", "improve", "prepare", "learn", "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "chennai",
  "pune", "kolkata", "gurgaon", "gurugram", "noida", "ahmedabad", "remote", "hybrid", "onsite", "on-site",
]);

const extractCompanyQuery = (message, intent) => {
  const text = clean(message);
  if (!text) return null;

  const explicit = text.match(
    /\b(?:tell me about|about|info (?:on|about)|details (?:of|about)|describe|what does|who is|worked at|working at|work at)\s+(?:the\s+)?([A-Za-z0-9][\w&.'-]*(?:\s+[A-Z0-9][\w&.'-]*){0,4}(?:\s+(?:Pvt|Ltd|Inc|LLP|LLC|Corp|Corporation|Co|Company|Limited|Technologies|Technology|Solutions|Services|Systems|Software|Labs|Group|India|Global)\b\.?)?)/i,
  );
  if (explicit) {
    const candidate = clean(explicit[1]).replace(/[?!,]+$/, "");
    if (candidate && candidate.length > 2 && !COMPANY_QUERY_STOP_WORDS.has(candidate.split(" ")[0].toLowerCase())) {
      return candidate;
    }
  }

  // A bare capitalised name is only trusted for company questions.
  if (intent && intent !== "COMPANY_INFO") return null;

  const capitalised = text.match(/\b([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){0,3}(?:\s+(?:Pvt|Ltd|Inc|LLP|LLC|Corp|Corporation)\.?)?)/);
  if (capitalised) {
    const candidate = clean(capitalised[1]).replace(/[?!.]+$/, "");
    const first = candidate.split(" ")[0].toLowerCase();
    if (candidate.length > 2 && !COMPANY_QUERY_STOP_WORDS.has(first)) return candidate;
  }

  return null;
};

const looksLikeFollowUp = (message) => {
  const lower = message.toLowerCase().trim();
  if (lower.split(/\s+/).length > 14) return false;
  return followUpMarkers.some((pattern) => pattern.test(lower));
};

const carryOverContext = (message, conversationHistory, entities, intent) => {
  const needsContext =
    !entities.role &&
    (looksLikeFollowUp(message) ||
      intent === "LEARNING_ROADMAP" ||
      intent === "SKILL_GAP" ||
      intent === "SKILLS");

  if (!needsContext) return entities;

  const previousUserMessages = conversationHistory
    .filter((msg) => msg?.from === "user" && msg?.text)
    .slice(-3)
    .map((msg) => msg.text);

  for (const previous of previousUserMessages.reverse()) {
    const previousEntities = extractEntities(previous);
    if (previousEntities.role) {
      return { ...entities, role: previousEntities.role, targetRole: previousEntities.role, roleFromContext: true };
    }
  }

  return entities;
};

const deterministicClassification = (message, conversationHistory) => {
  const text = clean(message).toLowerCase();
  const scored = scoreRules(text);
  let entities = extractEntities(message, { intent: scored?.intent });
  entities = carryOverContext(message, conversationHistory, entities, scored?.intent);

  if (!scored) {
    return { intent: "GENERAL_CONVERSATION", confidence: 0, entities, source: "none" };
  }

  return { ...scored, entities, source: "rules" };
};

const INTENT_GUIDE = `JOB_SEARCH=find or list jobs
JOB_RECOMMENDATION=personalised job suggestions from the profile
JOB_MARKET=market trends, in-demand skills, industry outlook
SALARY=pay, package or compensation questions
SKILLS=which skills to learn for a role or field
SKILL_GAP=compare own skills/resume with a job description
CAREER_GUIDANCE=career advice, which role to choose, how to become something
LEARNING_ROADMAP=learning order, roadmap or study plan
RESUME_HELP=write or improve a resume or CV
RESUME_IMPROVEMENT=ATS score, resume matching, recruiter feedback
INTERVIEW=interview preparation or mock interview
COMPANY_INFO=information about a specific company
JOB_DESCRIPTION=explain or analyse a job description or posting
APPLICATION_STATUS=own application status
PROFILE_SKILLS=own profile or skills
GENERAL_CONVERSATION=greetings, thanks or general knowledge questions`;

const ollamaClassificationPrompt = `You route messages for a job portal assistant. Reply with one JSON object only: {"intent":"NAME","confidence":0-100,"entities":{}}
Valid intents:
${INTENT_GUIDE}
Use entities role, location, experience, skills, company when they appear. If the message is a follow-up like "what should I learn first", reuse the topic from the recent conversation. If you truly cannot tell, use GENERAL_CONVERSATION.`;

const safeJsonParse = (raw) => {
  if (!raw) return null;
  const cleaned = String(raw)
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

// Deterministic rules handle the common cases. Ollama is only asked when the
// rules are not confident, and it only picks an intent - it never answers.
const ollamaClassification = async (message, conversationHistory) => {
  const history = conversationHistory
    .slice(-4)
    .filter((msg) => msg?.text)
    .map((msg) => ({ role: msg.from === "user" ? "user" : "assistant", content: msg.text }));

  const messages = [...history, { role: "user", content: message }];

  // 1. Try local Ollama
  try {
    const raw = await ollamaChat({
      system: ollamaClassificationPrompt,
      messages,
      maxTokens: 200,
      temperature: 0.1,
      json: true,
    });

    const parsed = safeJsonParse(raw);
    if (parsed?.intent && CHAT_INTENTS.includes(parsed.intent)) {
      return {
        intent: parsed.intent,
        confidence: Number(parsed.confidence) || 60,
        entities: parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {},
        source: "ollama",
      };
    }
  } catch (error) {
    console.warn("[chat] Ollama intent classification unavailable, checking Groq fallback:", error.message);
  }

  // 2. Try Groq API fallback
  if (isGroqConfigured()) {
    try {
      const raw = await groqChat({
        system: ollamaClassificationPrompt,
        messages,
        maxTokens: 200,
        temperature: 0.1,
        json: true,
      });

      const parsed = safeJsonParse(raw);
      if (parsed?.intent && CHAT_INTENTS.includes(parsed.intent)) {
        return {
          intent: parsed.intent,
          confidence: Number(parsed.confidence) || 60,
          entities: parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {},
          source: "groq",
        };
      }
    } catch (groqErr) {
      console.warn("[chat] Groq intent classification failed:", groqErr.message);
    }
  }

  return null;
};

export const classifyIntent = async (message, conversationHistory = []) => {
  const deterministic = deterministicClassification(message, conversationHistory);

  if (deterministic.source === "rules" && deterministic.confidence >= AMBIGUOUS_CONFIDENCE) {
    return deterministic;
  }

  const withOllama = await ollamaClassification(message, conversationHistory);
  if (!withOllama) {
    // Never dead-end: hand the message to the single response model with context.
    return { ...deterministic, intent: "GENERAL_CONVERSATION", confidence: 55, source: "fallback" };
  }

  const mergedEntities = carryOverContext(
    message,
    conversationHistory,
    { ...deterministic.entities, ...(withOllama.entities || {}) },
    withOllama.intent,
  );

  return { ...withOllama, entities: mergedEntities };
};
