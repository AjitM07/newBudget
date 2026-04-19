import { Routes, Route, Navigate } from 'react-router-dom'

import LandingPage    from './pages/LandingPage'
import AdminLogin     from './pages/AdminLogin'
import AdminRegister  from './pages/AdminRegister'
import AdminDashboard from './pages/AdminDashboard'
import AllocationPage from './pages/AllocationPage'
import ReportPage     from './pages/ReportPage'
import CitizenLogin   from './pages/CitizenLogin'
import CitizenView    from './pages/CitizenView'
import ProtectedRoute from './components/shared/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"               element={<LandingPage />} />
      <Route path="/admin/login"    element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/citizen/login"  element={<CitizenLogin />} />

      {/* Admin only */}
      <Route path="/admin/dashboard"  element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/allocation" element={<ProtectedRoute role="admin"><AllocationPage /></ProtectedRoute>} />
      <Route path="/admin/reports"    element={<ProtectedRoute role="admin"><ReportPage /></ProtectedRoute>} />

      {/* Citizen only */}
      <Route path="/citizen/view" element={<ProtectedRoute role="citizen"><CitizenView /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
