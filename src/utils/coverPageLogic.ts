import {
  FACULTIES,
  FACULTY_DEPARTMENTS,
  TEACHER_DESIGNATIONS,
  type CoverPageData,
  type DocumentType,
  type FacultyName,
  type TeacherDesignation,
  type UniversityInfo,
  type ValidationErrors,
} from '../types/coverPage';

export const DEFAULT_FACULTY: FacultyName =
  'Faculty of Engineering & Technology';

export const DEFAULT_DEPARTMENT = 'Computer Science and Engineering';

export const DEFAULT_UNIVERSITY_INFO: UniversityInfo = {
  universityName: 'Netrokona University',
  faculty: DEFAULT_FACULTY,
  department: DEFAULT_DEPARTMENT,
};

export const OFFICIAL_UNIVERSITY_LOGO_PATH =
  '/assets/aistudio/images_d5608450.jpeg';

export const OFFICIAL_UNIVERSITY_LOGO_NAME =
  'Netrokona University Official Logo';

export const ACCEPTED_LOGO_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const;

export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function isValidFaculty(value: string): value is FacultyName {
  return (FACULTIES as readonly string[]).includes(value);
}

export function getDepartmentsForFaculty(
  faculty: FacultyName | ''
): readonly string[] {
  if (!faculty || !isValidFaculty(faculty)) {
    return [];
  }
  return FACULTY_DEPARTMENTS[faculty];
}

export function isDepartmentValidForFaculty(
  faculty: FacultyName | '',
  department: string
): boolean {
  if (!faculty || !department) {
    return false;
  }
  return getDepartmentsForFaculty(faculty).includes(department);
}

export function createDefaultCoverPageData(): CoverPageData {
  return {
    documentType: 'assignment',
    university: { ...DEFAULT_UNIVERSITY_INFO },
    student: {
      name: '',
      studentId: '',
      registrationNumber: '',
      session: '',
    },
    course: {
      courseCode: '',
      courseTitle: '',
      assignmentTopic: '',
      experimentNumber: '',
      experimentName: '',
      experimentDate: '',
      submissionDate: '',
    },
    teacher: {
      name: '',
      designation: '',
      department: DEFAULT_DEPARTMENT,
    },
    logoDataUrl: OFFICIAL_UNIVERSITY_LOGO_PATH,
    logoFileName: OFFICIAL_UNIVERSITY_LOGO_NAME,
  };
}

export function selectFaculty(
  current: CoverPageData,
  nextFaculty: FacultyName | ''
): CoverPageData {
  if (current.university.faculty === nextFaculty) {
    return current;
  }

  const shouldSyncTeacherDept =
    current.teacher.department === current.university.department;

  return {
    ...current,
    university: {
      ...current.university,
      faculty: nextFaculty,
      // Always reset department when faculty changes
      department: '',
    },
    teacher: shouldSyncTeacherDept
      ? { ...current.teacher, department: '' }
      : current.teacher,
  };
}

export function selectDepartment(
  current: CoverPageData,
  nextDepartment: string
): CoverPageData {
  if (
    nextDepartment !== '' &&
    !isDepartmentValidForFaculty(current.university.faculty, nextDepartment)
  ) {
    return current;
  }

  const shouldSyncTeacherDept =
    current.teacher.department === '' ||
    current.teacher.department === current.university.department;

  return {
    ...current,
    university: {
      ...current.university,
      department: nextDepartment,
    },
    teacher: shouldSyncTeacherDept
      ? { ...current.teacher, department: nextDepartment }
      : current.teacher,
  };
}

export function switchDocumentType(
  current: CoverPageData,
  nextType: DocumentType
): CoverPageData {
  if (current.documentType === nextType) {
    return current;
  }
  return {
    ...current,
    documentType: nextType,
  };
}

export function resetCoverPageData(): CoverPageData {
  return createDefaultCoverPageData();
}

export function isValidTeacherDesignation(
  value: string
): value is Exclude<TeacherDesignation, ''> {
  return (TEACHER_DESIGNATIONS as readonly string[]).includes(value);
}

export function validateCoverPageData(data: CoverPageData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!isValidFaculty(data.university.faculty)) {
    errors.faculty = 'Please select a faculty.';
  }

  if (
    !isDepartmentValidForFaculty(
      data.university.faculty,
      data.university.department
    )
  ) {
    errors.department = 'Please select a department for the chosen faculty.';
  }

  if (!data.student.name.trim()) {
    errors.studentName = 'Please enter the student name.';
  }

  if (!data.student.studentId.trim()) {
    errors.studentId = 'Please enter the class roll.';
  }

  if (!data.course.courseCode.trim()) {
    errors.courseCode = 'Please enter the course code.';
  }

  if (!data.course.courseTitle.trim()) {
    errors.courseTitle = 'Please enter the course title.';
  }

  if (data.documentType === 'lab-report') {
    if (!data.course.experimentNumber.trim()) {
      errors.experimentNumber = 'Please enter the experiment number.';
    }
    if (!data.course.experimentName.trim()) {
      errors.experimentName = 'Please enter the experiment name.';
    }
  }

  if (!data.course.submissionDate.trim()) {
    errors.submissionDate = 'Please select a submission date.';
  }

  if (!data.teacher.name.trim()) {
    errors.teacherName = 'Please enter the teacher name.';
  }

  if (!isValidTeacherDesignation(data.teacher.designation)) {
    errors.teacherDesignation = 'Please select a teacher designation.';
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getExportFilename(documentType: DocumentType): string {
  return documentType === 'lab-report'
    ? 'Netrokona_University_Lab_Report_Cover.pdf'
    : 'Netrokona_University_Assignment_Cover.pdf';
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function formatAcademicDate(isoDate: string): string {
  const trimmed = isoDate.trim();
  if (!trimmed) {
    return '';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);

  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) {
    return trimmed;
  }

  return `${day} ${MONTH_NAMES[monthIndex]} ${year}`;
}

export function validateLogoFile(file: {
  type: string;
  name: string;
  size: number;
}): { valid: boolean; error?: string } {
  const normalizedType = file.type.toLowerCase();
  const normalizedName = file.name.toLowerCase();
  const hasValidMime = (ACCEPTED_LOGO_MIME_TYPES as readonly string[]).includes(
    normalizedType
  );
  const hasValidExt = /\.(png|jpe?g|webp)$/i.test(normalizedName);

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error:
        'Unsupported format. Please upload a PNG, JPG, JPEG, or WEBP image.',
    };
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Image file is too large. Please choose a logo under 5 MB.',
    };
  }

  return { valid: true };
}

export function getRequiredProgress(data: CoverPageData): {
  completed: number;
  total: number;
} {
  const requiredValues: boolean[] = [
    isValidFaculty(data.university.faculty),
    isDepartmentValidForFaculty(
      data.university.faculty,
      data.university.department
    ),
    Boolean(data.student.name.trim()),
    Boolean(data.student.studentId.trim()),
    Boolean(data.course.courseCode.trim()),
    Boolean(data.course.courseTitle.trim()),
    Boolean(data.course.submissionDate.trim()),
    Boolean(data.teacher.name.trim()),
    isValidTeacherDesignation(data.teacher.designation),
  ];

  if (data.documentType === 'lab-report') {
    requiredValues.push(
      Boolean(data.course.experimentNumber.trim()),
      Boolean(data.course.experimentName.trim())
    );
  }

  return {
    completed: requiredValues.filter(Boolean).length,
    total: requiredValues.length,
  };
}
