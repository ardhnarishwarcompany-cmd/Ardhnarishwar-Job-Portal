import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";

export const AutoCompleteInput = ({
  value = "",
  onChange,
  options = [],
  placeholder = "Select or type...",
  name,
  className = "",
  disabled = false,
  required = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const containerRef = useRef(null);

  // Sync internal state with external value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on input value
  const search = (inputValue || "").toLowerCase().trim();
  const filteredOptions = (options || []).filter((opt) =>
    opt.toLowerCase().includes(search)
  );

  const hasExactMatch = (options || []).some(
    (opt) => opt.toLowerCase() === search
  );

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (onChange) {
      onChange(val);
    }
    setIsOpen(true);
  };

  const handleSelectOption = (opt) => {
    setInputValue(opt);
    if (onChange) {
      onChange(opt);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2.5 pr-9 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          tabIndex={-1}
          className="dropdown-chevron-btn absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
          style={{ transform: "translateY(-50%)", transition: "none", boxShadow: "none" }}
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} style={{ transformOrigin: "center" }} />
        </button>
      </div>

      {isOpen && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-xl shadow-slate-900/10">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isSelected = (value || "").toLowerCase() === opt.toLowerCase();
              return (
                <li
                  key={`${opt}-${idx}`}
                  onClick={() => handleSelectOption(opt)}
                  className={`flex cursor-pointer items-center justify-between px-3.5 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                </li>
              );
            })
          ) : (
            <li className="px-3.5 py-2 text-xs text-slate-400 italic">No matching options</li>
          )}

          {/* Add Manually Option */}
          {search && !hasExactMatch && (
            <li
              onClick={() => handleSelectOption(inputValue)}
              className="flex cursor-pointer items-center gap-2 border-t border-slate-100 dark:border-slate-800 px-3.5 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              <Plus className="h-4 w-4" />
              <span>Add Manually: "{inputValue}"</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default AutoCompleteInput;
