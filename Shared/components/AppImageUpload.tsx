import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CloudUploadOutlined,
  LoadingOutlined,
  CloseOutlined,
  SwapOutlined,
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
  title?: string;
  subtitle?: string;
  buttonText?: string;
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
  title = 'Choose a file or drag & drop here.',
  subtitle = 'JPEG, PNG, up to 10 MB.',
  buttonText = 'Browse File',
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

      {/* Main Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="outline-none"
      >
        {isLoading ? (
          /* Loading State */
          <div className="w-full h-32 rounded-2xl bg-[#111214] border border-slate-800 flex flex-col items-center justify-center text-center p-4">
            <LoadingOutlined className="text-2xl text-[#0096C7] mb-2" spin />
            <span className="text-xs font-semibold text-slate-200">Uploading image...</span>
          </div>
        ) : hasImage ? (
          /* Uploaded Image Preview: Clean image card with NO text/URL clutter */
          <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden bg-[#111214] border border-slate-800 shadow-sm group flex items-center justify-center select-none">
            <img
              src={value}
              alt="Uploaded preview"
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (fallbackInitial) {
                  target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="16" fill="%230096C7"/><text x="48" y="60" font-size="44" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">${fallbackInitial.toUpperCase()}</text></svg>`;
                }
              }}
            />

            {/* Top-Right Remove Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/65 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition-colors cursor-pointer shadow-md z-10"
              title="Remove image"
            >
              <CloseOutlined className="text-[10px]" />
            </button>

            {/* Hover Overlay with Replace Button */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-slate-900 font-bold text-xs shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <SwapOutlined className="text-xs" />
                <span>Replace Image</span>
              </button>
            </div>
          </div>
        ) : (
          /* Empty Dropzone matching the user's reference image */
          <div
            className={`w-full rounded-2xl bg-[#111214] border transition-all py-6 px-4 flex flex-col items-center justify-center text-center cursor-pointer select-none ${
              isDragOver
                ? 'border-[#0096C7] ring-2 ring-[#0096C7]/50 shadow-md'
                : 'border-slate-800 hover:border-slate-700'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Center Cloud Upload Icon */}
            <div className="w-9 h-9 rounded-full bg-[#1e2023] border border-slate-700/60 text-slate-300 flex items-center justify-center text-sm mb-2 shadow-xs">
              <CloudUploadOutlined />
            </div>

            {/* Title */}
            <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight mb-0.5">
              {title}
            </h4>

            {/* Subtitle */}
            <p className="text-[11px] text-slate-400 font-normal mb-3.5">
              {subtitle}
            </p>

            {/* Browse File Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              {buttonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppImageUpload;
