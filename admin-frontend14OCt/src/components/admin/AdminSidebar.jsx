import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSidebarCollapsed } from "../../redux/authSlice";
import axios from "axios";
import ardhnarishwarLogo from "@/assets/ardhnarishwar-logo.png";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ClipboardList, 
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  MessageCircle, 
  FileCheck2, 
  MessagesSquare, 
  AlertCircle, 
  KeyRound, 
  Video,
  Globe2, Settings2, ShieldCheck, ClipboardCheck, Activity, Truck, UserCheck, History as HistoryIcon
} from "lucide-react";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/field-options", label: "Field Options Master", icon: Settings2 },
  { to: "/admin/workforce", label: "Global Workforce", icon: Globe2 },
  { to: "/admin/mass-hiring", label: "Mass Hiring Jobs", icon: Truck },

  { to: "/admin/users", label: "Manage Users", icon: Users },
  { to: "/admin/jobs", label: "Manage Jobs", icon: Briefcase },
  { to: "/admin/jobs/pending", label: "Job Approvals", icon: FileCheck2 },
  { to: "/admin/job-edits", label: "Job Edit Approvals", icon: FileCheck2 },
  { to: "/admin/recruiter-approvals", label: "Employer Approvals", icon: ClipboardList },
  { to: "/admin/employer-profile-edits", label: "Employer Edit Requests", icon: UserCheck },
  { to: "/admin/edited-profiles", label: "Admin Profile Edits", icon: HistoryIcon },
  { to: "/admin/feature-requests", label: "Feature Approvals", icon: Shield },
  { to: "/admin/recruiter-profiles", label: "Employer Analytics", icon: Users },
  { to: "/admin/applicant-approvals", label: "Registered Applicants", icon: ClipboardList },
  { to: "/admin/applications", label: "Applications", icon: ClipboardList },
  { to: "/admin/ai-interviews", label: "NOVA AI Interviews", icon: Video },
  { to: "/admin/chats", label: "Employer Chats", icon: MessagesSquare },
  { to: "/admin/requests", label: "Contact Requests", icon: MessageCircle },
  { to: "/admin/complaints", label: "Complaints", icon: AlertCircle },
  { to: "/admin/access-keys", label: "Login IDs", icon: KeyRound },
];

const routeToBadgeKeyMap = {
  "/admin/jobs/pending": "jobApprovals",
  "/admin/job-edits": "jobEdits",
  "/admin/recruiter-approvals": "recruiterApprovals",
  "/admin/applicant-approvals": "applicantApprovals",
  "/admin/employer-profile-edits": "employerProfileEdits",
  "/admin/feature-requests": "featureRequests",
  "/admin/complaints": "complaints",
  "/admin/requests": "contactRequests",
  "/admin/ai-interviews": "aiInterviews",
  "/admin/chats": "chats",
  "/admin/workforce": "workforce",
  "/admin/applications": "applications",
};

const SEEN_BADGES_STORAGE_KEY = "admin_cached_unread_badges";

const getCachedBadgesFromStorage = () => {
  try {
    const raw = localStorage.getItem(SEEN_BADGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveCachedBadgesToStorage = (counts) => {
  try {
    localStorage.setItem(SEEN_BADGES_STORAGE_KEY, JSON.stringify(counts));
  } catch (e) {}
};

// In-memory caches to prevent layout jumps or flickering during client route navigation
let cachedBadgeCounts = getCachedBadgesFromStorage();
let cachedScrollTop = 0;

const AdminSidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector((state) => state.auth.sidebarCollapsed);
  
  const [badgeCounts, setBadgeCounts] = useState(cachedBadgeCounts);
  const navRef = useRef(null);

  // Restore scroll position seamlessly
  useEffect(() => {
    if (navRef.current) {
      navRef.current.scrollTop = cachedScrollTop;
    }
  }, []);

  const handleNavScroll = (e) => {
    cachedScrollTop = e.currentTarget.scrollTop;
  };

  const fetchBadgeCounts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/badge-counts`,
        { withCredentials: true }
      );
      if (res.data?.success) {
        const freshBadges = res.data.badgeCounts || {};
        cachedBadgeCounts = freshBadges;
        saveCachedBadgesToStorage(freshBadges);
        setBadgeCounts({ ...freshBadges });
      }
    } catch (err) {
      // silent fallback
    }
  };

  // Helper to mark a badge key as seen on the backend and in local state
  const markBadgeSeen = async (badgeKey) => {
    if (!badgeKey) return;

    // 1. Immediately zero-out in UI state for 0ms visual latency
    setBadgeCounts((prev) => {
      const updated = { ...prev, [badgeKey]: 0 };
      if (badgeKey === "workforce") {
        updated.recruiterApprovals = 0;
        updated.applicantApprovals = 0;
      }
      cachedBadgeCounts = updated;
      saveCachedBadgesToStorage(updated);
      return updated;
    });

    // 2. Persist to MySQL database on backend so it survives across logins and sessions
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/mark-badge-seen`,
        { badgeKey },
        { withCredentials: true }
      );
      if (res.data?.success) {
        const freshBadges = res.data.badgeCounts || {};
        cachedBadgeCounts = freshBadges;
        saveCachedBadgesToStorage(freshBadges);
        setBadgeCounts({ ...freshBadges });
      }
    } catch (err) {
      // silent fallback
    }
  };

  // Sync seen counts when admin visits/is currently on a specific section
  useEffect(() => {
    // Find matching route for current pathname (longest/most-specific route match first)
    const activeEntry = Object.entries(routeToBadgeKeyMap)
      .sort(([a], [b]) => b.length - a.length)
      .find(([route]) =>
        location.pathname === route || (route !== "/admin/dashboard" && location.pathname.startsWith(`${route}/`))
      );

    if (activeEntry) {
      const activeBadgeKey = activeEntry[1];
      markBadgeSeen(activeBadgeKey);
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchBadgeCounts();

    // Periodic live refresh every 20 seconds for real-time new incoming requests
    const interval = setInterval(fetchBadgeCounts, 20000);

    const handleFocus = () => {
      fetchBadgeCounts();
    };

    const handleCustomRefresh = () => {
      fetchBadgeCounts();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("refresh_admin_badges", handleCustomRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("refresh_admin_badges", handleCustomRefresh);
    };
  }, []);

  // When admin clicks on a specific sidebar section
  const handleItemClick = (to) => {
    const badgeKey = routeToBadgeKeyMap[to];
    if (badgeKey) {
      markBadgeSeen(badgeKey);
    }
  };

  // Identify the single most-specific active nav item for the current URL
  const activeNavItem = navItems.reduce((best, item) => {
    const isMatch =
      location.pathname === item.to ||
      (item.to !== "/admin/dashboard" && location.pathname.startsWith(`${item.to}/`));
    if (!isMatch) return best;
    if (!best || item.to.length > best.to.length) return item;
    return best;
  }, null);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 256 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-30 hidden h-screen flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-cyan-950 shadow-2xl md:flex overflow-hidden"
    >
      {/* Brand Logo with light bluish glow */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0">
        <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center">
          <img 
            src={ardhnarishwarLogo} 
            alt="Ardhnarishwar Logo" 
            className="h-10 w-10 rounded-full object-cover ring-2 ring-sky-300/60 shadow-[0_0_18px_rgba(56,189,248,0.55)] transition-transform duration-300 hover:scale-105" 
          />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15 }}
            >
              <p className="font-black text-white text-sm tracking-tight">Ardhnarishwar</p>
              <p className="text-[11px] font-semibold text-cyan-300 tracking-wide uppercase">Admin Portal</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items — Smooth, non-reanimating list with persistent scroll */}
      <nav 
        ref={navRef}
        onScroll={handleNavScroll}
        className="flex-1 px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {navItems.map((item) => {
          const isActive = activeNavItem?.to === item.to;
          const badgeKey = routeToBadgeKeyMap[item.to];

          // Workflow:
          // 1. If active route: badge disappears (0)
          // 2. Otherwise: show ONLY the new unseen requests from server-synced badgeCounts
          const badgeCount = (isActive || !badgeKey) ? 0 : Number(badgeCounts[badgeKey] || 0);

          return (
            <div key={item.to} className="relative">
              <Link
                to={item.to}
                onClick={() => handleItemClick(item.to)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="relative flex-shrink-0 flex items-center justify-center">
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  
                  {/* Collapsed dot badge for new unseen items */}
                  {badgeCount > 0 && sidebarCollapsed && (
                    <span 
                      className="absolute -right-1 -top-1 rounded-full bg-rose-500 ring-2 ring-slate-900 shadow-md shadow-rose-500/50 animate-pulse block" 
                      style={{ width: '8px', height: '8px' }} 
                      title={`${badgeCount} new requests`}
                    />
                  )}
                </div>

                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-semibold whitespace-nowrap flex-1 truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Expanded numeric badge for new unseen items */}
                {badgeCount > 0 && !sidebarCollapsed && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-black text-white ring-2 ring-slate-900 shadow-md shadow-rose-500/30 animate-pulse flex-shrink-0 ml-auto">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}

                {isActive && !sidebarCollapsed && badgeCount === 0 && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white shadow-sm flex-shrink-0" />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <button
          onClick={() => dispatch(setSidebarCollapsed(!sidebarCollapsed))}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer"
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!sidebarCollapsed && <span className="text-xs font-semibold">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
