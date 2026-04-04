import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import BrowseProjects from './pages/BrowseProjects'
import FindFreelancers from './pages/FindFreelancers'
import PostProject from './pages/PostProject'
import MyProjects from './pages/MyProjects'
import ProjectDetail from './pages/ProjectDetail'
import UserProfile from './pages/UserProfile'
import Support from './pages/Support'
import Chat from './pages/Chat'
import ProjectWorkspace from './pages/ProjectWorkspace'
import PaymentPage from './pages/PaymentPage'
import PaymentHistory from './pages/PaymentHistory'
import AdminDashboard from './components/ui/adminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ClientRoute from './components/ClientRoute'
import FreelancerRoute from './components/FreelancerRoute'
import GuestRoute from './components/GuestRoute'
import Navbar from './components/ui/navbar'
import SearchCommand from './components/ui/SearchCommand'
import Toast from './components/Toast'
import { setupAxiosInterceptor } from './services/axiosInstance'
import './App.css'

function App() {
  const location = useLocation();
  const isChatPage = location.pathname === '/messages';
  const isAdminPage = location.pathname === '/admin';

  // Setup axios interceptor on app mount
  useEffect(() => {
    setupAxiosInterceptor();
  }, []);

  return (
    <>
      <div className="app-shell">

        {!isAdminPage && <Navbar />}
        {!isChatPage && !isAdminPage && <SearchCommand />}
        <Toast />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <Signup />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <GuestRoute>
                <VerifyOTP />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <FreelancerRoute>
                <BrowseProjects />
              </FreelancerRoute>
            }
          />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route
            path="/freelancers"
            element={
              <ClientRoute>
                <FindFreelancers />
              </ClientRoute>
            }
          />
          <Route
            path="/post-project"
            element={
              <ClientRoute>
                <PostProject />
              </ClientRoute>
            }
          />
          <Route
            path="/post-project/:id"
            element={
              <ClientRoute>
                <PostProject />
              </ClientRoute>
            }
          />
          <Route
            path="/my-projects"
            element={
              <ProtectedRoute>
                <MyProjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/project-workspace/:id"
            element={
              <ProtectedRoute>
                <ProjectWorkspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:projectId"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-history"
            element={
              <ProtectedRoute>
                <PaymentHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  )
}

export default App
