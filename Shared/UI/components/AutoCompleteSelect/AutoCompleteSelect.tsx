import React, { useState, useRef, useEffect } from 'react';
import { SearchOutlined, DownOutlined, CloseCircleFilled } from '@ant-design/icons';
import { AutoCompleteSelectProps, AutoCompleteSelectOption } from './AutoCompleteSelect.types';

export const AutoCompleteSelect: React.FC<AutoCompleteSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState<string>(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const activeOption = options.find((opt) => opt.value === internalValue);

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    return opt.label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (option: AutoCompleteSelectOption) => {
    setInternalValue(option.value);
    onChange?.(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      className={`relative inline-block w-full font-['Poppins','Inter',sans-serif] ${className}`}
      ref={containerRef}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className={`h-[36px] w-full min-w-[140px] px-3 bg-white border rounded-lg flex items-center justify-between gap-2 text-left shadow-2xs transition-all cursor-pointer ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
            : isOpen
            ? 'border-[#0096c7] ring-2 ring-[#0096c7]/20'
            : 'border-[#d1d5db] hover:border-[#0096c7]'
        }`}
      >
        <span className="text-xs sm:text-sm font-bold text-[#1e293b] truncate">
          {activeOption ? activeOption.label : <span className="text-[#94a3b8] font-normal">{placeholder}</span>}
        </span>

        <DownOutlined
          className={`text-[10px] text-[#64748b] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-1.5 w-full min-w-[14rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="mx-2 my-2 flex h-[32px] items-center gap-2 rounded-lg border-2 border-[#0096c7] bg-white px-2.5 transition focus-within:ring-2 focus-within:ring-[#0096c7]/20">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-bold text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:outline-none focus:ring-0"
            />
            <SearchOutlined className="text-xs text-[#94a3b8] shrink-0" />
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.map((opt) => {
              const isSelected = opt.value === internalValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`block w-full cursor-pointer rounded-lg px-2.5 py-1.5 text-left text-xs sm:text-sm font-bold transition-colors ${
                    isSelected
                      ? 'bg-[#e5f6fb] text-[#0096c7]'
                      : 'text-[#334155] hover:bg-[#e5f6fb] hover:text-[#0096c7]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-xs text-slate-400 text-center font-medium">
                No options match "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoCompleteSelect;
