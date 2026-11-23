import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PlusOutlined,
  DeleteOutlined,
  SwapOutlined,
  EyeOutlined,
} from '@ant-design/icons';

export interface AppImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string | void> | void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  fallbackInitial?: string;
  className?: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export const AppImageUpload: React.FC<AppImageUploadProps> = ({
  value = '',
  onChange,
  onUpload,
  loading: externalLoading = false,
  disabled = false,
  fallbackInitial,
  className = '',
  label,
  accept = 'image/*',
  maxSizeMB = 10,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoading = externalLoading || internalLoading;

  // Process selected/dropped/pasted file
  const processFile = useCallback(
    async (file: File) => {
      if (disabled || isLoading) return;

      if (!file.type.startsWith('image/')) {
        return;
      }

      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        alert(`File exceeds maximum size limit of ${maxSizeMB}MB`);
        return;
      }

      setInternalLoading(true);
      try {
        if (onUpload) {
          const resultUrl = await onUpload(file);
          if (typeof resultUrl === 'string' && resultUrl.trim()) {
            onChange(resultUrl.trim());
          }
        } else {
          const localUrl = URL.createObjectURL(file);
          onChange(localUrl);
        }
      } catch (err) {
        console.error('Image processing error:', err);
      } finally {
        setInternalLoading(false);
      }
    },
    [disabled, isLoading, maxSizeMB, onUpload, onChange]
  );

  // Global & Local Paste Handler (Ctrl+V)
  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      if (disabled || isLoading) return;

      const clipboardData = (e as React.ClipboardEvent).clipboardData || (e as ClipboardEvent).clipboardData;
      if (!clipboardData) return;

      // 1. Files in clipboard (screenshots, copied image from file explorer)
      const items = clipboardData.items;
      if (items && items.length > 0) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              e.preventDefault();
              processFile(file);
              return;
            }
          }
        }
      }

      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file && file.type.startsWith('image/')) {
          e.preventDefault();
          processFile(file);
          return;
        }
      }

      // 2. Direct text URL in clipboard
      const text = clipboardData.getData('text').trim();
      if (text) {
        const isUrl =
          text.startsWith('http://') ||
          text.startsWith('https://') ||
          text.startsWith('data:image/') ||
          text.startsWith('blob:');

        if (isUrl) {
          e.preventDefault();
          onChange(text);
        }
      }
    },
    [disabled, isLoading, onChange, processFile]
  );

  // Focus paste listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onNativePaste = (e: ClipboardEvent) => {
      if (document.activeElement && el.contains(document.activeElement)) {
        handlePaste(e);
      }
    };

    window.addEventListener('paste', onNativePaste);
    return () => {
      window.removeEventListener('paste', onNativePaste);
    };
  }, [handlePaste]);

  // Drag-and-drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    } else {
      const droppedText = e.dataTransfer.getData('text').trim();
      if (
        droppedText.startsWith('http://') ||
        droppedText.startsWith('https://') ||
        droppedText.startsWith('data:image/')
      ) {
        onChange(droppedText);
      }
    }
  };

  const hasImage = Boolean(value && value.trim());

  return (
    <div className={`app-image-upload space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        disabled={disabled || isLoading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
          }
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Picture-Card Container matching reference */}
      <div
        ref={containerRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="inline-block outline-none"
      >
        {isLoading ? (
          /* Uploading Picture-Card State */
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-dashed border-slate-700 bg-[#16171a] flex flex-col items-center justify-center p-2 text-center select-none shadow-xs">
            <span className="text-xs font-semibold text-slate-200 mb-2.5">Uploading...</span>
            <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#0096C7] rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        ) : hasImage ? (
          /* Uploaded Picture-Card State: Rounded picture thumbnail card with hover actions */
          <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-800 bg-[#16171a] p-1.5 flex items-center justify-center overflow-hidden shadow-xs select-none">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (fallbackInitial) {
                  target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="16" fill="%230096C7"/><text x="48" y="60" font-size="44" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">${fallbackInitial.toUpperCase()}</text></svg>`;
                }
              }}
            />

            {/* Hover Actions: Replace & Delete */}
            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Replace image (or Ctrl+V)"
              >
                <SwapOutlined className="text-xs" />
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="w-7 h-7 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Remove image"
              >
                <DeleteOutlined className="text-xs" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Picture-Card: Dashed card with + and Upload */
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-dashed flex flex-col items-center justify-center cursor-pointer transition-all select-none ${
              isDragOver
                ? 'border-[#0096C7] bg-[#1e2329] ring-2 ring-[#0096C7]/50 shadow-md'
                : 'border-slate-700 bg-[#16171a] hover:border-slate-500 hover:bg-[#1a1c1f]'
            }`}
            title="Click to upload, drag & drop, or Ctrl+V"
          >
            <PlusOutlined className="text-base text-slate-300 mb-1" />
            <span className="text-xs font-semibold text-slate-300">Upload</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppImageUpload;
