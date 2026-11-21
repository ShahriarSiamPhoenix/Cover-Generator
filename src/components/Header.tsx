import React from 'react';
import { Download, GraduationCap, Loader2 } from 'lucide-react';

interface HeaderProps {
  logoDataUrl: string | null;
  isExporting: boolean;
  onDownloadPdf: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  logoDataUrl,
  isExporting,
  onDownloadPdf,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-[#DCE3EC] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-3.5 py-3 sm:gap-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Brand Identity */}
        <a
          href="#top"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] sm:gap-3 lg:flex-initial"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#D1D5DB] bg-white p-0.5">
            {logoDataUrl ? (
              <img
                src={logoDataUrl}
                alt="Netrokona University Logo"
                className="max-h-full max-w-full h-auto w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <GraduationCap
                className="h-5 w-5 text-[#0F294A]"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-[15px] font-bold tracking-tight text-[#111827] sm:text-lg">
              Netrokona University
            </span>
            <span className="block truncate text-[11px] font-normal text-[#4B5563] sm:text-xs">
              Academic Cover Page Generator
            </span>
          </div>
        </a>

        {/* Zone 2: Section Navigation */}
        <nav
          aria-label="Form Sections"
          className="hidden items-center gap-6 text-sm font-medium text-[#475569] lg:flex"
        >
          <a
            href="#section-document"
            className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#0F294A] hover:underline hover:underline-offset-4"
          >
            Document
          </a>
          <a
            href="#section-course"
            className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#0F294A] hover:underline hover:underline-offset-4"
          >
            Course
          </a>
          <a
            href="#section-student"
            className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#0F294A] hover:underline hover:underline-offset-4"
          >
            Student
          </a>
          <a
            href="#section-teacher"
            className="whitespace-nowrap shrink-0 py-1 transition-colors hover:text-[#0F294A] hover:underline hover:underline-offset-4"
          >
            Submitted To
          </a>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isExporting}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#0F294A] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#173B68] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] sm:gap-2 sm:px-4 sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
