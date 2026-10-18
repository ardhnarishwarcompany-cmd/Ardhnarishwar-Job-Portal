import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, Sparkles, Users, X, Loader2,
  MapPin, Briefcase, IndianRupee, Star, ChevronDown, Check,
  RotateCcw, Mail, FileText, User2, Zap, GraduationCap, Globe, Phone, Calendar, User, ExternalLink,
  ShieldCheck, FileCheck, CheckCircle2, Download, Eye, Compass, Car
} from "lucide-react";
import Navbar from "@/components/components_lite/Navbar";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RECRUITER_API_ENDPOINT, MESSAGING_API_ENDPOINT, getFileUrl } from "@/utils/data";
import { useOptionPool } from "@/hooks/useOptionPool";
import AutoCompleteInput from "@/components/wizard/AutoCompleteInput";

const SKILL_OPTIONS = [
  "React", "Node.js", "Python", "Java", "JavaScript", "TypeScript", "Angular", "Vue",
  "MongoDB", "MySQL", "SQL", "AWS", "Docker", "Kubernetes", "GraphQL", "Redux",
  "Django", "Flask", "CSS", "Tailwind", "Figma", "Git", "DevOps", "AI/ML",
  "Data Science", "Fullstack", "Frontend", "Backend", "Mobile", "Cloud", "MERN"
];

const LOCATION_OPTIONS = [
  "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai", "Pune",
  "Noida", "Gurgaon", "Kolkata", "Ahmedabad", "Remote"
];

const EXPERIENCE_OPTIONS = [
  "Fresher (0-1 yr)", "0-3 years", "3-5 years", "5-7 years", "7-10 years", "10+ years"
];

const SALARY_OPTIONS = [
  "0-3 LPA", "3-6 LPA", "6-10 LPA", "10-15 LPA", "15-25 LPA", "25 LPA+"
];

const AVAILABILITY_OPTIONS = ["Immediate", "2 Weeks", "1 Month", "2+ Months"];

const emptyFilters = {
  jobTitle: "", skills: "", location: "", experience: "", salary: "",
  gender: "", maritalStatus: "", employmentType: "", workMode: "", qualification: "", shift: "",
  religion: "", caste: "",
  country: "", state: "", city: "", sector: "",
  experienceLetter: "no", relievingLetter: "no", salarySlip: "no", accountStatement: "any"
};

const formatSalaryDisplay = (sal) => {
  if (!sal && sal !== 0) return "";
  let text = typeof sal === "object" && sal !== null
    ? (sal.expected || sal.current || sal.max || sal.expectedCtc || "")
    : String(sal);
  if (!text) return "";
  
  text = text.replace(/[\$₹]/g, "").trim();
  const num = parseFloat(text.replace(/,/g, ""));
  if (!isNaN(num) && num > 0) {
    if (num >= 10000) {
      const lpa = num / 100000;
      return `₹${parseFloat(lpa.toFixed(2))} LPA`;
    }
    return `₹${num} LPA`;
  }
  
  if (!text.toLowerCase().includes("lpa") && !text.toLowerCase().includes("inr") && !text.toLowerCase().includes("lac")) {
    return `₹${text} LPA`;
  }
  return `₹${text}`;
};

// ─── Candidate Card ────────────────────────────────────────────────────────────
const CandidateCard = ({ candidate, onViewProfile, onContact }) => {
  const { fullname, email, location, skills, experience, expectedSalary, bio, profilePhoto, matchScore, matchedKeywords } = candidate;
  const scoreColor = matchScore >= 70 ? "text-green-600 bg-green-50 border-green-200"
    : matchScore >= 40 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-slate-500 bg-slate-50 border-slate-200";

  const rawPhoto = candidate.candidateProfile?.personal?.photo 
    || candidate.candidateProfile?.personal?.profilePhoto 
    || candidate.candidateProfile?.profilePhoto 
    || profilePhoto 
    || null;
  const photoUrl = rawPhoto ? getFileUrl(rawPhoto) : null;
  
  const displayExperience = typeof experience === "object" && experience !== null 
    ? (experience.total || (experience.years ? `${experience.years} yrs ${experience.months || 0} mos` : "") || experience.employmentType || "") 
    : (experience ? (String(experience).includes("yr") ? experience : `${experience} yrs`) : "");
    
  const rawSal = candidate.candidateProfile?.career?.expectedCtc 
    || candidate.candidateProfile?.career?.salary?.expected 
    || candidate.candidateProfile?.career?.salary 
    || expectedSalary 
    || "";
  const displaySalaryStr = formatSalaryDisplay(rawSal);

  const skillArrayRaw = Array.isArray(skills)
    ? skills
    : typeof skills === "string"
    ? skills.split(/[,;]/).map(s => s.trim()).filter(Boolean)
    : [];
    
  const skillArray = skillArrayRaw.map(s => {
    if (typeof s === "object" && s !== null) return s.skill || s.name || "";
    return String(s);
  }).filter(Boolean);

  const displayBio = bio || candidate.candidateProfile?.personal?.bio || candidate.candidateProfile?.bio || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
    >
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {photoUrl ? (
            <img src={photoUrl} alt={fullname} className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-100 flex-shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {fullname?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-slate-900 text-base leading-tight truncate">{fullname}</h3>
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-500 truncate">{location || "Not specified"}</span>
            </div>
          </div>
        </div>
        {matchScore !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold flex-shrink-0 self-start xs:self-auto ${scoreColor}`}>
            <Star className="h-3 w-3" />
            {matchScore}% match
          </div>
        )}
      </div>

      {displayBio && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{displayBio}</p>}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {skillArray.slice(0, 6).map((skill, i) => (
          <span
            key={i}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              matchedKeywords?.some(kw => skill.toLowerCase().includes(kw.toLowerCase()))
                ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {skill}
          </span>
        ))}
        {skillArray.length > 6 && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">+{skillArray.length - 6}</span>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        {displayExperience && (
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {displayExperience}
          </span>
        )}
        {displaySalaryStr && (
          <span className="font-bold text-slate-700">
            {displaySalaryStr}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onContact(candidate.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Mail className="h-3.5 w-3.5" />
          Contact
        </button>
        <button
          onClick={() => onViewProfile(candidate)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
        >
          <User2 className="h-3.5 w-3.5" />
          View Profile
        </button>
      </div>
    </motion.div>
  );
};

// ─── Main FindCandidates Page ─────────────────────────────────────────────────
const FindCandidates = () => {
  const navigate = useNavigate();
  const { optionPool } = useOptionPool();
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("fc_activeTab") || "jd";
  });
  const [jdText, setJdText] = useState(() => {
    return sessionStorage.getItem("fc_jdText") || "";
  });
  const [filters, setFilters] = useState(() => {
    try {
      const saved = sessionStorage.getItem("fc_filters");
      return saved ? JSON.parse(saved) : emptyFilters;
    } catch {
      return emptyFilters;
    }
  });
  const [candidates, setCandidates] = useState(() => {
    try {
      const saved = sessionStorage.getItem("fc_candidates");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(() => {
    return sessionStorage.getItem("fc_searched") === "true";
  });
  const [extractedKeywords, setExtractedKeywords] = useState(() => {
    try {
      const saved = sessionStorage.getItem("fc_extractedKeywords");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(() => {
    try {
      const saved = sessionStorage.getItem("fc_selectedCandidate");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    sessionStorage.setItem("fc_activeTab", activeTab);
    sessionStorage.setItem("fc_jdText", jdText);
    sessionStorage.setItem("fc_filters", JSON.stringify(filters));
    sessionStorage.setItem("fc_candidates", JSON.stringify(candidates));
    sessionStorage.setItem("fc_searched", String(searched));
    sessionStorage.setItem("fc_extractedKeywords", JSON.stringify(extractedKeywords));
    sessionStorage.setItem("fc_selectedCandidate", JSON.stringify(selectedCandidate));
  }, [activeTab, jdText, filters, candidates, searched, extractedKeywords, selectedCandidate]);

  const handleContact = async (candidateId) => {
    try {
      const res = await axios.post(
        `${MESSAGING_API_ENDPOINT}/recruiter-candidate/start`,
        { candidateId },
        { withCredentials: true }
      );
      if (res.data.success) {
        navigate("/recruiter/chats", { state: { selectConversationId: res.data.conversation.id } });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not start chat");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(p => ({ ...p, [name]: value }));
  };

  const setFilterField = (name, value) => {
    setFilters(p => ({ ...p, [name]: value }));
  };

  const clearFilters = () => setFilters(emptyFilters);

  const handleSearch = useCallback(async () => {
    if (activeTab === "jd" && (!jdText || jdText.trim().length < 10)) {
      toast.error("Please enter a job description of at least 10 characters.");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      let res;
      if (activeTab === "jd") {
        res = await axios.post(
          `${RECRUITER_API_ENDPOINT}/find-candidates`,
          { jd_text: jdText, filters: {} },
          { withCredentials: true }
        );
      } else {
        res = await axios.get(
          `${RECRUITER_API_ENDPOINT}/find-candidates`,
          { params: filters, withCredentials: true }
        );
      }
      
      if (res.data.success) {
        setCandidates(res.data.candidates || []);
        setExtractedKeywords(res.data.extractedKeywords || []);
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Something went wrong during candidate matching");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [jdText, filters, activeTab]);
  const ManualSearchForm = () => (
    <div className="space-y-6">
      {/* Primary Role & Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Job Title / Role</label>
          <AutoCompleteInput 
            options={optionPool.jobTitle} 
            value={filters.jobTitle} 
            onChange={(v) => setFilterField("jobTitle", v)}
            placeholder="Select or type Job Title (e.g. Frontend Developer)"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Required Skills</label>
          <AutoCompleteInput 
            options={optionPool.skills} 
            value={filters.skills} 
            onChange={(v) => setFilterField("skills", v)}
            placeholder="Select or type Skills (e.g. React, Node.js, Python)"
          />
        </div>
      </div>

      {/* Granular Location Filtration */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3 transition-colors">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> Location Filtration
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Country</label>
            <AutoCompleteInput 
              options={optionPool.country} 
              value={filters.country} 
              onChange={(v) => setFilterField("country", v)}
              placeholder="Select or type Country (e.g. India)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">State</label>
            <AutoCompleteInput 
              options={optionPool.state} 
              value={filters.state} 
              onChange={(v) => setFilterField("state", v)}
              placeholder="Select or type State (e.g. Maharashtra, Delhi)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">City</label>
            <AutoCompleteInput 
              options={optionPool.city} 
              value={filters.city} 
              onChange={(v) => setFilterField("city", v)}
              placeholder="Select or type City (e.g. Mumbai, Pune)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sector / Area</label>
            <AutoCompleteInput 
              options={optionPool.sector} 
              value={filters.sector} 
              onChange={(v) => setFilterField("sector", v)}
              placeholder="Select or type Sector / Area (e.g. Sector 62)"
            />
          </div>
        </div>
      </div>

      {/* Experience, Salary, Education */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Experience</label>
          <AutoCompleteInput 
            options={optionPool.experience} 
            value={filters.experience} 
            onChange={(v) => setFilterField("experience", v)}
            placeholder="Select or type Experience (e.g. 2-5 Years, 3 years)"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Expected Salary</label>
          <input 
            type="text" name="salary" value={filters.salary} onChange={handleInputChange}
            placeholder="e.g. 15 LPA" 
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Highest Qualification</label>
          <AutoCompleteInput 
            options={optionPool.education} 
            value={filters.qualification} 
            onChange={(v) => setFilterField("qualification", v)}
            placeholder="Select or type Qualification (e.g. B.Tech, MBA)"
          />
        </div>
      </div>

      {/* Diversity & Preferences: Religion, Caste, Gender, Marital Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Religion</label>
          <AutoCompleteInput 
            options={optionPool.religion} 
            value={filters.religion} 
            onChange={(v) => setFilterField("religion", v)}
            placeholder="Select or type Religion (e.g. Hindu, Muslim)"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Caste / Category</label>
          <AutoCompleteInput 
            options={optionPool.category} 
            value={filters.caste} 
            onChange={(v) => setFilterField("caste", v)}
            placeholder="Select or type Category (e.g. General, OBC, SC, ST)"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gender</label>
          <select 
            name="gender" value={filters.gender} onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          >
            <option value="">Any</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Marital Status</label>
          <select 
            name="maritalStatus" value={filters.maritalStatus} onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          >
            <option value="">Any</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Work Mode & Shifts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Work Mode</label>
          <select 
            name="workMode" value={filters.workMode} onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          >
            <option value="">Any</option>
            <option value="Work From Office">Work From Office</option>
            <option value="Work From Home">Work From Home</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Remote">Remote</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preferred Shift</label>
          <select 
            name="shift" value={filters.shift} onChange={handleInputChange}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-800 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          >
            <option value="">Any</option>
            <option value="Day Shift">Day Shift</option>
            <option value="Night Shift">Night Shift</option>
            <option value="Rotational">Rotational</option>
          </select>
        </div>
      </div>

      {/* Verification Document Filters with Responsive Yes/No Toggles & Account Statement Options */}
      <div className="rounded-2xl border border-blue-200/80 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-900/60 p-4 space-y-4 shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center gap-2 border-b border-blue-100/70 dark:border-slate-800 pb-3">
          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Verification Document Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Experience Letter: Separate Yes/No Responsive Toggle Button */}
          <div className="space-y-2 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Experience Letter</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 transition-colors ${
                  filters.experienceLetter === "yes"
                    ? "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                }`}
              >
                {filters.experienceLetter === "yes" ? "Required" : "Not Required"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setFilterField("experienceLetter", "yes")}
                className={`w-full py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filters.experienceLetter === "yes"
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {filters.experienceLetter === "yes" && <Check className="h-3 w-3 stroke-[3]" />}
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFilterField("experienceLetter", "no")}
                className={`w-full py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filters.experienceLetter === "no" || !filters.experienceLetter
                    ? "bg-white dark:bg-slate-700/90 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {(filters.experienceLetter === "no" || !filters.experienceLetter) && <X className="h-3 w-3 text-slate-400 dark:text-slate-300" />}
                No
              </button>
            </div>
          </div>

          {/* 2. Relieving Letter: Separate Yes/No Responsive Toggle Button */}
          <div className="space-y-2 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Relieving Letter</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 transition-colors ${
                  filters.relievingLetter === "yes"
                    ? "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                }`}
              >
                {filters.relievingLetter === "yes" ? "Required" : "Not Required"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setFilterField("relievingLetter", "yes")}
                className={`w-full py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filters.relievingLetter === "yes"
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {filters.relievingLetter === "yes" && <Check className="h-3 w-3 stroke-[3]" />}
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFilterField("relievingLetter", "no")}
                className={`w-full py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filters.relievingLetter === "no" || !filters.relievingLetter
                    ? "bg-white dark:bg-slate-700/90 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {(filters.relievingLetter === "no" || !filters.relievingLetter) && <X className="h-3 w-3 text-slate-400 dark:text-slate-300" />}
                No
              </button>
            </div>
          </div>

          {/* 3. Salary Slip: Separate Yes/No Responsive Toggle Button */}
          <div className="space-y-2 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Salary Slip</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 transition-colors ${
                  filters.salarySlip === "yes"
                    ? "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                }`}
              >
                {filters.salarySlip === "yes" ? "Required" : "Not Required"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setFilterField("salarySlip", "yes")}
                className={`w-full py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filters.salarySlip === "yes"
                    ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {filters.salarySlip === "yes" && <Check className="h-3 w-3 stroke-[3]" />}
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFilterField("salarySlip", "no")}
                className={`w-full py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  filters.salarySlip === "no" || !filters.salarySlip
                    ? "bg-white dark:bg-slate-700/90 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-600 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                }`}
              >
                {(filters.salarySlip === "no" || !filters.salarySlip) && <X className="h-3 w-3 text-slate-400 dark:text-slate-300" />}
                No
              </button>
            </div>
          </div>

          {/* 4. Account Statement: Filter Options any, 3 month, 6 month, 1 year */}
          <div className="space-y-2 bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm dark:shadow-none flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Account Statement</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 transition-colors ${
                  (filters.accountStatement && filters.accountStatement !== "any")
                    ? "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                }`}
              >
                {filters.accountStatement === "3m"
                  ? "3 Months"
                  : filters.accountStatement === "6m"
                  ? "6 Months"
                  : filters.accountStatement === "1y"
                  ? "1 Year"
                  : "Any Statement"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
              {[
                { id: "any", label: "Any" },
                { id: "3m", label: "3 Mo" },
                { id: "6m", label: "6 Mo" },
                { id: "1y", label: "1 Yr" },
              ].map((opt) => {
                const active = (filters.accountStatement || "any").toLowerCase() === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilterField("accountStatement", opt.id)}
                    className={`py-1.5 px-1 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                      active
                        ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-500 font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Find <span className="text-blue-600 dark:text-blue-400">Candidates</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Use AI-powered JD analysis or advanced filters to discover the right talent.
              </p>
            </div>
            {searched && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-4 py-2">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{candidates.length} candidates found</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 mt-5 bg-slate-50 dark:bg-slate-900/80 w-full sm:w-fit">
            <button
              onClick={() => setActiveTab("jd")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold transition-all ${activeTab === "jd" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <Sparkles className="h-4 w-4" /> AI JD Search
            </button>
            <button
              onClick={() => setActiveTab("filter")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold transition-all ${activeTab === "filter" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filter Search
            </button>
          </div>

          {/* JD Input */}
          <AnimatePresence mode="wait">
            {activeTab === "jd" && (
              <motion.div key="jd" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm transition-colors">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Paste your Job Description
                  </label>
                  <textarea
                    value={jdText}
                    onChange={e => setJdText(e.target.value)}
                    rows={5}
                    placeholder="Paste your full job description here... Skills, requirements, experience level, and location will be automatically detected using AI to find matching candidates."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-sm text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white dark:focus:bg-slate-900 transition-colors placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  {extractedKeywords.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">Detected keywords:</span>
                      {extractedKeywords.slice(0, 15).map(kw => (
                        <span key={kw} className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">{kw}</span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={loading || !jdText.trim()}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-blue-200 dark:hover:shadow-none hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    {loading ? "Analyzing JD & Finding Candidates..." : "Find Matching Candidates"}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "filter" && (
              <motion.div key="filter" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-bold text-slate-800 dark:text-white text-lg">Manual Candidate Search</h2>
                    <button onClick={clearFilters} className="text-sm font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors">
                      Clear Fields
                    </button>
                  </div>
                  <div className="mb-6">
                    {ManualSearchForm()}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                    {loading ? "Searching..." : "Search Candidates"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">

          {/* Results */}
          <div className="flex-1">
            {!searched && !loading && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-blue-300" />
                </div>
                <p className="text-xl font-bold text-slate-500">Discover Your Ideal Candidates</p>
                <p className="text-sm mt-2 text-center max-w-xs">
                  Paste a Job Description for AI-powered matching, or use the filter panel to search by skills, experience, location & more.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-slate-500 font-semibold">
                  {activeTab === "jd" ? "Analyzing JD and matching candidates..." : "Searching candidates..."}
                </p>
              </div>
            )}

            {searched && !loading && candidates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Users className="h-20 w-20 mb-4 opacity-20" />
                <p className="text-xl font-bold">No Matching Candidates Found</p>
                <p className="text-sm mt-2">Try adjusting your JD or filters to broaden your search.</p>
              </div>
            )}

            {!loading && candidates.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {candidates.map((candidate, i) => (
                  <motion.div
                    key={candidate.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CandidateCard
                      candidate={candidate}
                      onViewProfile={(cand) => setSelectedCandidate(cand)}
                      onContact={handleContact}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
      </div>

      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-50 shadow-2xl ring-1 ring-slate-200/50 flex flex-col p-0"
            >
              {/* Cover Banner */}
              <div className="relative h-32 w-full bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  aria-label="Close"
                  className="no-shift btn-close absolute right-4 top-4 rounded-full p-2 bg-black/20 text-white hover:bg-black/30 backdrop-blur-md transition-colors"
                >
                  <X className="h-5 w-5 hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>

              {/* Profile Header Block */}
              <div className="relative z-10 px-6 sm:px-8 pb-6 bg-white border-b border-slate-100 flex-shrink-0">
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 -mt-14 sm:-mt-16 mb-4 text-center sm:text-left">
                  {(() => {
                    const photo = selectedCandidate.candidateProfile?.personal?.photo 
                      || selectedCandidate.candidateProfile?.personal?.profilePhoto 
                      || selectedCandidate.candidateProfile?.profilePhoto 
                      || selectedCandidate.profilePhoto;
                    return photo ? (
                      <img
                        src={getFileUrl(photo)}
                        alt={selectedCandidate.fullname}
                        className="relative z-20 h-24 w-24 sm:h-28 sm:w-28 rounded-3xl object-cover ring-4 ring-white shadow-2xl bg-white flex-shrink-0"
                      />
                    ) : (
                      <div className="relative z-20 h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-2xl ring-4 ring-white flex-shrink-0">
                        {selectedCandidate.fullname?.[0]?.toUpperCase()}
                      </div>
                    );
                  })()}
                  <div className="flex-1 min-w-0 pt-1 sm:pt-0">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight truncate">{selectedCandidate.fullname}</h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {selectedCandidate.candidateProfile?.career?.title || selectedCandidate.candidateProfile?.career?.currentRole || "Job Seeker"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email / Mobile Quick Tags */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs sm:text-sm text-slate-600 font-semibold">
                  <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                    <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" /> {selectedCandidate.email}
                  </span>
                  {(selectedCandidate.phoneNumber || selectedCandidate.candidateProfile?.contact?.mobile || selectedCandidate.candidateProfile?.personal?.phone) && (
                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                      <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" /> +91 {selectedCandidate.phoneNumber || selectedCandidate.candidateProfile?.contact?.mobile || selectedCandidate.candidateProfile?.personal?.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                    <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" /> {selectedCandidate.location || "Not specified"}
                  </span>
                </div>
              </div>

              {/* Bio & Details Area */}
              <div className="p-4 sm:p-8 space-y-6">
                {/* Bio */}
                {(selectedCandidate.bio || selectedCandidate.candidateProfile?.personal?.bio || selectedCandidate.candidateProfile?.bio) && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">About Me / Bio</h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {selectedCandidate.bio || selectedCandidate.candidateProfile?.personal?.bio || selectedCandidate.candidateProfile?.bio}
                    </p>
                  </div>
                )}

                {/* Content Grid */}
                {(() => {
                  const cp = selectedCandidate.candidateProfile || {};
                  const personal = cp.personal || {};
                  const career = cp.career || {};
                  const exp = cp.experience || {};
                  const workPrefs = cp.workPrefs || {};
                  const edu = cp.education || {};
                  const docs = cp.documents || {};

                  const docList = [
                    { key: "resume", label: "Resume / CV", url: selectedCandidate.resume || cp.resume || personal.resume, reqFor: "All Candidates" },
                    { key: "aadhaarCard", label: "Aadhaar Card", url: docs.aadhaarCard || cp.aadhaarCard, reqFor: "Identity Proof" },
                    { key: "panCard", label: "PAN Card", url: docs.panCard || cp.panCard, reqFor: "Tax Verification" },
                    { key: "passport", label: "Passport", url: docs.passport || cp.passport, reqFor: "Optional" },
                    { key: "drivingLicenseDoc", label: "Driving License", url: docs.drivingLicenseDoc || cp.drivingLicenseDoc, reqFor: "Optional" },
                    { key: "offerLetter", label: "Offer Letter", url: docs.offerLetter || cp.offerLetter, reqFor: "Optional" },
                    { key: "educationalCertificates", label: "Educational Certificates", url: docs.educationalCertificates || cp.educationalCertificates, reqFor: "Qualification" },
                    { key: "passportSizePhoto", label: "Passport Size Photo", url: docs.passportSizePhoto || cp.passportSizePhoto, reqFor: "Profile ID" },
                    { key: "experienceLetter", label: "Experience Letter", url: docs.experienceLetter || cp.experienceLetter, reqFor: "Mandatory (Experienced)", isExp: true },
                    { key: "relievingLetter", label: "Relieving Letter", url: docs.relievingLetter || cp.relievingLetter, reqFor: "Mandatory (Experienced)", isExp: true },
                    { key: "salarySlip", label: "Salary Slip", url: docs.salarySlip || cp.salarySlip, reqFor: "Mandatory (Experienced)", isExp: true },
                    { key: "accountStatement3M", label: "Bank Statement (3 Months)", url: docs.accountStatement3M || cp.accountStatement3M, reqFor: "Mandatory (Experienced)", isExp: true },
                    { key: "accountStatement6M", label: "Bank Statement (6 Months)", url: docs.accountStatement6M || cp.accountStatement6M, reqFor: "Mandatory (Experienced)", isExp: true },
                    { key: "accountStatement1Y", label: "Bank Statement (1 Year)", url: docs.accountStatement1Y || cp.accountStatement1Y, reqFor: "Mandatory (Experienced)", isExp: true },
                  ];

                  const empType = personal.employmentType || exp.employmentType || (selectedCandidate.experience ? "Experienced" : "Fresher");

                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        {/* Left Column */}
                        <div className="space-y-6">
                          {/* Personal details */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                              <User className="h-4 w-4 text-blue-500" /> Personal Details & Demographics
                            </h4>
                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <span className="text-slate-400 text-xs block">Employment Type</span>
                                <span className={`inline-flex items-center gap-1 mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${empType === "Experienced" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-emerald-100 text-emerald-800 border border-emerald-200"}`}>
                                  {empType}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Religion</span>
                                <span className="font-bold text-slate-800">{personal.religion || selectedCandidate.religion || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Caste / Category</span>
                                <span className="font-bold text-slate-800">{personal.category || selectedCandidate.category || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Nationality</span>
                                <span className="font-bold text-slate-800">{personal.nationality || "Indian"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Gender</span>
                                <span className="font-bold text-slate-800">{personal.gender || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Marital Status</span>
                                <span className="font-bold text-slate-800">{personal.maritalStatus || "Not specified"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">DOB / Age</span>
                                <span className="font-bold text-slate-800">
                                  {personal.dob || "Not specified"} 
                                  {personal.age ? ` (${personal.age} yrs)` : ""}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Contact Phone</span>
                                <span className="font-bold text-slate-800">{selectedCandidate.phoneNumber || "Not specified"}</span>
                              </div>
                            </div>

                            {/* Detailed Location Breakdown */}
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-blue-500" /> Location Breakdown
                              </h5>
                              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <div>
                                  <span className="text-slate-400 block">Sector / Area:</span>
                                  <span className="font-semibold text-slate-700">{personal.sector || "Not specified"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">City:</span>
                                  <span className="font-semibold text-slate-700">{personal.city || selectedCandidate.location || "Not specified"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">State:</span>
                                  <span className="font-semibold text-slate-700">{personal.state || "Not specified"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block">Country:</span>
                                  <span className="font-semibold text-slate-700">{personal.country || "India"}</span>
                                </div>
                                {personal.address && (
                                  <div className="col-span-2 pt-1 border-t border-slate-200/60">
                                    <span className="text-slate-400 block">Full Street Address:</span>
                                    <span className="font-medium text-slate-700">{personal.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Work Preferences */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                              <Globe className="h-4 w-4 text-blue-500" /> Work Preferences & Logistics
                            </h4>
                            <div className="grid grid-cols-2 gap-3.5">
                              <div>
                                <span className="text-slate-400 text-xs block">Preferred Shift</span>
                                <span className="font-bold text-slate-800">{workPrefs.shift || "No preference"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Weekly Off</span>
                                <span className="font-bold text-slate-800">{workPrefs.weeklyOff || "No preference"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Own Vehicle</span>
                                <span className="font-bold text-slate-800">{workPrefs.ownVehicle ? "Yes" : "No"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Driving License</span>
                                <span className="font-bold text-slate-800">
                                  {workPrefs.drivingLicense ? `Yes ${workPrefs.drivingLicenseNo ? `(${workPrefs.drivingLicenseNo})` : ""}` : "No"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Open to Relocate</span>
                                <span className="font-bold text-slate-800">{workPrefs.relocate ? "Yes" : "No"}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Willing to Travel</span>
                                <span className="font-bold text-slate-800">{workPrefs.travel ? "Yes" : "No"}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 text-xs block">Languages Known</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {Array.isArray(workPrefs.languages) && workPrefs.languages.length > 0 ? (
                                    workPrefs.languages.map((l, i) => {
                                      const langName = typeof l === "object" && l !== null ? l.language : l;
                                      const prof = typeof l === "object" && l !== null ? l.proficiency : null;
                                      return (
                                        <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                                          {langName} {prof && <span className="text-[10px] text-blue-600 font-bold">({prof})</span>}
                                        </span>
                                      );
                                    })
                                  ) : (
                                    <span className="text-slate-400 italic">Not specified</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                          {/* Career Preferences */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                              <Briefcase className="h-4 w-4 text-blue-500" /> Career Profile & Experience
                            </h4>
                            <div className="grid grid-cols-2 gap-3.5">
                              <div className="col-span-2">
                                <span className="text-slate-400 text-xs block">Target Job Titles / Roles</span>
                                <span className="font-bold text-slate-800">
                                  {Array.isArray(career.titles) && career.titles.length > 0
                                    ? career.titles.join(", ")
                                    : career.title || "Not specified"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Expected Salary</span>
                                <span className="font-bold text-slate-800">
                                  {formatSalaryDisplay(
                                    career.expectedCtc ||
                                    career.salary?.expected ||
                                    career.salary ||
                                    selectedCandidate.expectedSalary
                                  ) || "Not specified"}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-xs block">Job Type</span>
                                <span className="font-bold text-slate-800">{career.jobType || "Not specified"}</span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-slate-400 text-xs block">Preferred Locations</span>
                                <span className="font-bold text-slate-800">
                                  {Array.isArray(career.locations) && career.locations.length > 0
                                    ? career.locations.join(", ")
                                    : typeof career.locations === "string"
                                    ? career.locations
                                    : selectedCandidate.location || "Not specified"}
                                </span>
                              </div>
                            </div>

                            {/* Experience summary details */}
                            {empType === "Experienced" && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <h5 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                  <Briefcase className="h-3.5 w-3.5 text-amber-600" /> Past / Current Experience
                                </h5>
                                <div className="grid grid-cols-2 gap-2 text-xs bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                                  <div>
                                    <span className="text-slate-500 block">Total Experience:</span>
                                    <span className="font-bold text-slate-800">{selectedCandidate.experience || `${exp.totalYears || 0} yrs ${exp.totalMonths || 0} mos`}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Current Designation:</span>
                                    <span className="font-bold text-slate-800">{exp.currentDesignation || "Not specified"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Current Company:</span>
                                    <span className="font-bold text-slate-800">{exp.currentCompany || "Not specified"}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Notice Period:</span>
                                    <span className="font-bold text-slate-800">{exp.noticePeriod || "Not specified"}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                              <Star className="h-4 w-4 text-blue-500" /> Skills & Competency
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(() => {
                                const skills = selectedCandidate.skills;
                                const skillArrayRaw = Array.isArray(skills)
                                  ? skills
                                  : typeof skills === "string"
                                  ? skills.split(/[,;]/).map(s => s.trim()).filter(Boolean)
                                  : [];
                                if (skillArrayRaw.length === 0) return <span className="text-slate-400 italic">No skills listed</span>;
                                return skillArrayRaw.map((s, idx) => {
                                  const name = typeof s === "object" && s !== null ? s.skill || s.name || "" : String(s);
                                  const lvl = typeof s === "object" && s !== null ? s.level : null;
                                  return (
                                    <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                      {name} {lvl && <span className="text-[10px] bg-blue-200/50 text-blue-800 px-1.5 py-0.2 rounded-full font-black uppercase">{lvl}</span>}
                                    </span>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          {/* Education */}
                          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5">
                              <GraduationCap className="h-4 w-4 text-blue-500" /> Education
                            </h4>
                            {edu.qualification ? (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <span className="text-slate-400 text-xs block">College / Institute</span>
                                  <span className="font-bold text-slate-800">{edu.college || "Not specified"}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-xs block">Degree / Qualification</span>
                                  <span className="font-bold text-slate-800">{edu.qualification}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-xs block">Passing Year</span>
                                  <span className="font-bold text-slate-800">{edu.passingYear || "Not specified"}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-400 italic">Education details not provided</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Official Verification Documents Section */}
                      <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Candidate Uploaded Documents
                          </h4>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 w-fit">
                            {docList.filter(d => Boolean(d.url)).length} / {docList.length} Uploaded
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                          {docList.map((doc) => {
                            const isUploaded = Boolean(doc.url);
                            return (
                              <div
                                key={doc.key}
                                className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                                  isUploaded
                                    ? "bg-slate-50/80 border-slate-200 hover:border-blue-300 hover:bg-blue-50/20"
                                    : "bg-slate-50/40 border-dashed border-slate-200 opacity-70"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-bold text-slate-800 text-xs truncate" title={doc.label}>
                                      {doc.label}
                                    </span>
                                    {isUploaded ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex-shrink-0">
                                        <CheckCircle2 className="h-3 w-3" /> Uploaded
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full flex-shrink-0">
                                        Not Uploaded
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    {doc.reqFor}
                                  </p>
                                </div>

                                {isUploaded ? (
                                  <a
                                    href={getFileUrl(doc.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 text-xs shadow-sm transition-colors"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> View Document
                                  </a>
                                ) : (
                                  <div className="text-[11px] text-slate-400 italic text-center py-1">
                                    Document not available
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Portfolio Links Area */}
                      {(cp.portfolioLinks?.github || cp.portfolioLinks?.linkedin || cp.portfolioLinks?.portfolio) && (
                        <div className="rounded-2xl bg-white border border-slate-200 p-5 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Online Portfolios & Profiles:</span>
                          <div className="flex gap-4">
                            {cp.portfolioLinks?.github && (
                              <a
                                href={cp.portfolioLinks.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900 transition-colors text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> GitHub
                              </a>
                            )}
                            {cp.portfolioLinks?.linkedin && (
                              <a
                                href={cp.portfolioLinks.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-blue-600 hover:text-blue-800 transition-colors text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                              </a>
                            )}
                            {cp.portfolioLinks?.portfolio && (
                              <a
                                href={cp.portfolioLinks.portfolio}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold text-purple-600 hover:text-purple-800 transition-colors text-xs"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> Portfolio
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Quick Actions Sticky Footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 rounded-b-3xl z-20 shadow-lg">
                <button
                  onClick={() => {
                    handleContact(selectedCandidate.id);
                    setSelectedCandidate(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 transition-all shadow-md shadow-blue-100 text-sm"
                >
                  <Mail className="h-4 w-4" /> Open Chat Conversation
                </button>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold py-3 hover:bg-slate-50 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FindCandidates;
