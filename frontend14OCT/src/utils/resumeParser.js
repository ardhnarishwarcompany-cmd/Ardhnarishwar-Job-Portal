// Splits raw text extracted from a resume PDF into the structured fields used
// by the CV Maker (summary, experience, education, skills, projects, ...).
//
// Heuristic by nature: PDF text has no real structure, so the user always
// reviews the result. Pure functions, no imports, so it is easy to test.

const HEADING_MAP = {
  summary: [
    "professional summary", "career objective", "career summary", "objective",
    "summary", "profile", "professional profile", "about me",
  ],
  experience: [
    "work experience", "professional experience", "experience", "internships",
    "internship", "internship experience", "employment history", "work history",
    "employment", "training",
  ],
  education: [
    "education", "academic background", "academic qualifications",
    "educational qualifications", "academics", "qualifications",
  ],
  skills: [
    "technical skills", "skills", "core competencies", "key skills",
    "skills & tools", "skills and tools", "technologies", "tech stack",
  ],
  projects: ["academic projects", "personal projects", "key projects", "projects"],
  certifications: [
    "certifications", "certification", "certificates", "licenses & certifications",
    "certifications & courses", "courses",
  ],
  achievements: [
    "achievements", "accomplishments", "awards", "honors", "honours",
    "awards & achievements", "achievements & awards", "extracurricular activities",
    "extra-curricular activities", "co-curricular activities",
    "positions of responsibility", "volunteer experience", "leadership",
  ],
  languages: ["languages", "language proficiency"],
  links: ["links", "social links", "profiles"],
  ignore: [
    "references", "declaration", "hobbies", "interests", "hobbies & interests",
    "personal details", "personal information", "strengths",
  ],
};

const HEADING_LOOKUP = {};
Object.entries(HEADING_MAP).forEach(([key, phrases]) =>
  phrases.forEach((p) => {
    HEADING_LOOKUP[p] = key;
  }),
);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Uppercase-only version used to split headings that got glued into a single
// line (pdf text is sometimes extracted without line breaks).
const INLINE_HEADING_RE = new RegExp(
  `(^|[^A-Za-z&])(${Object.keys(HEADING_LOOKUP)
    .filter((p) => p !== "about me")
    .sort((a, b) => b.length - a.length)
    .map((p) => p.split(/\s+/).map(escapeRe).join("\\s*"))
    .join("|")})(?![A-Za-z])`,
  "gi",
);

const BULLET_RE = /^[\s•▪◦●○■□➢➤►▸·‣⁃\uF0A7\uF0B7\uF076*\-–—]+\s*/;
const isBullet = (line) => /^[\s]*[•▪◦●○■□➢➤►▸·‣⁃\uF0A7\uF0B7\uF076*\-–—]\s*/.test(line);
const stripBullet = (line) => line.replace(BULLET_RE, "").trim();

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;
const URL_RE =
  /(?:https?:\/\/|www\.)[^\s|,;]+|(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|leetcode\.com|kaggle\.com|medium\.com)\/[^\s|,;]*|[A-Za-z0-9-]+\.(?:github\.io|netlify\.app|vercel\.app|dev|me|io|in|com)(?:\/[^\s|,;]*)?/g;

const MON =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DATE = `(?:${MON}\\.?,?\\s*)?(?:\\d{4}|\\d{1,2}/\\d{4})`;
const RANGE_RE = new RegExp(
  `${DATE}\\s*(?:-|–|—|to)\\s*(?:${DATE}|Present|Current|Ongoing|Now|Till Date)`,
  "i",
);
const SINGLE_YEAR_RE = /\(?\b(?:Expected\s*)?(?:19|20)\d{2}\)?/i;

const DEGREE_ABBR_RE =
  /(?:^|[^A-Za-z])(B\.?\s?Tech|M\.?\s?Tech|B\.?E|M\.?E|B\.?\s?Sc|M\.?\s?Sc|BCA|MCA|B\.?\s?Com|M\.?\s?Com|BA|MA|MBA|BBA|Ph\.?D|XII|SSC|HSC|CBSE|ICSE)(?![A-Za-z])/;
const DEGREE_WORD_RE =
  /\b(Bachelor|Master|Diploma|Intermediate|Higher Secondary|Senior Secondary|Secondary School|High School|Class\s?(?:X|XII|10|12)|(?:10|12)th|Polytechnic|Associate|Doctorate)\b/i;
const SCHOOL_RE =
  /(Institute|Institution|University|College|School|Academy|Vidyalaya|Vidyapeeth|Polytechnic|Campus|IIT|NIT|IIIT)/i;

const isDegreeLine = (t) => DEGREE_ABBR_RE.test(t) || DEGREE_WORD_RE.test(t);

let idCounter = 0;
const newId = (prefix) => `${prefix}-${Date.now()}-${idCounter++}`;

const tidy = (s) =>
  (s || "")
    .replace(/\s+/g, " ")
    .replace(/^[\s|,;:–—-]+|[\s|,;:–—-]+$/g, "")
    .trim();

const extractRange = (text) => {
  const m = text.match(RANGE_RE);
  if (m) return m[0];
  const y = text.match(SINGLE_YEAR_RE);
  return y ? y[0] : "";
};

const isHeadingLine = (line) => {
  const clean = line
    .replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (!clean || clean.length > 40) return null;
  return HEADING_LOOKUP[clean] || null;
};

// Joins lines that were only wrapped by the PDF layout back into one item.
const looksLikeContinuation = (prev, text) => {
  if (!prev) return false;
  if (/[.!?:]$/.test(prev)) return false;
  return /^[a-z0-9(]/.test(text) || /[,\-–]$|\b(and|with|of|to|in|for|the|using|by)$/i.test(prev);
};

const groupBullets = (lines) => {
  const items = [];
  lines.forEach((line) => {
    const bullet = isBullet(line);
    const text = stripBullet(line);
    if (!text) return;
    if (!bullet && items.length && looksLikeContinuation(items[items.length - 1], text)) {
      items[items.length - 1] += ` ${text}`;
    } else {
      items.push(text);
    }
  });
  return items;
};

// ---------- header ----------

const parseHeader = (lines) => {
  const headerText = lines.join("\n");
  const out = { name: "", email: "", phone: "", location: "", linkedin: "", portfolio: "", extraLinks: [] };

  const emailMatch = headerText.match(EMAIL_RE);
  if (emailMatch) out.email = emailMatch[0];

  let rest = headerText.replace(EMAIL_RE, " ");

  const urls = (rest.match(URL_RE) || []).map((u) => u.replace(/[),.;]+$/, ""));
  rest = rest.replace(URL_RE, " ");
  urls.forEach((u) => {
    if (/linkedin\.com/i.test(u) && !out.linkedin) out.linkedin = u;
    else if (!out.portfolio) out.portfolio = u;
    else
      out.extraLinks.push({
        label: /github\.com/i.test(u) ? "GitHub" : "Website",
        url: u,
      });
  });

  const phoneMatch = rest.match(PHONE_RE);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, "").length >= 10) {
    out.phone = phoneMatch[0].trim();
    rest = rest.replace(phoneMatch[0], " ");
  }

  const residual = rest
    .split("\n")
    .map((l) => tidy(l.replace(/[|•·]+/g, " ")))
    .filter(Boolean);

  if (residual.length) {
    const first = residual[0];
    const tokens = first.split(/\s+/);
    const commaIdx = tokens.findIndex((t) => t.endsWith(","));
    if (commaIdx > 0 && residual.length === 1) {
      // "PRINCI TRIPATHI Kanpur, Uttar Pradesh, India" on a single line.
      out.name = tokens.slice(0, commaIdx).join(" ");
      out.location = tokens.slice(commaIdx).join(" ");
    } else if (commaIdx === -1 && first.length <= 45) {
      out.name = first;
      out.location = residual.slice(1).find((l) => /[A-Za-z]/.test(l) && l.length < 80) || "";
    } else {
      out.name = tokens.slice(0, 4).join(" ");
      out.location = residual.slice(1).find((l) => /,/.test(l)) || "";
    }
  }
  return out;
};

// ---------- sections ----------

const parseEducation = (lines) => {
  const entries = [];
  let cur = null;
  let pending = null;

  const flush = () => {
    if (cur && (cur.degree || cur.school)) entries.push(cur);
    cur = null;
  };

  lines.forEach((raw) => {
    const line = stripBullet(raw);
    if (!line) return;
    const range = extractRange(line);
    const text = tidy(range ? line.replace(range, " ") : line);

    if (!text) {
      if (cur) cur.year = cur.year || range;
      else pending = { ...(pending || { school: "" }), year: range };
      return;
    }

    if (/^\(?\s*(cgpa|gpa|percentage|score|grade|marks)/i.test(text)) {
      if (cur) cur.degree = `${cur.degree} (${text.replace(/^\(|\)$/g, "")})`;
      return;
    }

    if (isDegreeLine(text)) {
      flush();
      cur = {
        id: newId("edu"),
        degree: text,
        school: pending?.school || "",
        year: range || pending?.year || "",
      };
      pending = null;
    } else if (SCHOOL_RE.test(text)) {
      if (cur && !cur.school) {
        cur.school = text;
        cur.year = cur.year || range;
      } else {
        flush();
        pending = { school: text, year: range };
      }
    } else if (cur && /^[a-z(]/.test(text)) {
      cur.degree = `${cur.degree} ${text}`;
    } else if (cur && !cur.school) {
      cur.school = text;
      cur.year = cur.year || range;
    }
  });

  flush();
  if (pending?.school) {
    entries.push({ id: newId("edu"), degree: "", school: pending.school, year: pending.year || "" });
  }
  return entries;
};

const parseRoleCompany = (head) => {
  const splitters = [/\s+\|\s+/, /\s+@\s+/, /\s+at\s+/i, /\s+[–—-]\s+/, /,\s+/];
  for (const re of splitters) {
    const parts = head.split(re);
    if (parts.length >= 2) {
      return { role: tidy(parts[0]), company: tidy(parts.slice(1).join(", ")) };
    }
  }
  return { role: tidy(head), company: "" };
};

const parseExperience = (lines) => {
  const items = [];
  let cur = null;
  let pendingDuration = "";

  const start = (role, company, duration) => {
    cur = {
      id: newId("exp"),
      role,
      company,
      duration: duration || pendingDuration,
      desc: [],
    };
    pendingDuration = "";
    items.push(cur);
  };

  lines.forEach((raw) => {
    const bullet = isBullet(raw);
    const text = stripBullet(raw);
    if (!text) return;

    if (bullet) {
      if (!cur) start("", "", "");
      cur.desc.push(text);
      return;
    }

    const range = extractRange(text);
    const head = tidy(range ? text.replace(range, " ") : text);

    if (cur && cur.desc.length && looksLikeContinuation(cur.desc[cur.desc.length - 1], text) && !range) {
      cur.desc[cur.desc.length - 1] += ` ${text}`;
      return;
    }

    if (range && !head) {
      if (cur && !cur.duration && cur.desc.length === 0) cur.duration = range;
      else pendingDuration = range;
      return;
    }

    const headerish = range || (text.length <= 80 && !/[.!?]$/.test(text) && text.split(/\s+/).length <= 10);

    if (!headerish) {
      if (!cur) start("", "", "");
      cur.desc.push(text);
      return;
    }

    if (!range && cur && cur.desc.length === 0 && cur.role && !cur.company) {
      cur.company = head;
      return;
    }

    const { role, company } = parseRoleCompany(head);
    start(role, company, range);
  });

  return items
    .map(({ desc, ...rest }) => ({ ...rest, description: desc.join("\n") }))
    .filter((e) => e.role || e.company || e.description);
};

const parseProjects = (lines) => {
  const items = [];
  let cur = null;

  const start = (title) => {
    cur = { id: newId("prj"), title, desc: [] };
    items.push(cur);
  };

  lines.forEach((raw) => {
    const bullet = isBullet(raw);
    const text = stripBullet(raw);
    if (!text) return;

    if (bullet) {
      if (!cur) start("");
      cur.desc.push(text);
      return;
    }

    if (cur && cur.desc.length && looksLikeContinuation(cur.desc[cur.desc.length - 1], text)) {
      cur.desc[cur.desc.length - 1] += ` ${text}`;
      return;
    }

    const isMeta = /^(tech(nologies)?|tools|stack|built with|link|github|live|demo)\b/i.test(text);
    const isTitle = text.length <= 100 && !/[.!?]$/.test(text) && text.split(/\s+/).length <= 14 && !isMeta;

    if (isTitle) {
      start(tidy(text.replace(RANGE_RE, " ")));
    } else {
      if (!cur) start("");
      cur.desc.push(text);
    }
  });

  return items
    .map(({ desc, ...rest }) => ({ ...rest, description: desc.join("\n") }))
    .filter((p) => p.title || p.description);
};

const parseSkills = (lines) => {
  const seen = new Set();
  const out = [];
  lines.forEach((raw) => {
    const line = stripBullet(raw).replace(/^[A-Za-z][A-Za-z &/+]{1,30}:\s*/, "");
    line
      .split(/[,|;•·]/)
      .map(tidy)
      .filter(Boolean)
      .forEach((s) => {
        const key = s.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push(s);
        }
      });
  });
  return out.join(", ");
};

const parseLinks = (lines) => {
  const out = [];
  lines.forEach((raw) => {
    const line = stripBullet(raw);
    const url = (line.match(URL_RE) || [])[0];
    if (!url) return;
    const label = tidy(line.replace(url, "").replace(/[:\-–—]+$/, "")) || "Link";
    out.push({ id: newId("lnk"), label, url: url.replace(/[),.;]+$/, "") });
  });
  return out;
};

// ---------- main ----------

export const parseResumeSections = (rawText) => {
  const empty = {
    name: "", email: "", phone: "", location: "", linkedin: "", portfolio: "",
    summary: "", skills: "", certifications: "", achievements: "", languages: "",
    experience: [], education: [], projects: [], links: [],
    sectionsFound: 0,
  };
  if (!rawText || !rawText.trim()) return empty;

  // Put glued-together uppercase headings on their own line, then split.
  const text = rawText
    .replace(/\r/g, "")
    .replace(INLINE_HEADING_RE, (m, pre, h) => `${pre}\n${h}\n`);
  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const sections = { header: [] };
  let current = "header";
  let found = 0;
  lines.forEach((line) => {
    const key = isHeadingLine(line);
    if (key) {
      current = key;
      sections[current] = sections[current] || [];
      found += 1;
    } else {
      (sections[current] = sections[current] || []).push(line);
    }
  });

  const header = parseHeader(sections.header || []);
  const links = [
    ...header.extraLinks.map((l) => ({ id: newId("lnk"), ...l })),
    ...parseLinks(sections.links || []),
  ];

  return {
    name: header.name,
    email: header.email,
    phone: header.phone,
    location: header.location,
    linkedin: header.linkedin,
    portfolio: header.portfolio,
    summary: (sections.summary || []).map(stripBullet).join(" ").trim(),
    skills: parseSkills(sections.skills || []),
    certifications: groupBullets(sections.certifications || [])
      .map((c) => c.replace(/,\s*/g, " - "))
      .join("\n"),
    achievements: groupBullets(sections.achievements || []).join("\n"),
    languages: (sections.languages || [])
      .map(stripBullet)
      .join(", ")
      .split(/[,|;•·]/)
      .map(tidy)
      .filter(Boolean)
      .join(", "),
    experience: parseExperience(sections.experience || []),
    education: parseEducation(sections.education || []),
    projects: parseProjects(sections.projects || []),
    links,
    sectionsFound: found,
  };
};

// Fallback for PDFs where no section headings could be detected: keep a
// readable chunk (cut at a sentence boundary) instead of a mid-word slice.
export const fallbackSummary = (text, max = 800) => {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "));
  return (lastStop > max * 0.5 ? cut.slice(0, lastStop + 1) : cut.replace(/\s+\S*$/, "")).trim();
};
