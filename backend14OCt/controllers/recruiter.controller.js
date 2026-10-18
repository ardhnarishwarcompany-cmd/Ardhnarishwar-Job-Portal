import { connection } from "../models/dbModels.js";
import { User } from "../models/user.model.js";
import { sendOtpEmail, isEmailConfigured } from "../utils/mailer.js";

function formatCandidateResponse(candidate, rawProfile = {}, score = 0, keywords = [], candidateText = "") {
  const profile = (rawProfile && typeof rawProfile === "object") ? rawProfile : {};
  const personal = profile.personal || {};
  const career = profile.career || {};
  const contact = profile.contact || {};
  const exp = profile.experience || {};

  const photo = candidate.profilePhoto || personal.photo || personal.profilePhoto || profile.profilePhoto || null;
  const resume = candidate.resume || profile.resume || personal.resume || null;
  const bio = personal.bio || profile.bio || candidate.bio || "";
  const loc = personal.city || personal.address || candidate.location || (Array.isArray(career.preferredLocations) ? career.preferredLocations[0] : (typeof career.preferredLocations === "string" ? career.preferredLocations : null)) || profile.location || "Not specified";
  const salary = career.expectedCtc || career.salary?.expected || career.salary || profile.salary?.expected || profile.expectedSalary || candidate.expectedSalary || "";
  
  let experienceDisplay = "";
  if (typeof exp === "object" && exp !== null && (exp.totalYears || exp.totalMonths)) {
    experienceDisplay = `${exp.totalYears || 0} yrs ${exp.totalMonths || 0} mos`;
  } else if (typeof exp === "string" && exp.trim()) {
    experienceDisplay = exp;
  } else if (candidate.experience) {
    experienceDisplay = `${candidate.experience} yrs`;
  }

  const skillsList = profile.skills || (candidate.skills ? (typeof candidate.skills === "string" ? candidate.skills.split(",").map(s => s.trim()) : candidate.skills) : []);

  return {
    id: candidate.id,
    fullname: candidate.fullname,
    email: candidate.email,
    phoneNumber: candidate.phoneNumber || contact.mobile || "",
    location: loc,
    skills: skillsList,
    experience: experienceDisplay,
    expectedSalary: salary,
    bio: bio,
    profilePhoto: photo,
    resume: resume,
    matchScore: score,
    matchedKeywords: keywords.filter(kw => candidateText.toLowerCase().includes(kw)),
    candidateProfile: {
      ...profile,
      personal: { 
        ...personal, 
        bio: personal.bio || bio,
        religion: personal.religion || candidate.religion,
        category: personal.category || candidate.category,
      },
      contact: { ...contact, mobile: contact.mobile || candidate.phoneNumber },
      career: { ...career, expectedCtc: career.expectedCtc || salary },
      documents: profile.documents || {},
      verificationDocs: profile.verificationDocs || (profile.documents ? Object.values(profile.documents).filter(Boolean) : []),
      resume: resume,
      profilePhoto: photo,
    },
  };
}

// ─── Find Candidates by JD Text ──────────────────────────────
export const findCandidatesByJD = async (req, res) => {
  try {
    const { jd_text, filters = {} } = req.body;

    if (!jd_text || jd_text.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Please provide a job description with at least 10 characters." });
    }

    const keywords = extractKeywords(jd_text);

    let query = `
      SELECT 
        u.id, u.fullname, u.email, u.phoneNumber, u.profilePhoto, u.resume, u.bio,
        u.candidateProfile, u.skills, u.experience, u.city as location
      FROM users u
      WHERE u.role = 'Employee' AND u.isBlocked = 0
    `;
    const params = [];

    if (filters.location && filters.location.length > 0) {
      const locationPlaceholders = filters.location.map(() => "u.city LIKE ?").join(" OR ");
      query += ` AND (${locationPlaceholders})`;
      filters.location.forEach(loc => params.push(`%${loc}%`));
    }

    if (filters.experience) {
      const [minY, maxY] = parseExperienceRange(filters.experience);
      if (minY !== null) query += ` AND CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.candidateProfile, '$.experience.totalYears')), '0') AS UNSIGNED) >= ?` && params.push(minY);
      if (maxY !== null) query += ` AND CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(u.candidateProfile, '$.experience.totalYears')), '0') AS UNSIGNED) <= ?` && params.push(maxY);
    }

    const [candidates] = await connection.promise().query(query, params);

    const scored = candidates.map(candidate => {
      const profile = safeParseJSON(candidate.candidateProfile);
      const candidateText = buildCandidateText(candidate, profile);
      const score = computeMatchScore(keywords, candidateText);

      if (filters.skills && filters.skills.length > 0) {
        const hasSkill = filters.skills.some(skill =>
          candidateText.toLowerCase().includes(skill.toLowerCase())
        );
        if (!hasSkill) return null;
      }

      if (filters.salary) {
        const [minS, maxS] = parseSalaryRange(filters.salary);
        const candidateSalary = parseFloat(profile?.career?.expectedCtc || profile?.expectedSalary || profile?.salary || 0);
        if (minS && candidateSalary < minS) return null;
        if (maxS && candidateSalary > maxS) return null;
      }

      return formatCandidateResponse(candidate, profile, score, keywords, candidateText);
    }).filter(Boolean).sort((a, b) => b.matchScore - a.matchScore);

    return res.json({
      success: true,
      candidates: scored,
      extractedKeywords: keywords,
      total: scored.length,
    });
  } catch (err) {
    console.error("findCandidatesByJD error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── Find Candidates by Filters Only ─────────────────────────
export const findCandidatesByFilter = async (req, res) => {
  try {
    const {
      jobTitle, skills, location, experience, salary, gender, maritalStatus,
      employmentType, workMode, qualification, shift,
      religion, caste, category,
      experienceLetter, accountStatement, relievingLetter, salarySlip,
      country, state, city, sector,
      requireUploadedDocs
    } = req.query;

    let query = `
      SELECT u.id, u.fullname, u.email, u.phoneNumber, u.profilePhoto, u.resume, u.bio,
             u.candidateProfile, u.skills, u.experience, u.city as location, u.religion, u.category, u.education
      FROM users u
      WHERE u.role = 'Employee' AND u.isBlocked = 0
    `;
    const [candidates] = await connection.promise().query(query);

    const manualKeywords = [];
    if (jobTitle && jobTitle.trim()) {
      manualKeywords.push(...jobTitle.split(/[,\s]+/).map(k => k.trim()).filter(Boolean));
    }
    if (skills && skills.trim()) {
      manualKeywords.push(...skills.split(/[,\s]+/).map(k => k.trim()).filter(Boolean));
    }
    
    const keywords = [...new Set(manualKeywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 1))];

    const scored = candidates.map(candidate => {
      const profile = safeParseJSON(candidate.candidateProfile);
      const candidateText = buildCandidateText(candidate, profile);
      const docs = profile?.documents || {};
      
      // Relevance Score calculation based on Title & Skills
      let score = 100;
      if (keywords.length > 0) {
        score = computeMatchScore(keywords, candidateText);
        if (score === 0) return null;
      }

      // 1. Job Title / Role Filtration
      if (jobTitle && jobTitle.trim() && jobTitle.toLowerCase() !== "any") {
        const titleTokens = jobTitle.split(/[,\s]+/).map(t => t.trim().toLowerCase()).filter(t => t.length > 1);
        if (titleTokens.length > 0) {
          const candRoles = [
            profile?.career?.jobTitle,
            profile?.career?.title,
            profile?.career?.desiredRole,
            profile?.career?.department,
            profile?.career?.functionalArea,
            profile?.experience?.designation,
            Array.isArray(profile?.career?.titles) ? profile.career.titles.join(" ") : profile?.career?.titles,
            candidate.bio,
            profile?.bio
          ].filter(Boolean).join(" ").toLowerCase();

          const hasTitleMatch = titleTokens.some(tok => candRoles.includes(tok) || candidateText.includes(tok));
          if (!hasTitleMatch) return null;
        }
      }

      // 2. Required Skills Filtration
      if (skills && skills.trim() && skills.toLowerCase() !== "any") {
        const skillTokens = skills.split(/[,\s]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 1);
        if (skillTokens.length > 0) {
          const candSkills = [
            candidate.skills,
            Array.isArray(profile?.skills) ? profile.skills.map(s => (typeof s === "object" && s ? s.skill || s.name : s)).join(" ") : profile?.skills
          ].filter(Boolean).join(" ").toLowerCase();

          const hasSkillMatch = skillTokens.some(tok => candSkills.includes(tok) || candidateText.includes(tok));
          if (!hasSkillMatch) return null;
        }
      }

      // 3. Country Filtration
      if (country && country.trim() && country.toLowerCase() !== "any") {
        const targetCountry = country.trim().toLowerCase();
        const candCountry = [profile?.personal?.country, profile?.location, candidate.location].filter(Boolean).join(" ").toLowerCase();
        if (!candCountry.includes(targetCountry)) return null;
      }

      // 4. State Filtration
      if (state && state.trim() && state.toLowerCase() !== "any") {
        const targetState = state.trim().toLowerCase();
        const candState = [profile?.personal?.state, profile?.location, candidate.location].filter(Boolean).join(" ").toLowerCase();
        if (!candState.includes(targetState)) return null;
      }

      // 5. City Filtration (checks Current City & Preferred Career Cities)
      if (city && city.trim() && city.toLowerCase() !== "any") {
        const targetCity = city.trim().toLowerCase();
        const candCities = [
          candidate.city,
          profile?.personal?.city,
          candidate.location,
          profile?.location,
          Array.isArray(profile?.career?.locations) ? profile.career.locations.join(" ") : profile?.career?.locations,
          Array.isArray(profile?.career?.preferredLocations) ? profile.career.preferredLocations.join(" ") : profile?.career?.preferredLocations,
        ].filter(Boolean).join(" ").toLowerCase();

        if (!candCities.includes(targetCity)) return null;
      }

      // 6. Sector / Area Filtration
      if (sector && sector.trim() && sector.toLowerCase() !== "any") {
        const targetSector = sector.trim().toLowerCase();
        const candSector = [
          profile?.personal?.sector,
          profile?.personal?.area,
          profile?.personal?.street,
          profile?.personal?.landmark,
          profile?.personal?.address,
          profile?.personal?.houseAddress,
          profile?.personal?.building,
        ].filter(Boolean).join(" ").toLowerCase();

        if (!candSector.includes(targetSector)) return null;
      }

      // 7. Experience Filtration
      if (experience && experience.trim() && experience.toLowerCase() !== "any") {
        const [minY, maxY] = parseExperienceRange(experience);
        const candYrs = getCandidateExperienceYears(candidate, profile);
        if (candYrs !== null) {
          if (minY !== null && candYrs < minY) return null;
          if (maxY !== null && candYrs > maxY) return null;
        }
      }

      // 8. Expected Salary Filtration
      if (salary && salary.trim() && salary.toLowerCase() !== "any") {
        const [minS, maxS] = parseSalaryRange(salary);
        const candLpa = extractSalaryInLpa(profile?.career?.salary || profile?.career?.expectedCtc || profile?.expectedSalary || profile?.salary || candidate.expectedSalary);
        if (candLpa !== null && candLpa > 0) {
          if (minS !== null && candLpa < minS) return null;
          if (maxS !== null && candLpa > maxS) return null;
        }
      }

      // 9. Highest Qualification Filtration
      if (qualification && qualification.trim() && qualification.toLowerCase() !== "any") {
        const qTarget = qualification.trim().toLowerCase();
        const allEdu = [
          candidate.education,
          profile?.education?.qualification,
          profile?.education?.degree,
          profile?.education?.otherQualification,
          profile?.education?.college,
        ].filter(Boolean).join(" ").toLowerCase();

        if (!allEdu.includes(qTarget)) return null;
      }

      // 10. Religion Filtration
      if (religion && religion.trim() && religion.toLowerCase() !== "any") {
        const cRel = (profile?.personal?.religion || candidate.religion || "").toLowerCase().trim();
        const targetRel = religion.trim().toLowerCase();
        if (!cRel.includes(targetRel) && !targetRel.includes(cRel)) return null;
      }

      // 11. Caste / Category Filtration
      const targetCaste = (caste || category || "").trim().toLowerCase();
      if (targetCaste && targetCaste !== "any") {
        const cCaste = (profile?.personal?.category || profile?.personal?.caste || candidate.category || "").toLowerCase().trim();
        if (!cCaste.includes(targetCaste) && !targetCaste.includes(cCaste)) return null;
      }

      // 12. Gender Filtration
      if (gender && gender.trim() && gender.toLowerCase() !== "any") {
        const candGender = (profile?.personal?.gender || candidate.gender || "").toLowerCase().trim();
        if (candGender && candGender !== gender.trim().toLowerCase()) return null;
      }

      // 13. Marital Status Filtration
      if (maritalStatus && maritalStatus.trim() && maritalStatus.toLowerCase() !== "any") {
        const candMarital = (profile?.personal?.maritalStatus || profile?.maritalStatus || "").toLowerCase().trim();
        if (candMarital && candMarital !== maritalStatus.trim().toLowerCase()) return null;
      }

      // 14. Work Mode Filtration
      if (workMode && workMode.trim() && workMode.toLowerCase() !== "any") {
        const candMode = (
          profile?.career?.workMode ||
          profile?.workPrefs?.workMode ||
          profile?.career?.locationType ||
          profile?.workMode ||
          ""
        ).toLowerCase();
        const targetMode = workMode.trim().toLowerCase();
        
        let matchesMode = false;
        if (candMode.includes(targetMode) || targetMode.includes(candMode)) {
          matchesMode = true;
        } else if (targetMode.includes("office") || targetMode.includes("on-site")) {
          matchesMode = candMode.includes("office") || candMode.includes("on-site");
        } else if (targetMode.includes("home") || targetMode.includes("remote")) {
          matchesMode = candMode.includes("home") || candMode.includes("remote");
        } else if (targetMode.includes("hybrid")) {
          matchesMode = candMode.includes("hybrid");
        }
        
        if (!matchesMode) return null;
      }

      // 15. Shift Filtration
      if (shift && shift.trim() && shift.toLowerCase() !== "any") {
        const candShift = (
          profile?.workPrefs?.shift ||
          profile?.career?.shift ||
          profile?.shift ||
          ""
        ).toLowerCase();
        if (!candShift.includes(shift.trim().toLowerCase())) return null;
      }

      // 16. Employment Type Filtration
      if (employmentType && employmentType.trim() && employmentType.toLowerCase() !== "any") {
        const candEmp = (
          profile?.career?.jobType ||
          profile?.career?.employmentType ||
          profile?.experience?.employmentType ||
          ""
        ).toLowerCase();
        if (!candEmp.includes(employmentType.trim().toLowerCase())) return null;
      }

      // ─── Verification Document Filters ──────────────────────────
      const hasAnyUploadedDoc = !!(
        docs.experienceLetter ||
        docs.relievingLetter ||
        docs.salarySlip ||
        docs.accountStatement3M ||
        docs.accountStatement6M ||
        docs.accountStatement1Y ||
        docs.accountStatement ||
        docs.aadhaarCard ||
        docs.panCard ||
        docs.passport ||
        docs.drivingLicenseDoc ||
        docs.offerLetter ||
        docs.educationalCertificates ||
        docs.passportSizePhoto ||
        profile?.experienceLetter ||
        profile?.relievingLetter ||
        profile?.salarySlip ||
        profile?.accountStatement3M ||
        profile?.accountStatement6M ||
        profile?.accountStatement1Y ||
        (Array.isArray(profile?.verificationDocs) && profile.verificationDocs.length > 0)
      );

      if (requireUploadedDocs === "true" || requireUploadedDocs === true) {
        if (!hasAnyUploadedDoc) return null;
      }

      const hasExpLetter = Boolean(docs.experienceLetter || profile?.experienceLetter);
      const hasRelLetter = Boolean(docs.relievingLetter || profile?.relievingLetter);
      const hasSalSlip = Boolean(docs.salarySlip || profile?.salarySlip);

      // Separate Yes/No Toggle: Experience Letter
      if (experienceLetter && String(experienceLetter).toLowerCase() === "yes") {
        if (!hasExpLetter) return null;
      }

      // Separate Yes/No Toggle: Relieving Letter
      if (relievingLetter && String(relievingLetter).toLowerCase() === "yes") {
        if (!hasRelLetter) return null;
      }

      // Separate Yes/No Toggle: Salary Slip
      if (salarySlip && String(salarySlip).toLowerCase() === "yes") {
        if (!hasSalSlip) return null;
      }

      // Account Statement Options: any, 3 month, 6 month, 1 year
      if (accountStatement && String(accountStatement).toLowerCase() !== "any") {
        const asVal = String(accountStatement).toLowerCase();
        if (asVal === "3m" || asVal.includes("3")) {
          if (!docs.accountStatement3M && !profile?.accountStatement3M) return null;
        } else if (asVal === "6m" || asVal.includes("6")) {
          if (!docs.accountStatement6M && !profile?.accountStatement6M) return null;
        } else if (asVal === "1y" || asVal.includes("1") || asVal.includes("year")) {
          if (!docs.accountStatement1Y && !profile?.accountStatement1Y) return null;
        } else if (asVal === "yes" || asVal === "true") {
          if (!docs.accountStatement3M && !docs.accountStatement6M && !docs.accountStatement1Y && !docs.accountStatement && !profile?.accountStatement3M) return null;
        }
      }

      return formatCandidateResponse(candidate, profile, score, keywords, candidateText);
    }).filter(Boolean).sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ success: true, candidates: scored, extractedKeywords: keywords, total: scored.length });
  } catch (err) {
    console.error("findCandidatesByFilter error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ─── Helpers ──────────────────────────────────────────────────

function extractKeywords(text) {
  // Tech skills, roles, tools - common patterns
  const techPattern = /\b(react|node|python|java|javascript|typescript|angular|vue|mongodb|mysql|postgresql|sql|aws|docker|kubernetes|rest|graphql|redux|express|django|flask|spring|android|ios|swift|kotlin|php|laravel|css|html|tailwind|figma|git|agile|scrum|devops|machine learning|deep learning|nlp|ai|data science|tensorflow|pytorch)\b/gi;
  const rolePattern = /\b(developer|engineer|designer|analyst|manager|architect|lead|consultant|specialist|scientist|intern|senior|junior|full.?stack|front.?end|back.?end|mobile|cloud|data|security|qa|devops)\b/gi;
  const expPattern = /\b(\d+\+?\s*(?:years?|yrs?))\b/gi;

  const found = new Set();
  [...(text.match(techPattern) || []),
   ...(text.match(rolePattern) || []),
   ...(text.match(expPattern) || [])
  ].forEach(kw => found.add(kw.toLowerCase().trim()));

  // Also extract words between 3-20 chars that aren't stop words
  const stopWords = new Set(["the","and","for","with","that","this","have","from","they","will","been","your","about","when","which","their","there","more","also","into","then","than","some","what","over","after","other","through","should","would","could","might","must","these","those","where","while","both","each","only","even","such","just","much","any"]);
  const words = text.toLowerCase().match(/\b[a-z]{3,20}\b/g) || [];
  words.forEach(w => { if (!stopWords.has(w)) found.add(w); });

  return [...found].slice(0, 40); // limit to 40 keywords
}

function buildCandidateText(candidate, profile) {
  const skillsArray = [];
  if (candidate.skills) {
    skillsArray.push(candidate.skills);
  }
  if (profile?.skills) {
    if (Array.isArray(profile.skills)) {
      profile.skills.forEach(s => {
        if (typeof s === "object" && s !== null) {
          if (s.skill) skillsArray.push(s.skill);
        } else {
          skillsArray.push(String(s));
        }
      });
    } else if (typeof profile.skills === "string") {
      skillsArray.push(profile.skills);
    }
  }
  const skillsText = skillsArray.join(" ");

  const locationsArray = [
    candidate.location,
    profile?.location,
    profile?.personal?.city,
    profile?.personal?.state,
    profile?.personal?.country
  ];
  if (Array.isArray(profile?.career?.locations)) {
    locationsArray.push(...profile.career.locations);
  }
  const locationText = locationsArray.filter(Boolean).join(" ");

  const experienceText = [
    candidate.experience,
    profile?.experience?.total,
    profile?.experience?.years,
    profile?.experience?.employmentType
  ].filter(Boolean).join(" ");

  const rolesArray = [
    profile?.career?.title,
    profile?.career?.jobTitle,
    profile?.career?.desiredRole,
    profile?.career?.department,
    profile?.career?.functionalArea,
    profile?.experience?.designation,
    profile?.experience?.company
  ];
  if (Array.isArray(profile?.career?.titles)) {
    rolesArray.push(...profile.career.titles);
  }
  const rolesText = rolesArray.filter(Boolean).join(" ");

  return [
    candidate.fullname,
    locationText,
    skillsText,
    experienceText,
    profile?.bio,
    rolesText,
    profile?.education?.qualification,
    profile?.education?.college,
  ].filter(Boolean).join(" ").toLowerCase();
}

function computeMatchScore(keywords, candidateText) {
  if (!keywords.length) return 0;
  const text = candidateText.toLowerCase();
  const matched = keywords.filter(kw => text.includes(kw.toLowerCase()));
  return Math.round((matched.length / keywords.length) * 100);
}

function safeParseJSON(str) {
  if (!str) return {};
  try {
    const parsed = typeof str === "string" ? JSON.parse(str) : str;
    return (parsed && typeof parsed === "object") ? parsed : {};
  } catch {
    return {};
  }
}

function getCandidateExperienceYears(candidate, profile) {
  const expObj = profile?.experience;
  if (expObj && typeof expObj === "object") {
    if (expObj.totalYears !== undefined && expObj.totalYears !== "" && !isNaN(Number(expObj.totalYears))) {
      return Number(expObj.totalYears) + (Number(expObj.totalMonths || 0) / 12);
    }
    if (expObj.years !== undefined && expObj.years !== "" && !isNaN(Number(expObj.years))) {
      return Number(expObj.years) + (Number(expObj.months || 0) / 12);
    }
    if (expObj.total && typeof expObj.total === "string") {
      const m = expObj.total.match(/([\d.]+)/);
      if (m) return parseFloat(m[1]);
    }
  }
  if (candidate.experience) {
    const m = String(candidate.experience).match(/([\d.]+)/);
    if (m) return parseFloat(m[1]);
  }
  if (expObj?.employmentType === "Fresher" || profile?.personal?.employmentType === "Fresher") {
    return 0;
  }
  return null;
}

function extractSalaryInLpa(val) {
  if (!val && val !== 0) return null;
  if (typeof val === "object" && val !== null) {
    val = val.expected || val.expectedCtc || val.current || val.amount || "";
  }
  let str = String(val).replace(/[\$₹,]/g, "").trim();
  if (!str) return null;
  const num = parseFloat(str);
  if (isNaN(num)) return null;
  if (num >= 10000) {
    return num / 100000; // In INR Rupees e.g. 1200000 -> 12 LPA
  }
  return num; // In LPA e.g. 12 or 12.5
}

function parseExperienceRange(exp) {
  if (!exp) return [null, null];
  const s = String(exp).toLowerCase().trim();
  if (s.includes("fresher")) {
    return [0, 1];
  }
  const match = s.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) return [parseInt(match[1]), parseInt(match[2])];
  const singlePlus = s.match(/(\d+)\+/);
  if (singlePlus) return [parseInt(singlePlus[1]), null];
  const single = s.match(/(\d+)/);
  if (single) {
    const val = parseInt(single[1]);
    return [val, null];
  }
  return [null, null];
}

function parseSalaryRange(salary) {
  if (!salary) return [null, null];
  
  const extractLpa = (s) => {
    if (!s) return null;
    const clean = String(s).replace(/[\$₹,]/g, "").trim();
    const m = clean.match(/([\d.]+)\s*(k|l|lpa|lac|lakh|lacs|lakhs)?/i);
    if (!m) return null;
    let val = parseFloat(m[1]);
    if (isNaN(val)) return null;
    const unit = m[2]?.toLowerCase();
    if (unit === "k") return val / 100;
    if (val >= 10000) return val / 100000;
    return val;
  };

  const str = String(salary).trim();
  if (str.includes("+")) {
    const val = extractLpa(str);
    return [val, null];
  }
  const parts = str.split(/[-–]/);
  if (parts.length === 2) {
    return [extractLpa(parts[0]), extractLpa(parts[1])];
  }
  const single = extractLpa(str);
  if (single !== null) {
    return [0, single];
  }
  return [null, null];
}

// ─── Recruiter Login Email Update & Verification ──────────────
const recruiterEmailOtpStore = new Map();

export const sendEmailChangeOtp = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const recruiterId = req.id;

    if (!newEmail || !String(newEmail).trim()) {
      return res.status(400).json({ success: false, message: "New email address is required" });
    }

    const normalizedEmail = String(newEmail).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email address format" });
    }

    // Check if email already belongs to another user
    const [existing] = await connection.promise().query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [normalizedEmail, recruiterId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "This email address is already registered with another account.",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    recruiterEmailOtpStore.set(String(recruiterId), {
      newEmail: normalizedEmail,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    if (!isEmailConfigured()) {
      return res.status(503).json({
        success: false,
        message: "SMTP email service is not configured on backend.",
      });
    }

    await sendOtpEmail(normalizedEmail, otp);
    return res.json({
      success: true,
      message: `Verification OTP sent to ${normalizedEmail}`,
    });
  } catch (error) {
    console.error("sendEmailChangeOtp error:", error);
    return res.status(500).json({ success: false, message: "Failed to send verification OTP" });
  }
};

export const verifyEmailChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const recruiterId = req.id;

    if (!otp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }

    const record = recruiterEmailOtpStore.get(String(recruiterId));
    if (!record) {
      return res.status(400).json({
        success: false,
        message: "No email update OTP request found. Please request an OTP first.",
      });
    }

    if (Date.now() > record.expiresAt) {
      recruiterEmailOtpStore.delete(String(recruiterId));
      return res.status(400).json({
        success: false,
        message: "Verification OTP has expired. Please request a new OTP.",
      });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });
    }

    const newEmail = record.newEmail;

    // Double check email uniqueness
    const [existing] = await connection.promise().query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [newEmail, recruiterId]
    );

    if (existing.length > 0) {
      recruiterEmailOtpStore.delete(String(recruiterId));
      return res.status(400).json({
        success: false,
        message: "This email address is already registered with another account.",
      });
    }

    // Fetch user
    const user = await User.findById(recruiterId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update user email
    user.email = newEmail;

    // Also sync recruiterProfile JSON if present
    if (user.recruiterProfile) {
      try {
        const parsed = typeof user.recruiterProfile === "string"
          ? JSON.parse(user.recruiterProfile)
          : user.recruiterProfile;
        if (parsed && typeof parsed === "object") {
          parsed.email = newEmail;
          if (parsed.company) parsed.company.email = newEmail;
          if (parsed.contact) parsed.contact.email = newEmail;
          user.recruiterProfile = JSON.stringify(parsed);
        }
      } catch (e) {
        console.error("Error syncing recruiterProfile email:", e);
      }
    }

    await user.save();
    recruiterEmailOtpStore.delete(String(recruiterId));

    const updatedUser = await User.findById(recruiterId);

    return res.json({
      success: true,
      message: "Login email address updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("verifyEmailChangeOtp error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify OTP and update email" });
  }
};

