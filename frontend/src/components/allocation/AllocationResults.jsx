import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import useAllocationStore from '../../store/allocationStore'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'

// ── Must be defined BEFORE it's used in SectorCard ────────────────────────
const SECTOR_COLORS = {
  Healthcare:     'var(--red-lt)',
  Education:      'var(--accent-lt)',
  Infrastructure: 'var(--yellow-lt)',
  Agriculture:    'var(--green-lt)',
  Welfare:        'var(--purple-lt)',
}

// ── Single sector card ─────────────────────────────────────────────────────
function SectorCard({ s, totalBudget }) {
  const [expanded, setExpanded] = useState(false)
  const color    = SECTOR_COLORS[s.sector] || 'var(--accent-lt)'
  const amount   = s.fraction * totalBudget
  const change   = s.changeFromPrev   // positive=increase, negative=decrease, 0=same

  const ChangeIcon  = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const changeColor = change > 0
    ? 'var(--green-lt)'
    : change < 0
    ? 'var(--red-lt)'
    : 'var(--text3)'

  return (
    <div
      className="card"
      style={{ padding: 20, transition: 'all 0.2s' }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: color, boxShadow: `0 0 8px ${color}`,
          }} />
          <span style={{
            fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14,
          }}>
            {s.sector}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, fontWeight: 600, color: changeColor,
        }}>
          <ChangeIcon size={13} />
          {change === 0
            ? 'No change'
            : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
        </div>
      </div>

      {/* ── Allocation bar ── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontSize: 28, fontFamily: 'var(--font-head)',
            fontWeight: 800, color, lineHeight: 1,
          }}>
            {(s.fraction * 100).toFixed(1)}%
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              ₹{(amount / 1e7).toFixed(2)} Cr
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>of total budget</div>
          </div>
        </div>
        <div style={{
          height: 6, background: 'var(--border)',
          borderRadius: 3, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3, background: color,
            width: `${s.fraction * 100}%`, transition: 'width 0.8s ease',
          }} />
        </div>
      </div>

      {/* ── Priority badge ── */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
        background:
          s.priority === 'HIGH'   ? 'var(--red-gl)'
          : s.priority === 'MEDIUM' ? 'var(--yellow-gl)'
          : 'var(--green-gl)',
        color:
          s.priority === 'HIGH'   ? 'var(--red-lt)'
          : s.priority === 'MEDIUM' ? 'var(--yellow-lt)'
          : 'var(--green-lt)',
        marginBottom: 12,
      }}>
        {s.priority} PRIORITY
      </div>

      {/* ── Expand button ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', background: 'var(--bg2)',
          border: '1px solid var(--border)', borderRadius: 8,
          padding: '8px 12px', cursor: 'pointer', color: 'var(--text2)',
          fontSize: 12, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          transition: 'all 0.15s',
        }}
      >
        <span>Why this allocation?</span>
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {/* ── Explanation panel ── */}
      {expanded && (
        <div style={{
          marginTop: 12, padding: 14,
          background: 'var(--bg2)', borderRadius: 10, fontSize: 12,
        }}>
          <div style={{
            fontWeight: 700, color, marginBottom: 8,
            fontFamily: 'var(--font-head)',
          }}>
            Explanation
          </div>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: 10 }}>
            {s.explanation}
          </p>

          {/* ── SHAP factor grid ── */}
          {s.factors?.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 8,
            }}>
              {s.factors.map((f, i) => (
                <div key={i} style={{
                  padding: '7px 10px', borderRadius: 8,
                  background: f.impact > 0 ? 'var(--green-gl)' : 'var(--red-gl)',
                  border: `1px solid ${f.impact > 0
                    ? 'rgba(16,185,129,0.2)'
                    : 'rgba(239,68,68,0.2)'}`,
                }}>
                  <div style={{
                    fontSize: 10, color: 'var(--text3)', marginBottom: 2,
                  }}>
                    {f.name}
                  </div>
                  <div style={{
                    fontWeight: 700,
                    color: f.impact > 0 ? 'var(--green-lt)' : 'var(--red-lt)',
                    fontSize: 13,
                  }}>
                    {f.impact > 0 ? '+' : ''}{f.impact.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Projected outcome ── */}
          {s.projectedOutcome && (
            <div style={{
              marginTop: 10, padding: '8px 12px',
              background: 'var(--accent-gl)',
              borderRadius: 8, fontSize: 11,
              color: 'var(--accent-lt)', fontWeight: 600,
            }}>
              📈 {s.projectedOutcome}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export default function AllocationResults() {
  const { allocations, sectorAnalysis, totalBudget } = useAllocationStore()
  const [view, setView] = useState('cards')

  // Nothing to show yet
  if (!sectorAnalysis || sectorAnalysis.length === 0) return null

  const barData = sectorAnalysis.map(s => ({
    sector:    s.sector.slice(0, 5),
    fullName:  s.sector,
    allocated: parseFloat((s.fraction * 100).toFixed(1)),
    urgency:   s.urgencyScore,
  }))

  const radarData = sectorAnalysis.map(s => ({
    sector:     s.sector,
    Allocation: parseFloat((s.fraction * 100).toFixed(1)),
    Urgency:    s.urgencyScore,
    Efficiency: s.efficiencyScore || 60,
  }))

  const CustomBarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const sec = sectorAnalysis.find(s => s.sector.slice(0, 5) === d.sector)
    return (
      <div style={{
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 14px', fontSize: 12,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font-head)' }}>
          {d.fullName}
        </div>
        <div style={{ color: 'var(--text2)' }}>
          Allocated: <span style={{ color: 'var(--accent-lt)', fontWeight: 600 }}>{d.allocated}%</span>
        </div>
        <div style={{ color: 'var(--text2)' }}>
          Urgency: <span style={{ color: 'var(--red-lt)', fontWeight: 600 }}>{d.urgency}/100</span>
        </div>
        {sec && (
          <div style={{ color: 'var(--text3)', marginTop: 4, fontSize: 11 }}>
            {sec.shortReason}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      {/* ── Title + view toggle ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800,
          }}>
            Optimal Allocation — ₹{(totalBudget / 1e7).toFixed(1)} Crore
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>
            Click "Why this allocation?" on any card for full explanation
          </p>
        </div>
        <div style={{
          display: 'flex', gap: 4,
          background: 'var(--surface)', borderRadius: 10, padding: 4,
        }}>
          {['cards', 'chart', 'radar'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '6px 14px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: 'none', transition: 'all 0.15s',
                textTransform: 'capitalize',
                background: view === v ? 'var(--accent)' : 'transparent',
                color:      view === v ? '#fff' : 'var(--text2)',
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cards view ── */}
      {view === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {sectorAnalysis.map((s, i) => (
            <div key={s.sector} className={`fade-up-${Math.min(i + 1, 5)}`}>
              <SectorCard s={s} totalBudget={totalBudget} />
            </div>
          ))}
        </div>
      )}

      {/* ── Bar chart view ── */}
      {view === 'chart' && (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            Colored bars = allocation %. Grey bars = urgency score (demand signal).
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} barGap={6}>
              <XAxis
                dataKey="sector"
                tick={{ fill: 'var(--text)', fontSize: 12 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text3)', fontSize: 10 }}
                axisLine={false} tickLine={false} unit="%"
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="allocated" radius={[6, 6, 0, 0]} name="Allocation %">
                {barData.map((d, i) => {
                  const sec = sectorAnalysis.find(s => s.sector.slice(0, 5) === d.sector)
                  return (
                    <Cell
                      key={i}
                      fill={SECTOR_COLORS[sec?.sector] || 'var(--accent-lt)'}
                    />
                  )
                })}
              </Bar>
              <Bar
                dataKey="urgency"
                radius={[6, 6, 0, 0]}
                fill="var(--border)"
                opacity={0.5}
                name="Urgency Score"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Radar view ── */}
      {view === 'radar' && (
        <div className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            Allocation vs Urgency vs Efficiency — ideal = three overlapping shapes.
          </p>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="sector"
                tick={{ fill: 'var(--text)', fontSize: 11 }}
              />
              <PolarRadiusAxis
                angle={30} domain={[0, 100]}
                tick={{ fill: 'var(--text3)', fontSize: 9 }}
              />
              <Radar
                name="Allocation"
                dataKey="Allocation"
                stroke="var(--accent-lt)"
                fill="var(--accent-lt)"
                fillOpacity={0.25}
              />
              <Radar
                name="Urgency"
                dataKey="Urgency"
                stroke="var(--red-lt)"
                fill="var(--red-lt)"
                fillOpacity={0.15}
              />
              <Radar
                name="Efficiency"
                dataKey="Efficiency"
                stroke="var(--green-lt)"
                fill="var(--green-lt)"
                fillOpacity={0.15}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
