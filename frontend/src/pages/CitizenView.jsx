import { useEffect, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import Navbar           from '../components/shared/Navbar'
import { getPublicData } from '../services/dashboardService'
import useAuthStore     from '../store/authStore'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle, Activity, Globe, Users, IndianRupee, Calendar,
} from 'lucide-react'

/* ── Constants ──────────────────────────────────────────────────────────────── */
const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']
const SECTOR_COLORS = {
  Healthcare:     '#ef4444',
  Education:      '#3b82f6',
  Infrastructure: '#f59e0b',
  Agriculture:    '#10b981',
  Welfare:        '#8b5cf6',
}
const SECTOR_ICONS = {
  Healthcare: '🏥', Education: '📚', Infrastructure: '🏗️',
  Agriculture: '🌾', Welfare: '🤝',
}

/* ── Custom tooltips ─────────────────────────────────────────────────────────*/
const BarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 6 }}>{d.sector}</div>
      <div style={{ color: 'var(--text2)' }}>Allocation: <b style={{ color: 'var(--accent-lt)' }}>{d.value}%</b></div>
      <div style={{ color: 'var(--text2)' }}>Amount: <b>₹{d.amount} Cr</b></div>
      <div style={{ color: 'var(--text2)' }}>Impact Score: <b style={{ color: 'var(--yellow-lt)' }}>{d.impact}/10</b></div>
    </div>
  )
}

/* ── Sector card ─────────────────────────────────────────────────────────────*/
function SectorCard({ s, index }) {
  const color = SECTOR_COLORS[s.sector] || '#888'
  const statusColor = s.status === 'critical' ? 'var(--red-lt)'
    : s.status === 'underfunded' ? 'var(--yellow-lt)' : 'var(--green-lt)'
  const StatusIcon = s.status === 'critical' ? AlertTriangle
    : s.status === 'underfunded' ? TrendingUp : CheckCircle

  return (
    <div className={`card fade-up-${Math.min(index + 1, 5)}`} style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>{SECTOR_ICONS[s.sector] || '📌'}</span>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 15 }}>{s.sector}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3,
              fontSize: 10, fontWeight: 600, color: statusColor,
              padding: '2px 7px', borderRadius: 20,
              background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
            }}>
              <StatusIcon size={9} /> {s.status?.toUpperCase()}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontFamily: 'var(--font-head)', fontWeight: 800, color, lineHeight: 1 }}>
            {s.value}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>of total budget</div>
        </div>
      </div>

      {/* Allocation bar */}
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{
          height: '100%', borderRadius: 3, background: color,
          width: `${s.value}%`, transition: 'width 1s ease',
        }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>ALLOCATED</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14 }}>₹{s.amount} Cr</div>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>IMPACT SCORE</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14, color: 'var(--yellow-lt)' }}>
            {s.impact}/10
          </div>
        </div>
        <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>URGENCY</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14, color: statusColor }}>
            {s.urgencyScore}/100
          </div>
        </div>
      </div>

      {/* Coverage gap */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>
          <span>Population Coverage Gap</span>
          <span style={{ color: statusColor, fontWeight: 600 }}>{((s.coverageGap || 0) * 100).toFixed(0)}%</span>
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2,
            background: statusColor,
            width: `${(s.coverageGap || 0) * 100}%`,
          }} />
        </div>
      </div>
    </div>
  )
}

/* ── Main CitizenView ─────────────────────────────────────────────────────────*/
export default function CitizenView() {
  const { user } = useAuthStore()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]     = useState('overview')

  useEffect(() => {
    getPublicData(user?.regionId || 'default')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            borderRadius: 20, background: 'var(--green-gl)', color: 'var(--green-lt)',
            fontSize: 11, fontWeight: 600, marginBottom: 12,
          }}>
            <Globe size={11} /> Public Transparency Portal
          </div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 800, lineHeight: 1.2 }}>
            Budget Transparency
            <span style={{ color: 'var(--text2)', fontWeight: 400, fontSize: 18, marginLeft: 12 }}>
              — {data?.regionName || user?.region || 'Your Region'}
            </span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, maxWidth: 600 }}>
            Published government budget allocations for FY {data?.fiscalYear || '2024-25'}.
            All data is sourced from official administrative records.
          </p>
        </div>

        {loading ? (
          /* Skeleton */
          <div style={{ display: 'grid', gap: 16 }}>
            {[100, 300, 200].map((h, i) => (
              <div key={i} className="skeleton" style={{ height: h, borderRadius: 16 }} />
            ))}
          </div>
        ) : !data?.hasData ? (
          /* No published data */
          <div>
            <div className="card" style={{ padding: '48px 32px', textAlign: 'center', marginBottom: 24 }}>
              <Activity size={44} color="var(--text3)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                No Published Allocations Yet
              </h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
                Your region's administrators have not yet published a budget allocation.
                Check back soon.
              </p>
            </div>

            {/* Still show sector needs from region data */}
            {data?.sectorNeeds?.length > 0 && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
                  Sector Need Indicators
                  <span style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 400, marginLeft: 10 }}>
                    (region baseline data)
                  </span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {data.sectorNeeds.map((n, i) => (
                    <div key={n.sector} className={`card fade-up-${Math.min(i+1,5)}`} style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{n.icon || '📌'}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: n.urgencyScore > 70 ? 'var(--red-lt)' : n.urgencyScore > 45 ? 'var(--yellow-lt)' : 'var(--green-lt)',
                          padding: '2px 8px', borderRadius: 20,
                          background: n.urgencyScore > 70 ? 'var(--red-gl)' : n.urgencyScore > 45 ? 'var(--yellow-gl)' : 'var(--green-gl)',
                        }}>
                          {n.status?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{n.sector}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>{n.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ── Metric cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
              {data.publicMetrics.map((m, i) => (
                <div key={i} className={`card fade-up-${i+1}`} style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{m.description}</div>
                </div>
              ))}
            </div>

            {/* ── Tab nav ── */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
              {[
                { id: 'overview',  label: '📊 Overview' },
                { id: 'sectors',   label: '🏛️ Sector Breakdown' },
                { id: 'charts',    label: '📈 Charts' },
                { id: 'needs',     label: '⚠️ Need Indicators' },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                    background: tab === t.id ? 'var(--accent)' : 'transparent',
                    color:      tab === t.id ? '#fff' : 'var(--text2)',
                    transition: 'all 0.2s',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Overview tab ── */}
            {tab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Pie chart */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
                    Budget Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={data.allocations}
                        dataKey="value" nameKey="sector"
                        cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                      >
                        {data.allocations.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip
                        formatter={(v, n, p) => [`${v}% (₹${p.payload.amount} Cr)`, n]}
                        contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Allocation table */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                    Sector Summary
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.allocations.map((a, i) => {
                      const col = SECTOR_COLORS[a.sector] || COLORS[i % COLORS.length]
                      const delta = data.allocationDelta?.find(d => d.sector === a.sector)
                      const DeltaIcon = delta?.change > 0 ? TrendingUp : delta?.change < 0 ? TrendingDown : Minus
                      return (
                        <div key={a.sector} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18, width: 24 }}>{SECTOR_ICONS[a.sector] || '📌'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: 13 }}>{a.sector}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 800, color: col, fontSize: 14 }}>{a.value}%</span>
                                <span style={{ fontSize: 12, color: 'var(--text3)' }}>₹{a.amount} Cr</span>
                                {delta?.change != null && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2,
                                    color: delta.change > 0 ? 'var(--green-lt)' : delta.change < 0 ? 'var(--red-lt)' : 'var(--text3)',
                                  }}>
                                    <DeltaIcon size={10} />
                                    {delta.change > 0 ? '+' : ''}{delta.change}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: col, borderRadius: 2, width: `${a.value}%`, transition: 'width 1s' }} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Sector cards tab ── */}
            {tab === 'sectors' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {data.allocations.map((s, i) => (
                  <SectorCard key={s.sector} s={s} index={i} />
                ))}
              </div>
            )}

            {/* ── Charts tab ── */}
            {tab === 'charts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Allocation bar chart */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 20 }}>
                    Budget Allocation per Sector (₹ Crore)
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.allocations} barSize={40}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="sector" tick={{ fill: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-head)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} unit=" Cr" />
                      <RTooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                      <Bar dataKey="amount" name="Amount (₹ Cr)" radius={[6, 6, 0, 0]}>
                        {data.allocations.map((d, i) => (
                          <Cell key={i} fill={SECTOR_COLORS[d.sector] || COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Impact score bar chart */}
                <div className="card" style={{ padding: 24 }}>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                    Impact Score per Sector
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
                    Computed from SHAP values — higher = more HDI/Gini impact expected
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.allocations} layout="vertical" barSize={18}>
                      <XAxis type="number" domain={[0, 10]} tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="sector"
                        tick={{ fill: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 600 }}
                        width={120} axisLine={false} tickLine={false} />
                      <RTooltip formatter={(v) => [`${v}/10`, 'Impact Score']}
                        contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Bar dataKey="impact" radius={[0, 6, 6, 0]}>
                        {data.allocations.map((d, i) => (
                          <Cell key={i} fill={SECTOR_COLORS[d.sector] || COLORS[i % COLORS.length]} opacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Need indicators tab ── */}
            {tab === 'needs' && data.sectorNeeds?.length > 0 && (
              <div>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.7 }}>
                  The indicators below reflect the baseline sector health for your region,
                  as computed by the administrative optimization engine. A higher urgency score
                  means this sector needs greater attention.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {data.sectorNeeds.map((n, i) => {
                    const urgColor = n.urgencyScore > 70 ? 'var(--red-lt)' : n.urgencyScore > 45 ? 'var(--yellow-lt)' : 'var(--green-lt)'
                    const urgBg    = n.urgencyScore > 70 ? 'var(--red-gl)'  : n.urgencyScore > 45 ? 'var(--yellow-gl)' : 'var(--green-gl)'
                    return (
                      <div key={n.sector} className={`card fade-up-${Math.min(i+1,5)}`} style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24 }}>{n.icon}</span>
                            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>{n.sector}</div>
                          </div>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                            background: urgBg, color: urgColor,
                          }}>
                            {n.status?.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                          <div style={{ background: 'var(--bg2)', padding: '8px 12px', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>URGENCY</div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: urgColor }}>{n.urgencyScore}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>/100</span></div>
                          </div>
                          <div style={{ background: 'var(--bg2)', padding: '8px 12px', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2 }}>COVERAGE GAP</div>
                            <div style={{ fontWeight: 800, fontSize: 18, color: urgColor }}>{((n.coverageGap || 0)*100).toFixed(0)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>%</span></div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>{n.reason}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}