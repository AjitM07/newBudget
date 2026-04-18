import { useNavigate } from 'react-router-dom'
import { BarChart2, Shield, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      {/* Glow orb */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 680 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'var(--accent-gl)', border: '1px solid rgba(59,130,246,0.3)',
          color: 'var(--accent-lt)', fontSize: 12, fontWeight: 600, marginBottom: 28,
        }}>
          <Zap size={12} /> AI-Powered Budget Optimization
        </div>

        <h1 style={{
          fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'clamp(40px, 6vw, 64px)',
          lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px',
        }}>
          Budget<span style={{ color: 'var(--accent-lt)' }}>OS</span>
          <br />
          <span style={{ color: 'var(--text2)', fontSize: '0.6em', fontWeight: 400 }}>
            Smarter Public Finance
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          Data-driven budget allocation for government bodies. NSGA-II optimization, causal impact modeling, and full citizen transparency — in one platform.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          <button className="btn-primary" onClick={() => navigate('/admin/login')}
            style={{ padding: '14px 32px', fontSize: 15 }}>
            Admin Portal →
          </button>
          <button className="btn-ghost" onClick={() => navigate('/citizen/login')}
            style={{ padding: '14px 32px', fontSize: 15 }}>
            Citizen View
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { Icon: BarChart2, label: 'NSGA-II Pareto Optimization' },
            { Icon: Shield,    label: 'Verified Admin Access' },
            { Icon: Users,     label: 'Citizen Transparency' },
            { Icon: Zap,       label: 'SHAP Explainability' },
          ].map(({ Icon, label }) => (
            <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <Icon size={20} color="var(--accent-lt)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}