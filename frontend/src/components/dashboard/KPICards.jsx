import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Activity, Users, BookOpen, Zap } from 'lucide-react'
import { getKPIs } from '../../services/dashboardService'

const ICONS = { gdp: TrendingUp, hdi: Activity, literacy: BookOpen, infra: Zap, population: Users }
const COLORS = ['var(--accent-lt)', 'var(--green-lt)', 'var(--yellow-lt)', 'var(--purple-lt)', 'var(--red-lt)']

export default function KPICards({ regionId }) {
  const [kpis, setKpis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getKPIs(regionId)
      .then(r => setKpis(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [regionId])

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 100 }} />
      ))}
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
      {kpis.map((k, i) => {
        const Icon = ICONS[k.key] || Activity
        const color = COLORS[i % COLORS.length]
        const up = k.trend >= 0
        return (
          <div key={k.key} className={`card fade-up-${i+1}`} style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center',
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
              }}>
                <Icon size={17} color={color} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                color: up ? 'var(--green-lt)' : 'var(--red-lt)',
              }}>
                {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {Math.abs(k.trend)}%
              </div>
            </div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
              {k.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5, fontWeight: 500 }}>{k.label}</div>
          </div>
        )
      })}
    </div>
  )
}