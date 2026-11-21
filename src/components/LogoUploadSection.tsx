import React, { useRef, useState } from 'react';
import { ImagePlus, RefreshCw, RotateCcw, Trash2, Upload } from 'lucide-react';
import {
  OFFICIAL_UNIVERSITY_LOGO_NAME,
  OFFICIAL_UNIVERSITY_LOGO_PATH,
  validateLogoFile,
} from '../utils/coverPageLogic';

interface LogoUploadSectionProps {
  logoDataUrl: string | null;
  logoFileName: string | null;
  onLogoChange: (dataUrl: string | null, fileName: string | null) => void;
}

export const LogoUploadSection: React.FC<LogoUploadSectionProps> = ({
  logoDataUrl,
  logoFileName,
  onLogoChange,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isUsingOfficialLogo = logoDataUrl === OFFICIAL_UNIVERSITY_LOGO_PATH;

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Unable to load this image.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onLogoChange(reader.result, file.name);
      }
    };
    reader.onerror = () => {
      setUploadError('Could not read the selected image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleRemove = () => {
    setUploadError(null);
    onLogoChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRestoreOfficial = () => {
    setUploadError(null);
    onLogoChange(OFFICIAL_UNIVERSITY_LOGO_PATH, OFFICIAL_UNIVERSITY_LOGO_NAME);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="university-logo-input"
          className="text-xs font-semibold text-[#111827]"
        >
          Official University Logo
        </label>
        <span className="text-xs text-[#6B7280]">PNG, JPG, JPEG, WEBP</span>
      </div>

      <input
        ref={inputRef}
        id="university-logo-input"
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
        onChange={handleInputChange}
        className="sr-only"
      />

      {logoDataUrl ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#D1D5DB] bg-[#F9FAFB] p-3.5">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded border border-[#E5E7EB] bg-white p-1">
              <img
                src={logoDataUrl}
                alt="Netrokona University Logo Preview"
                className="max-h-full max-w-full h-auto w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#111827]">
                {logoFileName || 'University Logo'}
              </p>
              <p className="mt-0.5 text-xs text-[#4B5563]">
                Original aspect ratio preserved on cover page and PDF
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isUsingOfficialLogo && (
              <button
                type="button"
                onClick={handleRestoreOfficial}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restore Official</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] whitespace-nowrap cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Replace Logo</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remove uploaded university logo"
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-[#FECACA] bg-white px-3 py-1.5 text-xs font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF2F2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C] whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${
            isDragging
              ? 'border-[#111827] bg-[#F3F4F6]'
              : 'border-[#D1D5DB] bg-[#F9FAFB] hover:border-[#9CA3AF]'
          }`}
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded border border-[#E5E7EB] bg-white text-[#111827]">
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[#111827]">
            Upload University Logo
          </p>
          <p className="mt-1 max-w-sm text-xs text-[#4B5563]">
            Appears centered at the top of your cover page. Leave empty for a
            text-only university header.
          </p>
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#111827] bg-white px-4 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#111827] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] whitespace-nowrap cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Choose Logo Image</span>
            </button>
            <button
              type="button"
              onClick={handleRestoreOfficial}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-md border border-[#D1D5DB] bg-white px-3.5 py-2 text-xs font-semibold text-[#111827] transition-colors hover:bg-[#F3F4F6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Use Official Logo</span>
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p role="alert" className="text-xs font-medium text-[#B91C1C]">
          {uploadError}
        </p>
      )}
    </div>
  );
};
