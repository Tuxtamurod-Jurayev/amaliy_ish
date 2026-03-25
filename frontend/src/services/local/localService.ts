import * as XLSX from "xlsx";
import type {
  Assignment,
  AssignmentCoverage,
  AssignmentView,
  AuthSession,
  GeneratedStudentCredentials,
  LocalDatabase,
  ProgrammingLanguage,
  StudentImportRow,
  StudentView,
  Submission,
  TeacherView,
  UserAccount,
} from "@/types/domain";
import { generateId, generatePassword, slugify } from "@/utils/format";

const STORAGE_KEY = "university-practical-local-db";

function createSeedDb(): LocalDatabase {
  return {
    users: [
      {
        id: "user_admin_local",
        role: "admin",
        name: "System Admin",
        email: "admin@amaliy.local",
        login: "admin",
        password: "admin123",
      },
    ],
    teachers: [],
    students: [],
    subjects: [],
    assignments: [],
    submissions: [],
    courses: [],
    courseLessons: [],
    courseProgress: [],
    lessonSubmissions: [],
  };
}

function readDb(): LocalDatabase {
  if (typeof window === "undefined") {
    return createSeedDb();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = createSeedDb();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      users: parsed.users ?? createSeedDb().users,
      teachers: parsed.teachers ?? [],
      students: parsed.students ?? [],
      subjects: parsed.subjects ?? [],
      assignments: parsed.assignments ?? [],
      submissions: parsed.submissions ?? [],
      courses: parsed.courses ?? [],
      courseLessons: parsed.courseLessons ?? [],
      courseProgress: parsed.courseProgress ?? [],
      lessonSubmissions: parsed.lessonSubmissions ?? [],
    };
  } catch {
    const seeded = createSeedDb();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function writeDb(db: LocalDatabase) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

async function transact<T>(callback: (db: LocalDatabase) => Promise<T> | T): Promise<T> {
  const db = readDb();
  const result = await callback(db);
  writeDb(db);
  return result;
}

function getUserOrThrow(db: LocalDatabase, userId: string): UserAccount {
  const user = db.users.find((item) => item.id === userId);
  if (!user) throw new Error("Foydalanuvchi topilmadi");
  return user;
}

function getTeacherProfileByUserId(db: LocalDatabase, userId: string) {
  const teacher = db.teachers.find((item) => item.userId === userId);
  if (!teacher) throw new Error("Teacher profile topilmadi");
  return teacher;
}

function getTeacherProfileById(db: LocalDatabase, teacherId: string) {
  const teacher = db.teachers.find((item) => item.id === teacherId);
  if (!teacher) throw new Error("Teacher topilmadi");
  return teacher;
}

function getStudentProfileByUserId(db: LocalDatabase, userId: string) {
  const student = db.students.find((item) => item.userId === userId);
  if (!student) throw new Error("Student topilmadi");
  return student;
}

function getStudentProfileById(db: LocalDatabase, studentId: string) {
  const student = db.students.find((item) => item.id === studentId);
  if (!student) throw new Error("Student topilmadi");
  return student;
}

function buildTeacherView(db: LocalDatabase, teacherId: string): TeacherView {
  const profile = getTeacherProfileById(db, teacherId);
  return {
    profile,
    account: getUserOrThrow(db, profile.userId),
  };
}

function buildStudentView(db: LocalDatabase, studentId: string): StudentView {
  const profile = getStudentProfileById(db, studentId);
  return {
    profile,
    account: getUserOrThrow(db, profile.userId),
  };
}

function assignmentTargetsStudent(assignment: Assignment, student: StudentView) {
  if (!student.profile.subjectIds.includes(assignment.subjectId)) return false;
  return assignment.assignToAll || assignment.targetStudentIds.includes(student.profile.id);
}

function evaluateJavascript(code: string, input = "") {
  const runner = new Function(
    `${code}
    if (typeof solve !== "function") {
      throw new Error("Kod ichida solve(input) funksiyasi bo'lishi kerak");
    }
    return solve;`,
  )() as (input: string) => unknown;

  return String(runner(input)).trim();
}

function createAssignmentView(db: LocalDatabase, assignment: Assignment, submission?: Submission): AssignmentView {
  const subject = db.subjects.find((item) => item.id === assignment.subjectId);
  if (!subject) throw new Error("Fan topilmadi");

  return {
    ...assignment,
    subject,
    teacher: buildTeacherView(db, assignment.createdBy),
    submission,
  };
}

function getTeacherContext(db: LocalDatabase, userId: string) {
  const teacher = getTeacherProfileByUserId(db, userId);
  const subjects = db.subjects.filter((subject) => subject.teacherId === teacher.id);
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const students = db.students
    .filter((student) => student.subjectIds.some((subjectId) => subjectIds.has(subjectId)))
    .map((student) => buildStudentView(db, student.id));
  const assignments = db.assignments.filter((assignment) => assignment.createdBy === teacher.id);
  const assignmentIds = new Set(assignments.map((assignment) => assignment.id));
  const submissions = db.submissions.filter((submission) => assignmentIds.has(submission.assignmentId));

  return {
    teacher: buildTeacherView(db, teacher.id),
    subjects,
    students,
    assignments,
    submissions,
  };
}

function getStudentContext(db: LocalDatabase, userId: string) {
  const student = buildStudentView(db, getStudentProfileByUserId(db, userId).id);
  const subjects = db.subjects.filter((subject) => student.profile.subjectIds.includes(subject.id));
  const submissions = db.submissions.filter((submission) => submission.studentId === student.profile.id);
  const submissionMap = new Map(submissions.map((submission) => [submission.assignmentId, submission]));

  const assignments = db.assignments
    .filter((assignment) => assignmentTargetsStudent(assignment, student))
    .map((assignment) => createAssignmentView(db, assignment, submissionMap.get(assignment.id)));

  return {
    student,
    subjects,
    assignments,
  };
}

function ensureUniqueLogin(db: LocalDatabase, login: string, ignoredUserId?: string) {
  const duplicate = db.users.find((item) => item.login === login && item.id !== ignoredUserId);
  if (duplicate) throw new Error("Bu login band");
}

function ensureTeacherOwnsSubjects(subjectIds: string[], ownedSubjectIds: string[]) {
  subjectIds.forEach((subjectId) => {
    if (!ownedSubjectIds.includes(subjectId)) {
      throw new Error("Teacherga tegishli bo'lmagan fan tanlandi");
    }
  });
}

function upsertSubmission(
  db: LocalDatabase,
  payload: Omit<Submission, "id" | "createdAt" | "updatedAt">,
) {
  const existingIndex = db.submissions.findIndex(
    (item) => item.studentId === payload.studentId && item.assignmentId === payload.assignmentId,
  );
  const now = new Date().toISOString();
  const previous = existingIndex >= 0 ? db.submissions[existingIndex] : undefined;
  const next: Submission = {
    ...payload,
    id: previous?.id ?? generateId("sub"),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    db.submissions[existingIndex] = next;
  } else {
    db.submissions.push(next);
  }

  return next;
}

function sortByUpdatedAt<T extends { updatedAt?: string; createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.updatedAt ?? right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
    reader.readAsDataURL(file);
  });
}

export const localAppService = {
  async login(login: string, password: string): Promise<AuthSession> {
    const db = readDb();
    const user = db.users.find((item) => item.login === login.trim() && item.password === password);
    if (!user) {
      throw new Error("Login yoki parol noto'g'ri");
    }
    return { user };
  },

  async getAdminStats() {
    const db = readDb();
    return {
      teachers: db.teachers.length,
      students: db.students.length,
      subjects: db.subjects.length,
      assignments: db.assignments.length,
    };
  },

  async getTeachers() {
    const db = readDb();
    return db.teachers.map((teacher) => buildTeacherView(db, teacher.id));
  },

  async createTeacher(input: { name: string; email: string; login: string; password: string; department?: string }) {
    await transact((db) => {
      ensureUniqueLogin(db, input.login);
      const userId = generateId("user");
      const teacherId = generateId("teacher");
      db.users.push({
        id: userId,
        role: "teacher",
        name: input.name,
        email: input.email || undefined,
        login: input.login,
        password: input.password,
      });
      db.teachers.push({
        id: teacherId,
        userId,
        department: input.department || undefined,
      });
    });
  },

  async updateTeacher(
    teacherId: string,
    input: { name: string; email: string; login: string; password: string; department?: string },
  ) {
    await transact((db) => {
      const teacher = getTeacherProfileById(db, teacherId);
      ensureUniqueLogin(db, input.login, teacher.userId);
      const user = getUserOrThrow(db, teacher.userId);
      user.name = input.name;
      user.email = input.email || undefined;
      user.login = input.login;
      user.password = input.password;
      teacher.department = input.department || undefined;
    });
  },

  async deleteTeacher(teacherId: string) {
    await transact((db) => {
      if (db.subjects.some((subject) => subject.teacherId === teacherId)) {
        throw new Error("Teacherga fan biriktirilgan, avval fanlarni boshqa teacherga o'tkazing");
      }

      const teacherIndex = db.teachers.findIndex((item) => item.id === teacherId);
      if (teacherIndex < 0) throw new Error("Teacher topilmadi");
      const teacher = db.teachers[teacherIndex];
      db.teachers.splice(teacherIndex, 1);
      db.users = db.users.filter((item) => item.id !== teacher.userId);
    });
  },

  async getSubjects() {
    const db = readDb();
    return db.subjects.map((subject) => ({
      ...subject,
      teacher: buildTeacherView(db, subject.teacherId),
    }));
  },

  async createSubject(input: { name: string; teacherId: string; type: "programming" | "file" }) {
    await transact((db) => {
      getTeacherProfileById(db, input.teacherId);
      db.subjects.push({
        id: generateId("subject"),
        name: input.name,
        teacherId: input.teacherId,
        type: input.type,
      });
    });
  },

  async updateSubject(subjectId: string, input: { name: string; teacherId: string; type: "programming" | "file" }) {
    await transact((db) => {
      getTeacherProfileById(db, input.teacherId);
      const subject = db.subjects.find((item) => item.id === subjectId);
      if (!subject) throw new Error("Fan topilmadi");
      subject.name = input.name;
      subject.teacherId = input.teacherId;
      subject.type = input.type;
    });
  },

  async getTeacherDashboard(userId: string) {
    const db = readDb();
    const context = getTeacherContext(db, userId);

    return {
      totalStudents: context.students.length,
      totalAssignments: context.assignments.length,
      submitted: context.submissions.length,
      notSubmitted:
        context.assignments.reduce((sum, assignment) => {
          const targetedStudents = context.students.filter((student) =>
            assignmentTargetsStudent(assignment, student),
          );
          return sum + targetedStudents.length;
        }, 0) - context.submissions.length,
      subjectCards: context.subjects.map((subject) => {
        const subjectAssignments = context.assignments.filter((assignment) => assignment.subjectId === subject.id);
        const subjectSubmissions = context.submissions.filter((submission) =>
          subjectAssignments.some((assignment) => assignment.id === submission.assignmentId),
        );
        return {
          ...subject,
          assignmentCount: subjectAssignments.length,
          submissionCount: subjectSubmissions.length,
        };
      }),
      progress: context.assignments.map((assignment) => {
        const targetedCount = context.students.filter((student) =>
          assignmentTargetsStudent(assignment, student),
        ).length;
        const submittedCount = context.submissions.filter(
          (submission) => submission.assignmentId === assignment.id,
        ).length;
        return {
          assignment,
          targetedCount,
          submittedCount,
        };
      }),
      students: context.students,
    };
  },

  async getStudentsForTeacher(userId: string) {
    const db = readDb();
    const context = getTeacherContext(db, userId);
    return context.students.map((student) => ({
      ...student,
      subjects: db.subjects.filter((subject) => student.profile.subjectIds.includes(subject.id)),
    }));
  },

  async createStudent(
    userId: string,
    input: { name: string; groupName: string; studentCode: string; subjectIds: string[] },
  ) {
    return transact((db) => {
      const context = getTeacherContext(db, userId);
      ensureTeacherOwnsSubjects(input.subjectIds, context.subjects.map((subject) => subject.id));

      if (db.students.some((item) => item.studentCode === input.studentCode)) {
        throw new Error("Bu student ID allaqachon mavjud");
      }

      const base = slugify(input.name).split(".")[0] || "student";
      let login = `st.${base}`;
      let suffix = 1;
      while (db.users.some((item) => item.login === login)) {
        login = `st.${base}${suffix}`;
        suffix += 1;
      }

      const password = generatePassword();
      const userIdValue = generateId("user");
      const studentId = generateId("student");

      db.users.push({
        id: userIdValue,
        role: "student",
        name: input.name,
        email: `${login}@amaliy.local`,
        login,
        password,
      });

      db.students.push({
        id: studentId,
        userId: userIdValue,
        groupName: input.groupName,
        studentCode: input.studentCode,
        subjectIds: input.subjectIds,
      });

      return {
        credentials: {
          name: input.name,
          groupName: input.groupName,
          studentCode: input.studentCode,
          login,
          password,
        } satisfies GeneratedStudentCredentials,
      };
    });
  },

  async importStudents(userId: string, rows: StudentImportRow[], subjectIds: string[]) {
    const credentials: GeneratedStudentCredentials[] = [];
    for (const row of rows) {
      if (!row.name || !row.group || !row.student_id) continue;
      const result = await this.createStudent(userId, {
        name: row.name,
        groupName: row.group,
        studentCode: row.student_id,
        subjectIds,
      });
      credentials.push(result.credentials);
    }
    return credentials;
  },

  async getTeacherAssignments(userId: string) {
    const db = readDb();
    const context = getTeacherContext(db, userId);
    return context.assignments.map((assignment) => createAssignmentView(db, assignment));
  },

  async createAssignment(
    userId: string,
    input: {
      title: string;
      description: string;
      subjectId: string;
      type: "programming" | "file";
      deadline: string;
      language?: "cpp" | "csharp" | "python" | "javascript";
      assignToAll: boolean;
      targetStudentIds: string[];
      testInput?: string;
      expectedOutput?: string;
    },
  ) {
    await transact((db) => {
      const context = getTeacherContext(db, userId);
      if (!context.subjects.some((subject) => subject.id === input.subjectId)) {
        throw new Error("Faqat o'zingizning faningizga topshiriq biriktira olasiz");
      }

      if (!input.assignToAll && input.targetStudentIds.length === 0) {
        throw new Error("Kamida bitta talaba tanlang");
      }

      db.assignments.push({
        id: generateId("assignment"),
        title: input.title,
        description: input.description,
        subjectId: input.subjectId,
        type: input.type,
        deadline: input.deadline,
        language: input.type === "programming" ? input.language : undefined,
        createdBy: context.teacher.profile.id,
        assignToAll: input.assignToAll,
        targetStudentIds: input.assignToAll ? [] : input.targetStudentIds,
        testInput: input.type === "programming" ? input.testInput : undefined,
        expectedOutput: input.type === "programming" ? input.expectedOutput : undefined,
      });
    });
  },

  async getTeacherSubmissions(userId: string) {
    const db = readDb();
    const context = getTeacherContext(db, userId);

    return sortByUpdatedAt(context.submissions).map((submission) => {
      const assignment = context.assignments.find((item) => item.id === submission.assignmentId);
      if (!assignment) throw new Error("Assignment topilmadi");
      return {
        submission,
        assignment: createAssignmentView(db, assignment),
        student: buildStudentView(db, submission.studentId),
        teacher: context.teacher.profile,
      };
    });
  },

  async reviewSubmission(
    userId: string,
    submissionId: string,
    input: { status: "accepted" | "rejected"; comment?: string },
  ) {
    await transact((db) => {
      const context = getTeacherContext(db, userId);
      const submission = db.submissions.find((item) => item.id === submissionId);
      if (!submission) throw new Error("Submission topilmadi");
      if (!context.assignments.some((assignment) => assignment.id === submission.assignmentId)) {
        throw new Error("Bu submission sizga tegishli emas");
      }

      submission.status = input.status;
      submission.comment = input.comment || undefined;
      submission.updatedAt = new Date().toISOString();
    });
  },

  async getAssignmentCoverage(userId: string): Promise<AssignmentCoverage[]> {
    const db = readDb();
    const context = getTeacherContext(db, userId);

    return context.assignments.flatMap((assignment) => {
      const targetedStudents = context.students.filter((student) =>
        assignmentTargetsStudent(assignment, student),
      );
      return targetedStudents.map((student) => {
        const submission = context.submissions.find(
          (item) => item.studentId === student.profile.id && item.assignmentId === assignment.id,
        );
        return {
          assignment,
          student,
          submitted: Boolean(submission),
          submission,
        };
      });
    });
  },

  async getStudentDashboard(userId: string) {
    const db = readDb();
    const context = getStudentContext(db, userId);
    return {
      student: context.student,
      subjects: context.subjects,
      assignments: context.assignments,
      stats: {
        total: context.assignments.length,
        submitted: context.assignments.filter((item) => item.submission).length,
        accepted: context.assignments.filter((item) => item.submission?.status === "accepted").length,
        pending: context.assignments.filter((item) => item.submission?.status === "pending").length,
      },
    };
  },

  async getStudentAssignments(userId: string) {
    return (await this.getStudentDashboard(userId)).assignments;
  },

  async submitProgramming(
    userId: string,
    assignmentId: string,
    code: string,
    language: ProgrammingLanguage,
  ) {
    return transact((db) => {
      const context = getStudentContext(db, userId);
      const assignment = context.assignments.find((item) => item.id === assignmentId);
      if (!assignment || assignment.type !== "programming") {
        throw new Error("Programming assignment topilmadi");
      }

      let autoCheck: Submission["autoCheck"] = "manual_review";
      let submittedOutput = "";

      if (language === "javascript") {
        submittedOutput = evaluateJavascript(code, assignment.testInput ?? "");
        autoCheck =
          submittedOutput === String(assignment.expectedOutput ?? "").trim() ? "passed" : "failed";
      }

      upsertSubmission(db, {
        studentId: context.student.profile.id,
        assignmentId,
        code,
        language,
        status: "pending",
        autoCheck,
        comment: undefined,
        submittedOutput: submittedOutput || undefined,
      });

      return { autoCheck, submittedOutput };
    });
  },

  async submitFile(userId: string, assignmentId: string, file: File) {
    return transact(async (db) => {
      const context = getStudentContext(db, userId);
      const assignment = context.assignments.find((item) => item.id === assignmentId);
      if (!assignment || assignment.type !== "file") {
        throw new Error("File assignment topilmadi");
      }

      const content = await fileToDataUrl(file);
      upsertSubmission(db, {
        studentId: context.student.profile.id,
        assignmentId,
        file: {
          name: file.name,
          type: file.type,
          content,
          size: file.size,
        },
        status: "pending",
        autoCheck: "not_required",
        comment: undefined,
      });
    });
  },

  async parseImportFile(file: File): Promise<StudentImportRow[]> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: "",
    });

    return rows.map((row) => ({
      name: String(row.name ?? "").trim(),
      group: String(row.group ?? "").trim(),
      student_id: String(row.student_id ?? row.studentId ?? "").trim(),
    }));
  },
};
