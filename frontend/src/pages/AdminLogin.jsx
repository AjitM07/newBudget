import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAdmin } from '../services/authService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Lock, Mail } from 'lucide-react'

export default function AdminLogin() {
  const [form, setForm]   = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!form.email || !form.password) return toast.error('Fill all fields')
    setLoading(true)
    try {
      const res = await loginAdmin(form)
      setAuth(res.data.user, res.data.token)
      toast.success(`Welcome back, ${res.data.user.name}!`)
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: 'var(--accent)',
            display: 'grid', placeItems: 'center', margin: '0 auto 16px',
          }}>
            <Lock size={22} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Admin Login</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Authorized government personnel only</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="Official email (.gov.in)"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
            <input className="input" style={{ paddingLeft: 36 }} type="password" placeholder="Password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 24 }}>
          New official?{' '}
          <Link to="/admin/register" style={{ color: 'var(--accent-lt)', fontWeight: 600 }}>Request Access</Link>
        </p>
      </div>
    </div>
  )
}