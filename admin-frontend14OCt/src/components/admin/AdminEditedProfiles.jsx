import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { ADMIN_API_ENDPOINT, getFileUrl } from "@/utils/data";
import {
  History as HistoryIcon, Search, Eye, Filter, Calendar, User, Briefcase, Building2,
  FileText, ShieldCheck, Download, Clock, CheckCircle2, XCircle, X, RefreshCw, Mail, Phone,
  MapPin, Link2, IdCard, Check
} from "lucide-react";

const humanizeKey = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const isUrl = (value) => typeof value === "string" && /^(https?:\/\/|www\.)/i.test(value.trim());

const Chip = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-blue-700">
    {children}
  </span>
);

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
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-2 sm:p-2.5">
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
  return <span className="text-xs sm:text-sm text-slate-800 break-words">{String(value)}</span>;
};

const ProfileSection = ({ title, data, icon: Icon }) => {
  if (!data || typeof data !== "object" || Object.keys(data).length === 0) return null;
  const entries = Object.entries(data).filter(([k]) => !["emailOtp", "emailOtpSent"].includes(k));
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm"
    >
      <h3 className="mb-3 sm:mb-4 flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wide text-slate-700">
        {Icon && <Icon className="h-4 w-4 text-blue-600" />} {title}
      </h3>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:gap-y-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-slate-400">{humanizeKey(key)}</p>
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
  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs">
    <Icon className="h-4 w-4 flex-shrink-0 text-slate-400" />
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="truncate text-xs font-bold text-slate-800">{value || "—"}</p>
    </div>
  </div>
);

const SnapshotRecruiterDocs = ({ docsMap }) => {
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
    fileUrl: docsMap && docsMap[d.key] && typeof docsMap[d.key] === "string" && docsMap[d.key].trim() !== "" ? docsMap[d.key] : null,
  }));

  const uploadedCount = docsList.filter((d) => Boolean(d.fileUrl)).length;
  const mandatoryMissing = ALL_DOC_CONFIG.filter((d) => d.isMandatory && (!docsMap || !docsMap[d.key])).length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm col-span-full mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" /> Employer Compliance Documents Snapshot
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">{uploadedCount} of 13 Verification Documents Saved in Snapshot</p>
        </div>
        {mandatoryMissing === 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" /> All 5 Mandatory Documents Submitted ✓
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            <Clock className="h-3.5 w-3.5" /> {5 - mandatoryMissing}/5 Mandatory Documents Submitted
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {docsList.map((doc) => (
          <div
            key={doc.key}
            className={`p-3 rounded-xl border flex flex-col justify-between ${
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
                  <Eye className="h-3.5 w-3.5" /> Preview Document
                </a>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 italic block text-center">
                  Not uploaded
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SnapshotCandidateDocs = ({ profile, targetUser }) => {
  const candDocs = [
    { key: "resume", label: "Resume / CV", url: profile?.resume || targetUser?.resume, originalName: profile?.resumeOriginalName },
    { key: "profilePhoto", label: "Profile Photo", url: profile?.profilePhoto || targetUser?.profilePhoto },
    { key: "videoIntro", label: "Video Introduction", url: profile?.videoIntro },
  ];

  if (Array.isArray(profile?.certificationFiles)) {
    profile.certificationFiles.forEach((certUrl, idx) => {
      candDocs.push({ key: `cert_${idx}`, label: `Certification Document #${idx + 1}`, url: certUrl });
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm col-span-full mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2.5 mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" /> Candidate Documents & Attachments Snapshot
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">Verify candidate files saved in this edit snapshot</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {candDocs.map((doc) => (
          <div key={doc.key} className={`p-3 rounded-xl border flex flex-col justify-between ${doc.url ? "bg-emerald-50/40 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">Candidate File</span>
                {doc.url ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Submitted</span>
                ) : (
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Pending</span>
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
                  <Eye className="h-3.5 w-3.5" /> Preview File
                </a>
              ) : (
                <span className="text-[11px] font-medium text-slate-400 italic block text-center">Not uploaded</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminEditedProfiles = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'Recruiter' | 'Employee'
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${ADMIN_API_ENDPOINT}/profile-edits-history`, { withCredentials: true });
      if (res.data.success) {
        setHistory(res.data.history || []);
      } else {
        toast.error(res.data.message || "Could not load edit history.");
      }
    } catch (err) {
      toast.error("Failed to load profile edit history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesRole = roleFilter === "all" || item.target_role === roleFilter;
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        item.target_user_name?.toLowerCase().includes(term) ||
        item.target_user_email?.toLowerCase().includes(term) ||
        item.admin_name?.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [history, roleFilter, search]);

  const parsedSnapshot = useMemo(() => {
    if (!selectedItem || !selectedItem.profileSnapshot) return null;
    if (typeof selectedItem.profileSnapshot === "string") {
      try {
        return JSON.parse(selectedItem.profileSnapshot);
      } catch (e) {
        return {};
      }
    }
    return selectedItem.profileSnapshot;
  }, [selectedItem]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-cyan-50/10">
      <AdminSidebar />
      <div className="flex-1 md:ml-64">
        <AdminHeader />
        <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 sm:gap-2.5">
                <HistoryIcon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 shrink-0" /> Admin Profile Edits Audit History
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Complete log of Employer and Candidate profiles edited directly by Admin with date, time, and full snapshot details
              </p>
            </div>
            <button
              onClick={fetchHistory}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Audit Log
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar w-full sm:w-auto shrink-0">
              {[
                { id: "all", label: "All Edits" },
                { id: "Recruiter", label: "Employers" },
                { id: "Employee", label: "Candidates" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`flex-1 sm:flex-none whitespace-nowrap px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-lg transition-all ${
                    roleFilter === tab.id
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name, email, or admin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Responsive Audit Logs View */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            {loading ? (
              <div className="p-10 sm:p-12 text-center text-slate-400 font-semibold text-xs sm:text-sm">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-40" />
                Loading Admin profile edit logs...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-10 sm:p-12 text-center text-slate-400">
                <HistoryIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-base font-bold text-slate-600">No profile edits recorded yet</p>
                <p className="text-xs text-slate-400 mt-1">Admin edits performed via User Details page will be logged here</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View (sm and up) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3.5 px-4">Target User</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Edited By (Admin)</th>
                        <th className="py-3.5 px-4">Date & Time</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{item.target_user_name}</span>
                            <span className="text-slate-400 text-[11px]">{item.target_user_email}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                item.target_role === "Recruiter"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.target_role === "Recruiter" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                              {item.target_role === "Recruiter" ? "Employer" : "Candidate"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700">
                            {item.admin_name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {new Date(item.created_at || item.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Edit Snapshot
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card List View (< sm) */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {filteredHistory.map((item) => (
                    <div key={item.id} className="p-4 space-y-2.5 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-black text-slate-900 text-sm">{item.target_user_name}</h3>
                          <p className="text-xs text-slate-400 break-all">{item.target_user_email}</p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            item.target_role === "Recruiter"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {item.target_role === "Recruiter" ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          {item.target_role === "Recruiter" ? "Employer" : "Candidate"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-50">
                        <span className="font-semibold text-slate-700">By: {item.admin_name}</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(item.created_at || item.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedItem(item)}
                        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Edit Snapshot
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SNAPSHOT INSPECTION MODAL */}
      <AnimatePresence>
        {selectedItem && parsedSnapshot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl bg-slate-50 p-3.5 sm:p-8 shadow-2xl border border-slate-200 my-auto"
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 border-b border-slate-200 pb-4 sm:pb-5 bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-xs pr-10">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold shadow-md">
                  <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Admin Profile Edit Snapshot
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Saved by Admin <strong>{selectedItem.admin_name}</strong> on {new Date(selectedItem.created_at || selectedItem.createdAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
                  </p>
                </div>
              </div>

              {(() => {
                const targetUser = parsedSnapshot.targetUser || {
                  fullname: selectedItem.target_user_name,
                  email: selectedItem.target_user_email,
                  role: selectedItem.target_role,
                };
                const profile = parsedSnapshot.profile || {};
                const isRecruiter = (targetUser.role || selectedItem.target_role) === "Recruiter";

                return (
                  <div className="space-y-4 sm:space-y-5">
                    {/* User Header Summary Card */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {profile.profilePhoto || profile.companyLogo ? (
                            <img
                              src={getFileUrl(profile.profilePhoto || profile.companyLogo)}
                              alt={targetUser.fullname}
                              className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover shadow-xs border border-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg sm:text-xl font-black text-white shadow-xs shrink-0">
                              {(targetUser.fullname || "U")[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">{targetUser.fullname}</h2>
                            <p className="text-xs font-semibold text-slate-500 truncate">{targetUser.email}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-bold ${
                                  isRecruiter ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {isRecruiter ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                                {isRecruiter ? "Employer Profile" : "Candidate Profile"}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] sm:text-xs font-bold text-slate-700">
                                <Clock className="h-3 w-3 text-slate-400" /> Snapshot Logged
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Resume Download Button if candidate */}
                        {!isRecruiter && (profile.resume || targetUser.resume) && (
                          <a
                            href={getFileUrl(profile.resume || targetUser.resume)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all shrink-0 w-full sm:w-auto"
                          >
                            <Download className="h-3.5 w-3.5" /> Download Snapshot Resume
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoStat icon={Mail} label="Email" value={targetUser.email} />
                      <InfoStat icon={Phone} label="Phone Number" value={targetUser.phoneNumber} />
                      <InfoStat icon={User} label="Target Role" value={isRecruiter ? "Employer / Recruiter" : "Candidate / Employee"} />
                      <InfoStat icon={Calendar} label="Edited Date" value={new Date(selectedItem.created_at || selectedItem.createdAt).toLocaleDateString()} />
                    </div>

                    {/* Employer Form Sections */}
                    {isRecruiter && (
                      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
                        <ProfileSection title="Company Info" icon={Building2} data={profile.company} />
                        <ProfileSection title="Address" icon={MapPin} data={profile.address} />
                        <ProfileSection title="Branches" icon={Building2} data={{ branches: profile.branches }} />
                        <ProfileSection title="Contact Person" icon={User} data={profile.contact} />
                        <ProfileSection title="Hiring Preferences" icon={Briefcase} data={profile.hiring} />
                        <ProfileSection title="Billing & Compliance" icon={FileText} data={profile.billing} />
                        <ProfileSection title="Subscription" icon={CheckCircle2} data={profile.subscription} />
                        <ProfileSection title="Agreements" icon={ShieldCheck} data={profile.agreements} />
                      </div>
                    )}

                    {/* Candidate Form Sections */}
                    {!isRecruiter && (
                      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
                        <ProfileSection title="Personal Info" icon={IdCard} data={profile.personal} />
                        <ProfileSection title="Contact Details" icon={Phone} data={profile.contact} />
                        <ProfileSection title="Career Preference" icon={Briefcase} data={profile.career} />
                        <ProfileSection title="Salary Expectation" icon={FileText} data={profile.salary} />
                        <ProfileSection title="Experience" icon={Briefcase} data={profile.experience} />
                        <ProfileSection title="Education" icon={FileText} data={profile.education} />
                        <ProfileSection title="Skills" icon={CheckCircle2} data={{ skills: profile.skills }} />
                        <ProfileSection title="Certifications" icon={FileText} data={{ certifications: profile.certifications }} />
                        <ProfileSection title="Portfolio Links" icon={Link2} data={profile.portfolioLinks} />
                        <ProfileSection title="Work Preferences" icon={Clock} data={profile.workPrefs} />
                        <ProfileSection title="Platform Preferences" icon={ShieldCheck} data={profile.platform} />
                      </div>
                    )}

                    {/* Documents & Compliance Inspector */}
                    {isRecruiter ? (
                      <SnapshotRecruiterDocs docsMap={profile.documents} />
                    ) : (
                      <SnapshotCandidateDocs profile={profile} targetUser={targetUser} />
                    )}
                  </div>
                );
              })()}

              <div className="mt-5 sm:mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-full sm:w-auto rounded-xl bg-slate-200 px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-300 transition-colors"
                >
                  Close Snapshot
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminEditedProfiles;
