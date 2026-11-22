import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadOutlined,
  LoadingOutlined,
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  PictureOutlined,
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
  accept?: string;
  maxSizeMB?: number;
}

export const AppImageUpload: React.FC<AppImageUploadProps> = ({
  value = '',
  onChange,
  onUpload,
  loading: externalLoading = false,
  disabled = false,
  placeholder = 'Paste image URL or Ctrl+V file/link',
  fallbackInitial,
  className = '',
  label,
  helperText,
  accept = 'image/*',
  maxSizeMB = 5,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isLoading = externalLoading || internalLoading;

  // Process File from browse, drag-drop, or Ctrl+V clipboard
  const processFile = useCallback(
    async (file: File) => {
      if (disabled || isLoading) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      // Validate file size
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
          // Local fallback preview if no upload handler
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

  // Global & Local Paste Handler: Detects copied image files and URLs
  const handlePaste = useCallback(
    (e: React.ClipboardEvent | ClipboardEvent) => {
      if (disabled || isLoading) return;

      const clipboardData = (e as React.ClipboardEvent).clipboardData || (e as ClipboardEvent).clipboardData;
      if (!clipboardData) return;

      // 1. Check for Image Files in Clipboard (from File Explorer, screenshots, browser copy image)
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

      // Check clipboard files directly
      if (clipboardData.files && clipboardData.files.length > 0) {
        const file = clipboardData.files[0];
        if (file && file.type.startsWith('image/')) {
          e.preventDefault();
          processFile(file);
          return;
        }
      }

      // 2. Check for Text (Image URL or Base64 Data URL)
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

  // Listen to paste when container is focused or active
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

  // Drag and drop handlers
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
      const file = e.dataTransfer.files[0];
      processFile(file);
    } else {
      // Check for dropped URL text
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // Reset file input value so same file can be selected again
    e.target.value = '';
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const hasImage = Boolean(value && value.trim());

  return (
    <div className={`app-image-upload space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      {/* Main Container with Drag, Focus, and Paste support */}
      <div
        ref={containerRef}
        tabIndex={0}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex items-center gap-3.5 p-3 rounded-xl border transition-all outline-none ${
          isDragOver
            ? 'border-[#0096C7] bg-sky-50/80 ring-2 ring-[#0096C7]/20 shadow-xs'
            : isFocused
            ? 'border-[#0096C7] bg-white ring-1 ring-[#0096C7]/30 shadow-2xs'
            : hasImage
            ? 'border-slate-200/90 bg-slate-50/60'
            : 'border-slate-200/90 bg-slate-50/40 hover:border-slate-300'
        }`}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          disabled={disabled || isLoading}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Left Box: Thumbnail / Uploader Button */}
        <div
          onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
          className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden cursor-pointer flex flex-col items-center justify-center transition-all select-none group border ${
            hasImage
              ? 'border-slate-200 bg-white shadow-2xs'
              : 'border-dashed border-slate-300 bg-white hover:border-[#0096C7] hover:bg-sky-50/40'
          }`}
          title="Click to browse image from folder, or drop / Ctrl+V"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-1 text-center">
              <LoadingOutlined className="text-lg text-[#0096C7] mb-0.5" spin />
              <span className="text-[8px] font-semibold text-slate-500">Uploading</span>
            </div>
          ) : hasImage ? (
            <>
              <img
                src={value}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (fallbackInitial) {
                    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%230096C7"/><text x="32" y="40" font-size="28" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">${fallbackInitial.toUpperCase()}</text></svg>`;
                  }
                }}
              />
              <div className="absolute inset-0 bg-black/55 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-bold">
                <UploadOutlined className="text-xs mb-0.5" />
                <span>Change</span>
              </div>
            </>
          ) : fallbackInitial ? (
            <>
              <div
                className="w-full h-full flex flex-col items-center justify-center text-white font-black text-xl"
                style={{ backgroundColor: '#0096C7' }}
              >
                {fallbackInitial.toUpperCase()}
              </div>
              <div className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-[9px] font-semibold">
                <UploadOutlined className="text-xs mb-0.5" />
                <span>Upload</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#0096C7] transition-colors p-1">
              <PlusOutlined className="text-sm mb-0.5" />
              <span className="text-[9px] font-bold leading-none">Upload</span>
            </div>
          )}
        </div>

        {/* Right Section: Info, Smart URL Input, and Actions */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-800">
                {hasImage ? 'Image Attached' : 'Attach Image'}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-200/80 text-slate-700">
                <kbd className="font-mono">Ctrl+V</kbd> to paste
              </span>
            </div>

            {hasImage && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled || isLoading}
                className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                title="Remove current image"
              >
                <DeleteOutlined className="text-[9px]" />
                <span>Remove</span>
              </button>
            )}
          </div>

          {/* Paste URL or Edit Text Input */}
          <div className="relative flex items-center">
            <LinkOutlined className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <input
              type="text"
              placeholder={placeholder}
              value={value}
              disabled={disabled || isLoading}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              className="w-full pl-7 pr-3 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-[#0096C7] focus:border-[#0096C7] outline-none transition-all"
            />
          </div>

          <p className="text-[10px] text-slate-500 leading-tight">
            {helperText || 'Browse, drag & drop, or Ctrl+V anywhere to auto-detect image files, screenshots, or URLs.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppImageUpload;
