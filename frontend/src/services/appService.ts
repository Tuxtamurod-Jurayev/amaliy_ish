import * as XLSX from "xlsx";
import { supabase } from "@/services/supabase/client";
import type {
  Assignment,
  AssignmentCoverage,
  AssignmentView,
  AuthSession,
  GeneratedStudentCredentials,
  ProgrammingLanguage,
  StudentImportRow,
  StudentProfile,
  StudentView,
  StoredFile,
  Subject,
  Submission,
  TeacherProfile,
  TeacherView,
  UserAccount,
} from "@/types/domain";
import { generatePassword, slugify } from "@/utils/format";

function ensureEnv() {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error("Supabase environment variables topilmadi");
  }
}

function failIfError(error: { message?: string } | null) {
  if (error) {
    throw new Error(error.message ?? "Supabase so'rovida xatolik yuz berdi");
  }
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function mapUser(row: any): UserAccount {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email ?? undefined,
    login: row.login,
    password: row.password_hash ?? "",
  };
}

function mapTeacherProfile(row: any): TeacherProfile {
  return {
    id: row.id,
    userId: row.user_id,
    department: row.department ?? undefined,
  };
}

function mapStudentProfile(row: any, subjectIds: string[]): StudentProfile {
  return {
    id: row.id,
    userId: row.user_id,
    groupName: row.group_name,
    studentCode: row.student_code,
    subjectIds,
  };
}

function mapSubject(row: any): Subject {
  return {
    id: row.id,
    name: row.name,
    teacherId: row.teacher_id,
    type: row.type,
  };
}

function mapAssignment(row: any, targetStudentIds: string[]): Assignment {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    subjectId: row.subject_id,
    type: row.type,
    deadline: row.deadline,
    language: row.language ?? undefined,
    createdBy: row.created_by,
    assignToAll: row.assign_to_all,
    targetStudentIds,
    testInput: row.test_input ?? undefined,
    expectedOutput: row.expected_output ?? undefined,
  };
}

function mapSubmission(row: any): Submission {
  return {
    id: row.id,
    studentId: row.student_id,
    assignmentId: row.assignment_id,
    code: row.code ?? undefined,
    language: row.language ?? undefined,
    file: row.file_url
      ? {
          name: row.file_name ?? "submission",
          type: row.file_type ?? "",
          content: row.file_url,
          size: Number(row.file_size ?? 0),
        }
      : undefined,
    status: row.status,
    autoCheck: row.auto_check,
    comment: row.comment ?? undefined,
    submittedOutput: row.submitted_output ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function evaluateJavascript(code: string, input = "") {
  const runner = new Function(
    `${code}
    if (typeof solve !== "function") {
      throw new Error("Kod ichida solve(input) funksiyasi bo'lishi kerak");
    }
    return solve;`,
  )() as (input: string) => unknown;

  const result = runner(input);
  return String(result).trim();
}

async function getUsersByIds(ids: string[]) {
  const userIds = unique(ids.filter(Boolean));
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.from("users").select("*").in("id", userIds);
  failIfError(error);
  return data ?? [];
}

async function getUserByLoginPassword(login: string, password: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("login", login.trim())
    .eq("password_hash", password)
    .maybeSingle();
  failIfError(error);
  return data;
}

async function getTeacherByUserId(userId: string) {
  const { data, error } = await supabase.from("teachers").select("*").eq("user_id", userId).maybeSingle();
  failIfError(error);
  return data;
}

async function getStudentByUserId(userId: string) {
  const { data, error } = await supabase.from("students").select("*").eq("user_id", userId).maybeSingle();
  failIfError(error);
  return data;
}

async function getStudentSubjectLinksByStudentIds(studentIds: string[]) {
  const ids = unique(studentIds.filter(Boolean));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("student_subjects").select("*").in("student_id", ids);
  failIfError(error);
  return data ?? [];
}

async function getStudentSubjectLinksBySubjectIds(subjectIds: string[]) {
  const ids = unique(subjectIds.filter(Boolean));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("student_subjects").select("*").in("subject_id", ids);
  failIfError(error);
  return data ?? [];
}

async function getAssignmentStudentLinksByAssignmentIds(assignmentIds: string[]) {
  const ids = unique(assignmentIds.filter(Boolean));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("assignment_students").select("*").in("assignment_id", ids);
  failIfError(error);
  return data ?? [];
}

async function getSubjectsByTeacherId(teacherId: string) {
  const { data, error } = await supabase.from("subjects").select("*").eq("teacher_id", teacherId);
  failIfError(error);
  return data ?? [];
}

async function getSubjectsByIds(subjectIds: string[]) {
  const ids = unique(subjectIds.filter(Boolean));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("subjects").select("*").in("id", ids);
  failIfError(error);
  return data ?? [];
}

async function getAssignmentsByTeacherId(teacherId: string) {
  const { data, error } = await supabase.from("assignments").select("*").eq("created_by", teacherId);
  failIfError(error);
  return data ?? [];
}

async function getAssignmentsBySubjectIds(subjectIds: string[]) {
  const ids = unique(subjectIds.filter(Boolean));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("assignments").select("*").in("subject_id", ids);
  failIfError(error);
  return data ?? [];
}

async function getSubmissionsByAssignmentIds(assignmentIds: string[]) {
  const ids = unique(assignmentIds.filter(Boolean));
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("submissions").select("*").in("assignment_id", ids);
  failIfError(error);
  return data ?? [];
}

async function getSubmissionsByStudentId(studentId: string) {
  const { data, error } = await supabase.from("submissions").select("*").eq("student_id", studentId);
  failIfError(error);
  return data ?? [];
}

async function getTeacherViewFromRow(teacherRow: any) {
  const users = await getUsersByIds([teacherRow.user_id]);
  const account = users[0];
  if (!account) throw new Error("Teacher account topilmadi");
  return {
    profile: mapTeacherProfile(teacherRow),
    account: mapUser(account),
  } satisfies TeacherView;
}

async function buildTeacherMap(teacherRows: any[]) {
  const users = await getUsersByIds(teacherRows.map((row) => row.user_id));
  const userMap = new Map(users.map((row) => [row.id, row]));
  return new Map(
    teacherRows.map((teacherRow) => [
      teacherRow.id,
      {
        profile: mapTeacherProfile(teacherRow),
        account: mapUser(userMap.get(teacherRow.user_id)),
      } satisfies TeacherView,
    ]),
  );
}

async function buildStudentViews(studentRows: any[]) {
  const studentIds = studentRows.map((row) => row.id);
  const [users, links] = await Promise.all([
    getUsersByIds(studentRows.map((row) => row.user_id)),
    getStudentSubjectLinksByStudentIds(studentIds),
  ]);

  const userMap = new Map(users.map((row) => [row.id, row]));
  const subjectIdsByStudent = new Map<string, string[]>();
  links.forEach((link: any) => {
    const current = subjectIdsByStudent.get(link.student_id) ?? [];
    current.push(link.subject_id);
    subjectIdsByStudent.set(link.student_id, current);
  });

  return new Map(
    studentRows.map((studentRow) => [
      studentRow.id,
      {
        profile: mapStudentProfile(studentRow, subjectIdsByStudent.get(studentRow.id) ?? []),
        account: mapUser(userMap.get(studentRow.user_id)),
      } satisfies StudentView,
    ]),
  );
}

function assignmentTargetsStudent(
  assignment: Assignment,
  student: StudentProfile,
) {
  if (!student.subjectIds.includes(assignment.subjectId)) return false;
  return assignment.assignToAll || assignment.targetStudentIds.includes(student.id);
}

async function loadTeacherContext(userId: string) {
  const teacherRow = await getTeacherByUserId(userId);
  if (!teacherRow) throw new Error("Teacher profile topilmadi");

  const teacherView = await getTeacherViewFromRow(teacherRow);
  const subjectRows = await getSubjectsByTeacherId(teacherRow.id);
  const subjects = subjectRows.map(mapSubject);
  const subjectIds = subjects.map((subject) => subject.id);

  const studentLinks = await getStudentSubjectLinksBySubjectIds(subjectIds);
  const studentIds = unique(studentLinks.map((link: any) => link.student_id));
  const { data: studentRows, error: studentError } = studentIds.length
    ? await supabase.from("students").select("*").in("id", studentIds)
    : { data: [], error: null };
  failIfError(studentError);
  const studentsMap = await buildStudentViews(studentRows ?? []);

  const assignmentRows = await getAssignmentsByTeacherId(teacherRow.id);
  const assignmentIds = assignmentRows.map((row) => row.id);
  const [assignmentStudentLinks, submissionRows] = await Promise.all([
    getAssignmentStudentLinksByAssignmentIds(assignmentIds),
    getSubmissionsByAssignmentIds(assignmentIds),
  ]);

  const targetIdsByAssignment = new Map<string, string[]>();
  assignmentStudentLinks.forEach((link: any) => {
    const current = targetIdsByAssignment.get(link.assignment_id) ?? [];
    current.push(link.student_id);
    targetIdsByAssignment.set(link.assignment_id, current);
  });

  const assignments = assignmentRows.map((row) =>
    mapAssignment(row, targetIdsByAssignment.get(row.id) ?? []),
  );

  return {
    teacherView,
    subjects,
    students: Array.from(studentsMap.values()),
    assignments,
    submissions: submissionRows.map(mapSubmission),
  };
}

async function loadStudentContext(userId: string) {
  const studentRow = await getStudentByUserId(userId);
  if (!studentRow) throw new Error("Student topilmadi");

  const studentViews = await buildStudentViews([studentRow]);
  const student = studentViews.get(studentRow.id);
  if (!student) throw new Error("Student view topilmadi");

  const [subjects, assignmentRows] = await Promise.all([
    getSubjectsByIds(student.profile.subjectIds),
    getAssignmentsBySubjectIds(student.profile.subjectIds),
  ]);

  const assignmentIds = assignmentRows.map((row) => row.id);
  const [assignmentStudentLinks, submissionsRows, teacherRows] = await Promise.all([
    getAssignmentStudentLinksByAssignmentIds(assignmentIds),
    getSubmissionsByStudentId(student.profile.id),
    supabase.from("teachers").select("*").in("id", unique(assignmentRows.map((row) => row.created_by))),
  ]);
  failIfError(teacherRows.error);

  const targetIdsByAssignment = new Map<string, string[]>();
  assignmentStudentLinks.forEach((link: any) => {
    const current = targetIdsByAssignment.get(link.assignment_id) ?? [];
    current.push(link.student_id);
    targetIdsByAssignment.set(link.assignment_id, current);
  });

  const teacherMap = await buildTeacherMap(teacherRows.data ?? []);
  const subjectMap = new Map(subjects.map((subject) => [subject.id, mapSubject(subject)]));
  const submissionsMap = new Map(submissionsRows.map((row: any) => [row.assignment_id, mapSubmission(row)]));

  const assignments = assignmentRows
    .map((row) => mapAssignment(row, targetIdsByAssignment.get(row.id) ?? []))
    .filter((assignment) => assignmentTargetsStudent(assignment, student.profile))
    .map((assignment) => ({
      ...assignment,
      subject: subjectMap.get(assignment.subjectId)!,
      teacher: teacherMap.get(assignment.createdBy)!,
      submission: submissionsMap.get(assignment.id),
    }) satisfies AssignmentView);

  return {
    student,
    subjects: subjects.map(mapSubject),
    assignments,
  };
}

async function createUser(input: {
  role: UserAccount["role"];
  name: string;
  email: string;
  login: string;
  password: string;
}) {
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("login", input.login)
    .maybeSingle();
  failIfError(existingError);
  if (existing) throw new Error("Bu login band");

  const { data, error } = await supabase
    .from("users")
    .insert({
      role: input.role,
      name: input.name,
      email: input.email || null,
      login: input.login,
      password_hash: input.password,
    })
    .select("*")
    .single();
  failIfError(error);
  return data;
}

export const appService = {
  async login(login: string, password: string): Promise<AuthSession> {
    ensureEnv();
    const user = await getUserByLoginPassword(login, password);
    if (!user) {
      throw new Error("Login yoki parol noto'g'ri");
    }
    return { user: mapUser(user) };
  },

  async getAdminStats() {
    ensureEnv();
    const [teachers, students, subjects, assignments] = await Promise.all([
      supabase.from("teachers").select("*", { count: "exact", head: true }),
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("subjects").select("*", { count: "exact", head: true }),
      supabase.from("assignments").select("*", { count: "exact", head: true }),
    ]);

    [teachers.error, students.error, subjects.error, assignments.error].forEach(failIfError);

    return {
      teachers: teachers.count ?? 0,
      students: students.count ?? 0,
      subjects: subjects.count ?? 0,
      assignments: assignments.count ?? 0,
    };
  },

  async getTeachers(): Promise<TeacherView[]> {
    const { data, error } = await supabase.from("teachers").select("*").order("created_at", { ascending: true });
    failIfError(error);
    const teacherMap = await buildTeacherMap(data ?? []);
    return Array.from(teacherMap.values());
  },

  async createTeacher(input: { name: string; email: string; login: string; password: string; department?: string }) {
    const user = await createUser({
      role: "teacher",
      name: input.name,
      email: input.email,
      login: input.login,
      password: input.password,
    });

    const { error } = await supabase.from("teachers").insert({
      user_id: user.id,
      department: input.department || null,
    });
    failIfError(error);
  },

  async updateTeacher(
    teacherId: string,
    input: { name: string; email: string; login: string; password: string; department?: string },
  ) {
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", teacherId)
      .single();
    failIfError(teacherError);

    const { data: duplicate, error: duplicateError } = await supabase
      .from("users")
      .select("id")
      .eq("login", input.login)
      .neq("id", teacher.user_id)
      .maybeSingle();
    failIfError(duplicateError);
    if (duplicate) throw new Error("Bu login boshqa foydalanuvchida bor");

    const [userUpdate, teacherUpdate] = await Promise.all([
      supabase
        .from("users")
        .update({
          name: input.name,
          email: input.email || null,
          login: input.login,
          password_hash: input.password,
        })
        .eq("id", teacher.user_id),
      supabase
        .from("teachers")
        .update({ department: input.department || null })
        .eq("id", teacherId),
    ]);

    failIfError(userUpdate.error);
    failIfError(teacherUpdate.error);
  },

  async deleteTeacher(teacherId: string) {
    const { count, error: subjectError } = await supabase
      .from("subjects")
      .select("*", { count: "exact", head: true })
      .eq("teacher_id", teacherId);
    failIfError(subjectError);
    if ((count ?? 0) > 0) {
      throw new Error("Teacherga fan biriktirilgan, avval fanlarni boshqa teacherga o'tkazing");
    }

    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", teacherId)
      .single();
    failIfError(teacherError);

    const [teacherDelete, userDelete] = await Promise.all([
      supabase.from("teachers").delete().eq("id", teacherId),
      supabase.from("users").delete().eq("id", teacher.user_id),
    ]);

    failIfError(teacherDelete.error);
    failIfError(userDelete.error);
  },

  async getSubjects() {
    const [subjectResult, teacherResult] = await Promise.all([
      supabase.from("subjects").select("*").order("created_at", { ascending: true }),
      supabase.from("teachers").select("*"),
    ]);
    failIfError(subjectResult.error);
    failIfError(teacherResult.error);
    const teacherMap = await buildTeacherMap(teacherResult.data ?? []);
    return (subjectResult.data ?? []).map((subjectRow: any) => ({
      ...mapSubject(subjectRow),
      teacher: teacherMap.get(subjectRow.teacher_id)!,
    }));
  },

  async createSubject(input: { name: string; teacherId: string; type: "programming" | "file" }) {
    const { error } = await supabase.from("subjects").insert({
      name: input.name,
      teacher_id: input.teacherId,
      type: input.type,
    });
    failIfError(error);
  },

  async updateSubject(subjectId: string, input: { name: string; teacherId: string; type: "programming" | "file" }) {
    const { error } = await supabase
      .from("subjects")
      .update({
        name: input.name,
        teacher_id: input.teacherId,
        type: input.type,
      })
      .eq("id", subjectId);
    failIfError(error);
  },

  async getTeacherDashboard(userId: string) {
    const context = await loadTeacherContext(userId);
    return {
      totalStudents: context.students.length,
      totalAssignments: context.assignments.length,
      submitted: context.submissions.length,
      notSubmitted:
        context.assignments.reduce((sum, assignment) => {
          const targetedStudents = context.students.filter((student) =>
            assignmentTargetsStudent(assignment, student.profile),
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
        const targetedStudents = context.students.filter((student) =>
          assignmentTargetsStudent(assignment, student.profile),
        );
        const submittedCount = context.submissions.filter(
          (submission) => submission.assignmentId === assignment.id,
        ).length;
        return {
          assignment,
          targetedCount: targetedStudents.length,
          submittedCount,
        };
      }),
      students: context.students,
    };
  },

  async getStudentsForTeacher(userId: string) {
    const context = await loadTeacherContext(userId);
    const subjectMap = new Map(context.subjects.map((subject) => [subject.id, subject]));
    return context.students.map((student) => ({
      ...student,
      subjects: student.profile.subjectIds.map((subjectId) => subjectMap.get(subjectId)!),
    }));
  },

  async createStudent(
    userId: string,
    input: { name: string; groupName: string; studentCode: string; subjectIds: string[] },
  ) {
    const context = await loadTeacherContext(userId);
    input.subjectIds.forEach((subjectId) => {
      if (!context.subjects.some((subject) => subject.id === subjectId)) {
        throw new Error("Teacherga tegishli bo'lmagan fan tanlandi");
      }
    });

    let login = `st.${slugify(input.name).split(".")[0] || "student"}`;
    let suffix = 1;
    while (true) {
      const { data, error } = await supabase.from("users").select("id").eq("login", login).maybeSingle();
      failIfError(error);
      if (!data) break;
      login = `st.${slugify(input.name).split(".")[0] || "student"}${suffix}`;
      suffix += 1;
    }

    const password = generatePassword();
    const user = await createUser({
      role: "student",
      name: input.name,
      email: `${login}@amaliy.local`,
      login,
      password,
    });

    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        user_id: user.id,
        group_name: input.groupName,
        student_code: input.studentCode,
      })
      .select("*")
      .single();
    failIfError(studentError);

    if (input.subjectIds.length > 0) {
      const { error: linkError } = await supabase.from("student_subjects").insert(
        input.subjectIds.map((subjectId) => ({
          student_id: student.id,
          subject_id: subjectId,
        })),
      );
      failIfError(linkError);
    }

    return {
      credentials: {
        name: input.name,
        groupName: input.groupName,
        studentCode: input.studentCode,
        login,
        password,
      } satisfies GeneratedStudentCredentials,
    };
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

  async getTeacherAssignments(userId: string): Promise<AssignmentView[]> {
    const context = await loadTeacherContext(userId);
    const subjectMap = new Map(context.subjects.map((subject) => [subject.id, subject]));
    return context.assignments.map((assignment) => ({
      ...assignment,
      subject: subjectMap.get(assignment.subjectId)!,
      teacher: context.teacherView,
    }));
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
    const context = await loadTeacherContext(userId);
    if (!context.subjects.some((subject) => subject.id === input.subjectId)) {
      throw new Error("Faqat o'zingizning faningizga topshiriq biriktira olasiz");
    }

    if (!input.assignToAll && input.targetStudentIds.length === 0) {
      throw new Error("Kamida bitta talaba tanlang");
    }

    const { data: assignment, error } = await supabase
      .from("assignments")
      .insert({
        title: input.title,
        description: input.description,
        subject_id: input.subjectId,
        type: input.type,
        deadline: input.deadline,
        language: input.type === "programming" ? input.language : null,
        created_by: context.teacherView.profile.id,
        assign_to_all: input.assignToAll,
        test_input: input.type === "programming" ? input.testInput || null : null,
        expected_output: input.type === "programming" ? input.expectedOutput || null : null,
      })
      .select("*")
      .single();
    failIfError(error);

    if (!input.assignToAll && input.targetStudentIds.length > 0) {
      const { error: linkError } = await supabase.from("assignment_students").insert(
        input.targetStudentIds.map((studentId) => ({
          assignment_id: assignment.id,
          student_id: studentId,
        })),
      );
      failIfError(linkError);
    }
  },

  async getTeacherSubmissions(userId: string) {
    const context = await loadTeacherContext(userId);
    const subjectMap = new Map(context.subjects.map((subject) => [subject.id, subject]));
    const assignmentMap = new Map(
      context.assignments.map((assignment) => [
        assignment.id,
        {
          ...assignment,
          subject: subjectMap.get(assignment.subjectId)!,
          teacher: context.teacherView,
        } satisfies AssignmentView,
      ]),
    );
    const studentMap = new Map(context.students.map((student) => [student.profile.id, student]));

    return context.submissions.map((submission) => ({
      submission,
      assignment: assignmentMap.get(submission.assignmentId)!,
      student: studentMap.get(submission.studentId)!,
      teacher: context.teacherView.profile,
    }));
  },

  async reviewSubmission(
    userId: string,
    submissionId: string,
    input: { status: "accepted" | "rejected"; comment?: string },
  ) {
    await loadTeacherContext(userId);
    const { error } = await supabase
      .from("submissions")
      .update({
        status: input.status,
        comment: input.comment || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);
    failIfError(error);
  },

  async getAssignmentCoverage(userId: string): Promise<AssignmentCoverage[]> {
    const context = await loadTeacherContext(userId);
    return context.assignments.flatMap((assignment) => {
      const targetedStudents = context.students.filter((student) =>
        assignmentTargetsStudent(assignment, student.profile),
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
    const context = await loadStudentContext(userId);
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
    const context = await loadStudentContext(userId);
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

    const { error } = await supabase.from("submissions").upsert(
      {
        student_id: context.student.profile.id,
        assignment_id: assignmentId,
        code,
        language,
        status: "pending",
        auto_check: autoCheck,
        submitted_output: submittedOutput || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,assignment_id",
      },
    );
    failIfError(error);

    return { autoCheck, submittedOutput };
  },

  async submitFile(userId: string, assignmentId: string, file: File) {
    const context = await loadStudentContext(userId);
    const assignment = context.assignments.find((item) => item.id === assignmentId);
    if (!assignment || assignment.type !== "file") {
      throw new Error("File assignment topilmadi");
    }

    const path = `${context.student.profile.id}/${assignmentId}/${Date.now()}-${file.name}`;
    const upload = await supabase.storage.from("submission-files").upload(path, file, {
      upsert: true,
    });
    failIfError(upload.error);

    const publicUrl = supabase.storage.from("submission-files").getPublicUrl(path).data.publicUrl;

    const { error } = await supabase.from("submissions").upsert(
      {
        student_id: context.student.profile.id,
        assignment_id: assignmentId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        status: "pending",
        auto_check: "not_required",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "student_id,assignment_id",
      },
    );
    failIfError(error);
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
