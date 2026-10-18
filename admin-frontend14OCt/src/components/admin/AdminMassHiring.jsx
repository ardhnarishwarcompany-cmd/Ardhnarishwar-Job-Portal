import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Search, RefreshCw, CheckCircle2, AlertCircle, Building2, User, Mail, Phone, 
  MapPin, IndianRupee, DollarSign, Euro, PoundSterling, JapaneseYen, Banknote, Coins,
  Users, Award, ShieldCheck, X, ChevronRight, Filter, ExternalLink,
  Briefcase, GraduationCap, ArrowRight, Eye, Check, Clock,
  Lock, Unlock, RotateCcw, Trash2, AlertTriangle
} from "lucide-react";
import AdminLayout from "./AdminLayout";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const renderCurrencyIcon = (salaryStr) => {
  if (!salaryStr) return <Banknote className="h-3.5 w-3.5 shrink-0" />;
  const str = String(salaryStr).trim();
  const upper = str.toUpperCase();

  if (upper.includes("INR") || str.includes("₹")) {
    return <IndianRupee className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
  }
  if (upper.includes("EUR") || str.includes("€")) {
    return <Euro className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
  }
  if (upper.includes("GBP") || str.includes("£")) {
    return <PoundSterling className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
  }
  if (upper.includes("JPY") || upper.includes("CNY") || str.includes("¥")) {
    return <JapaneseYen className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
  }
  if (upper.includes("USD") || upper.includes("CAD") || upper.includes("AUD") || upper.includes("NZD") || upper.includes("SGD") || upper.includes("HKD") || str.includes("$")) {
    return <DollarSign className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
  }
  if (upper.includes("AED") || str.includes("د.إ")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">د.إ</span>;
  }
  if (upper.includes("SAR") || str.includes("﷼")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">﷼</span>;
  }
  if (upper.includes("QAR")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">QR</span>;
  }
  if (upper.includes("KWD")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">KD</span>;
  }
  if (upper.includes("OMR")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">RO</span>;
  }
  if (upper.includes("BHD")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">BD</span>;
  }
  if (upper.includes("CHF")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">CHF</span>;
  }
  if (upper.includes("ZAR") || str.includes("R$") || upper.includes("BRL")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">R</span>;
  }
  if (upper.includes("TRY") || str.includes("₺")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">₺</span>;
  }
  if (upper.includes("RUB") || str.includes("₽")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">₽</span>;
  }
  if (upper.includes("KRW") || str.includes("₩")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">₩</span>;
  }
  if (upper.includes("PHP") || str.includes("₱")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">₱</span>;
  }
  if (upper.includes("THB") || str.includes("฿")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">฿</span>;
  }
  if (upper.includes("VND") || str.includes("₫")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">₫</span>;
  }
  if (upper.includes("NGN") || str.includes("₦")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">₦</span>;
  }
  if (upper.includes("BDT") || str.includes("৳")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">৳</span>;
  }
  if (upper.includes("ILS") || str.includes("₪")) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">₪</span>;
  }

  const firstWord = str.split(/\s+/)[0];
  if (firstWord && firstWord.length <= 4 && /^[A-Za-z]+$/.test(firstWord)) {
    return <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">{firstWord}</span>;
  }

  return <Banknote className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />;
};

export default function AdminMassHiring() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all", "open", "closed", "deleted"
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchMassHiringJobs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/api/admin/mass-hiring`, { withCredentials: true });
      if (res.data.success) {
        const list = res.data.massHiringJobs || [];
        setJobs(list);
        if (selectedJob) {
          const updated = list.find(j => j.id === selectedJob.id);
          if (updated) setSelectedJob(updated);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load mass hiring jobs.");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMassHiringJobs(true);
  }, []);

  const handleUpdateJobStatus = async (jobId, newStatus) => {
    setUpdatingStatus(true);
    setError("");
    // Optimistic local update
    const isDel = newStatus === 'deleted' ? 1 : 0;
    setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status: newStatus, is_deleted: isDel } : j));
    setSelectedJob(prev => prev && prev.id === jobId ? { ...prev, status: newStatus, is_deleted: isDel } : prev);

    try {
      const res = await axios.patch(
        `${API}/api/admin/mass-hiring/${jobId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      if (res.data.success) {
        setSuccess(`Mass hiring requisition status updated to ${newStatus}`);
        setTimeout(() => setSuccess(""), 4000);
        fetchMassHiringJobs(false);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status.");
      fetchMassHiringJobs(false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCloseJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to CLOSE this mass hiring requisition? It will be marked closed for candidates and applications will be closed.")) return;
    await handleUpdateJobStatus(jobId, "closed");
  };

  const handleReopenJob = async (jobId) => {
    await handleUpdateJobStatus(jobId, "submitted");
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to REMOVE / DELETE this mass hiring job? It will be removed from candidate view and the worker support ecosystem, but the employer will still see it with a 'Removed by Admin' notice.")) return;
    setUpdatingStatus(true);
    setError("");
    try {
      const res = await axios.delete(`${API}/api/admin/mass-hiring/${jobId}`, { withCredentials: true });
      if (res.data.success) {
        setSuccess("Mass hiring requisition removed from candidate portal & ecosystem.");
        setTimeout(() => setSuccess(""), 4000);
        fetchMassHiringJobs(false);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove requisition.");
      fetchMassHiringJobs(false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRestoreJob = async (jobId) => {
    setUpdatingStatus(true);
    setError("");
    try {
      const res = await axios.patch(`${API}/api/admin/mass-hiring/${jobId}/restore`, {}, { withCredentials: true });
      if (res.data.success) {
        setSuccess("Mass hiring requisition restored to open status!");
        setTimeout(() => setSuccess(""), 4000);
        fetchMassHiringJobs(false);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to restore requisition.");
      fetchMassHiringJobs(false);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Tab counts
  const counts = useMemo(() => {
    const all = jobs.length;
    const open = jobs.filter(j => (j.is_deleted === 0 || !j.is_deleted) && j.status !== 'closed' && j.status !== 'deleted').length;
    const closed = jobs.filter(j => (j.is_deleted === 0 || !j.is_deleted) && j.status === 'closed').length;
    const deleted = jobs.filter(j => j.is_deleted === 1 || j.status === 'deleted').length;
    return { all, open, closed, deleted };
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const isDeleted = j.is_deleted === 1 || j.status === 'deleted';
      const isClosed = (j.is_deleted === 0 || !j.is_deleted) && j.status === 'closed';
      const isOpen = (j.is_deleted === 0 || !j.is_deleted) && j.status !== 'closed' && j.status !== 'deleted';

      // Tab filter
      if (activeTab === "open" && !isOpen) return false;
      if (activeTab === "closed" && !isClosed) return false;
      if (activeTab === "deleted" && !isDeleted) return false;

      // Dropdown status filter
      if (statusFilter !== "All" && j.status !== statusFilter) return false;

      // Search filter
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (j.role || "").toLowerCase().includes(q) ||
        (j.country || "").toLowerCase().includes(q) ||
        (j.companyName || "").toLowerCase().includes(q) ||
        (j.recruiterName || "").toLowerCase().includes(q) ||
        (j.category || "").toLowerCase().includes(q) ||
        (j.notes || "").toLowerCase().includes(q)
      );
    });
  }, [jobs, activeTab, statusFilter, search]);

  const getStatusBadge = (job) => {
    const isDeleted = job.is_deleted === 1 || job.status === "deleted";
    const isClosed = !isDeleted && job.status === "closed";

    if (isDeleted) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-300 dark:bg-rose-950/50 dark:text-rose-400">
          <Trash2 className="h-3 w-3 shrink-0" /> Removed by Admin
        </span>
      );
    }
    if (isClosed) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300">
          <Lock className="h-3 w-3 shrink-0" /> Closed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9.5px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Open ({job.status})
      </span>
    );
  };

  return (
    <AdminLayout 
      title="Mass Hiring Requisitions" 
      description="Manage open, closed, and removed mass hiring requisitions across candidate ecosystem and employer workforce." 
      icon={Truck}
    >
      <div className="space-y-6">
        {/* Top Status Filter Tabs (Open, Closed, Deleted/Removed) */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition cursor-pointer ${
              activeTab === "all"
                ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Truck className="h-4 w-4" /> All Requisitions ({counts.all})
          </button>

          <button
            onClick={() => setActiveTab("open")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition cursor-pointer ${
              activeTab === "open"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            Open Jobs ({counts.open})
          </button>

          <button
            onClick={() => setActiveTab("closed")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition cursor-pointer ${
              activeTab === "closed"
                ? "bg-slate-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Lock className="h-3.5 w-3.5" /> Closed Jobs ({counts.closed})
          </button>

          <button
            onClick={() => setActiveTab("deleted")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition cursor-pointer ${
              activeTab === "deleted"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-rose-50 hover:text-rose-700 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Deleted / Removed ({counts.deleted})
          </button>
        </div>

        {/* Controls Bar: Search + Specific Status + Refresh */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search mass hiring jobs, recruiters, countries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white transition"
              />
            </div>
            
            <div className="w-44">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 cursor-pointer"
              >
                <option value="All">All Lifecycle Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="screening">Screening</option>
                <option value="verification">Verification</option>
                <option value="interview">Interview</option>
                <option value="selection">Selection</option>
                <option value="deployment">Deployment</option>
                <option value="closed">Closed</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => fetchMassHiringJobs(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" /> Refresh List
          </button>
        </div>

        {error && <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/40">{error}</div>}
        {success && <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/40">{success}</div>}

        {/* Mass Hiring Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-500 animate-pulse">Loading Mass Hiring database records...</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job, idx) => {
              const isDeleted = job.is_deleted === 1 || job.status === "deleted";
              const isClosed = !isDeleted && job.status === "closed";

              return (
                <motion.div
                  key={`admin-mass-job-${job.id || idx}-${idx}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                    isDeleted
                      ? "border-rose-200 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/10"
                      : isClosed
                      ? "border-slate-300 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-900/70"
                      : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[10px] font-black text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300">
                        👥 {job.workers} Workers Requested
                      </span>
                      {getStatusBadge(job)}
                    </div>

                    <h3 className="text-lg font-black text-slate-950 dark:text-white leading-snug">{job.role}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" /> {job.country || "Global Target"}
                      {job.category && <span>· {job.category}</span>}
                    </p>

                    {job.salary && (
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
                        {renderCurrencyIcon(job.salary)}
                        <span>Salary Package: {job.salary}</span>
                      </p>
                    )}

                    {/* Recruiter Summary */}
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                      <p className="text-[10px] font-black uppercase text-slate-400">Employer / Recruiter Profile</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white mt-0.5">{job.companyName || job.recruiterName || "Direct Employer"}</p>
                      <p className="text-[11px] text-slate-500">{job.recruiterEmail || "Contact not provided"}</p>
                    </div>

                    {isDeleted && (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Removed from candidate portal & ecosystem. Visible to employer as removed.</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar on Card */}
                  <div className="mt-5 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-3">
                      <span>Applied Workers: <b>{job.applicantCount || 0}</b></span>
                      <span>ID: #{job.id}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestoreJob(job.id)}
                            disabled={updatingStatus}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-xs"
                            title="Restore this requisition to Open status"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore Job
                          </button>
                        ) : isClosed ? (
                          <>
                            <button
                              onClick={() => handleReopenJob(job.id)}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-xs"
                              title="Re-open this requisition for applications"
                            >
                              <Unlock className="h-3 w-3" /> Re-Open
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition cursor-pointer dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 shadow-xs"
                              title="Delete/remove from candidate portal"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleCloseJob(job.id)}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold hover:bg-amber-100 transition cursor-pointer dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 shadow-xs"
                              title="Close requisition so candidates cannot apply"
                            >
                              <Lock className="h-3 w-3" /> Close Job
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition cursor-pointer dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 shadow-xs"
                              title="Delete/remove from candidate portal"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedJob(job)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-black text-white shadow-md hover:shadow-lg transition cursor-pointer ml-auto"
                      >
                        <Eye className="h-3.5 w-3.5" /> Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredJobs.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 font-bold bg-white dark:bg-slate-900 rounded-2xl border">
                No mass hiring requisitions match your current search/filter.
              </div>
            )}
          </div>
        )}

        {/* Detailed Inspection Modal */}
        <AnimatePresence>
          {selectedJob && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedJob(null)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 custom-scrollbar"
              >
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="rounded-full bg-blue-600 text-white text-[9px] font-black px-2.5 py-0.5">MASS HIRING JOB REQUISITION</span>
                      {getStatusBadge(selectedJob)}
                    </div>
                    <h2 className="text-2xl font-black text-slate-950 dark:text-white">{selectedJob.role}</h2>
                    <p className="text-xs text-slate-500 mt-1">Target Country: <b>{selectedJob.country || "Global"}</b> · Headcount Requested: <b>{selectedJob.workers} Workers</b></p>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Admin Quick Action Controls inside Modal */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">Admin Control Actions</p>
                    <p className="text-[11px] text-slate-500">Toggle live status or remove from candidate portal & ecosystem</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedJob.is_deleted === 1 || selectedJob.status === "deleted" ? (
                      <button
                        onClick={() => handleRestoreJob(selectedJob.id)}
                        disabled={updatingStatus}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <RotateCcw className="h-4 w-4" /> Restore to Candidate Ecosystem
                      </button>
                    ) : (
                      <>
                        {selectedJob.status === "closed" ? (
                          <button
                            onClick={() => handleReopenJob(selectedJob.id)}
                            disabled={updatingStatus}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <Unlock className="h-4 w-4" /> Re-Open Requisition
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCloseJob(selectedJob.id)}
                            disabled={updatingStatus}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-black shadow-md hover:bg-amber-700 transition cursor-pointer"
                          >
                            <Lock className="h-4 w-4" /> Close Requisition
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteJob(selectedJob.id)}
                          disabled={updatingStatus}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-black shadow-md hover:bg-rose-700 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" /> Delete / Remove Job
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Grid layout for Recruiter Profile vs Job Notes */}
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                  {/* Recruiter / Employer Profile Card */}
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-5 dark:border-blue-900/40 dark:bg-blue-950/30">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4" /> Recruiter / Employer Profile
                    </h3>

                    <div className="space-y-2 text-xs">
                      <p className="font-black text-sm text-slate-950 dark:text-white">{selectedJob.companyName || "Direct Client Requisition"}</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-blue-500" /> Recruiter Name: <b>{selectedJob.recruiterName || "Employer"}</b>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-blue-500" /> {selectedJob.recruiterEmail || "Email not available"}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-blue-500" /> {selectedJob.recruiterPhone || "Phone not available"}
                      </p>
                    </div>
                  </div>

                  {/* Job Requisition Details & Admin Status Change */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/50 min-w-0 overflow-hidden">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2 mb-3">
                      <Briefcase className="h-4 w-4 text-blue-500" /> Job Requisition Details
                    </h3>

                    <div className="space-y-2 text-xs min-w-0 max-w-full overflow-hidden">
                      {selectedJob.salary && (
                        <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <span>Salary Package:</span>
                          <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
                            {renderCurrencyIcon(selectedJob.salary)}
                            <b>{selectedJob.salary}</b>
                          </span>
                        </p>
                      )}
                      {selectedJob.category && <p className="font-bold text-slate-800 dark:text-slate-200">Category: <b>{selectedJob.category}</b></p>}
                      {selectedJob.notes && (
                        <p className="text-slate-600 dark:text-slate-400 italic bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 break-words break-all [overflow-wrap:anywhere] whitespace-pre-wrap min-w-0 max-w-full overflow-hidden">
                          "{selectedJob.notes}"
                        </p>
                      )}

                      <div className="pt-3">
                        <span className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Requisition Lifecycle Stage</span>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedJob.status}
                            onChange={(e) => handleUpdateJobStatus(selectedJob.id, e.target.value)}
                            disabled={updatingStatus}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-black uppercase outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="submitted">Submitted</option>
                            <option value="screening">Screening</option>
                            <option value="verification">Verification</option>
                            <option value="interview">Interview</option>
                            <option value="selection">Selection</option>
                            <option value="deployment">Deployment</option>
                            <option value="closed">Closed</option>
                            <option value="deleted">Deleted</option>
                          </select>
                          <span className="text-[11px] text-slate-500 italic">Audit Log Monitored</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applied Worker Profiles Section */}
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" /> Applied Workers ({selectedJob.applicants?.length || 0})
                    </h3>
                    <span className="text-xs font-bold text-slate-500">Worker Profile Sourcing Pool</span>
                  </div>

                  <div className="space-y-4">
                    {(selectedJob.applicants || []).map((w, idx) => (
                      <div key={`admin-applicant-${w.applicationId || w.workerId || idx}-${idx}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-slate-950 dark:text-white">{w.workerName}</h4>
                              {w.workforce_id && <span className="rounded bg-blue-50 px-2 py-0.5 text-[9px] font-mono text-blue-700 font-bold">ID: {w.workforce_id}</span>}
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5">{w.profession || "Global Worker"}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                              w.applicationStatus === 'accepted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                              w.applicationStatus === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' :
                              w.applicationStatus === 'under_review' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                            }`}>
                              Decision: {w.applicationStatus}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-xs text-slate-600 dark:text-slate-400">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Contact Credentials</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">{w.workerEmail}</p>
                            <p>{w.workerPhone || "No phone listed"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Experience & Education</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">{w.experience_years || 0} Years Experience</p>
                            <p>{w.education || "Graduate"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Target Location & Status</p>
                            <p className="font-bold text-slate-900 dark:text-white mt-1">Target: {w.target_country || "Global"}</p>
                            <p>Applied: {new Date(w.appliedAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {w.bio && <p className="mt-3 text-xs italic bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">"{w.bio}"</p>}
                      </div>
                    ))}

                    {(!selectedJob.applicants || selectedJob.applicants.length === 0) && (
                      <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 dark:bg-slate-950 rounded-2xl border">
                        No worker applications submitted yet for this mass hiring position.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
}
