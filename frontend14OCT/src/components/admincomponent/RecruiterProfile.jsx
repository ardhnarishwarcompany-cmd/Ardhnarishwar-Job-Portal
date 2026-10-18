import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, UserRound, Briefcase, Receipt, ShieldCheck, Mail, Phone,
  FileText, Edit, Clock, CheckCircle2, XCircle, AlertTriangle, Send, X, Save,
  KeyRound, HelpCircle, CreditCard, Eye
} from "lucide-react";
import Navbar from "../components_lite/Navbar";
import { getFileUrl, USER_API_ENDPOINT, RECRUITER_API_ENDPOINT } from "@/utils/data";
import axios from "axios";
import { toast } from "sonner";
import { setUser } from "@/redux/authSlice";
import StepWizard from "../wizard/StepWizard";
import AddressAutocomplete from "../wizard/AddressAutocomplete";
import {
  Field, TextInput, TextArea, SelectInput, PillGroup, ChipMultiSelect,
  CheckboxRow, FileDrop, SectionCard, RepeatableList,
} from "../wizard/formFields";
import { useOptionPool, saveFieldMapToPool } from "@/hooks/useOptionPool";
import AutoCompleteInput from "../wizard/AutoCompleteInput";
import InternationalPhoneInput from "../ui/InternationalPhoneInput";

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

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "In what city were you born?",
  "What is your favorite book?"
];

const DESIGNATIONS = [
  "HR Manager", "HR Executive", "Recruiter", "Director", "CEO", "Founder", "Owner", "Hiring Manager", "Team Lead", "Add Manually"
];

const YEARS = Array.from({ length: 2026 - 1950 + 1 }, (_, i) => String(2026 - i));

const SectionTitle = ({ icon: Icon, title }) => (
  <h3 className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-2 text-lg font-bold text-slate-800">
    <Icon className="h-5 w-5 text-blue-600" /> {title}
  </h3>
);

const DetailRow = ({ label, value }) => (
  <div className="py-2 border-b border-slate-50 last:border-0">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
    <div className="mt-0.5 text-sm font-medium text-slate-900">{value || "N/A"}</div>
  </div>
);

const RecruiterProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((store) => store.auth);
  const { optionPool } = useOptionPool();

  const [editStatusInfo, setEditStatusInfo] = useState({
    status: user?.profileEditStatus || "none",
    reason: user?.profileEditReason || "",
    remarks: user?.profileEditRemarks || "",
  });
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Form & OTP states
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);

  const handleSendEmailChangeOtp = async (targetEmail) => {
    const emailToUse = targetEmail || newEmailInput;
    if (!emailToUse || !emailToUse.trim()) {
      toast.error("Please enter a valid new email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse.trim())) {
      toast.error("Invalid email address format.");
      return;
    }
    if (user?.email && emailToUse.trim().toLowerCase() === user.email.toLowerCase()) {
      toast.info("This is already your current login email address.");
      return;
    }
    try {
      setSendingEmailOtp(true);
      const res = await axios.post(
        `${RECRUITER_API_ENDPOINT}/send-email-change-otp`,
        { newEmail: emailToUse.trim() },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message || `Verification OTP sent to ${emailToUse.trim()}`);
        setEmailOtpSent(true);
      } else {
        toast.error(res.data.message || "Failed to send verification OTP.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error sending verification OTP.");
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailChangeOtp = async () => {
    if (!emailOtpCode || emailOtpCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP code sent to your email.");
      return;
    }
    try {
      setVerifyingEmailOtp(true);
      const res = await axios.post(
        `${RECRUITER_API_ENDPOINT}/verify-email-change-otp`,
        { otp: emailOtpCode.trim() },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Login email updated successfully!");
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
        setShowEmailModal(false);
        setEmailOtpSent(false);
        setEmailOtpCode("");
        setNewEmailInput("");
      } else {
        toast.error(res.data.message || "Invalid OTP code.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to verify OTP.");
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  let profile = {};
  try {
    profile = typeof user?.recruiterProfile === "string"
      ? JSON.parse(user.recruiterProfile)
      : (user?.recruiterProfile || {});
  } catch (e) {
    console.error("Failed to parse recruiter profile", e);
  }

  const { company, address, branches, contact, hiring, billing, account, subscription, agreements, documents } = profile;

  // Edit form state pre-filled from existing profile & user data
  const [editForm, setEditForm] = useState({
    company: {
      name: company?.name || user?.extraDetails?.companyName || user?.companyName || "",
      website: company?.website || "",
      email: company?.email || user?.email || "",
      mobile: company?.mobile || user?.phoneNumber || "",
      whatsapp: company?.whatsapp || "",
      sameAsMobile: company?.sameAsMobile || false,
      type: company?.type || "Private Limited Company",
      customType: company?.customType || "",
      industry: company?.industry || "Information Technology",
      customIndustry: company?.customIndustry || "",
      servicesList: Array.isArray(company?.servicesList) ? company.servicesList : [],
      newServiceInput: "",
      size: company?.size || "1-10",
      customSize: company?.customSize || "",
      yearEstablished: company?.yearEstablished || "2024",
      description: company?.description || "",
      emailOtp: "",
      emailOtpSent: false,
      emailVerified: true,
      mobileOtp: "",
      mobileOtpSent: false,
      mobileVerified: true,
    },
    address: {
      country: address?.country || "India",
      state: address?.state || "",
      city: address?.city || "",
      area: address?.area || "",
      sector: address?.sector || "",
      building: address?.building || "",
      floor: address?.floor || "",
      pinCode: address?.pinCode || "",
      landmark: address?.landmark || "",
      googleMapsUrl: address?.googleMapsUrl || "",
    },
    branches: Array.isArray(branches) ? branches : (company?.branches || []),
    contact: {
      fullname: contact?.fullname || user?.fullname || "",
      designation: contact?.designation || "HR Manager",
      customDesignation: contact?.customDesignation || "",
      department: contact?.department || "",
      email: contact?.email || user?.email || "",
      mobile: contact?.mobile || user?.phoneNumber || "",
      whatsapp: contact?.whatsapp || "",
      category: contact?.category || "",
      religion: contact?.religion || "",
    },
    hiring: {
      hiringFor: hiring?.hiringFor || "Your Own Company",
      customHiringFor: hiring?.customHiringFor || "",
      volume: hiring?.volume || "1-5 Candidates",
      customVolume: hiring?.customVolume || "",
      frequency: hiring?.frequency || "Monthly",
      locations: hiring?.locations || "",
      industries: Array.isArray(hiring?.industries) ? hiring.industries : [],
    },
    billing: {
      gst: billing?.gst || user?.extraDetails?.gstNumber || user?.gstNumber || "",
      pan: billing?.pan || user?.pancard || "",
      cin: billing?.cin || "",
      msme: billing?.msme || "",
      billingAddress: billing?.billingAddress || "",
    },
    account: {
      username: account?.username || user?.username || (user?.email ? user.email.split("@")[0] : ""),
      securityQuestion: account?.securityQuestion || SECURITY_QUESTIONS[0],
      securityAnswer: account?.securityAnswer || "Verified",
    },
    subscription: {
      plan: subscription?.plan || "Free",
      paymentMethod: subscription?.paymentMethod || "UPI",
    },
    agreements: {
      accuracy: agreements?.accuracy ?? true,
      authorized: agreements?.authorized ?? true,
      terms: agreements?.terms ?? true,
      privacy: agreements?.privacy ?? true,
      antiDiscrimination: agreements?.antiDiscrimination ?? true,
      antiViolation: agreements?.antiViolation ?? true,
    },
    verificationStatus: user?.verificationStatus || profile?.verificationStatus || "Pending",
  });

  const [logo, setLogo] = useState(null);
  const [docs, setDocs] = useState({
    regCertificate: null,
    panCard: null,
    gstCertificate: null,
    signatoryIdProof: null,
    addressProof: null,
    cinCertificate: null,
    msmeCertificate: null,
    startupIndiaCert: null,
    isoCertificate: null,
    shopEstCert: null,
    iecCode: null,
    tradeLicence: null,
    labourLicence: null,
  });

  // Re-sync editForm when modal opens or user profile changes
  useEffect(() => {
    if (user) {
      let latestProf = {};
      try {
        latestProf = typeof user.recruiterProfile === "string"
          ? JSON.parse(user.recruiterProfile)
          : (user.recruiterProfile || {});
      } catch (e) {}

      const c = latestProf.company || {};
      const a = latestProf.address || {};
      const ct = latestProf.contact || {};
      const h = latestProf.hiring || {};
      const b = latestProf.billing || {};
      const acc = latestProf.account || {};
      const sub = latestProf.subscription || {};
      const ag = latestProf.agreements || {};

      setEditForm({
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
          emailOtp: "",
          emailOtpSent: false,
          emailVerified: true,
          mobileOtp: "",
          mobileOtpSent: false,
          mobileVerified: true,
        },
        address: {
          country: a.country || "India",
          state: a.state || "",
          city: a.city || "",
          area: a.area || "",
          sector: a.sector || "",
          building: a.building || "",
          floor: a.floor || "",
          pinCode: a.pinCode || "",
          landmark: a.landmark || "",
          googleMapsUrl: a.googleMapsUrl || "",
        },
        branches: Array.isArray(latestProf.branches) ? latestProf.branches : [],
        contact: {
          fullname: ct.fullname || user.fullname || "",
          designation: ct.designation || "HR Manager",
          customDesignation: ct.customDesignation || "",
          department: ct.department || "",
          email: ct.email || user.email || "",
          mobile: ct.mobile || user.phoneNumber || "",
          whatsapp: ct.whatsapp || "",
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
          securityQuestion: acc.securityQuestion || SECURITY_QUESTIONS[0],
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
        verificationStatus: user.verificationStatus || latestProf.verificationStatus || "Pending",
      });
    }
  }, [user, showEditModal]);

  const setField = (section, key, value) =>
    setEditForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));

  const fetchEditStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await axios.get(`${USER_API_ENDPOINT}/recruiter/profile-edit-status`, { withCredentials: true });
      if (res.data.success) {
        setEditStatusInfo({
          status: res.data.status || "none",
          reason: res.data.reason || "",
          remarks: res.data.remarks || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch edit status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchEditStatus();
  }, [user]);

  // Handle Edit Profile button click
  const handleEditProfileClick = () => {
    if (editStatusInfo.status === "pending") {
      toast.info("Your profile edit request is currently under review by Admin.");
      return;
    }
    if (editStatusInfo.status === "approved") {
      toast.info("Your request is approved! Please use the 'Click here to edit your profile' button on the green approval banner.");
      return;
    }
    if (editStatusInfo.status === "rejected") {
      toast.info("Please click 'Done' on the red rejection banner to acknowledge and unlock profile editing request.");
      return;
    }
    // Allowed when status is 'none'
    setShowRequestModal(true);
  };

  // Employer acknowledges rejection by clicking Done on red banner
  const handleAcknowledgeDone = async () => {
    try {
      const res = await axios.post(`${USER_API_ENDPOINT}/recruiter/clear-edit-status`, {}, { withCredentials: true });
      if (res.data.success) {
        toast.success("Rejection acknowledged. You can now request profile edits again.");
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
        fetchEditStatus();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to acknowledge rejection.");
    }
  };

  // Submit Edit Request to Admin
  const handleSubmitEditRequest = async (e) => {
    e.preventDefault();
    if (!requestReason.trim()) {
      toast.error("Please specify the reason for requesting profile changes.");
      return;
    }

    try {
      setSubmittingRequest(true);
      const res = await axios.post(
        `${USER_API_ENDPOINT}/recruiter/profile-edit-request`,
        { reason: requestReason.trim(), requestedData: editForm },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message || "Edit request submitted to Admin!");
        setShowRequestModal(false);
        setRequestReason("");
        fetchEditStatus();
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
      } else {
        toast.error(res.data.message || "Failed to submit request.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong while submitting request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Step-by-step validations identical to registration
  const validateStep = (currentStepIndex) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const pinRegex = /^[0-9]{6}$/;
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (currentStepIndex === 0) {
      if (!editForm.company.name || editForm.company.name.length < 2) return "Valid Company Name is required.";
      if (!editForm.company.email || !emailRegex.test(editForm.company.email)) return "Valid Company Email is required.";
      const compMobDigits = (editForm.company.mobile || "").replace(/\D/g, "");
      if (!compMobDigits || compMobDigits.length < 7) return "Valid Mobile Number is required.";
      const compWaDigits = (editForm.company.whatsapp || "").replace(/\D/g, "");
      if (editForm.company.whatsapp && compWaDigits.length < 7) return "WhatsApp Number must be a valid number.";
      if (!editForm.company.type) return "Company Type is required.";
      if ((editForm.company.type === "Add Manually" || editForm.company.type === "Other") && (!editForm.company.customType || !editForm.company.customType.trim())) return "Please specify your custom Company Type.";
      if (!editForm.company.industry) return "Industry is required.";
      if (editForm.company.industry === "Service Industry" && (!editForm.company.servicesList || editForm.company.servicesList.length === 0)) return "Please add at least one service offered for Service Industry.";
      if ((editForm.company.industry === "Add Manually" || editForm.company.industry === "Other") && (!editForm.company.customIndustry || !editForm.company.customIndustry.trim())) return "Please specify your custom Industry.";
      if (!editForm.company.size) return "Company Size is required.";
      if ((editForm.company.size === "Add Manually" || editForm.company.size === "Other (Specify Manually)") && (!editForm.company.customSize || !editForm.company.customSize.trim())) return "Please specify your custom Company Size.";
      if (!editForm.company.description || editForm.company.description.length < 10) return "Company Description is required (min 10 characters).";
    }

    if (currentStepIndex === 1) {
      if (!editForm.address.country) return "Country is required.";
      if (!editForm.address.state) return "State is required.";
      if (!editForm.address.city) return "City is required.";
      if (editForm.address.pinCode && !pinRegex.test(editForm.address.pinCode)) return "Valid 6-digit PIN code is required.";

      if (editForm.branches?.length > 0) {
        for (const branch of editForm.branches) {
          if (!branch.city || !branch.state) return "Branch city and state cannot be empty.";
          if (branch.pinCode && !pinRegex.test(branch.pinCode)) return "Branch PIN code must be a valid 6-digit number.";
        }
      }
    }

    if (currentStepIndex === 2) {
      if (!editForm.contact.fullname || editForm.contact.fullname.length < 2) return "Valid Contact Person Name is required.";
      if (!editForm.contact.designation) return "Designation is required.";
      if ((editForm.contact.designation === "Add Manually" || editForm.contact.designation === "Other") && (!editForm.contact.customDesignation || !editForm.contact.customDesignation.trim())) return "Please specify your custom Designation.";
      if (!editForm.contact.email || !emailRegex.test(editForm.contact.email)) return "Valid Contact Email is required.";
      const contMobDigits = (editForm.contact.mobile || "").replace(/\D/g, "");
      if (!contMobDigits || contMobDigits.length < 7) return "Valid Contact Mobile is required.";
    }

    if (currentStepIndex === 3) {
      if (!editForm.hiring.hiringFor) return "Please specify who you are hiring for.";
      if ((editForm.hiring.hiringFor === "Add Manually" || editForm.hiring.hiringFor === "Other (Specify Manually)") && (!editForm.hiring.customHiringFor || !editForm.hiring.customHiringFor.trim())) return "Please specify who you are hiring for.";
      if (!editForm.hiring.volume) return "Please specify the hiring volume.";
      if ((editForm.hiring.volume === "Add Manually" || editForm.hiring.volume === "Other (Specify Manually)") && (!editForm.hiring.customVolume || !editForm.hiring.customVolume.trim())) return "Please specify your custom hiring requirement.";
      if (!editForm.hiring.frequency) return "Please specify the hiring frequency.";
    }

    if (currentStepIndex === 4) {
      if (editForm.billing.gst && !gstRegex.test(editForm.billing.gst)) return "Invalid GST Number format.";
      if (editForm.billing.pan && editForm.billing.pan.length !== 10) return "Invalid PAN format (must be 10 characters).";
    }

    if (currentStepIndex === 5) {
      if (!editForm.account.username || editForm.account.username.trim().length < 3) return "Username must be at least 3 characters long.";
    }

    if (currentStepIndex === 6) {
      const MANDATORY_KEYS = ["regCertificate", "panCard", "gstCertificate", "signatoryIdProof", "addressProof"];
      const missingKeys = [];
      const labels = {
        regCertificate: "Company Registration Certificate",
        panCard: "PAN Card",
        gstCertificate: "GST Certificate",
        signatoryIdProof: "Authorized Signatory ID Proof",
        addressProof: "Business Address Proof",
      };

      MANDATORY_KEYS.forEach((key) => {
        const hasNewFile = docs[key];
        const hasExistingFile = profile?.documents?.[key] && typeof profile.documents[key] === "string" && profile.documents[key].trim() !== "";
        if (!hasNewFile && !hasExistingFile) {
          missingKeys.push(labels[key]);
        }
      });

      if (missingKeys.length > 0) {
        return `Please upload all 5 mandatory verification documents to save profile changes: ${missingKeys.join(", ")}.`;
      }
      if (!Object.values(editForm.agreements).every(Boolean)) return "You must accept all terms and compliance checks to save changes.";
    }

    return true;
  };

  // Save updated profile after Admin approval with full multipart file support
  const handleSaveProfileChanges = async () => {
    const formData = new FormData();
    formData.append("fullname", editForm.contact.fullname || editForm.company.name);
    formData.append("email", editForm.company.email);
    formData.append("phoneNumber", editForm.company.mobile);
    formData.append("companyName", editForm.company.name);
    formData.append("gstNumber", editForm.billing.gst);

    const existingDocs = profile.documents || {};
    const updatedDocsMapping = {
      ...existingDocs,
      regCertificate: docs.regCertificate ? docs.regCertificate.name : (existingDocs.regCertificate || null),
      panCard: docs.panCard ? docs.panCard.name : (existingDocs.panCard || null),
      gstCertificate: docs.gstCertificate ? docs.gstCertificate.name : (existingDocs.gstCertificate || null),
      signatoryIdProof: docs.signatoryIdProof ? docs.signatoryIdProof.name : (existingDocs.signatoryIdProof || null),
      addressProof: docs.addressProof ? docs.addressProof.name : (existingDocs.addressProof || null),
      cinCertificate: docs.cinCertificate ? docs.cinCertificate.name : (existingDocs.cinCertificate || null),
      msmeCertificate: docs.msmeCertificate ? docs.msmeCertificate.name : (existingDocs.msmeCertificate || null),
      startupIndiaCert: docs.startupIndiaCert ? docs.startupIndiaCert.name : (existingDocs.startupIndiaCert || null),
      isoCertificate: docs.isoCertificate ? docs.isoCertificate.name : (existingDocs.isoCertificate || null),
      shopEstCert: docs.shopEstCert ? docs.shopEstCert.name : (existingDocs.shopEstCert || null),
      iecCode: docs.iecCode ? docs.iecCode.name : (existingDocs.iecCode || null),
      tradeLicence: docs.tradeLicence ? docs.tradeLicence.name : (existingDocs.tradeLicence || null),
      labourLicence: docs.labourLicence ? docs.labourLicence.name : (existingDocs.labourLicence || null),
    };

    const finalProfilePayload = {
      ...editForm,
      documents: updatedDocsMapping,
    };

    formData.append("profileData", JSON.stringify(finalProfilePayload));
    if (logo) formData.append("companyLogo", logo);

    Object.values(docs).forEach((file) => {
      if (file && typeof file !== "string") {
        formData.append("verificationDocs", file);
      }
    });

    try {
      setSavingProfile(true);

      // Persist typed inputs into global OptionPool
      await saveFieldMapToPool({
        companyName: editForm.company.name,
        industry: editForm.company.industry === "Add Manually" ? editForm.company.customIndustry : editForm.company.industry,
        services: editForm.company.servicesList,
        designation: editForm.contact.designation === "Add Manually" ? editForm.contact.customDesignation : editForm.contact.designation,
        country: editForm.address.country,
        state: editForm.address.state,
        city: editForm.address.city,
        pincode: editForm.address.pinCode,
        area: editForm.address.area,
        sector: editForm.address.sector,
        landmark: editForm.address.landmark,
        building: editForm.address.building,
        floorSuite: editForm.address.floor,
        category: editForm.contact.category,
        religion: editForm.contact.religion,
      });

      const res = await axios.post(
        `${USER_API_ENDPOINT}/recruiter/update-profile`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (res.data.success) {
        toast.success("Profile updated successfully!");
        setShowEditModal(false);
        if (res.data.user) {
          dispatch(setUser(res.data.user));
        }
        fetchEditStatus();
      } else {
        toast.error(res.data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save profile updates.");
    } finally {
      setSavingProfile(false);
    }
  };

  const getExistingDocLabel = (docKey, fallbackName) => {
    if (docs[docKey]) return [docs[docKey].name];
    if (profile?.documents?.[docKey]) return [profile.documents[docKey]];
    return fallbackName ? [fallbackName] : [];
  };

  // Steps definition for StepWizard inside Edit Modal
  const wizardSteps = [
    {
      title: "Company Info",
      subtitle: "Update your organization details",
      content: (
        <SectionCard title="Company Information" icon={Building2}>
          <Field label="Company Name" required>
            <AutoCompleteInput options={optionPool.companyName} value={editForm.company.name} onChange={(v) => setField("company", "name", v)} placeholder="Select or type Company Name" />
          </Field>
          <Field label="Company Logo">
            <FileDrop
              label="Upload new logo (JPG/PNG/SVG)"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0])}
              fileNames={logo ? [logo.name] : (profile.companyLogo ? ["Current Logo Uploaded ✓"] : [])}
            />
          </Field>
          <Field label="Company Website">
            <TextInput value={editForm.company.website} onChange={(e) => setField("company", "website", e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Company Email" required>
            <TextInput type="email" value={editForm.company.email} onChange={(e) => setField("company", "email", e.target.value)} />
          </Field>
          <Field label="Mobile Number" required>
            <InternationalPhoneInput
              value={editForm.company.mobile}
              onChange={(v) => {
                setField("company", "mobile", v);
                if (editForm.company.sameAsMobile) setField("company", "whatsapp", v);
              }}
            />
          </Field>
          <Field label="WhatsApp Number">
            <InternationalPhoneInput
              value={editForm.company.sameAsMobile ? editForm.company.mobile : editForm.company.whatsapp}
              disabled={editForm.company.sameAsMobile}
              onChange={(v) => setField("company", "whatsapp", v)}
            />
            <div className="mt-2">
              <CheckboxRow
                checked={editForm.company.sameAsMobile}
                label="Same as mobile"
                onChange={(v) => {
                  setField("company", "sameAsMobile", v);
                  if (v) setField("company", "whatsapp", editForm.company.mobile);
                }}
              />
            </div>
          </Field>
          <Field label="Company Type" required>
            <SelectInput options={COMPANY_TYPES} value={editForm.company.type} onChange={(e) => setField("company", "type", e.target.value)} />
          </Field>
          {(editForm.company.type === "Add Manually" || editForm.company.type === "Other") && (
            <Field label="Specify Custom Company Type" required className="col-span-full">
              <TextInput
                value={editForm.company.customType || ""}
                onChange={(e) => setField("company", "customType", e.target.value)}
                placeholder="e.g. Joint Venture, Trust, Co-operative"
              />
            </Field>
          )}

          <Field label="Industry" required>
            <AutoCompleteInput options={Array.from(new Set([...(optionPool.industry || []), ...INDUSTRIES]))} value={editForm.company.industry} onChange={(v) => setField("company", "industry", v)} placeholder="Select or type Industry" />
          </Field>
          {editForm.company.industry === "Service Industry" && (
            <Field label="Services Offered (Service Industry)" required className="col-span-full" hint="Type a service and click '+ Add Service' or press Enter">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <TextInput
                    value={editForm.company.newServiceInput || ""}
                    onChange={(e) => setField("company", "newServiceInput", e.target.value)}
                    placeholder="e.g. IT Consulting, Facility Management"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = (editForm.company.newServiceInput || "").trim();
                        if (val && !editForm.company.servicesList?.includes(val)) {
                          setField("company", "servicesList", [...(editForm.company.servicesList || []), val]);
                          setField("company", "newServiceInput", "");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = (editForm.company.newServiceInput || "").trim();
                      if (val && !editForm.company.servicesList?.includes(val)) {
                        setField("company", "servicesList", [...(editForm.company.servicesList || []), val]);
                        setField("company", "newServiceInput", "");
                      }
                    }}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shrink-0"
                  >
                    + Add Service
                  </button>
                </div>

                {editForm.company.servicesList && editForm.company.servicesList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {editForm.company.servicesList.map((srv, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                        {srv}
                        <button
                          type="button"
                          onClick={() => setField("company", "servicesList", editForm.company.servicesList.filter((_, i) => i !== idx))}
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

          {(editForm.company.industry === "Add Manually" || editForm.company.industry === "Other") && (
            <Field label="Specify Custom Industry" required className="col-span-full">
              <TextInput
                value={editForm.company.customIndustry || ""}
                onChange={(e) => setField("company", "customIndustry", e.target.value)}
                placeholder="e.g. Renewable Energy, Aerospace & Defense"
              />
            </Field>
          )}

          <Field label="Company Size" required>
            <PillGroup options={COMPANY_SIZES} value={editForm.company.size} onChange={(v) => setField("company", "size", v)} />
          </Field>
          {(editForm.company.size === "Add Manually" || editForm.company.size === "Other (Specify Manually)") && (
            <Field label="Specify Custom Company Size" required className="col-span-full">
              <TextInput
                value={editForm.company.customSize || ""}
                onChange={(e) => setField("company", "customSize", e.target.value)}
                placeholder="e.g. 5,000+ Global Workforce"
              />
            </Field>
          )}
          <Field label="Year Established">
            <SelectInput options={YEARS} value={editForm.company.yearEstablished} onChange={(e) => setField("company", "yearEstablished", e.target.value)} />
          </Field>
          <Field label="Company Description" required className="col-span-full">
            <TextArea value={editForm.company.description} onChange={(e) => setField("company", "description", e.target.value)} placeholder="Briefly describe your company..." />
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Company Address",
      subtitle: "Registered office & branches",
      content: (
        <>
          <SectionCard title="Registered Office Address" icon={MapPin} description="Powered by Google Maps — type the street address to auto-fill">
            <Field label="Country" required>
              <AutoCompleteInput options={optionPool.country} value={editForm.address.country} onChange={(v) => setField("address", "country", v)} placeholder="Select or type Country" />
            </Field>
            <Field label="State" required>
              <AutoCompleteInput options={optionPool.state} value={editForm.address.state} onChange={(v) => setField("address", "state", v)} placeholder="Select or type State" />
            </Field>
            <Field label="City" required>
              <AutoCompleteInput options={optionPool.city} value={editForm.address.city} onChange={(v) => setField("address", "city", v)} placeholder="Select or type City" />
            </Field>
            <Field label="Area">
              <AutoCompleteInput options={optionPool.area} value={editForm.address.area} onChange={(v) => setField("address", "area", v)} placeholder="Select or type Area" />
            </Field>
            <Field label="Sector">
              <AutoCompleteInput options={optionPool.sector} value={editForm.address.sector} onChange={(v) => setField("address", "sector", v)} placeholder="e.g. Sector 62" />
            </Field>
            <Field label="Building / Office Search" className="sm:col-span-2" hint="Start typing — city/state/pin auto-fill from Google Maps">
              <AddressAutocomplete
                value={editForm.address.building}
                onChange={(v) => setField("address", "building", v)}
                onPlaceSelect={(p) => setEditForm((prev) => ({
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
              <AutoCompleteInput options={optionPool.floorSuite} value={editForm.address.floor} onChange={(v) => setField("address", "floor", v)} placeholder="e.g. 4th Floor" />
            </Field>
            <Field label="PIN Code">
              <AutoCompleteInput options={optionPool.pincode} value={editForm.address.pinCode} onChange={(v) => setField("address", "pinCode", v)} placeholder="Select or type PIN Code" />
            </Field>
            <Field label="Landmark" className="sm:col-span-2">
              <AutoCompleteInput options={optionPool.landmark} value={editForm.address.landmark} onChange={(v) => setField("address", "landmark", v)} placeholder="e.g. Near Metro Station" />
            </Field>
            {editForm.address.googleMapsUrl && (
              <div className="col-span-full mt-1.5 p-3 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs text-blue-700">
                <span className="font-semibold">Google Maps URL Attached Successfully ✓</span>
                <a href={editForm.address.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-blue-800">Preview Location →</a>
              </div>
            )}
          </SectionCard>
          <SectionCard title="Branch Offices" icon={Building2} description="Add any additional branch locations">
            <Field label="Branches" className="col-span-full">
              <RepeatableList
                items={editForm.branches || []}
                addLabel="Add branch"
                onAdd={() => setEditForm((f) => ({ ...f, branches: [...(f.branches || []), { city: "", state: "", pinCode: "" }] }))}
                onRemove={(i) => setEditForm((f) => ({ ...f, branches: f.branches.filter((_, idx) => idx !== i) }))}
                renderItem={(item, i) => (
                  <>
                    <TextInput placeholder="City" value={item.city} onChange={(e) => setEditForm((f) => { const b = [...f.branches]; b[i] = { ...b[i], city: e.target.value }; return { ...f, branches: b }; })} />
                    <TextInput placeholder="State" value={item.state} onChange={(e) => setEditForm((f) => { const b = [...f.branches]; b[i] = { ...b[i], state: e.target.value }; return { ...f, branches: b }; })} />
                    <TextInput placeholder="PIN Code" maxLength={6} value={item.pinCode} onChange={(e) => setEditForm((f) => { const b = [...f.branches]; b[i] = { ...b[i], pinCode: e.target.value.replace(/\D/g, "") }; return { ...f, branches: b }; })} />
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
      subtitle: "Who should candidates & our team reach out to?",
      content: (
        <SectionCard title="Primary Contact Person" icon={UserRound}>
          <Field label="Full Name" required><TextInput maxLength={100} value={editForm.contact.fullname} onChange={(e) => setField("contact", "fullname", e.target.value)} /></Field>
          <Field label="Designation" required>
            <AutoCompleteInput options={optionPool.designation} value={editForm.contact.designation} onChange={(v) => setField("contact", "designation", v)} placeholder="Select or type Designation" />
          </Field>
          {(editForm.contact.designation === "Add Manually" || editForm.contact.designation === "Other") && (
            <Field label="Specify Custom Designation" required className="col-span-full">
              <TextInput
                value={editForm.contact.customDesignation || ""}
                onChange={(e) => setField("contact", "customDesignation", e.target.value)}
                placeholder="e.g. Chief People Officer, Head of Talent"
              />
            </Field>
          )}
          <Field label="Department"><TextInput maxLength={50} value={editForm.contact.department} onChange={(e) => setField("contact", "department", e.target.value)} /></Field>
          <Field label="Mobile Number" required>
            <InternationalPhoneInput value={editForm.contact.mobile} onChange={(v) => setField("contact", "mobile", v)} />
          </Field>
          <Field label="WhatsApp Number">
            <InternationalPhoneInput value={editForm.contact.whatsapp} onChange={(v) => setField("contact", "whatsapp", v)} />
          </Field>
          <Field label="Category">
            <AutoCompleteInput options={optionPool.category} value={editForm.contact.category} onChange={(v) => setField("contact", "category", v)} placeholder="Select or type Category (e.g. General, OBC, SC, ST, EWS)" />
          </Field>
          <Field label="Religion">
            <AutoCompleteInput options={optionPool.religion} value={editForm.contact.religion} onChange={(v) => setField("contact", "religion", v)} placeholder="Select or type Religion (e.g. Hindu, Muslim, Christian, Sikh)" />
          </Field>
        </SectionCard>
      ),
    },
    {
      title: "Hiring Info",
      subtitle: "Update your hiring preferences",
      content: (
        <SectionCard title="Hiring Information" icon={Briefcase}>
          <Field label="Are you hiring for?"><PillGroup options={HIRING_FOR} value={editForm.hiring.hiringFor} onChange={(v) => setField("hiring", "hiringFor", v)} /></Field>
          {(editForm.hiring.hiringFor === "Add Manually" || editForm.hiring.hiringFor === "Other (Specify Manually)") && (
            <Field label="Specify Custom Hiring Purpose" required className="col-span-full">
              <TextInput
                value={editForm.hiring.customHiringFor || ""}
                onChange={(e) => setField("hiring", "customHiringFor", e.target.value)}
                placeholder="e.g. Contractual Staffing for Third-Party Vendors"
              />
            </Field>
          )}

          <Field label="Average Hiring Requirement"><SelectInput options={HIRING_VOLUME} value={editForm.hiring.volume} onChange={(e) => setField("hiring", "volume", e.target.value)} /></Field>
          {(editForm.hiring.volume === "Add Manually" || editForm.hiring.volume === "Other (Specify Manually)") && (
            <Field label="Specify Custom Hiring Requirement" required className="col-span-full">
              <TextInput
                value={editForm.hiring.customVolume || ""}
                onChange={(e) => setField("hiring", "customVolume", e.target.value)}
                placeholder="e.g. 200+ Bulk Hiring per Quarter"
              />
            </Field>
          )}

          <Field label="Hiring Frequency"><SelectInput options={HIRING_FREQ} value={editForm.hiring.frequency} onChange={(e) => setField("hiring", "frequency", e.target.value)} /></Field>
          <Field label="Preferred Hiring Locations (Worldwide Allowed)"><TextInput value={editForm.hiring.locations} onChange={(e) => setField("hiring", "locations", e.target.value)} placeholder="e.g. Delhi NCR, Remote, Noida, London" /></Field>
        </SectionCard>
      ),
    },
    {
      title: "Billing Info",
      subtitle: "Business credentials & invoice details",
      content: (
        <SectionCard title="Billing Information" icon={Receipt}>
          <Field label="GST Number (Optional)"><TextInput maxLength={15} value={editForm.billing.gst} onChange={(e) => setField("billing", "gst", e.target.value)} /></Field>
          <Field label="PAN Number (Optional)"><TextInput maxLength={10} value={editForm.billing.pan} onChange={(e) => setField("billing", "pan", e.target.value)} /></Field>
          <Field label="CIN Number (For Companies)"><TextInput maxLength={21} value={editForm.billing.cin} onChange={(e) => setField("billing", "cin", e.target.value)} placeholder="e.g. U72200DL2021PTC384950" /></Field>
          <Field label="MSME Registration Number (Optional)"><TextInput value={editForm.billing.msme} onChange={(e) => setField("billing", "msme", e.target.value)} placeholder="e.g. UDYAM-XX-00-1234567" /></Field>
          <Field label="Billing Address" className="col-span-full"><TextArea value={editForm.billing.billingAddress} onChange={(e) => setField("billing", "billingAddress", e.target.value)} /></Field>
        </SectionCard>
      ),
    },
    {
      title: "Account Credentials",
      subtitle: "Credentials & plan options",
      content: (
        <>
          <SectionCard title="Account Credentials" icon={KeyRound}>
            <Field label="Username / Handle" required>
              <TextInput value={editForm.account.username} onChange={(e) => setField("account", "username", e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))} placeholder="e.g. google_recruitment" />
            </Field>
          </SectionCard>

          <SectionCard title="Subscription Plan & Payment" icon={CreditCard}>
            <Field label="Subscription Plan" className="col-span-full"><PillGroup options={PLANS} value={editForm.subscription.plan} onChange={(v) => setField("subscription", "plan", v)} /></Field>
            <Field label="Payment Method"><SelectInput options={PAYMENT_METHODS} value={editForm.subscription.paymentMethod} onChange={(e) => setField("subscription", "paymentMethod", e.target.value)} /></Field>
          </SectionCard>
        </>
      ),
    },
    {
      title: "Documents & Compliance",
      subtitle: "Upload verification files and sign agreements",
      content: (
        <>
          <SectionCard title="Mandatory Uploads (Checklist)" icon={FileText} description="Verification certificates for security & candidate compliance checks">
            <Field label="Company Registration Certificate" required>
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, regCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("regCertificate")} />
            </Field>
            <Field label="PAN Card (Company/Firm)" required>
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, panCard: e.target.files?.[0] }))} fileNames={getExistingDocLabel("panCard")} />
            </Field>
            <Field label="GST Certificate" required>
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, gstCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("gstCertificate")} />
            </Field>
            <Field label="Authorized Signatory ID Proof" required hint="Aadhaar Card, Passport, or Driving License">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, signatoryIdProof: e.target.files?.[0] }))} fileNames={getExistingDocLabel("signatoryIdProof")} />
            </Field>
            <Field label="Business Address Proof" required hint="Electricity Bill, Rent Agreement, Utility Bill">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, addressProof: e.target.files?.[0] }))} fileNames={getExistingDocLabel("addressProof")} />
            </Field>
          </SectionCard>

          <SectionCard title="Optional Business Certificates" icon={FileText} description="Add extra certificates for faster trust verification and a Verified Employer badge.">
            <Field label="CIN Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, cinCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("cinCertificate")} />
            </Field>
            <Field label="MSME Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, msmeCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("msmeCertificate")} />
            </Field>
            <Field label="Startup India Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, startupIndiaCert: e.target.files?.[0] }))} fileNames={getExistingDocLabel("startupIndiaCert")} />
            </Field>
            <Field label="ISO Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, isoCertificate: e.target.files?.[0] }))} fileNames={getExistingDocLabel("isoCertificate")} />
            </Field>
            <Field label="Shop & Establishment Certificate">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, shopEstCert: e.target.files?.[0] }))} fileNames={getExistingDocLabel("shopEstCert")} />
            </Field>
            <Field label="Import Export Code (IEC)">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, iecCode: e.target.files?.[0] }))} fileNames={getExistingDocLabel("iecCode")} />
            </Field>
            <Field label="Trade Licence">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, tradeLicence: e.target.files?.[0] }))} fileNames={getExistingDocLabel("tradeLicence")} />
            </Field>
            <Field label="Labour Licence">
              <FileDrop label="Upload PDF/Image" accept=".pdf,image/*" onChange={(e) => setDocs((d) => ({ ...d, labourLicence: e.target.files?.[0] }))} fileNames={getExistingDocLabel("labourLicence")} />
            </Field>
          </SectionCard>

          <SectionCard title="Terms & Compliance" icon={ShieldCheck}>
            <div className="col-span-full flex flex-col gap-3">
              <CheckboxRow checked={editForm.agreements.accuracy} label="I confirm that all information provided is accurate." onChange={(v) => setField("agreements", "accuracy", v)} />
              <CheckboxRow checked={editForm.agreements.authorized} label="I am authorized to represent this organization." onChange={(v) => setField("agreements", "authorized", v)} />
              <CheckboxRow checked={editForm.agreements.terms} label="I agree to the Terms & Conditions." onChange={(v) => setField("agreements", "terms", v)} />
              <CheckboxRow checked={editForm.agreements.privacy} label="I agree to the Privacy Policy." onChange={(v) => setField("agreements", "privacy", v)} />
              <CheckboxRow checked={editForm.agreements.antiDiscrimination} label="I agree not to post fake, misleading, or discriminatory job advertisements." onChange={(v) => setField("agreements", "antiDiscrimination", v)} />
              <CheckboxRow checked={editForm.agreements.antiViolation} label="I understand that my account may be suspended for policy violations." onChange={(v) => setField("agreements", "antiViolation", v)} />
            </div>
          </SectionCard>
        </>
      ),
    },
  ];

  if (!user || user.role !== "Recruiter") {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20 text-slate-500">
          Profile data not available.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        
        {/* Request Status Banner */}
        {editStatusInfo.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-amber-900 text-base">Current Request Status: PENDING</h4>
                  <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">Under Admin Review</span>
                </div>
                <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                  Your request to edit profile has been submitted to Admin. Profile editing will be unlocked once approved.
                </p>
                {editStatusInfo.reason && (
                  <p className="mt-2 text-xs font-semibold text-amber-900 bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
                    <span className="font-bold">Reason Submitted:</span> "{editStatusInfo.reason}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {editStatusInfo.status === "rejected" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/90 p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-rose-900 text-base">Current Request Status: REJECTED</h4>
                    <span className="rounded-full bg-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-800">Action Required</span>
                  </div>
                  <button
                    onClick={handleAcknowledgeDone}
                    className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-black text-white hover:bg-rose-700 shadow-md transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Done
                  </button>
                </div>
                <p className="mt-1 text-xs text-rose-800">
                  Your profile edit request was rejected by Admin. Please see the rejection reason below and send your request again with updated details.
                </p>
                {editStatusInfo.remarks && (
                  <div className="mt-3 text-xs bg-white/90 p-3 rounded-xl border border-rose-200 text-rose-900 font-semibold shadow-xs">
                    <span className="font-bold text-rose-700 block mb-0.5">💬 Admin Rejection Reason:</span>
                    "{editStatusInfo.remarks}"
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {editStatusInfo.status === "approved" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-900 text-base">Current Request Status: APPROVED</h4>
                  <p className="text-xs text-emerald-800">
                    Your request is approved! Click the button to edit your profile information.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-black text-white hover:opacity-90 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
              >
                <Edit className="h-4 w-4" /> Click here to edit your profile
              </button>
            </div>
          </motion.div>
        )}

        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 mb-8 border border-slate-100"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-slate-50 bg-slate-100 shadow-sm">
                <img
                  src={getFileUrl(profile.companyLogo) || "/default-avatar.svg"}
                  alt="Company Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    user.verificationStatus === "approved" 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {user.verificationStatus === "approved" ? "Verified" : "Verification Pending"}
                  </span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    {subscription?.plan || "Free Plan"}
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900">{company?.name || user.extraDetails?.companyName || "No Company Name"}</h1>
                <div className="mt-1 flex items-center gap-2 text-slate-500 text-sm flex-wrap">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Mail className="h-4 w-4 text-blue-600" /> {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmailInput("");
                      setEmailOtpSent(false);
                      setEmailOtpCode("");
                      setShowEmailModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                  >
                    <Edit className="h-3 w-3" /> Update Email
                  </button>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Phone className="h-4 w-4 text-slate-400" /> {user.phoneNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Profile Edit Notice Banner */}
            {(() => {
              const lastAdminEdit = profile?.lastAdminEdit;
              const showAdminEditNotice = Boolean(lastAdminEdit?.editedAt && lastAdminEdit?.editedByUserSinceAdmin === false);
              if (!showAdminEditNotice) return null;
              return (
                <div className="mb-3 rounded-2xl bg-indigo-50 border border-indigo-200 p-3.5 text-xs text-indigo-900 flex items-start gap-2 shadow-xs max-w-md">
                  <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block uppercase tracking-wide text-[10px] text-indigo-700">Admin Profile Update Notice</span>
                    <span className="font-medium text-slate-700">
                      This profile was last updated by Admin <strong>({lastAdminEdit.editedByName || "Admin"})</strong> on{" "}
                      <strong className="text-indigo-900">{new Date(lastAdminEdit.editedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</strong>.
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Edit Profile Button */}
            <div className="self-start sm:self-center">
              {(() => {
                const isDisabled = editStatusInfo.status === "pending" || editStatusInfo.status === "approved" || editStatusInfo.status === "rejected";
                return (
                  <button
                    disabled={isDisabled}
                    onClick={handleEditProfileClick}
                    className={`group relative inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black transition-all duration-200 ${
                      isDisabled
                        ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-cyan-700 hover:shadow-blue-500/40 active:scale-95"
                    }`}
                  >
                    <Edit className="h-4 w-4 transition-transform group-hover:rotate-12" />
                    <span>
                      {editStatusInfo.status === "approved"
                        ? "Edit Profile (Approved)"
                        : editStatusInfo.status === "pending"
                        ? "Edit Profile (Pending)"
                        : editStatusInfo.status === "rejected"
                        ? "Edit Profile (Rejected)"
                        : "Edit Profile"}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
            {company?.description || "No description provided."}
          </p>
        </motion.div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionTitle icon={Building2} title="Company Overview" />
            <div className="space-y-1">
              <DetailRow label="Website" value={company?.website ? <a href={company.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{company.website}</a> : "N/A"} />
              <DetailRow
                label="Industry"
                value={
                  company?.industry === "Service Industry"
                    ? `Service Industry ${company?.servicesList?.length ? `(${company.servicesList.join(", ")})` : ""}`
                    : company?.industry === "Other" && company?.customIndustry
                    ? `Other: ${company.customIndustry}`
                    : company?.industry
                }
              />
              <DetailRow
                label="Company Type"
                value={
                  company?.type === "Other" && company?.customType
                    ? `Other: ${company.customType}`
                    : company?.type
                }
              />
              <DetailRow
                label="Company Size"
                value={
                  company?.size === "Other (Specify Manually)" && company?.customSize
                    ? `Custom: ${company.customSize}`
                    : company?.size
                }
              />
              <DetailRow label="Year Established" value={company?.yearEstablished} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionTitle icon={UserRound} title="Primary Contact" />
            <div className="space-y-1">
              <DetailRow label="Contact Person" value={contact?.fullname || user.fullname} />
              <DetailRow
                label="Designation"
                value={
                  contact?.designation === "Other" && contact?.customDesignation
                    ? `Other: ${contact.customDesignation}`
                    : contact?.designation
                }
              />
              <DetailRow label="Department" value={contact?.department} />
              <DetailRow label="Official Email" value={contact?.email} />
              <DetailRow label="Mobile & WhatsApp" value={`${contact?.mobile || "N/A"} ${contact?.whatsapp ? ` / ${contact.whatsapp} (WA)` : ""}`} />
              <DetailRow label="Category" value={contact?.category} />
              <DetailRow label="Religion" value={contact?.religion} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionTitle icon={MapPin} title="Registered Address" />
            <div className="space-y-1">
              <DetailRow label="City & State" value={`${address?.city || "N/A"}, ${address?.state || "N/A"}`} />
              <DetailRow label="Country" value={address?.country} />
              <DetailRow label="Area / Sector" value={address?.area} />
              <DetailRow label="Building / Landmark" value={`${address?.building || ""} ${address?.landmark ? `(${address.landmark})` : ""}`} />
              <DetailRow label="PIN Code" value={address?.pinCode} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionTitle icon={Briefcase} title="Hiring Profile" />
            <div className="space-y-1">
              <DetailRow
                label="Hiring For"
                value={
                  hiring?.hiringFor === "Other (Specify Manually)" && hiring?.customHiringFor
                    ? `Custom: ${hiring.customHiringFor}`
                    : hiring?.hiringFor
                }
              />
              <DetailRow
                label="Hiring Volume"
                value={
                  hiring?.volume === "Other (Specify Manually)" && hiring?.customVolume
                    ? `Custom: ${hiring.customVolume}`
                    : hiring?.volume
                }
              />
              <DetailRow label="Hiring Frequency" value={hiring?.frequency} />
              <DetailRow label="Preferred Locations" value={hiring?.locations} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <SectionTitle icon={Receipt} title="Billing & Compliance" />
            <div className="space-y-1">
              <DetailRow label="GST Number" value={billing?.gst || user.extraDetails?.gstNumber} />
              <DetailRow label="PAN Number" value={billing?.pan || user.pancard} />
              <DetailRow label="CIN Number" value={billing?.cin} />
              <DetailRow label="MSME Registration" value={billing?.msme} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm col-span-full">
            <SectionTitle icon={FileText} title="Documents & Terms" />
            <div className="space-y-4">
              {(() => {
                const ALL_DOC_CONFIG = [
                  { key: "regCertificate", label: "Company Registration Certificate", isMandatory: true },
                  { key: "panCard", label: "PAN Card (Company/Firm)", isMandatory: true },
                  { key: "gstCertificate", label: "GST Certificate", isMandatory: true },
                  { key: "signatoryIdProof", label: "Authorized Signatory ID Proof", isMandatory: true },
                  { key: "addressProof", label: "Business Address Proof", isMandatory: true },
                  { key: "cinCertificate", label: "CIN Certificate", isMandatory: false },
                  { key: "msmeCertificate", label: "MSME Certificate", isMandatory: false },
                  { key: "startupIndiaCert", label: "Startup India Certificate", isMandatory: false },
                  { key: "isoCertificate", label: "ISO Certificate", isMandatory: false },
                  { key: "shopEstCert", label: "Shop & Establishment Certificate", isMandatory: false },
                  { key: "iecCode", label: "Import Export Code (IEC)", isMandatory: false },
                  { key: "tradeLicence", label: "Trade Licence", isMandatory: false },
                  { key: "labourLicence", label: "Labour Licence", isMandatory: false },
                ];

                const docMap = profile?.documents || user?.documents || {};
                const uploadedDocsList = ALL_DOC_CONFIG.map((d) => ({
                  ...d,
                  fileUrl: docMap[d.key] && typeof docMap[d.key] === "string" && docMap[d.key].trim() !== "" ? docMap[d.key] : null,
                }));
                const uploadedCount = uploadedDocsList.filter((d) => Boolean(d.fileUrl)).length;
                const mandatoryMissingCount = uploadedDocsList.filter((d) => d.isMandatory && !d.fileUrl).length;
                const mandatoryUploadedCount = uploadedDocsList.filter((d) => d.isMandatory && Boolean(d.fileUrl)).length;

                return (
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3 pb-2 border-b border-slate-100">
                      <div>
                        <span className="font-black text-slate-900 text-sm block">Uploaded Verification Documents</span>
                        <span className="text-xs text-slate-500 font-medium">{uploadedCount} of 13 Documents Submitted</span>
                      </div>
                      {mandatoryMissingCount === 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mandatory Submission Complete (5/5 Uploaded)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          <AlertTriangle className="h-3.5 w-3.5" /> Mandatory Document Submission Pending ({mandatoryUploadedCount}/5 Uploaded)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs pt-1">
                      {uploadedDocsList.map((docItem) => (
                        <div
                          key={docItem.key}
                          className={`flex items-center justify-between p-3 rounded-2xl border ${
                            docItem.fileUrl
                              ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                              : docItem.isMandatory
                              ? "bg-amber-50/50 border-amber-200 text-amber-900 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <span className="block truncate font-bold">{docItem.label}</span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {docItem.isMandatory ? "Mandatory Document" : "Optional Certificate"}
                            </span>
                          </div>
                          {docItem.fileUrl ? (
                            <a
                              href={getFileUrl(docItem.fileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-xs transition-colors"
                            >
                              <Eye className="h-3 w-3" /> View
                            </a>
                          ) : (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                              Pending
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <DetailRow label="Compliance Agreements" value={
                <div className="flex flex-col gap-1 mt-1 text-slate-500 font-medium">
                  {agreements?.accuracy && <span>✓ Information Accuracy Confirmed</span>}
                  {agreements?.authorized && <span>✓ Authorized Representative</span>}
                  {agreements?.terms && <span>✓ Terms Accepted</span>}
                </div>
              } />
            </div>
          </motion.div>

        </div>
      </div>

      {/* ================= MODAL 1: REQUEST PROFILE EDIT ================= */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 my-8"
            >
              <button
                onClick={() => setShowRequestModal(false)}
                aria-label="Close"
                className="no-shift btn-close absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5 hover:rotate-90 transition-transform duration-200" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Request Profile Edit</h3>
                  <p className="text-xs text-slate-500">Submit reason for profile update to Admin for approval</p>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 mb-5">
                <p className="text-xs text-amber-800 leading-relaxed font-medium flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Direct modification of employer profile is restricted for security and compliance. Please specify the reason below. Once Admin approves your request, profile editing will be unlocked.
                  </span>
                </p>
              </div>

              <form onSubmit={handleSubmitEditRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Reason for Requesting Profile Changes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Explain why you need to update company details, contact person, or registration information..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="rounded-xl px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2.5 text-xs font-black text-white hover:opacity-90 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {submittingRequest ? "Submitting..." : "Submit Request to Admin"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: EDIT EMPLOYER PROFILE FULL 7-STEP WIZARD ================= */}
      <AnimatePresence>
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-4 sm:p-8 shadow-2xl border border-slate-100 my-4"
            >
              <button
                onClick={() => setShowEditModal(false)}
                aria-label="Close"
                className="no-shift btn-close absolute top-5 right-5 z-20 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5 hover:rotate-90 transition-transform duration-200" />
              </button>

              <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shrink-0">
                  <Edit className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Edit Employer Profile</h3>
                  <p className="text-xs text-slate-500">Update your company, contact, address, hiring, and compliance details</p>
                </div>
              </div>

              <div className="py-2">
                <StepWizard
                  steps={wizardSteps}
                  onSubmit={handleSaveProfileChanges}
                  submitting={savingProfile}
                  submitLabel="Save Profile Changes"
                  validateStep={validateStep}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Change Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 relative"
            >
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 font-bold shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Update Login Email</h3>
                  <p className="text-xs text-slate-500">OTP verification is required for email changes</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Current Login Email</label>
                  <input
                    type="text"
                    disabled
                    value={user?.email || ""}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">New Email Address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      disabled={emailOtpSent}
                      placeholder="Enter new email address"
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none disabled:bg-slate-50"
                    />
                    {!emailOtpSent ? (
                      <button
                        type="button"
                        disabled={sendingEmailOtp || !newEmailInput.trim()}
                        onClick={() => handleSendEmailChangeOtp()}
                        className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {sendingEmailOtp ? "Sending..." : "Send OTP"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOtpSent(false);
                          setEmailOtpCode("");
                        }}
                        className="shrink-0 rounded-xl bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors"
                      >
                        Change
                      </button>
                    )}
                  </div>
                </div>

                {emailOtpSent && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
                      A 6-digit OTP code has been sent to <strong>{newEmailInput}</strong>. Please check your inbox.
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Enter 6-Digit Verification OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={emailOtpCode}
                        onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full tracking-widest text-center text-lg font-black rounded-xl border border-slate-300 px-3.5 py-2 text-slate-900 focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={verifyingEmailOtp || emailOtpCode.length !== 6}
                      onClick={handleVerifyEmailChangeOtp}
                      className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {verifyingEmailOtp ? "Verifying & Updating..." : "Verify OTP & Update Email"}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RecruiterProfile;
