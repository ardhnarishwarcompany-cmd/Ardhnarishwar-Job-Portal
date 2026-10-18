import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminUserEditModal from "./AdminUserEditModal";
import { getFileUrl, ADMIN_API_ENDPOINT } from "@/utils/data";
import {
  ArrowLeft, Shield, Briefcase, Users, Mail, Phone, MapPin, Calendar, FileText,
  Download, CheckCircle2, XCircle, Clock, Ban, Link2, Loader2, IdCard, Building2, UserCheck, UserX, Edit,
} from "lucide-react";

const roleColors = {
  Admin: "bg-rose-100 text-rose-700",
  Recruiter: "bg-emerald-100 text-emerald-700",
  Employee: "bg-blue-100 text-blue-700",
};
const roleIcons = { Admin: Shield, Recruiter: Briefcase, Employee: Users };

const humanizeKey = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const isUrl = (value) => typeof value === "string" && /^(https?:\/\/|www\.)/i.test(value.trim());

const Chip = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
    {children}
  </span>
);

// Renders any JSON value into a sensible UI fragment — keeps the page robust
// even if the candidate/recruiter profile shape changes over time.
const ValueDisplay = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">—</span>;
  }
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Yes</span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400"><XCircle className="h-3.5 w-3.5" /> No</span>
    );
  }
  if (isUrl(value)) {
    const href = value.startsWith("http") ? value : `https://${value}`;
    return (
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline break-all">
        <Link2 className="h-3 w-3 flex-shrink-0" /> {value}
      </a>
    );
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">—</span>;
    if (value.every((v) => typeof v !== "object")) {
      return (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v, i) => <Chip key={i}>{String(v)}</Chip>)}
        </div>
      );
    }
    // array of objects (e.g. skills, languages, branches, certifications)
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {Object.entries(item).map(([k, v]) => (
                <div key={k} className="text-xs">
                  <span className="font-semibold text-slate-500">{humanizeKey(k)}: </span>
                  <span className="text-slate-700"><ValueDisplay value={v} /></span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "object") {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="font-semibold text-slate-500">{humanizeKey(k)}: </span>
            <span className="text-slate-700"><ValueDisplay value={v} /></span>
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-sm text-slate-800">{String(value)}</span>;
};

const ProfileSection = ({ title, data, icon: Icon }) => {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) return null;
  const entries = Object.entries(data).filter(([k]) => !["emailOtp", "emailOtpSent"].includes(k));
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
        {Icon && <Icon className="h-4 w-4 text-blue-600" />} {title}
      </h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{humanizeKey(key)}</p>
            <div className="mt-0.5">
              <ValueDisplay value={value} />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const InfoStat = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-sm font-bold text-slate-800">{value || "—"}</p>
    </div>
  </div>
);

const DocumentInspector = ({ user }) => {
  if (!user) return null;

  if (user.role === "Recruiter") {
    const recProf = typeof user.recruiterProfile === "string"
      ? JSON.parse(user.recruiterProfile || "{}")
      : (user.recruiterProfile || {});

    const docsMap = recProf.documents || {};
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

    const docsList = ALL_DOC_CONFIG.map((d) => ({
      ...d,
      fileUrl: docsMap[d.key] && typeof docsMap[d.key] === "string" && docsMap[d.key].trim() !== "" ? docsMap[d.key] : null,
    }));

    const uploadedCount = docsList.filter((d) => Boolean(d.fileUrl)).length;
    const mandatoryMissing = ALL_DOC_CONFIG.filter((d) => d.isMandatory && !docsMap[d.key]).length;

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm col-span-full mt-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Employer Document Verification & Compliance Center
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{uploadedCount} of 13 Verification Documents Uploaded</p>
          </div>
          {mandatoryMissing === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" /> All 5 Mandatory Documents Submitted ✓
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              <Clock className="h-4 w-4" /> {5 - mandatoryMissing}/5 Mandatory Documents Submitted (Pending: {mandatoryMissing})
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {docsList.map((doc) => (
            <div
              key={doc.key}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                doc.fileUrl
                  ? "bg-emerald-50/40 border-emerald-200"
                  : doc.isMandatory
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    doc.isMandatory ? "bg-amber-200/70 text-amber-900" : "bg-slate-200 text-slate-700"
                  }`}>
                    {doc.isMandatory ? "Mandatory" : "Optional"}
                  </span>
                  {doc.fileUrl ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> Pending
                    </span>
                  )}
                </div>
                <p className="text-xs font-black text-slate-800 line-clamp-2 mt-1">{doc.label}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100/60">
                {doc.fileUrl ? (
                  <a
                    href={getFileUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <FileText className="h-3.5 w-3.5" /> Preview / Download Document
                  </a>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 italic block text-center">
                    Document not submitted yet
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (user.role === "Employee") {
    const candProf = typeof user.candidateProfile === "string"
      ? JSON.parse(user.candidateProfile || "{}")
      : (user.candidateProfile || {});

    const docs = candProf.documents || {};
    const empType = candProf.personal?.employmentType || candProf.experience?.employmentType || (user.experience ? "Experienced" : "Fresher");
    const isExperienced = empType === "Experienced";

    const standardDocSpecs = [
      { key: "resume", label: "Resume / CV", url: user.resume || candProf.resume || user.profile?.resume, originalName: candProf.resumeOriginalName, isMandatory: true, tag: "Primary" },
      { key: "profilePhoto", label: "Profile Photo", url: user.profilePhoto || user.profile?.profilePhoto || candProf.profilePhoto || candProf.personal?.photo, tag: "Identity" },
      { key: "aadhaarCard", label: "Aadhaar Card", url: docs.aadhaarCard || candProf.aadhaarCard, tag: "ID Proof" },
      { key: "panCard", label: "PAN Card", url: docs.panCard || candProf.panCard, tag: "Tax ID" },
      { key: "passport", label: "Passport", url: docs.passport || candProf.passport, tag: "Optional" },
      { key: "drivingLicenseDoc", label: "Driving License", url: docs.drivingLicenseDoc || candProf.drivingLicenseDoc, tag: "Optional" },
      { key: "educationalCertificates", label: "Educational Certificates", url: docs.educationalCertificates || candProf.educationalCertificates, tag: "Education" },
      { key: "offerLetter", label: "Offer Letter", url: docs.offerLetter || candProf.offerLetter, tag: "Optional" },
      { key: "passportSizePhoto", label: "Passport Size Photo", url: docs.passportSizePhoto || candProf.passportSizePhoto, tag: "Profile Photo" },
      { key: "experienceLetter", label: "Experience Letter", url: docs.experienceLetter || candProf.experienceLetter, isMandatory: isExperienced, tag: isExperienced ? "Mandatory (Exp)" : "Optional" },
      { key: "relievingLetter", label: "Relieving Letter", url: docs.relievingLetter || candProf.relievingLetter, isMandatory: isExperienced, tag: isExperienced ? "Mandatory (Exp)" : "Optional" },
      { key: "salarySlip", label: "Salary Slip", url: docs.salarySlip || candProf.salarySlip, isMandatory: isExperienced, tag: isExperienced ? "Mandatory (Exp)" : "Optional" },
      { key: "accountStatement3M", label: "Bank Statement (3 Months)", url: docs.accountStatement3M || candProf.accountStatement3M, isMandatory: isExperienced, tag: isExperienced ? "Mandatory (Exp)" : "Optional" },
      { key: "accountStatement6M", label: "Bank Statement (6 Months)", url: docs.accountStatement6M || candProf.accountStatement6M, isMandatory: isExperienced, tag: isExperienced ? "Mandatory (Exp)" : "Optional" },
      { key: "accountStatement1Y", label: "Bank Statement (1 Year)", url: docs.accountStatement1Y || candProf.accountStatement1Y, isMandatory: isExperienced, tag: isExperienced ? "Mandatory (Exp)" : "Optional" },
      { key: "videoIntro", label: "Video Introduction", url: candProf.videoIntro, tag: "Optional" },
    ];

    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm col-span-full mt-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Candidate Uploaded Documents & Verification
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Candidate status: <span className="font-bold text-slate-800">{empType}</span> • Verify submitted identity and employment documents
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {standardDocSpecs.filter(d => Boolean(d.url)).length} / {standardDocSpecs.length} Uploaded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {standardDocSpecs.map((doc) => (
            <div
              key={doc.key}
              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                doc.url
                  ? "bg-emerald-50/40 border-emerald-200"
                  : doc.isMandatory
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    doc.isMandatory ? "bg-amber-200/70 text-amber-900" : "bg-slate-200 text-slate-700"
                  }`}>
                    {doc.tag || (doc.isMandatory ? "Mandatory" : "Optional")}
                  </span>
                  {doc.url ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Submitted
                    </span>
                  ) : (
                    <span className={`text-xs font-bold flex items-center gap-1 ${doc.isMandatory ? "text-amber-700" : "text-slate-400"}`}>
                      <Clock className="h-3.5 w-3.5" /> {doc.isMandatory ? "Required" : "Not Provided"}
                    </span>
                  )}
                </div>
                <p className="text-xs font-black text-slate-800 line-clamp-2 mt-1">{doc.label}</p>
                {doc.originalName && <p className="text-[11px] text-slate-500 truncate mt-0.5">{doc.originalName}</p>}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100/60">
                {doc.url ? (
                  <a
                    href={getFileUrl(doc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <FileText className="h-3.5 w-3.5" /> Preview / Download File
                  </a>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 italic block text-center">
                    Document not submitted yet
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return null;
};

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchUser = () => {
    setLoading(true);
    axios
      .get(`${ADMIN_API_ENDPOINT}/users/${id}`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) setUser(res.data.user);
        else setError(res.data.message || "User not found");
      })
      .catch((err) => setError(err?.response?.data?.message || "Could not load this user"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const toggleBlock = async () => {
    if (!user) return;
    const action = user.isBlocked ? "unblock" : "block";
    if (action === "block") {
      const confirmed = window.confirm(
        `Block ${user.fullname}? They will be signed out immediately and won't be able to log in until you unblock them.`
      );
      if (!confirmed) return;
    }
    setBlockBusy(true);
    try {
      const res = await axios.put(`${ADMIN_API_ENDPOINT}/${action}/${user._id}`, {}, { withCredentials: true });
      if (res.data.success) {
        setUser((prev) => ({ ...prev, isBlocked: action === "block" }));
        toast.success(res.data.message, {
          description: action === "block"
            ? "This user has been notified and can no longer sign in."
            : "This user has been notified and can sign in again.",
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || `Could not ${action} this user.`);
    } finally {
      setBlockBusy(false);
    }
  };

  const RoleIcon = user ? roleIcons[user.role] || Users : Users;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/10">
      <AdminSidebar />
      <div className="flex-1 md:ml-64">
        <AdminHeader />
        <div className="p-4 sm:p-6">
          <button
            onClick={() => navigate("/admin/users")}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Manage Users
          </button>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="mb-3 h-8 w-8 animate-spin" />
              <p className="text-sm font-semibold">Loading profile...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400">
              <Ban className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-lg font-bold text-slate-600">{error}</p>
              <Link to="/admin/users" className="mt-3 text-sm font-bold text-blue-600 hover:underline">
                Return to Manage Users
              </Link>
            </div>
          )}

          {!loading && !error && user && (() => {
            const recProf = user.role === "Recruiter"
              ? (typeof user.recruiterProfile === "string" ? JSON.parse(user.recruiterProfile || "{}") : (user.recruiterProfile || {}))
              : null;
            const displayPhoto = user.profilePhoto || recProf?.companyLogo || recProf?.profilePhoto;
            const displayName = user.fullname || recProf?.contact?.fullname || recProf?.company?.name || "User";

            return (
            <div className="space-y-5">
              {/* Header card */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {displayPhoto ? (
                      <img src={getFileUrl(displayPhoto)} alt={displayName} className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover shadow-md sm:h-20 sm:w-20" />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-2xl font-black text-white shadow-md sm:h-20 sm:w-20">
                        {(displayName || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h1 className="truncate text-xl font-black text-slate-900 sm:text-2xl">{displayName}</h1>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${roleColors[user.role] || "bg-slate-100 text-slate-600"}`}>
                          <RoleIcon className="h-3 w-3" /> {user.role === "Employee" ? "Candidate" : user.role}
                        </span>
                        {user.isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                            <Ban className="h-3 w-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </span>
                        )}
                        {user.role === "Recruiter" && user.verificationStatus && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            user.verificationStatus === "approved" ? "bg-emerald-100 text-emerald-600"
                              : user.verificationStatus === "rejected" ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            <Clock className="h-3 w-3" /> {user.verificationStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(user.resume) && (
                      <a
                        href={getFileUrl(user.resume)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-blue-200 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" /> Download Resume
                      </a>
                    )}
                    {user.role !== "Admin" && (
                      <>
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-emerald-200 active:scale-95 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit Profile (Admin)
                        </button>
                        <button
                          onClick={toggleBlock}
                          disabled={blockBusy}
                          className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition-all disabled:opacity-60 ${
                            user.isBlocked
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:shadow-rose-200"
                          }`}
                        >
                          {blockBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : user.isBlocked ? (
                            <><UserCheck className="h-3.5 w-3.5" /> Unblock User</>
                          ) : (
                            <><UserX className="h-3.5 w-3.5" /> Block User</>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Quick stats */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoStat icon={Mail} label="Email" value={user.email} />
                <InfoStat icon={Phone} label="Phone" value={user.phoneNumber} />
                <InfoStat icon={MapPin} label="City" value={user.city} />
                <InfoStat icon={Calendar} label="Joined" value={user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"} />
              </div>

              {(user.bio || user.skills || user.experience || user.education) && user.role === "Employee" && !user.candidateProfile && (
                <ProfileSection
                  title="Basic Profile"
                  icon={Users}
                  data={{ bio: user.bio, skills: user.skills, experience: user.experience, education: user.education }}
                />
              )}

              {/* Document Inspector for Candidates and Recruiters */}
              <DocumentInspector user={user} />

              {user.role === "Admin" && (
                <ProfileSection title="Admin Details" icon={Shield} data={{ adminCode: user.adminCode }} />
              )}

              {user.role === "Employee" && (
                (() => {
                  const candProf = typeof user.candidateProfile === "string"
                    ? JSON.parse(user.candidateProfile || "{}")
                    : (user.candidateProfile || {});

                  const personalData = {
                    fullname: user.fullname,
                    employmentType: candProf.personal?.employmentType || candProf.experience?.employmentType || (user.experience ? "Experienced" : "Fresher"),
                    gender: candProf.personal?.gender,
                    dateOfBirth: candProf.personal?.dob || candProf.personal?.dateOfBirth || user.dateOfBirth || user.extraDetails?.dateOfBirth,
                    age: candProf.personal?.age,
                    nationality: candProf.personal?.nationality || "Indian",
                    religion: candProf.personal?.religion || user.religion || "—",
                    category: candProf.personal?.category || user.category || "—",
                    maritalStatus: candProf.personal?.maritalStatus,
                    physicallyChallenged: candProf.personal?.physicallyChallenged,
                    panNumber: candProf.personal?.pan || user.pancard,
                    aadharNumber: candProf.personal?.aadhar || user.adharcard,
                    buildingOrHouseNumber: candProf.personal?.building || candProf.personal?.houseNumber,
                    street: candProf.personal?.street,
                    sectorOrArea: candProf.personal?.sector || candProf.personal?.area,
                    landmark: candProf.personal?.landmark,
                    city: candProf.personal?.city || user.city,
                    state: candProf.personal?.state,
                    country: candProf.personal?.country || "India",
                    pinCode: candProf.personal?.pinCode || candProf.personal?.zipCode,
                    completeAddress: candProf.personal?.address || candProf.personal?.houseAddress || [candProf.personal?.building || candProf.personal?.houseNumber, candProf.personal?.street, candProf.personal?.sector || candProf.personal?.area, candProf.personal?.city || user.city, candProf.personal?.state, candProf.personal?.country, candProf.personal?.pinCode || candProf.personal?.zipCode].filter(Boolean).join(", ") || user.city || user.profile?.city,
                    bio: candProf.personal?.bio || user.bio || user.profile?.bio,
                  };

                  const contactData = {
                    mobile: candProf.contact?.mobile || user.phoneNumber,
                    email: candProf.contact?.email || user.email,
                    whatsapp: candProf.contact?.whatsapp,
                    emergencyContact: candProf.contact?.emergencyContact,
                  };

                  const careerData = {
                    targetRoles: Array.isArray(candProf.career?.titles) && candProf.career.titles.length > 0 ? candProf.career.titles.join(", ") : candProf.career?.title || user.profile?.role,
                    industry: candProf.career?.industry,
                    department: candProf.career?.department,
                    employmentType: candProf.career?.employmentType,
                    workMode: candProf.career?.workMode || candProf.workPrefs?.workMode,
                    jobType: candProf.career?.jobType,
                    preferredLocations: Array.isArray(candProf.career?.locations) ? candProf.career.locations.join(", ") : (Array.isArray(candProf.career?.preferredLocations) ? candProf.career.preferredLocations.join(", ") : candProf.career?.locations),
                    noticePeriod: candProf.career?.noticePeriod || candProf.experience?.noticePeriod,
                  };

                  const salaryData = {
                    expectedSalary: candProf.career?.expectedCtc || candProf.career?.salary?.expected || candProf.career?.salary || candProf.salary?.expected || user.expectedSalary,
                    salaryMode: candProf.career?.salary?.mode || candProf.salary?.mode || "LPA",
                    currentSalary: candProf.experience?.currentSalary || candProf.career?.currentCtc,
                    currency: candProf.career?.salary?.currency || "INR (₹)",
                  };

                  const experienceData = {
                    employmentType: candProf.personal?.employmentType || candProf.experience?.employmentType || "Fresher",
                    totalExperience: (candProf.experience?.years || candProf.experience?.months)
                      ? `${candProf.experience.years || 0} Yrs ${candProf.experience.months || 0} Mths`
                      : (candProf.experience?.total || user.experience || user.profile?.experience || "Fresher"),
                    currentCompany: candProf.experience?.currentCompany || candProf.experience?.company || candProf.experience?.currentEmployer,
                    designation: candProf.experience?.designation,
                    currentSalary: candProf.experience?.currentSalary,
                    noticePeriod: candProf.experience?.noticePeriod || candProf.career?.noticePeriod,
                    reasonForChange: candProf.experience?.reasonForChange,
                    responsibilities: candProf.experience?.responsibilities,
                  };

                  const educationData = {
                    qualification: candProf.education?.qualification || candProf.education?.degree || user.education || user.profile?.education,
                    college: candProf.education?.college || candProf.education?.university,
                    passingYear: candProf.education?.passingYear,
                    percentage: candProf.education?.percentage,
                  };

                  const skillsData = {
                    skills: candProf.skills?.length > 0 ? candProf.skills : (user.skills || user.profile?.skills),
                  };

                  return (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mt-4">
                      <ProfileSection title="Personal Info" icon={IdCard} data={personalData} />
                      <ProfileSection title="Contact Details" icon={Phone} data={contactData} />
                      <ProfileSection title="Career Preference" icon={Briefcase} data={careerData} />
                      <ProfileSection title="Salary Expectation" icon={FileText} data={salaryData} />
                      <ProfileSection title="Experience" icon={Briefcase} data={experienceData} />
                      <ProfileSection title="Education" icon={FileText} data={educationData} />
                      <ProfileSection title="Skills" icon={CheckCircle2} data={skillsData} />
                      <ProfileSection title="Certifications" icon={FileText} data={candProf.certifications?.length > 0 ? { certifications: candProf.certifications } : null} />
                      <ProfileSection title="Portfolio Links" icon={Link2} data={candProf.portfolioLinks} />
                      <ProfileSection title="Work Preferences" icon={Clock} data={candProf.workPrefs} />
                      <ProfileSection title="Platform Preferences" icon={Shield} data={candProf.platform} />
                    </div>
                  );
                })()
              )}

              {user.role === "Recruiter" && user.recruiterProfile && (
                (() => {
                  const recProf = typeof user.recruiterProfile === "string"
                    ? JSON.parse(user.recruiterProfile || "{}")
                    : (user.recruiterProfile || {});
                  return (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mt-4">
                      <ProfileSection title="Company Info" icon={Building2} data={recProf.company} />
                      <ProfileSection title="Address" icon={MapPin} data={recProf.address} />
                      <ProfileSection title="Branches" icon={Building2} data={{ branches: recProf.branches }} />
                      <ProfileSection title="Contact Person" icon={Users} data={recProf.contact} />
                      <ProfileSection title="Hiring Preferences" icon={Briefcase} data={recProf.hiring} />
                      <ProfileSection title="Billing / Compliance" icon={FileText} data={recProf.billing} />
                      <ProfileSection title="Subscription" icon={CheckCircle2} data={recProf.subscription} />
                      <ProfileSection title="Agreements" icon={Shield} data={recProf.agreements} />
                    </div>
                  );
                })()
              )}
            </div>
            );
          })()}
        </div>
      </div>

      {showEditModal && user && (
        <AdminUserEditModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => fetchUser()}
        />
      )}
    </div>
  );
};

export default UserDetail;
