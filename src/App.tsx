import { AdminRoute, GuestRoute, ProtectedRoute } from '@/components/ProtectedRoute'
import { ToastViewport } from '@/components/ui/Toast'
import { AcademyProvider } from '@/context/AcademyContext'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { StudentLayout } from '@/layouts/StudentLayout'
import {
  AdminCertificatesPage,
  AdminCoursesPage,
  AdminDashboardPage,
  AdminLessonsPage,
  AdminModulesPage,
  AdminQuizzesPage,
  AdminReportsPage,
  AdminStudentsPage,
} from '@/pages/admin/AdminPages'
import { ForgotPasswordPage, ResetPasswordPage } from '@/pages/auth/PasswordPages'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { CategoriesPage } from '@/pages/public/CategoriesPage'
import { CategoryDetailPage } from '@/pages/public/CategoryDetailPage'
import { CourseDetailsPage } from '@/pages/public/CourseDetailsPage'
import { CoursesPage } from '@/pages/public/CoursesPage'
import { FaqPage } from '@/pages/public/FaqPage'
import { HomePage } from '@/pages/public/HomePage'
import { LearningPathPage } from '@/pages/public/LearningPathPage'
import { PrivacyPage, TermsPage } from '@/pages/public/LegalPages'
import { CertificatePage, CertificatesPage } from '@/pages/student/CertificatePages'
import { DashboardPage } from '@/pages/student/DashboardPage'
import { LessonViewerPage } from '@/pages/student/LessonViewerPage'
import { MyCoursesPage } from '@/pages/student/MyCoursesPage'
import { ProfilePage } from '@/pages/student/ProfilePage'
import { QuizPage } from '@/pages/student/QuizPage'
import { EnginePage } from '@/pages/engine/EnginePage'
import { authService } from '@/services/auth'
import { catalogService } from '@/services/catalog'
import { progressService } from '@/services/progress'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

catalogService.listCourses()
catalogService.listQuizzes()
authService.listUsers()
progressService.allEnrollments()
progressService.allCertificates()
progressService.allAttempts()

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={basename || undefined}>
      <AuthProvider>
        <AcademyProvider>
          <ToastProvider>
            <ToastViewport />
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:slug" element={<CourseDetailsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/categories/:slug" element={<CategoryDetailPage />} />
                <Route path="/learning-path" element={<LearningPathPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
              </Route>

              <Route
                element={
                  <GuestRoute>
                    <AuthLayout />
                  </GuestRoute>
                }
              >
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute>
                    <StudentLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/my-courses" element={<MyCoursesPage />} />
                <Route path="/certificates" element={<CertificatesPage />} />
                <Route path="/certificates/:id" element={<CertificatePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/quiz/:courseSlug/:quizId" element={<QuizPage />} />
              </Route>

              <Route path="/engine" element={<EnginePage />} />

              <Route
                path="/learn/:courseSlug/:lessonSlug"
                element={
                  <ProtectedRoute>
                    <LessonViewerPage />
                  </ProtectedRoute>
                }
              />

              <Route
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/courses" element={<AdminCoursesPage />} />
                <Route path="/admin/modules" element={<AdminModulesPage />} />
                <Route path="/admin/lessons" element={<AdminLessonsPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />
                <Route path="/admin/certificates" element={<AdminCertificatesPage />} />
                <Route path="/admin/reports" element={<AdminReportsPage />} />
              </Route>

              <Route element={<PublicLayout />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AcademyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
