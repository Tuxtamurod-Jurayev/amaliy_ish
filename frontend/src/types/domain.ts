export type UserRole = "admin" | "teacher" | "student";
export type SubjectType = "programming" | "file";
export type AssignmentType = "programming" | "file";
export type ProgrammingLanguage = "cpp" | "csharp" | "python" | "javascript";
export type SubmissionStatus = "pending" | "accepted" | "rejected";
export type AutoCheckStatus = "not_required" | "passed" | "failed" | "manual_review";

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

export interface LocalDatabase {
  users: UserAccount[];
  teachers: TeacherProfile[];
  students: StudentProfile[];
  subjects: Subject[];
  assignments: Assignment[];
  submissions: Submission[];
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
