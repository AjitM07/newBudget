import { useNavigate } from 'react-router-dom'
import { BarChart2, Shield, Users, Zap } from 'lucide-react'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>

      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 680, width: '100%' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 20, background: 'var(--accent-gl)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--accent-lt)', fontSize: 12, fontWeight: 600, marginBottom: 28 }}>
          <Zap size={12} /> AI-Powered Budget Optimization Platform
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'clamp(36px,6vw,60px)', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px', color: 'var(--text)' }}>
          Budget<span style={{ color: 'var(--accent-lt)' }}>OS</span>
          <br />
          <span style={{ color: 'var(--text2)', fontSize: '0.55em', fontWeight: 400 }}>
            Smarter Public Finance Decisions
          </span>
        </h1>

        <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 40 }}>
          Data-driven budget allocation for government bodies.
          NSGA-II optimization, causal impact modeling, and full citizen transparency.
        </p>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
          <button
            onClick={() => navigate('/admin/login')}
            style={{ padding: '14px 32px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Admin Portal →
          </button>
          <button
            onClick={() => navigate('/citizen/login')}
            style={{ padding: '14px 32px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 15, cursor: 'pointer' }}
          >
            Citizen View
          </button>
        </div>

        {/* Feature grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          {[
            { Icon: BarChart2, label: 'NSGA-II Pareto Optimization' },
            { Icon: Shield,    label: 'Secure Admin Access' },
            { Icon: Users,     label: 'Citizen Transparency' },
            { Icon: Zap,       label: 'SHAP Explainability' },
          ].map(({ Icon, label }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, textAlign: 'center' }}>
              <Icon size={20} color="var(--accent-lt)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.5 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
