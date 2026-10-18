import express from "express";
import axios from "axios";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { ollamaChat } from "../utils/ollamaClient.js";

const router = express.Router();

// In-memory file storage — no files written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// POST /api/ai/parse-pdf  — accepts multipart/form-data with field name "pdf"
// Returns { success: true, text: "..." }
router.post("/parse-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No PDF file uploaded." });
    if (req.file.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ success: false, message: "File must be a PDF." });
    }
    const data = await pdfParse(req.file.buffer);
    const text = data.text?.trim();
    if (!text)
      return res.status(422).json({
        success: false,
        message:
          "Could not extract any text from this PDF. It may be a scanned/image PDF.",
      });
    res.json({ success: true, text, pages: data.numpages });
  } catch (err) {
    console.error("PDF parse error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Failed to parse PDF: " + err.message });
  }
});

const asCleanString = (value) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeStringList = (value, fallback = []) => {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\n|;/)
      : fallback;

  return source
    .map((item) => asCleanString(String(item).replace(/^[-*•\s]+/, "")))
    .filter(Boolean);
};

const safeJsonParse = (raw) => {
  if (!raw) return null;
  // Strip markdown code fences: ```json ... ``` or ``` ... ```
  let cleaned = String(raw)
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

// Validate Resume Match result against expected schema
const validateResumeMatchResult = (result) => {
  if (!result || typeof result !== "object") return false;
  if (typeof result.score !== "number" || result.score < 0 || result.score > 100) return false;
  if (!Array.isArray(result.matchedSkills)) return false;
  if (!Array.isArray(result.missingSkills)) return false;
  if (!Array.isArray(result.partialMatch)) return false;
  if (!result.experience || typeof result.experience !== "object") return false;
  if (typeof result.experience.match !== "boolean") return false;
  if (typeof result.experience.required !== "string") return false;
  if (typeof result.experience.candidate !== "string") return false;
  if (!result.education || typeof result.education !== "object") return false;
  if (typeof result.education.match !== "boolean") return false;
  if (typeof result.education.required !== "string") return false;
  if (typeof result.education.candidate !== "string") return false;
  if (!Array.isArray(result.strengths)) return false;
  if (!Array.isArray(result.improvements)) return false;
  if (typeof result.summary !== "string") return false;
  if (!["Shortlist", "Consider", "Reject"].includes(result.recommendation)) return false;
  return true;
};

const normalizeJdDocument = (parsed = {}, brief = {}) => {
  const jobTitle = asCleanString(
    parsed.jobTitle || brief.jobTitle || "Job Title",
  );
  const companyName = asCleanString(brief.companyName || "Our Company");

  return {
    jobTitle,
    tagline: asCleanString(
      parsed.tagline || `Join ${companyName} as our next ${jobTitle}`,
    ),
    summary: asCleanString(
      parsed.summary ||
        `${jobTitle} role focused on delivering strong outcomes, cross-functional collaboration, and business impact.`,
    ),
    responsibilities: normalizeStringList(parsed.responsibilities).slice(0, 7),
    requiredQualifications: normalizeStringList(
      parsed.requiredQualifications || parsed.requirements,
    ).slice(0, 6),
    niceToHave: normalizeStringList(parsed.niceToHave).slice(0, 4),
    benefits: normalizeStringList(parsed.benefits).slice(0, 6),
    aboutCompany: asCleanString(
      parsed.aboutCompany ||
        brief.aboutCompany ||
        `${companyName} is building a strong team around quality execution, ownership, and customer impact.`,
    ),
    closingNote: asCleanString(
      parsed.closingNote ||
        `If this role matches your background and goals, we encourage you to apply.`,
    ),
  };
};

const buildFallbackJdDocument = (brief = {}) => {
  const companyName = asCleanString(brief.companyName || "Our Company");
  const jobTitle = asCleanString(brief.jobTitle || "Job Title");
  const department = asCleanString(brief.department || "Operations");
  const location = asCleanString(brief.location || "India");
  const employmentType = asCleanString(brief.employmentType || "Full-Time");
  const workMode = asCleanString(brief.workMode || "Hybrid");
  const skillList = normalizeStringList(brief.skills, [
    "Communication",
    "Collaboration",
    "Execution",
  ]);

  return {
    jobTitle,
    tagline: `Build what matters most as a ${jobTitle} at ${companyName}`,
    summary: `${companyName} is hiring a ${jobTitle} to support ${department} goals, drive execution, and contribute to business outcomes across teams. This role is ideal for a candidate who can work closely with stakeholders, deliver with ownership, and improve day-to-day performance in a ${workMode.toLowerCase()} ${employmentType.toLowerCase()} setting based in ${location}.`,
    responsibilities: [
      "Manage core responsibilities for the role with a strong focus on quality, speed, and accountability.",
      "Collaborate with cross-functional teams to deliver projects, processes, and operational outcomes on time.",
      "Monitor KPIs, identify gaps, and recommend practical improvements that drive measurable impact.",
      "Support smooth execution, documentation, and reporting across ongoing business activities.",
      "Communicate effectively with stakeholders and maintain a high standard of delivery across priorities.",
    ],
    requiredQualifications: [
      "Relevant experience in a similar role or domain.",
      "Strong communication, execution, and stakeholder management skills.",
      "Ability to prioritize work and manage multiple deliverables effectively.",
      "Comfortable working in a collaborative, fast-paced environment.",
      "Bachelor's degree or equivalent practical experience.",
    ],
    niceToHave: [
      ...skillList.slice(0, 3),
      "Experience in cross-functional or customer-facing work.",
    ],
    benefits: [
      "Competitive compensation and growth opportunities.",
      "Supportive team environment and learning-focused culture.",
      "Flexible work mode and healthy work-life balance.",
      "Exposure to high-impact business initiatives.",
      "Career development and mentorship support.",
    ],
    aboutCompany: `${companyName} is building a strong, people-first team focused on execution, innovation, and customer impact. We value ownership, quality, and collaboration and are looking for someone who can contribute meaningfully to our growth journey.`,
    closingNote: `If you are excited by ownership, collaboration, and impact, we encourage you to apply for the ${jobTitle} role at ${companyName}.`,
  };
};

const normalizeAtsResult = (result = {}) => {
  const breakdown = result.breakdown || {};
  const score = Number.isFinite(Number(result.score))
    ? Number(result.score)
    : 0;
  const safeKeywords = (arr) =>
    Array.isArray(arr)
      ? arr
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];

  const normalized = {
    score: Math.min(100, Math.max(0, score)),
    verdict:
      result.verdict ||
      (score >= 80
        ? "Strong ATS fit"
        : score >= 60
          ? "Good, needs polish"
          : "Needs improvement"),
    summary:
      result.summary ||
      result.feedback ||
      "Review the missing keywords and improve your resume structure for better ATS matching.",
    breakdown: {
      keywords: Number.isFinite(Number(breakdown.keywords))
        ? Number(breakdown.keywords)
        : Math.min(100, Math.max(0, score)),
      formatting: Number.isFinite(Number(breakdown.formatting))
        ? Number(breakdown.formatting)
        : Math.min(100, Math.max(0, score - 5)),
      sections: Number.isFinite(Number(breakdown.sections))
        ? Number(breakdown.sections)
        : Math.min(100, Math.max(0, score - 3)),
      impact: Number.isFinite(Number(breakdown.impact))
        ? Number(breakdown.impact)
        : Math.min(100, Math.max(0, score - 8)),
      readability: Number.isFinite(Number(breakdown.readability))
        ? Number(breakdown.readability)
        : Math.min(100, Math.max(0, score - 4)),
    },
    matchedKeywords: safeKeywords(
      result.matchedKeywords || result.matchedSkills,
    ),
    missingKeywords: safeKeywords(
      result.missingKeywords || result.missingSkills,
    ),
    strengths: Array.isArray(result.strengths)
      ? result.strengths.map((item) => String(item).trim()).filter(Boolean)
      : [],
    improvements: Array.isArray(result.improvements)
      ? result.improvements.map((item) => String(item).trim()).filter(Boolean)
      : [],
    feedback:
      result.feedback ||
      result.summary ||
      "Keep sections clear and add measurable achievements.",
  };

  if (!normalized.strengths.length && normalized.matchedKeywords.length) {
    normalized.strengths = [
      "Strong keyword coverage for the target role profile.",
    ];
  }
  if (!normalized.improvements.length && normalized.missingKeywords.length) {
    normalized.improvements = [
      `Add more of these keywords to align with the JD: ${normalized.missingKeywords.slice(0, 5).join(", ")}.`,
    ];
  }

  return normalized;
};

const buildLocalAtsResult = (resumeText, jobDescription = "") => {
  const text = (resumeText || "").toLowerCase();
  const jd = (jobDescription || "").toLowerCase();
  const words = text.match(/[a-z0-9+#.]+/g) || [];
  const sections = [
    { label: "summary", regex: /summary|profile|objective/ },
    { label: "experience", regex: /experience|employment|internship|projects/ },
    { label: "skills", regex: /skills|technical skills|tools/ },
    { label: "education", regex: /education|degree|university|college/ },
    { label: "contact", regex: /email|phone|linkedin|github|portfolio/ },
  ];

  const sectionScore = Math.round(
    (sections.filter((s) => s.regex.test(text)).length / sections.length) * 100,
  );
  const keywordCandidates = (jd.match(/[a-z0-9+#.]{4,}/g) || []).filter(
    (w) =>
      ![
        "with",
        "from",
        "that",
        "this",
        "into",
        "have",
        "your",
        "role",
      ].includes(w.toLowerCase()),
  );
  const jdKeywords = [...new Set(keywordCandidates)].slice(0, 18);
  const targetKeywords = jdKeywords.length
    ? jdKeywords
    : [
        "react",
        "javascript",
        "leadership",
        "sql",
        "api",
        "communication",
        "problem solving",
      ];
  const matchedKeywords = targetKeywords.filter((keyword) =>
    text.includes(keyword.toLowerCase()),
  );
  const missingKeywords = targetKeywords
    .filter((keyword) => !text.includes(keyword.toLowerCase()))
    .slice(0, 8);
  const hasNumbers =
    /\d+%|\d+\+|\d+x|increased|reduced|improved|optimized|saved/.test(text);
  const hasLinks = /linkedin|github|portfolio|https?:\/\//.test(text);
  const supportWords = words.length >= 250 ? 22 : words.length >= 120 ? 15 : 7;
  const keywordScore = Math.round(
    (matchedKeywords.length / Math.max(targetKeywords.length, 1)) * 100,
  );
  const formattingScore = hasLinks ? 92 : 78;
  const impactScore = hasNumbers ? 90 : 72;
  const readabilityScore = Math.min(
    100,
    Math.max(50, 70 + (words.length >= 200 ? 18 : 8)),
  );
  const score = Math.min(
    100,
    Math.max(
      20,
      Math.round(
        keywordScore * 0.38 +
          sectionScore * 0.22 +
          formattingScore * 0.15 +
          impactScore * 0.15 +
          readabilityScore * 0.1,
      ),
    ),
  );

  return {
    score,
    verdict:
      score >= 80
        ? "Strong ATS fit"
        : score >= 60
          ? "Good, needs polish"
          : "Needs improvement",
    summary: `This resume scores ${score}% against ATS expectations. It has ${matchedKeywords.length} matched terms and should improve its keyword alignment, measurable impact, and readability to maximize screening results.`,
    breakdown: {
      keywords: Math.min(100, Math.max(0, keywordScore)),
      formatting: formattingScore,
      sections: sectionScore,
      impact: impactScore,
      readability: readabilityScore,
    },
    matchedKeywords: matchedKeywords.slice(0, 12),
    missingKeywords: missingKeywords,
    strengths: [
      matchedKeywords.length
        ? `Strong alignment on ${matchedKeywords.slice(0, 4).join(", ")}.`
        : "Resume contains role-relevant keywords and a clear experience narrative.",
      hasNumbers
        ? "Your achievements include measurable impact and quantifiable outcomes."
        : "The resume would benefit from adding measurable outcomes to strengthen credibility.",
      hasLinks
        ? "Professional contact links are included for recruiter verification."
        : "Add a LinkedIn, GitHub, or portfolio link to improve professional validation.",
    ],
    improvements: [
      missingKeywords.length
        ? `Add these missing JD keywords: ${missingKeywords.slice(0, 5).join(", ")}.`
        : "Keep the keyword density strong and maintain a natural writing style.",
      "Use clear section headings like Summary, Experience, Skills, Education, and Projects.",
      hasNumbers
        ? "Keep highlighting measurable achievements with numbers, percentages, or business outcomes."
        : "Add quantified results such as revenue, growth, time saved, or adoption improvements.",
      "Simplify formatting and ensure uniform spacing so ATS parsers read the document cleanly.",
    ],
    feedback:
      "Improve keyword coverage and measurable impact while keeping the formatting simple and ATS-safe.",
};
  };

// ============================================================
// LOCAL RESUME MATCH FALLBACK (deterministic, no LLM)
// Used when Ollama/Groq is unavailable or returns invalid output.
// Produces the same response schema as the LLM endpoint.
// ============================================================
const buildLocalResumeMatch = (jdText, resumeText) => {
  const jd = (jdText || "").toLowerCase();
  const resume = (resumeText || "").toLowerCase();

  // Known technology skills for normalization
  const knownSkills = [
    // Languages
    "python", "javascript", "typescript", "java", "c#", "c++", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab",
    // Web frameworks
    "django", "flask", "fastapi", "express", "nestjs", "spring", "spring boot", "laravel", "rails", "asp.net", "gin", "echo",
    // Frontend
    "react", "vue", "angular", "svelte", "next.js", "nuxt", "remix", "redux", "zustand", "mobx", "tanstack query", "apollo",
    // Databases
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra", "dynamodb", "elasticsearch", "mariadb", "oracle", "sql server",
    // ORMs/Query builders
    "sqlalchemy", "prisma", "typeorm", "sequelize", "mongoose", "drizzle", "knex", "entity framework", "hibernate", "jpa",
    // Cloud/DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform", "ansible", "helm", "argo", "jenkins", "github actions", "gitlab ci", "circleci", "travis", "ci/cd",
    // Infrastructure
    "linux", "nginx", "apache", "prometheus", "grafana", "elk", "datadog", "new relic", "sentry",
    // Other
    "git", "rest", "restful", "graphql", "grpc", "microservices", "serverless", "kafka", "rabbitmq", "celery", "sidekiq", "testing", "jest", "pytest", "junit", "cypress", "playwright", "selenium",
  ];

  // Normalize and extract skills from text
  const extractSkills = (text) => {
    const found = new Set();
    for (const skill of knownSkills) {
      // Word boundary match for the skill
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (regex.test(text)) {
        // Normalize common variations
        const normalized = skill
          .replace(/\bpostgresql\b/, "PostgreSQL")
          .replace(/\bpostgres\b/, "PostgreSQL")
          .replace(/\bnode\.js\b/, "Node.js")
          .replace(/\bnext\.js\b/, "Next.js")
          .replace(/\bci\/cd\b/, "CI/CD")
          .replace(/\bkubernetes\b/, "Kubernetes")
          .replace(/\bk8s\b/, "Kubernetes")
          .replace(/\bgcp\b/, "GCP")
          .replace(/\baws\b/, "AWS")
          .replace(/\bapi\b/, "API")
          .replace(/\brest\b/, "REST")
          .replace(/\bgrpc\b/, "gRPC")
          .replace(/\bhtml\b/, "HTML")
          .replace(/\bcss\b/, "CSS")
          .replace(/\bjs\b/, "JavaScript")
          .replace(/\bts\b/, "TypeScript")
          .replace(/\bdb\b/, "Database")
          .replace(/\bui\b/, "UI")
          .replace(/\bux\b/, "UX")
          .replace(/\bml\b/, "Machine Learning")
          .replace(/\bai\b/, "AI")
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        found.add(normalized);
      }
    }
    return [...found].sort();
  };

  const jdSkills = extractSkills(jd);
  const resumeSkills = extractSkills(resume);

  // Matched skills: explicitly in BOTH
  const matchedSkills = jdSkills.filter((s) => resumeSkills.includes(s));

  // Missing skills: in JD but not in resume
  const missingSkills = jdSkills.filter((s) => !resumeSkills.includes(s));

  // Partial match: adjacent/related technologies (simple heuristic)
  const partialMatch = [];
  const adjacencyMap = {
    "Flask": ["Django", "FastAPI"],
    "Django": ["Flask", "FastAPI"],
    "FastAPI": ["Flask", "Django"],
    "Express": ["NestJS", "Fastify"],
    "NestJS": ["Express", "Fastify"],
    "MySQL": ["PostgreSQL", "MariaDB"],
    "PostgreSQL": ["MySQL", "MariaDB"],
    "MongoDB": ["Cassandra", "DynamoDB"],
    "Redis": ["Memcached", "KeyDB"],
    "React": ["Vue", "Angular", "Svelte"],
    "Vue": ["React", "Angular", "Svelte"],
    "Angular": ["React", "Vue", "Svelte"],
    "AWS": ["Azure", "GCP"],
    "Azure": ["AWS", "GCP"],
    "GCP": ["AWS", "Azure"],
    "Jest": ["Vitest", "Mocha", "Cypress", "Playwright"],
    "Vitest": ["Jest", "Mocha", "Cypress", "Playwright"],
    "SQLAlchemy": ["Prisma", "TypeORM", "Django ORM"],
    "Prisma": ["SQLAlchemy", "TypeORM", "Django ORM"],
    "TypeORM": ["Prisma", "SQLAlchemy", "Django ORM"],
  };

  for (const skill of resumeSkills) {
    if (!matchedSkills.includes(skill)) {
      const related = adjacencyMap[skill] || [];
      for (const rel of related) {
        if (jdSkills.includes(rel)) {
          partialMatch.push(`has ${skill}, JD requires ${rel}`);
          break;
        }
      }
    }
  }

  // Experience extraction (conservative)
  const extractYears = (text) => {
    const patterns = [
      /(\d+)\+?\s*years?\s*(?:of\s*)?experience/i,
      /(\d+)\+?\s*years?\s*(?:in|with)/i,
      /experience\s*:?\s*(\d+)\+?\s*years?/i,
      /worked\s+(?:for\s+)?(\d+)\+?\s*years?/i,
      /(\d+)\+?\s*yrs?\s*exp/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  };

  const jdYears = extractYears(jdText) || null;
  const resumeYears = extractYears(resumeText) || null;

  let experienceMatch = false;
  let experienceRequired = jdYears ? `${jdYears}+ years` : "Not specified in JD";
  let experienceCandidate = resumeYears ? `${resumeYears} years` : "Not specified in resume";

  if (jdYears !== null && resumeYears !== null) {
    experienceMatch = resumeYears >= jdYears;
  } else if (jdYears === null && resumeYears !== null) {
    experienceMatch = true; // JD doesn't specify, candidate has some
  } else {
    experienceMatch = false;
  }

  // Education extraction (conservative)
  const degreePatterns = [
    { pattern: /\b(ph\.?d\.?|doctorate)\b/i, level: "PhD" },
    { pattern: /\b(m\.?s\.?|master(?:'s)?|msc|m\.?tech)\b/i, level: "Master's" },
    { pattern: /\b(b\.?s\.?|bachelor(?:'s)?|bsc|b\.?tech|b\.?e\.?)\b/i, level: "Bachelor's" },
    { pattern: /\b(associate|diploma)\b/i, level: "Associate/Diploma" },
  ];

  const extractEducation = (text) => {
    for (const { pattern, level } of degreePatterns) {
      if (pattern.test(text)) return level;
    }
    return "Not specified";
  };

  const jdEducation = extractEducation(jdText);
  const resumeEducation = extractEducation(resumeText);

  // Education match: same or higher level
  const degreeHierarchy = { "PhD": 4, "Master's": 3, "Bachelor's": 2, "Associate/Diploma": 1, "Not specified": 0 };
  const educationMatch = degreeHierarchy[resumeEducation] >= degreeHierarchy[jdEducation];

  let educationRequired = jdEducation;
  let educationCandidate = resumeEducation;

  // Score calculation
  const skillMatchRatio = jdSkills.length > 0 ? matchedSkills.length / jdSkills.length : 0;
  const skillScore = Math.round(skillMatchRatio * 100);

  // Experience component (0-100)
  let experienceScore = 0;
  if (jdYears !== null && resumeYears !== null) {
    experienceScore = Math.min(100, Math.round((resumeYears / jdYears) * 100));
  } else if (jdYears === null && resumeYears !== null) {
    experienceScore = 70; // JD doesn't specify, candidate has some
  } else {
    experienceScore = 30;
  }

  // Education component (0-100)
  const educationScore = educationMatch ? 100 : 0;

  // Weighted score: skills 50%, experience 30%, education 20%
  const finalScore = Math.min(100, Math.max(0, Math.round(skillScore * 0.5 + experienceScore * 0.3 + educationScore * 0.2)));

  // Recommendation
  let recommendation = "Reject";
  if (finalScore >= 70) recommendation = "Shortlist";
  else if (finalScore >= 40) recommendation = "Consider";

  // Strengths and improvements
  const strengths = [];
  if (matchedSkills.length > 0) strengths.push(`Strong match on ${matchedSkills.slice(0, 3).join(", ")}`);
  if (experienceMatch && resumeYears) strengths.push(`${resumeYears} years experience meets requirement`);
  if (educationMatch && resumeEducation !== "Not specified") strengths.push(`${resumeEducation} degree meets requirement`);
  if (matchedSkills.length >= 5) strengths.push("Broad technology alignment with job requirements");
  if (strengths.length === 0) strengths.push("Baseline alignment with some job requirements");

  const improvements = [];
  if (missingSkills.length > 0) improvements.push(`Add missing skills: ${missingSkills.slice(0, 3).join(", ")}`);
  if (!experienceMatch && jdYears) improvements.push(`Experience gap: JD requires ${jdYears}+ years${resumeYears ? `, resume shows ${resumeYears}` : ""}`);
  if (!educationMatch && jdEducation !== "Not specified") improvements.push(`Education: JD prefers ${jdEducation}, resume has ${resumeEducation}`);
  if (matchedSkills.length < 3) improvements.push("Strengthen core technology alignment with the role");
  if (improvements.length === 0) improvements.push("No major gaps identified");

  // Summary
  const summaryParts = [];
  if (matchedSkills.length > 0) {
    summaryParts.push(`Candidate matches ${matchedSkills.length} of ${jdSkills.length} required skills (${matchedSkills.slice(0, 3).join(", ")}${matchedSkills.length > 3 ? ", ..." : ""}).`);
  } else {
    summaryParts.push("No direct skill matches found with the job requirements.");
  }
  if (jdYears && resumeYears) {
    summaryParts.push(`Experience: ${resumeYears} years vs ${jdYears}+ required.`);
  } else if (jdYears && !resumeYears) {
    summaryParts.push("Experience not clearly specified in resume.");
  }
  if (educationMatch) {
    summaryParts.push(`Education meets requirement (${resumeEducation}).`);
  } else if (jdEducation !== "Not specified") {
    summaryParts.push(`Education gap: ${jdEducation} preferred, ${resumeEducation} found.`);
  }
  const summary = summaryParts.join(" ") || "Limited alignment with job requirements.";

  return {
    score: finalScore,
    matchedSkills: matchedSkills.slice(0, 10),
    missingSkills: missingSkills.slice(0, 10),
    partialMatch: partialMatch.slice(0, 5),
    experience: {
      required: experienceRequired,
      candidate: experienceCandidate,
      match: experienceMatch,
    },
    education: {
      required: educationRequired,
      candidate: educationCandidate,
      match: educationMatch,
    },
    strengths,
    improvements,
    summary,
    recommendation,
  };
};

  // POST /api/ai/job-description  { title, skills, experience, jobType }
router.post("/job-description", async (req, res) => {
  try {
    const { title, skills, experience, jobType } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "Job title is required" });

    const content = await ollamaChat({
      system: "You write clean, professional job descriptions for a job portal. Output ONLY the formatted job description containing clear headings and bulleted content. Do NOT include any conversational introduction, preamble, postscript, or thinking process. Output in markdown style headings (e.g. ## Job Title, ## Key Responsibilities, ## Required Qualifications) and points.",
      messages: [{
        role: "user",
        content: `Write a job description for the role "${title}".
Required skills: ${skills || "not specified"}.
Experience level: ${experience || "not specified"}.
Job type: ${jobType || "not specified"}.

Include:
- A brief introduction (2-3 sentences overview).
- Heading "## Key Responsibilities" followed by 4-6 bullet points of responsibilities using "-".
- Heading "## Required Qualifications" followed by 3-5 bullet points of qualifications using "-".
- Heading "## Working Requirements & Experience" followed by experience and working style details.

Keep the text professional, clean, and concise, and under 250 words.`
      }],
      maxTokens: 600,
      temperature: 0.2,
    });

    res.json({ success: true, description: content });
  } catch (error) {
    console.error("[/job-description] Ollama call failed, generating structured fallback description:", error.code || error.message);
    const fallbackDoc = buildFallbackJdDocument({
      jobTitle: req.body.title,
      skills: req.body.skills,
      experienceLevel: req.body.experience,
      employmentType: req.body.jobType,
    });

    const fallbackText = `## ${fallbackDoc.jobTitle}\n\n${fallbackDoc.summary}\n\n## Key Responsibilities\n${fallbackDoc.responsibilities.map((r) => "- " + r).join("\n")}\n\n## Required Qualifications\n${fallbackDoc.requiredQualifications.map((q) => "- " + q).join("\n")}\n\n## Working Requirements & Experience\n- Experience Level: ${req.body.experience || "Not specified"}\n- Job Type: ${req.body.jobType || "Full-Time"}\n- Skills: ${req.body.skills || "Not specified"}\n\n## Benefits & Growth\n${fallbackDoc.benefits.map((b) => "- " + b).join("\n")}\n\n${fallbackDoc.aboutCompany}`;

    res.json({ success: true, description: fallbackText, isFallback: true });
  }
});

// POST /api/ai/jd-maker — the Professional JD Maker. Takes a rich recruiter-supplied brief
// and returns a fully structured document ready to render/preview/export as a PDF.
router.post("/jd-maker", async (req, res) => {
  try {
    const {
      companyName,
      companyTagline,
      jobTitle,
      department,
      location,
      employmentType,
      workMode,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency,
      skills,
      responsibilitiesBrief,
      requirementsBrief,
      benefitsBrief,
      aboutCompany,
      applicationInstructions,
      tone,
    } = req.body;

    const brief = {
      companyName,
      companyTagline,
      jobTitle,
      department,
      location,
      employmentType,
      workMode,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency,
      skills,
      responsibilitiesBrief,
      requirementsBrief,
      benefitsBrief,
      aboutCompany,
      applicationInstructions,
      tone,
    };

    if (!jobTitle)
      return res
        .status(400)
        .json({ success: false, message: "Job title is required" });

    let parsed = null;
    try {
      const content = await ollamaChat({
        system: `You are an expert corporate recruiter writing a polished, professional Job Description document.
Reply with ONLY a valid JSON object (no markdown fences, no extra text) with EXACTLY this shape:
{
  "jobTitle": "string",
  "tagline": "one punchy line describing the role",
  "summary": "2-4 sentence overview paragraph of the role and its impact",
  "responsibilities": ["bullet", "bullet", "..."],
  "requiredQualifications": ["bullet", "bullet", "..."],
  "niceToHave": ["bullet", "bullet", "..."],
  "benefits": ["bullet", "bullet", "..."],
  "aboutCompany": "2-3 sentence paragraph about the company",
  "closingNote": "1-2 sentence encouraging call-to-action to apply"
}
Tone: ${tone || "professional and welcoming"}. Keep each bullet under 18 words. 5-7 responsibilities, 4-6 required qualifications, 2-4 nice-to-have, 4-6 benefits.`,
        messages: [{
          role: "user",
          content: `Company: ${companyName || "Our Company"} ${companyTagline ? `— ${companyTagline}` : ""}
Job Title: ${jobTitle}
Department: ${department || "not specified"}
Location: ${location || "not specified"}
Employment Type: ${employmentType || "not specified"}
Work Mode: ${workMode || "not specified"}
Experience Level: ${experienceLevel || "not specified"}
Salary Range: ${salaryMin && salaryMax ? `${currency || "₹"}${salaryMin} - ${currency || "₹"}${salaryMax}` : "not disclosed"}
Key Skills: ${skills || "not specified"}
Recruiter's rough notes on responsibilities: ${responsibilitiesBrief || "none provided — infer sensible responsibilities from the title"}
Recruiter's rough notes on requirements: ${requirementsBrief || "none provided — infer sensible requirements from the title and skills"}
Recruiter's rough notes on benefits: ${benefitsBrief || "none provided — use generic strong benefits"}
About the company: ${aboutCompany || "not provided — write a generic but credible paragraph"}
How to apply: ${applicationInstructions || "Apply directly through the job portal"}`
        }],
        maxTokens: 800,
        temperature: 0.1,
        json: true,
      });

      parsed = safeJsonParse(content);
    } catch (error) {
      console.warn(
        "JD Maker AI call failed; using local fallback document.",
        error.code || error.message,
      );
    }

    const normalized = normalizeJdDocument(parsed || {}, brief);

    if (!parsed) {
      const fallback = buildFallbackJdDocument(brief);
      return res.json({
        success: true,
        jd: normalizeJdDocument(fallback, brief),
        fallback: true,
      });
    }

    res.json({ success: true, jd: normalized });
  } catch (error) {
    console.log(error.response?.data || error.message);
    const fallback = buildFallbackJdDocument(req.body);
    res.status(200).json({
      success: true,
      jd: normalizeJdDocument(fallback, req.body),
      fallback: true,
      message:
        "AI generation was unavailable; a fallback job description was created.",
    });
  }
});

// POST /api/ai/salary-recommendation  { title, experience, location }
router.post("/salary-recommendation", async (req, res) => {
  try {
    const { title, experience, location } = req.body;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: "Job title is required" });

    const content = await ollamaChat({
      system: 'You are a compensation analyst for the Indian job market. Reply with ONLY a JSON object like {"min": 300000, "max": 600000, "currency": "INR", "note": "short one-line context"} — no other text.',
      messages: [{
        role: "user",
        content: `Suggest an annual salary range for a "${title}" role with ${experience || "unspecified"} experience, based in ${location || "India"}.`
      }],
      maxTokens: 200,
      temperature: 0.2,
      json: true,
    });

    let parsed = safeJsonParse(content);
    if (!parsed) {
      return res.json({ success: true, raw: content });
    }
    res.json({ success: true, ...parsed });
  } catch (error) {
    console.error("Salary recommendation error:", error.code || error.message);
    res.status(500).json({
      success: false,
      message: "Could not generate a salary suggestion right now",
    });
  }
});

// POST /api/ai/resume-match  { jdText, resumeText }
router.post("/resume-match", async (req, res) => {
  try {
    const { jdText, resumeText } = req.body;
    if (!jdText?.trim() || !resumeText?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Both Job Description and Resume text are required.",
      });
    }

    let result = null;
    let usedFallback = false;

    // Try Ollama first
    try {
      const content = await ollamaChat({
        system: `You are an expert AI recruitment analyst. Your job is to compare a candidate's resume against a job description and produce a detailed, accurate, professional match analysis.
Reply with ONLY a valid JSON object — no markdown, no code fences, no extra text. Use this exact structure:
{
  "score": <integer 0-100>,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"],
  "partialMatch": ["description of partial match 1", "description of partial match 2"],
  "experience": {
    "required": "what JD asks for",
    "candidate": "what candidate has",
    "match": true or false
  },
  "education": {
    "required": "what JD asks for",
    "candidate": "what candidate has",
    "match": true or false
  },
  "strengths": ["key strength 1", "key strength 2", "key strength 3"],
  "improvements": ["improvement suggestion 1", "improvement suggestion 2"],
  "summary": "2-3 sentence professional summary of the candidate's fit for this role",
  "recommendation": "Shortlist" or "Consider" or "Reject"
}
Rules:
- matchedSkills: skills/technologies/tools explicitly found in BOTH JD and resume
- missingSkills: skills explicitly required by JD but absent from resume
- partialMatch: skills where candidate has a related/adjacent technology (e.g. "has Zustand, JD requires Redux")
- score: holistic match percentage based on skills, experience, education and overall fit
- Be precise, unbiased and professional`,
        messages: [{
          role: "user",
          content: `=== JOB DESCRIPTION ===
${jdText.trim()}

=== CANDIDATE RESUME ===
${resumeText.trim()}`
        }],
        maxTokens: 1000,
        temperature: 0.1,
        json: true,
      });

      let parsed = safeJsonParse(content);
      if (parsed && validateResumeMatchResult(parsed)) {
        result = parsed;
      } else {
        console.warn("Ollama Resume Match returned invalid schema, using local fallback");
      }
    } catch (ollamaError) {
      console.warn("Ollama Resume Match failed, using local fallback:", ollamaError.code || ollamaError.message);
    }

    // Fallback if Ollama failed or returned invalid output
    if (!result) {
      usedFallback = true;
      result = buildLocalResumeMatch(jdText, resumeText);
    }

    res.json({ success: true, result, fallback: usedFallback });
  } catch (error) {
    console.error("Resume match error:", error.code || error.message);
    // Ultimate safety net - if even the fallback fails
    try {
      const fallbackResult = buildLocalResumeMatch(jdText, resumeText);
      res.json({ success: true, result: fallbackResult, fallback: true });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: "Could not analyze the resume right now. Please try again.",
      });
    }
  }
});

// POST /api/ai/ats-score  { resumeText, jobDescription }
router.post("/ats-score", async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;
    if (!resumeText?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Resume text is required" });
    }

    let parsed;
    try {
      const content = await ollamaChat({
        system: `You are an expert ATS (Applicant Tracking System) optimizer. Analyze the resume text and optional job description and return a precise real-world scoring report.
Return ONLY a valid JSON object with this exact structure:
{
  "score": 0,
  "verdict": "Strong ATS fit",
  "summary": "2-3 sentence summary",
  "breakdown": {
    "keywords": 0,
    "formatting": 0,
    "sections": 0,
    "impact": 0,
    "readability": 0
  },
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "feedback": "2-3 sentences of actionable feedback"
}`,
        messages: [{
          role: "user",
          content: `=== RESUME TEXT ===
${resumeText.trim()}

=== JOB DESCRIPTION ===
${jobDescription?.trim() || "Not specified - provide general ATS analysis based on the resume alone."}`
        }],
        maxTokens: 800,
        temperature: 0.2,
        json: true,
      });

      parsed = safeJsonParse(content);
      if (!parsed) throw new Error("Failed to parse AI response");
    } catch (error) {
      console.error("ATS score Ollama call failed, using local fallback:", error.code || error.message);
      parsed = buildLocalAtsResult(resumeText, jobDescription);
    }

    const result = normalizeAtsResult(
      parsed || buildLocalAtsResult(resumeText, jobDescription),
    );
    res.json({ success: true, result });
  } catch (error) {
    console.error("ATS score error:", error.code || error.message);
    const fallback = buildLocalAtsResult(resumeText, jobDescription);
    res.status(500).json({
      success: false,
      message: "Could not calculate ATS score right now",
      result: fallback,
    });
  }
});

export default router;
