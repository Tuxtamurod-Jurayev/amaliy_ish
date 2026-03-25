import type {
  AdminCourseView,
  AutoCheckStatus,
  Course,
  CourseLesson,
  CourseProgress,
  LessonAssignmentType,
  LessonProgress,
  LessonSubmission,
  LocalDatabase,
  ProgrammingLanguage,
  StudentCourseCard,
  StudentCourseView,
  SubmissionStatus,
} from "@/types/domain";
import { generateId } from "@/utils/format";

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
  if (typeof window === "undefined") return createSeedDb();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createSeedDb();
  try {
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      ...createSeedDb(),
      ...parsed,
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
    return createSeedDb();
  }
}

function writeDb(db: LocalDatabase) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

async function transact<T>(callback: (db: LocalDatabase) => Promise<T> | T) {
  const db = readDb();
  const result = await callback(db);
  writeDb(db);
  return result;
}

function getLessons(db: LocalDatabase, courseId: string) {
  return db.courseLessons
    .filter((lesson) => lesson.courseId === courseId)
    .sort((left, right) => left.order - right.order);
}

function ensureStudent(db: LocalDatabase, userId: string) {
  const student = db.students.find((item) => item.userId === userId);
  if (!student) throw new Error("Talaba topilmadi");
  return student;
}

function normalizeCode(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function getOrCreateProgress(db: LocalDatabase, studentId: string, courseId: string) {
  let progress = db.courseProgress.find((item) => item.studentId === studentId && item.courseId === courseId);
  if (!progress) {
    progress = {
      id: generateId("course_progress"),
      courseId,
      studentId,
      lessonProgress: [],
      updatedAt: new Date().toISOString(),
    };
    db.courseProgress.push(progress);
  }
  return progress;
}

function getOrCreateLessonProgress(progress: CourseProgress, lessonId: string) {
  let lessonProgress = progress.lessonProgress.find((item) => item.lessonId === lessonId);
  if (!lessonProgress) {
    lessonProgress = {
      lessonId,
      watchedSeconds: 0,
      completedVideo: false,
      completedAssignment: false,
      updatedAt: new Date().toISOString(),
    };
    progress.lessonProgress.push(lessonProgress);
  }
  return lessonProgress;
}

function completeSubmissionStatus(autoCheck: AutoCheckStatus): SubmissionStatus {
  return autoCheck === "failed" ? "rejected" : "accepted";
}

function mapAdminCourseView(db: LocalDatabase, course: Course): AdminCourseView {
  return {
    ...course,
    lessons: getLessons(db, course.id),
  };
}

function mapStudentCourseCard(db: LocalDatabase, userId: string, course: Course): StudentCourseCard {
  const student = ensureStudent(db, userId);
  const progress = db.courseProgress.find((item) => item.studentId === student.id && item.courseId === course.id);
  const lessons = getLessons(db, course.id);
  const completedLessons = progress?.lessonProgress.filter((item) => item.completedVideo).length ?? 0;
  const completedAssignments = progress?.lessonProgress.filter((item) => item.completedAssignment).length ?? 0;
  const nextLesson = lessons.find((lesson) => {
    const lessonProgress = progress?.lessonProgress.find((item) => item.lessonId === lesson.id);
    return !lessonProgress?.completedAssignment;
  });

  return {
    ...course,
    lessons,
    completedLessons,
    totalLessons: lessons.length,
    completedAssignments,
    nextLesson,
  };
}

function mapStudentCourseView(db: LocalDatabase, userId: string, courseId: string): StudentCourseView {
  const student = ensureStudent(db, userId);
  const course = db.courses.find((item) => item.id === courseId);
  if (!course) throw new Error("Kurs topilmadi");

  const progress = db.courseProgress.find((item) => item.studentId === student.id && item.courseId === courseId);
  const lessons = getLessons(db, courseId);
  const submissions = db.lessonSubmissions.filter(
    (item) => item.studentId === student.id && item.courseId === courseId,
  );

  return {
    ...course,
    totalLessons: lessons.length,
    completedLessons: progress?.lessonProgress.filter((item) => item.completedVideo).length ?? 0,
    completedAssignments: progress?.lessonProgress.filter((item) => item.completedAssignment).length ?? 0,
    lessons: lessons.map((lesson, index) => {
      const lessonProgress = progress?.lessonProgress.find((item) => item.lessonId === lesson.id);
      const previousLesson = index === 0 ? undefined : lessons[index - 1];
      const previousProgress = previousLesson
        ? progress?.lessonProgress.find((item) => item.lessonId === previousLesson.id)
        : undefined;

      return {
        lesson,
        progress: lessonProgress,
        submission: submissions.find((item) => item.lessonId === lesson.id),
        unlocked: index === 0 || Boolean(previousProgress?.completedAssignment),
      };
    }),
  };
}

function upsertLessonSubmission(
  db: LocalDatabase,
  input: Omit<LessonSubmission, "id" | "createdAt" | "updatedAt">,
) {
  const existingIndex = db.lessonSubmissions.findIndex(
    (item) =>
      item.studentId === input.studentId &&
      item.courseId === input.courseId &&
      item.lessonId === input.lessonId,
  );
  const now = new Date().toISOString();
  const previous = existingIndex >= 0 ? db.lessonSubmissions[existingIndex] : undefined;
  const next: LessonSubmission = {
    ...input,
    id: previous?.id ?? generateId("lesson_submission"),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    db.lessonSubmissions[existingIndex] = next;
  } else {
    db.lessonSubmissions.push(next);
  }

  return next;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Fayl o'qilmadi"));
    reader.readAsDataURL(file);
  });
}

export const courseLocalService = {
  async getAdminCourses() {
    const db = readDb();
    return db.courses.map((course) => mapAdminCourseView(db, course));
  },

  async createCourse(input: {
    title: string;
    description: string;
    category: Course["category"];
    coverImage?: string;
    lessons: Array<{
      title: string;
      summary: string;
      videoUrl: string;
      durationMinutes: number;
      assignmentType: LessonAssignmentType;
      assignmentPrompt: string;
      brokenCode?: string;
      solutionCode?: string;
      language?: ProgrammingLanguage;
    }>;
  }) {
    await transact((db) => {
      const courseId = generateId("course");
      const totalDurationMinutes = input.lessons.reduce(
        (sum, lesson) => sum + Number(lesson.durationMinutes || 0),
        0,
      );

      db.courses.push({
        id: courseId,
        title: input.title,
        description: input.description,
        category: input.category,
        coverImage: input.coverImage || undefined,
        totalDurationMinutes,
        createdBy: "admin",
      });

      input.lessons.forEach((lesson, index) => {
        db.courseLessons.push({
          id: generateId("lesson"),
          courseId,
          order: index + 1,
          title: lesson.title,
          summary: lesson.summary,
          videoUrl: lesson.videoUrl,
          durationMinutes: Number(lesson.durationMinutes || 0),
          assignmentType: lesson.assignmentType,
          assignmentPrompt: lesson.assignmentPrompt,
          brokenCode: lesson.assignmentType === "code_puzzle" ? lesson.brokenCode || "" : undefined,
          solutionCode: lesson.assignmentType === "code_puzzle" ? lesson.solutionCode || "" : undefined,
          language: lesson.assignmentType === "code_puzzle" ? lesson.language ?? "javascript" : undefined,
        });
      });
    });
  },

  async updateCourse(
    courseId: string,
    input: {
      title: string;
      description: string;
      category: Course["category"];
      coverImage?: string;
      lessons: Array<{
        title: string;
        summary: string;
        videoUrl: string;
        durationMinutes: number;
        assignmentType: LessonAssignmentType;
        assignmentPrompt: string;
        brokenCode?: string;
        solutionCode?: string;
        language?: ProgrammingLanguage;
      }>;
    },
  ) {
    await transact((db) => {
      const course = db.courses.find((item) => item.id === courseId);
      if (!course) throw new Error("Kurs topilmadi");

      course.title = input.title;
      course.description = input.description;
      course.category = input.category;
      course.coverImage = input.coverImage || undefined;
      course.totalDurationMinutes = input.lessons.reduce(
        (sum, lesson) => sum + Number(lesson.durationMinutes || 0),
        0,
      );

      db.courseLessons = db.courseLessons.filter((lesson) => lesson.courseId !== courseId);
      input.lessons.forEach((lesson, index) => {
        db.courseLessons.push({
          id: generateId("lesson"),
          courseId,
          order: index + 1,
          title: lesson.title,
          summary: lesson.summary,
          videoUrl: lesson.videoUrl,
          durationMinutes: Number(lesson.durationMinutes || 0),
          assignmentType: lesson.assignmentType,
          assignmentPrompt: lesson.assignmentPrompt,
          brokenCode: lesson.assignmentType === "code_puzzle" ? lesson.brokenCode || "" : undefined,
          solutionCode: lesson.assignmentType === "code_puzzle" ? lesson.solutionCode || "" : undefined,
          language: lesson.assignmentType === "code_puzzle" ? lesson.language ?? "javascript" : undefined,
        });
      });
    });
  },

  async getStudentCourses(userId: string) {
    const db = readDb();
    ensureStudent(db, userId);
    return db.courses.map((course) => mapStudentCourseCard(db, userId, course));
  },

  async getStudentCourse(userId: string, courseId: string) {
    const db = readDb();
    return mapStudentCourseView(db, userId, courseId);
  },

  async updateLessonWatch(userId: string, courseId: string, lessonId: string, watchedSeconds: number, completedVideo: boolean) {
    await transact((db) => {
      const student = ensureStudent(db, userId);
      const progress = getOrCreateProgress(db, student.id, courseId);
      const lessonProgress = getOrCreateLessonProgress(progress, lessonId);
      lessonProgress.watchedSeconds = Math.max(lessonProgress.watchedSeconds, watchedSeconds);
      lessonProgress.completedVideo = lessonProgress.completedVideo || completedVideo;
      lessonProgress.updatedAt = new Date().toISOString();
      progress.updatedAt = new Date().toISOString();
    });
  },

  async submitLessonMedia(userId: string, courseId: string, lessonId: string, file: File) {
    return transact(async (db) => {
      const student = ensureStudent(db, userId);
      const lesson = db.courseLessons.find((item) => item.id === lessonId && item.courseId === courseId);
      if (!lesson) throw new Error("Dars topilmadi");

      const content = await fileToDataUrl(file);
      upsertLessonSubmission(db, {
        studentId: student.id,
        courseId,
        lessonId,
        type: lesson.assignmentType,
        status: "pending",
        autoCheck: "manual_review",
        file: {
          name: file.name,
          type: file.type,
          content,
          size: file.size,
        },
      });

      const progress = getOrCreateProgress(db, student.id, courseId);
      const lessonProgress = getOrCreateLessonProgress(progress, lessonId);
      lessonProgress.completedAssignment = true;
      lessonProgress.updatedAt = new Date().toISOString();
      progress.updatedAt = new Date().toISOString();
    });
  },

  async submitLessonPuzzle(userId: string, courseId: string, lessonId: string, code: string) {
    return transact((db) => {
      const student = ensureStudent(db, userId);
      const lesson = db.courseLessons.find((item) => item.id === lessonId && item.courseId === courseId);
      if (!lesson || lesson.assignmentType !== "code_puzzle") {
        throw new Error("Kod puzzle topilmadi");
      }

      const autoCheck: AutoCheckStatus =
        normalizeCode(code) === normalizeCode(lesson.solutionCode ?? "") ? "passed" : "failed";
      upsertLessonSubmission(db, {
        studentId: student.id,
        courseId,
        lessonId,
        type: "code_puzzle",
        status: completeSubmissionStatus(autoCheck),
        autoCheck,
        code,
      });

      const progress = getOrCreateProgress(db, student.id, courseId);
      const lessonProgress = getOrCreateLessonProgress(progress, lessonId);
      lessonProgress.completedAssignment = autoCheck === "passed";
      lessonProgress.updatedAt = new Date().toISOString();
      progress.updatedAt = new Date().toISOString();

      return { autoCheck };
    });
  },
};
