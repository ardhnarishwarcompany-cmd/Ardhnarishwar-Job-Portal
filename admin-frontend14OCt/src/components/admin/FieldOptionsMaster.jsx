import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import AdminLayout from "./AdminLayout";
import { OPTIONS_API_ENDPOINT } from "@/utils/data";
import {
  MapPin,
  Briefcase,
  Award,
  UserCheck,
  Building2,
  GraduationCap,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  RefreshCw,
  FolderPlus
} from "lucide-react";

const LOCATION_SUBFIELDS = [
  { key: "country", label: "Country", placeholder: "e.g. India, United States" },
  { key: "state", label: "State", placeholder: "e.g. Maharashtra, Karnataka" },
  { key: "city", label: "City", placeholder: "e.g. Mumbai, Bengaluru" },
  { key: "pincode", label: "PIN Code", placeholder: "e.g. 560001, 110001" },
  { key: "area", label: "Area / Locality", placeholder: "e.g. Indiranagar, Whitefield" },
  { key: "sector", label: "Sector (Street)", placeholder: "e.g. Sector 62, Sector 18" },
  { key: "landmark", label: "Landmark", placeholder: "e.g. Near Metro Station" },
  { key: "building", label: "Building / Office Search", placeholder: "e.g. DLF Cyber City" },
  { key: "floorSuite", label: "Floor / Suite", placeholder: "e.g. 4th Floor, Suite 201" },
];

const OTHER_CARDS = [
  {
    key: "experience",
    title: "Experience",
    subtitle: "Experience range presets and options",
    icon: Briefcase,
    color: "from-blue-600 to-indigo-600",
    placeholder: "e.g. 0-1 Years, 2-4 Years, 5+ Years",
  },
  {
    key: "skills",
    title: "Skills",
    subtitle: "Technical, domain, and soft skills",
    icon: Sparkles,
    color: "from-amber-500 to-orange-600",
    placeholder: "e.g. React.js, Python, Cloud Computing",
  },
  {
    key: "designation",
    title: "Designation",
    subtitle: "Corporate designations and organizational roles",
    icon: UserCheck,
    color: "from-emerald-600 to-teal-600",
    placeholder: "e.g. Senior Software Engineer, Product Lead",
  },
  {
    key: "jobTitle",
    title: "Job Title",
    subtitle: "Job listing titles and role keywords",
    icon: Layers,
    color: "from-purple-600 to-violet-600",
    placeholder: "e.g. Full Stack Developer, Marketing Director",
  },
  {
    key: "industry",
    title: "Industry",
    subtitle: "Industry verticals and business domains",
    icon: Building2,
    color: "from-rose-600 to-pink-600",
    placeholder: "e.g. Information Technology, Healthcare, EdTech",
  },
  {
    key: "companyName",
    title: "Company / Company Name",
    subtitle: "Recognized company and employer names",
    icon: Award,
    color: "from-cyan-600 to-blue-600",
    placeholder: "e.g. Google, Tata Consultancy Services",
  },
  {
    key: "education",
    title: "Education",
    subtitle: "Degrees, diplomas, and qualification levels",
    icon: GraduationCap,
    color: "from-teal-600 to-emerald-600",
    placeholder: "e.g. B.Tech, M.Tech, MBA, BCA, Diploma",
  },
  {
    key: "category",
    title: "Category",
    subtitle: "Social and reservation categories (General, OBC, SC, ST, EWS, etc.)",
    icon: Layers,
    color: "from-sky-600 to-blue-600",
    placeholder: "e.g. General, OBC, SC, ST, EWS",
  },
  {
    key: "religion",
    title: "Religion",
    subtitle: "Faith and religious communities presets",
    icon: Sparkles,
    color: "from-amber-500 to-orange-600",
    placeholder: "e.g. Hindu, Muslim, Christian, Sikh, Jain",
  },
];

const FieldOptionsMaster = () => {
  const [optionPool, setOptionPool] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeLocationSubfield, setActiveLocationSubfield] = useState("city");
  
  // Search query states per category
  const [searchQueries, setSearchQueries] = useState({});
  // New input states per category
  const [newInputs, setNewInputs] = useState({});
  // Submitting state
  const [submittingKey, setSubmittingKey] = useState(null);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(OPTIONS_API_ENDPOINT);
      if (res.data?.success && res.data.options) {
        setOptionPool(res.data.options);
      }
    } catch (err) {
      console.error("Error fetching options:", err);
      toast.error("Failed to load options pool");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleAddOption = async (category) => {
    const value = (newInputs[category] || "").trim();
    if (!value) {
      toast.error("Please enter a valid option value");
      return;
    }

    const currentList = optionPool[category] || [];
    if (currentList.some((v) => v.toLowerCase() === value.toLowerCase())) {
      toast.error(`"${value}" already exists in this category!`);
      return;
    }

    try {
      setSubmittingKey(category);
      const res = await axios.post(`${OPTIONS_API_ENDPOINT}/upsert`, {
        category,
        values: [value],
      });

      if (res.data?.success) {
        toast.success(`Added "${value}" to ${category}`);
        setOptionPool((prev) => ({
          ...prev,
          [category]: [...(prev[category] || []), value].sort((a, b) => a.localeCompare(b)),
        }));
        setNewInputs((prev) => ({ ...prev, [category]: "" }));
      } else {
        toast.error(res.data?.message || "Failed to add option");
      }
    } catch (err) {
      console.error("Add option error:", err);
      toast.error(err?.response?.data?.message || "Failed to add option");
    } finally {
      setSubmittingKey(null);
    }
  };

  const handleDeleteOption = async (category, value) => {
    try {
      const res = await axios.delete(OPTIONS_API_ENDPOINT, {
        data: { category, value },
      });

      if (res.data?.success) {
        toast.success(`Removed "${value}"`);
        setOptionPool((prev) => ({
          ...prev,
          [category]: (prev[category] || []).filter((v) => v !== value),
        }));
      } else {
        toast.error(res.data?.message || "Failed to remove option");
      }
    } catch (err) {
      console.error("Delete option error:", err);
      toast.error(err?.response?.data?.message || "Failed to remove option");
    }
  };

  const getFilteredOptions = (category) => {
    const list = optionPool[category] || [];
    const query = (searchQueries[category] || "").trim().toLowerCase();
    if (!query) return list;
    return list.filter((item) => String(item).toLowerCase().includes(query));
  };

  const activeSubfieldConfig = LOCATION_SUBFIELDS.find((sf) => sf.key === activeLocationSubfield) || LOCATION_SUBFIELDS[0];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-2">
              <FolderPlus className="w-3.5 h-3.5" />
              Dynamic Auto-Complete Master
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Field Options Master (Dropdown Menu Manager)
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Manually add, view, and manage available suggestions for all combo-box fields across Candidate, Employer, and Admin portals. Options added here are immediately active system-wide.
            </p>
          </div>
          <button
            onClick={fetchOptions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs hover:bg-slate-100 transition shadow-sm self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            Refresh Pool
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CARD 1: LOCATION (All details that come under Location) */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Location (All Details)</h2>
                <p className="text-xs text-blue-100 font-medium">
                  Country, State, City, PIN Code, Area, Sector (Street), Landmark, Building, Floor / Suite
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                {LOCATION_SUBFIELDS.length} Sub-Fields Configured
              </span>
            </div>
          </div>

          {/* Subfield selection tabs */}
          <div className="border-b border-slate-200 bg-slate-50/70 p-3 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max">
              {LOCATION_SUBFIELDS.map((subfield) => {
                const count = (optionPool[subfield.key] || []).length;
                const isSelected = activeLocationSubfield === subfield.key;
                return (
                  <button
                    key={subfield.key}
                    type="button"
                    onClick={() => setActiveLocationSubfield(subfield.key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <span>{subfield.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Active Subfield Manager */}
          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Managing {activeSubfieldConfig.label} Options
                </h3>
                <p className="text-xs text-slate-400">
                  Total { (optionPool[activeSubfieldConfig.key] || []).length } pooled suggestions available
                </p>
              </div>

              {/* Search box for this subfield */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeSubfieldConfig.label}...`}
                  value={searchQueries[activeSubfieldConfig.key] || ""}
                  onChange={(e) =>
                    setSearchQueries({ ...searchQueries, [activeSubfieldConfig.key]: e.target.value })
                  }
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Add Option Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddOption(activeSubfieldConfig.key);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder={activeSubfieldConfig.placeholder}
                value={newInputs[activeSubfieldConfig.key] || ""}
                onChange={(e) =>
                  setNewInputs({ ...newInputs, [activeSubfieldConfig.key]: e.target.value })
                }
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <button
                type="submit"
                disabled={submittingKey === activeSubfieldConfig.key}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add {activeSubfieldConfig.label}</span>
              </button>
            </form>

            {/* Chips Container */}
            <div className="min-h-[120px] max-h-64 overflow-y-auto p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 content-start">
              {getFilteredOptions(activeSubfieldConfig.key).length === 0 ? (
                <div className="w-full py-8 text-center text-xs text-slate-400 font-medium">
                  {searchQueries[activeSubfieldConfig.key]
                    ? `No matching options for "${searchQueries[activeSubfieldConfig.key]}"`
                    : `No options added yet for ${activeSubfieldConfig.label}. Use the input above to add one.`}
                </div>
              ) : (
                getFilteredOptions(activeSubfieldConfig.key).map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-xs hover:border-slate-300 transition group"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      title="Remove option"
                      onClick={() => handleDeleteOption(activeSubfieldConfig.key, item)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OTHER CARDS: Experience, Skills, Designation, Job Title, Industry, Company, Education */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {OTHER_CARDS.map((card) => {
            const Icon = card.icon;
            const items = getFilteredOptions(card.key);
            const totalCount = (optionPool[card.key] || []).length;

            return (
              <div
                key={card.key}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Card Top Banner */}
                <div className={`p-5 bg-gradient-to-r ${card.color} text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black tracking-tight">{card.title}</h3>
                      <p className="text-[11px] text-white/80">{card.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black bg-white/20 px-2.5 py-1 rounded-full border border-white/20">
                    {totalCount} options
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search in ${card.title}...`}
                      value={searchQueries[card.key] || ""}
                      onChange={(e) =>
                        setSearchQueries({ ...searchQueries, [card.key]: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  {/* Add Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddOption(card.key);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder={card.placeholder}
                      value={newInputs[card.key] || ""}
                      onChange={(e) =>
                        setNewInputs({ ...newInputs, [card.key]: e.target.value })
                      }
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={submittingKey === card.key}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </form>

                  {/* Chips Cloud */}
                  <div className="flex-1 min-h-[140px] max-h-56 overflow-y-auto p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 content-start">
                    {items.length === 0 ? (
                      <div className="w-full py-8 text-center text-xs text-slate-400 font-medium">
                        {searchQueries[card.key]
                          ? `No matches for "${searchQueries[card.key]}"`
                          : `No items yet. Type above and click Add.`}
                      </div>
                    ) : (
                      items.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold shadow-2xs hover:border-slate-300 transition"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            title="Remove option"
                            onClick={() => handleDeleteOption(card.key, item)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default FieldOptionsMaster;
