import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginAdmin } from '../services/authService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { setAuth }             = useAuthStore()
  const navigate                = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    if (!form.email || !form.password) return toast.error('Fill in all fields')
    setLoading(true)
    try {
      const res = await loginAdmin(form)
      setAuth(res.data.user, res.data.token)
      toast.success(`Welcome, ${res.data.user.name}!`)
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      <div style={S.glow} />
      <div style={S.card}>

        <div style={S.icon}><ShieldCheck size={24} color="#fff" /></div>
        <h1 style={S.title}>Admin Login</h1>
        <p style={S.sub}>Government official access</p>

        {/* Email */}
        <label style={S.label}>Email</label>
        <div style={S.row}>
          <Mail size={15} style={S.ico} />
          <input
            style={S.input}
            type="email"
            placeholder="you@gmail.com"
            value={form.email}
            onChange={set('email')}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {/* Password */}
        <label style={S.label}>Password</label>
        <div style={S.row}>
          <Lock size={15} style={S.ico} />
          <input
            style={{ ...S.input, paddingRight: 38 }}
            type={showPass ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set('password')}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button style={S.eye} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Logging in…' : 'Login →'}
        </button>

        <p style={S.foot}>No account? <Link to="/admin/register" style={S.link}>Register</Link></p>
        <p style={{ ...S.foot, marginTop: 8 }}>Citizen? <Link to="/citizen/login" style={S.link}>Citizen portal</Link></p>
      </div>
    </div>
  )
}

const S = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  glow:  { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 65%)', pointerEvents: 'none' },
  card:  { position: 'relative', width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px' },
  icon:  { width: 50, height: 50, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  sub:   { fontSize: 13, color: 'var(--text3)', marginBottom: 28 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, marginTop: 14 },
  row:   { position: 'relative', marginBottom: 4 },
  ico:   { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' },
  input: { width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px 11px 36px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  eye:   { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' },
  btn:   { width: '100%', marginTop: 24, marginBottom: 20, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  foot:  { textAlign: 'center', fontSize: 13, color: 'var(--text3)', margin: 0 },
  link:  { color: 'var(--accent-lt)', fontWeight: 600, textDecoration: 'none' },
}
