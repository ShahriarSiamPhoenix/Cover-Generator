import test from 'node:test';
import assert from 'node:assert/strict';
import {
  A4_HEIGHT_PT,
  A4_WIDTH_PT,
  PDF_LAYOUT,
  computeVerticalDistribution,
  containsNonWinAnsiText,
  detectImageFormatFromDataUrl,
  fitImageInBox,
  formatTeacherDepartmentLine,
} from './pdfLayout';
import { createDefaultCoverPageData } from './coverPageLogic';

test('A4 portrait dimensions match exact ISO 216 210x297mm in PostScript points', () => {
  // 210mm * 72 / 25.4 = 595.2756pt; 297mm * 72 / 25.4 = 841.8898pt
  assert.ok(Math.abs(A4_WIDTH_PT - 595.28) < 0.01);
  assert.ok(Math.abs(A4_HEIGHT_PT - 841.89) < 0.01);
  assert.equal(PDF_LAYOUT.borderInset, 30);
  assert.ok(PDF_LAYOUT.contentWidth > 480 && PDF_LAYOUT.contentWidth < 495);
});

test('fitImageInBox preserves exact aspect ratio for square, landscape, and portrait logos', () => {
  // Square logo (e.g., 512x512) inside 112.5 x 99pt box -> 99 x 99pt centered horizontally
  const square = fitImageInBox(512, 512, 112.5, 99);
  assert.equal(square.height, 99);
  assert.equal(square.width, 99);
  assert.equal(square.offsetX, (112.5 - 99) / 2);
  assert.equal(square.offsetY, 0);

  // Landscape logo (400x200) inside 112.5 x 99pt box -> 112.5 x 56.25pt centered vertically
  const landscape = fitImageInBox(400, 200, 112.5, 99);
  assert.equal(landscape.width, 112.5);
  assert.equal(landscape.height, 56.25);
  assert.equal(landscape.offsetX, 0);
  assert.equal(landscape.offsetY, (99 - 56.25) / 2);

  // Portrait logo (200x400) inside 112.5 x 99pt box -> 49.5 x 99pt
  const portrait = fitImageInBox(200, 400, 112.5, 99);
  assert.equal(portrait.height, 99);
  assert.equal(portrait.width, 49.5);
  assert.equal(portrait.width / portrait.height, 0.5);
});

test('detectImageFormatFromDataUrl identifies native JPEG/PNG vs WEBP conversion', () => {
  assert.equal(
    detectImageFormatFromDataUrl('data:image/jpeg;base64,/9j/4AAQ'),
    'JPEG'
  );
  assert.equal(
    detectImageFormatFromDataUrl('data:image/jpg;base64,/9j/4AAQ'),
    'JPEG'
  );
  assert.equal(
    detectImageFormatFromDataUrl('data:image/png;base64,iVBORw0KGgo'),
    'PNG'
  );
  assert.equal(
    detectImageFormatFromDataUrl('data:image/webp;base64,UklGRh4AAABX'),
    'CONVERT_TO_PNG'
  );
});

test('containsNonWinAnsiText routes English/Latin cover pages to native vector PDF and flags Bangla script', () => {
  const english = createDefaultCoverPageData();
  english.student.name = 'Shahriar Hossain Siam';
  english.course.courseTitle = 'Digital Logic Design — Sessional';
  english.course.experimentName = 'Study of Logic Gates Using Digital ICs';
  assert.equal(containsNonWinAnsiText(english), false);

  const bangla = {
    ...english,
    course: {
      ...english.course,
      assignmentTopic: 'বাংলা সাহিত্য ও সংস্কৃতি',
    },
  };
  assert.equal(containsNonWinAnsiText(bangla), true);
});

test('computeVerticalDistribution mirrors justify-between spacing without overlap', () => {
  const positions = computeVerticalDistribution(50, 740, [160, 180, 170, 20]);
  // Remaining space = 740 - 530 = 210, split across 3 gaps = 70pt each
  assert.deepEqual(positions, [50, 280, 530, 770]);
  // Bottom edge of last block lands cleanly at topY + availableHeight
  assert.equal(positions[3] + 20, 790);

  // Dense blocks clamp at minGap instead of overlapping
  const dense = computeVerticalDistribution(50, 200, [80, 80, 80], 10);
  assert.deepEqual(dense, [50, 140, 230]);
});

test('formatTeacherDepartmentLine prefixes Department of once without duplication', () => {
  assert.equal(
    formatTeacherDepartmentLine('Computer Science and Engineering', ''),
    'Department of Computer Science and Engineering'
  );
  assert.equal(
    formatTeacherDepartmentLine(
      'Department of Computer Science and Engineering',
      ''
    ),
    'Department of Computer Science and Engineering'
  );
  assert.equal(
    formatTeacherDepartmentLine('', 'Electrical and Electronic Engineering'),
    'Department of Electrical and Electronic Engineering'
  );
});
