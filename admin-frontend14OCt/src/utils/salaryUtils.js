export const formatJobSalary = (job) => {
  if (!job) return "Not disclosed";
  
  const mode = job.salaryMode || job.jobDetails?.salaryMode || "";
  const min = job.jobDetails?.salaryMin || job.salaryMin;
  const max = job.jobDetails?.salaryMax || job.salaryMax;
  
  // If min and max are provided
  if (min && max) {
    const formattedMode = mode ? ` ${mode}` : " LPA";
    return `₹${min} - ${max}${formattedMode}`;
  } else if (min) {
    const formattedMode = mode ? ` ${mode}` : " LPA";
    return `₹${min}${formattedMode}`;
  }
  
  const rawSalary = job.salary;
  if (!rawSalary && rawSalary !== 0) return "Not disclosed";
  
  const rawStr = String(rawSalary).trim();
  if (!rawStr) return "Not disclosed";

  const lower = rawStr.toLowerCase();
  const hasMode = lower.includes("lpa") || lower.includes("in hand") || lower.includes("ctc");
  
  if (hasMode) {
    return rawStr.startsWith("₹") ? rawStr : `₹${rawStr}`;
  }
  
  const suffix = mode ? ` ${mode}` : " LPA";
  return `₹${rawStr}${suffix}`;
};
