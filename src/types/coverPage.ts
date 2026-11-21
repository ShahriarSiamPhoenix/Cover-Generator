export type DocumentType = 'assignment' | 'lab-report';

export const TEACHER_DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
] as const;

export type TeacherDesignation = (typeof TEACHER_DESIGNATIONS)[number] | '';

export const FACULTY_DEPARTMENTS = {
  'Faculty of Arts': ['Bangla', 'English', 'History and Archeology'],
  'Faculty of Social Science': [
    'Economics',
    'International Relations',
    'Development Studies',
  ],
  'Faculty of Engineering & Technology': [
    'Computer Science and Engineering',
    'Electrical and Electronic Engineering',
  ],
  'Faculty of Business Administration': ['Accounting and Information System'],
} as const;

export type FacultyName = keyof typeof FACULTY_DEPARTMENTS;

export const FACULTIES = Object.keys(FACULTY_DEPARTMENTS) as FacultyName[];

export interface UniversityInfo {
  universityName: string;
  faculty: FacultyName | '';
  department: string;
}

export interface StudentInfo {
  name: string;
  studentId: string;
  registrationNumber: string;
  session: string;
}

export interface CourseInfo {
  courseCode: string;
  courseTitle: string;
  assignmentTopic: string;
  experimentNumber: string;
  experimentName: string;
  experimentDate: string;
  submissionDate: string;
}

export interface TeacherInfo {
  name: string;
  designation: TeacherDesignation;
  department: string;
}

export interface CoverPageData {
  documentType: DocumentType;
  university: UniversityInfo;
  student: StudentInfo;
  course: CourseInfo;
  teacher: TeacherInfo;
  logoDataUrl: string | null;
  logoFileName: string | null;
}

export type ValidationField =
  | 'faculty'
  | 'department'
  | 'studentName'
  | 'studentId'
  | 'courseCode'
  | 'courseTitle'
  | 'experimentNumber'
  | 'experimentName'
  | 'teacherName'
  | 'teacherDesignation'
  | 'submissionDate';

export type ValidationErrors = Partial<Record<ValidationField, string>>;
