import React from 'react';
import type { CoverPageData } from '../types/coverPage';
import { formatAcademicDate } from '../utils/coverPageLogic';

interface CoverPageSheetProps {
  data: CoverPageData;
  /** When true, omits empty optional rows so exported PDFs and printouts stay clean */
  forExport?: boolean;
}

interface FieldRowProps {
  label: string;
  value: string;
  placeholder?: string;
  forExport?: boolean;
  optional?: boolean;
  labelWidth?: string;
  fontSize?: string;
  boldValue?: boolean;
}

function FormalRow({
  label,
  value,
  placeholder,
  forExport = false,
  optional = false,
  labelWidth = '112px',
  fontSize = '11.5pt',
  boldValue = false,
}: FieldRowProps) {
  const trimmed = value.trim();
  if (!trimmed && forExport && optional) {
    return null;
  }

  return (
    <div
      className="flex items-baseline gap-2.5 py-[3.5px]"
      style={{
        fontSize,
        lineHeight: 1.48,
        color: '#000000',
      }}
    >
      <span
        className="shrink-0 font-bold"
        style={{ width: labelWidth, color: '#000000' }}
      >
        {label}
      </span>
      <span className="shrink-0 font-bold" style={{ color: '#000000' }}>
        :
      </span>
      <span
        className={`min-w-0 flex-1 break-words ${
          boldValue ? 'font-bold' : 'font-normal'
        }`}
        style={{ color: '#000000' }}
      >
        {trimmed || (forExport ? '' : placeholder || '________________')}
      </span>
    </div>
  );
}

export const CoverPageSheet: React.FC<CoverPageSheetProps> = ({
  data,
  forExport = false,
}) => {
  const isLabReport = data.documentType === 'lab-report';
  const formattedSubmissionDate = formatAcademicDate(data.course.submissionDate);
  const formattedExperimentDate = formatAcademicDate(data.course.experimentDate);

  const universityName =
    data.university.universityName.trim() || 'Netrokona University';
  const facultyName = data.university.faculty.trim();
  const departmentName = data.university.department.trim();

  const teacherDepartment =
    data.teacher.department.trim() || departmentName;

  const hasLogo = Boolean(data.logoDataUrl);

  return (
    <div
      className="a4-sheet-root relative overflow-hidden select-none"
      style={{
        width: '794px',
        height: '1123px',
        backgroundColor: '#FFFFFF',
        color: '#000000',
        fontFamily: '"Times New Roman", Times, "Hind Siliguri", Georgia, serif',
      }}
      data-testid={forExport ? 'a4-export-sheet' : 'a4-preview-sheet'}
      data-document-type={data.documentType}
    >
      {/* Simple, symmetrical formal black page border (40px even margins on all 4 sides) */}
      <div
        className="pointer-events-none absolute inset-[40px]"
        style={{
          border: '1px solid #000000',
        }}
      />

      {/* Main Formal Content Container with consistent left/right margins and balanced vertical rhythm */}
      <div
        className="relative flex h-full w-full flex-col justify-between"
        style={{
          padding: '66px 72px 62px 72px',
          color: '#000000',
        }}
      >
        {/* TOP SECTION: Centered Official University Header */}
        <header className="flex w-full flex-col items-center text-center">
          {hasLogo && data.logoDataUrl && (
            <div
              className="flex w-full items-center justify-center"
              style={{ height: '132px', marginBottom: '18px' }}
            >
              <img
                src={data.logoDataUrl}
                alt="Netrokona University Official Logo"
                className="max-h-[132px] max-w-[150px] h-auto w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* 22pt Bold All-Uppercase University Name */}
          <h1
            className="w-full font-bold uppercase"
            style={{
              fontSize: '22pt',
              lineHeight: 1.2,
              letterSpacing: '0.045em',
              color: '#000000',
            }}
          >
            {universityName}
          </h1>

          {/* 14pt Faculty Name */}
          {(facultyName || !forExport) && (
            <p
              className="w-full font-normal"
              style={{
                marginTop: '10px',
                fontSize: '14pt',
                lineHeight: 1.35,
                color: '#000000',
              }}
            >
              {facultyName || '____________________________'}
            </p>
          )}

          {/* 13pt Department Name (slightly smaller than Faculty Name) */}
          {(departmentName || !forExport) && (
            <p
              className="w-full font-normal"
              style={{
                marginTop: '5px',
                fontSize: '13pt',
                lineHeight: 1.35,
                color: '#000000',
              }}
            >
              {departmentName
                ? `Department of ${departmentName}`
                : '____________________________'}
            </p>
          )}

          {/* Clean thin black horizontal divider */}
          <div
            className="w-full"
            style={{
              marginTop: '24px',
              borderBottom: '1px solid #000000',
            }}
          />
        </header>

        {/* MIDDLE SECTION: Document Type Title & Structured Course / Experiment Details */}
        <section className="flex w-full flex-col items-center py-6">
          {isLabReport ? (
            <>
              {/* LAB REPORT TITLE: 19pt Bold */}
              <div className="mb-7 text-center">
                <div
                  className="inline-block"
                  style={{
                    padding: '6px 34px',
                    border: '1px solid #000000',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <h2
                    className="font-bold uppercase"
                    style={{
                      fontSize: '19pt',
                      lineHeight: 1.25,
                      letterSpacing: '0.14em',
                      color: '#000000',
                    }}
                  >
                    LAB REPORT
                  </h2>
                </div>
              </div>

              {/* Structured Experiment Box aligned cleanly to full content width */}
              <div
                className="w-full"
                style={{
                  border: '1px solid #000000',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <div
                  className="px-6 py-3 text-center"
                  style={{ borderBottom: '1px solid #000000' }}
                >
                  <p
                    className="font-bold"
                    style={{
                      fontSize: '13pt',
                      lineHeight: 1.35,
                      color: '#000000',
                    }}
                  >
                    Experiment No. :{' '}
                    <span>
                      {data.course.experimentNumber.trim() ||
                        (forExport ? '' : '____')}
                    </span>
                  </p>
                </div>

                <div className="px-7 py-4 text-center">
                  <p
                    className="font-bold uppercase"
                    style={{
                      fontSize: '11pt',
                      letterSpacing: '0.08em',
                      color: '#000000',
                    }}
                  >
                    Experiment Name
                  </p>
                  <h3
                    className="mt-1.5 break-words font-bold"
                    style={{
                      fontSize: '14pt',
                      lineHeight: 1.4,
                      color: '#000000',
                    }}
                  >
                    {data.course.experimentName.trim() ||
                      (forExport ? '' : '____________________________________')}
                  </h3>
                </div>
              </div>

              {/* Aligned Course Details for Lab Report (12.5pt) */}
              <div
                className="mt-6 w-full px-5 py-3"
                style={{
                  borderTop: '1px solid #000000',
                  borderBottom: '1px solid #000000',
                }}
              >
                <FormalRow
                  label="Course Code"
                  value={data.course.courseCode}
                  placeholder="____________________"
                  labelWidth="148px"
                  fontSize="12.5pt"
                  forExport={forExport}
                />
                <FormalRow
                  label="Course Title"
                  value={data.course.courseTitle}
                  placeholder="____________________________________"
                  labelWidth="148px"
                  fontSize="12.5pt"
                  forExport={forExport}
                />
                {(data.course.experimentDate.trim() || !forExport) && (
                  <FormalRow
                    label="Experiment Date"
                    value={formattedExperimentDate}
                    placeholder="____________________"
                    labelWidth="148px"
                    fontSize="12.5pt"
                    forExport={forExport}
                    optional
                  />
                )}
              </div>
            </>
          ) : (
            <>
              {/* ASSIGNMENT TITLE: 19pt Bold */}
              <div className="mb-8 text-center">
                <h2
                  className="inline-block font-bold uppercase"
                  style={{
                    paddingBottom: '4px',
                    fontSize: '19pt',
                    lineHeight: 1.25,
                    letterSpacing: '0.14em',
                    color: '#000000',
                    borderBottom: '1.5px solid #000000',
                  }}
                >
                  ASSIGNMENT
                </h2>
              </div>

              {/* Neatly Aligned Full-Width Course Information Block (13pt) */}
              <div
                className="w-full px-6 py-5"
                style={{
                  borderTop: '1px solid #000000',
                  borderBottom: '1px solid #000000',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <FormalRow
                  label="Course Code"
                  value={data.course.courseCode}
                  placeholder="____________________"
                  labelWidth="156px"
                  fontSize="13pt"
                  forExport={forExport}
                />
                <FormalRow
                  label="Course Title"
                  value={data.course.courseTitle}
                  placeholder="____________________________________"
                  labelWidth="156px"
                  fontSize="13pt"
                  forExport={forExport}
                />
                {(data.course.assignmentTopic.trim() || !forExport) && (
                  <FormalRow
                    label="Assignment Topic"
                    value={data.course.assignmentTopic}
                    placeholder="____________________________________"
                    labelWidth="156px"
                    fontSize="13pt"
                    forExport={forExport}
                    optional
                  />
                )}
              </div>
            </>
          )}
        </section>

        {/* LOWER SECTION: Balanced 50/50 SUBMITTED TO & SUBMITTED BY Table */}
        <section aria-label="Submission Details" className="w-full">
          <div
            className="grid grid-cols-2"
            style={{
              border: '1px solid #000000',
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* SUBMITTED TO COLUMN */}
            <div
              className="flex flex-col"
              style={{ borderRight: '1px solid #000000' }}
            >
              <div
                className="px-4 py-2.5 text-center"
                style={{ borderBottom: '1px solid #000000' }}
              >
                <h4
                  className="font-bold uppercase"
                  style={{
                    fontSize: '12.5pt',
                    lineHeight: 1.3,
                    letterSpacing: '0.07em',
                    color: '#000000',
                  }}
                >
                  Submitted To
                </h4>
              </div>

              <div
                className="flex flex-1 flex-col justify-start px-5 py-5"
                style={{
                  fontSize: '11.5pt',
                  lineHeight: 1.55,
                  color: '#000000',
                }}
              >
                <p className="break-words font-bold" style={{ color: '#000000' }}>
                  {data.teacher.name.trim() ||
                    (forExport ? '' : '__________________________')}
                </p>

                <p className="mt-1 font-normal" style={{ color: '#000000' }}>
                  {data.teacher.designation ||
                    (forExport ? '' : '______________________')}
                </p>

                <p
                  className="mt-2.5 break-words font-normal"
                  style={{ color: '#000000' }}
                >
                  {teacherDepartment
                    ? teacherDepartment.toLowerCase().startsWith('department of')
                      ? teacherDepartment
                      : `Department of ${teacherDepartment}`
                    : forExport
                    ? ''
                    : '____________________________'}
                </p>

                <p className="mt-1 font-normal" style={{ color: '#000000' }}>
                  {universityName}
                </p>
              </div>
            </div>

            {/* SUBMITTED BY COLUMN */}
            <div className="flex flex-col">
              <div
                className="px-4 py-2.5 text-center"
                style={{ borderBottom: '1px solid #000000' }}
              >
                <h4
                  className="font-bold uppercase"
                  style={{
                    fontSize: '12.5pt',
                    lineHeight: 1.3,
                    letterSpacing: '0.07em',
                    color: '#000000',
                  }}
                >
                  Submitted By
                </h4>
              </div>

              <div className="px-5 py-4">
                <FormalRow
                  label="Name"
                  value={data.student.name}
                  placeholder="____________________"
                  labelWidth="112px"
                  fontSize="11.5pt"
                  forExport={forExport}
                />
                <FormalRow
                  label="Class Roll"
                  value={data.student.studentId}
                  placeholder="________________"
                  labelWidth="112px"
                  fontSize="11.5pt"
                  forExport={forExport}
                />
                <FormalRow
                  label="Registration No."
                  value={data.student.registrationNumber}
                  placeholder="________________"
                  labelWidth="112px"
                  fontSize="11.5pt"
                  forExport={forExport}
                  optional
                />
                <FormalRow
                  label="Session"
                  value={data.student.session}
                  placeholder="____________"
                  labelWidth="112px"
                  fontSize="11.5pt"
                  forExport={forExport}
                  optional
                />
                <FormalRow
                  label="Department"
                  value={departmentName}
                  placeholder="____________________"
                  labelWidth="112px"
                  fontSize="11.5pt"
                  forExport={forExport}
                />
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM SECTION: Date of Submission (11.5pt–12pt) */}
        <footer
          className="w-full pt-4 text-center"
          style={{
            marginTop: '24px',
            borderTop: '1px solid #000000',
            color: '#000000',
          }}
        >
          <p
            style={{
              fontSize: '11.5pt',
              lineHeight: 1.4,
              color: '#000000',
            }}
          >
            <span className="font-bold">Date of Submission : </span>
            <span className="font-normal">
              {formattedSubmissionDate ||
                (forExport ? '' : '____________________')}
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
};
