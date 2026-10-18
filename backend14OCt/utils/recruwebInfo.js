// Verified information about Recruweb Resources Pvt. Ltd.
//
// Recruweb is a separate HR / recruitment company. It must never be described
// as the Ardhnarishwar job portal (and vice versa). This module keeps the facts,
// the detection helpers and a deterministic reply builder in one place so the
// rest of the chat assistant stays untouched.

export const RECRUWEB_INFO = {
  name: "Recruweb Resources Pvt. Ltd.",
  website: "https://recruweb.com/",
  email: "info@recruweb.com",
  phone: "093365 32636",
  address:
    "Office No. 1, Basement, H-169, Hazratpur Wajidpur, D Block, Sector 63, Noida, Uttar Pradesh 201301",
  hours: "Open, closes at 6:30 pm (as listed on Google)",
  audience: "IT companies, multinational corporations (MNCs) and Indian enterprises",
  services: [
    "Recruitment and talent acquisition",
    "Payroll management",
    "PF & ESI services",
    "Workforce solutions",
    "Strategic HR consulting",
  ],
};

const RECRUWEB_RE = /\brecru\s?web(?:\.com)?\b/i;
const ARDHNARISHWAR_RE = /ardh\w*nari\w*/i;

export const mentionsRecruweb = (text) => RECRUWEB_RE.test(String(text || ""));
export const mentionsArdhnarishwar = (text) => ARDHNARISHWAR_RE.test(String(text || ""));

const CONTACT_RE =
  /\b(address|location|located|where|phone|call|number|contact|hours|timing|timings|open|close|closes|website|site|email|mail|reach|office|visit)\b/i;
const SERVICES_RE =
  /\b(service|services|offer|offers|provide|provides|payroll|pf|esi|consulting|consultancy|recruitment|staffing|talent|workforce|clients|industry|industries)\b/i;

// Job-related questions ("jobs at Recruweb", "is Recruweb hiring") should keep
// using the normal job flow; Recruweb facts are only added as context there.
export const isJobRelatedQuestion = (text) =>
  /\b(job|jobs|hiring|vacanc\w*|opening|openings|career|careers|apply|salary|interview)\b/i.test(String(text || ""));

// True when a short follow-up ("what is their phone number?") most likely
// refers to Recruweb because the last exchange was about it.
export const isRecruwebFollowUp = (message, conversationHistory = []) => {
  const text = String(message || "").trim();
  if (!text || text.split(/\s+/).length > 10) return false;
  if (mentionsArdhnarishwar(text) || mentionsRecruweb(text)) return false;
  if (!CONTACT_RE.test(text) && !SERVICES_RE.test(text)) return false;

  const recent = (conversationHistory || []).filter((m) => m?.text).slice(-2);
  if (!recent.length) return false;
  const joined = recent.map((m) => String(m.text)).join(" ");
  return mentionsRecruweb(joined) && !mentionsArdhnarishwar(joined);
};

const aboutBlock = () =>
  `**${RECRUWEB_INFO.name}** is a trusted HR and recruitment solutions partner. It helps ${RECRUWEB_INFO.audience} build high-performing teams and streamline their workforce operations, with end-to-end HR solutions tailored to each organization's needs. Recruweb follows a structured recruitment process that combines industry expertise with rigorous candidate screening.`;

const servicesBlock = () =>
  `#### Services\n${RECRUWEB_INFO.services.map((s) => `- **${s}**`).join("\n")}`;

const contactBlock = () =>
  `#### Contact & Location\n- 🌐 **Website**: ${RECRUWEB_INFO.website}\n- 📍 **Address**: ${RECRUWEB_INFO.address}\n- 📞 **Phone**: ${RECRUWEB_INFO.phone}\n- ✉️ **Email**: ${RECRUWEB_INFO.email}\n- 🕕 **Hours**: ${RECRUWEB_INFO.hours}`;

const FOLLOW_UPS = `---\n### 💡 Suggested Follow-ups & Next Steps\n1. **Know the services**: Ask me *"What services does Recruweb offer?"*.\n2. **Get in touch**: Ask me *"What is Recruweb's address and phone number?"*.\n3. **Explore the portal**: Ask me *"What is Ardhnarishwar?"* to learn about this job portal, or tell me a role to search jobs.`;

// Deterministic, always-correct answer about Recruweb.
export const buildRecruwebReply = (message = "", withFollowUps = true) => {
  const wantsContact = CONTACT_RE.test(message);
  const wantsServices = SERVICES_RE.test(message);

  const parts = [];
  if (wantsContact && !wantsServices) {
    parts.push(`### Recruweb Resources Pvt. Ltd. - Contact Details`);
    parts.push(contactBlock());
    parts.push(`Recruweb is an HR and recruitment solutions company; ask me if you would like to know about its services.`);
  } else if (wantsServices && !wantsContact) {
    parts.push(`### Recruweb Resources Pvt. Ltd. - Services`);
    parts.push(aboutBlock());
    parts.push(servicesBlock());
  } else {
    parts.push(`### What is Recruweb?`);
    parts.push(aboutBlock());
    parts.push(servicesBlock());
    parts.push(contactBlock());
  }
  if (withFollowUps) parts.push(FOLLOW_UPS);
  return parts.join("\n\n");
};

// Facts block handed to the language model when both names appear in the same
// question, or when Recruweb is mentioned inside another kind of request.
export const RECRUWEB_FACTS_FOR_MODEL = `RECRUWEB FACTS (Recruweb is a separate HR and recruitment company; it is NOT the Ardhnarishwar job portal - never mix the two, and never claim a relationship between them):
Company: ${RECRUWEB_INFO.name}
What it does: trusted HR and recruitment solutions partner for ${RECRUWEB_INFO.audience}; end-to-end HR solutions; structured recruitment process with industry expertise and rigorous candidate screening.
Services: ${RECRUWEB_INFO.services.join("; ")}.
Website: ${RECRUWEB_INFO.website} | Email: ${RECRUWEB_INFO.email} | Phone: ${RECRUWEB_INFO.phone}
Address: ${RECRUWEB_INFO.address}
Hours: ${RECRUWEB_INFO.hours}`;
