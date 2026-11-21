import React, { useEffect, useRef, useState } from 'react';
import { Download, Loader2, Maximize2, Minimize2, Printer, RotateCcw } from 'lucide-react';
import type { CoverPageData } from '../types/coverPage';
import { CoverPageSheet } from './CoverPageSheet';

interface LiveA4PreviewProps {
  data: CoverPageData;
  isExporting: boolean;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onRequestReset: () => void;
}

const SHEET_WIDTH = 794;
const SHEET_HEIGHT = 1123;

export const LiveA4Preview: React.FC<LiveA4PreviewProps> = ({
  data,
  isExporting,
  onDownloadPdf,
  onPrint,
  onRequestReset,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState<number>(0.56);
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const updateScale = () => {
      const availableWidth = Math.max(node.clientWidth - 36, 260);
      const widthScale = availableWidth / SHEET_WIDTH;

      // On desktop split-view, also fit vertically so the full A4 page stays visible in the sticky panel
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        const availableHeight = Math.max(window.innerHeight - 260, 480);
        const heightScale = availableHeight / SHEET_HEIGHT;
        setFitScale(Math.min(widthScale, heightScale, 1));
      } else {
        setFitScale(Math.min(widthScale, 1));
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  const activeScale = zoomMode === 'actual' ? 1 : fitScale;
  const scaledWidth = Math.round(SHEET_WIDTH * activeScale);
  const scaledHeight = Math.round(SHEET_HEIGHT * activeScale);

  return (
    <section
      aria-label="Live A4 Cover Page Preview"
      className="flex flex-col rounded-xl border border-[#DCE3EC] bg-white"
    >
      {/* Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#0F294A]">
            Live A4 Cover Preview
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B] tabular-nums">
            {data.documentType === 'lab-report' ? 'Lab Report' : 'Assignment'} ·
            210 × 297 mm Portrait · {Math.round(activeScale * 100)}%
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setZoomMode((prev) => (prev === 'fit' ? 'actual' : 'fit'))
            }
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F294A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] whitespace-nowrap shrink-0 cursor-pointer"
            aria-label={
              zoomMode === 'fit'
                ? 'Switch preview to 100% actual size'
                : 'Fit preview to panel width'
            }
          >
            {zoomMode === 'fit' ? (
              <>
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>100%</span>
              </>
            ) : (
              <>
                <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Fit Page</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onPrint}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#0F294A] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Print Cover Page</span>
          </button>

          <button
            type="button"
            onClick={onRequestReset}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#64748B] transition-colors hover:border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#B91C1C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset Form</span>
          </button>
        </div>
      </div>

      {/* Archival Drafting Mat Stage */}
      <div
        ref={stageRef}
        className={`flex justify-center bg-[#E9EEF5] p-4 sm:p-6 ${
          zoomMode === 'actual' ? 'overflow-x-auto' : 'overflow-hidden'
        }`}
      >
        <div
          className="relative shrink-0 shadow-[0_12px_36px_rgba(15,41,74,0.14)] ring-1 ring-[#CBD5E1]"
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
            backgroundColor: '#FFFFFF',
          }}
        >
          <div
            style={{
              width: `${SHEET_WIDTH}px`,
              height: `${SHEET_HEIGHT}px`,
              transform: `scale(${activeScale})`,
              transformOrigin: 'top left',
            }}
          >
            <CoverPageSheet data={data} />
          </div>
        </div>
      </div>

      {/* Primary Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#FAFBFD] px-5 py-4 rounded-b-xl">
        <p className="text-xs text-[#64748B]">
          Exports single-page A4 portrait PDF identical to this preview.
        </p>

        <button
          type="button"
          onClick={onDownloadPdf}
          disabled={isExporting}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#0F294A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#173B68] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download PDF</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
};
