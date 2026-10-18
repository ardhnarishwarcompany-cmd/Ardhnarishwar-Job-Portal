import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import FloatingThemeToggle from "../components_lite/FloatingThemeToggle";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setLoading } from "@/redux/authSlice";
import {
  UserPlus, Briefcase, Users, Eye, EyeOff, User, Phone, MapPin, Wallet,
  GraduationCap, Award, FileText, Globe2, Sparkles, ShieldCheck, ArrowLeft, KeyRound,
} from "lucide-react";
import { USER_API_ENDPOINT } from "@/utils/data";
import Navbar from "../components_lite/Navbar";
import Footer from "../components_lite/Footer";
import StepWizard from "../wizard/StepWizard";
import AddressAutocomplete from "../wizard/AddressAutocomplete";
import {
  Field, TextInput, TextArea, SelectInput, PillGroup, ChipMultiSelect,
  ToggleYesNo, CheckboxRow, FileDrop, SectionCard, RepeatableList,
} from "../wizard/formFields";
import { useOptionPool, saveFieldMapToPool } from "@/hooks/useOptionPool";
import AutoCompleteInput from "../wizard/AutoCompleteInput";
import TagCapsuleInput from "../wizard/TagCapsuleInput";
import InternationalPhoneInput from "../ui/InternationalPhoneInput";

const INDUSTRIES = ["IT", "Healthcare", "Education", "Manufacturing", "Banking", "Finance", "Retail", "Construction", "Hospitality", "Telecom", "Others"];
const JOB_TYPES = ["Full-Time", "Part-Time", "Internship", "Contract", "Freelance", "Temporary"];
const WORK_MODES = ["Work From Office", "Work From Home", "Hybrid", "Remote"];
const RADII = ["5 km", "10 km", "25 km", "50 km", "Any"];
const NOTICE_PERIODS = ["Immediate", "15 Days", "30 Days", "60 Days", "90 Days"];
const QUALIFICATIONS = [
  "10th","12th","ITI","Diploma","Polytechnic","Certificate Course",
  "Graduate","B.A.","B.Com","B.Sc.","BBA","BCA","B.E.","B.Tech","B.Arch",
  "LLB","MBBS","B.Pharm","B.Ed.","Postgraduate","M.A.","M.Com","M.Sc.",
  "MBA","MCA","M.E.","M.Tech","M.Arch","LLM","MD","MS","M.Pharm","M.Ed.",
  "PG Diploma","PhD","Doctorate","Add Manually"
];
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const SHIFTS = ["Day Shift", "Night Shift", "Rotational", "Flexible"];
const WEEKLY_OFFS = ["Sunday", "Saturday-Sunday", "Rotational", "Custom"];
const ALERT_CHANNELS = ["Email", "WhatsApp", "SMS", "Push Notification"];
const ALERT_FREQ = ["Instant", "Daily Digest", "Weekly Digest"];

const EXP_YEARS = Array.from({ length: 41 }, (_, i) => `${i} ${i === 1 ? "Year" : "Years"}`);
const EXP_MONTHS = Array.from({ length: 12 }, (_, i) => `${i} ${i === 1 ? "Month" : "Months"}`);
const EXP_YEARS_OPTIONS = [...EXP_YEARS, "Enter Manually..."];
const EXP_MONTHS_OPTIONS = [...EXP_MONTHS, "Enter Manually..."];

const emptyProfile = {
  personal: {
    fullname: "", gender: "", dob: "", age: "", maritalStatus: "", nationality: "",
    category: "General", religion: "",
    city: "", state: "", country: "", houseAddress: "", pinCode: "",
    houseNumber: "", street: "", area: "",
  },
  contact: {
    mobile: "",
    whatsapp: "", sameAsMobile: false, email: "", emailOtp: "", emailOtpSent: false, emailVerified: false,
  },
  career: {
    jobTitle: "", industries: [], jobType: "Full-Time", workMode: "Hybrid", locations: "", radius: "Any",
  },
  salary: { current: "", expected: "", min: "", max: "", negotiable: true, mode: "LPA" },
  experience: {
    employmentType: "Experienced", years: "", months: "", status: "", company: "", designation: "", noticePeriod: "",
    reasonForChange: "",
  },
  education: { qualification: "", otherQualification: "", college: "", passingYear: "", percentage: "" },
  skills: [],
  certifications: [],
  portfolioLinks: { github: "", linkedin: "", behance: "", youtube: "", dribbble: "", portfolioWebsite: "", otherLinks: "" },
  workPrefs: {
    languages: [],
    relocate: false, travel: false, passport: false, ownVehicle: false, drivingLicense: false,
    shift: "Day Shift", weeklyOff: "",
  },
  platform: {
    alertChannels: [], alertFrequency: "Instant",
    aiResume: false, aiSkillTest: false, aiMockInterview: false,
    aiVoiceInterview: false, aiVideoInterview: false, aiCodingTest: false, aiAptitudeTest: false,
    backgroundVerification: false,
  },
};

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { optionPool } = useOptionPool();

  const [role, setRole] = useState("Employee");
  const [account, setAccount] = useState({ email: "johndoe@example.com", password: "Password@123", confirmPassword: "Password@123" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [profile, setProfile] = useState(emptyProfile);
  const [photo, setPhoto] = useState(null);
  const [resume, setResume] = useState(null);
  const [videoIntro, setVideoIntro] = useState(null);
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [docUploads, setDocUploads] = useState({
    aadhaarCard: null,
    panCard: null,
    passport: null,
    drivingLicenseDoc: null,
    experienceLetter: null,
    relievingLetter: null,
    salarySlip: null,
    accountStatement3M: null,
    accountStatement6M: null,
    accountStatement1Y: null,
    offerLetter: null,
    educationalCertificates: null,
    passportSizePhoto: null,
  });
  const [certFiles, setCertFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [expInputMode, setExpInputMode] = useState("dropdown");

  const set = (section, key, value) =>
    setProfile((p) => ({ ...p, [section]: { ...p[section], [key]: value } }));

  const onDobChange = (value) => {
    let age = "";
    if (value) {
      const diff = Date.now() - new Date(value).getTime();
      age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }
    setProfile((p) => ({ ...p, personal: { ...p.personal, dob: value, age } }));
  };

  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const sendEmailOtp = async () => {
    if (!account.email) return toast.error("Enter your email first");
    setSendingEmailOtp(true);
    try {
      const res = await axios.post(`${USER_API_ENDPOINT}/otp/email/send`, { email: account.email });
      if (res.data.success) {
        set("contact", "emailOtpSent", true);
        toast.success(res.data.mocked ? `OTP generated (mock mode). Your code: ${res.data.devOtp}` : "OTP sent to your email");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send OTP email");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handlePercentageChange = (e) => {
    let val = e.target.value;
    val = val.replace(/[^0-9.]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }
    if (val !== "" && val !== ".") {
      const num = parseFloat(val);
      if (num > 100) return;
    }
    set("education", "percentage", val);
  };

  const verifyEmailOtp = async () => {
    try {
      const res = await axios.post(`${USER_API_ENDPOINT}/otp/email/verify`, {
        email: account.email, otp: profile.contact.emailOtp,
      });
      if (res.data.success) {
        set("contact", "emailVerified", true);
        toast.success("Email verified");
      } else {
        toast.error(res.data.message || "Invalid OTP");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification failed");
    }
  };

  const validateForm = () => {
    const missing = [];
    if (!account.email) missing.push("Account Email");
    if (!account.password) missing.push("Password");
    if (!profile.personal.fullname) missing.push("Full Name");
    if (!profile.personal.gender) missing.push("Gender");
    if (!profile.personal.dob) missing.push("Date of Birth");
    if (!profile.personal.nationality) missing.push("Nationality");
    if (!profile.personal.city) missing.push("City");
    if (!profile.personal.state) missing.push("State");
    if (!profile.personal.country) missing.push("Country");
    if (!profile.contact.mobile) missing.push("Mobile Number");
    if (!profile.career.jobTitle) missing.push("Job Title");
    if (profile.experience.employmentType === "Experienced") {
      if (profile.experience.years === "" || profile.experience.years === null || profile.experience.years === undefined) missing.push("Years of Experience");
      if (profile.experience.months === "" || profile.experience.months === null || profile.experience.months === undefined) missing.push("Months of Experience");
      if (!profile.experience.status || !profile.experience.status.trim()) missing.push("Current Employment Status");
      if (!profile.experience.noticePeriod || !profile.experience.noticePeriod.trim()) missing.push("Notice Period");
      if (!profile.experience.company || !profile.experience.company.trim()) missing.push("Current Company");
      if (!profile.experience.designation || !profile.experience.designation.trim()) missing.push("Current Designation");
      if (!profile.experience.reasonForChange || !profile.experience.reasonForChange.trim()) missing.push("Reason for Job Change");
    }
    if (!agreedTerms) missing.push("Terms Acceptance");

    if (missing.length > 0) {
      toast.error(`Required fields missing: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "..." : ""}`);
      return false;
    }
    
    // Additional global validations before submit
    if (account.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return false;
    }
    return true;
  };

  const validateStep = (currentStepIndex) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const pinRegex = /^[0-9]{6}$/;

    if (currentStepIndex === 0) {
      if (!profile.personal.fullname || profile.personal.fullname.length < 2) return "Valid Full Name is required.";
      if (!profile.personal.gender) return "Gender is required.";
      if (!profile.personal.dob) return "Date of Birth is required.";
      if (profile.personal.age && (profile.personal.age < 16 || profile.personal.age > 100)) return "Age must be between 16 and 100 years.";
      if (!profile.personal.nationality) return "Nationality is required.";
      if (!profile.personal.city) return "City is required.";
      if (!profile.personal.state) return "State is required.";
      if (!profile.personal.country) return "Country is required.";
      if (profile.personal.pinCode && !pinRegex.test(profile.personal.pinCode)) return "Valid 6-digit PIN Code is required.";
    }

    if (currentStepIndex === 1) {
      if (!account.email || !emailRegex.test(account.email)) return "Valid Email Address is required.";
      if (!account.password || account.password.length < 6) return "Password must be at least 6 characters long.";
      if (!account.confirmPassword) return "Confirm Password is required.";
      if (account.password !== account.confirmPassword) return "Password and Confirm Password do not match.";
      const mobileDigits = (profile.contact.mobile || "").replace(/\D/g, "");
      if (!mobileDigits || mobileDigits.length < 7) return "Valid Mobile Number is required.";
      const waDigits = (profile.contact.whatsapp || "").replace(/\D/g, "");
      if (profile.contact.whatsapp && waDigits.length < 7) return "WhatsApp Number must be a valid number.";
      if (!profile.contact.emailVerified) return "Please verify your email using the OTP before proceeding.";
    }

    if (currentStepIndex === 2) {
      if (!profile.career.jobTitle) return "Job Title is required.";
      if (!profile.career.industries || profile.career.industries.length === 0) return "Please select at least one preferred industry.";
      if (!profile.career.jobType) return "Preferred Job Type is required.";
      if (!profile.career.workMode) return "Preferred Work Mode is required.";
    }

    if (currentStepIndex === 3) {
      const { min, max, current, expected } = profile.salary;
      if (current && Number(current) < 0) return "Current salary cannot be negative.";
      if (expected && Number(expected) < 0) return "Expected salary cannot be negative.";
      if (min && Number(min) < 0) return "Minimum salary cannot be negative.";
      if (max && Number(max) < 0) return "Maximum salary cannot be negative.";
      if (min && max && Number(min) > Number(max)) return "Maximum salary must be greater than or equal to Minimum salary.";
    }

    if (currentStepIndex === 4) {
      if (!profile.experience.employmentType) return "Employment Type is required.";
      if (profile.experience.employmentType === "Experienced") {
        if (
          profile.experience.years === "" ||
          profile.experience.years === null ||
          profile.experience.years === undefined
        ) {
          return "Years of Experience is required.";
        }
        if (
          profile.experience.months === "" ||
          profile.experience.months === null ||
          profile.experience.months === undefined
        ) {
          return "Months of Experience is required.";
        }

        const yrs = Number(profile.experience.years);
        const mos = Number(profile.experience.months);
        if (isNaN(yrs) || yrs < 0 || yrs > 50) {
          return "Please enter a valid number of years of experience (0-50).";
        }
        if (isNaN(mos) || mos < 0 || mos > 11) {
          return "Months of experience should be between 0 and 11.";
        }
        if (yrs === 0 && mos === 0) {
          return "Please enter valid experience (at least 1 month or 1 year) for Experienced candidates.";
        }

        if (!profile.experience.status || !profile.experience.status.trim()) {
          return "Current Employment Status is required.";
        }
        if (!profile.experience.noticePeriod || !profile.experience.noticePeriod.trim()) {
          return "Notice Period is required.";
        }
        if (!profile.experience.company || !profile.experience.company.trim()) {
          return "Current Company is required.";
        }
        if (!profile.experience.designation || !profile.experience.designation.trim()) {
          return "Current Designation is required.";
        }
        if (!profile.experience.reasonForChange || !profile.experience.reasonForChange.trim()) {
          return "Reason for Job Change is required.";
        }
      }
    }

    if (currentStepIndex === 5) {
      if (!profile.education.qualification) return "Highest Qualification is required.";
      if (!profile.education.college) return "College/University name is required.";
      if (profile.education.passingYear) {
        const year = Number(profile.education.passingYear.split("-")[0]);
        const currentYear = new Date().getFullYear();
        if (year < 1950 || year > currentYear + 7) return "Please enter a valid passing year.";
      }
      if (profile.education.percentage) {
        const p = Number(profile.education.percentage);
        if (isNaN(p) || p < 0 || p > 100) return "Percentage/CGPA must be between 0 and 100.";
      }
    }

    if (currentStepIndex === 6) {
      if (profile.skills && profile.skills.length > 0) {
        for (const skillObj of profile.skills) {
          const sName = typeof skillObj === "string" ? skillObj : skillObj?.skill;
          if (!sName || !sName.trim()) return "Skill names cannot be empty. Please fill or remove them.";
        }
      }
      if (profile.certifications.length > 0) {
        for (const cert of profile.certifications) {
          if (!cert.name || cert.name.trim().length === 0) return "Certification names cannot be empty.";
          if (!cert.issuer || cert.issuer.trim().length === 0) return "Certification issuer cannot be empty.";
        }
      }
    }

    if (currentStepIndex === 7) {
      if (!resume) return "Resume upload is required.";
      if (!docUploads.aadhaarCard) return "Aadhaar Card is required.";
      if (!docUploads.panCard) return "PAN Card is required.";
      if (profile.experience.employmentType === "Experienced") {
        if (!docUploads.experienceLetter) return "Experience Letter is mandatory for Experienced candidates.";
        if (!docUploads.relievingLetter) return "Relieving Letter is mandatory for Experienced candidates.";
        if (!docUploads.salarySlip) return "Salary Slip is mandatory for Experienced candidates.";
        if (!docUploads.accountStatement3M) return "3 Months Account Statement is mandatory for Experienced candidates.";
        if (!docUploads.accountStatement6M) return "6 Months Account Statement is mandatory for Experienced candidates.";
        if (!docUploads.accountStatement1Y) return "1 Year Account Statement is mandatory for Experienced candidates.";
      }
    }

    if (currentStepIndex === 9) {
      if (!agreedTerms) return "You must agree to the Terms and Privacy Policy.";
    }

    return true;
  };

  const submitHandler = async () => {
    if (role === "Recruiter") {
      navigate("/recruiter/register");
      return;
    }
    if (!validateForm()) return;

    const isExp = profile.experience.employmentType === "Experienced";
    if (!resume) {
      toast.error("Please upload your Resume.");
      return;
    }
    if (isExp) {
      const missingExpDocs = [];
      if (!docUploads.experienceLetter) missingExpDocs.push("Experience Letter");
      if (!docUploads.relievingLetter) missingExpDocs.push("Relieving Letter");
      if (!docUploads.salarySlip) missingExpDocs.push("Salary Slip");
      if (!docUploads.accountStatement3M) missingExpDocs.push("3 Months Statement");
      if (!docUploads.accountStatement6M) missingExpDocs.push("6 Months Statement");
      if (!docUploads.accountStatement1Y) missingExpDocs.push("1 Year Statement");
      if (missingExpDocs.length > 0) {
        toast.error(`Experienced candidates must upload: ${missingExpDocs.join(", ")}`);
        return;
      }
    }

    const documentsObj = {
      aadhaarCard: docUploads.aadhaarCard ? docUploads.aadhaarCard.name : null,
      panCard: docUploads.panCard ? docUploads.panCard.name : null,
      passport: docUploads.passport ? docUploads.passport.name : null,
      drivingLicenseDoc: docUploads.drivingLicenseDoc ? docUploads.drivingLicenseDoc.name : null,
      experienceLetter: docUploads.experienceLetter ? docUploads.experienceLetter.name : null,
      relievingLetter: docUploads.relievingLetter ? docUploads.relievingLetter.name : null,
      salarySlip: docUploads.salarySlip ? docUploads.salarySlip.name : null,
      accountStatement3M: docUploads.accountStatement3M ? docUploads.accountStatement3M.name : null,
      accountStatement6M: docUploads.accountStatement6M ? docUploads.accountStatement6M.name : null,
      accountStatement1Y: docUploads.accountStatement1Y ? docUploads.accountStatement1Y.name : null,
      offerLetter: docUploads.offerLetter ? docUploads.offerLetter.name : null,
      educationalCertificates: docUploads.educationalCertificates ? docUploads.educationalCertificates.name : null,
      passportSizePhoto: docUploads.passportSizePhoto ? docUploads.passportSizePhoto.name : null,
    };

    const updatedProfile = {
      ...profile,
      experience: {
        ...profile.experience,
        total:
          profile.experience.employmentType === "Experienced"
            ? `${profile.experience.years || 0} Yrs ${profile.experience.months || 0} Mths`
            : "Fresher",
      },
      documents: documentsObj,
    };

    const formData = new FormData();
    formData.append("fullname", profile.personal.fullname);
    formData.append("email", account.email);
    formData.append("password", account.password);
    formData.append("phoneNumber", profile.contact.mobile);
    formData.append("role", "Employee");
    formData.append("dateOfBirth", profile.personal.dob);
    formData.append("profileData", JSON.stringify(updatedProfile));
    if (photo) formData.append("profilePhoto", photo);
    if (resume) formData.append("resume", resume);
    if (videoIntro) formData.append("videoIntro", videoIntro);
    Object.values(docUploads).forEach((f) => f && formData.append("verificationDocs", f));
    Object.values(certFiles).forEach((f) => f && formData.append("certificationFiles", f));

    try {
      setSubmitting(true);
      dispatch(setLoading(true));

      // Persist typed inputs into global OptionPool
      await saveFieldMapToPool({
        country: profile.personal.country,
        state: profile.personal.state,
        city: profile.personal.city,
        pincode: profile.personal.pinCode,
        area: profile.personal.area,
        sector: profile.personal.sector || profile.personal.street,
        landmark: profile.personal.landmark,
        building: profile.personal.building,
        floorSuite: profile.personal.floorSuite,
        jobTitle: profile.career.jobTitle,
        companyName: profile.experience.company,
        designation: profile.experience.designation,
        education: profile.education.qualification === "Add Manually" ? profile.education.otherQualification : profile.education.qualification,
        university: profile.education.college,
        skills: profile.skills.map((s) => s.skill),
        language: profile.workPrefs.languages.map((l) => l.language),
        category: profile.personal.category,
        religion: profile.personal.religion,
      });

      const res = await axios.post(`${USER_API_ENDPOINT}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (res.data.success) {
        toast.success("Account created! Please log in.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const steps = [
    {
      title: "Personal Info",
      subtitle: "Tell us a bit about yourself",
      content: (
        <>
          <SectionCard title="Personal Information" icon={User}>
            <Field label="Full Name" required>
              <TextInput value={profile.personal.fullname} onChange={(e) => set("personal", "fullname", e.target.value)} placeholder="Your full name" />
            </Field>
            <Field label="Profile Photo">
              <FileDrop label="Upload a photo (JPG/PNG)" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0])} fileNames={photo ? [photo.name] : []} />
            </Field>
            <Field label="Gender" required>
              <PillGroup options={["Male", "Female", "Other", "Prefer not to say"]} value={profile.personal.gender} onChange={(v) => set("personal", "gender", v)} />
            </Field>
            <Field label="Date of Birth" required>
              <TextInput type="date" value={profile.personal.dob} onChange={(e) => onDobChange(e.target.value)} />
            </Field>
            <Field label="Age" hint="Auto-calculated from date of birth">
              <TextInput value={profile.personal.age} readOnly className="bg-slate-50" />
            </Field>
            <Field label="Marital Status">
              <SelectInput options={["Single", "Married", "Divorced", "Widowed", "Prefer not to say"]} value={profile.personal.maritalStatus} onChange={(e) => set("personal", "maritalStatus", e.target.value)} />
            </Field>
            <Field label="Nationality" required>
              <TextInput value={profile.personal.nationality} onChange={(e) => set("personal", "nationality", e.target.value)} placeholder="e.g. Indian" />
            </Field>
            <Field label="Category">
              <AutoCompleteInput options={optionPool.category} value={profile.personal.category} onChange={(v) => set("personal", "category", v)} placeholder="Select or type Category (e.g. General, OBC, SC, ST, EWS)" />
            </Field>
            <Field label="Religion">
              <AutoCompleteInput options={optionPool.religion} value={profile.personal.religion} onChange={(v) => set("personal", "religion", v)} placeholder="Select or type Religion (e.g. Hindu, Muslim, Christian, Sikh)" />
            </Field>
          </SectionCard>

          <SectionCard title="Complete Address" icon={MapPin} description="Type or select from suggestions — auto-saves new entries for everyone">
            <Field label="City" required>
              <AutoCompleteInput options={optionPool.city} value={profile.personal.city} onChange={(v) => set("personal", "city", v)} placeholder="Select or type City" />
            </Field>
            <Field label="State" required>
              <AutoCompleteInput options={optionPool.state} value={profile.personal.state} onChange={(v) => set("personal", "state", v)} placeholder="Select or type State" />
            </Field>
            <Field label="Country" required>
              <AutoCompleteInput options={optionPool.country} value={profile.personal.country} onChange={(v) => set("personal", "country", v)} placeholder="Select or type Country" />
            </Field>
            <Field label="PIN Code">
              <AutoCompleteInput options={optionPool.pincode} value={profile.personal.pinCode} onChange={(v) => set("personal", "pinCode", v)} placeholder="Select or type PIN Code" />
            </Field>
            <Field label="House Number">
              <TextInput value={profile.personal.houseNumber} onChange={(e) => set("personal", "houseNumber", e.target.value)} placeholder="e.g. Flat 101" />
            </Field>
            <Field label="Sector">
              <AutoCompleteInput options={optionPool.sector} value={profile.personal.sector || profile.personal.street} onChange={(v) => { set("personal", "sector", v); set("personal", "street", v); }} placeholder="e.g. Sector 62" />
            </Field>
            <Field label="Area">
              <AutoCompleteInput options={optionPool.area} value={profile.personal.area} onChange={(v) => set("personal", "area", v)} placeholder="e.g. Indiranagar" />
            </Field>
            <Field label="Landmark">
              <AutoCompleteInput options={optionPool.landmark} value={profile.personal.landmark} onChange={(v) => set("personal", "landmark", v)} placeholder="e.g. Near Metro Station" />
            </Field>
            <Field label="Building / Office Search">
              <AutoCompleteInput options={optionPool.building} value={profile.personal.building} onChange={(v) => set("personal", "building", v)} placeholder="e.g. DLF Cyber Tower" />
            </Field>
            <Field label="Floor / Suite">
              <AutoCompleteInput options={optionPool.floorSuite} value={profile.personal.floorSuite} onChange={(v) => set("personal", "floorSuite", v)} placeholder="e.g. 4th Floor, Suite 402" />
            </Field>
            <Field label="Search Location Address" className="sm:col-span-2" hint="Start typing — city/state/pin auto-fill from Google Maps">
              <AddressAutocomplete
                value={profile.personal.houseAddress}
                onChange={(v) => set("personal", "houseAddress", v)}
                onPlaceSelect={(p) => setProfile((prev) => ({
                  ...prev,
                  personal: {
                    ...prev.personal,
                    city: p.city || prev.personal.city,
                    state: p.state || prev.personal.state,
                    country: p.country || prev.personal.country,
                    pinCode: p.pinCode || prev.personal.pinCode,
                    sector: p.formatted ? p.formatted.split(",")[0] : prev.personal.sector,
                    street: p.formatted ? p.formatted.split(",")[0] : prev.personal.street
                  },
                }))}
              />
            </Field>
          </SectionCard>
        </>
      ),
    },
    {
      title: "Contact Info",
      subtitle: "How employers can reach you",
      content: (
        <>
        <SectionCard title="Contact Information" icon={Phone}>
          <Field label="Mobile Number" required hint="We verify your account by email — this number is just for recruiters to reach you">
            <InternationalPhoneInput
              value={profile.contact.mobile}
              onChange={(v) => {
                set("contact", "mobile", v);
                if (profile.contact.sameAsMobile) {
                  set("contact", "whatsapp", v);
                }
              }}
            />
          </Field>
          <Field label="WhatsApp Number">
            <InternationalPhoneInput
              value={profile.contact.sameAsMobile ? profile.contact.mobile : profile.contact.whatsapp}
              disabled={profile.contact.sameAsMobile}
              onChange={(v) => set("contact", "whatsapp", v)}
            />
            <div className="mt-2">
              <CheckboxRow
                checked={profile.contact.sameAsMobile}
                onChange={(v) => {
                  set("contact", "sameAsMobile", v);
                  if (v) set("contact", "whatsapp", profile.contact.mobile);
                }}
                label="Same as mobile number"
              />
            </div>
          </Field>
          <Field label="Email Address" required hint="We'll email you a verification code">
            <TextInput type="email" value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} placeholder="you@example.com" disabled={profile.contact.emailVerified} className={profile.contact.emailVerified ? "bg-slate-50" : ""} />
          </Field>
          <Field label="Verify Email">
            {profile.contact.emailVerified ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Email verified ✓</span>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={sendEmailOtp} disabled={sendingEmailOtp} className="flex-shrink-0 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-50">
                  {sendingEmailOtp ? "Sending..." : profile.contact.emailOtpSent ? "Resend Code" : "Send Code"}
                </button>
                {profile.contact.emailOtpSent && (
                  <>
                    <TextInput value={profile.contact.emailOtp} onChange={(e) => set("contact", "emailOtp", e.target.value)} placeholder="6-digit code" />
                    <button type="button" onClick={verifyEmailOtp} className="flex-shrink-0 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white">Verify</button>
                  </>
                )}
              </div>
            )}
          </Field>
        </SectionCard>
        <SectionCard title="Account Credentials" icon={KeyRound}>
          <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Password" required>
              <div className="relative flex items-center">
                <TextInput
                  type={showPass ? "text" : "password"}
                  value={account.password}
                  onChange={(e) => setAccount({ ...account, password: e.target.value })}
                  placeholder="Create a strong password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-3 inset-y-0 my-auto h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Confirm Password" required>
              <div className="relative flex items-center">
                <TextInput
                  type={showConfirmPass ? "text" : "password"}
                  value={account.confirmPassword}
                  onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass((s) => !s)}
                  className="absolute right-3 inset-y-0 my-auto h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
          </div>
        </SectionCard>
        </>
      ),
    },
    {
      title: "Career Preference",
      subtitle: "What kind of role are you looking for?",
      content: (
        <SectionCard title="Career Preference" icon={Briefcase}>
          <Field label="Job Title You Are Looking For" required className="sm:col-span-2">
            <AutoCompleteInput options={optionPool.jobTitle} value={profile.career.jobTitle} onChange={(v) => set("career", "jobTitle", v)} placeholder="e.g. Frontend Developer" />
          </Field>
          <Field label="Preferred Industry" className="sm:col-span-2" hint="Select or type an industry and click '+ Add Industry'">
            <TagCapsuleInput
              options={Array.from(new Set([...(optionPool.industry || []), ...INDUSTRIES]))}
              value={Array.isArray(profile.career.industries) ? profile.career.industries : []}
              onChange={(v) => set("career", "industries", v)}
              placeholder="Select or type Industry"
              addLabel="+ Add Industry"
              capsuleColor="blue"
            />
          </Field>
          <Field label="Preferred Job Type">
            <PillGroup options={JOB_TYPES} value={profile.career.jobType} onChange={(v) => set("career", "jobType", v)} />
          </Field>
          <Field label="Preferred Work Mode">
            <PillGroup options={WORK_MODES} value={profile.career.workMode} onChange={(v) => set("career", "workMode", v)} />
          </Field>
          <Field label="Preferred Job Location(s)">
            <AutoCompleteInput options={optionPool.city} value={profile.career.locations} onChange={(v) => set("career", "locations", v)} placeholder="e.g. Delhi, Bangalore, Remote" />
          </Field>
          <Field label="Search Radius"><SelectInput options={RADII} value={profile.career.radius} onChange={(e) => set("career", "radius", e.target.value)} /></Field>
        </SectionCard>
      ),
    },
    {
      title: "Salary Expectation",
      subtitle: "Set your salary range",
      content: (
        <SectionCard title="Salary Expectation" icon={Wallet}>
          <Field label="Salary Mode" className="col-span-full" hint="Select salary representation format">
            <PillGroup
              options={["CTC", "In Hand", "LPA"]}
              value={profile.salary.mode || "LPA"}
              onChange={(v) => set("salary", "mode", v)}
            />
          </Field>
          <Field label={`Current Salary (₹ ${profile.salary.mode || "LPA"})`}><TextInput maxLength={12} type="number" value={profile.salary.current} onChange={(e) => set("salary", "current", e.target.value)} /></Field>
          <Field label={`Expected Salary (₹ ${profile.salary.mode || "LPA"})`}><TextInput maxLength={12} type="number" value={profile.salary.expected} onChange={(e) => set("salary", "expected", e.target.value)} /></Field>
          <Field label={`Minimum Salary (₹ ${profile.salary.mode || "LPA"})`}><TextInput maxLength={12} type="number" value={profile.salary.min} onChange={(e) => set("salary", "min", e.target.value)} /></Field>
          <Field label={`Maximum Salary (₹ ${profile.salary.mode || "LPA"})`}><TextInput maxLength={12} type="number" value={profile.salary.max} onChange={(e) => set("salary", "max", e.target.value)} /></Field>
          <Field label="Salary Negotiable?"><ToggleYesNo value={profile.salary.negotiable} onChange={(v) => set("salary", "negotiable", v)} /></Field>
        </SectionCard>
      ),
    },
    {
      title: "Experience",
      subtitle: "Your work history",
      content: (
        <SectionCard title="Experience" icon={Briefcase}>
          <Field label="Employment Type" required>
            <PillGroup
              options={["Fresher", "Experienced"]}
              value={profile.experience.employmentType}
              onChange={(v) => {
                set("experience", "employmentType", v);
                if (v === "Fresher") {
                  setProfile((p) => ({
                    ...p,
                    experience: {
                      ...p.experience,
                      employmentType: "Fresher",
                      years: "0",
                      months: "0",
                      company: "",
                      designation: "",
                      status: "",
                      noticePeriod: "",
                      reasonForChange: "",
                    },
                  }));
                }
              }}
            />
          </Field>
          {profile.experience.employmentType === "Experienced" && (
            <>
              <div className="col-span-full">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Years / Months of Experience <span className="text-rose-500">*</span>
                  </label>
                  <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setExpInputMode("dropdown")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        expInputMode === "dropdown"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      Dropdown
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpInputMode("manual")}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        expInputMode === "manual"
                          ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      Manual Input
                    </button>
                  </div>
                </div>

                {expInputMode === "dropdown" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                        Years of Experience <span className="text-rose-500">*</span>
                      </label>
                      <SelectInput
                        options={EXP_YEARS_OPTIONS}
                        value={
                          profile.experience.years !== "" && profile.experience.years !== undefined
                            ? `${profile.experience.years} ${Number(profile.experience.years) === 1 ? "Year" : "Years"}`
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value === "Enter Manually...") {
                            setExpInputMode("manual");
                          } else {
                            const val = e.target.value ? e.target.value.split(" ")[0] : "";
                            set("experience", "years", val);
                          }
                        }}
                        placeholder="Select Years"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                        Months of Experience <span className="text-rose-500">*</span>
                      </label>
                      <SelectInput
                        options={EXP_MONTHS_OPTIONS}
                        value={
                          profile.experience.months !== "" && profile.experience.months !== undefined
                            ? `${profile.experience.months} ${Number(profile.experience.months) === 1 ? "Month" : "Months"}`
                            : ""
                        }
                        onChange={(e) => {
                          if (e.target.value === "Enter Manually...") {
                            setExpInputMode("manual");
                          } else {
                            const val = e.target.value ? e.target.value.split(" ")[0] : "";
                            set("experience", "months", val);
                          }
                        }}
                        placeholder="Select Months"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>Years of Experience <span className="text-rose-500">*</span></span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Type (0 - 50)</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={profile.experience.years}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, "");
                            if (val !== "" && Number(val) > 50) val = "50";
                            set("experience", "years", val);
                          }}
                          placeholder="e.g. 4"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2.5 pr-14 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="absolute right-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
                          Years
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                        <span>Months of Experience <span className="text-rose-500">*</span></span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Type (0 - 11)</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="11"
                          value={profile.experience.months}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, "");
                            if (val !== "" && Number(val) > 11) val = "11";
                            set("experience", "months", val);
                          }}
                          placeholder="e.g. 3"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2.5 pr-16 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <span className="absolute right-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none">
                          Months
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Field label="Current Employment Status" required>
                <SelectInput options={["Working", "Notice Period", "Serving Notice", "Unemployed", "Student"]} value={profile.experience.status} onChange={(e) => set("experience", "status", e.target.value)} />
              </Field>
              <Field label="Notice Period" required>
                <SelectInput options={NOTICE_PERIODS} value={profile.experience.noticePeriod} onChange={(e) => set("experience", "noticePeriod", e.target.value)} />
              </Field>
              <Field label="Current Company" required>
                <AutoCompleteInput options={optionPool.companyName} value={profile.experience.company} onChange={(v) => set("experience", "company", v)} placeholder="Select or type Company Name" />
              </Field>
              <Field label="Current Designation" required>
                <AutoCompleteInput options={optionPool.designation} value={profile.experience.designation} onChange={(v) => set("experience", "designation", v)} placeholder="Select or type Designation" />
              </Field>
              <Field label="Reason for Job Change" required className="col-span-full">
                <TextArea value={profile.experience.reasonForChange} onChange={(e) => set("experience", "reasonForChange", e.target.value)} placeholder="e.g. Looking for better growth opportunities and exposure to modern technical stacks." />
              </Field>
            </>
          )}
        </SectionCard>
      ),
    },
    {
      title: "Education",
      subtitle: "Your academic background",
      content: (
        <SectionCard title="Education" icon={GraduationCap}>
          <Field label="Highest Qualification">
            <AutoCompleteInput options={optionPool.education} value={profile.education.qualification} onChange={(v) => set("education", "qualification", v)} placeholder="Select or type Qualification" />
            {(profile.education.qualification === "Add Manually" || profile.education.qualification === "Other") && (
              <TextInput className="mt-2" placeholder="Enter your qualification manually" value={profile.education.otherQualification} onChange={(e) => set("education", "otherQualification", e.target.value)} />
            )}
          </Field>
          <Field label="College / University">
            <AutoCompleteInput options={optionPool.university} value={profile.education.college} onChange={(v) => set("education", "college", v)} placeholder="Select or type College / University" />
          </Field>
          <Field label="Passing Year (Month & Year)">
            <TextInput
              type="month"
              placeholder="YYYY-MM"
              value={profile.education.passingYear}
              onChange={(e) => set("education", "passingYear", e.target.value)}
            />
          </Field>
          <Field label="Percentage / CGPA (0 - 100)">
            <TextInput
              type="text"
              inputMode="decimal"
              placeholder="e.g. 85.5"
              value={profile.education.percentage}
              onChange={handlePercentageChange}
            />
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Skills & Certifications",
      subtitle: "Showcase your expertise",
      content: (
        <SectionCard title="Technical Skills & Certifications" icon={Award}>
          <Field label="Technical Skills" className="col-span-full" hint="Select or type a skill and click '+ Add Skill' to add capsule tags">
            <TagCapsuleInput
              options={optionPool.skills}
              value={Array.isArray(profile.skills) ? profile.skills.map((s) => (typeof s === "string" ? s : s?.skill)).filter(Boolean) : []}
              onChange={(v) => setProfile((p) => ({ ...p, skills: v }))}
              placeholder="e.g. React.js, Python, UI Design"
              addLabel="+ Add Skill"
              capsuleColor="blue"
            />
          </Field>
          <Field label="Certifications" className="col-span-full">
            <RepeatableList
              items={profile.certifications}
              addLabel="Add certification"
              onAdd={() => setProfile((p) => ({ ...p, certifications: [...p.certifications, { name: "", issuer: "", issueDate: "", expiryDate: "" }] }))}
              onRemove={(i) => setProfile((p) => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }))}
              renderItem={(item, i) => (
                <>
                  <TextInput placeholder="Certificate Name" value={item.name} onChange={(e) => setProfile((p) => { const c = [...p.certifications]; c[i] = { ...c[i], name: e.target.value }; return { ...p, certifications: c }; })} />
                  <TextInput placeholder="Issuing Organization" value={item.issuer} onChange={(e) => setProfile((p) => { const c = [...p.certifications]; c[i] = { ...c[i], issuer: e.target.value }; return { ...p, certifications: c }; })} />
                  <TextInput type="date" placeholder="Issue Date" value={item.issueDate} onChange={(e) => setProfile((p) => { const c = [...p.certifications]; c[i] = { ...c[i], issueDate: e.target.value }; return { ...p, certifications: c }; })} />
                  <TextInput type="date" placeholder="Expiry Date" value={item.expiryDate} onChange={(e) => setProfile((p) => { const c = [...p.certifications]; c[i] = { ...c[i], expiryDate: e.target.value }; return { ...p, certifications: c }; })} />
                  <div className="col-span-full mt-1.5">
                    <FileDrop label="Upload Certificate PDF/Image" accept="image/*,.pdf" onChange={(e) => setCertFiles({...certFiles, [i]: e.target.files?.[0]})} fileNames={certFiles[i] ? [certFiles[i].name] : []} />
                  </div>
                </>
              )}
            />
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Documents & Portfolio",
      subtitle: "Upload your resume and showcase your work",
      content: (
        <SectionCard title="Documents & Portfolio" icon={FileText}>
          <Field label="Resume Upload" required hint="PDF/DOCX, max 10MB">
            <FileDrop label="Upload resume" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0])} fileNames={resume ? [resume.name] : []} />
          </Field>
          <Field label="Video Introduction" hint="Max 60 seconds">
            <FileDrop label="Upload short video" accept="video/*" onChange={(e) => setVideoIntro(e.target.files?.[0])} fileNames={videoIntro ? [videoIntro.name] : []} />
          </Field>
          <Field label="LinkedIn"><TextInput value={profile.portfolioLinks.linkedin} onChange={(e) => setProfile((p) => ({ ...p, portfolioLinks: { ...p.portfolioLinks, linkedin: e.target.value } }))} placeholder="https://linkedin.com/in/you" /></Field>
          <Field label="GitHub"><TextInput value={profile.portfolioLinks.github} onChange={(e) => setProfile((p) => ({ ...p, portfolioLinks: { ...p.portfolioLinks, github: e.target.value } }))} placeholder="https://github.com/you" /></Field>
          <Field label="Portfolio Website"><TextInput value={profile.portfolioLinks.portfolioWebsite} onChange={(e) => setProfile((p) => ({ ...p, portfolioLinks: { ...p.portfolioLinks, portfolioWebsite: e.target.value } }))} placeholder="https://yourportfolio.com" /></Field>
          <Field label="Behance"><TextInput value={profile.portfolioLinks.behance} onChange={(e) => setProfile((p) => ({ ...p, portfolioLinks: { ...p.portfolioLinks, behance: e.target.value } }))} /></Field>
          <Field label="Dribbble"><TextInput value={profile.portfolioLinks.dribbble} onChange={(e) => setProfile((p) => ({ ...p, portfolioLinks: { ...p.portfolioLinks, dribbble: e.target.value } }))} /></Field>
          <Field label="YouTube"><TextInput value={profile.portfolioLinks.youtube} onChange={(e) => setProfile((p) => ({ ...p, portfolioLinks: { ...p.portfolioLinks, youtube: e.target.value } }))} /></Field>
          <Field label="Other Links" className="sm:col-span-2"><TextInput value={profile.portfolioLinks.otherLinks} onChange={(e) => setProfile((p) => ({ ...p, portfolioLinks: { ...p.portfolioLinks, otherLinks: e.target.value } }))} placeholder="Any other links" /></Field>
          
          <div className="col-span-full border-t border-slate-100 dark:border-slate-800 pt-5 mt-3">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Official Verification Documents</h4>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                profile.experience.employmentType === "Experienced" 
                  ? "bg-amber-100 text-amber-800 border border-amber-200" 
                  : "bg-blue-50 text-blue-700 border border-blue-100"
              }`}>
                {profile.experience.employmentType === "Experienced" ? "Experienced Candidate: Experience & Statement Docs Mandatory" : "Fresher Candidate: Extra Docs Optional"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
              <Field label="Aadhaar Card" required>
                <FileDrop label="Aadhaar PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, aadhaarCard: e.target.files?.[0]})} fileNames={docUploads.aadhaarCard ? [docUploads.aadhaarCard.name] : []} />
              </Field>
              <Field label="PAN Card" required>
                <FileDrop label="PAN PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, panCard: e.target.files?.[0]})} fileNames={docUploads.panCard ? [docUploads.panCard.name] : []} />
              </Field>
              <Field label="Passport">
                <FileDrop label="Passport PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, passport: e.target.files?.[0]})} fileNames={docUploads.passport ? [docUploads.passport.name] : []} />
              </Field>
              <Field label="Driving License">
                <FileDrop label="License PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, drivingLicenseDoc: e.target.files?.[0]})} fileNames={docUploads.drivingLicenseDoc ? [docUploads.drivingLicenseDoc.name] : []} />
              </Field>
              <Field label="Experience Letter" required={profile.experience.employmentType === "Experienced"} hint={profile.experience.employmentType === "Experienced" ? "Mandatory for Experienced" : "Optional for Fresher"}>
                <FileDrop label="Experience Letter" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, experienceLetter: e.target.files?.[0]})} fileNames={docUploads.experienceLetter ? [docUploads.experienceLetter.name] : []} />
              </Field>
              <Field label="Relieving Letter" required={profile.experience.employmentType === "Experienced"} hint={profile.experience.employmentType === "Experienced" ? "Mandatory for Experienced" : "Optional for Fresher"}>
                <FileDrop label="Relieving Letter" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, relievingLetter: e.target.files?.[0]})} fileNames={docUploads.relievingLetter ? [docUploads.relievingLetter.name] : []} />
              </Field>
              <Field label="Salary Slip" required={profile.experience.employmentType === "Experienced"} hint={profile.experience.employmentType === "Experienced" ? "Mandatory for Experienced" : "Optional for Fresher"}>
                <FileDrop label="Salary Slip" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, salarySlip: e.target.files?.[0]})} fileNames={docUploads.salarySlip ? [docUploads.salarySlip.name] : []} />
              </Field>
              <Field label="Account Statement (3 Months)" required={profile.experience.employmentType === "Experienced"} hint={profile.experience.employmentType === "Experienced" ? "Mandatory for Experienced" : "Optional for Fresher"}>
                <FileDrop label="3 Months Statement" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, accountStatement3M: e.target.files?.[0]})} fileNames={docUploads.accountStatement3M ? [docUploads.accountStatement3M.name] : []} />
              </Field>
              <Field label="Account Statement (6 Months)" required={profile.experience.employmentType === "Experienced"} hint={profile.experience.employmentType === "Experienced" ? "Mandatory for Experienced" : "Optional for Fresher"}>
                <FileDrop label="6 Months Statement" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, accountStatement6M: e.target.files?.[0]})} fileNames={docUploads.accountStatement6M ? [docUploads.accountStatement6M.name] : []} />
              </Field>
              <Field label="Account Statement (1 Year)" required={profile.experience.employmentType === "Experienced"} hint={profile.experience.employmentType === "Experienced" ? "Mandatory for Experienced" : "Optional for Fresher"}>
                <FileDrop label="1 Year Statement" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, accountStatement1Y: e.target.files?.[0]})} fileNames={docUploads.accountStatement1Y ? [docUploads.accountStatement1Y.name] : []} />
              </Field>
              <Field label="Offer Letter">
                <FileDrop label="Offer Letter" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, offerLetter: e.target.files?.[0]})} fileNames={docUploads.offerLetter ? [docUploads.offerLetter.name] : []} />
              </Field>
              <Field label="Educational Certificates">
                <FileDrop label="Educational Certificates" accept=".pdf,image/*" onChange={(e) => setDocUploads({...docUploads, educationalCertificates: e.target.files?.[0]})} fileNames={docUploads.educationalCertificates ? [docUploads.educationalCertificates.name] : []} />
              </Field>
              <Field label="Passport Size Photo">
                <FileDrop label="Passport Size Photo" accept="image/*" onChange={(e) => setDocUploads({...docUploads, passportSizePhoto: e.target.files?.[0]})} fileNames={docUploads.passportSizePhoto ? [docUploads.passportSizePhoto.name] : []} />
              </Field>
            </div>
          </div>
        </SectionCard>
      ),
    },
    {
      title: "Preferences & Languages",
      subtitle: "Work preferences and languages you know",
      content: (
        <SectionCard title="Work Preferences & Languages" icon={Globe2}>
          <Field label="Languages Known" className="col-span-full" hint="Select or type a language and click '+ Add Language' to add capsule tags">
            <TagCapsuleInput
              options={optionPool.language}
              value={Array.isArray(profile.workPrefs.languages) ? profile.workPrefs.languages.map((l) => (typeof l === "string" ? l : l?.language)).filter(Boolean) : []}
              onChange={(v) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, languages: v } }))}
              placeholder="e.g. English, Hindi, Punjabi"
              addLabel="+ Add Language"
              capsuleColor="purple"
            />
          </Field>
          <Field label="Preferred Shift"><SelectInput options={SHIFTS} value={profile.workPrefs.shift} onChange={(e) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, shift: e.target.value } }))} /></Field>
          <Field label="Weekly Off"><SelectInput options={WEEKLY_OFFS} value={profile.workPrefs.weeklyOff} onChange={(e) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, weeklyOff: e.target.value } }))} /></Field>
          <Field label="Other Preferences" className="col-span-full">
            <div className="flex flex-wrap gap-4">
              <CheckboxRow checked={profile.workPrefs.relocate} label="Ready to Relocate" onChange={(v) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, relocate: v } }))} />
              <CheckboxRow checked={profile.workPrefs.travel} label="Ready to Travel" onChange={(v) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, travel: v } }))} />
              <CheckboxRow checked={profile.workPrefs.passport} label="Passport Available" onChange={(v) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, passport: v } }))} />
              <CheckboxRow checked={profile.workPrefs.drivingLicense} label="Driving License Available" onChange={(v) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, drivingLicense: v } }))} />
              <CheckboxRow checked={profile.workPrefs.ownVehicle} label="Own Vehicle" onChange={(v) => setProfile((p) => ({ ...p, workPrefs: { ...p.workPrefs, ownVehicle: v } }))} />
            </div>
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Consent & Review",
      subtitle: "Review your details and accept terms to complete registration",
      content: (
        <SectionCard title="Consent & Review" icon={ShieldCheck}>
          <Field label="Background Verification" className="col-span-full">
            <CheckboxRow checked={profile.platform.backgroundVerification} label="I consent to background verification checks by prospective employers" onChange={(v) => set("platform", "backgroundVerification", v)} />
          </Field>
          <Field label="Terms" className="col-span-full">
            <CheckboxRow checked={agreedTerms} label="I agree to the Terms of Service and Privacy Policy" onChange={setAgreedTerms} />
          </Field>
        </SectionCard>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
      <Navbar />
      <div className="border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950 to-cyan-950 dark:from-slate-950 dark:via-blue-950 dark:to-slate-950 px-4 py-12 text-center relative overflow-hidden">
        {/* Background shimmers */}
        <div className="absolute top-0 left-0 h-40 w-40 rounded-full bg-blue-600/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-cyan-600/10 blur-2xl pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800 px-4 py-1.5 text-xs font-bold text-blue-200 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> Free candidate profile in minutes
          </span>
          <h1 className="font-display text-3xl font-black text-white sm:text-4xl tracking-tight">Create Your Candidate Profile</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300 font-display">
            A complete profile gets 3x more recruiter views. It only takes a few minutes.
          </p>
        </motion.div>

        <div className="mx-auto mt-6 inline-flex rounded-2xl border border-white/10 dark:border-slate-800 bg-white/5 dark:bg-slate-900/30 p-1 backdrop-blur-sm relative z-10">
          {[
            { value: "Employee", label: "I'm a Job Seeker", icon: Briefcase },
            { value: "Recruiter", label: "I'm Hiring", icon: Users },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => (r.value === "Recruiter" ? navigate("/recruiter/register") : setRole(r.value))}
              className={`flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all ${
                role === r.value 
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg" 
                  : "text-slate-300 hover:text-white dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <r.icon className="h-4 w-4" /> {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Already have an account? Log in
        </Link>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 md:p-8 shadow-xl">
          <StepWizard steps={steps} onSubmit={submitHandler} submitting={submitting} submitLabel="Create My Profile" validateStep={validateStep} />
        </div>
      </div>
      <Footer />
      <FloatingThemeToggle />
    </div>
  );
};

export default Register;
