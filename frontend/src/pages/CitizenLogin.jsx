import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginCitizen, registerCitizen } from '../services/authService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, User, Users } from 'lucide-react'

export default function CitizenLogin() {
  const [tab, setTab]           = useState('login')
  const [form, setForm]         = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { setAuth }             = useAuthStore()
  const navigate                = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const switchTab = (t) => { setTab(t); setForm({ name: '', email: '', password: '' }) }

  const handleSubmit = async () => {
    if (!form.email || !form.password) return toast.error('Email and password are required')
    if (tab === 'register' && !form.name) return toast.error('Name is required')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    try {
      const fn  = tab === 'login' ? loginCitizen : registerCitizen
      const res = await fn(form)
      setAuth(res.data.user, res.data.token)
      toast.success(tab === 'login' ? `Welcome back, ${res.data.user.name}!` : 'Account created!')
      navigate('/citizen/view')
    } catch (err) {
      toast.error(err.response?.data?.message || (tab === 'login' ? 'Login failed' : 'Registration failed'))
    } finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      <div style={S.glow} />
      <div style={S.card}>

        <div style={{ ...S.icon, background: 'var(--green)' }}><Users size={24} color="#fff" /></div>
        <h1 style={S.title}>Citizen Portal</h1>
        <p style={S.sub}>View public budget allocations for your region</p>

        {/* Tab switcher */}
        <div style={S.tabs}>
          {['login', 'register'].map((t) => (
            <button key={t} style={{ ...S.tab, background: tab === t ? 'var(--accent)' : 'transparent', color: tab === t ? '#fff' : 'var(--text2)' }} onClick={() => switchTab(t)}>
              {t === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        {/* Name — register only */}
        {tab === 'register' && (
          <>
            <label style={S.label}>Full Name</label>
            <div style={S.row}>
              <User size={14} style={S.ico} />
              <input style={S.input} placeholder="Your full name" value={form.name} onChange={set('name')} />
            </div>
          </>
        )}

        {/* Email */}
        <label style={S.label}>Email</label>
        <div style={S.row}>
          <Mail size={14} style={S.ico} />
          <input style={S.input} type="email" placeholder="you@gmail.com" value={form.email} onChange={set('email')} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        </div>

        {/* Password */}
        <label style={S.label}>Password</label>
        <div style={S.row}>
          <Lock size={14} style={S.ico} />
          <input style={{ ...S.input, paddingRight: 38 }} type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          <button style={S.eye} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        <button style={{ ...S.btn, background: 'var(--green)', opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? (tab === 'login' ? 'Logging in…' : 'Creating…') : (tab === 'login' ? 'Login →' : 'Create Account →')}
        </button>

        <p style={S.foot}>Are you an admin? <Link to="/admin/login" style={S.link}>Admin Login</Link></p>
      </div>
    </div>
  )
}

const S = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  glow:  { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(5,150,105,0.1) 0%, transparent 65%)', pointerEvents: 'none' },
  card:  { position: 'relative', width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px' },
  icon:  { width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontFamily: 'var(--font-head)', fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  sub:   { fontSize: 13, color: 'var(--text3)', marginBottom: 20 },
  tabs:  { display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 },
  tab:   { flex: 1, padding: '8px', borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-head)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, marginTop: 14 },
  row:   { position: 'relative' },
  ico:   { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' },
  input: { width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px 11px 34px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  eye:   { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' },
  btn:   { width: '100%', marginTop: 24, marginBottom: 20, color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  foot:  { textAlign: 'center', fontSize: 13, color: 'var(--text3)' },
  link:  { color: 'var(--accent-lt)', fontWeight: 600, textDecoration: 'none' },
}
