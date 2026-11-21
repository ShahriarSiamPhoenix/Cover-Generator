import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import type { CoverPageData } from '../types/coverPage';
import {
  formatAcademicDate,
  getExperimentNameFontSize,
  getExportFilename,
} from './coverPageLogic';
import {
  A4_HEIGHT_PT,
  A4_WIDTH_PT,
  PDF_LAYOUT,
  PX_TO_PT,
  computeVerticalDistribution,
  containsNonWinAnsiText,
  detectImageFormatFromDataUrl,
  fitImageInBox,
  formatTeacherDepartmentLine,
} from './pdfLayout';

interface LoadedPdfImage {
  dataUrl: string;
  format: 'JPEG' | 'PNG';
  naturalWidth: number;
  naturalHeight: number;
}

interface EmbeddedSerifFonts {
  regularBase64: string;
  boldBase64: string;
}

const EMBEDDED_FONT_FAMILY = 'TimesAcademic';
const REGULAR_FONT_FILE = 'LiberationSerif-Regular.ttf';
const BOLD_FONT_FILE = 'LiberationSerif-Bold.ttf';
const REGULAR_FONT_URL = '/fonts/LiberationSerif-Regular.ttf';
const BOLD_FONT_URL = '/fonts/LiberationSerif-Bold.ttf';

let cachedSerifFontsPromise: Promise<EmbeddedSerifFonts | null> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchFontBase64(url: string): Promise<string> {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`Font fetch failed (${response.status}): ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return arrayBufferToBase64(buffer);
}

async function loadEmbeddedSerifFonts(): Promise<EmbeddedSerifFonts | null> {
  if (!cachedSerifFontsPromise) {
    cachedSerifFontsPromise = Promise.all([
      fetchFontBase64(REGULAR_FONT_URL),
      fetchFontBase64(BOLD_FONT_URL),
    ])
      .then(([regularBase64, boldBase64]) => ({ regularBase64, boldBase64 }))
      .catch(() => {
        cachedSerifFontsPromise = null;
        return null;
      });
  }
  return cachedSerifFontsPromise;
}

interface FormalRowSpec {
  label: string;
  value: string;
  labelWidth: number;
  fontSize: number;
  lineHeight: number;
  padY: number;
  gap: number;
  colonWidth: number;
  valueLines: string[];
  height: number;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to decode logo blob into data URL.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Logo read error.'));
    reader.readAsDataURL(blob);
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load university logo image.'));
    img.src = src;
  });
}

/**
 * Loads the university logo at its exact original resolution without lossy
 * re-compression. Native JPEG and PNG bytes are preserved untouched; WEBP is
 * decoded at full naturalWidth x naturalHeight into lossless PNG for PDF.
 */
async function loadOriginalLogoForPdf(
  logoSrc: string
): Promise<LoadedPdfImage | null> {
  try {
    let rawDataUrl = logoSrc;
    if (!logoSrc.startsWith('data:')) {
      const response = await fetch(logoSrc, { credentials: 'same-origin' });
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      rawDataUrl = await readBlobAsDataUrl(blob);
    }

    const img = await loadHtmlImage(rawDataUrl);
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    if (naturalWidth <= 0 || naturalHeight <= 0) {
      return null;
    }

    const detected = detectImageFormatFromDataUrl(rawDataUrl);
    if (detected === 'JPEG' || detected === 'PNG') {
      return {
        dataUrl: rawDataUrl,
        format: detected,
        naturalWidth,
        naturalHeight,
      };
    }

    // Lossless PNG conversion at 100% original resolution for WEBP/other formats
    const canvas = document.createElement('canvas');
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      format: 'PNG',
      naturalWidth,
      naturalHeight,
    };
  } catch {
    return null;
  }
}

function getTrackedTextWidth(
  pdf: jsPDF,
  text: string,
  charSpace = 0
): number {
  const base = pdf.getTextWidth(text);
  if (!charSpace || text.length <= 1) {
    return base;
  }
  return base + charSpace * (text.length - 1);
}

function drawCenteredTrackedText(
  pdf: jsPDF,
  text: string,
  centerX: number,
  baselineY: number,
  charSpace = 0
): number {
  const width = getTrackedTextWidth(pdf, text, charSpace);
  const startX = centerX - width / 2;
  pdf.text(text, startX, baselineY, { charSpace });
  return width;
}

function baselineInLineBox(
  boxTopY: number,
  lineHeight: number,
  fontSize: number
): number {
  return boxTopY + (lineHeight - fontSize) / 2 + fontSize * 0.78;
}

function prepareFormalRows(
  pdf: jsPDF,
  fontFamily: string,
  rows: Array<{ label: string; value: string; optional?: boolean }>,
  options: {
    containerWidth: number;
    padX: number;
    labelWidth: number;
    fontSize: number;
    lineHeightFactor?: number;
    padY?: number;
    gap?: number;
  }
): FormalRowSpec[] {
  const lineHeightFactor = options.lineHeightFactor ?? 1.48;
  const lineHeight = options.fontSize * lineHeightFactor;
  const padY = options.padY ?? 3.5 * PX_TO_PT;
  const gap = options.gap ?? 10 * PX_TO_PT;

  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(options.fontSize);
  const colonWidth = pdf.getTextWidth(':');

  const valueMaxWidth = Math.max(
    40,
    options.containerWidth -
      options.padX * 2 -
      options.labelWidth -
      colonWidth -
      gap * 2
  );

  const prepared: FormalRowSpec[] = [];
  for (const row of rows) {
    const trimmed = row.value.trim();
    if (!trimmed && row.optional) {
      continue;
    }

    pdf.setFont(fontFamily, 'normal');
    pdf.setFontSize(options.fontSize);
    const valueLines: string[] = trimmed
      ? (pdf.splitTextToSize(trimmed, valueMaxWidth) as string[])
      : [''];
    const lineCount = Math.max(1, valueLines.length);
    const height = lineCount * lineHeight + padY * 2;

    prepared.push({
      label: row.label,
      value: trimmed,
      labelWidth: options.labelWidth,
      fontSize: options.fontSize,
      lineHeight,
      padY,
      gap,
      colonWidth,
      valueLines,
      height,
    });
  }

  return prepared;
}

function drawFormalRows(
  pdf: jsPDF,
  fontFamily: string,
  rows: FormalRowSpec[],
  startX: number,
  startY: number
): number {
  let cursorY = startY;

  for (const row of rows) {
    const firstLineTop = cursorY + row.padY;
    const firstBaseline = baselineInLineBox(
      firstLineTop,
      row.lineHeight,
      row.fontSize
    );

    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(row.fontSize);
    pdf.text(row.label, startX, firstBaseline);

    const colonX = startX + row.labelWidth + row.gap;
    pdf.text(':', colonX, firstBaseline);

    const valueX = colonX + row.colonWidth + row.gap;
    pdf.setFont(fontFamily, 'normal');
    pdf.setFontSize(row.fontSize);
    row.valueLines.forEach((line, idx) => {
      const lineTop = firstLineTop + idx * row.lineHeight;
      const lineBaseline = baselineInLineBox(
        lineTop,
        row.lineHeight,
        row.fontSize
      );
      pdf.text(line, valueX, lineBaseline);
    });

    cursorY += row.height;
  }

  return cursorY;
}

interface ExperimentNameLayout {
  fontSize: number;
  lineHeight: number;
  singleLine: boolean;
  labelText: string;
  labelWidth: number;
  spaceAfterLabel: number;
  valueText: string;
  valueWidth: number;
  wrappedLines: string[];
  boxHeight: number;
}

function measureExperimentNameSection(
  pdf: jsPDF,
  fontFamily: string,
  experimentName: string,
  innerWidth: number,
  padY: number
): ExperimentNameLayout {
  const labelText = 'Experiment Name:';
  const trimmed = experimentName.trim();
  const initialPt = parseFloat(getExperimentNameFontSize(trimmed)) || 13;

  let fontSize = initialPt;
  let labelWidth = 0;
  let valueWidth = 0;
  let spaceAfterLabel = 0;

  // Step down smoothly if measured serif text slightly exceeds 1 line
  while (fontSize >= 9.5) {
    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(fontSize);
    labelWidth = pdf.getTextWidth(labelText);
    spaceAfterLabel = pdf.getTextWidth(' ') + 1.5;

    pdf.setFont(fontFamily, 'normal');
    pdf.setFontSize(fontSize);
    valueWidth = trimmed ? pdf.getTextWidth(trimmed) : 0;

    if (labelWidth + spaceAfterLabel + valueWidth <= innerWidth) {
      const lineHeight = fontSize * 1.4;
      return {
        fontSize,
        lineHeight,
        singleLine: true,
        labelText,
        labelWidth,
        spaceAfterLabel,
        valueText: trimmed,
        valueWidth,
        wrappedLines: [trimmed],
        boxHeight: lineHeight + padY * 2,
      };
    }

    if (fontSize <= 9.5) {
      break;
    }
    fontSize = Math.max(9.5, fontSize - 0.5);
  }

  // Fallback wrap for extraordinarily long experiment names (> ~95 chars)
  pdf.setFont(fontFamily, 'normal');
  pdf.setFontSize(fontSize);
  const fullCombined = `${labelText} ${trimmed}`;
  const wrappedLines = pdf.splitTextToSize(fullCombined, innerWidth) as string[];
  const lineHeight = fontSize * 1.4;

  return {
    fontSize,
    lineHeight,
    singleLine: false,
    labelText,
    labelWidth,
    spaceAfterLabel,
    valueText: trimmed,
    valueWidth,
    wrappedLines,
    boxHeight: wrappedLines.length * lineHeight + padY * 2,
  };
}

/**
 * Generates a pure vector, native-text, print-ready A4 PDF with embedded
 * metric-compatible Times serif TrueType fonts, crisp vector borders, and
 * uncompressed original-resolution logo embedding.
 */
async function generateVectorPdf(data: CoverPageData): Promise<jsPDF> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true,
  });

  // Embed TrueType serif fonts directly into the PDF so text renders
  // identically and sharply on all platforms, viewers, and print shops
  const embeddedFonts = await loadEmbeddedSerifFonts();
  let fontFamily = 'times';
  if (embeddedFonts) {
    pdf.addFileToVFS(REGULAR_FONT_FILE, embeddedFonts.regularBase64);
    pdf.addFont(REGULAR_FONT_FILE, EMBEDDED_FONT_FAMILY, 'normal');
    pdf.addFileToVFS(BOLD_FONT_FILE, embeddedFonts.boldBase64);
    pdf.addFont(BOLD_FONT_FILE, EMBEDDED_FONT_FAMILY, 'bold');
    fontFamily = EMBEDDED_FONT_FAMILY;
  }

  const isLabReport = data.documentType === 'lab-report';
  const universityName =
    data.university.universityName.trim() || 'Netrokona University';
  const facultyName = data.university.faculty.trim();
  const departmentName = data.university.department.trim();
  const teacherDepartmentLine = formatTeacherDepartmentLine(
    data.teacher.department,
    departmentName
  );
  const formattedSubmissionDate = formatAcademicDate(data.course.submissionDate);
  const formattedExperimentDate = formatAcademicDate(data.course.experimentDate);

  pdf.setProperties({
    title: isLabReport
      ? `${universityName} - Lab Report Cover Page`
      : `${universityName} - Assignment Cover Page`,
    subject: data.course.courseTitle.trim() || 'Academic Cover Page',
    creator: 'Netrokona University Cover Page Generator',
  });

  // Pure white A4 canvas & pure black vector ink
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, A4_WIDTH_PT, A4_HEIGHT_PT, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setTextColor(0, 0, 0);

  // Outer symmetrical formal black border (30pt inset = 40px on 794x1123 sheet)
  pdf.setLineWidth(PDF_LAYOUT.borderLineWidth);
  pdf.rect(
    PDF_LAYOUT.borderInset,
    PDF_LAYOUT.borderInset,
    A4_WIDTH_PT - PDF_LAYOUT.borderInset * 2,
    A4_HEIGHT_PT - PDF_LAYOUT.borderInset * 2,
    'S'
  );

  // Load original unmodified logo image
  const loadedLogo = data.logoDataUrl
    ? await loadOriginalLogoForPdf(data.logoDataUrl)
    : null;

  const contentLeft = PDF_LAYOUT.paddingLeft;
  const contentWidth = PDF_LAYOUT.contentWidth;
  const centerX = PDF_LAYOUT.centerX;

  // =========================================================================
  // 1. MEASURE ALL 4 VERTICAL SECTIONS (matches CoverPageSheet justify-between)
  // =========================================================================

  // --- Section 1: University Header (no bottom divider line) ---
  const uniFontSize = 22;
  const uniLineHeight = uniFontSize * 1.2;
  const facultyFontSize = 14;
  const facultyLineHeight = facultyFontSize * 1.35;
  const facultyMarginTop = 10 * PX_TO_PT;
  const deptFontSize = 13;
  const deptLineHeight = deptFontSize * 1.35;
  const deptMarginTop = 5 * PX_TO_PT;

  let headerHeight = 0;
  if (loadedLogo) {
    headerHeight += PDF_LAYOUT.logoBoxHeight + PDF_LAYOUT.logoMarginBottom;
  }
  headerHeight += uniLineHeight;
  if (facultyName) {
    headerHeight += facultyMarginTop + facultyLineHeight;
  }
  if (departmentName) {
    headerHeight += deptMarginTop + deptLineHeight;
  }

  // --- Section 2: Middle Section (Document Title + Experiment/Course Details) ---
  const middlePadY = 24 * PX_TO_PT; // py-6
  let middleHeight = middlePadY * 2;

  // Lab Report measurements
  const labTitleFontSize = 19;
  const labTitlePadY = 6 * PX_TO_PT;
  const labTitlePadX = 34 * PX_TO_PT;
  const labTitleLineHeight = labTitleFontSize * 1.25;
  const labTitleBoxHeight = labTitleLineHeight + labTitlePadY * 2;
  const labTitleMarginBottom = 28 * PX_TO_PT; // mb-7

  const expNoFontSize = 13;
  const expNoLineHeight = expNoFontSize * 1.35;
  const expNoPadY = 12 * PX_TO_PT; // py-3
  const expNoBoxHeight = expNoLineHeight + expNoPadY * 2;

  const expNamePadX = 16 * PX_TO_PT; // px-4
  const expNamePadY = 16 * PX_TO_PT; // py-4
  const expNameLayout = isLabReport
    ? measureExperimentNameSection(
        pdf,
        fontFamily,
        data.course.experimentName,
        contentWidth - expNamePadX * 2,
        expNamePadY
      )
    : null;

  const labCourseMarginTop = 24 * PX_TO_PT; // mt-6
  const labCoursePadX = 20 * PX_TO_PT; // px-5
  const labCoursePadY = 12 * PX_TO_PT; // py-3
  const labCourseRows = isLabReport
    ? prepareFormalRows(
        pdf,
        fontFamily,
        [
          { label: 'Course Code', value: data.course.courseCode },
          { label: 'Course Title', value: data.course.courseTitle },
          {
            label: 'Experiment Date',
            value: formattedExperimentDate,
            optional: true,
          },
        ],
        {
          containerWidth: contentWidth,
          padX: labCoursePadX,
          labelWidth: 148 * PX_TO_PT,
          fontSize: 12.5,
        }
      )
    : [];
  const labCourseBlockHeight =
    labCourseRows.reduce((sum, r) => sum + r.height, 0) + labCoursePadY * 2;

  // Assignment measurements
  const assignTitleFontSize = 19;
  const assignTitleLineHeight = assignTitleFontSize * 1.25;
  const assignTitlePadBottom = 4 * PX_TO_PT;
  const assignTitleMarginBottom = 32 * PX_TO_PT; // mb-8
  const assignCoursePadX = 24 * PX_TO_PT; // px-6
  const assignCoursePadY = 20 * PX_TO_PT; // py-5
  const assignCourseRows = !isLabReport
    ? prepareFormalRows(
        pdf,
        fontFamily,
        [
          { label: 'Course Code', value: data.course.courseCode },
          { label: 'Course Title', value: data.course.courseTitle },
          {
            label: 'Assignment Topic',
            value: data.course.assignmentTopic,
            optional: true,
          },
        ],
        {
          containerWidth: contentWidth,
          padX: assignCoursePadX,
          labelWidth: 156 * PX_TO_PT,
          fontSize: 13,
        }
      )
    : [];
  const assignCourseBlockHeight =
    assignCourseRows.reduce((sum, r) => sum + r.height, 0) +
    assignCoursePadY * 2;

  if (isLabReport && expNameLayout) {
    middleHeight +=
      labTitleBoxHeight +
      labTitleMarginBottom +
      expNoBoxHeight +
      expNameLayout.boxHeight +
      labCourseMarginTop +
      labCourseBlockHeight;
  } else {
    middleHeight +=
      assignTitleLineHeight +
      assignTitlePadBottom +
      assignTitleMarginBottom +
      assignCourseBlockHeight;
  }

  // --- Section 3: Lower 50/50 Submitted To & Submitted By Table ---
  const colWidth = contentWidth / 2;
  const tableHeaderFontSize = 12.5;
  const tableHeaderLineHeight = tableHeaderFontSize * 1.3;
  const tableHeaderPadY = 10 * PX_TO_PT; // py-2.5
  const tableHeaderHeight = tableHeaderLineHeight + tableHeaderPadY * 2;

  // Submitted To column measurement
  const toPadX = 20 * PX_TO_PT; // px-5
  const toPadY = 20 * PX_TO_PT; // py-5
  const toFontSize = 11.5;
  const toLineHeight = toFontSize * 1.55;
  const toInnerWidth = colWidth - toPadX * 2;

  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(toFontSize);
  const teacherNameLines = data.teacher.name.trim()
    ? (pdf.splitTextToSize(data.teacher.name.trim(), toInnerWidth) as string[])
    : [];

  pdf.setFont(fontFamily, 'normal');
  pdf.setFontSize(toFontSize);
  const teacherDesignationLines = data.teacher.designation.trim()
    ? (pdf.splitTextToSize(
        data.teacher.designation.trim(),
        toInnerWidth
      ) as string[])
    : [];
  const teacherDeptLines = teacherDepartmentLine
    ? (pdf.splitTextToSize(teacherDepartmentLine, toInnerWidth) as string[])
    : [];
  const teacherUniLines = universityName
    ? (pdf.splitTextToSize(universityName, toInnerWidth) as string[])
    : [];

  let submittedToBodyHeight = toPadY * 2;
  submittedToBodyHeight += Math.max(1, teacherNameLines.length) * toLineHeight;
  submittedToBodyHeight +=
    4 * PX_TO_PT + Math.max(1, teacherDesignationLines.length) * toLineHeight;
  submittedToBodyHeight +=
    10 * PX_TO_PT + Math.max(1, teacherDeptLines.length) * toLineHeight;
  submittedToBodyHeight +=
    4 * PX_TO_PT + Math.max(1, teacherUniLines.length) * toLineHeight;

  // Submitted By column measurement
  const byPadX = 20 * PX_TO_PT; // px-5
  const byPadY = 16 * PX_TO_PT; // py-4
  const submittedByRows = prepareFormalRows(
    pdf,
    fontFamily,
    [
      { label: 'Name', value: data.student.name },
      { label: 'Class Roll', value: data.student.studentId },
      {
        label: 'Registration No.',
        value: data.student.registrationNumber,
        optional: true,
      },
      { label: 'Session', value: data.student.session, optional: true },
      { label: 'Department', value: departmentName },
    ],
    {
      containerWidth: colWidth,
      padX: byPadX,
      labelWidth: 112 * PX_TO_PT,
      fontSize: 11.5,
    }
  );
  const submittedByBodyHeight =
    submittedByRows.reduce((sum, r) => sum + r.height, 0) + byPadY * 2;

  const tableBodyHeight = Math.max(submittedToBodyHeight, submittedByBodyHeight);
  const tableHeight = tableHeaderHeight + tableBodyHeight;

  // --- Section 4: Bottom Date of Submission (no top border line) ---
  const footerFontSize = 11.5;
  const footerLineHeight = footerFontSize * 1.4;
  const footerPadTop = 8 * PX_TO_PT; // pt-2
  const footerHeight = footerPadTop + footerLineHeight;

  // Compute exact vertical placement across printable area (justify-between)
  const availableHeight =
    A4_HEIGHT_PT - PDF_LAYOUT.paddingTop - PDF_LAYOUT.paddingBottom;
  const [headerTopY, middleTopY, tableTopY, footerTopY] =
    computeVerticalDistribution(
      PDF_LAYOUT.paddingTop,
      availableHeight,
      [headerHeight, middleHeight, tableHeight, footerHeight],
      8
    );

  // =========================================================================
  // 2. DRAW SECTION 1: UNIVERSITY HEADER (Logo + 3 Centered Lines, No Divider)
  // =========================================================================
  let cursorY = headerTopY;

  if (loadedLogo) {
    const fitted = fitImageInBox(
      loadedLogo.naturalWidth,
      loadedLogo.naturalHeight,
      PDF_LAYOUT.logoMaxWidth,
      PDF_LAYOUT.logoMaxHeight
    );
    const logoBoxLeft = centerX - PDF_LAYOUT.logoMaxWidth / 2;
    const drawX = logoBoxLeft + fitted.offsetX;
    const drawY = cursorY + fitted.offsetY;

    // Preserve original resolution with NONE compression (no quality degradation)
    pdf.addImage(
      loadedLogo.dataUrl,
      loadedLogo.format,
      drawX,
      drawY,
      fitted.width,
      fitted.height,
      'university-logo',
      'NONE'
    );
    cursorY += PDF_LAYOUT.logoBoxHeight + PDF_LAYOUT.logoMarginBottom;
  }

  // 22pt Bold All-Uppercase University Name
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(uniFontSize);
  drawCenteredTrackedText(
    pdf,
    universityName.toUpperCase(),
    centerX,
    baselineInLineBox(cursorY, uniLineHeight, uniFontSize),
    uniFontSize * 0.045
  );
  cursorY += uniLineHeight;

  // 14pt Faculty Name
  if (facultyName) {
    cursorY += facultyMarginTop;
    pdf.setFont(fontFamily, 'normal');
    pdf.setFontSize(facultyFontSize);
    drawCenteredTrackedText(
      pdf,
      facultyName,
      centerX,
      baselineInLineBox(cursorY, facultyLineHeight, facultyFontSize),
      0
    );
    cursorY += facultyLineHeight;
  }

  // 13pt Department Name
  if (departmentName) {
    cursorY += deptMarginTop;
    pdf.setFont(fontFamily, 'normal');
    pdf.setFontSize(deptFontSize);
    drawCenteredTrackedText(
      pdf,
      `Department of ${departmentName}`,
      centerX,
      baselineInLineBox(cursorY, deptLineHeight, deptFontSize),
      0
    );
  }

  // =========================================================================
  // 3. DRAW SECTION 2: DOCUMENT TITLE & COURSE / EXPERIMENT DETAILS
  // =========================================================================
  cursorY = middleTopY + middlePadY;

  if (isLabReport && expNameLayout) {
    // LAB REPORT bordered title box
    const labTitleText = 'LAB REPORT';
    const labTitleCharSpace = labTitleFontSize * 0.14;
    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(labTitleFontSize);
    const titleTextWidth = getTrackedTextWidth(
      pdf,
      labTitleText,
      labTitleCharSpace
    );
    const titleBoxWidth = titleTextWidth + labTitlePadX * 2;
    const titleBoxX = centerX - titleBoxWidth / 2;

    pdf.setLineWidth(PDF_LAYOUT.borderLineWidth);
    pdf.rect(titleBoxX, cursorY, titleBoxWidth, labTitleBoxHeight, 'S');

    const titleBaseline =
      cursorY + labTitleBoxHeight / 2 + labTitleFontSize * 0.33;
    drawCenteredTrackedText(
      pdf,
      labTitleText,
      centerX,
      titleBaseline,
      labTitleCharSpace
    );
    cursorY += labTitleBoxHeight + labTitleMarginBottom;

    // Structured Experiment Box (Experiment No. + single-line Experiment Name)
    const expBoxTotalHeight = expNoBoxHeight + expNameLayout.boxHeight;
    pdf.setLineWidth(PDF_LAYOUT.borderLineWidth);
    pdf.rect(contentLeft, cursorY, contentWidth, expBoxTotalHeight, 'S');
    pdf.line(
      contentLeft,
      cursorY + expNoBoxHeight,
      contentLeft + contentWidth,
      cursorY + expNoBoxHeight
    );

    // Experiment No. row
    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(expNoFontSize);
    const expNoText = `Experiment No. : ${data.course.experimentNumber.trim()}`;
    const expNoBaseline =
      cursorY + expNoBoxHeight / 2 + expNoFontSize * 0.31;
    drawCenteredTrackedText(pdf, expNoText, centerX, expNoBaseline, 0);

    // Experiment Name row (same-line label + value, baseline aligned)
    const expNameTopY = cursorY + expNoBoxHeight;
    if (expNameLayout.singleLine) {
      const totalLineW =
        expNameLayout.labelWidth +
        expNameLayout.spaceAfterLabel +
        expNameLayout.valueWidth;
      const startX = centerX - totalLineW / 2;
      const baselineY =
        expNameTopY + expNameLayout.boxHeight / 2 + expNameLayout.fontSize * 0.31;

      pdf.setFont(fontFamily, 'bold');
      pdf.setFontSize(expNameLayout.fontSize);
      pdf.text(expNameLayout.labelText, startX, baselineY);

      pdf.setFont(fontFamily, 'normal');
      pdf.setFontSize(expNameLayout.fontSize);
      pdf.text(
        expNameLayout.valueText,
        startX + expNameLayout.labelWidth + expNameLayout.spaceAfterLabel,
        baselineY
      );
    } else {
      expNameLayout.wrappedLines.forEach((line, idx) => {
        const lineTop = expNameTopY + expNamePadY + idx * expNameLayout.lineHeight;
        const lineBaseline = baselineInLineBox(
          lineTop,
          expNameLayout.lineHeight,
          expNameLayout.fontSize
        );
        if (idx === 0 && line.startsWith(expNameLayout.labelText)) {
          const rest = line.slice(expNameLayout.labelText.length).trimStart();
          pdf.setFont(fontFamily, 'bold');
          pdf.setFontSize(expNameLayout.fontSize);
          const lblW = pdf.getTextWidth(expNameLayout.labelText);
          const spW = pdf.getTextWidth(' ') + 1.5;
          pdf.setFont(fontFamily, 'normal');
          const restW = pdf.getTextWidth(rest);
          const startX = centerX - (lblW + spW + restW) / 2;

          pdf.setFont(fontFamily, 'bold');
          pdf.text(expNameLayout.labelText, startX, lineBaseline);
          pdf.setFont(fontFamily, 'normal');
          pdf.text(rest, startX + lblW + spW, lineBaseline);
        } else {
          pdf.setFont(fontFamily, 'normal');
          pdf.setFontSize(expNameLayout.fontSize);
          drawCenteredTrackedText(pdf, line, centerX, lineBaseline, 0);
        }
      });
    }

    cursorY += expBoxTotalHeight + labCourseMarginTop;

    // Course Details Block for Lab Report (top & bottom black divider lines)
    pdf.setLineWidth(PDF_LAYOUT.borderLineWidth);
    pdf.line(contentLeft, cursorY, contentLeft + contentWidth, cursorY);
    drawFormalRows(
      pdf,
      fontFamily,
      labCourseRows,
      contentLeft + labCoursePadX,
      cursorY + labCoursePadY
    );
    pdf.line(
      contentLeft,
      cursorY + labCourseBlockHeight,
      contentLeft + contentWidth,
      cursorY + labCourseBlockHeight
    );
  } else {
    // ASSIGNMENT underlined title
    const assignTitleText = 'ASSIGNMENT';
    const assignCharSpace = assignTitleFontSize * 0.14;
    pdf.setFont(fontFamily, 'bold');
    pdf.setFontSize(assignTitleFontSize);
    const titleBaseline = baselineInLineBox(
      cursorY,
      assignTitleLineHeight,
      assignTitleFontSize
    );
    const titleWidth = drawCenteredTrackedText(
      pdf,
      assignTitleText,
      centerX,
      titleBaseline,
      assignCharSpace
    );

    const underlineY = cursorY + assignTitleLineHeight + assignTitlePadBottom;
    pdf.setLineWidth(PDF_LAYOUT.titleUnderlineWidth);
    pdf.line(
      centerX - titleWidth / 2,
      underlineY,
      centerX + titleWidth / 2,
      underlineY
    );

    cursorY = underlineY + assignTitleMarginBottom;

    // Full-Width Course Information Block (top & bottom thin black lines)
    pdf.setLineWidth(PDF_LAYOUT.borderLineWidth);
    pdf.line(contentLeft, cursorY, contentLeft + contentWidth, cursorY);
    drawFormalRows(
      pdf,
      fontFamily,
      assignCourseRows,
      contentLeft + assignCoursePadX,
      cursorY + assignCoursePadY
    );
    pdf.line(
      contentLeft,
      cursorY + assignCourseBlockHeight,
      contentLeft + contentWidth,
      cursorY + assignCourseBlockHeight
    );
  }

  // =========================================================================
  // 4. DRAW SECTION 3: 50/50 SUBMITTED TO & SUBMITTED BY TABLE
  // =========================================================================
  pdf.setLineWidth(PDF_LAYOUT.borderLineWidth);
  pdf.rect(contentLeft, tableTopY, contentWidth, tableHeight, 'S');
  // Center vertical divider
  pdf.line(
    contentLeft + colWidth,
    tableTopY,
    contentLeft + colWidth,
    tableTopY + tableHeight
  );
  // Header horizontal divider
  pdf.line(
    contentLeft,
    tableTopY + tableHeaderHeight,
    contentLeft + contentWidth,
    tableTopY + tableHeaderHeight
  );

  // Table Headers
  const tableHeaderCharSpace = tableHeaderFontSize * 0.07;
  const tableHeaderBaseline =
    tableTopY + tableHeaderHeight / 2 + tableHeaderFontSize * 0.33;
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(tableHeaderFontSize);
  drawCenteredTrackedText(
    pdf,
    'SUBMITTED TO',
    contentLeft + colWidth / 2,
    tableHeaderBaseline,
    tableHeaderCharSpace
  );
  drawCenteredTrackedText(
    pdf,
    'SUBMITTED BY',
    contentLeft + colWidth + colWidth / 2,
    tableHeaderBaseline,
    tableHeaderCharSpace
  );

  // Submitted To Body
  let toCursorY = tableTopY + tableHeaderHeight + toPadY;
  const toTextX = contentLeft + toPadX;

  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(toFontSize);
  if (teacherNameLines.length > 0) {
    teacherNameLines.forEach((line) => {
      pdf.text(
        line,
        toTextX,
        baselineInLineBox(toCursorY, toLineHeight, toFontSize)
      );
      toCursorY += toLineHeight;
    });
  } else {
    toCursorY += toLineHeight;
  }

  toCursorY += 4 * PX_TO_PT;
  pdf.setFont(fontFamily, 'normal');
  pdf.setFontSize(toFontSize);
  if (teacherDesignationLines.length > 0) {
    teacherDesignationLines.forEach((line) => {
      pdf.text(
        line,
        toTextX,
        baselineInLineBox(toCursorY, toLineHeight, toFontSize)
      );
      toCursorY += toLineHeight;
    });
  } else {
    toCursorY += toLineHeight;
  }

  toCursorY += 10 * PX_TO_PT;
  if (teacherDeptLines.length > 0) {
    teacherDeptLines.forEach((line) => {
      pdf.text(
        line,
        toTextX,
        baselineInLineBox(toCursorY, toLineHeight, toFontSize)
      );
      toCursorY += toLineHeight;
    });
  } else {
    toCursorY += toLineHeight;
  }

  toCursorY += 4 * PX_TO_PT;
  if (teacherUniLines.length > 0) {
    teacherUniLines.forEach((line) => {
      pdf.text(
        line,
        toTextX,
        baselineInLineBox(toCursorY, toLineHeight, toFontSize)
      );
      toCursorY += toLineHeight;
    });
  }

  // Submitted By Body
  drawFormalRows(
    pdf,
    fontFamily,
    submittedByRows,
    contentLeft + colWidth + byPadX,
    tableTopY + tableHeaderHeight + byPadY
  );

  // =========================================================================
  // 5. DRAW SECTION 4: DATE OF SUBMISSION (No top horizontal divider)
  // =========================================================================
  const dateLabel = 'Date of Submission : ';
  const dateValue = formattedSubmissionDate;
  const footerBaseline = baselineInLineBox(
    footerTopY + footerPadTop,
    footerLineHeight,
    footerFontSize
  );

  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(footerFontSize);
  const dateLabelWidth = pdf.getTextWidth(dateLabel);

  pdf.setFont(fontFamily, 'normal');
  pdf.setFontSize(footerFontSize);
  const dateValueWidth = pdf.getTextWidth(dateValue);

  const dateStartX = centerX - (dateLabelWidth + dateValueWidth) / 2;
  pdf.setFont(fontFamily, 'bold');
  pdf.text(dateLabel, dateStartX, footerBaseline);
  pdf.setFont(fontFamily, 'normal');
  pdf.text(dateValue, dateStartX + dateLabelWidth, footerBaseline);

  return pdf;
}

/**
 * High-DPI lossless raster fallback used ONLY when non-WinAnsi complex scripts
 * (such as Bangla Unicode conjuncts) are present, ensuring proper OpenType
 * script shaping at 4x (384 DPI) lossless PNG quality.
 */
async function generateHighDpiUnicodePdf(
  element: HTMLElement
): Promise<jsPDF> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const finish = () => resolve();
          img.addEventListener('load', finish, { once: true });
          img.addEventListener('error', finish, { once: true });
        })
    )
  );

  const canvas = await html2canvas(element, {
    scale: 4,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    width: 794,
    height: 1123,
    windowWidth: 794,
    windowHeight: 1123,
    scrollX: 0,
    scrollY: 0,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: false,
  });

  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, 'cover-page-unicode', 'NONE');
  return pdf;
}

export async function exportCoverPageToPdf(
  data: CoverPageData,
  fallbackElement?: HTMLElement | null
): Promise<string> {
  const needsUnicodeFallback =
    containsNonWinAnsiText(data) && Boolean(fallbackElement);

  const pdf = needsUnicodeFallback && fallbackElement
    ? await generateHighDpiUnicodePdf(fallbackElement)
    : await generateVectorPdf(data);

  const filename = getExportFilename(data.documentType);
  pdf.save(filename);
  return filename;
}
