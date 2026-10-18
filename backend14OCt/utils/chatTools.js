import { JobModel, UserModel, ApplicationModel, CompanyModel, connection } from "../models/dbModels.js";

/**
 * Chat tools are deterministic DATA providers only.
 * They never call an LLM and never write a conversational answer.
 * The single response model (Ollama) turns this data into the final reply.
 */

const MAX_JOBS = 5;
const MAX_SKILLS = 25;
const MAX_TEXT = 400;

const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const clamp = (value, max) => (typeof value === "string" ? value.slice(0, max) : value);
const asList = (value) => {
  if (Array.isArray(value)) return value.map((v) => clean(v)).filter(Boolean);
  if (typeof value === "string") return value.split(/[,;\n]/).map((v) => clean(v)).filter(Boolean);
  return [];
};

const fail = (reason, extra = {}) => ({ ok: false, reason, ...extra });

const jobCompany = (job) => job?.companyName || job?.company?.name || job?.company?.companyName || null;

const jobSalary = (job) => {
  const raw = job?.salary;
  if (raw === null || raw === undefined || clean(raw) === "") return null;
  return clamp(clean(raw), 30);
};

const jobExperience = (job) => {
  const level = job?.experienceLevel;
  if (level === null || level === undefined || level === "") return null;
  return `${clean(level)} years`;
};

const jobRequirements = (job, limit = 6) => asList(job?.requirements).slice(0, limit);

const toJobSummary = (job) => ({
  id: job?.jobCode || job?.id || null,
  companyId: job?.companyId ?? job?.company?.id ?? null,
  title: clean(job?.title) || null,
  company: jobCompany(job),
  location: clamp(clean(job?.location), 80) || null,
  jobType: clean(job?.jobType) || null,
  experience: jobExperience(job),
  salary: jobSalary(job),
  postedAt: job?.created_at || job?.createdAt || null,
  requirements: jobRequirements(job, 5),
});

const ok = (data, extra = {}) => ({ ok: true, ...extra, data });

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const searchJobs = async ({ role, location, experience, jobType, skills, keyword, limit = MAX_JOBS } = {}) => {
  try {
    const searchTerm = clean(keyword || role || (Array.isArray(skills) ? skills[0] : skills)) || "";

    let jobs = await JobModel.findAll(searchTerm);

    if (location) {
      const loc = clean(location).toLowerCase();
      if (loc && loc !== "remote") {
        jobs = jobs.filter((job) => clean(job.location).toLowerCase().includes(loc) || clean(job.jobType).toLowerCase().includes(loc));
      }
    }

    if (experience) {
      const expMatch = clean(experience).match(/(\d+)/);
      const maxYears = expMatch ? Number(expMatch[1]) : null;
      if (maxYears !== null) {
        jobs = jobs.filter((job) => {
          const level = Number(job.experienceLevel);
          return Number.isFinite(level) ? level <= maxYears + 2 : true;
        });
      } else if (/senior|lead|principal|staff|manager/i.test(experience)) {
        jobs = jobs.filter((job) => {
          const level = Number(job.experienceLevel);
          return Number.isFinite(level) ? level >= 3 : true;
        });
      }
    }

    if (jobType) {
      const type = clean(jobType).toLowerCase();
      jobs = jobs.filter((job) => clean(job.jobType).toLowerCase().includes(type));
    }

    if (Array.isArray(skills) && skills.length) {
      const wanted = skills.map((s) => clean(s).toLowerCase()).filter(Boolean);
      jobs = jobs.filter((job) => {
        const reqs = asList(job.requirements).map((r) => r.toLowerCase());
        return wanted.some((skill) => reqs.some((req) => req.includes(skill) || skill.includes(req)));
      });
    }

    jobs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return ok({
      query: { role: role || null, location: location || null, experience: experience || null, skills: Array.isArray(skills) ? skills : [] },
      totalMatches: jobs.length,
      jobs: jobs.slice(0, limit).map(toJobSummary),
    });
  } catch (error) {
    console.error("[chatTool] searchJobs:", error.message);
    return fail("jobs_unavailable");
  }
};

export const getJobDetails = async (jobId) => {
  try {
    const job = await JobModel.findById(jobId);
    if (!job) return fail("job_not_found");
    return ok({ job: { ...toJobSummary(job), description: clamp(clean(job.description), MAX_TEXT) } });
  } catch (error) {
    console.error("[chatTool] getJobDetails:", error.message);
    return fail("job_unavailable");
  }
};

export const getJobRecommendations = async (userId, limit = MAX_JOBS) => {
  try {
    if (!userId) return fail("auth_required");

    const user = await UserModel.findById(userId);
    if (!user) return fail("profile_not_found");

    const profile = readCandidateProfile(user);
    const userSkills = [...new Set([...asList(user.skills), ...asList(profile?.professional?.skills)])];

    if (!userSkills.length) return ok({ userSkills: [], matches: [], totalMatches: 0, needsSkills: true });

    const jobs = await JobModel.findAll("");
    const wanted = userSkills.map((s) => s.toLowerCase());

    const scored = jobs.map((job) => {
      const reqs = asList(job.requirements);
      const matched = reqs.filter((req) => {
        const r = req.toLowerCase();
        return wanted.some((skill) => r.includes(skill) || skill.includes(r));
      });
      return { job, matched, score: reqs.length ? matched.length / reqs.length : 0 };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.filter((item) => item.score > 0).slice(0, limit);

    return ok({
      userSkills: userSkills.slice(0, MAX_SKILLS),
      totalMatches: scored.filter((item) => item.score > 0).length,
      matches: top.map((item) => ({ ...toJobSummary(item.job), matchedSkills: item.matched.slice(0, 4), matchPercent: Math.round(item.score * 100) })),
    });
  } catch (error) {
    console.error("[chatTool] getJobRecommendations:", error.message);
    return fail("jobs_unavailable");
  }
};

export const getApplicationStatus = async (userId) => {
  try {
    if (!userId) return fail("auth_required");

    const rows = await ApplicationModel.findByApplicant(userId);
    const applications = (rows || []).map((app) => ({
      id: app.id || app._id,
      jobTitle: app.job?.title || null,
      company: app.job?.company?.name || null,
      location: app.job?.location || null,
      salary: app.job?.salary ? clamp(clean(app.job.salary), 30) : null,
      status: app.status || "pending",
      appliedAt: app.createdAt || null,
    }));

    const counts = applications.reduce((acc, app) => {
      const key = clean(app.status).toLowerCase() || "pending";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return ok({ total: applications.length, counts, applications });
  } catch (error) {
    console.error("[chatTool] getApplicationStatus:", error.message);
    return fail("applications_unavailable");
  }
};

// ─── Companies ────────────────────────────────────────────────────────────────
export const getCompanyInfo = async (companyId) => {
  try {
    const company = await CompanyModel.findById(companyId);
    if (!company) return fail("company_not_found");

    const jobs = await JobModel.findAll("");
    const openJobs = jobs.filter((job) => String(job.company) === String(companyId) || String(job.companyId) === String(companyId));

    return ok({
      company: {
        name: clean(company.name) || null,
        about: clamp(clean(company.description), MAX_TEXT) || null,
        location: clean(company.location) || null,
        website: clean(company.website) || null,
        industry: clean(company.industryType || company.industry) || null,
      },
      openRoles: openJobs.length,
      jobs: openJobs.slice(0, MAX_JOBS).map(toJobSummary),
    });
  } catch (error) {
    console.error("[chatTool] getCompanyInfo:", error.message);
    return fail("company_unavailable");
  }
};

export const findCompanyByName = async (name) => {
  const query = clean(name);
  if (!query) return fail("company_not_specified");

  try {
    const direct = await CompanyModel.findOneByName(query);
    if (direct) return getCompanyInfo(direct.id);

    const lowered = query.toLowerCase();
    const all = await CompanyModel.findAll();
    const words = lowered.split(/\s+/).filter((word) => word.length > 2 && !/^(pvt|ltd|inc|llp|llc|corp|corporation|company|limited|the|about|for|and)$/.test(word));

    const scored = all
      .map((company) => {
        const companyName = clean(company.name).toLowerCase();
        let score = 0;
        if (companyName === lowered) score = 100;
        else if (companyName.includes(lowered) || lowered.includes(companyName)) score = 80;
        else {
          const hits = words.filter((word) => companyName.includes(word)).length;
          if (hits) score = 40 + hits * 10;
        }
        return { company, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length) {
      const result = await getCompanyInfo(scored[0].company.id);
      if (result.ok) return ok({ ...result.data, matchedName: clean(scored[0].company.name) });
    }

    return fail("company_not_listed", { searched: query });
  } catch (error) {
    console.error("[chatTool] findCompanyByName:", error.message);
    return fail("company_unavailable", { searched: query });
  }
};

// ─── Profile ──────────────────────────────────────────────────────────────────
const readCandidateProfile = (user) => {
  if (!user?.candidateProfile) return null;
  if (typeof user.candidateProfile === "object") return user.candidateProfile;
  try {
    return JSON.parse(user.candidateProfile);
  } catch {
    return null;
  }
};

export const getUserProfile = async (userId) => {
  try {
    if (!userId) return fail("auth_required");

    const user = await UserModel.findById(userId);
    if (!user) return fail("profile_not_found");

    const profile = readCandidateProfile(user);
    const skills = [...new Set([...asList(user.skills), ...asList(profile?.professional?.skills)])].slice(0, MAX_SKILLS);

    const gaps = [];
    if (!clean(user.experience) && !clean(profile?.career?.experience)) gaps.push("experience");
    if (!clean(user.education) && !clean(profile?.education?.degree) && !clean(profile?.career?.education)) gaps.push("education");
    if (!skills.length) gaps.push("skills");
    if (!clean(user.city) && !clean(profile?.personal?.city)) gaps.push("location");
    if (!clean(user.bio) && !clean(profile?.professional?.summary)) gaps.push("summary/bio");
    if (!clean(user.resume) && !clean(profile?.career?.resume)) gaps.push("resume");

    return ok({
      profile: {
        name: clean(user.fullname) || null,
        city: clean(user.city || profile?.personal?.city) || null,
        experience: clean(user.experience || profile?.career?.experience) || null,
        education: clean(user.education || profile?.education?.degree || profile?.career?.education) || null,
        currentRole: clean(profile?.career?.title || profile?.career?.jobTitle || user.profileRole) || null,
        skills,
        bio: clamp(clean(user.bio || profile?.professional?.summary), 300) || null,
        expectedSalary: clean(profile?.career?.salary?.expected) || null,
        hasResumeFile: Boolean(clean(user.resume || profile?.career?.resume)),
      },
      missingProfileFields: gaps,
    });
  } catch (error) {
    console.error("[chatTool] getUserProfile:", error.message);
    return fail("profile_unavailable");
  }
};

// ─── Market / skills demand (portal data only) ────────────────────────────────
export const getSkillDemand = async ({ role, location } = {}) => {
  try {
    const jobs = role ? await JobModel.findAll(clean(role)) : await JobModel.findAll("");

    const frequency = new Map();
    for (const job of jobs) {
      for (const requirement of jobRequirements(job, 12)) {
        const key = requirement.toLowerCase();
        frequency.set(key, (frequency.get(key) || 0) + 1);
      }
    }

    const topSkills = [...frequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([skill, count]) => ({ skill, postings: count }));

    const locations = [...new Set(jobs.map((job) => clean(job.location)).filter(Boolean))].slice(0, 6);
    const employers = [...new Set(jobs.map(jobCompany).filter(Boolean))].slice(0, 6);
    const roles = [...new Set(jobs.map((job) => clean(job.title)).filter(Boolean))].slice(0, 6);

    return ok({
      role: role || null,
      location: location || null,
      totalPostings: jobs.length,
      topRequiredSkills: topSkills,
      topLocations: locations,
      hiringEmployers: employers,
      sampleRoles: roles,
    });
  } catch (error) {
    console.error("[chatTool] getSkillDemand:", error.message);
    return fail("market_data_unavailable");
  }
};

// ─── Salary (portal listings only) ────────────────────────────────────────────
export const getSalaryListings = async ({ title, experience, location } = {}) => {
  try {
    const searchTerm = clean(title) || "developer";
    const jobs = await JobModel.findAll(searchTerm);

    const relevant = jobs.filter((job) => {
      if (location && clean(location).toLowerCase() !== "remote") {
        const loc = clean(location).toLowerCase();
        if (!clean(job.location).toLowerCase().includes(loc)) return false;
      }
      if (experience) {
        const years = clean(experience).match(/(\d+)/);
        if (years) {
          const level = Number(job.experienceLevel);
          if (Number.isFinite(level) && level > Number(years[1]) + 2) return false;
        }
      }
      return jobSalary(job) !== null;
    });

    const listings = relevant.slice(0, MAX_JOBS).map((job) => ({
      title: clean(job.title),
      company: jobCompany(job),
      location: clean(job.location) || null,
      experience: jobExperience(job),
      listedSalary: jobSalary(job),
    }));

    const numeric = relevant.map((job) => Number(clean(job.salary))).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);

    return ok({
      role: searchTerm,
      salaryUnit: "LPA (as listed on the portal)",
      postingsWithSalary: relevant.length,
      min: numeric[0] ?? null,
      max: numeric[numeric.length - 1] ?? null,
      median: numeric.length ? numeric[Math.floor(numeric.length / 2)] : null,
      listings,
    });
  } catch (error) {
    console.error("[chatTool] getSalaryListings:", error.message);
    return fail("salary_data_unavailable");
  }
};

// ─── Job description (data + deterministic requirement extraction) ────────────
export const getJobDescriptionData = async ({ jobId, jdText } = {}) => {
  try {
    if (jobId) {
      const result = await getJobDetails(jobId);
      if (result.ok) return ok({ source: "portal", ...result.data });
      return result;
    }

    const text = clean(jdText);
    if (!text) return fail("job_description_missing");

    const skills = KNOWN_SKILLS.filter((skill) => containsSkill(text, skill)).slice(0, 20);
    const sections = ["responsibilities", "requirements", "qualifications", "skills", "experience", "benefits", "about"]
      .filter((section) => text.toLowerCase().includes(section));

    return ok({
      source: "user_pasted",
      jdText: clamp(text, 1200),
      detectedSkills: skills,
      detectedSections: sections,
      wordCount: text.split(/\s+/).length,
    });
  } catch (error) {
    console.error("[chatTool] getJobDescriptionData:", error.message);
    return fail("job_description_unavailable");
  }
};

// ─── Deterministic skill / resume analysis ────────────────────────────────────
const KNOWN_SKILLS = [
  "python", "java", "javascript", "typescript", "c#", "c++", "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "matlab", "sql", "bash",
  "react", "angular", "vue", "svelte", "next.js", "nuxt", "redux", "html", "css", "sass", "tailwind", "jquery", "flutter", "android", "ios",
  "node.js", "node", "express", "nestjs", "django", "flask", "fastapi", "spring", "spring boot", "laravel", "dotnet", ".net", "graphql", "rest", "restful", "grpc", "microservices",
  "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra", "dynamodb", "oracle", "sqlite", "kafka", "rabbitmq", "firebase", "sqlalchemy", "prisma", "mongoose", "hibernate",
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible", "jenkins", "github actions", "gitlab ci", "ci/cd", "linux", "nginx", "prometheus", "grafana", "devops", "sre",
  "git", "jira", "postman", "unit testing", "jest", "pytest", "cypress", "playwright", "selenium", "junit", "tdd",
  "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "llm", "rag", "langchain", "prompt engineering", "fine tuning", "mlops",
  "tableau", "power bi", "powerbi", "excel", "statistics", "spark", "hadoop", "etl", "data modeling", "a/b testing", "looker", "matlab",
  "figma", "ux design", "ui design", "user research", "wireframing", "adobe photoshop", "illustrator",
  "agile", "scrum", "jira", "communication", "leadership", "team management", "problem solving", "time management",
];

const SKILL_ALIASES = {
  js: "javascript",
  ts: "typescript",
  "node js": "node.js",
  "nodejs": "node.js",
  "react js": "react",
  "reactjs": "react",
  postgres: "postgresql",
  postgre: "postgresql",
  mongo: "mongodb",
  k8s: "kubernetes",
  "c sharp": "c#",
  "golang": "go",
  "powerbi": "power bi",
  "a/b testing": "a/b testing",
  "ab testing": "a/b testing",
  "llms": "llm",
  "rag": "rag",
  "ml": "machine learning",
  "ai": "machine learning",
};

const displaySkill = (skill) => skill.replace(/\b\w/g, (c) => c.toUpperCase());

const normaliseSkill = (skill) => {
  const key = clean(skill).toLowerCase();
  return SKILL_ALIASES[key] || key;
};

const containsSkill = (text, skill) => {
  const haystack = ` ${text.toLowerCase()} `;
  const needle = skill.toLowerCase();
  if (needle.includes(" ") || needle.length > 3) return haystack.includes(needle);
  return haystack.includes(` ${needle} `) || haystack.includes(`${needle},`) || haystack.includes(`${needle}.`) || haystack.includes(`${needle};`);
};

const extractSkills = (text) => {
  const found = new Set();
  for (const skill of KNOWN_SKILLS) {
    if (containsSkill(text, skill)) found.add(normaliseSkill(skill));
  }
  return [...found];
};

const RELATED_SKILLS = {
  javascript: ["typescript", "node.js", "react", "next.js"],
  typescript: ["javascript", "node.js", "react", "next.js"],
  react: ["javascript", "next.js", "redux", "html"],
  "next.js": ["react", "javascript", "typescript", "node.js"],
  node: ["node.js", "express", "javascript", "mongodb"],
  "node.js": ["node", "express", "javascript", "mongodb"],
  express: ["node.js", "rest", "mongodb", "javascript"],
  python: ["django", "flask", "fastapi", "pandas", "sql", "machine learning"],
  django: ["python", "postgresql", "rest"],
  flask: ["python", "rest", "postgresql"],
  fastapi: ["python", "rest", "postgresql", "docker"],
  java: ["spring", "spring boot", "sql", "microservices"],
  "spring boot": ["java", "sql", "rest", "docker"],
  sql: ["postgresql", "mysql", "database design", "data modeling"],
  postgresql: ["sql", "mysql"],
  mysql: ["sql", "postgresql"],
  mongodb: ["nosql", "node.js", "express"],
  docker: ["kubernetes", "ci/cd", "linux", "devops"],
  kubernetes: ["docker", "devops", "terraform", "ci/cd"],
  aws: ["azure", "gcp", "docker", "ci/cd"],
  azure: ["aws", "gcp", "docker"],
  gcp: ["aws", "azure", "docker"],
  terraform: ["kubernetes", "devops", "ci/cd"],
  "machine learning": ["python", "pandas", "numpy", "pytorch", "statistics"],
  "deep learning": ["pytorch", "tensorflow", "machine learning", "python"],
  pytorch: ["python", "deep learning", "machine learning"],
  tensorflow: ["python", "deep learning", "machine learning"],
  nlp: ["machine learning", "llm", "python", "deep learning"],
  llm: ["rag", "prompt engineering", "python", "nlp"],
  rag: ["llm", "python", "vector database", "nlp"],
  "power bi": ["sql", "excel", "statistics", "data modeling"],
  tableau: ["sql", "excel", "statistics", "data modeling"],
  excel: ["sql", "power bi", "statistics"],
  statistics: ["python", "sql", "excel", "a/b testing"],
  angular: ["typescript", "javascript", "html", "css"],
  vue: ["javascript", "html", "css", "typescript"],
  devops: ["docker", "kubernetes", "ci/cd", "aws", "linux"],
  sre: ["devops", "kubernetes", "linux", "monitoring"],
};

const findRelated = (required, owned) => {
  const ownedSet = new Set(owned);
  const related = [];
  for (const skill of required) {
    for (const candidate of RELATED_SKILLS[skill] || []) {
      const normalised = normaliseSkill(candidate);
      if (ownedSet.has(normalised) && !required.includes(normalised) && !related.includes(normalised)) {
        related.push(normalised);
      }
    }
  }
  return related.slice(0, 6);
};

const RESUME_SECTIONS = [
  { label: "contact", patterns: [/@|linkedin|github|portfolio|https?:\/\//i] },
  { label: "summary", patterns: [/summary|objective|profile/i] },
  { label: "experience", patterns: [/experience|employment|internship|work history/i] },
  { label: "skills", patterns: [/skills|technical skills|tech stack|tools/i] },
  { label: "projects", patterns: [/projects?|portfolio|github/i] },
  { label: "education", patterns: [/education|degree|university|college|b\.?tech|bachelor|master/i] },
  { label: "certifications", patterns: [/certification|certified|license/i] },
];

const countWords = (text) => (text.match(/[a-z0-9+#.]+/gi) || []).length;

export const analyzeSkillMatch = async ({ jdText, profileText, skills = [] } = {}) => {
  try {
    const profileSkills = [...new Set([...asList(skills).map(normaliseSkill), ...extractSkills(profileText || "")])];
    const jd = clean(jdText);

    if (!jd) {
      return fail("job_description_missing", { profileSkills: profileSkills.slice(0, MAX_SKILLS) });
    }

    const requiredSkills = extractSkills(jd);
    if (!requiredSkills.length) return fail("no_requirements_detected", { jdExcerpt: clamp(jd, 300) });

    const matched = requiredSkills.filter((skill) => profileSkills.includes(skill));
    const missing = requiredSkills.filter((skill) => !profileSkills.includes(skill));
    const related = findRelated(requiredSkills, profileSkills);

    const years = jd.match(/(\d+)\s*\+?\s*years?/i);
    const requiredYears = years ? Number(years[1]) : null;
    const profileYears = (profileText || "").match(/(\d+)\s*\+?\s*years?/i);
    const candidateYears = profileYears ? Number(profileYears[1]) : null;

    const coverage = requiredSkills.length ? matched.length / requiredSkills.length : 0;
    const score = Math.round(coverage * 100);

    return ok({
      score,
      requiredSkills: requiredSkills.slice(0, MAX_SKILLS),
      matchedSkills: matched.slice(0, MAX_SKILLS),
      missingSkills: missing.slice(0, MAX_SKILLS),
      relatedSkills: related,
      profileSkills: profileSkills.slice(0, MAX_SKILLS),
      experience: {
        required: requiredYears !== null ? `${requiredYears}+ years` : "not specified in the job description",
        candidate: candidateYears !== null ? `${candidateYears}+ years` : "not found in profile",
        meets: requiredYears !== null && candidateYears !== null ? candidateYears >= requiredYears : null,
      },
    });
  } catch (error) {
    console.error("[chatTool] analyzeSkillMatch:", error.message);
    return fail("analysis_unavailable");
  }
};

export const analyzeResume = async ({ resumeText, jdText, skills = [] } = {}) => {
  try {
    const text = clean(resumeText);
    const jd = clean(jdText);
    const targetKeywords = jd ? extractSkills(jd) : extractSkills(text);

    const presentSections = RESUME_SECTIONS.filter((section) => section.patterns.some((pattern) => pattern.test(text))).map((section) => section.label);
    const missingSections = RESUME_SECTIONS.map((section) => section.label).filter((label) => !presentSections.includes(label));

    const keywords = [...new Set([...targetKeywords, ...asList(skills).map(normaliseSkill)])].slice(0, 25);
    const matched = keywords.filter((keyword) => containsSkill(text, keyword));
    const missing = keywords.filter((keyword) => !containsSkill(text, keyword));

    const wordCount = countWords(text);
    const hasMetrics = /\d+%|\d+\s*(?:k|m|lakh|lpa|x)\b|increased|reduced|improved|optimi[sz]ed|saved|revenue|growth/i.test(text);
    const hasLinks = /linkedin|github|portfolio|https?:\/\//i.test(text);
    const hasBullets = /(^|\n)\s*[-*•]|\d+\.\s/.test(text);

    const keywordScore = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;
    const sectionScore = Math.round((presentSections.length / RESUME_SECTIONS.length) * 100);
    const impactScore = hasMetrics ? 90 : 55;
    const contactScore = hasLinks ? 95 : 60;
    const lengthScore = wordCount >= 250 && wordCount <= 900 ? 85 : wordCount < 250 ? 60 : 45;
    const structureScore = hasBullets ? 85 : 60;

    const score = Math.round(keywordScore * 0.3 + sectionScore * 0.2 + impactScore * 0.2 + contactScore * 0.12 + lengthScore * 0.1 + structureScore * 0.08);

    return ok({
      score,
      breakdown: {
        keywords: keywordScore,
        sections: sectionScore,
        impact: impactScore,
        contact: contactScore,
        length: lengthScore,
        structure: structureScore,
      },
      wordCount,
      presentSections,
      missingSections,
      matchedKeywords: matched.slice(0, 15),
      missingKeywords: missing.slice(0, 15),
      signals: {
        hasQuantifiedResults: hasMetrics,
        hasProfileLinks: hasLinks,
        hasBulletStructure: hasBullets,
      },
    });
  } catch (error) {
    console.error("[chatTool] analyzeResume:", error.message);
    return fail("analysis_unavailable");
  }
};

// ─── Portal overview (for "what can you do" / greetings) ──────────────────────
export const getPortalOverview = async () => {
  try {
    const [jobCount] = await connection.promise().query("SELECT COUNT(*) AS total FROM jobs WHERE approvalStatus = 'approved' AND (isDeleted IS NULL OR isDeleted = 0)");
    const [companyCount] = await connection.promise().query("SELECT COUNT(*) AS total FROM companies");
    return ok({
      openJobs: Number(jobCount?.[0]?.total || 0),
      registeredCompanies: Number(companyCount?.[0]?.total || 0),
    });
  } catch (error) {
    console.error("[chatTool] getPortalOverview:", error.message);
    return fail("portal_data_unavailable");
  }
};

export const CHAT_TOOL_METADATA = {
  salaryUnit: "LPA (as listed on the portal)",
  displaySkill,
};
