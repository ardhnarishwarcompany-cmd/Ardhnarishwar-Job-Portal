import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, Search, ShieldAlert, CheckCircle2, XCircle, Clock,
  Eye, MessageSquare, Building2, Mail, Phone, Calendar, User, FileText, Send, X, RefreshCw
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { ADMIN_API_ENDPOINT } from "@/utils/data";
import AdminLayout from "./AdminLayout";

const EmployerProfileEditRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'history'
  const [search, setSearch] = useState("");

  // Rejection modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModalType, setActionModalType] = useState(null); // 'approve' | 'reject' | 'view'
  const [adminRemarks, setAdminRemarks] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${ADMIN_API_ENDPOINT}/employer-profile-edit-requests`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setRequests(res.data.requests || []);
      }
    } catch (err) {
      toast.error("Failed to load employer profile edit requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleActionSubmit = async () => {
    if (!selectedRequest || !actionModalType) return;
    if (actionModalType === "reject" && !adminRemarks.trim()) {
      toast.error("Please enter a rejection remark so the employer knows what to fix.");
      return;
    }

    try {
      setActionSubmitting(true);
      const action = actionModalType === "approve" ? "approved" : "rejected";
      const res = await axios.post(
        `${ADMIN_API_ENDPOINT}/employer-profile-edit-requests/${selectedRequest.id}/action`,
        { action, adminRemarks: adminRemarks.trim() },
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success(res.data.message || `Request ${action} successfully!`);
        setSelectedRequest(null);
        setActionModalType(null);
        setAdminRemarks("");
        fetchRequests();
      } else {
        toast.error(res.data.message || "Failed to process request.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Server error while processing request.");
    } finally {
      setActionSubmitting(false);
    }
  };

  // Filter requests
  const pendingRequests = requests.filter((r) => r.status === "pending");
  const historyRequests = requests.filter((r) => r.status !== "pending");

  const listToDisplay = activeTab === "pending" ? pendingRequests : historyRequests;

  const filteredList = listToDisplay.filter((r) => {
    const term = search.toLowerCase();
    return (
      (r.employerName || "").toLowerCase().includes(term) ||
      (r.employerEmail || "").toLowerCase().includes(term) ||
      (r.companyName || "").toLowerCase().includes(term) ||
      (r.reason || "").toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout
      title="Employer Profile Edit Requests"
      description="Review and grant permission for employers to edit their registered company profiles"
      icon={UserCheck}
    >
      <div className="space-y-6">
        {/* Controls & Search Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("pending")}
              className={`relative rounded-xl px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Clock className="h-4 w-4" /> Pending Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-900">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <FileText className="h-4 w-4" /> Request History ({historyRequests.length})
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employer, company..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" /> Loading requests...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <ShieldAlert className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-3 font-bold text-slate-800 text-base">No {activeTab} profile edit requests found</h3>
            <p className="mt-1 text-xs text-slate-500">
              {activeTab === "pending"
                ? "All employer edit requests have been reviewed."
                : "No past edit request history available."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredList.map((reqItem) => {
              let requestedDetails = {};
              try {
                requestedDetails = typeof reqItem.requested_data === "string"
                  ? JSON.parse(reqItem.requested_data)
                  : (reqItem.requested_data || {});
              } catch (e) {}

              return (
                <motion.div
                  key={reqItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                          reqItem.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : reqItem.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {reqItem.status}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Request Date: {new Date(reqItem.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
                        <h3 className="text-lg font-black text-slate-900">
                          {reqItem.companyName || "Employer Company"}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold">
                          <User className="h-3.5 w-3.5 text-slate-400" /> {reqItem.employerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> {reqItem.employerEmail}
                        </span>
                        {reqItem.employerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> {reqItem.employerPhone}
                          </span>
                        )}
                      </div>

                      {/* Employer's Reason */}
                      <div className="mt-3 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                          <MessageSquare className="h-3.5 w-3.5 text-blue-600" /> Employer's Reason for Request:
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">"{reqItem.reason}"</p>
                      </div>

                      {/* Admin remarks in history view */}
                      {reqItem.status !== "pending" && (
                        <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-4">
                          <span><b>Decision Date:</b> {reqItem.action_at ? new Date(reqItem.action_at).toLocaleString() : "N/A"}</span>
                          {reqItem.admin_remarks && <span><b>Admin Remarks:</b> "{reqItem.admin_remarks}"</span>}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                      <button
                        onClick={() => {
                          setSelectedRequest(reqItem);
                          setActionModalType("view");
                        }}
                        className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="h-4 w-4" /> View Details
                      </button>

                      {reqItem.status === "pending" && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRequest(reqItem);
                              setActionModalType("approve");
                              setAdminRemarks("Approved. You can now edit your profile.");
                            }}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Accept
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(reqItem);
                              setActionModalType("reject");
                              setAdminRemarks("");
                            }}
                            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white hover:bg-rose-700 shadow-md shadow-rose-200 transition-all flex items-center gap-1.5"
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Action / View Modal */}
        <AnimatePresence>
          {selectedRequest && actionModalType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 my-8"
              >
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionModalType(null);
                  }}
                  className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {actionModalType === "view" ? (
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">Employer Edit Request Details</h3>
                    <p className="text-xs text-slate-500 mb-4">{selectedRequest.companyName} • {selectedRequest.employerName}</p>

                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 block">Employer Email & Phone:</span>
                        <span>{selectedRequest.employerEmail} | {selectedRequest.employerPhone || "N/A"}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">Requested Date & Time:</span>
                        <span>{new Date(selectedRequest.created_at).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">Reason for Edit Request:</span>
                        <p className="mt-1 text-slate-800 font-medium">"{selectedRequest.reason}"</p>
                      </div>
                      {selectedRequest.admin_remarks && (
                        <div>
                          <span className="font-bold text-slate-700 block">Admin Decision Remarks:</span>
                          <p className="mt-1 text-slate-800 font-medium">"{selectedRequest.admin_remarks}"</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setActionModalType(null);
                        }}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        actionModalType === "approve" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}>
                        {actionModalType === "approve" ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">
                          {actionModalType === "approve" ? "Approve Profile Edit Request" : "Reject Profile Edit Request"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Employer: {selectedRequest.employerName} ({selectedRequest.companyName})
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-800 block mb-1">Employer Reason:</span>
                      "{selectedRequest.reason}"
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Admin Remarks / Message to Employer {actionModalType === "reject" && <span className="text-rose-500">*</span>}
                        </label>
                        <textarea
                          rows={3}
                          required={actionModalType === "reject"}
                          value={adminRemarks}
                          onChange={(e) => setAdminRemarks(e.target.value)}
                          placeholder={
                            actionModalType === "approve"
                              ? "Optional approval remark..."
                              : "Specify the reason for rejection so employer can fix and resubmit..."
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(null);
                            setActionModalType(null);
                          }}
                          className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleActionSubmit}
                          disabled={actionSubmitting}
                          className={`rounded-xl px-6 py-2.5 text-xs font-black text-white shadow-md transition-all flex items-center gap-2 disabled:opacity-50 ${
                            actionModalType === "approve"
                              ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                              : "bg-rose-600 hover:bg-rose-700 shadow-rose-200"
                          }`}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {actionSubmitting ? "Processing..." : actionModalType === "approve" ? "Confirm Accept" : "Confirm Reject"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default EmployerProfileEditRequests;
