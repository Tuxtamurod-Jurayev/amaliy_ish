export type UserRole = "admin" | "teacher" | "student";
export type LanguageCode = "uz" | "en" | "ru";
export type SubjectType = "programming" | "file";
export type AssignmentType = "programming" | "file";
export type ProgrammingLanguage = "cpp" | "csharp" | "python" | "javascript";
export type SubmissionStatus = "pending" | "accepted" | "rejected";
export type AutoCheckStatus = "not_required" | "passed" | "failed" | "manual_review";
export type CourseCategory = "mathematics" | "english" | "russian" | "programming";
export type LessonAssignmentType = "image" | "voice" | "code_puzzle";

export interface UserAccount {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  login: string;
  password: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  department?: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  groupName: string;
  studentCode: string;
  subjectIds: string[];
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  type: SubjectType;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  type: AssignmentType;
  deadline: string;
  language?: ProgrammingLanguage;
  createdBy: string;
  assignToAll: boolean;
  targetStudentIds: string[];
  testInput?: string;
  expectedOutput?: string;
}

export interface StoredFile {
  name: string;
  type: string;
  content: string;
  size: number;
}

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  code?: string;
  language?: ProgrammingLanguage;
  file?: StoredFile;
  status: SubmissionStatus;
  autoCheck: AutoCheckStatus;
  comment?: string;
  submittedOutput?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  coverImage?: string;
  totalDurationMinutes: number;
  createdBy: string;
}

export interface CourseLesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  summary: string;
  videoUrl: string;
  durationMinutes: number;
  assignmentType: LessonAssignmentType;
  assignmentPrompt: string;
  brokenCode?: string;
  solutionCode?: string;
  language?: ProgrammingLanguage;
}

export interface LessonProgress {
  lessonId: string;
  watchedSeconds: number;
  completedVideo: boolean;
  completedAssignment: boolean;
  updatedAt: string;
}

export interface CourseProgress {
  id: string;
  courseId: string;
  studentId: string;
  lessonProgress: LessonProgress[];
  updatedAt: string;
}

export interface LessonSubmission {
  id: string;
  courseId: string;
  lessonId: string;
  studentId: string;
  type: LessonAssignmentType;
  status: SubmissionStatus;
  file?: StoredFile;
  code?: string;
  autoCheck: AutoCheckStatus;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalDatabase {
  users: UserAccount[];
  teachers: TeacherProfile[];
  students: StudentProfile[];
  subjects: Subject[];
  assignments: Assignment[];
  submissions: Submission[];
  courses: Course[];
  courseLessons: CourseLesson[];
  courseProgress: CourseProgress[];
  lessonSubmissions: LessonSubmission[];
}

export interface AuthSession {
  user: UserAccount;
}

export interface TeacherView {
  profile: TeacherProfile;
  account: UserAccount;
}

export interface StudentView {
  profile: StudentProfile;
  account: UserAccount;
}

export interface AssignmentView extends Assignment {
  subject: Subject;
  teacher: TeacherView;
  submission?: Submission;
}

export interface StudentImportRow {
  name: string;
  group: string;
  student_id: string;
}

export interface GeneratedStudentCredentials {
  name: string;
  groupName: string;
  studentCode: string;
  login: string;
  password: string;
}

export interface AssignmentCoverage {
  student: StudentView;
  assignment: Assignment;
  submitted: boolean;
  submission?: Submission;
}

export interface AdminCourseView extends Course {
  lessons: CourseLesson[];
}

export interface StudentCourseCard extends Course {
  lessons: CourseLesson[];
  completedLessons: number;
  totalLessons: number;
  completedAssignments: number;
  nextLesson?: CourseLesson;
}

export interface StudentCourseLessonView {
  lesson: CourseLesson;
  progress?: LessonProgress;
  submission?: LessonSubmission;
  unlocked: boolean;
}

export interface StudentCourseView extends Course {
  lessons: StudentCourseLessonView[];
  completedLessons: number;
  completedAssignments: number;
  totalLessons: number;
}
