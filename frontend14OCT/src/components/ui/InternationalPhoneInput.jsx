import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export const COUNTRIES = [
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳", minDigits: 10, maxDigits: 10, placeholder: "98765 43210" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸", minDigits: 10, maxDigits: 10, placeholder: "555 123 4567" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧", minDigits: 10, maxDigits: 11, placeholder: "7911 123456" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦", minDigits: 10, maxDigits: 10, placeholder: "555 123 4567" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪", minDigits: 9, maxDigits: 9, placeholder: "50 123 4567" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦", minDigits: 9, maxDigits: 9, placeholder: "50 123 4567" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺", minDigits: 9, maxDigits: 9, placeholder: "412 345 678" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬", minDigits: 8, maxDigits: 8, placeholder: "8123 4567" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪", minDigits: 10, maxDigits: 11, placeholder: "151 23456789" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷", minDigits: 9, maxDigits: 9, placeholder: "6 12 34 56 78" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦", minDigits: 8, maxDigits: 8, placeholder: "3312 3456" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼", minDigits: 8, maxDigits: 8, placeholder: "5123 4567" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲", minDigits: 8, maxDigits: 8, placeholder: "9123 4567" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭", minDigits: 8, maxDigits: 8, placeholder: "3612 3456" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾", minDigits: 9, maxDigits: 10, placeholder: "12 345 6789" },
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩", minDigits: 10, maxDigits: 10, placeholder: "1712 345678" },
  { name: "Nepal", code: "NP", dialCode: "+977", flag: "🇳🇵", minDigits: 10, maxDigits: 10, placeholder: "981 2345678" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", flag: "🇱🇰", minDigits: 9, maxDigits: 9, placeholder: "71 234 5678" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭", minDigits: 10, maxDigits: 10, placeholder: "917 123 4567" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩", minDigits: 10, maxDigits: 12, placeholder: "812 3456 789" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿", minDigits: 9, maxDigits: 9, placeholder: "21 123 4567" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦", minDigits: 9, maxDigits: 9, placeholder: "71 123 4567" },
  { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬", minDigits: 10, maxDigits: 10, placeholder: "802 123 4567" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪", minDigits: 9, maxDigits: 9, placeholder: "85 123 4567" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱", minDigits: 9, maxDigits: 9, placeholder: "6 12345678" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭", minDigits: 9, maxDigits: 9, placeholder: "78 123 45 67" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵", minDigits: 10, maxDigits: 10, placeholder: "90 1234 5678" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳", minDigits: 11, maxDigits: 11, placeholder: "138 0013 8000" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷", minDigits: 10, maxDigits: 11, placeholder: "11 91234 5678" },
  { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽", minDigits: 10, maxDigits: 10, placeholder: "55 1234 5678" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸", minDigits: 9, maxDigits: 9, placeholder: "612 34 56 78" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹", minDigits: 10, maxDigits: 10, placeholder: "312 345 6789" },
  { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪", minDigits: 9, maxDigits: 9, placeholder: "712 345678" }
];

export const parsePhoneNumber = (val) => {
  if (!val) return { country: COUNTRIES[0], number: "" };
  const str = String(val).trim();
  
  // Check if string starts with any known dial code
  for (const c of COUNTRIES) {
    if (str.startsWith(c.dialCode)) {
      const rest = str.slice(c.dialCode.length).trim().replace(/\D/g, "");
      return { country: c, number: rest };
    }
  }

  // Fallback to India (+91)
  const digitsOnly = str.replace(/\D/g, "");
  return { country: COUNTRIES[0], number: digitsOnly };
};

const InternationalPhoneInput = ({
  value = "",
  onChange,
  placeholder,
  disabled = false,
  className = "",
  required = false,
  name,
  id,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  // Sync incoming value
  useEffect(() => {
    const parsed = parsePhoneNumber(value);
    setSelectedCountry(parsed.country);
    setPhoneNumber(parsed.number);
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setDropdownOpen(false);
    setSearchQuery("");
    
    // Trim digits if exceeding new country's maxDigits
    let trimmed = phoneNumber;
    if (trimmed.length > country.maxDigits) {
      trimmed = trimmed.slice(0, country.maxDigits);
      setPhoneNumber(trimmed);
    }
    
    if (onChange) {
      // Store full format with dialCode if not empty
      const fullVal = trimmed ? `${country.dialCode} ${trimmed}` : "";
      onChange(fullVal);
    }
  };

  const handleNumberChange = (e) => {
    // Only allow numeric digits
    const raw = e.target.value.replace(/\D/g, "");
    const limited = raw.slice(0, selectedCountry.maxDigits);
    setPhoneNumber(limited);

    if (onChange) {
      const fullVal = limited ? `${selectedCountry.dialCode} ${limited}` : "";
      onChange(fullVal);
    }
  };

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isValidLength = phoneNumber.length >= selectedCountry.minDigits && phoneNumber.length <= selectedCountry.maxDigits;
  const showError = phoneNumber.length > 0 && !isValidLength;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex rounded-xl border border-slate-300 bg-white transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 shadow-xs overflow-visible">
        {/* Country Selector Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="country-dropdown-btn flex items-center gap-1.5 h-full px-3 py-2 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 text-slate-800 text-xs font-bold transition-colors rounded-l-xl select-none !transform-none !shadow-none"
            style={{ transform: "none", boxShadow: "none" }}
          >
            <span className="text-base">{selectedCountry.flag}</span>
            <span className="text-slate-700 font-mono">{selectedCountry.dialCode}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} style={{ transformOrigin: "center" }} />
          </button>

          {/* Country Dropdown Modal */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 max-h-72 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden flex flex-col">
              <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search country or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                {filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-blue-50 transition ${
                        isSelected ? "bg-blue-50/70 font-bold text-blue-700" : "text-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-base">{c.flag}</span>
                        <span className="truncate">{c.name}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                        {c.dialCode}
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </span>
                    </button>
                  );
                })}
                {filteredCountries.length === 0 && (
                  <div className="py-4 text-center text-xs text-slate-400 font-medium">No countries found</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Numeric Number Input */}
        <input
          type="tel"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={phoneNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || selectedCountry.placeholder}
          maxLength={selectedCountry.maxDigits}
          className="flex-1 px-3 py-2 text-sm text-slate-900 bg-transparent focus:outline-none rounded-r-xl font-mono tracking-wide placeholder:font-sans placeholder:text-slate-400 placeholder:tracking-normal"
        />
      </div>

      {/* Helper / Validation Hint */}
      <div className="mt-1 flex items-center justify-between text-[11px] px-1">
        <span className={showError ? "text-rose-500 font-semibold" : "text-slate-400"}>
          {showError
            ? `Must be ${selectedCountry.minDigits === selectedCountry.maxDigits ? `${selectedCountry.minDigits} digits` : `${selectedCountry.minDigits}-${selectedCountry.maxDigits} digits`} for ${selectedCountry.name}`
            : `${selectedCountry.name}: ${selectedCountry.minDigits === selectedCountry.maxDigits ? `${selectedCountry.minDigits} digits` : `${selectedCountry.minDigits}-${selectedCountry.maxDigits} digits`}`}
        </span>
        <span className="font-mono text-slate-400 text-[10px]">
          {phoneNumber.length}/{selectedCountry.maxDigits}
        </span>
      </div>
    </div>
  );
};

export default InternationalPhoneInput;
