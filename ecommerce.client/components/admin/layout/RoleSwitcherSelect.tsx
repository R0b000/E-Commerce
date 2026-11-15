import React, { useState, useRef, useEffect } from 'react';
import { SearchOutlined, DownOutlined } from '@ant-design/icons';
import { Role } from 'auth-client/config/appConfig';

export interface RoleOption {
  key: Role;
  label: string;
  defaultPage: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { key: 'admin', label: 'Super Admin', defaultPage: '/admin' },
  { key: 'manager', label: 'DepartMent Head', defaultPage: '/admin/inventory' },
  { key: 'support', label: 'HR', defaultPage: '/admin/customers' },
  { key: 'customer', label: 'Staff', defaultPage: '/admin' },
  { key: 'seller', label: 'Marketplace Seller', defaultPage: '/admin' },
];

interface RoleSwitcherSelectProps {
  currentRole: Role | string;
  onRoleSelect: (role: Role, defaultPage: string) => void;
  className?: string;
  showLabel?: boolean;
}

export const RoleSwitcherSelect: React.FC<RoleSwitcherSelectProps> = ({
  currentRole,
  onRoleSelect,
  className = '',
  showLabel = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find active role option
  const activeOption =
    ROLE_OPTIONS.find((r) => r.key === currentRole) ||
    ROLE_OPTIONS.find((r) => r.label.toLowerCase() === String(currentRole).toLowerCase()) ||
    ROLE_OPTIONS[0];

  // Filter options by search text
  const filteredOptions = ROLE_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close when clicking outside
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

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (option: RoleOption) => {
    onRoleSelect(option.key, option.defaultPage);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {showLabel && (
        <span className="block text-[11px] font-bold text-[#64748b] leading-tight mb-1 select-none">
          Current role
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="h-[36px] min-w-[150px] w-full px-3 bg-white border border-[#d1d5db] rounded-lg flex items-center justify-between gap-2 text-left shadow-2xs hover:border-[#0096c7] focus:outline-none focus:ring-2 focus:ring-[#0096c7]/20 focus:border-[#0096c7] transition-all cursor-pointer"
      >
        <span className="text-xs sm:text-sm font-bold text-[#1e293b] truncate">
          {activeOption.label}
        </span>
        <DownOutlined className={`text-[10px] text-[#64748b] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel matching user's exact screenshot */}
      {isOpen && (
        <div className="absolute right-0 top-full z-[3000] mt-1.5 w-full min-w-[15rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
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

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.map((opt) => {
              const isSelected = opt.key === activeOption.key;
              return (
                <button
                  key={opt.key}
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
                No roles match "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcherSelect;
