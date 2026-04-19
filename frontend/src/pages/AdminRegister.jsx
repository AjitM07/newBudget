import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerAdmin } from '../services/authService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, User, BadgeCheck, MapPin } from 'lucide-react'

const REGION_TYPES = ['Central Ministry', 'State Government', 'District Administration', 'Municipal Corporation', 'Panchayat']

export default function AdminRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '', govId: '', regionName: '', regionType: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { setAuth }             = useAuthStore()
  const navigate                = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    const { name, email, password, govId, regionName, regionType } = form
    if (!name || !email || !password || !govId || !regionName || !regionType)
      return toast.error('All fields are required')
    if (password.length < 8)
      return toast.error('Password must be at least 8 characters')
    if (!email.includes('@'))
      return toast.error('Enter a valid email address')

    setLoading(true)
    try {
      const res = await registerAdmin(form)
      setAuth(res.data.user, res.data.token)
      toast.success('Account created! Welcome.')
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={S.page}>
      <div style={S.glow} />
      <div style={S.card}>

        <div style={S.icon}><BadgeCheck size={24} color="#fff" /></div>
        <h1 style={S.title}>Admin Registration</h1>
        <p style={S.sub}>Create your government official account</p>

        {/* Row 1: Name + Govt ID */}
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Full Name</label>
            <div style={S.row}>
              <User size={14} style={S.ico} />
              <input style={S.input} placeholder="Your full name" value={form.name} onChange={set('name')} />
            </div>
          </div>
          <div>
            <label style={S.label}>Govt Employee ID</label>
            <div style={S.row}>
              <BadgeCheck size={14} style={S.ico} />
              <input style={S.input} placeholder="e.g. EMP12345" value={form.govId} onChange={set('govId')} />
            </div>
          </div>
        </div>

        {/* Email */}
        <label style={S.label}>Email Address</label>
        <div style={S.row}>
          <Mail size={14} style={S.ico} />
          <input style={S.input} type="email" placeholder="you@gmail.com" value={form.email} onChange={set('email')} />
        </div>

        {/* Password */}
        <label style={S.label}>Password</label>
        <div style={S.row}>
          <Lock size={14} style={S.ico} />
          <input
            style={{ ...S.input, paddingRight: 38 }}
            type={showPass ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={set('password')}
          />
          <button style={S.eye} onClick={() => setShowPass((v) => !v)} tabIndex={-1}>
            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>

        {/* Row 2: Region Name + Region Type */}
        <div style={S.grid2}>
          <div>
            <label style={S.label}>Region / District</label>
            <div style={S.row}>
              <MapPin size={14} style={S.ico} />
              <input style={S.input} placeholder="e.g. Pune District" value={form.regionName} onChange={set('regionName')} />
            </div>
          </div>
          <div>
            <label style={S.label}>Region Type</label>
            <div style={S.row}>
              <MapPin size={14} style={S.ico} />
              <select style={{ ...S.input, cursor: 'pointer' }} value={form.regionType} onChange={set('regionType')}>
                <option value="">Select type…</option>
                {REGION_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>

        <p style={S.foot}>Already have an account? <Link to="/admin/login" style={S.link}>Login</Link></p>
      </div>
    </div>
  )
}

const S = {
  page:  { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  glow:  { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.1) 0%, transparent 65%)', pointerEvents: 'none' },
  card:  { position: 'relative', width: '100%', maxWidth: 560, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '40px 36px' },
  icon:  { width: 50, height: 50, borderRadius: 14, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 },
  sub:   { fontSize: 13, color: 'var(--text3)', marginBottom: 24 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6, marginTop: 14 },
  row:   { position: 'relative' },
  ico:   { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' },
  input: { width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 14px 11px 34px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', boxSizing: 'border-box', appearance: 'none' },
  eye:   { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' },
  btn:   { width: '100%', marginTop: 24, marginBottom: 20, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  foot:  { textAlign: 'center', fontSize: 13, color: 'var(--text3)' },
  link:  { color: 'var(--accent-lt)', fontWeight: 600, textDecoration: 'none' },
}
