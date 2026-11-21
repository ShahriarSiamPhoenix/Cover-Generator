import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  PenLine,
  Printer,
  RotateCcw,
  X,
  AlertCircle,
} from 'lucide-react';
import type {
  CoverPageData,
  DocumentType,
  FacultyName,
  ValidationErrors,
  ValidationField,
} from './types/coverPage';
import {
  createDefaultCoverPageData,
  getRequiredProgress,
  hasValidationErrors,
  resetCoverPageData,
  selectDepartment,
  selectFaculty,
  switchDocumentType,
  validateCoverPageData,
} from './utils/coverPageLogic';
import { exportCoverPageToPdf } from './utils/pdfExport';
import { Header } from './components/Header';
import { CoverPageForm } from './components/CoverPageForm';
import { LiveA4Preview } from './components/LiveA4Preview';
import { CoverPageSheet } from './components/CoverPageSheet';
import { ResetConfirmDialog } from './components/ResetConfirmDialog';

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

const FIELD_ELEMENT_IDS: Record<ValidationField, string> = {
  faculty: 'university-faculty',
  department: 'university-department',
  courseCode: 'course-code',
  courseTitle: 'course-title',
  experimentNumber: 'experiment-number',
  experimentName: 'experiment-name',
  submissionDate: 'submission-date',
  studentName: 'student-name',
  studentId: 'class-roll',
  teacherName: 'teacher-name',
  teacherDesignation: 'teacher-designation',
};

export default function App() {
  const [data, setData] = useState<CoverPageData>(() =>
    createDefaultCoverPageData()
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const exportSheetContainerRef = useRef<HTMLDivElement | null>(null);
  const previewAnchorRef = useRef<HTMLDivElement | null>(null);
  const formAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const clearFieldError = useCallback((field: ValidationField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      if (Object.keys(next).length === 0) {
        setToast((curr) => (curr?.type === 'error' ? null : curr));
      }
      return next;
    });
  }, []);

  const handleDocumentTypeChange = useCallback((nextType: DocumentType) => {
    setData((prev) => switchDocumentType(prev, nextType));
    setErrors((prev) => {
      if (nextType === 'assignment') {
        const next = { ...prev };
        delete next.experimentNumber;
        delete next.experimentName;
        return next;
      }
      return prev;
    });
  }, []);

  const handleFacultyChange = useCallback(
    (nextFaculty: FacultyName | '') => {
      setData((prev) => selectFaculty(prev, nextFaculty));
      clearFieldError('faculty');
      clearFieldError('department');
    },
    [clearFieldError]
  );

  const handleDepartmentChange = useCallback(
    (nextDepartment: string) => {
      setData((prev) => selectDepartment(prev, nextDepartment));
      clearFieldError('department');
    },
    [clearFieldError]
  );

  const handleStudentChange = useCallback(
    (field: keyof CoverPageData['student'], value: string) => {
      setData((prev) => ({
        ...prev,
        student: { ...prev.student, [field]: value },
      }));
      if (field === 'name') clearFieldError('studentName');
      if (field === 'studentId') clearFieldError('studentId');
    },
    [clearFieldError]
  );

  const handleCourseChange = useCallback(
    (field: keyof CoverPageData['course'], value: string) => {
      setData((prev) => ({
        ...prev,
        course: { ...prev.course, [field]: value },
      }));
      if (field === 'courseCode') clearFieldError('courseCode');
      if (field === 'courseTitle') clearFieldError('courseTitle');
      if (field === 'experimentNumber') clearFieldError('experimentNumber');
      if (field === 'experimentName') clearFieldError('experimentName');
      if (field === 'submissionDate') clearFieldError('submissionDate');
    },
    [clearFieldError]
  );

  const handleTeacherChange = useCallback(
    (field: keyof CoverPageData['teacher'], value: string) => {
      setData((prev) => ({
        ...prev,
        teacher: { ...prev.teacher, [field]: value },
      }));
      if (field === 'name') clearFieldError('teacherName');
      if (field === 'designation') clearFieldError('teacherDesignation');
    },
    [clearFieldError]
  );

  const handleLogoChange = useCallback(
    (logoDataUrl: string | null, logoFileName: string | null) => {
      setData((prev) => ({
        ...prev,
        logoDataUrl,
        logoFileName,
      }));
    },
    []
  );

  const focusFirstInvalidField = (validationErrors: ValidationErrors) => {
    const orderedFields: ValidationField[] = [
      'faculty',
      'department',
      'courseCode',
      'courseTitle',
      'experimentNumber',
      'experimentName',
      'submissionDate',
      'studentName',
      'studentId',
      'teacherName',
      'teacherDesignation',
    ];
    const firstKey = orderedFields.find((key) => Boolean(validationErrors[key]));
    if (!firstKey) return;

    const el = document.getElementById(FIELD_ELEMENT_IDS[firstKey]);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  };

  const handleDownloadPdf = useCallback(async () => {
    const validationErrors = validateCoverPageData(data);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      focusFirstInvalidField(validationErrors);
      setToast({
        type: 'error',
        message: 'Please fill in all required fields before downloading.',
      });
      return;
    }

    const sheetEl = exportSheetContainerRef.current?.querySelector(
      '.a4-sheet-root'
    ) as HTMLElement | null;

    if (!sheetEl) {
      setToast({
        type: 'error',
        message: 'Cover page preview is not ready. Please try again.',
      });
      return;
    }

    try {
      setIsExporting(true);
      const filename = await exportCoverPageToPdf(sheetEl, data.documentType);
      setToast({
        type: 'success',
        message: `Downloaded ${filename} successfully.`,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      setToast({
        type: 'error',
        message:
          'Unable to generate the PDF automatically. You can also use Print Cover Page to save as PDF.',
      });
    } finally {
      setIsExporting(false);
    }
  }, [data]);

  const handlePrint = useCallback(() => {
    const validationErrors = validateCoverPageData(data);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      focusFirstInvalidField(validationErrors);
      setToast({
        type: 'error',
        message: 'Please complete the required fields before printing.',
      });
      return;
    }

    window.print();
  }, [data]);

  const handleConfirmReset = useCallback(() => {
    setData(resetCoverPageData());
    setErrors({});
    setIsResetDialogOpen(false);
    setToast({
      type: 'success',
      message: 'All form fields have been reset to defaults.',
    });
  }, []);

  const progress = getRequiredProgress(data);

  return (
    <div id="top" className="min-h-screen bg-[#F5F7FA] text-[#0F172A]">
      <Header
        logoDataUrl={data.logoDataUrl}
        isExporting={isExporting}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Main Application Shell */}
      <main className="no-print mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Compact Workspace Title & Quick Mobile Jump Bar */}
        <div className="mb-6 flex flex-col gap-4 border-b border-[#DCE3EC] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[#111827] sm:text-2xl"
              style={{ textWrap: 'balance' }}
            >
              Academic Cover Page Builder
            </h1>
            <p className="mt-1 text-sm text-[#475569]">
              Netrokona University · {progress.completed} of {progress.total}{' '}
              required fields completed · Updates A4 preview in real time
            </p>
          </div>

          {/* Mobile/Tablet Quick Navigation between Form & Preview */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() =>
                formAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-xs font-semibold text-[#0F294A] transition-colors hover:bg-[#F8FAFC] cursor-pointer"
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit Form</span>
            </button>
            <button
              type="button"
              onClick={() =>
                previewAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#0F294A] bg-[#F4F7FB] px-3.5 py-2 text-xs font-semibold text-[#0F294A] transition-colors hover:bg-[#E7EEF7] cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              <span>View A4 Preview</span>
            </button>
          </div>
        </div>

        {/* Desktop 2-Column Split: Form Left, Sticky Live A4 Preview Right */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div ref={formAnchorRef} className="scroll-mt-24 lg:col-span-6 xl:col-span-6">
            <CoverPageForm
              data={data}
              errors={errors}
              onDocumentTypeChange={handleDocumentTypeChange}
              onFacultyChange={handleFacultyChange}
              onDepartmentChange={handleDepartmentChange}
              onStudentChange={handleStudentChange}
              onCourseChange={handleCourseChange}
              onTeacherChange={handleTeacherChange}
              onLogoChange={handleLogoChange}
            />

            {/* Bottom Form Action Strip (Helpful after completing the form) */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE3EC] bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setIsResetDialogOpen(true)}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#64748B] transition-colors hover:border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#B91C1C] cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>Reset Form</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-xs font-semibold text-[#0F294A] transition-colors hover:bg-[#F8FAFC] sm:text-sm cursor-pointer"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>Print Cover Page</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isExporting}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#0F294A] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#173B68] disabled:opacity-65 sm:text-sm cursor-pointer"
                >
                  <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>

          <div
            ref={previewAnchorRef}
            className="scroll-mt-24 lg:sticky lg:top-20 lg:col-span-6 xl:col-span-6"
          >
            <LiveA4Preview
              data={data}
              isExporting={isExporting}
              onDownloadPdf={handleDownloadPdf}
              onPrint={handlePrint}
              onRequestReset={() => setIsResetDialogOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Quiet Institutional & Developer Credit Footer (excluded from print and PDF) */}
      <footer className="no-print mt-12 border-t border-[#DCE3EC] bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2.5 px-4 py-5 text-xs text-[#64748B] sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center sm:text-left">
            Netrokona University Cover Page Generator
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center sm:justify-end">
            <p>
              Developed by{' '}
              <a
                href="https://siam-portfollio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#111827] underline decoration-[#94A3B8] underline-offset-4 transition-colors hover:text-[#0F294A] hover:decoration-[#0F294A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] rounded-sm"
              >
                Shahriar Hossain Siam
              </a>
              <span className="text-[#64748B]"> · CSE Student</span>
            </p>
            <span aria-hidden="true" className="text-[#CBD5E1]">
              ·
            </span>
            <a
              href="https://siam-portfollio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#475569] underline decoration-transparent underline-offset-4 transition-colors hover:text-[#111827] hover:decoration-[#475569] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] rounded-sm whitespace-nowrap"
            >
              About Developer
            </a>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-40 max-w-sm"
        >
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
              toast.type === 'success'
                ? 'border-[#BBF7D0] bg-white text-[#14532D]'
                : 'border-[#FECACA] bg-white text-[#991B1B]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]"
                aria-hidden="true"
              />
            )}
            <p className="text-xs font-medium leading-relaxed text-[#0F172A]">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="ml-1 shrink-0 rounded p-0.5 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <ResetConfirmDialog
        isOpen={isResetDialogOpen}
        onCancel={() => setIsResetDialogOpen(false)}
        onConfirm={handleConfirmReset}
      />

      {/* Unscaled Offscreen A4 Target strictly for Crisp 1:1 High-DPI PDF Export */}
      <div
        ref={exportSheetContainerRef}
        aria-hidden="true"
        className="no-print pointer-events-none fixed left-[-9999px] top-0 overflow-hidden"
        style={{ width: '794px', height: '1123px' }}
      >
        <CoverPageSheet data={data} forExport />
      </div>

      {/* Dedicated Single-Page A4 Print Portal (visible exclusively during @media print) */}
      <div id="print-cover-portal" aria-hidden="true">
        <CoverPageSheet data={data} forExport />
      </div>
    </div>
  );
}
