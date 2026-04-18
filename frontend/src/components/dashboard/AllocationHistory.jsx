import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getHistory } from '../../services/allocationService'

const COLORS = ['var(--accent-lt)', 'var(--green-lt)', 'var(--yellow-lt)', 'var(--purple-lt)', 'var(--red-lt)']
const SECTORS = ['Healthcare', 'Education', 'Infrastructure', 'Agriculture', 'Welfare']

export default function AllocationHistory({ regionId }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    getHistory(regionId)
      .then(r => {
        const formatted = r.data.map((h, i) => {
          const row = { name: `Run ${i + 1}` }
          if (h.allocations) {
            for (const [s, v] of Object.entries(Object.fromEntries ? Object.fromEntries(h.allocations) : h.allocations)) {
              row[s] = parseFloat((v * 100).toFixed(1))
            }
          }
          return row
        }).reverse()
        setHistory(formatted)
      }).catch(() => {})
  }, [regionId])

  if (!history.length) return (
    <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <p style={{ color: 'var(--text3)', fontSize: 13 }}>No allocation history yet. Run your first optimization.</p>
    </div>
  )

  return (
    <div className="card" style={{ padding: 24 }}>
      <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Allocation History</h3>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Sector % across past optimization runs</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history}>
          <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)' }} />
          {SECTORS.map((s, i) => (
            <Line key={s} type="monotone" dataKey={s} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}