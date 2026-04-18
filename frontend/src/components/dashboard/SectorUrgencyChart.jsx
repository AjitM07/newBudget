import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import { getSectorNeeds } from '../../services/dashboardService'

const STATUS = {
  critical:    { color: 'var(--red-lt)',    bg: 'var(--red-gl)',    Icon: AlertTriangle, label: 'Critical' },
  underfunded: { color: 'var(--yellow-lt)', bg: 'var(--yellow-gl)', Icon: TrendingUp,    label: 'Underfunded' },
  stable:      { color: 'var(--green-lt)',  bg: 'var(--green-gl)',  Icon: CheckCircle,   label: 'Stable' },
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-head)' }}>{d.sector}</div>
      <div style={{ color: 'var(--text2)' }}>Urgency: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{d.urgencyScore}/100</span></div>
      <div style={{ color: 'var(--text2)' }}>Status: <span style={{ color: d.statusColor, fontWeight: 600 }}>{d.status}</span></div>
      <div style={{ color: 'var(--text2)', marginTop: 4, fontSize: 11 }}>{d.reason}</div>
    </div>
  )
}

export default function SectorUrgencyChart({ regionId }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSectorNeeds(regionId)
      .then(r => {
        const enriched = r.data.map(d => ({
          ...d,
          statusColor: d.urgencyScore > 70 ? 'var(--red-lt)' : d.urgencyScore > 45 ? 'var(--yellow-lt)' : 'var(--green-lt)',
          statusKey: d.urgencyScore > 70 ? 'critical' : d.urgencyScore > 45 ? 'underfunded' : 'stable',
        }))
        setData(enriched)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [regionId])

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
            Sector Urgency Index
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>Need score based on gap analysis & historical underfunding</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />
              <span style={{ color: 'var(--text2)' }}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 260 }} />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" barSize={20}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="sector" tick={{ fill: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="urgencyScore" radius={[0, 6, 6, 0]}>
              {data.map((d, i) => <Cell key={i} fill={d.statusColor} opacity={0.9} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Status cards below chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 16 }}>
        {Object.entries(STATUS).map(([k, { color, bg, Icon, label }]) => {
          const count = data.filter(d => d.statusKey === k).length
          return (
            <div key={k} style={{ borderRadius: 10, padding: '10px 14px', background: bg, border: `1px solid ${color}22` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon size={14} color={color} />
                <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
              </div>
              <div style={{ fontSize: 22, fontFamily: 'var(--font-head)', fontWeight: 800, color, marginTop: 4 }}>{count}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>sectors</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}