import type { CoverPageData } from '../types/coverPage';

/** Exact ISO 216 A4 portrait dimensions in PostScript points (210mm x 297mm) */
export const A4_WIDTH_PT = 595.28;
export const A4_HEIGHT_PT = 841.89;

/** CSS 96 DPI px -> PDF 72 DPI pt conversion factor */
export const PX_TO_PT = 0.75;

/** CoverPageSheet exact geometry mapped to PDF points */
export const PDF_LAYOUT = {
  pageWidth: A4_WIDTH_PT,
  pageHeight: A4_HEIGHT_PT,
  borderInset: 40 * PX_TO_PT, // 30pt
  borderLineWidth: 0.75, // Crisp 1px-equivalent vector line
  titleUnderlineWidth: 1.125, // Crisp 1.5px-equivalent assignment underline
  paddingTop: 66 * PX_TO_PT, // 49.5pt
  paddingRight: 72 * PX_TO_PT, // 54pt
  paddingBottom: 62 * PX_TO_PT, // 46.5pt
  paddingLeft: 72 * PX_TO_PT, // 54pt
  contentWidth: A4_WIDTH_PT - 2 * (72 * PX_TO_PT), // 487.28pt
  centerX: A4_WIDTH_PT / 2, // 297.64pt
  logoBoxHeight: 132 * PX_TO_PT, // 99pt
  logoMaxWidth: 150 * PX_TO_PT, // 112.5pt
  logoMaxHeight: 132 * PX_TO_PT, // 99pt
  logoMarginBottom: 18 * PX_TO_PT, // 13.5pt
} as const;

export interface FittedImageRect {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Fits an image into a target bounding box while strictly preserving
 * its original aspect ratio (equivalent to CSS `object-contain`) and
 * centering it inside the box.
 */
export function fitImageInBox(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth: number,
  maxHeight: number
): FittedImageRect {
  if (
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    maxWidth <= 0 ||
    maxHeight <= 0
  ) {
    return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
  }

  const widthRatio = maxWidth / naturalWidth;
  const heightRatio = maxHeight / naturalHeight;
  const scale = Math.min(widthRatio, heightRatio);

  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    width,
    height,
    offsetX: (maxWidth - width) / 2,
    offsetY: (maxHeight - height) / 2,
  };
}

export type PdfImageFormat = 'JPEG' | 'PNG' | 'CONVERT_TO_PNG';

/**
 * Detects whether a data URL can be embedded directly into PDF without
 * re-encoding (JPEG or PNG) or needs lossless canvas conversion (e.g. WEBP).
 */
export function detectImageFormatFromDataUrl(dataUrl: string): PdfImageFormat {
  const header = dataUrl.slice(0, 64).toLowerCase();
  if (header.startsWith('data:image/jpeg') || header.startsWith('data:image/jpg')) {
    return 'JPEG';
  }
  if (header.startsWith('data:image/png')) {
    return 'PNG';
  }
  return 'CONVERT_TO_PNG';
}

/**
 * Standard PDF Type 1 Times-Roman / Times-Bold supports WinAnsiEncoding
 * (ASCII + Latin-1 Supplement + common typographic punctuation like em-dash).
 * Returns true if any text in the cover page requires complex-script Unicode
 * rendering (e.g., Bangla script) outside WinAnsiEncoding.
 */
export function containsNonWinAnsiText(data: CoverPageData): boolean {
  const allStrings = [
    data.university.universityName,
    data.university.faculty,
    data.university.department,
    data.student.name,
    data.student.studentId,
    data.student.registrationNumber,
    data.student.session,
    data.course.courseCode,
    data.course.courseTitle,
    data.course.assignmentTopic,
    data.course.experimentNumber,
    data.course.experimentName,
    data.course.experimentDate,
    data.course.submissionDate,
    data.teacher.name,
    data.teacher.designation,
    data.teacher.department,
  ];

  // Allowed WinAnsi characters: basic printable ASCII, Latin-1 supplement,
  // and common punctuation (en-dash, em-dash, curly quotes, middle dot).
  const allowedPattern = /^[\t\n\r\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]*$/;

  return allStrings.some((value) => !allowedPattern.test(value));
}

/**
 * Computes Y start coordinates for a list of vertical blocks distributed
 * like CSS `flex-col justify-between` within `[topY, topY + availableHeight]`.
 * Guarantees non-overlapping layout even when total content is dense.
 */
export function computeVerticalDistribution(
  topY: number,
  availableHeight: number,
  blockHeights: readonly number[],
  minGap = 10
): number[] {
  if (blockHeights.length === 0) {
    return [];
  }
  if (blockHeights.length === 1) {
    return [topY];
  }

  const totalContentHeight = blockHeights.reduce((sum, h) => sum + h, 0);
  const gapCount = blockHeights.length - 1;
  const rawGap = (availableHeight - totalContentHeight) / gapCount;
  const gap = Math.max(minGap, rawGap);

  const positions: number[] = [];
  let cursorY = topY;
  for (let i = 0; i < blockHeights.length; i += 1) {
    positions.push(cursorY);
    cursorY += blockHeights[i] + gap;
  }

  return positions;
}

/**
 * Formats teacher department consistently with CoverPageSheet:
 * avoids duplicating "Department of" when already prefixed.
 */
export function formatTeacherDepartmentLine(
  teacherDepartment: string,
  fallbackDepartment: string
): string {
  const dept = teacherDepartment.trim() || fallbackDepartment.trim();
  if (!dept) {
    return '';
  }
  return dept.toLowerCase().startsWith('department of')
    ? dept
    : `Department of ${dept}`;
}
