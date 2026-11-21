import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DEPARTMENT,
  DEFAULT_FACULTY,
  DEFAULT_UNIVERSITY_INFO,
  OFFICIAL_UNIVERSITY_LOGO_PATH,
  createDefaultCoverPageData,
  formatAcademicDate,
  getDepartmentsForFaculty,
  getExperimentNameFontSize,
  getExportFilename,
  getRequiredProgress,
  hasValidationErrors,
  isDepartmentValidForFaculty,
  isValidTeacherDesignation,
  resetCoverPageData,
  selectDepartment,
  selectFaculty,
  switchDocumentType,
  validateCoverPageData,
  validateLogoFile,
} from './coverPageLogic';
import {
  FACULTIES,
  FACULTY_DEPARTMENTS,
  TEACHER_DESIGNATIONS,
} from '../types/coverPage';

test('default data populates Netrokona University Engineering & CSE defaults without location', () => {
  const data = createDefaultCoverPageData();
  assert.equal(data.documentType, 'assignment');
  assert.equal(data.university.universityName, 'Netrokona University');
  assert.equal(data.university.faculty, DEFAULT_FACULTY);
  assert.equal(data.university.department, DEFAULT_DEPARTMENT);
  assert.equal('location' in data.university, false);
  assert.equal(data.teacher.designation, '');
  assert.equal(data.teacher.department, 'Computer Science and Engineering');
  assert.equal(data.logoDataUrl, OFFICIAL_UNIVERSITY_LOGO_PATH);
});

test('all four faculties map strictly to their specified departments', () => {
  assert.deepEqual([...FACULTIES], [
    'Faculty of Arts',
    'Faculty of Social Science',
    'Faculty of Engineering & Technology',
    'Faculty of Business Administration',
  ]);
  assert.deepEqual([...getDepartmentsForFaculty('Faculty of Arts')], [
    'Bangla',
    'English',
    'History and Archeology',
  ]);
  assert.deepEqual([...getDepartmentsForFaculty('Faculty of Social Science')], [
    'Economics',
    'International Relations',
    'Development Studies',
  ]);
  assert.deepEqual(
    [...getDepartmentsForFaculty('Faculty of Engineering & Technology')],
    [
      'Computer Science and Engineering',
      'Electrical and Electronic Engineering',
    ]
  );
  assert.deepEqual(
    [...getDepartmentsForFaculty('Faculty of Business Administration')],
    ['Accounting and Information System']
  );
  assert.equal(Object.keys(FACULTY_DEPARTMENTS).length, 4);
});

test('changing faculty resets department and blocks mismatched department selections', () => {
  const initial = createDefaultCoverPageData();
  assert.equal(initial.university.department, 'Computer Science and Engineering');

  const changedFaculty = selectFaculty(initial, 'Faculty of Arts');
  assert.equal(changedFaculty.university.faculty, 'Faculty of Arts');
  assert.equal(changedFaculty.university.department, '');
  assert.equal(
    isDepartmentValidForFaculty('Faculty of Arts', 'Computer Science and Engineering'),
    false
  );

  // Attempting to select a department from another faculty is ignored
  const blocked = selectDepartment(changedFaculty, 'Economics');
  assert.equal(blocked.university.department, '');

  // Selecting a valid department under Faculty of Arts succeeds
  const validDept = selectDepartment(changedFaculty, 'History and Archeology');
  assert.equal(validDept.university.department, 'History and Archeology');
  assert.equal(validDept.teacher.department, 'History and Archeology');
});

test('teacher designations list contains exactly the four required options', () => {
  assert.deepEqual([...TEACHER_DESIGNATIONS], [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Lecturer',
  ]);
  assert.equal(isValidTeacherDesignation('Professor'), true);
  assert.equal(isValidTeacherDesignation('Associate Professor'), true);
  assert.equal(isValidTeacherDesignation('Assistant Professor'), true);
  assert.equal(isValidTeacherDesignation('Lecturer'), true);
  assert.equal(isValidTeacherDesignation(''), false);
});

test('validation requires valid faculty/department and core fields while keeping registration number optional', () => {
  const empty = createDefaultCoverPageData();
  const emptyErrors = validateCoverPageData(empty);
  assert.equal(hasValidationErrors(emptyErrors), true);
  assert.equal(emptyErrors.faculty, undefined);
  assert.equal(emptyErrors.department, undefined);
  assert.ok(emptyErrors.studentName);
  assert.equal(emptyErrors.studentId, 'Please enter the class roll.');
  assert.ok(emptyErrors.courseCode);
  assert.ok(emptyErrors.courseTitle);
  assert.ok(emptyErrors.teacherName);
  assert.ok(emptyErrors.teacherDesignation);
  assert.ok(emptyErrors.submissionDate);

  // Changing faculty resets department and triggers department validation error
  const switchedFaculty = selectFaculty(empty, 'Faculty of Social Science');
  const deptErrors = validateCoverPageData(switchedFaculty);
  assert.ok(deptErrors.department);

  const validAssignment = {
    ...empty,
    student: {
      ...empty.student,
      name: 'Tahmid Hasan',
      studentId: '210101015',
      registrationNumber: '', // optional
      session: '2021-22',
    },
    course: {
      ...empty.course,
      courseCode: 'CSE-3101',
      courseTitle: 'Operating Systems',
      assignmentTopic: 'CPU Scheduling Algorithms',
      submissionDate: '2026-11-21',
    },
    teacher: {
      ...empty.teacher,
      name: 'Dr. Mahmudul Islam',
      designation: 'Assistant Professor' as const,
    },
  };

  assert.equal(hasValidationErrors(validateCoverPageData(validAssignment)), false);
});

test('lab report validation additionally requires experiment number and name', () => {
  const base = createDefaultCoverPageData();
  const labDraft = {
    ...switchDocumentType(base, 'lab-report'),
    student: {
      ...base.student,
      name: 'Nusrat Jahan',
      studentId: '210101022',
    },
    course: {
      ...base.course,
      courseCode: 'CSE-3102',
      courseTitle: 'Operating Systems Sessional',
      submissionDate: '2026-11-25',
    },
    teacher: {
      ...base.teacher,
      name: 'Md. Arif Hossain',
      designation: 'Lecturer' as const,
    },
  };

  const missingExpErrors = validateCoverPageData(labDraft);
  assert.equal(hasValidationErrors(missingExpErrors), true);
  assert.ok(missingExpErrors.experimentNumber);
  assert.ok(missingExpErrors.experimentName);

  const completeLab = {
    ...labDraft,
    course: {
      ...labDraft.course,
      experimentNumber: '04',
      experimentName: 'Implementation of Banker Algorithm for Deadlock Avoidance',
      experimentDate: '2026-11-18',
    },
  };

  assert.equal(hasValidationErrors(validateCoverPageData(completeLab)), false);
});

test('switching document type preserves student, teacher, faculty, department, and logo data', () => {
  const populated = {
    ...selectDepartment(
      selectFaculty(createDefaultCoverPageData(), 'Faculty of Business Administration'),
      'Accounting and Information System'
    ),
    student: {
      name: 'Sadia Afrin',
      studentId: '220101008',
      registrationNumber: '12345678',
      session: '2021-22',
    },
    teacher: {
      name: 'Dr. Kamal Uddin',
      designation: 'Professor' as const,
      department: 'Accounting and Information System',
    },
  };

  const switched = switchDocumentType(populated, 'lab-report');
  assert.equal(switched.documentType, 'lab-report');
  assert.deepEqual(switched.student, populated.student);
  assert.deepEqual(switched.teacher, populated.teacher);
  assert.deepEqual(switched.university, populated.university);
  assert.equal(switched.logoDataUrl, OFFICIAL_UNIVERSITY_LOGO_PATH);
});

test('reset restores default faculty, department, assignment type, empty designation, and official logo', () => {
  const reset = resetCoverPageData();
  assert.equal(reset.documentType, 'assignment');
  assert.equal(reset.teacher.designation, '');
  assert.equal(reset.logoDataUrl, OFFICIAL_UNIVERSITY_LOGO_PATH);
  assert.deepEqual(reset.university, DEFAULT_UNIVERSITY_INFO);
  assert.equal(reset.student.name, '');
});

test('export filename matches specification for assignment and lab report', () => {
  assert.equal(
    getExportFilename('assignment'),
    'Netrokona_University_Assignment_Cover.pdf'
  );
  assert.equal(
    getExportFilename('lab-report'),
    'Netrokona_University_Lab_Report_Cover.pdf'
  );
});

test('academic date formats ISO dates into readable dates', () => {
  assert.equal(formatAcademicDate('2026-11-21'), '21 November 2026');
  assert.equal(formatAcademicDate('2026-01-05'), '5 January 2026');
  assert.equal(formatAcademicDate(''), '');
});

test('logo file validation accepts png/jpg/jpeg/webp and rejects unsupported or oversized files', () => {
  assert.equal(
    validateLogoFile({ type: 'image/png', name: 'logo.png', size: 1024 }).valid,
    true
  );
  assert.equal(
    validateLogoFile({ type: 'application/pdf', name: 'logo.pdf', size: 1024 })
      .valid,
    false
  );
});

test('required progress counts accurately for assignment and lab report', () => {
  const base = createDefaultCoverPageData();
  // Default faculty + department are pre-filled (2 of 9 for Assignment, 2 of 11 for Lab Report)
  assert.deepEqual(getRequiredProgress(base), { completed: 2, total: 9 });
  const lab = switchDocumentType(base, 'lab-report');
  assert.deepEqual(getRequiredProgress(lab), { completed: 2, total: 11 });
});

test('experiment name font size scales down smoothly for long titles', () => {
  assert.equal(getExperimentNameFontSize(''), '13pt');
  assert.equal(
    getExperimentNameFontSize('Study of Logic Gates Using Digital ICs'),
    '13pt'
  );
  assert.equal(
    getExperimentNameFontSize(
      'Implementation of Half Adder and Full Adder Circuits'
    ),
    '12pt'
  );
  assert.equal(
    getExperimentNameFontSize(
      'Implementation of Banker Algorithm for Deadlock Avoidance'
    ),
    '11pt'
  );
  assert.equal(
    getExperimentNameFontSize(
      'Design and Implementation of Synchronous Up-Down Counters Using JK Flip-Flops'
    ),
    '10pt'
  );
});

