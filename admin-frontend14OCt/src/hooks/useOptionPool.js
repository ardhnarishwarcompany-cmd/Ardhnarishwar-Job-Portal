import { useState, useEffect } from "react";
import axios from "axios";
import { OPTIONS_API_ENDPOINT } from "../utils/data";

const defaultFallbackOptions = {
  experience: ["Freshers", "0-1 Year", "1-2 Years", "2-5 Years", "5-10 Years", "10+ Years"],
  country: ["India", "United States", "United Arab Emirates", "United Kingdom", "Canada", "Australia", "Germany"],
  state: ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Haryana", "Gujarat", "Punjab", "West Bengal"],
  city: ["New Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Noida", "Gurugram", "Pune", "Kolkata", "Chandigarh", "Ahmedabad"],
  area: ["Connaught Place", "Cyber City", "Whitefield", "Hitech City", "BKC", "Salt Lake", "Viman Nagar"],
  sector: ["Sector 1", "Sector 18", "Sector 62", "Sector 132", "Sector 44", "Phase 8"],
  landmark: ["Near Metro Station", "Opposite City Center Mall", "Near IT Park Gate 1", "Behind Central Bus Stand"],
  building: ["Unitech Cyber Park", "DLF Cyber City Tower A", "Embassy TechVillage", "Mindspace IT Park", "Godrej One"],
  floorSuite: ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "Suite 101", "Suite 502", "Tower B, 4th Floor"],
  pincode: ["110001", "201301", "122002", "560001", "400001", "600001", "500081"],
  jobTitle: ["Software Engineer", "Frontend Developer", "Full Stack Developer", "React Developer", "Node.js Developer", "HR Manager", "Sales Manager", "Marketing Executive", "Data Analyst", "Product Manager"],
  language: ["English", "Hindi", "Spanish", "French", "German", "Punjabi", "Marathi", "Bengali", "Tamil", "Telugu"],
  skills: ["JavaScript", "React", "Node.js", "HTML/CSS", "Python", "Java", "SQL", "MongoDB", "Communication", "Project Management"],
  education: ["B.Tech / B.E.", "M.Tech", "B.Sc", "M.Sc", "BCA", "MCA", "MBA", "B.Com", "12th Pass", "Diploma"],
  industry: ["Information Technology", "Software Development", "Banking & Finance", "Healthcare", "E-Commerce", "Education / EdTech", "Manufacturing", "Telecommunications"],
  designation: ["Junior Developer", "Senior Software Engineer", "Lead Architect", "HR Manager", "Director of Engineering", "Team Lead", "Associate"],
  companyName: ["Tech Mahindra", "Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Microsoft", "Google"],
  university: ["Delhi University", "IIT Delhi", "IIT Bombay", "Anna University", "VTU", "Mumbai University", "Amity University", "Panjab University"],
  category: ["General", "OBC", "SC", "ST", "EWS", "Other"],
  religion: ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Jewish", "Other"]
};

export const useOptionPool = () => {
  const [optionPool, setOptionPool] = useState(defaultFallbackOptions);
  const [loading, setLoading] = useState(true);

  const fetchOptions = async () => {
    try {
      const res = await axios.get(OPTIONS_API_ENDPOINT, { withCredentials: true });
      if (res.data?.success && res.data?.options) {
        setOptionPool((prev) => {
          const merged = { ...prev };
          Object.keys(res.data.options).forEach((cat) => {
            const serverOpts = res.data.options[cat] || [];
            const prevOpts = prev[cat] || [];
            const combined = Array.from(new Set([...prevOpts, ...serverOpts]));
            merged[cat] = combined;
          });
          return merged;
        });
      }
    } catch (err) {
      console.warn("Could not load backend option pool, using fallbacks:", err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const saveOptionsToPool = async (items) => {
    try {
      await axios.post(`${OPTIONS_API_ENDPOINT}/upsert`, { items }, { withCredentials: true });
      fetchOptions();
    } catch (err) {
      console.error("Failed to persist options to pool:", err);
    }
  };

  return { optionPool, saveOptionsToPool, loading, refetchOptions: fetchOptions };
};

export const saveFieldMapToPool = async (fieldMap) => {
  try {
    const items = [];
    Object.entries(fieldMap).forEach(([category, rawVal]) => {
      if (!rawVal) return;
      const valList = Array.isArray(rawVal)
        ? rawVal
        : typeof rawVal === "string" && rawVal.includes(",") && ["skills", "language", "languages"].includes(category)
        ? rawVal.split(",").map((s) => s.trim())
        : [rawVal];

      valList.forEach((v) => {
        if (typeof v === "string" && v.trim() && v.trim() !== "Add Manually") {
          items.push({ category, value: v.trim() });
        }
      });
    });

    if (items.length > 0) {
      await axios.post(`${OPTIONS_API_ENDPOINT}/upsert`, { items }, { withCredentials: true });
    }
  } catch (err) {
    console.error("Failed to save field map to pool:", err);
  }
};
