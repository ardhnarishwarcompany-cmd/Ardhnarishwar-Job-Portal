export const USER_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/user`;
export const JOB_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/job`;
export const APPLICATION_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/application`;
export const COMPANY_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/company`;
export const NOTIFICATION_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/notifications`;
export const AI_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/ai`;
export const MESSAGING_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/messaging`;
export const ADMIN_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/admin`;
export const COMPLAINT_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/complaints`;
export const RECRUITER_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/recruiter`;
export const OPTIONS_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/options`;
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getFileUrl = (filePath) => {
  if (!filePath) return "";

  let value = String(filePath).trim();
  if (!value) return "";

  if (value.startsWith("blob:") || value.startsWith("data:")) return value;

  value = value.replace(/\\/g, "/");

  const uploadsIndex = value.toLowerCase().indexOf("/uploads/");
  if (uploadsIndex >= 0 && !/^https?:\/\//i.test(value)) {
    value = value.slice(uploadsIndex);
  }

  const baseUrl = API_URL.replace(/\/$/, "");

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?/i.test(value)) {
    try {
      const url = new URL(value);
      const base = new URL(baseUrl);
      value = `${base.origin}${url.pathname}${url.search}${url.hash}`;
    } catch {
      // Fall through to normal handling
    }
  }

  if (/^https?:\/\//i.test(value)) return value;

  if (!value.startsWith("/")) value = `/${value}`;
  if (!value.toLowerCase().startsWith("/uploads/")) {
    value = `/uploads${value}`;
  }

  return `${baseUrl}${value}`;
};

export const PAYMENT_API_ENDPOINT = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/payments`;
