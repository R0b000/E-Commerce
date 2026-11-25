import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SearchOutlined, DownOutlined, CheckOutlined, CloseCircleFilled } from '@ant-design/icons';
import { AutoCompleteSelectProps, AutoCompleteSelectOption } from './AutoCompleteSelect.types';

export const AutoCompleteSelect: React.FC<AutoCompleteSelectProps> = ({
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
  style,
  label,
  showLabel = false,
  allowClear = false,
  theme = 'amber',
}) => {
  const [internalValue, setInternalValue] = useState<any>(value !== undefined ? value : defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const activeOption = options.find((opt) => String(opt.value) === String(internalValue));

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const text = typeof opt.label === 'string' ? opt.label : String(opt.value);
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Reset activeIndex when search term changes
  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

  const updatePosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownHeight = 260; // Max height of dropdown panel
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    if (openAbove) {
      setDropdownPosition({
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
      });
    } else {
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
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

  // Focus search input and update position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('resize', handleScrollOrResize);
      window.addEventListener('scroll', handleScrollOrResize, true);

      const idx = filteredOptions.findIndex((opt) => String(opt.value) === String(internalValue));
      setActiveIndex(idx >= 0 ? idx : 0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      return () => {
        window.removeEventListener('resize', handleScrollOrResize);
        window.removeEventListener('scroll', handleScrollOrResize, true);
      };
    }
  }, [isOpen]);

  const handleSelect = (option: AutoCompleteSelectOption) => {
    setInternalValue(option.value);
    onChange?.(option.value, option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalValue(undefined);
    onChange?.(undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0) {
        const targetOption = filteredOptions[activeIndex] || filteredOptions[0];
        if (targetOption && !targetOption.disabled) {
          handleSelect(targetOption);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const isAmber = theme === 'amber';

  return (
    <div
      className={`relative inline-block w-full font-['Poppins','Inter',sans-serif] ${className}`}
      style={style}
      ref={containerRef}
    >
      {(label || showLabel) && (
        <span className="block text-[11px] font-bold text-[#64748b] leading-tight mb-1 select-none">
          {label || 'Select option'}
        </span>
      )}

      {/* Trigger Button with matched height and border */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            if (!isOpen) {
              updatePosition();
            }
            setIsOpen((prev) => !prev);
          }
        }}
        aria-expanded={isOpen}
        className={`h-[32px] w-full px-2.5 bg-white border rounded-md flex items-center justify-between gap-2 text-left shadow-2xs transition-all cursor-pointer ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
            : isOpen
            ? isAmber
              ? 'border-amber-500'
              : 'border-[#0096c7]'
            : isAmber
            ? 'border-[#d1d5db] hover:border-amber-500'
            : 'border-[#d1d5db] hover:border-[#0096c7]'
        }`}
      >
        <span className="text-[12px] font-bold text-[#1e293b] truncate">
          {activeOption ? activeOption.label : <span className="text-[#94a3b8] font-normal">{placeholder}</span>}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && internalValue !== undefined && !disabled && (
            <span
              onClick={handleClear}
              className="text-[#94a3b8] hover:text-slate-600 p-0.5 text-xs transition-colors"
            >
              <CloseCircleFilled />
            </span>
          )}
          <DownOutlined
            className={`text-[10px] text-[#64748b] transition-transform duration-200 ${
              isOpen ? (isAmber ? 'rotate-180 text-amber-600' : 'rotate-180 text-[#0096c7]') : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel rendered via portal to escape modal/overflow clipping */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className={`autocomplete-dropdown fixed overflow-hidden rounded-lg bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-[11px] ${
              isAmber ? 'border border-amber-300' : 'border border-cyan-300'
            }`}
            style={{
              position: 'fixed',
              top: dropdownPosition.top !== undefined ? `${dropdownPosition.top}px` : undefined,
              bottom: dropdownPosition.bottom !== undefined ? `${dropdownPosition.bottom}px` : undefined,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              zIndex: 99999,
            }}
          >
            {/* Top Search Input with width almost identical to dropdown */}
            <div
              className={`mx-1.5 my-1.5 flex h-[30px] items-center gap-2 rounded-md border px-2 transition ${
                isAmber
                  ? 'border-amber-500 bg-amber-50/20'
                  : 'border-[#0096c7] bg-white'
              }`}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[11px] font-bold text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:outline-none"
              />
              <SearchOutlined className={`text-xs shrink-0 ${isAmber ? 'text-amber-600' : 'text-[#94a3b8]'}`} />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
              {filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(internalValue);
                const isFocused = idx === activeIndex;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`flex items-center justify-between w-full cursor-pointer rounded-md px-2 py-1.5 text-left transition-colors ${
                      isSelected ? 'text-[12px] font-bold' : 'text-[11px] font-bold'
                    } ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? isAmber
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-[#e5f6fb] text-[#0096c7]'
                        : isFocused
                        ? isAmber
                          ? 'bg-amber-50/70 text-amber-800'
                          : 'bg-[#e5f6fb]/70 text-[#0096c7]'
                        : isAmber
                        ? 'text-[#1e293b] hover:bg-amber-50 hover:text-amber-800'
                        : 'text-[#1e293b] hover:bg-[#e5f6fb] hover:text-[#0096c7]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <CheckOutlined className={`text-xs shrink-0 ml-1.5 ${isAmber ? 'text-amber-600' : 'text-[#0096c7]'}`} />
                    )}
                  </button>
                );
              })}

              {filteredOptions.length === 0 && (
                <div className="p-2.5 text-[11px] text-slate-400 text-center font-medium">
                  No options match "{searchTerm}"
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AutoCompleteSelect;
