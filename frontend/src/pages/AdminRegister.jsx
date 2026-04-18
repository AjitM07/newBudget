import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerAdmin, verifyOTP } from '../services/authService'
import toast from 'react-hot-toast'

const REGION_TYPES = ['State', 'District', 'Municipal Corporation', 'Panchayat', 'Central Ministry']

export default function AdminRegister() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', govId: '', regionType: '', regionName: '' })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) })

  const handleRegister = async () => {
    if (!form.email.endsWith('.gov.in') && !form.email.endsWith('.nic.in'))
      return toast.error('Only .gov.in or .nic.in email allowed')
    if (!form.govId) return toast.error('Government ID is required')
    setLoading(true)
    try {
      await registerAdmin(form)
      toast.success('OTP sent to your official email')
      setStep(2)
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  const handleVerify = async () => {
    if (otp.length !== 6) return toast.error('Enter valid 6-digit OTP')
    setLoading(true)
    try {
      await verifyOTP({ email: form.email, otp })
      toast.success('Verified! Awaiting superadmin approval.')
      navigate('/admin/login')
    } catch { toast.error('Invalid or expired OTP') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 460, padding: 40 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: step >= s ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 ? (
          <>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Request Admin Access</h1>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Use your official government email</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input className="input" placeholder="Full Name" {...f('name')} />
              <input className="input" placeholder="Official Email (.gov.in / .nic.in)" type="email" {...f('email')} />
              <input className="input" placeholder="Password" type="password" {...f('password')} />
              <input className="input" placeholder="Government Employee ID" {...f('govId')} />
              <select className="input" {...f('regionType')} style={{ cursor: 'pointer' }}>
                <option value="">Select Region Type</option>
                {REGION_TYPES.map(r => <option key={r}>{r}</option>)}
              </select>
              <input className="input" placeholder="Region Name (e.g. Maharashtra / Pune District)" {...f('regionName')} />
              <button className="btn-primary" onClick={handleRegister} disabled={loading} style={{ marginTop: 4 }}>
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Verify Email</h1>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
              6-digit OTP sent to <strong style={{ color: 'var(--accent-lt)' }}>{form.email}</strong>
            </p>
            <input className="input" placeholder="Enter 6-digit OTP" value={otp}
              onChange={e => setOtp(e.target.value)} maxLength={6}
              style={{ fontSize: 24, letterSpacing: 16, textAlign: 'center', marginBottom: 14 }}
              onKeyDown={e => e.key === 'Enter' && handleVerify()} />
            <button className="btn-primary" onClick={handleVerify} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Verifying...' : 'Verify & Submit for Approval'}
            </button>
            <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              After OTP verification, a superadmin will review your Gov ID before granting access.
            </p>
          </>
        )}

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)', marginTop: 24 }}>
          Already registered? <Link to="/admin/login" style={{ color: 'var(--accent-lt)', fontWeight: 600 }}>Login</Link>
        </p>
      </div>
    </div>
  )
}