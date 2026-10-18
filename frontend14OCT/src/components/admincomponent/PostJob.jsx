import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components_lite/Navbar";
import { useSelector } from "react-redux";
import axios from "axios";
import { JOB_API_ENDPOINT, AI_API_ENDPOINT } from "@/utils/data";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import {
  Briefcase, MapPin, Wallet, FileText, CalendarClock, Phone, Building2,
  ListChecks, AlertTriangle, Sparkles, Wand2, X,
} from "lucide-react";
import useGetAllCompanies from "@/hooks/usegetAllCompanies";
import StepWizard from "../wizard/StepWizard";
import AddressAutocomplete from "../wizard/AddressAutocomplete";
import {
  Field, TextInput, TextArea, SelectInput, PillGroup, ChipMultiSelect,
  ToggleYesNo, CheckboxRow, SectionCard,
} from "../wizard/formFields";
import { useOptionPool, saveFieldMapToPool } from "@/hooks/useOptionPool";
import AutoCompleteInput from "../wizard/AutoCompleteInput";
import TagCapsuleInput from "../wizard/TagCapsuleInput";
import InternationalPhoneInput from "../ui/InternationalPhoneInput";

const parseTimeTo24h = (timeStr) => {
  if (!timeStr) return "";
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d+)(?::(\d+))?\s*(AM|PM)?$/);
  if (!match) {
    if (/^\d{2}:\d{2}$/.test(cleaned)) return cleaned;
    return "";
  }
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  return `${hh}:${mm}`;
};

const EXPERIENCE_LEVELS = ["Fresher", "0-6 Months", "1-2 Years", "2-4 Years", "4-6 Years", "6-10 Years", "10-15 Years", "15+ Years"];
const SALARY_TYPES = ["Fixed", "Negotiable", "Performance Based", "Commission Based"];
const BENEFITS = ["Bonus", "ESI", "PF", "Cab Facility", "Laptop", "Health Insurance", "Meals", "Flexible Hours"];
const QUALIFICATIONS = [
  "10th","12th","ITI","Diploma","Polytechnic","Certificate Course",
  "Graduate","B.A.","B.Com","B.Sc.","BBA","BCA","B.E.","B.Tech","B.Arch",
  "LLB","MBBS","B.Pharm","B.Ed.","Postgraduate","M.A.","M.Com","M.Sc.",
  "MBA","MCA","M.E.","M.Tech","M.Arch","LLM","MD","MS","M.Pharm","M.Ed.",
  "PG Diploma","PhD","Doctorate","Add Manually"
];
const SHIFT_TYPES = ["Day", "Night", "Rotational", "Flexible"];
const INTERVIEW_MODES = ["Walk-In", "Face-to-Face", "Telephonic", "Video Interview", "Online"];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];
const INDUSTRIES = [
  "Information Technology", "Healthcare", "Finance & Banking", "Education",
  "Manufacturing", "Retail & E-commerce", "Hospitality", "Construction",
  "Automobile", "Real Estate", "Pharmaceutical", "Media", "Marketing", "Service Industry", "Add Manually"
];
const URGENCY = ["Immediately", "Within 3 Days", "Within 7 Days", "Within 15 Days", "Flexible"];
const HIRING_FREQ = ["One-Time", "Monthly", "Bulk Hiring", "Campus Hiring"];
const NOTICE_PERIODS = ["Immediate", "15 Days", "30 Days", "60 Days", "90 Days"];
const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Custom"];
const WORK_MODES = ["Work From Office", "Work From Home", "Hybrid", "Remote"];
const JOB_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance"];
const WEEKLY_OFFS = ["Sunday", "Saturday-Sunday", "Rotational", "Custom"];
const DOCS_REQUIRED = ["Aadhaar", "PAN", "Resume", "Payslip", "Experience Letter"];
const AI_FEATURES = [
  "Auto Translation", "AI Candidate Match Score", "AI Resume Screening",
  "AI Interview Scheduling", "One-Click Job Reposting", "WhatsApp Job Sharing",
];

const emptyJob = {
  location: { country: "", state: "", city: "", area: "", pinCode: "", building: "", floor: "", sectorLocality: "", landmark: "", googleMapsUrl: "", remote: false, hybrid: false },
  position: "", experience: "", otherExperience: "", otherQualification: "", salaryMin: "", salaryMax: "", salaryType: "Fixed", salaryMode: "LPA", gender: "Any", benefits: [],
  skills: [], qualification: "", freshersEligible: false, requireReasonForLeaving: false, shiftType: "Day", workingTime: "",
  interview: { mode: "Video", dateTime: "", venue: "", date: "", time: "", instructions: "" },
  canCall: true, availableDays: "", availableTime: "", availableTimeStart: "", availableTimeEnd: "",
  companyContact: { name: "", website: "", contactPerson: "", email: "", phone: "", whatsappNumber: "", landline: "", allowWhatsapp: true, size: "", urgency: "", frequency: "" },
  immediateJoining: "", noticePeriod: "", ageMin: "", ageMax: "", languages: [], workMode: "", employmentType: "Full-Time", weeklyOff: "",
  industryType: "", customIndustry: "", servicesList: [],
  docsRequired: [],
  candidatePreference: { enabled: false, gender: "No Preference", maritalStatus: "No Preference", religion: "No Preference", caste: "No Preference" },
  aiFeatures: [],
};

const PostJob = () => {
  useGetAllCompanies();
  const navigate = useNavigate();
  const { optionPool } = useOptionPool();
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useSelector((store) => store.auth);
  const { companies } = useSelector((store) => store.company);

  const recruiterProfile = useMemo(() => {
    if (!user?.recruiterProfile) return null;
    return typeof user.recruiterProfile === "string" ? JSON.parse(user.recruiterProfile) : user.recruiterProfile;
  }, [user]);

  const fallbackCompanyName = recruiterProfile?.company?.name || user?.extraDetails?.companyName || "";

  const [core, setCore] = useState({ 
    title: "", 
    description: "", 
    requirements: "", 
    companyId: "",
    companyName: fallbackCompanyName 
  });

  const companyInitialSelectedRef = React.useRef(false);

  // Pre-select company if it matches the profile (only once on initial creation, never overwriting user edits or during job editing)
  React.useEffect(() => {
    if (isEdit || companyInitialSelectedRef.current) return;
    if (companies?.length > 0 && fallbackCompanyName) {
      companyInitialSelectedRef.current = true;
      const match = companies.find((c) => c.name?.toLowerCase() === fallbackCompanyName.toLowerCase());
      if (match) {
        setCore((prev) => ({ ...prev, companyId: match._id, companyName: match.name }));
      } else {
        setCore((prev) => ({ ...prev, companyName: fallbackCompanyName }));
      }
    }
  }, [companies, fallbackCompanyName, isEdit]);

  const [job, setJob] = useState(emptyJob);
  const [serviceInput, setServiceInput] = useState("");
  const [languagesInput, setLanguagesInput] = useState("");

  // Fetch job details if editing
  React.useEffect(() => {
    if (isEdit) {
      const fetchJob = async () => {
        try {
          const res = await axios.get(`${JOB_API_ENDPOINT}/get/${id}`, { withCredentials: true });
          if (res.data.success || res.data.status || res.data.job) {
            const jobData = res.data.job;
            if (jobData.approvalStatus === "edit_pending") {
              toast.info("An edit request is already pending for this job. Please wait for Admin review.");
              navigate("/recruiter/jobs");
              return;
            }
            setCore({
              title: jobData.title || "",
              description: jobData.description || "",
              requirements: Array.isArray(jobData.requirements) ? jobData.requirements.join(", ") : (jobData.requirements || ""),
              companyId: jobData.company?._id || jobData.company?.id || "",
              companyName: jobData.company?.name || ""
            });
            
            let parsedDetails = {};
            if (jobData.jobDetails) {
              try {
                let details = jobData.jobDetails;
                while (typeof details === "string") {
                  details = JSON.parse(details);
                }
                if (details && typeof details === "object") {
                  parsedDetails = details;
                }
              } catch (e) {
                console.error("Error parsing jobDetails:", e);
              }
            }

            // Merge with emptyJob to make sure nested structures exist
            const mergedJob = {
              ...emptyJob,
              ...parsedDetails,
              location: {
                ...emptyJob.location,
                ...(parsedDetails.location || {}),
                city: parsedDetails.location?.city || jobData.location || "",
              },
              companyContact: {
                ...emptyJob.companyContact,
                ...(parsedDetails.companyContact || {}),
              },
              candidatePreference: {
                ...emptyJob.candidatePreference,
                ...(parsedDetails.candidatePreference || {}),
              },
            };

            // Fallback empty values using top-level fields
            if (!mergedJob.position && jobData.position) {
              mergedJob.position = jobData.position;
            }
            if (!mergedJob.experience && jobData.experienceLevel !== undefined) {
              mergedJob.experience = String(jobData.experienceLevel);
            }
            if (!mergedJob.salaryMin && jobData.salary) {
              mergedJob.salaryMin = String(jobData.salary);
            }
            if (!mergedJob.salaryMode) {
              mergedJob.salaryMode = jobData.salaryMode || parsedDetails.salaryMode || "LPA";
            }
            if (!mergedJob.gender) {
              mergedJob.gender = jobData.gender || parsedDetails.gender || "Any";
            }
            if (jobData.requirements && (!mergedJob.skills || mergedJob.skills.length === 0)) {
              mergedJob.skills = Array.isArray(jobData.requirements)
                ? jobData.requirements
                : String(jobData.requirements).split(",").map(s => s.trim()).filter(Boolean);
            }
            if (typeof mergedJob.skills === "string") {
              mergedJob.skills = mergedJob.skills.split(",").map(s => s.trim()).filter(Boolean);
            }
            if (!mergedJob.workMode && jobData.jobType) {
              mergedJob.workMode = jobData.jobType;
            }
            if (!mergedJob.qualification && jobData.qualification) {
              mergedJob.qualification = jobData.qualification;
            }
            if (!mergedJob.industryType && jobData.industryType) {
              mergedJob.industryType = jobData.industryType;
            }

            // Populate dual time pickers if workingTime is present
            if (mergedJob.workingTime && mergedJob.workingTime.includes("-")) {
              const parts = mergedJob.workingTime.split("-");
              mergedJob.workingTimeStart = parseTimeTo24h(parts[0]);
              mergedJob.workingTimeEnd = parseTimeTo24h(parts[1]);
            }

            // Populate dual time pickers if availableTime is present
            if (mergedJob.availableTime && mergedJob.availableTime.includes("-")) {
              const parts = mergedJob.availableTime.split("-");
              mergedJob.availableTimeStart = parseTimeTo24h(parts[0]);
              mergedJob.availableTimeEnd = parseTimeTo24h(parts[1]);
            }

            if (typeof mergedJob.languages === "string") {
              mergedJob.languages = mergedJob.languages.split(",").map(s => s.trim()).filter(Boolean);
            }

            setJob(mergedJob);
          }
        } catch (err) {
          toast.error("Failed to load job details for editing");
        }
      };
      fetchJob();
    }
  }, [id, isEdit]);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [generatingSalary, setGeneratingSalary] = useState(false);
  const [jdFile, setJdFile] = useState(null);
  
  const [hasDraft, setHasDraft] = useState(false);

  React.useEffect(() => {
    if (localStorage.getItem("postJobDraft")) setHasDraft(true);
  }, []);

  const saveDraft = () => {
    localStorage.setItem("postJobDraft", JSON.stringify({ core, job }));
    setHasDraft(true);
    toast.success("Draft saved successfully!");
  };

  const restoreDraft = () => {
    try {
      const draftStr = localStorage.getItem("postJobDraft");
      if (draftStr) {
        const { core: draftCore, job: draftJob } = JSON.parse(draftStr);
        setCore(draftCore);
        setJob(draftJob);
        if (draftJob.languages) {
          setLanguagesInput(Array.isArray(draftJob.languages) ? draftJob.languages.join(", ") : String(draftJob.languages || ""));
        }
        setHasDraft(false);
        toast.success("Draft restored!");
      }
    } catch (e) {
      console.error("Failed to restore draft", e);
    }
  };

  const set = (section, key, value) => setJob((j) => ({ ...j, [section]: { ...j[section], [key]: value } }));
  const setTop = (key, value) => setJob((j) => ({ ...j, [key]: value }));

  const generateDescription = async () => {
    if (!core.title) return toast.error("Enter a job title first");
    setGeneratingDesc(true);
    try {
      const res = await axios.post(`${AI_API_ENDPOINT}/job-description`, {
        title: core.title, skills: job.skills, experience: job.experience, jobType: job.workMode,
      });
      if (res.data.success) {
        setCore((c) => ({ ...c, description: res.data.description }));
        toast.success("Description generated — feel free to tweak it");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "AI generation failed");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const salaryValid = useMemo(() => {
    if (!job.salaryMin || !job.salaryMax) return true;
    return Number(job.salaryMin) <= Number(job.salaryMax);
  }, [job.salaryMin, job.salaryMax]);

  const emailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

  const validateStep = (stepIndex) => {
    if (stepIndex === 0) {
      if (!core.title.trim()) return "Job title is required";
      if (!core.companyId && !core.companyName?.trim()) return "Company Name is required";
      if (!job.position || Number(job.position) < 1) return "Number of open positions must be at least 1";
      if (!job.experience) return "Please select the required experience level";
      if (job.experience === "Other" && !String(job.otherExperience || "").trim()) return "Please enter the required experience";
      if (!job.qualification) return "Please select the minimum qualification";
      if (job.qualification === "Other" && !String(job.otherQualification || "").trim()) return "Please enter the minimum qualification";
      if (!core.description.trim() || core.description.trim().length < 30) return "Job description should be at least 30 characters";
      const hasSkills = Array.isArray(job.skills) ? job.skills.length > 0 : !!job.skills?.trim();
      if (!hasSkills) return "Please add at least one required skill";
      return true;
    }
    if (stepIndex === 1) {
      if (!job.location.city.trim()) return "City is required";
      if (!job.location.state.trim()) return "State is required";
      if (!job.location.area?.trim()) return "Area / Sector is required";
      if (!job.location.landmark?.trim()) return "Landmark is required";
      if (!job.location.googleMapsUrl?.trim()) return "Google Maps Location URL is required";
      if (!job.salaryMin || Number(job.salaryMin) <= 0) return "Minimum salary is required";
      if (!job.salaryMax || Number(job.salaryMax) <= 0) return "Maximum salary is required";
      if (!salaryValid) return "Minimum salary cannot be greater than maximum salary";
      return true;
    }
    if (stepIndex === 3) {
      if (!job.industryType) return "Industry Type is required";
      if (job.industryType === "Add Manually" && !job.customIndustry?.trim()) return "Please specify custom industry";
      if (job.industryType === "Service Industry" && (!job.servicesList || job.servicesList.length === 0)) return "Please add at least one service offered for Service Industry";
      if (!job.companyContact.contactPerson.trim()) return "Contact person / designation is required";
      if (!emailValid(job.companyContact.email)) return "Please enter a valid official email";
      if (!job.companyContact.phone?.trim() || job.companyContact.phone.replace(/\D/g, "").length < 8) return "Please enter a valid official contact number";
      return true;
    }

    return true;
  };

  const submitHandler = async () => {
    if (!core.title || !core.description || (!core.companyId && !core.companyName)) {
      toast.error("Please fill job title, description, and company name");
      return;
    }
    if (!salaryValid) {
      toast.error("Minimum salary cannot be greater than maximum salary");
      return;
    }
    try {
      setSubmitting(true);

      // Persist typed inputs into global OptionPool
      await saveFieldMapToPool({
        jobTitle: core.title,
        companyName: core.companyName,
        experience: job.experience === "Other" ? job.otherExperience : job.experience,
        education: job.qualification === "Other" ? job.otherQualification : job.qualification,
        skills: job.skills,
        country: job.location.country,
        state: job.location.state,
        city: job.location.city,
        area: job.location.area,
        sector: job.location.sectorLocality,
        landmark: job.location.landmark,
        building: job.location.building,
        floorSuite: job.location.floor,
        pincode: job.location.pinCode,
        industry: job.industryType === "Service Industry" ? job.servicesList : (job.industryType === "Add Manually" ? job.customIndustry : job.industryType),
        designation: job.companyContact.contactPerson,
        language: job.languages,
      });

      const finalIndustry = job.industryType === "Add Manually" ? job.customIndustry : job.industryType;
      const requirementsStr = Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "");

      const formData = new FormData();
      formData.append("title", core.title);
      formData.append("description", core.description);
      formData.append("requirements", requirementsStr);
      formData.append("salary", job.salaryMax || job.salaryMin || "0");
      formData.append("salaryMode", job.salaryMode || "LPA");
      formData.append("gender", job.gender || "Any");
      formData.append("location", [job.location.area, job.location.city, job.location.state].filter(Boolean).join(", ") || "Remote");
      formData.append("jobType", job.employmentType || "Full-Time");
      formData.append("experience", String(job.experience === "Other" ? (job.otherExperience || "Other") : job.experience).match(/\d+/) ? String(job.experience === "Other" ? (job.otherExperience || "Other") : job.experience).match(/\d+/)[0] : "0");
      formData.append("position", job.position || "1");
      formData.append("companyId", core.companyId || "");
      formData.append("companyName", core.companyName || "");
      const jobDetailsForSubmit = {
        ...job,
        salaryMode: job.salaryMode || "LPA",
        gender: job.gender || "Any",
        industryType: finalIndustry,
        servicesList: job.industryType === "Service Industry" ? job.servicesList : [],
        experience: job.experience === "Other" ? (job.otherExperience || "Other") : job.experience,
        qualification: job.qualification === "Other" ? (job.otherQualification || "Other") : job.qualification,
      };
      formData.append("jobDetails", JSON.stringify(jobDetailsForSubmit));
      formData.append("industryType", finalIndustry || "");
      if (jdFile) {
        formData.append("file", jdFile);
      }

      const endpoint = isEdit ? `${JOB_API_ENDPOINT}/update/${id}` : `${JOB_API_ENDPOINT}/post`;
      const method = isEdit ? "put" : "post";

      const res = await axios({
        method,
        url: endpoint,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.success) {
        localStorage.removeItem("postJobDraft");
        toast.success(res.data.message);
        navigate("/recruiter/jobs");
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: "Job Details",
      subtitle: "The essentials candidates will see first",
      content: (
        <SectionCard title="Job Information" icon={Briefcase}>
          <Field label="Job Title" required className="sm:col-span-2">
            <AutoCompleteInput options={optionPool.jobTitle} value={core.title} onChange={(v) => setCore({ ...core, title: v })} placeholder="e.g. Senior React Developer" />
          </Field>
          <Field label="Company Name" required>
            <AutoCompleteInput 
              options={Array.from(new Set([...(companies || []).map((c) => c.name), ...(optionPool.companyName || [])]))}
              value={core.companyName} 
              onChange={(v) => {
                companyInitialSelectedRef.current = true;
                const match = (companies || []).find((c) => c.name?.toLowerCase() === v.toLowerCase());
                setCore((prev) => ({ ...prev, companyName: v, companyId: match ? match._id : "" }));
              }} 
              placeholder="Enter or select Company Name" 
            />
          </Field>
          <Field label="Number of Open Positions" required>
            <TextInput type="number" min="1" value={job.position} onChange={(e) => setTop("position", e.target.value)} />
          </Field>
          <Field label="Experience Required" required>
            <AutoCompleteInput options={optionPool.experience} value={job.experience} onChange={(v) => setTop("experience", v)} placeholder="Select or type experience" />
            {(job.experience === "Add Manually" || job.experience === "Other") && (
              <TextInput
                className="mt-2"
                placeholder="e.g. 18 months / 12+ years / relevant field experience"
                value={job.otherExperience || ""}
                onChange={(e) => setTop("otherExperience", e.target.value)}
              />
            )}
          </Field>
          <Field label="Minimum Qualification" required>
            <AutoCompleteInput options={optionPool.education} value={job.qualification} onChange={(v) => setTop("qualification", v)} placeholder="Select or type minimum qualification" />
            {(job.qualification === "Add Manually" || job.qualification === "Other") && (
              <TextInput
                className="mt-2"
                placeholder="Enter minimum qualification manually"
                value={job.otherQualification || ""}
                onChange={(e) => setTop("otherQualification", e.target.value)}
              />
            )}
          </Field>
          <Field label="Preferred Gender">
            <PillGroup
              options={["Any", "Male", "Female", "Other"]}
              value={job.gender || "Any"}
              onChange={(v) => {
                setTop("gender", v);
                set("candidatePreference", "gender", v === "Any" ? "No Preference" : v);
              }}
            />
          </Field>
          <Field label="Job Description" required className="col-span-full">
            <div className="mb-1 flex justify-end">
              <button type="button" onClick={generateDescription} disabled={generatingDesc} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50">
                <Wand2 className="h-3.5 w-3.5" /> {generatingDesc ? "Generating..." : "Generate with AI"}
              </button>
            </div>
            <TextArea rows={5} value={core.description} onChange={(e) => setCore({ ...core, description: e.target.value })} placeholder="Responsibilities, team info, growth path..." />
            <p className={`mt-1 text-right text-[11px] font-semibold ${core.description.trim().length > 0 && core.description.trim().length < 30 ? "text-rose-500" : "text-slate-400"}`}>
              {core.description.trim().length} characters {core.description.trim().length < 30 ? "(minimum 30)" : ""}
            </p>
          </Field>
          <Field label="Required Skills" required className="col-span-full" hint="Select or type a skill and click '+ Add Skill' to add capsule tags">
            <TagCapsuleInput
              options={optionPool.skills}
              value={job.skills}
              onChange={(v) => setTop("skills", v)}
              placeholder="e.g. React.js, Python, Project Management"
              addLabel="+ Add Skill"
              capsuleColor="blue"
            />
          </Field>
          <Field label="Freshers Eligible?"><ToggleYesNo value={job.freshersEligible} onChange={(v) => setTop("freshersEligible", v)} /></Field>

          <Field label="Shift Type"><PillGroup options={SHIFT_TYPES} value={job.shiftType} onChange={(v) => setTop("shiftType", v)} /></Field>
          <Field label="Working Time">
            <div className="flex items-center gap-2">
              <TextInput type="time" placeholder="Start Time" value={job.workingTimeStart || ""} onChange={(e) => {
                const start = e.target.value;
                setTop("workingTimeStart", start);
                setTop("workingTime", `${start} - ${job.workingTimeEnd || ''}`);
              }} />
              <span className="text-slate-500 font-medium">to</span>
              <TextInput type="time" placeholder="End Time" value={job.workingTimeEnd || ""} onChange={(e) => {
                const end = e.target.value;
                setTop("workingTimeEnd", end);
                setTop("workingTime", `${job.workingTimeStart || ''} - ${end}`);
              }} />
            </div>
          </Field>
          <Field label="Official JD Document (Optional)" className="col-span-full">
            <div className="flex items-center gap-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-slate-500 hover:border-blue-400 hover:bg-blue-50 transition-all w-full">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">{jdFile ? jdFile.name : "Upload PDF / DOCX"}</span>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setJdFile(e.target.files[0])} />
              </label>
              {jdFile && (
                <button type="button" onClick={() => setJdFile(null)} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-600 font-bold hover:bg-rose-100 transition-colors">
                  Clear
                </button>
              )}
            </div>
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Location & Salary",
      subtitle: "Where the role is based and what it pays",
      content: (
        <>
          <SectionCard title="Job Location" icon={MapPin} description="Powered by Google Maps — type the street address to auto-fill the rest">
            <Field label="Country" required>
              <AutoCompleteInput options={optionPool.country} value={job.location.country} onChange={(v) => set("location", "country", v)} placeholder="Select or type Country" />
            </Field>
            <Field label="State" required>
              <AutoCompleteInput options={optionPool.state} value={job.location.state} onChange={(v) => set("location", "state", v)} placeholder="Select or type State" />
            </Field>
            <Field label="City" required>
              <AutoCompleteInput options={optionPool.city} value={job.location.city} onChange={(v) => set("location", "city", v)} placeholder="Select or type City" />
            </Field>
            <Field label="Area / Sector" hint="Start typing — city/state/pin auto-fill from Google Maps">
              <AddressAutocomplete
                value={job.location.area}
                onChange={(v) => set("location", "area", v)}
                onPlaceSelect={(p) => setJob((prev) => ({
                  ...prev,
                  location: { ...prev.location, city: p.city || prev.location.city, state: p.state || prev.location.state, country: p.country || prev.location.country, pinCode: p.pinCode || prev.location.pinCode },
                }))}
              />
            </Field>
            <Field label="PIN Code">
              <AutoCompleteInput options={optionPool.pincode} value={job.location.pinCode} onChange={(v) => set("location", "pinCode", v)} placeholder="Select or type PIN Code" />
            </Field>
            <Field label="Building / Office Search">
              <AutoCompleteInput options={optionPool.building} value={job.location.building} onChange={(v) => set("location", "building", v)} placeholder="e.g. Corporate Tower" />
            </Field>
            <Field label="Floor / Suite Number">
              <AutoCompleteInput options={optionPool.floorSuite} value={job.location.floor} onChange={(v) => set("location", "floor", v)} placeholder="e.g. 5th Floor" />
            </Field>
            <Field label="Sector">
              <AutoCompleteInput options={optionPool.sector} value={job.location.sectorLocality} onChange={(v) => set("location", "sectorLocality", v)} placeholder="e.g. Sector 62" />
            </Field>
            <Field label="Landmark">
              <AutoCompleteInput options={optionPool.landmark} value={job.location.landmark} onChange={(v) => set("location", "landmark", v)} placeholder="e.g. Opposite Cyber Hub" />
            </Field>
            <Field label="Google Maps Location URL" className="col-span-full"><TextInput value={job.location.googleMapsUrl} onChange={(e) => set("location", "googleMapsUrl", e.target.value)} placeholder="https://maps.google.com/..." /></Field>
          </SectionCard>
          <SectionCard title="Salary & Compensation" icon={Wallet}>
            <Field label="Salary Structure / Mode" required className="col-span-full" hint="Select whether salary figures represent CTC, In Hand, or LPA">
              <PillGroup
                options={["CTC", "In Hand", "LPA"]}
                value={job.salaryMode || "LPA"}
                onChange={(v) => setTop("salaryMode", v)}
              />
            </Field>
            <Field label={`Minimum Salary (₹ ${job.salaryMode || "LPA"})`} required><TextInput type="number" min="0" value={job.salaryMin} onChange={(e) => setTop("salaryMin", e.target.value)} /></Field>
            <Field label={`Maximum Salary (₹ ${job.salaryMode || "LPA"})`} required hint={!salaryValid ? "Max must be ≥ Min" : undefined}><TextInput type="number" min="0" value={job.salaryMax} onChange={(e) => setTop("salaryMax", e.target.value)} className={!salaryValid ? "border-rose-400" : ""} /></Field>
            <Field label="Salary Type"><PillGroup options={SALARY_TYPES} value={job.salaryType} onChange={(v) => setTop("salaryType", v)} /></Field>
            <Field label="Additional Benefits" className="col-span-full"><ChipMultiSelect options={BENEFITS} value={job.benefits} onChange={(v) => setTop("benefits", v)} /></Field>
          </SectionCard>
        </>
      ),
    },
    {
      title: "Interview & Contact",
      subtitle: "How and when candidates get interviewed",
      content: (
        <SectionCard title="Interview & Contact Details" icon={CalendarClock}>
          <Field label="Interview Mode"><PillGroup options={INTERVIEW_MODES} value={job.interview.mode} onChange={(v) => set("interview", "mode", v)} /></Field>
          <Field label="Interview Date"><TextInput type="date" value={job.interview.date || ""} onChange={(e) => set("interview", "date", e.target.value)} /></Field>
          <Field label="Interview Time"><TextInput type="time" value={job.interview.time || ""} onChange={(e) => set("interview", "time", e.target.value)} /></Field>
          <Field label="Interview Venue / Address"><TextInput value={job.interview.venue || ""} onChange={(e) => set("interview", "venue", e.target.value)} placeholder="e.g. Office Suite 204 or Zoom Link" /></Field>
          <Field label="Interview Instructions" className="col-span-full"><TextArea value={job.interview.instructions || ""} onChange={(e) => set("interview", "instructions", e.target.value)} placeholder="e.g. Bring Aadhaar Card & resume printout" /></Field>
          <Field label="Can Candidates Call?"><ToggleYesNo value={job.canCall} onChange={(v) => setTop("canCall", v)} /></Field>
          {job.canCall && (
            <>
              <Field label="Available Days">
                <TextInput 
                  placeholder="e.g. Monday - Saturday, Every day" 
                  value={job.availableDays} 
                  onChange={(e) => setTop("availableDays", e.target.value)} 
                />
              </Field>
              <Field label="Available Time (From - To)">
                <div className="flex items-center gap-2">
                  <TextInput
                    type="time"
                    value={job.availableTimeStart || (job.availableTime ? job.availableTime.split(" - ")[0] : "")}
                    onChange={(e) => {
                      const start = e.target.value;
                      setTop("availableTimeStart", start);
                      const end = job.availableTimeEnd || (job.availableTime ? job.availableTime.split(" - ")[1] : "");
                      setTop("availableTime", `${start} - ${end || ""}`);
                    }}
                  />
                  <span className="text-slate-500 font-medium text-xs">to</span>
                  <TextInput
                    type="time"
                    value={job.availableTimeEnd || (job.availableTime ? job.availableTime.split(" - ")[1] : "")}
                    onChange={(e) => {
                      const end = e.target.value;
                      setTop("availableTimeEnd", end);
                      const start = job.availableTimeStart || (job.availableTime ? job.availableTime.split(" - ")[0] : "");
                      setTop("availableTime", `${start || ""} - ${end}`);
                    }}
                  />
                </div>
              </Field>
            </>
          )}
        </SectionCard>
      ),
    },
    {
      title: "Company Info",
      subtitle: "Pre-filled from your account — feel free to edit",
      content: (
        <SectionCard title="Company Information" icon={Building2}>
          <Field label="Company Website"><TextInput value={job.companyContact.website} onChange={(e) => set("companyContact", "website", e.target.value)} placeholder="https://" /></Field>
          <Field label="Industry Type" required>
            <AutoCompleteInput 
              options={Array.from(new Set([...(optionPool.industry || []), ...INDUSTRIES]))}
              value={job.industryType || ""} 
              onChange={(v) => {
                setTop("industryType", v);
                if (v !== "Service Industry") {
                  setTop("servicesList", []);
                }
              }} 
              placeholder="Select or type Industry Type" 
            />
          </Field>
          {job.industryType === "Add Manually" && (
            <Field label="Specify Custom Industry" required>
              <TextInput 
                value={job.customIndustry || ""} 
                onChange={(e) => setTop("customIndustry", e.target.value)} 
                placeholder="Type custom industry..." 
              />
            </Field>
          )}
          {job.industryType === "Service Industry" && (
            <Field label="Services Offered (Service Industry)" required className="col-span-full" hint="Type a service and click '+ Add Service' or press Enter">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <TextInput
                    className="flex-1"
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    placeholder="e.g. IT Consulting, Facility Management, Logistics..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (serviceInput.trim() && !job.servicesList?.includes(serviceInput.trim())) {
                          setTop("servicesList", [...(job.servicesList || []), serviceInput.trim()]);
                          setServiceInput("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (serviceInput.trim() && !job.servicesList?.includes(serviceInput.trim())) {
                        setTop("servicesList", [...(job.servicesList || []), serviceInput.trim()]);
                        setServiceInput("");
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shrink-0"
                  >
                    + Add Service
                  </button>
                </div>
                {job.servicesList && job.servicesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2.5 rounded-2xl border border-slate-200 bg-slate-50">
                    {job.servicesList.map((srv, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                        {srv}
                        <button
                          type="button"
                          onClick={() => setTop("servicesList", job.servicesList.filter((_, i) => i !== idx))}
                          className="hover:text-rose-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          )}
          <Field label="Contact Person / Designation" required>
            <AutoCompleteInput options={optionPool.designation} value={job.companyContact.contactPerson} onChange={(v) => set("companyContact", "contactPerson", v)} placeholder="Select or type Designation / Contact Person" />
          </Field>
          <Field label="Official Email" required><TextInput type="email" value={job.companyContact.email} onChange={(e) => set("companyContact", "email", e.target.value)} /></Field>
          <Field label="Contact Number" required>
            <InternationalPhoneInput value={job.companyContact.phone} onChange={(v) => set("companyContact", "phone", v)} />
            <div className="mt-2">
              <CheckboxRow checked={job.companyContact.allowWhatsapp} label="Allow WhatsApp contact" onChange={(v) => set("companyContact", "allowWhatsapp", v)} />
            </div>
          </Field>
          <Field label="WhatsApp Number (Optional)">
            <InternationalPhoneInput value={job.companyContact.whatsappNumber || ""} onChange={(v) => set("companyContact", "whatsappNumber", v)} />
          </Field>
          <Field label="Landline Number (Optional)"><TextInput value={job.companyContact.landline || ""} onChange={(e) => set("companyContact", "landline", e.target.value)} placeholder="e.g. 011-2345678" /></Field>
          <Field label="Company Size"><SelectInput options={COMPANY_SIZES} value={job.companyContact.size} onChange={(e) => set("companyContact", "size", e.target.value)} /></Field>
          <Field label="Hiring Urgency"><SelectInput options={URGENCY} value={job.companyContact.urgency} onChange={(e) => set("companyContact", "urgency", e.target.value)} /></Field>
          <Field label="Hiring Frequency"><SelectInput options={HIRING_FREQ} value={job.companyContact.frequency} onChange={(e) => set("companyContact", "frequency", e.target.value)} /></Field>
        </SectionCard>
      ),
    },
    {
      title: "Hiring Requirements",
      subtitle: "Additional requirements for this role",
      content: (
        <SectionCard title="Additional Hiring Requirements" icon={ListChecks}>
          <Field label="Immediate Joining Required?"><SelectInput options={["Yes", "No", "Within 7 Days", "Within 15 Days", "Within 30 Days"]} value={job.immediateJoining} onChange={(e) => setTop("immediateJoining", e.target.value)} /></Field>
          <Field label="Notice Period Accepted"><SelectInput options={NOTICE_PERIODS} value={job.noticePeriod} onChange={(e) => setTop("noticePeriod", e.target.value)} /></Field>
          <Field label="Age Limit">
            <div className="flex gap-2">
              <TextInput type="number" min="14" max="80" placeholder="Min age" value={job.ageMin} onChange={(e) => setTop("ageMin", e.target.value)} />
              <TextInput type="number" min="14" max="80" placeholder="Max age" value={job.ageMax} onChange={(e) => setTop("ageMax", e.target.value)} />
            </div>
          </Field>
          <Field label="Job Type"><PillGroup options={JOB_TYPES} value={job.employmentType} onChange={(v) => setTop("employmentType", v)} /></Field>
          <Field label="Work Mode"><PillGroup options={WORK_MODES} value={job.workMode} onChange={(v) => setTop("workMode", v)} /></Field>
          <Field label="Weekly Off">
            <TextInput 
              placeholder="e.g. Sunday, Rotational" 
              value={job.weeklyOff} 
              onChange={(e) => setTop("weeklyOff", e.target.value)} 
            />
          </Field>
          <Field label="Languages Required" className="col-span-full" hint="Select or type a language and click '+ Add Language' to add capsule tags">
            <TagCapsuleInput 
              options={optionPool.language}
              placeholder="e.g. English, Hindi, Punjabi" 
              value={job.languages} 
              onChange={(v) => setTop("languages", v)} 
              addLabel="+ Add Language"
              capsuleColor="purple"
            />
          </Field>
          <Field label="Documents Required from Candidate" className="col-span-full"><ChipMultiSelect options={DOCS_REQUIRED} value={job.docsRequired} onChange={(v) => setTop("docsRequired", v)} /></Field>
        </SectionCard>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <Briefcase className="h-3.5 w-3.5" /> {isEdit ? "Edit Job" : "Post a New Job"}
          </span>
          <h1 className="font-display text-3xl font-black text-slate-900">{isEdit ? "Edit Job Posting" : "Create a Job Posting"}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">{isEdit ? "Update details to request approval for this job edition." : "Fill in the details below. Candidates will see this within minutes of publishing."}</p>
          {!isEdit && (
            <a href="/recruiter/jd-maker" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800">
              <Sparkles className="h-3.5 w-3.5" /> Prefer AI to draft the full JD as a PDF first? Try the JD Maker
            </a>
          )}
          <div className="mt-4 flex justify-center gap-3">
            {!isEdit && (
              <button type="button" onClick={saveDraft} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Save Draft
              </button>
            )}
            {!isEdit && hasDraft && (
              <button type="button" onClick={restoreDraft} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-200 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Restore Saved Draft
              </button>
            )}
          </div>
        </motion.div>
        <StepWizard steps={steps} onSubmit={submitHandler} submitting={submitting} submitLabel={isEdit ? "Submit Edit Request" : "Publish Job"} validateStep={validateStep} />
      </div>
    </div>
  );
};

export default PostJob;
