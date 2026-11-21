import React from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  FileText,
  FlaskConical,
  GraduationCap,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  FACULTIES,
  TEACHER_DESIGNATIONS,
  type CoverPageData,
  type DocumentType,
  type FacultyName,
  type TeacherDesignation,
  type ValidationErrors,
  type ValidationField,
} from '../types/coverPage';
import { getDepartmentsForFaculty } from '../utils/coverPageLogic';
import { LogoUploadSection } from './LogoUploadSection';

interface CoverPageFormProps {
  data: CoverPageData;
  errors: ValidationErrors;
  onDocumentTypeChange: (type: DocumentType) => void;
  onFacultyChange: (faculty: FacultyName | '') => void;
  onDepartmentChange: (department: string) => void;
  onStudentChange: (field: keyof CoverPageData['student'], value: string) => void;
  onCourseChange: (field: keyof CoverPageData['course'], value: string) => void;
  onTeacherChange: (
    field: keyof CoverPageData['teacher'],
    value: string
  ) => void;
  onLogoChange: (dataUrl: string | null, fileName: string | null) => void;
}

const inputBaseClass =
  'w-full min-h-[42px] rounded-lg border bg-white px-3.5 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F294A]/15';

function getInputClass(hasError: boolean): string {
  return `${inputBaseClass} ${
    hasError
      ? 'border-[#DC2626] focus:border-[#DC2626]'
      : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#0F294A]'
  }`;
}

interface FieldLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  optional?: boolean;
}

function FieldLabel({ htmlFor, label, required, optional }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-semibold text-[#1E293B]"
    >
      {label}
      {required && (
        <span className="ml-1 text-[#DC2626]" aria-hidden="true">
          *
        </span>
      )}
      {optional && (
        <span className="ml-1 font-normal text-[#64748B]">(Optional)</span>
      )}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-[#DC2626]">
      {message}
    </p>
  );
}

export const CoverPageForm: React.FC<CoverPageFormProps> = ({
  data,
  errors,
  onDocumentTypeChange,
  onFacultyChange,
  onDepartmentChange,
  onStudentChange,
  onCourseChange,
  onTeacherChange,
  onLogoChange,
}) => {
  const isLabReport = data.documentType === 'lab-report';
  const errorEntries = Object.entries(errors) as [ValidationField, string][];
  const availableDepartments = getDepartmentsForFaculty(data.university.faculty);

  return (
    <div className="space-y-6">
      {/* Validation Summary Banner */}
      {errorEntries.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3.5 text-sm text-[#991B1B]"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">
                Please complete all required fields before downloading the PDF.
              </p>
              <p className="mt-0.5 text-xs text-[#B91C1C]">
                {errorEntries.length}{' '}
                {errorEntries.length === 1
                  ? 'required field needs'
                  : 'required fields need'}{' '}
                attention below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 1. SELECT DOCUMENT TYPE */}
      <section
        id="section-document"
        aria-labelledby="heading-document-type"
        className="scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-white p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2.5 border-b border-[#EEF2F6] pb-3.5">
          <FileText className="h-4 w-4 text-[#0F294A]" aria-hidden="true" />
          <h2
            id="heading-document-type"
            className="text-sm font-bold tracking-wide text-[#0F294A]"
          >
            Select Document Type
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={!isLabReport}
            onClick={() => onDocumentTypeChange('assignment')}
            className={`group flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] cursor-pointer ${
              !isLabReport
                ? 'border-[#0F294A] bg-[#F4F7FB] ring-1 ring-[#0F294A]'
                : 'border-[#DCE3EC] bg-white hover:border-[#94A3B8] hover:bg-[#FAFBFD]'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                !isLabReport
                  ? 'bg-[#0F294A] text-white'
                  : 'bg-[#EFF3F8] text-[#475569] group-hover:text-[#0F294A]'
              }`}
            >
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-[#0F294A]">
                Assignment
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-[#64748B]">
                Formal academic assignment cover with course and topic details
              </span>
            </div>
          </button>

          <button
            type="button"
            aria-pressed={isLabReport}
            onClick={() => onDocumentTypeChange('lab-report')}
            className={`group flex items-start gap-3.5 rounded-xl border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F294A] cursor-pointer ${
              isLabReport
                ? 'border-[#0F294A] bg-[#F4F7FB] ring-1 ring-[#0F294A]'
                : 'border-[#DCE3EC] bg-white hover:border-[#94A3B8] hover:bg-[#FAFBFD]'
            }`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                isLabReport
                  ? 'bg-[#0F294A] text-white'
                  : 'bg-[#EFF3F8] text-[#475569] group-hover:text-[#0F294A]'
              }`}
            >
              <FlaskConical className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-bold text-[#0F294A]">
                Lab Report
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-[#64748B]">
                Laboratory cover featuring experiment number, name, and dates
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* 2. UNIVERSITY, FACULTY & DEPARTMENT + LOGO UPLOAD */}
      <section
        id="section-university"
        aria-labelledby="heading-university"
        className="scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-white p-5 sm:p-6"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[#EEF2F6] pb-3.5">
          <div className="flex items-center gap-2.5">
            <Building2
              className="h-4 w-4 shrink-0 text-[#0F294A]"
              aria-hidden="true"
            />
            <h2
              id="heading-university"
              className="text-sm font-bold tracking-wide text-[#0F294A]"
            >
              UNIVERSITY & DEPARTMENT
            </h2>
          </div>
          <span className="whitespace-nowrap text-xs text-[#64748B]">
            4 Faculties · 9 Departments
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="university-name" label="University Name" />
            <input
              id="university-name"
              type="text"
              value={data.university.universityName}
              readOnly
              className="w-full min-h-[42px] rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-sm font-medium text-[#334155] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="university-faculty"
                label="Select Faculty"
                required
              />
              <select
                id="university-faculty"
                value={data.university.faculty}
                onChange={(e) =>
                  onFacultyChange(e.target.value as FacultyName | '')
                }
                aria-invalid={Boolean(errors.faculty)}
                aria-describedby={errors.faculty ? 'error-faculty' : undefined}
                className={`${getInputClass(
                  Boolean(errors.faculty)
                )} cursor-pointer`}
              >
                <option value="">Select Faculty</option>
                {FACULTIES.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
              <FieldError id="error-faculty" message={errors.faculty} />
            </div>

            <div>
              <FieldLabel
                htmlFor="university-department"
                label="Select Department"
                required
              />
              <select
                id="university-department"
                value={data.university.department}
                onChange={(e) => onDepartmentChange(e.target.value)}
                disabled={!data.university.faculty}
                aria-invalid={Boolean(errors.department)}
                aria-describedby={
                  errors.department ? 'error-department' : undefined
                }
                className={`${getInputClass(Boolean(errors.department))} ${
                  !data.university.faculty
                    ? 'cursor-not-allowed bg-[#F8FAFC] text-[#94A3B8]'
                    : 'cursor-pointer'
                }`}
              >
                <option value="">
                  {data.university.faculty
                    ? 'Select Department'
                    : 'Select Faculty first'}
                </option>
                {availableDepartments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
              <FieldError id="error-department" message={errors.department} />
            </div>
          </div>

          <div className="pt-2 border-t border-[#EEF2F6]">
            <LogoUploadSection
              logoDataUrl={data.logoDataUrl}
              logoFileName={data.logoFileName}
              onLogoChange={onLogoChange}
            />
          </div>
        </div>
      </section>

      {/* 3. COURSE INFORMATION */}
      <section
        id="section-course"
        aria-labelledby="heading-course"
        className="scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-white p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2.5 border-b border-[#EEF2F6] pb-3.5">
          <BookOpen className="h-4 w-4 text-[#0F294A]" aria-hidden="true" />
          <h2
            id="heading-course"
            className="text-sm font-bold tracking-wide text-[#0F294A]"
          >
            COURSE INFORMATION
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel htmlFor="course-code" label="Course Code" required />
              <input
                id="course-code"
                type="text"
                value={data.course.courseCode}
                onChange={(e) => onCourseChange('courseCode', e.target.value)}
                placeholder={isLabReport ? 'e.g., CSE-3102' : 'e.g., CSE-3101'}
                aria-invalid={Boolean(errors.courseCode)}
                aria-describedby={
                  errors.courseCode ? 'error-course-code' : undefined
                }
                className={`${getInputClass(Boolean(errors.courseCode))} font-mono`}
              />
              <FieldError id="error-course-code" message={errors.courseCode} />
            </div>

            <div className="sm:col-span-2">
              <FieldLabel
                htmlFor="course-title"
                label="Course Title"
                required
              />
              <input
                id="course-title"
                type="text"
                value={data.course.courseTitle}
                onChange={(e) => onCourseChange('courseTitle', e.target.value)}
                placeholder={
                  isLabReport
                    ? 'e.g., Operating Systems Sessional'
                    : 'e.g., Operating Systems'
                }
                aria-invalid={Boolean(errors.courseTitle)}
                aria-describedby={
                  errors.courseTitle ? 'error-course-title' : undefined
                }
                className={getInputClass(Boolean(errors.courseTitle))}
              />
              <FieldError
                id="error-course-title"
                message={errors.courseTitle}
              />
            </div>
          </div>

          {!isLabReport ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <FieldLabel
                  htmlFor="assignment-topic"
                  label="Assignment Topic"
                />
                <input
                  id="assignment-topic"
                  type="text"
                  value={data.course.assignmentTopic}
                  onChange={(e) =>
                    onCourseChange('assignmentTopic', e.target.value)
                  }
                  placeholder="e.g., Comparative Analysis of CPU Scheduling Algorithms"
                  className={getInputClass(false)}
                />
              </div>

              <div>
                <FieldLabel
                  htmlFor="submission-date"
                  label="Submission Date"
                  required
                />
                <input
                  id="submission-date"
                  type="date"
                  value={data.course.submissionDate}
                  onChange={(e) =>
                    onCourseChange('submissionDate', e.target.value)
                  }
                  aria-invalid={Boolean(errors.submissionDate)}
                  aria-describedby={
                    errors.submissionDate ? 'error-submission-date' : undefined
                  }
                  className={getInputClass(Boolean(errors.submissionDate))}
                />
                <FieldError
                  id="error-submission-date"
                  message={errors.submissionDate}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <FieldLabel
                    htmlFor="experiment-number"
                    label="Experiment Number"
                    required
                  />
                  <input
                    id="experiment-number"
                    type="text"
                    value={data.course.experimentNumber}
                    onChange={(e) =>
                      onCourseChange('experimentNumber', e.target.value)
                    }
                    placeholder="e.g., 04"
                    aria-invalid={Boolean(errors.experimentNumber)}
                    aria-describedby={
                      errors.experimentNumber
                        ? 'error-experiment-number'
                        : undefined
                    }
                    className={`${getInputClass(
                      Boolean(errors.experimentNumber)
                    )} font-mono`}
                  />
                  <FieldError
                    id="error-experiment-number"
                    message={errors.experimentNumber}
                  />
                </div>

                <div className="sm:col-span-2">
                  <FieldLabel
                    htmlFor="experiment-name"
                    label="Experiment Name"
                    required
                  />
                  <input
                    id="experiment-name"
                    type="text"
                    value={data.course.experimentName}
                    onChange={(e) =>
                      onCourseChange('experimentName', e.target.value)
                    }
                    placeholder="e.g., Implementation of Banker's Algorithm in C"
                    aria-invalid={Boolean(errors.experimentName)}
                    aria-describedby={
                      errors.experimentName
                        ? 'error-experiment-name'
                        : undefined
                    }
                    className={getInputClass(Boolean(errors.experimentName))}
                  />
                  <FieldError
                    id="error-experiment-name"
                    message={errors.experimentName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel
                    htmlFor="experiment-date"
                    label="Experiment Date"
                    optional
                  />
                  <input
                    id="experiment-date"
                    type="date"
                    value={data.course.experimentDate}
                    onChange={(e) =>
                      onCourseChange('experimentDate', e.target.value)
                    }
                    className={getInputClass(false)}
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="submission-date"
                    label="Submission Date"
                    required
                  />
                  <input
                    id="submission-date"
                    type="date"
                    value={data.course.submissionDate}
                    onChange={(e) =>
                      onCourseChange('submissionDate', e.target.value)
                    }
                    aria-invalid={Boolean(errors.submissionDate)}
                    aria-describedby={
                      errors.submissionDate
                        ? 'error-submission-date'
                        : undefined
                    }
                    className={getInputClass(Boolean(errors.submissionDate))}
                  />
                  <FieldError
                    id="error-submission-date"
                    message={errors.submissionDate}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. STUDENT INFORMATION */}
      <section
        id="section-student"
        aria-labelledby="heading-student"
        className="scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-white p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2.5 border-b border-[#EEF2F6] pb-3.5">
          <GraduationCap
            className="h-4 w-4 text-[#0F294A]"
            aria-hidden="true"
          />
          <h2
            id="heading-student"
            className="text-sm font-bold tracking-wide text-[#0F294A]"
          >
            STUDENT INFORMATION
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="student-name"
                label="Student Name"
                required
              />
              <input
                id="student-name"
                type="text"
                value={data.student.name}
                onChange={(e) => onStudentChange('name', e.target.value)}
                placeholder="e.g., Tahmid Hasan"
                aria-invalid={Boolean(errors.studentName)}
                aria-describedby={
                  errors.studentName ? 'error-student-name' : undefined
                }
                className={getInputClass(Boolean(errors.studentName))}
              />
              <FieldError
                id="error-student-name"
                message={errors.studentName}
              />
            </div>

            <div>
              <FieldLabel htmlFor="class-roll" label="Class Roll" required />
              <input
                id="class-roll"
                type="text"
                value={data.student.studentId}
                onChange={(e) => onStudentChange('studentId', e.target.value)}
                placeholder="e.g., 210101015"
                aria-invalid={Boolean(errors.studentId)}
                aria-describedby={
                  errors.studentId ? 'error-class-roll' : undefined
                }
                className={`${getInputClass(Boolean(errors.studentId))} font-mono`}
              />
              <FieldError id="error-class-roll" message={errors.studentId} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="registration-number"
                label="Registration Number"
                optional
              />
              <input
                id="registration-number"
                type="text"
                value={data.student.registrationNumber}
                onChange={(e) =>
                  onStudentChange('registrationNumber', e.target.value)
                }
                placeholder="e.g., 2110201015"
                className={`${getInputClass(false)} font-mono`}
              />
            </div>

            <div>
              <FieldLabel
                htmlFor="academic-session"
                label="Session"
              />
              <input
                id="academic-session"
                type="text"
                value={data.student.session}
                onChange={(e) => onStudentChange('session', e.target.value)}
                placeholder="e.g., 2021-22"
                className={`${getInputClass(false)} font-mono`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. SUBMITTED TO – TEACHER INFORMATION */}
      <section
        id="section-teacher"
        aria-labelledby="heading-teacher"
        className="scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-white p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2.5 border-b border-[#EEF2F6] pb-3.5">
          <UserCheck className="h-4 w-4 text-[#0F294A]" aria-hidden="true" />
          <h2
            id="heading-teacher"
            className="text-sm font-bold tracking-wide text-[#0F294A]"
          >
            SUBMITTED TO
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel
                htmlFor="teacher-name"
                label="Teacher Name"
                required
              />
              <input
                id="teacher-name"
                type="text"
                value={data.teacher.name}
                onChange={(e) => onTeacherChange('name', e.target.value)}
                placeholder="e.g., Dr. Mahmudul Islam"
                aria-invalid={Boolean(errors.teacherName)}
                aria-describedby={
                  errors.teacherName ? 'error-teacher-name' : undefined
                }
                className={getInputClass(Boolean(errors.teacherName))}
              />
              <FieldError
                id="error-teacher-name"
                message={errors.teacherName}
              />
            </div>

            <div>
              <FieldLabel
                htmlFor="teacher-designation"
                label="Teacher Designation"
                required
              />
              <select
                id="teacher-designation"
                value={data.teacher.designation}
                onChange={(e) =>
                  onTeacherChange(
                    'designation',
                    e.target.value as TeacherDesignation
                  )
                }
                aria-invalid={Boolean(errors.teacherDesignation)}
                aria-describedby={
                  errors.teacherDesignation
                    ? 'error-teacher-designation'
                    : undefined
                }
                className={`${getInputClass(
                  Boolean(errors.teacherDesignation)
                )} cursor-pointer`}
              >
                <option value="">Select Designation</option>
                {TEACHER_DESIGNATIONS.map((designation) => (
                  <option key={designation} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
              <FieldError
                id="error-teacher-designation"
                message={errors.teacherDesignation}
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="teacher-department" label="Department" />
            <input
              id="teacher-department"
              type="text"
              value={data.teacher.department}
              onChange={(e) => onTeacherChange('department', e.target.value)}
              placeholder="Computer Science and Engineering"
              className={getInputClass(false)}
            />
          </div>
        </div>
      </section>

      {/* 6. SUBMITTED BY – SYNCHRONIZED STUDENT SUMMARY */}
      <section
        id="section-submitted-by"
        aria-labelledby="heading-submitted-by"
        className="scroll-mt-24 rounded-xl border border-[#DCE3EC] bg-[#FAFBFD] p-5 sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-[#0F294A]" aria-hidden="true" />
            <h2
              id="heading-submitted-by"
              className="text-sm font-bold tracking-wide text-[#0F294A]"
            >
              SUBMITTED BY
            </h2>
          </div>
          <a
            href="#section-student"
            className="text-xs font-semibold text-[#0F294A] underline-offset-4 hover:underline"
          >
            Auto-synced from Student Info
          </a>
        </div>

        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-2">
          <div className="flex flex-col">
            <dt className="text-xs font-medium text-[#64748B]">Student Name</dt>
            <dd className="mt-0.5 font-semibold text-[#0F172A]">
              {data.student.name.trim() || (
                <span className="font-normal italic text-[#94A3B8]">
                  Not entered yet
                </span>
              )}
            </dd>
          </div>

          <div className="flex flex-col">
            <dt className="text-xs font-medium text-[#64748B]">Class Roll</dt>
            <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[#0F172A]">
              {data.student.studentId.trim() || (
                <span className="font-sans font-normal italic text-[#94A3B8]">
                  Not entered yet
                </span>
              )}
            </dd>
          </div>

          <div className="flex flex-col">
            <dt className="text-xs font-medium text-[#64748B]">
              Registration Number
            </dt>
            <dd className="mt-0.5 font-mono tabular-nums text-[#334155]">
              {data.student.registrationNumber.trim() || (
                <span className="font-sans italic text-[#94A3B8]">
                  Optional
                </span>
              )}
            </dd>
          </div>

          <div className="flex flex-col">
            <dt className="text-xs font-medium text-[#64748B]">Session</dt>
            <dd className="mt-0.5 font-mono tabular-nums text-[#334155]">
              {data.student.session.trim() || (
                <span className="font-sans italic text-[#94A3B8]">—</span>
              )}
            </dd>
          </div>

          <div className="flex flex-col sm:col-span-2">
            <dt className="text-xs font-medium text-[#64748B]">Department</dt>
            <dd className="mt-0.5 text-[#334155]">
              {data.university.department.trim() || (
                <span className="italic text-[#94A3B8]">
                  Select Department above
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};
