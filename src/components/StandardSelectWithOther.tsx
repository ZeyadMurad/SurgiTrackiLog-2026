import React, { useState, useEffect } from 'react';
import { PenTool, CheckCircle2, ChevronDown } from 'lucide-react';

interface StandardSelectWithOtherProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  otherPlaceholder?: string;
  required?: boolean;
  isTextArea?: boolean;
  rows?: number;
  className?: string;
  helpText?: string;
  badge?: string;
}

export const StandardSelectWithOther: React.FC<StandardSelectWithOtherProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = '-- Select Standard Option --',
  otherPlaceholder = 'Enter custom value (Other / إدخال مخصص)...',
  required = false,
  isTextArea = false,
  rows = 2,
  className = '',
  helpText,
  badge,
}) => {
  // Check if current value matches one of the predefined options
  const isPredefined = options.includes(value);
  const isOther = !isPredefined && value.trim().length > 0;
  
  // Local state to track whether dropdown is currently set to "Other"
  const [selectMode, setSelectMode] = useState<'standard' | 'other'>(
    isOther ? 'other' : 'standard'
  );

  useEffect(() => {
    if (!options.includes(value) && value.trim().length > 0) {
      setSelectMode('other');
    } else if (options.includes(value)) {
      setSelectMode('standard');
    }
  }, [value, options]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__OTHER__') {
      setSelectMode('other');
      // If switching to other, clear or keep as prompt
      if (options.includes(value)) {
        onChange('');
      }
    } else {
      setSelectMode('standard');
      onChange(selected);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const selectValue = selectMode === 'other' ? '__OTHER__' : (options.includes(value) ? value : '');

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {badge && (
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full border border-teal-200 font-medium">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Select Dropdown with standard options + Other */}
      <div className="relative">
        <select
          value={selectValue}
          onChange={handleSelectChange}
          required={required && !value}
          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none transition appearance-none pr-8 cursor-pointer shadow-xs"
        >
          <option value="">{placeholder}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
          <option value="__OTHER__" className="font-semibold text-teal-700 bg-teal-50">
            ✍️ Other / أخرى (إدخال مخصص يدوي)...
          </option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Conditional Custom Input when "Other" is selected */}
      {selectMode === 'other' && (
        <div className="mt-2 p-2.5 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-1 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-amber-900 font-medium">
            <span className="flex items-center gap-1.5">
              <PenTool size={12} className="text-amber-700" />
              <span>إدخال مخصص / Custom Entry:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectMode('standard');
                if (options.length > 0) onChange(options[0]);
              }}
              className="text-[10px] text-teal-700 hover:text-teal-900 underline cursor-pointer"
            >
              العودة للقائمة النموذجية / Back to List
            </button>
          </div>
          {isTextArea ? (
            <textarea
              rows={rows}
              required={required}
              placeholder={otherPlaceholder}
              value={value}
              onChange={handleCustomChange}
              autoFocus
              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          ) : (
            <input
              type="text"
              required={required}
              placeholder={otherPlaceholder}
              value={value}
              onChange={handleCustomChange}
              autoFocus
              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          )}
        </div>
      )}

      {helpText && <p className="text-[10px] text-slate-500 mt-0.5">{helpText}</p>}
    </div>
  );
};
