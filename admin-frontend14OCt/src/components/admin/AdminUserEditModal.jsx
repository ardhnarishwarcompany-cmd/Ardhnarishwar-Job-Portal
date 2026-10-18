import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Building2, MapPin, UserRound, Briefcase, Receipt, ShieldCheck, Mail, Phone,
  FileText, Edit, CheckCircle2, AlertTriangle, Send, User, Upload, Plus, Trash2,
  KeyRound, CreditCard,
} from "lucide-react";
import StepWizard from "../wizard/StepWizard";
import AddressAutocomplete from "../wizard/AddressAutocomplete";
import {
  Field, TextInput, TextArea, SelectInput, PillGroup, ChipMultiSelect,
  CheckboxRow, FileDrop, SectionCard, RepeatableList,
} from "../wizard/formFields";
import { useOptionPool, saveFieldMapToPool } from "@/hooks/useOptionPool";
import AutoCompleteInput from "./AutoCompleteInput";
import TagCapsuleInput from "./TagCapsuleInput";
import InternationalPhoneInput from "./InternationalPhoneInput";
import { ADMIN_API_ENDPOINT, getFileUrl } from "@/utils/data";
import axios from "axios";
import { toast } from "sonner";

const COMPANY_TYPES = [
  "Private Limited Company", "Public Limited Company", "LLP", "Partnership Firm",
  "Proprietorship", "Startup", "MSME", "Government Organization", "NGO",
  "Educational Institution", "Hospital", "Recruitment Consultancy", "Staffing Company", "MNC", "Add Manually"
];

const INDUSTRIES = [
  "Information Technology", "Artificial Intelligence", "Software Development",
  "Manufacturing", "Healthcare", "Banking", "Finance", "Education", "Retail",
  "E-commerce", "Construction", "Hospitality", "Telecom", "Logistics",
  "Automobile", "Real Estate", "Pharmaceutical", "Media", "Marketing", "Service Industry", "Add Manually"
];

const COMPANY_SIZES = ["1-10", "11-25", "26-50", "51-100", "101-250", "251-500", "501-1000", "1000+", "Add Manually"];
const HIRING_FOR = ["Your Own Company", "Client Companies (Consultancy)", "Both", "Add Manually"];
const HIRING_VOLUME = ["1-5 Candidates", "5-20 Candidates", "20-50 Candidates", "50-100 Candidates", "100+ Candidates", "Add Manually"];
const HIRING_FREQ = ["Daily", "Weekly", "Monthly", "Quarterly", "Occasionally"];
const PLANS = ["Free", "Basic", "Professional", "Enterprise"];
const PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "Net Banking", "Bank Transfer"];
const DESIGNATIONS = ["HR Manager", "HR Executive", "Recruiter", "Director", "CEO", "Founder", "Owner", "Hiring Manager", "Team Lead", "Add Manually"];
const YEARS = Array.from({ length: 2026 - 1950 + 1 }, (_, i) => String(2026 - i));

const AdminUserEditModal = ({ user, onClose, onSuccess }) => {
  const isRecruiter = user?.role === "Recruiter";
  const { optionPool } = useOptionPool();
  const [submitting, setSubmitting] = useState(false);

  // Recruiter state
  const [recForm, setRecForm] = useState({
    company: {
      name: "", website: "", email: "", mobile: "", whatsapp: "", sameAsMobile: false,
      type: "Private Limited Company", customType: "", industry: "Information Technology",
      customIndustry: "", servicesList: [], newServiceInput: "", size: "1-10", customSize: "",
      yearEstablished: "2024", description: ""
    },
    address: {
      country: "India", state: "", city: "", area: "", sector: "", building: "",
      floor: "", pinCode: "", landmark: "", googleMapsUrl: ""
    },
    branches: [],
    contact: {
      fullname: "", designation: "HR Manager", customDesignation: "", department: "",
      email: "", mobile: "", whatsapp: "", category: "", religion: ""
    },
    hiring: {
      hiringFor: "Your Own Company", customHiringFor: "", volume: "1-5 Candidates",
      customVolume: "", frequency: "Monthly", locations: "", industries: []
    },
    billing: { gst: "", pan: "", cin: "", msme: "", billingAddress: "" },
    account: { username: "", securityQuestion: "What is your mother's maiden name?", securityAnswer: "Verified" },
    subscription: { plan: "Free", paymentMethod: "UPI" },
    agreements: { accuracy: true, authorized: true, terms: true, privacy: true, antiDiscrimination: true, antiViolation: true },
    documents: {},
  });

  const [recDocs, setRecDocs] = useState({
    regCertificate: null, panCard: null, gstCertificate: null, signatoryIdProof: null,
    addressProof: null, cinCertificate: null, msmeCertificate: null, startupIndiaCert: null,
    isoCertificate: null, shopEstCert: null, iecCode: null, tradeLicence: null, labourLicence: null,
  });
  const [logo, setLogo] = useState(null);

  // Candidate state
  const [candForm, setCandForm] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    personal: { bio: "", dateOfBirth: "", gender: "Male", maritalStatus: "Single", city: "", state: "", houseNumber: "", street: "", area: "", pinCode: "", aadhar: "", pan: "", category: "General", religion: "" },
    contact: { emergencyContact: "", linkedin: "", github: "", portfolio: "", youtube: "" },
    career: { jobTitle: "", industry: "", functionalArea: "", desiredRole: "", jobType: "Full-time", preferredLocations: [], noticePeriod: "15 Days", currentCtc: "", expectedCtc: "" },
    experience: { totalYears: "0", totalMonths: "0", employmentType: "Experienced", currentEmployer: "", designation: "", responsibilities: "" },
    education: { qualification: "Bachelor's Degree", degree: "", college: "", passingYear: "2024", percentage: "" },
    skills: [],
    certificationsList: [],
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (isRecruiter) {
      const rp = typeof user.recruiterProfile === "string" ? JSON.parse(user.recruiterProfile || "{}") : (user.recruiterProfile || {});
      const c = rp.company || {};
      const a = rp.address || {};
      const ct = rp.contact || {};
      const h = rp.hiring || {};
      const b = rp.billing || {};
      const acc = rp.account || {};
      const sub = rp.subscription || {};
      const ag = rp.agreements || {};

      setRecForm({
        company: {
          name: c.name || user.extraDetails?.companyName || user.companyName || "",
          website: c.website || "",
          email: c.email || user.email || "",
          mobile: c.mobile || user.phoneNumber || "",
          whatsapp: c.whatsapp || "",
          sameAsMobile: c.sameAsMobile || false,
          type: c.type || "Private Limited Company",
          customType: c.customType || "",
          industry: c.industry || "Information Technology",
          customIndustry: c.customIndustry || "",
          servicesList: Array.isArray(c.servicesList) ? c.servicesList : [],
          newServiceInput: "",
          size: c.size || "1-10",
          customSize: c.customSize || "",
          yearEstablished: c.yearEstablished || "2024",
          description: c.description || "",
        },
        address: {
          country: a.country || "India",
          state: a.state || "",
          city: a.city || user.city || "",
          area: a.area || "",
          sector: a.sector || "",
          building: a.building || "",
          floor: a.floor || "",
          pinCode: a.pinCode || "",
          landmark: a.landmark || "",
          googleMapsUrl: a.googleMapsUrl || "",
        },
        branches: Array.isArray(rp.branches) ? rp.branches : (c.branches || []),
        contact: {
          fullname: ct.fullname || user.fullname || "",
          designation: ct.designation || "HR Manager",
          customDesignation: ct.customDesignation || "",
          department: ct.department || "",
          email: ct.email || user.email || "",
          mobile: ct.mobile || user.phoneNumber || "",
          whatsapp: ct.whatsapp || "",
          category: ct.category || "",
          religion: ct.religion || "",
        },
        hiring: {
          hiringFor: h.hiringFor || "Your Own Company",
          customHiringFor: h.customHiringFor || "",
          volume: h.volume || "1-5 Candidates",
          customVolume: h.customVolume || "",
          frequency: h.frequency || "Monthly",
          locations: h.locations || "",
          industries: Array.isArray(h.industries) ? h.industries : [],
        },
        billing: {
          gst: b.gst || user.extraDetails?.gstNumber || user.gstNumber || "",
          pan: b.pan || user.pancard || "",
          cin: b.cin || "",
          msme: b.msme || "",
          billingAddress: b.billingAddress || "",
        },
        account: {
          username: acc.username || user.username || (user.email ? user.email.split("@")[0] : ""),
          securityQuestion: acc.securityQuestion || "What is your mother's maiden name?",
          securityAnswer: acc.securityAnswer || "Verified",
        },
        subscription: {
          plan: sub.plan || "Free",
          paymentMethod: sub.paymentMethod || "UPI",
        },
        agreements: {
          accuracy: ag.accuracy ?? true,
          authorized: ag.authorized ?? true,
          terms: ag.terms ?? true,
          privacy: ag.privacy ?? true,
          antiDiscrimination: ag.antiDiscrimination ?? true,
          antiViolation: ag.antiViolation ?? true,
        },
        documents: rp.documents || {},
      });
    } else {
      const cp = typeof user.candidateProfile === "string" ? JSON.parse(user.candidateProfile || "{}") : (user.candidateProfile || {});
      const rawCandSkills = cp.skills || (user.skills ? user.skills.split(",").map(s => s.trim()) : []);
      const cleanCandSkills = Array.isArray(rawCandSkills)
        ? rawCandSkills.map(s => typeof s === "object" && s !== null ? (s.skill || s.name || "") : String(s)).filter(Boolean)
        : [];

      setCandForm({
        fullname: user.fullname || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        personal: { 
          bio: cp.personal?.bio || user.bio || "", 
          dateOfBirth: cp.personal?.dob || cp.personal?.dateOfBirth || user.extraDetails?.dateOfBirth || "", 
          gender: cp.personal?.gender || "Male", 
          maritalStatus: cp.personal?.maritalStatus || "Single", 
          city: cp.personal?.city || user.city || "", 
          state: cp.personal?.state || "", 
          country: cp.personal?.country || "India",
          sector: cp.personal?.sector || cp.personal?.area || "",
          landmark: cp.personal?.landmark || "",
          houseNumber: cp.personal?.houseNumber || "", 
          street: cp.personal?.street || "", 
          area: cp.personal?.area || "", 
          pinCode: cp.personal?.pinCode || cp.personal?.zipCode || "", 
          aadhar: cp.personal?.aadhar || user.adharcard || "", 
          pan: cp.personal?.pan || user.pancard || "", 
          category: cp.personal?.category || user.category || "General", 
          religion: cp.personal?.religion || user.religion || "" 
        },
        contact: { emergencyContact: cp.contact?.emergencyContact || "", linkedin: cp.contact?.linkedin || "", github: cp.contact?.github || "", portfolio: cp.contact?.portfolio || "", youtube: cp.contact?.youtube || "" },
        career: { jobTitle: cp.career?.jobTitle || cp.career?.title || "", industry: cp.career?.industry || "", functionalArea: cp.career?.functionalArea || "", desiredRole: cp.career?.desiredRole || "", jobType: cp.career?.jobType || "Full-time", preferredLocations: cp.career?.preferredLocations || cp.career?.locations || [], noticePeriod: cp.career?.noticePeriod || "15 Days", currentCtc: cp.career?.currentCtc || "", expectedCtc: cp.career?.expectedCtc || "" },
        experience: { totalYears: cp.experience?.totalYears || cp.experience?.years || "0", totalMonths: cp.experience?.totalMonths || cp.experience?.months || "0", employmentType: cp.experience?.employmentType || cp.personal?.employmentType || "Experienced", currentEmployer: cp.experience?.currentEmployer || cp.experience?.currentCompany || cp.experience?.company || "", designation: cp.experience?.designation || "", responsibilities: cp.experience?.responsibilities || "" },
        education: { qualification: cp.education?.qualification || "Bachelor's Degree", degree: cp.education?.degree || user.education || "", college: cp.education?.college || "", passingYear: cp.education?.passingYear || "2024", percentage: cp.education?.percentage || "" },
        skills: cleanCandSkills,
        certificationsList: cp.certificationsList || [],
      });
    }
  }, [user, isRecruiter]);

  const setRecField = (section, key, val) => {
    setRecForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [key]: val }
    }));
  };

  const getExistingDocLabel = (docKey, fallbackName) => {
    if (recDocs[docKey]) return [recDocs[docKey].name];
    if (recForm.documents?.[docKey]) return [recForm.documents[docKey]];
    return fallbackName ? [fallbackName] : [];
  };

  const validateRecStep = (stepIdx) => {
    if (stepIdx === 0) {
      if (!recForm.company.name.trim()) return "Company Name is required";
      if (!recForm.company.email.trim()) return "Company Email is required";
      const compMobDigits = (recForm.company.mobile || "").replace(/\D/g, "");
      if (!compMobDigits || compMobDigits.length < 7) return "Valid Mobile Number is required";
      if ((recForm.company.type === "Add Manually" || recForm.company.type === "Other") && !recForm.company.customType?.trim()) return "Please specify custom Company Type";
      if ((recForm.company.industry === "Add Manually" || recForm.company.industry === "Other") && !recForm.company.customIndustry?.trim()) return "Please specify custom Industry";
      if (recForm.company.industry === "Service Industry" && (!recForm.company.servicesList || recForm.company.servicesList.length === 0)) {
        return "Please add at least one Service offered for Service Industry";
      }
      if ((recForm.company.size === "Add Manually" || recForm.company.size === "Other (Specify Manually)") && !recForm.company.customSize?.trim()) return "Please specify custom Company Size";
      if (!recForm.company.description?.trim()) return "Company Description is required";
    }
    if (stepIdx === 1) {
      if (!recForm.address.country.trim()) return "Country is required";
      if (!recForm.address.state.trim()) return "State is required";
      if (!recForm.address.city.trim()) return "City is required";
    }
    if (stepIdx === 2) {
      if (!recForm.contact.fullname.trim()) return "Contact Person Full Name is required";
      if ((recForm.contact.designation === "Add Manually" || recForm.contact.designation === "Other") && !recForm.contact.customDesignation?.trim()) return "Please specify custom Designation";
      if (!recForm.contact.email.trim()) return "Official Contact Email is required";
      const contMobDigits = (recForm.contact.mobile || "").replace(/\D/g, "");
      if (!contMobDigits || contMobDigits.length < 7) return "Valid Contact Mobile Number is required";
    }
    if (stepIdx === 3) {
      if ((recForm.hiring.hiringFor === "Add Manually" || recForm.hiring.hiringFor === "Other (Specify Manually)") && !recForm.hiring.customHiringFor?.trim()) return "Please specify 'Hiring For' field";
      if ((recForm.hiring.volume === "Add Manually" || recForm.hiring.volume === "Other (Specify Manually)") && !recForm.hiring.customVolume?.trim()) return "Please specify 'Hiring Volume' field";
    }
    if (stepIdx === 5) {
      if (!recForm.account.username || recForm.account.username.trim().length < 3) return "Username must be at least 3 characters long";
    }
    if (stepIdx === 6) {
      const MANDATORY_KEYS = ["regCertificate", "panCard", "gstCertificate", "signatoryIdProof", "addressProof"];
      const labels = {
        regCertificate: "Company Registration Certificate",
        panCard: "PAN Card",
        gstCertificate: "GST Certificate",
        signatoryIdProof: "Authorized Signatory ID Proof",
        addressProof: "Business Address Proof",
      };
      const missingKeys = [];
      MANDATORY_KEYS.forEach((key) => {
        const hasNewFile = recDocs[key];
        const hasExistingFile = recForm.documents?.[key] && typeof recForm.documents[key] === "string" && recForm.documents[key].trim() !== "";
        if (!hasNewFile && !hasExistingFile) {
          missingKeys.push(labels[key]);
        }
      });
      if (missingKeys.length > 0) {
        return `Please upload all 5 mandatory compliance documents: ${missingKeys.join(", ")}`;
      }
      if (!Object.values(recForm.agreements).every(Boolean)) return "All compliance agreement checkboxes are required to save changes";
    }
    return true;
  };

  const handleSaveRecruiterProfile = async () => {
    const formData = new FormData();
    const existingDocsMap = recForm.documents || {};
    const updatedDocsMapping = {
      ...existingDocsMap,
      regCertificate: recDocs.regCertificate ? recDocs.regCertificate.name : (existingDocsMap.regCertificate || null),
      panCard: recDocs.panCard ? recDocs.panCard.name : (existingDocsMap.panCard || null),
      gstCertificate: recDocs.gstCertificate ? recDocs.gstCertificate.name : (existingDocsMap.gstCertificate || null),
      signatoryIdProof: recDocs.signatoryIdProof ? recDocs.signatoryIdProof.name : (existingDocsMap.signatoryIdProof || null),
      addressProof: recDocs.addressProof ? recDocs.addressProof.name : (existingDocsMap.addressProof || null),
      cinCertificate: recDocs.cinCertificate ? recDocs.cinCertificate.name : (existingDocsMap.cinCertificate || null),
      msmeCertificate: recDocs.msmeCertificate ? recDocs.msmeCertificate.name : (existingDocsMap.msmeCertificate || null),
      startupIndiaCert: recDocs.startupIndiaCert ? recDocs.startupIndiaCert.name : (existingDocsMap.startupIndiaCert || null),
      isoCertificate: recDocs.isoCertificate ? recDocs.isoCertificate.name : (existingDocsMap.isoCertificate || null),
      shopEstCert: recDocs.shopEstCert ? recDocs.shopEstCert.name : (existingDocsMap.shopEstCert || null),
      iecCode: recDocs.iecCode ? recDocs.iecCode.name : (existingDocsMap.iecCode || null),
      tradeLicence: recDocs.tradeLicence ? recDocs.tradeLicence.name : (existingDocsMap.tradeLicence || null),
      labourLicence: recDocs.labourLicence ? recDocs.labourLicence.name : (existingDocsMap.labourLicence || null),
    };

    const finalProfile = {
      ...recForm,
      documents: updatedDocsMapping,
    };

    formData.append("profileData", JSON.stringify(finalProfile));
    formData.append("fullname", recForm.contact.fullname || recForm.company.name);
    formData.append("email", recForm.company.email || recForm.contact.email);
    formData.append("phoneNumber", recForm.company.mobile);
    formData.append("companyName", recForm.company.name);
    formData.append("gstNumber", recForm.billing.gst);

    if (logo) formData.append("companyLogo", logo);
    Object.values(recDocs).forEach(file => {
      if (file && typeof file !== "string") {
        formData.append("verificationDocs", file);
      }
    });

    try {
      setSubmitting(true);

      await saveFieldMapToPool({
        companyName: recForm.company.name,
        industry: recForm.company.industry === "Service Industry" ? recForm.company.servicesList : (recForm.company.industry === "Add Manually" ? recForm.company.customIndustry : recForm.company.industry),
        designation: recForm.contact.designation === "Add Manually" ? recForm.contact.customDesignation : recForm.contact.designation,
        country: recForm.address.country,
        state: recForm.address.state,
        city: recForm.address.city,
        pincode: recForm.address.pinCode,
        area: recForm.address.area,
        sector: recForm.address.sector,
        landmark: recForm.address.landmark,
        building: recForm.address.building,
        floorSuite: recForm.address.floor,
        category: recForm.contact.category,
        religion: recForm.contact.religion,
      });

      const res = await axios.post(`${ADMIN_API_ENDPOINT}/users/${user.id || user._id}/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Employer profile updated successfully by Admin!");
        onSuccess();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to update employer profile.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error updating employer profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCandidateProfile = async () => {
    const formData = new FormData();
    formData.append("profileData", JSON.stringify(candForm));
    formData.append("fullname", candForm.fullname);
    formData.append("email", candForm.email);
    formData.append("phoneNumber", candForm.phoneNumber);

    const candidateSkills = Array.isArray(candForm.skills)
      ? candForm.skills.map((s) => (typeof s === "string" ? s : s?.skill)).filter(Boolean)
      : [];
    formData.append("skills", candidateSkills.join(", "));

    if (resumeFile) formData.append("resume", resumeFile);
    if (photoFile) formData.append("profilePhoto", photoFile);
    if (videoFile) formData.append("videoIntro", videoFile);

    try {
      setSubmitting(true);

      await saveFieldMapToPool({
        city: candForm.personal.city,
        state: candForm.personal.state,
        jobTitle: candForm.career.jobTitle,
        industry: candForm.career.industry,
        education: candForm.education.qualification,
        university: candForm.education.college,
        companyName: candForm.experience.currentEmployer,
        designation: candForm.experience.designation,
        skills: candidateSkills,
        category: candForm.personal.category,
        religion: candForm.personal.religion,
      });

      const res = await axios.post(`${ADMIN_API_ENDPOINT}/users/${user.id || user._id}/update-profile`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Candidate profile updated successfully by Admin!");
        onSuccess();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to update candidate profile.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error updating candidate profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const recruiterWizardSteps = [
    {
      title: "Company Info",
      subtitle: "Update organization details",
      content: (
        <SectionCard title="Company Information" icon={Building2}>
          <Field label="Company Name" required>
            <AutoCompleteInput options={optionPool.companyName} value={recForm.company.name} onChange={(v) => setRecField("company", "name", v)} placeholder="Select or type Company Name" />
          </Field>
          <Field label="Company Logo">
            <FileDrop
              label="Upload new logo (JPG/PNG/SVG)"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0])}
              fileNames={logo ? [logo.name] : (recForm.company.logo ? ["Current Logo Uploaded ✓"] : [])}
            />
          </Field>
          <Field label="Company Website">
            <TextInput value={recForm.company.website} onChange={(e) => setRecField("company", "website", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Company Email" required>
            <TextInput type="email" value={recForm.company.email} onChange={(e) => setRecField("company", "email", e.target.value)} />
          </Field>
          <Field label="Mobile Number" required>
            <InternationalPhoneInput
              value={recForm.company.mobile}
              onChange={(v) => {
                setRecField("company", "mobile", v);
                if (recForm.company.sameAsMobile) setRecField("company", "whatsapp", v);
              }}
            />
          </Field>
          <Field label="WhatsApp Number">
            <InternationalPhoneInput
              value={recForm.company.sameAsMobile ? recForm.company.mobile : recForm.company.whatsapp}
              disabled={recForm.company.sameAsMobile}
              onChange={(v) => setRecField("company", "whatsapp", v)}
            />
            <div className="mt-2">
              <CheckboxRow
                checked={recForm.company.sameAsMobile}
                label="Same as mobile"
                onChange={(v) => {
                  setRecField("company", "sameAsMobile", v);
                  if (v) setRecField("company", "whatsapp", recForm.company.mobile);
                }}
              />
            </div>
          </Field>

          <Field label="Company Type" required>
            <SelectInput options={COMPANY_TYPES} value={recForm.company.type} onChange={(e) => setRecField("company", "type", e.target.value)} />
          </Field>
          {(recForm.company.type === "Add Manually" || recForm.company.type === "Other") && (
            <Field label="Specify Custom Company Type" required className="col-span-full">
              <TextInput
                value={recForm.company.customType || ""}
                onChange={(e) => setRecField("company", "customType", e.target.value)}
                placeholder="e.g. Joint Venture, Trust, Co-operative"
              />
            </Field>
          )}

          <Field label="Industry" required>
            <AutoCompleteInput options={Array.from(new Set([...(optionPool.industry || []), ...INDUSTRIES]))} value={recForm.company.industry} onChange={(v) => setRecField("company", "industry", v)} placeholder="Select or type Industry" />
          </Field>
          {recForm.company.industry === "Service Industry" && (
            <Field label="Services Offered (Service Industry)" required className="col-span-full" hint="Type a service and click '+ Add Service' or press Enter">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <TextInput
                    value={recForm.company.newServiceInput || ""}
                    onChange={(e) => setRecField("company", "newServiceInput", e.target.value)}
                    placeholder="e.g. IT Consulting, Facility Management"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (recForm.company.newServiceInput || "").trim();
                        if (val && !recForm.company.servicesList?.includes(val)) {
                          setRecField("company", "servicesList", [...(recForm.company.servicesList || []), val]);
                          setRecField("company", "newServiceInput", "");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (recForm.company.newServiceInput || "").trim();
                      if (val && !recForm.company.servicesList?.includes(val)) {
                        setRecField("company", "servicesList", [...(recForm.company.servicesList || []), val]);
                        setRecField("company", "newServiceInput", "");
                      }
                    }}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shrink-0"
                  >
                    + Add Service
                  </button>
                </div>

                {recForm.company.servicesList && recForm.company.servicesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {recForm.company.servicesList.map((srv, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                        {srv}
                        <button
                          type="button"
                          onClick={() => setRecField("company", "servicesList", recForm.company.servicesList.filter((_, i) => i !== idx))}
                          className="hover:text-red-500 font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          )}

          {(recForm.company.industry === "Add Manually" || recForm.company.industry === "Other") && (
            <Field label="Specify Custom Industry" required className="col-span-full">
              <TextInput
                value={recForm.company.customIndustry || ""}
                onChange={(e) => setRecField("company", "customIndustry", e.target.value)}
                placeholder="e.g. Renewable Energy, Aerospace & Defense"
              />
            </Field>
          )}

          <Field label="Company Size" required>
            <PillGroup options={COMPANY_SIZES} value={recForm.company.size} onChange={(v) => setRecField("company", "size", v)} />
          </Field>
          {(recForm.company.size === "Add Manually" || recForm.company.size === "Other (Specify Manually)") && (
            <Field label="Specify Custom Company Size" required className="col-span-full">
              <TextInput
                value={recForm.company.customSize || ""}
                onChange={(e) => setRecField("company", "customSize", e.target.value)}
                placeholder="e.g. 5,000+ Global Workforce"
              />
            </Field>
          )}

          <Field label="Year Established">
            <SelectInput options={YEARS} value={recForm.company.yearEstablished} onChange={(e) => setRecField("company", "yearEstablished", e.target.value)} />
          </Field>
          <Field label="Company Description" required className="col-span-full">
            <TextArea value={recForm.company.description} onChange={(e) => setRecField("company", "description", e.target.value)} placeholder="Briefly describe your company..." />
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Company Address",
      subtitle: "Registered office & branch offices",
      content: (
        <>
          <SectionCard title="Registered Office Address" icon={MapPin} description="Type street address to auto-fill via Google Maps">
            <Field label="Country" required>
              <AutoCompleteInput options={optionPool.country} value={recForm.address.country} onChange={(v) => setRecField("address", "country", v)} placeholder="Select or type Country" />
            </Field>
            <Field label="State" required>
              <AutoCompleteInput options={optionPool.state} value={recForm.address.state} onChange={(v) => setRecField("address", "state", v)} placeholder="Select or type State" />
            </Field>
            <Field label="City" required>
              <AutoCompleteInput options={optionPool.city} value={recForm.address.city} onChange={(v) => setRecField("address", "city", v)} placeholder="Select or type City" />
            </Field>
            <Field label="Area">
              <AutoCompleteInput options={optionPool.area} value={recForm.address.area} onChange={(v) => setRecField("address", "area", v)} placeholder="Select or type Area" />
            </Field>
            <Field label="Sector">
              <AutoCompleteInput options={optionPool.sector} value={recForm.address.sector} onChange={(v) => setRecField("address", "sector", v)} placeholder="e.g. Sector 62" />
            </Field>
            <Field label="Building / Office Search" className="sm:col-span-2" hint="Start typing — city/state/pin auto-fill from Google Maps">
              <AddressAutocomplete
                value={recForm.address.building}
                onChange={(v) => setRecField("address", "building", v)}
                onPlaceSelect={(p) => setRecForm((prev) => ({
                  ...prev,
                  address: {
                    ...prev.address,
                    city: p.city || prev.address.city,
                    state: p.state || prev.address.state,
                    country: p.country || prev.address.country,
                    pinCode: p.pinCode || prev.address.pinCode,
                    googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.formatted)}`,
                  },
                }))}
              />
            </Field>
            <Field label="Floor / Suite">
              <AutoCompleteInput options={optionPool.floorSuite} value={recForm.address.floor} onChange={(v) => setRecField("address", "floor", v)} placeholder="e.g. 4th Floor" />
            </Field>
            <Field label="PIN Code">
              <AutoCompleteInput options={optionPool.pincode} value={recForm.address.pinCode} onChange={(v) => setRecField("address", "pinCode", v)} placeholder="Select or type PIN Code" />
            </Field>
            <Field label="Landmark" className="sm:col-span-2">
              <AutoCompleteInput options={optionPool.landmark} value={recForm.address.landmark} onChange={(v) => setRecField("address", "landmark", v)} placeholder="e.g. Near Metro Station" />
            </Field>
            {recForm.address.googleMapsUrl && (
              <div className="col-span-full mt-1.5 p-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs text-blue-700">
                <span className="font-semibold">Google Maps Location Attached ✓</span>
                <a href={recForm.address.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-800">Preview Location →</a>
              </div>
            )}
          </SectionCard>
          <SectionCard title="Branch Offices" icon={Building2} description="Add optional branch office locations">
            <Field label="Branches" className="col-span-full">
              <RepeatableList
                items={recForm.branches || []}
                addLabel="Add branch"
                onAdd={() => setRecForm((f) => ({ ...f, branches: [...(f.branches || []), { city: "", state: "", pinCode: "" }] }))}
                onRemove={(i) => setRecForm((f) => ({ ...f, branches: f.branches.filter((_, idx) => idx !== i) }))}
                renderItem={(item, i) => (
                  <>
                    <TextInput placeholder="City" value={item.city} onChange={(e) => setRecForm((f) => { const b = [...f.branches]; b[i] = { ...b[i], city: e.target.value }; return { ...f, branches: b }; })} />
                    <TextInput placeholder="State" value={item.state} onChange={(e) => setRecForm((f) => { const b = [...f.branches]; b[i] = { ...b[i], state: e.target.value }; return { ...f, branches: b }; })} />
                    <TextInput placeholder="PIN Code" maxLength={6} value={item.pinCode} onChange={(e) => setRecForm((f) => { const b = [...f.branches]; b[i] = { ...b[i], pinCode: e.target.value.replace(/\D/g, "") }; return { ...f, branches: b }; })} />
                  </>
                )}
              />
            </Field>
          </SectionCard>
        </>
      ),
    },
    {
      title: "Primary Contact",
      subtitle: "Authorized representative details",
      content: (
        <SectionCard title="Primary Contact Person" icon={UserRound}>
          <Field label="Full Name" required><TextInput maxLength={100} value={recForm.contact.fullname} onChange={(e) => setRecField("contact", "fullname", e.target.value)} /></Field>
          <Field label="Designation" required>
            <AutoCompleteInput options={optionPool.designation} value={recForm.contact.designation} onChange={(v) => setRecField("contact", "designation", v)} placeholder="Select or type Designation" />
          </Field>
          {(recForm.contact.designation === "Add Manually" || recForm.contact.designation === "Other") && (
            <Field label="Specify Custom Designation" required className="col-span-full">
              <TextInput
                value={recForm.contact.customDesignation || ""}
                onChange={(e) => setRecField("contact", "customDesignation", e.target.value)}
                placeholder="e.g. Chief People Officer, Head of Talent"
              />
            </Field>
          )}
          <Field label="Department"><TextInput maxLength={50} value={recForm.contact.department} onChange={(e) => setRecField("contact", "department", e.target.value)} /></Field>
          <Field label="Mobile Number" required>
            <InternationalPhoneInput value={recForm.contact.mobile} onChange={(v) => setRecField("contact", "mobile", v)} />
          </Field>
          <Field label="WhatsApp Number">
            <InternationalPhoneInput value={recForm.contact.whatsapp} onChange={(v) => setRecField("contact", "whatsapp", v)} />
          </Field>
          <Field label="Category">
            <AutoCompleteInput options={optionPool.category} value={recForm.contact.category} onChange={(v) => setRecField("contact", "category", v)} placeholder="Select or type Category" />
          </Field>
          <Field label="Religion">
            <AutoCompleteInput options={optionPool.religion} value={recForm.contact.religion} onChange={(v) => setRecField("contact", "religion", v)} placeholder="Select or type Religion" />
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Hiring Info",
      subtitle: "Update hiring requirements",
      content: (
        <SectionCard title="Hiring Preferences" icon={Briefcase}>
          <Field label="Are you hiring for?"><PillGroup options={HIRING_FOR} value={recForm.hiring.hiringFor} onChange={(v) => setRecField("hiring", "hiringFor", v)} /></Field>
          {(recForm.hiring.hiringFor === "Add Manually" || recForm.hiring.hiringFor === "Other (Specify Manually)") && (
            <Field label="Specify Custom Hiring Purpose" required className="col-span-full">
              <TextInput
                value={recForm.hiring.customHiringFor || ""}
                onChange={(e) => setRecField("hiring", "customHiringFor", e.target.value)}
                placeholder="e.g. Contractual Staffing for Third-Party Vendors"
              />
            </Field>
          )}

          <Field label="Average Hiring Requirement"><SelectInput options={HIRING_VOLUME} value={recForm.hiring.volume} onChange={(e) => setRecField("hiring", "volume", e.target.value)} /></Field>
          {(recForm.hiring.volume === "Add Manually" || recForm.hiring.volume === "Other (Specify Manually)") && (
            <Field label="Specify Custom Hiring Requirement" required className="col-span-full">
              <TextInput
                value={recForm.hiring.customVolume || ""}
                onChange={(e) => setRecField("hiring", "customVolume", e.target.value)}
                placeholder="e.g. 200+ Bulk Hiring per Quarter"
              />
            </Field>
          )}

          <Field label="Hiring Frequency"><SelectInput options={HIRING_FREQ} value={recForm.hiring.frequency} onChange={(e) => setRecField("hiring", "frequency", e.target.value)} /></Field>
          <Field label="Preferred Hiring Locations (Worldwide Allowed)"><TextInput value={recForm.hiring.locations} onChange={(e) => setRecField("hiring", "locations", e.target.value)} placeholder="e.g. Delhi NCR, Remote, Noida, London" /></Field>
        </SectionCard>
      ),
    },
    {
      title: "Billing Info",
      subtitle: "Taxation & invoice details",
      content: (
        <SectionCard title="Billing Information" icon={Receipt}>
          <Field label="GST Number (Optional)"><TextInput maxLength={15} value={recForm.billing.gst} onChange={(e) => setRecField("billing", "gst", e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" /></Field>
          <Field label="PAN Number (Optional)"><TextInput maxLength={10} value={recForm.billing.pan} onChange={(e) => setRecField("billing", "pan", e.target.value.toUpperCase())} placeholder="ABCDE1234F" /></Field>
          <Field label="CIN Number (For Companies)"><TextInput maxLength={21} value={recForm.billing.cin} onChange={(e) => setRecField("billing", "cin", e.target.value.toUpperCase())} placeholder="e.g. U72200DL2021PTC384950" /></Field>
          <Field label="MSME Registration Number (Optional)"><TextInput value={recForm.billing.msme} onChange={(e) => setRecField("billing", "msme", e.target.value)} placeholder="e.g. UDYAM-XX-00-1234567" /></Field>
          <Field label="Billing Address" className="col-span-full"><TextArea value={recForm.billing.billingAddress} onChange={(e) => setRecField("billing", "billingAddress", e.target.value)} /></Field>
        </SectionCard>
      ),
    },
    {
      title: "Account & Plan",
      subtitle: "Username & subscription plan",
      content: (
        <>
          <SectionCard title="Account Credentials" icon={KeyRound}>
            <Field label="Username / Handle" required>
              <TextInput value={recForm.account.username} onChange={(e) => setRecField("account", "username", e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} placeholder="e.g. google_recruitment" />
            </Field>
          </SectionCard>

          <SectionCard title="Subscription Plan & Payment" icon={CreditCard}>
            <Field label="Subscription Plan" className="col-span-full"><PillGroup options={PLANS} value={recForm.subscription.plan} onChange={(v) => setRecField("subscription", "plan", v)} /></Field>
            <Field label="Payment Method"><SelectInput options={PAYMENT_METHODS} value={recForm.subscription.paymentMethod} onChange={(e) => setRecField("subscription", "paymentMethod", e.target.value)} /></Field>
          </SectionCard>
        </>
      ),
    },
    {
      title: "Documents & Compliance",
      subtitle: "Mandatory file uploads & agreements",
      content: (
        <>
          <SectionCard title="Mandatory Uploads (5 Checklists Required)" icon={FileText} description="5 Required verification certificates for security & compliance checks">
            <Field label="Company Registration Certificate *" required>
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, regCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("regCertificate")} />
            </Field>
            <Field label="PAN Card (Company/Firm) *" required>
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, panCard: e.target.files?.[0] }))} fileNames={getExistingDocLabel("panCard")} />
            </Field>
            <Field label="GST Certificate *" required>
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, gstCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("gstCertificate")} />
            </Field>
            <Field label="Authorized Signatory ID Proof *" required hint="Aadhaar Card, Passport, or Driving License">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, signatoryIdProof: e.target.files?.[0] }))} fileNames={getExistingDocLabel("signatoryIdProof")} />
            </Field>
            <Field label="Business Address Proof *" required hint="Electricity Bill, Rent Agreement, Utility Bill">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, addressProof: e.target.files?.[0] }))} fileNames={getExistingDocLabel("addressProof")} />
            </Field>
          </SectionCard>

          <SectionCard title="Optional Business Certificates" icon={FileText} description="Add extra certificates for faster trust verification and a Verified Employer badge.">
            <Field label="CIN Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, cinCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("cinCertificate")} />
            </Field>
            <Field label="MSME Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, msmeCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("msmeCertificate")} />
            </Field>
            <Field label="Startup India Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, startupIndiaCert: e.target.files?.[0] }))} fileNames={getExistingDocLabel("startupIndiaCert")} />
            </Field>
            <Field label="ISO Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, isoCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("isoCertificate")} />
            </Field>
            <Field label="Shop & Establishment Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, shopEstCert: e.target.files?.[0] }))} fileNames={getExistingDocLabel("shopEstCert")} />
            </Field>
            <Field label="Import Export Code (IEC)">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, iecCode: e.target.files?.[0] }))} fileNames={getExistingDocLabel("iecCode")} />
            </Field>
            <Field label="Trade Licence">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, tradeLicence: e.target.files?.[0] }))} fileNames={getExistingDocLabel("tradeLicence")} />
            </Field>
            <Field label="Labour Licence">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setRecDocs((d) => ({ ...d, labourLicence: e.target.files?.[0] }))} fileNames={getExistingDocLabel("labourLicence")} />
            </Field>
          </SectionCard>

          <SectionCard title="Terms & Compliance" icon={ShieldCheck}>
            <div className="col-span-full flex flex-col gap-3">
              <CheckboxRow checked={recForm.agreements.accuracy} label="I confirm that all information provided is accurate." onChange={(v) => setRecField("agreements", "accuracy", v)} />
              <CheckboxRow checked={recForm.agreements.authorized} label="I am authorized to represent this organization." onChange={(v) => setRecField("agreements", "authorized", v)} />
              <CheckboxRow checked={recForm.agreements.terms} label="I agree to the Terms & Conditions." onChange={(v) => setRecField("agreements", "terms", v)} />
              <CheckboxRow checked={recForm.agreements.privacy} label="I agree to the Privacy Policy." onChange={(v) => setRecField("agreements", "privacy", v)} />
              <CheckboxRow checked={recForm.agreements.antiDiscrimination} label="I agree not to post fake, misleading, or discriminatory job advertisements." onChange={(v) => setRecField("agreements", "antiDiscrimination", v)} />
              <CheckboxRow checked={recForm.agreements.antiViolation} label="I confirm compliance with labour laws and non-violation of statutory guidelines." onChange={(v) => setRecField("agreements", "antiViolation", v)} />
            </div>
          </SectionCard>
        </>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 my-4"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-bold">
            <Edit className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Admin Edit Profile — {isRecruiter ? "Employer / Recruiter" : "Candidate / Employee"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Updating {user?.fullname} ({user?.email})
            </p>
          </div>
        </div>

        {isRecruiter ? (
          <StepWizard
            steps={recruiterWizardSteps}
            onSubmit={handleSaveRecruiterProfile}
            submitting={submitting}
            submitLabel="Save Employer Profile (Admin)"
            validateStep={validateRecStep}
          />
        ) : (
          <div className="space-y-6">
            <SectionCard title="Candidate Basic & Personal Information" icon={User}>
              <Field label="Full Name" required>
                <TextInput value={candForm.fullname} onChange={(e) => setCandForm(p => ({ ...p, fullname: e.target.value }))} />
              </Field>
              <Field label="Phone Number" required>
                <InternationalPhoneInput value={candForm.phoneNumber} onChange={(v) => setCandForm(p => ({ ...p, phoneNumber: v }))} />
              </Field>
              <Field label="Professional Bio">
                <TextArea value={candForm.personal.bio} onChange={(e) => setCandForm(p => ({ ...p, personal: { ...p.personal, bio: e.target.value } }))} rows={3} />
              </Field>
              <Field label="City">
                <AutoCompleteInput options={optionPool.city} value={candForm.personal.city} onChange={(v) => setCandForm(p => ({ ...p, personal: { ...p.personal, city: v } }))} placeholder="Select or type City" />
              </Field>
              <Field label="Category">
                <AutoCompleteInput options={optionPool.category} value={candForm.personal.category} onChange={(v) => setCandForm(p => ({ ...p, personal: { ...p.personal, category: v } }))} placeholder="Select or type Category" />
              </Field>
              <Field label="Religion">
                <AutoCompleteInput options={optionPool.religion} value={candForm.personal.religion} onChange={(v) => setCandForm(p => ({ ...p, personal: { ...p.personal, religion: v } }))} placeholder="Select or type Religion" />
              </Field>
              <Field label="Technical Skills" className="col-span-full" hint="Select or type a skill and click '+ Add Skill' to add capsule tags">
                <TagCapsuleInput
                  options={optionPool.skills}
                  value={candForm.skills}
                  onChange={(v) => setCandForm(p => ({ ...p, skills: v }))}
                  placeholder="e.g. React.js, Python, UI Design"
                  addLabel="+ Add Skill"
                  capsuleColor="blue"
                />
              </Field>
            </SectionCard>

            <SectionCard title="Resume & Attachments" icon={Upload}>
              <Field label="Resume / CV File">
                <FileDrop
                  label="Upload new Resume (PDF/DOCX)"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setResumeFile(e.target.files?.[0])}
                  fileNames={resumeFile ? [resumeFile.name] : (user?.resume ? ["Current Resume File Uploaded ✓"] : [])}
                />
              </Field>
              <Field label="Profile Photo">
                <FileDrop
                  label="Upload Profile Photo"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0])}
                  fileNames={photoFile ? [photoFile.name] : (user?.profilePhoto ? ["Current Photo Uploaded ✓"] : [])}
                />
              </Field>
            </SectionCard>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={onClose} type="button" className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                onClick={handleSaveCandidateProfile}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-bold text-white shadow-md hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Candidate Profile (Admin)"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminUserEditModal;
