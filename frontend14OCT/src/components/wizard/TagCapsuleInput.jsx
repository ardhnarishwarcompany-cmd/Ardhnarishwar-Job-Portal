import React, { useState, useRef, useEffect } from "react";
import { Plus, X } from "lucide-react";

const TagCapsuleInput = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Select or type...",
  addLabel = "Add",
  disabled = false,
  className = "",
  capsuleColor = "blue", // "blue" | "emerald" | "slate" | "purple"
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize incoming value to an array of strings
  const items = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = (options || []).filter((opt) => {
    if (!opt || typeof opt !== "string") return false;
    const matchesQuery = opt.toLowerCase().includes(inputValue.toLowerCase().trim());
    const notAlreadyAdded = !items.some((item) => item.toLowerCase() === opt.toLowerCase());
    return matchesQuery && notAlreadyAdded;
  });

  const handleAddItem = (itemToAdd) => {
    const trimmed = (itemToAdd || inputValue).trim();
    if (!trimmed) return;

    if (items.some((it) => it.toLowerCase() === trimmed.toLowerCase())) {
      setInputValue("");
      setIsOpen(false);
      return;
    }

    const updated = [...items, trimmed];
    if (onChange) onChange(updated);
    setInputValue("");
    setIsOpen(false);
  };

  const handleRemoveItem = (indexToRemove) => {
    const updated = items.filter((_, idx) => idx !== indexToRemove);
    if (onChange) onChange(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const colorStyles = {
    blue: "bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-300",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300",
    purple: "bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-300",
    slate: "bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300",
  }[capsuleColor] || "bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-300";

  return (
    <div className={`space-y-2.5 w-full ${className}`} ref={containerRef}>
      {/* Input + Add button row */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            disabled={disabled}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition shadow-xs disabled:opacity-50"
          />

          {/* Autocomplete Dropdown */}
          {isOpen && filteredOptions.length > 0 && !disabled && (
            <div className="absolute left-0 top-full mt-1.5 w-full max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 divide-y divide-slate-50">
              {filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleAddItem(opt)}
                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition flex items-center justify-between group"
                >
                  <span>{opt}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-bold">+ Add</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={disabled || !inputValue.trim()}
          onClick={() => handleAddItem()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-40 disabled:pointer-events-none select-none shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{addLabel}</span>
        </button>
      </div>

      {/* Responsive Capsule Display Container with precise margin & padding */}
      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 min-h-[44px]">
          {items.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition shadow-2xs ${colorStyles}`}
            >
              <span>{item}</span>
              {!disabled && (
                <button
                  type="button"
                  title={`Remove ${item}`}
                  onClick={() => handleRemoveItem(idx)}
                  className="rounded-full p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagCapsuleInput;
