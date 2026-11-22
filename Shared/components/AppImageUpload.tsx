import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadOutlined,
  LoadingOutlined,
  LinkOutlined,
  DeleteOutlined,
  PictureOutlined,
  CheckCircleOutlined,
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
  helperText?: string;
  title?: string;
  accept?: string;
  maxSizeMB?: number;
}

export const AppImageUpload: React.FC<AppImageUploadProps> = ({
  value = '',
  onChange,
  onUpload,
  loading: externalLoading = false,
  disabled = false,
  placeholder = 'https://example.com/image.png',
  fallbackInitial,
  className = '',
  label,
  helperText,
  title = 'Upload image',
  accept = 'image/*',
  maxSizeMB = 5,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoading = externalLoading || internalLoading;

  // Process a selected/dropped/pasted file
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

      // 1. Files in clipboard (screenshots, copied image from file explorer or browser)
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
          setShowUrlInput(false);
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

  // Focus input when URL mode is opened
  useEffect(() => {
    if (showUrlInput) {
      setTimeout(() => urlInputRef.current?.focus(), 50);
    }
  }, [showUrlInput]);

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

  const handleApplyUrl = () => {
    const clean = urlDraft.trim();
    if (clean) {
      onChange(clean);
      setUrlDraft('');
      setShowUrlInput(false);
    }
  };

  const hasImage = Boolean(value && value.trim());

  return (
    <div className={`app-image-upload space-y-1 ${className}`}>
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

      {/* Outer Card Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full rounded-2xl p-2.5 sm:p-3 transition-all outline-none ${
          isDragOver
            ? 'bg-sky-50/90 ring-2 ring-[#0096C7] shadow-xs'
            : 'bg-slate-50/80 border border-slate-200/90'
        }`}
      >
        {isLoading ? (
          /* Loading State */
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <LoadingOutlined className="text-3xl text-[#0096C7] mb-2" spin />
            <span className="text-xs font-bold text-slate-800">Processing image...</span>
            <span className="text-[10px] text-slate-400">Please wait while the image is being uploaded</span>
          </div>
        ) : hasImage ? (
          /* Attached State with Preview & Action Pills */
          <div className="flex flex-col sm:flex-row items-center gap-3.5 p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs group">
              <img
                src={value}
                alt="Brand Logo / Upload Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (fallbackInitial) {
                    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="16" fill="%230096C7"/><text x="48" y="60" font-size="44" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">${fallbackInitial.toUpperCase()}</text></svg>`;
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer"
                title="Change file"
              >
                <SwapOutlined className="text-sm mb-0.5" />
                <span>Replace</span>
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <CheckCircleOutlined className="text-emerald-500 text-xs" />
                <span className="text-xs font-bold text-slate-800">Image Attached</span>
                <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  Ctrl+V to swap
                </span>
              </div>

              <p className="text-[11px] text-slate-500 truncate block font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200/60 max-w-full">
                {value}
              </p>

              {/* Action Pills */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-full bg-[#0096C7] hover:bg-[#0083ae] text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  <UploadOutlined className="text-[10px]" />
                  <span>Change file</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                >
                  <LinkOutlined className="text-[10px] text-slate-500" />
                  <span>Edit URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="px-3 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold flex items-center gap-1 border border-rose-200/70 transition-colors cursor-pointer"
                >
                  <DeleteOutlined className="text-[10px]" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Quick URL Edit Drawer when clicked */}
              {showUrlInput && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    ref={urlInputRef}
                    type="text"
                    defaultValue={value}
                    placeholder="Enter or paste new image URL..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onChange((e.target as HTMLInputElement).value);
                        setShowUrlInput(false);
                      }
                    }}
                    className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:ring-1 focus:ring-[#0096C7] outline-none"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousSibling as HTMLInputElement);
                      if (input?.value) onChange(input.value);
                      setShowUrlInput(false);
                    }}
                    className="px-2.5 py-1 rounded-md bg-[#0096C7] text-white text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Picsart-Style Empty Dropzone */
          <div
            className={`w-full rounded-xl border-2 border-dashed py-5 px-4 flex flex-col items-center justify-center text-center transition-all bg-white ${
              isDragOver
                ? 'border-[#0096C7] bg-sky-50/50'
                : 'border-slate-300 hover:border-[#0096C7] hover:bg-sky-50/20'
            }`}
          >
            {/* Center Circular Icon */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-11 h-11 rounded-full bg-sky-50 text-[#0096C7] border border-sky-100 flex items-center justify-center text-lg mb-2 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
              title="Click to select file"
            >
              <PictureOutlined />
            </div>

            {/* Title & Subtitle */}
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight mb-0.5">
              {title}
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mb-3">
              {helperText || (
                <>
                  Upload or drag and drop, or press{' '}
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border border-slate-200 font-mono text-slate-700 font-bold">
                    Ctrl+V
                  </kbd>{' '}
                  to paste
                </>
              )}
            </p>

            {/* Two Action Pills: [ Add a file ] [ Add a URL ] */}
            <div className="flex items-center justify-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-1.5 rounded-full bg-[#0096C7] hover:bg-[#0083ae] active:bg-[#007096] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <UploadOutlined className="text-xs" />
                <span>Add a file</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
              >
                <LinkOutlined className="text-xs text-slate-500" />
                <span>Add a URL</span>
              </button>
            </div>

            {/* Inline URL Input (Toggled by "Add a URL") */}
            {showUrlInput && (
              <div className="w-full max-w-sm mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                <input
                  ref={urlInputRef}
                  type="text"
                  placeholder={placeholder}
                  value={urlDraft}
                  onChange={(e) => setUrlDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyUrl();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-[#0096C7] focus:border-[#0096C7] outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlDraft.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#0096C7] hover:bg-[#0083ae] disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppImageUpload;
