import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'

export default function ProtectedRoute({ children, role }) {
  const { user, token } = useAuthStore()
  if (!token || !user) return <Navigate to={role === 'citizen' ? '/citizen/login' : '/admin/login'} replace />
  if (role && user.role !== role && !(role === 'admin' && user.role === 'superadmin'))
    return <Navigate to="/" replace />
  return children
}