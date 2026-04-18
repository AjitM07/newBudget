import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Navbar from '../components/shared/Navbar'
import { getPublicData } from '../services/dashboardService'
import useAuthStore from '../store/authStore'

const COLORS = ['#ef4444','#3b82f6','#f59e0b','#10b981','#8b5cf6']

export default function CitizenView() {
  const { user } = useAuthStore()
  const [data, setData] = useState(null)

  useEffect(() => {
    getPublicData(user?.regionId || 'default').then(r => setData(r.data)).catch(() => {})
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            borderRadius: 20, background: 'var(--green-gl)', color: 'var(--green-lt)',
            fontSize: 11, fontWeight: 600, marginBottom: 12,
          }}>
            Public — Transparency Portal
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800 }}>
            Budget Transparency — {user?.region || 'Your Region'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>
            Published budget allocations for FY 2024-25. Sensitive administrative data is not shown.
          </p>
        </div>

        {data ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
                  Budget Distribution
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.allocations} dataKey="value" nameKey="sector"
                      cx="50%" cy="50%" outerRadius={90} label={({ sector, value }) => `${sector}: ${value}%`}
                      labelLine={false}>
                      {data.allocations?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, 'Allocation']} contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.publicMetrics?.map((m, i) => (
                  <div key={i} className={`card fade-up-${i+1}`} style={{ padding: '18px 22px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 22, fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 4 }}>{m.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{m.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: 'var(--text3)' }}>No published allocation data available yet for this region.</p>
          </div>
        )}
      </div>
    </div>
  )
}