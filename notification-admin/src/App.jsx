import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';

// Navigation Layout & Route Guard
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// View Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import PostsPage from './pages/PostsPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import PostDetailPage from './pages/PostDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import SubscribersPage from './pages/SubscribersPage';
import FailedJobsPage from './pages/FailedJobsPage';
import AuthorsPage from './pages/AuthorsPage';
import FeedPage from './pages/FeedPage';
import InboxPage from './pages/InboxPage';
import DeviceTokensPage from './pages/DeviceTokensPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ─── Guest/Public Auth Routes ─── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ─── Secure Console Routing ─── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Universal Dashboard (Reader, Author, Admin) */}
            <Route index element={<DashboardPage />} />

            {/* ── Admin Only ── */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute allowedRoles={['admin', 'author']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="failed-jobs"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <FailedJobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="device-tokens"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DeviceTokensPage />
                </ProtectedRoute>
              }
            />

            {/* ── Author Only ── */}
            <Route
              path="subscribers"
              element={
                <ProtectedRoute allowedRoles={['author']}>
                  <SubscribersPage />
                </ProtectedRoute>
              }
            />

            {/* ── Author & Admin Shared ── */}
            <Route
              path="posts"
              element={
                <ProtectedRoute allowedRoles={['author', 'admin']}>
                  <PostsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="posts/create"
              element={
                <ProtectedRoute allowedRoles={['author']}>
                  <CreatePostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="posts/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['author']}>
                  <EditPostPage />
                </ProtectedRoute>
              }
            />
            {/* Admin post detail with restriction controls */}
            <Route
              path="posts/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PostDetailPage />
                </ProtectedRoute>
              }
            />

            {/* ── Reader Only ── */}
            <Route
              path="authors"
              element={
                <ProtectedRoute allowedRoles={['reader']}>
                  <AuthorsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="feed"
              element={
                <ProtectedRoute allowedRoles={['reader']}>
                  <FeedPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="feed/:id"
              element={
                <ProtectedRoute allowedRoles={['reader']}>
                  <PostDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="inbox"
              element={
                <ProtectedRoute allowedRoles={['admin', 'author', 'reader']}>
                  <InboxPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['admin', 'author', 'reader']}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ─── Wildcard Catch-all ─── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Global Toast Controller */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass-toast',
          style: {
            background: 'rgba(255, 255, 255, 0.98)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 20px',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-danger)',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;
