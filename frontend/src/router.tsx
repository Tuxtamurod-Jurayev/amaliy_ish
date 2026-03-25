import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "@/App";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminDashboardPage } from "@/admin/AdminDashboardPage";
import { AdminCoursesPage } from "@/admin/AdminCoursesPage";
import { TeachersPage } from "@/admin/TeachersPage";
import { SubjectsPage } from "@/admin/SubjectsPage";
import { StudentCourseViewPage } from "@/student/StudentCourseViewPage";
import { StudentCoursesPage } from "@/student/StudentCoursesPage";
import { TeacherDashboardPage } from "@/teacher/TeacherDashboardPage";
import { TeacherStudentsPage } from "@/teacher/TeacherStudentsPage";
import { TeacherAssignmentsPage } from "@/teacher/TeacherAssignmentsPage";
import { TeacherSubmissionsPage } from "@/teacher/TeacherSubmissionsPage";
import { StudentDashboardPage } from "@/student/StudentDashboardPage";
import { StudentAssignmentsPage } from "@/student/StudentAssignmentsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { index: true, element: <Navigate to="/login" replace /> },
          { path: "login", element: <LoginPage /> },
        ],
      },
      {
        path: "app",
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/app/admin" replace />,
          },
          {
            path: "admin",
            element: <ProtectedRoute allow={["admin"]} />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "teachers", element: <TeachersPage /> },
              { path: "subjects", element: <SubjectsPage /> },
              { path: "courses", element: <AdminCoursesPage /> },
            ],
          },
          {
            path: "teacher",
            element: <ProtectedRoute allow={["teacher"]} />,
            children: [
              { index: true, element: <TeacherDashboardPage /> },
              { path: "students", element: <TeacherStudentsPage /> },
              { path: "assignments", element: <TeacherAssignmentsPage /> },
              { path: "submissions", element: <TeacherSubmissionsPage /> },
            ],
          },
          {
            path: "student",
            element: <ProtectedRoute allow={["student"]} />,
            children: [
              { index: true, element: <StudentDashboardPage /> },
              { path: "assignments", element: <StudentAssignmentsPage /> },
              { path: "courses", element: <StudentCoursesPage /> },
              { path: "courses/:courseId", element: <StudentCourseViewPage /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
