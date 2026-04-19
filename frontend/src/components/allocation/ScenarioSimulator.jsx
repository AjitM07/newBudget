import { useState, Component } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import { simulateChange as simulateAPI } from '../../services/allocationService'
import useAllocationStore from '../../store/allocationStore'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { FlaskConical, TrendingUp, TrendingDown, Minus, Zap, AlertTriangle } from 'lucide-react'

const SECTORS = ['Healthcare', 'Education', 'Infrastructure', 'Agriculture', 'Welfare']

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

// ── React Error Boundary ───────────────────────────────────────────────────────
class SimulatorErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(e) { return { hasError: true, error: e } }
  componentDidCatch(e, info) { console.error('ScenarioSimulator render error:', e, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px 24px', borderRadius: 12, marginTop: 16,
          background: 'var(--red-gl)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <AlertTriangle size={18} color="var(--red-lt)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--red-lt)', fontFamily: 'var(--font-head)', marginBottom: 4 }}>
              Chart render error
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
              The simulation completed but the chart couldn't render the data.
              The projection and ripple effects are still shown below.
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                marginTop: 10, padding: '5px 14px', borderRadius: 8,
                background: 'var(--red-gl)', border: '1px solid var(--red-lt)',
                color: 'var(--red-lt)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Safe number helper ─────────────────────────────────────────────────────────
const safeNum = (v, fallback = 0) => {
  const n = parseFloat(v)
  return isNaN(n) || !isFinite(n) ? fallback : n
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 6 }}>{d.sector}</div>
      <div style={{ color: 'var(--text2)' }}>
        Base: <span style={{ fontWeight: 600, color: 'var(--text)' }}>{safeNum(d.base).toFixed(1)}%</span>
      </div>
      <div style={{ color: 'var(--text2)' }}>
        Simulated: <span style={{
          fontWeight: 600,
          color: safeNum(d.simulated) > safeNum(d.base) ? 'var(--green-lt)' : 'var(--red-lt)',
        }}>
          {safeNum(d.simulated).toFixed(1)}%
        </span>
      </div>
      <div style={{
        marginTop: 4, fontWeight: 700,
        color: safeNum(d.delta) > 0 ? 'var(--green-lt)' : safeNum(d.delta) < 0 ? 'var(--red-lt)' : 'var(--text3)',
      }}>
        {safeNum(d.delta) > 0 ? '+' : ''}{safeNum(d.delta).toFixed(2)}%
      </div>
    </div>
  )
}

// ── Chart component (isolated so error boundary catches it) ───────────────────
function ComparisonChart({ chartData }) {
  // Extra guard: only render if data is fully valid
  const validData = chartData.filter(d =>
    d.sector &&
    Number.isFinite(safeNum(d.base)) &&
    Number.isFinite(safeNum(d.simulated))
  )
  if (validData.length === 0) return (
    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
      No valid chart data available.
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={validData} barGap={4} barCategoryGap="30%">
        <XAxis
          dataKey="sector"
          tick={{ fill: 'var(--text)', fontSize: 11, fontFamily: 'var(--font-head)' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text3)', fontSize: 10 }}
          axisLine={false} tickLine={false} unit="%"
          domain={[0, 'auto']}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="base" name="Base %" radius={[4, 4, 0, 0]} opacity={0.5}>
          {validData.map((d, i) => (
            <Cell key={i} fill={SECTOR_COLORS[d.sector] || '#888'} />
          ))}
        </Bar>
        <Bar dataKey="simulated" name="Simulated %" radius={[4, 4, 0, 0]}>
          {validData.map((d, i) => (
            <Cell key={i} fill={SECTOR_COLORS[d.sector] || '#888'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function ScenarioSimulator() {
  const { allocations, totalBudget } = useAllocationStore()
  const { user } = useAuthStore()

  const [sector, setSector]   = useState('Healthcare')
  const [change, setChange]   = useState(10)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  // Only render after an optimization has been run
  if (!allocations || Object.keys(allocations).length === 0) return null

  const handleSimulate = async () => {
    setResult(null) // clear previous to avoid stale render crash
    setLoading(true)
    try {
      const res = await simulateAPI({
        regionId:      user?.regionId || 'default',
        sector,
        changePercent: Number(change),
        totalBudget:   totalBudget || 1_000_000_000,
      })
      const data = res.data

      // Defensive: verify shape before setting state
      if (!data || typeof data !== 'object') throw new Error('Invalid response from server')

      // Ensure allocations are objects with numeric values
      const base = data.baseAllocations || {}
      const sim  = data.simulatedAllocations || {}

      // Coerce to numbers
      const safeBase = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, safeNum(v)]))
      const safeSim  = Object.fromEntries(Object.entries(sim).map(([k, v])  => [k, safeNum(v)]))

      const safeRipples = Array.isArray(data.rippleEffects)
        ? data.rippleEffects
            .map(r => ({
              sector:    String(r.sector || ''),
              change:    safeNum(r.change, 0),
              newAmount: safeNum(r.newAmount, 0),
            }))
            .filter(r => r.sector && Math.abs(r.change) > 0.01)
        : []

      setResult({
        targetSector:         sector,
        changePercent:        change,
        baseAllocations:      safeBase,
        simulatedAllocations: safeSim,
        rippleEffects:        safeRipples,
        projection:           data.projection || `${change > 0 ? '+' : ''}${change}% applied to ${sector}`,
      })

      toast.success('Scenario simulated!')
    } catch (err) {
      console.error('simulate error:', err)
      toast.error(err.response?.data?.message || 'Simulation failed')
    } finally {
      setLoading(false)
    }
  }

  // Build chart data from ALL known sectors, using 0 as fallback
  const chartData = result
    ? SECTORS.map(s => ({
        sector:    s,
        base:      parseFloat((safeNum(result.baseAllocations?.[s]) * 100).toFixed(2)),
        simulated: parseFloat((safeNum(result.simulatedAllocations?.[s]) * 100).toFixed(2)),
        delta:     parseFloat(((safeNum(result.simulatedAllocations?.[s]) - safeNum(result.baseAllocations?.[s])) * 100).toFixed(2)),
      }))
    : []

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11, background: 'rgba(139,92,246,0.15)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <FlaskConical size={18} color="var(--purple-lt)" />
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800 }}>
            Scenario Simulator
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            "What if I increase Healthcare by 10%?" — see ripple effects instantly
          </p>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 14, alignItems: 'end', marginBottom: 20 }}>
        {/* Sector picker */}
        <div>
          <label style={S.label}>Select Sector</label>
          <select
            style={{
              width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px', color: 'var(--text)',
              fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', cursor: 'pointer',
            }}
            value={sector}
            onChange={e => setSector(e.target.value)}
          >
            {SECTORS.map(s => (
              <option key={s} value={s}>{SECTOR_ICONS[s]} {s}</option>
            ))}
          </select>
        </div>

        {/* Change % slider */}
        <div>
          <label style={S.label}>
            Change: <span style={{ color: change > 0 ? 'var(--green-lt)' : 'var(--red-lt)', fontWeight: 700 }}>
              {change > 0 ? '+' : ''}{change}%
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>-30%</span>
            <input
              type="range" min={-30} max={30} step={5}
              value={change}
              onChange={e => { setChange(Number(e.target.value)); setResult(null) }}
              style={{ flex: 1, accentColor: change > 0 ? 'var(--green-lt)' : 'var(--red-lt)' }}
            />
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>+30%</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {[-20, -10, 10, 20].map(v => (
              <button key={v} onClick={() => { setChange(v); setResult(null) }}
                style={{
                  padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  border: `1px solid ${change === v ? (v > 0 ? 'var(--green-lt)' : 'var(--red-lt)') : 'var(--border)'}`,
                  background: change === v ? (v > 0 ? 'var(--green-gl)' : 'var(--red-gl)') : 'transparent',
                  color: change === v ? (v > 0 ? 'var(--green-lt)' : 'var(--red-lt)') : 'var(--text3)',
                  cursor: 'pointer',
                }}>
                {v > 0 ? '+' : ''}{v}%
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleSimulate} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, whiteSpace: 'nowrap' }}>
          <Zap size={14} />
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="fade-up">
          {/* Projection banner */}
          <div style={{
            padding: '12px 18px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Zap size={16} color="var(--purple-lt)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--purple-lt)', marginBottom: 3 }}>
                Projected Impact
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                {result.projection}
              </div>
            </div>
          </div>

          {/* Before / After bar chart — wrapped in error boundary */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text2)' }}>
              Allocation Comparison: Base vs. Simulated
            </h4>
            <SimulatorErrorBoundary>
              <ComparisonChart chartData={chartData} />
            </SimulatorErrorBoundary>
          </div>

          {/* Delta table — always safe, no Recharts involved */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)' }}>
              Allocation Changes by Sector
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              {chartData.map(d => {
                const color = d.delta > 0.1 ? 'var(--green-lt)' : d.delta < -0.1 ? 'var(--red-lt)' : 'var(--text3)'
                const bg    = d.delta > 0.1 ? 'var(--green-gl)' : d.delta < -0.1 ? 'var(--red-gl)'  : 'var(--bg2)'
                const Icon  = d.delta > 0.1 ? TrendingUp : d.delta < -0.1 ? TrendingDown : Minus
                return (
                  <div key={d.sector} style={{
                    padding: '12px 14px', borderRadius: 10, background: bg,
                    border: `1px solid ${d.delta > 0.1 ? 'rgba(16,185,129,0.2)' : d.delta < -0.1 ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{SECTOR_ICONS[d.sector] || '📌'}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{d.sector}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color, fontWeight: 700, fontSize: 15 }}>
                      <Icon size={13} />
                      {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}%
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                      {d.base.toFixed(1)}% → {d.simulated.toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ripple effects */}
          {result.rippleEffects?.length > 0 && (
            <div>
              <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)' }}>
                Ripple Effects on Other Sectors
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {result.rippleEffects.map(r => {
                  const up    = r.change > 0
                  const Icon  = up ? TrendingUp : r.change < 0 ? TrendingDown : Minus
                  const color = up ? 'var(--green-lt)' : r.change < 0 ? 'var(--red-lt)' : 'var(--text3)'
                  return (
                    <div key={r.sector} style={{
                      padding: '12px 16px', borderRadius: 10,
                      background: up ? 'var(--green-gl)' : 'var(--red-gl)',
                      border: `1px solid ${up ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <span style={{ fontSize: 20 }}>{SECTOR_ICONS[r.sector] || '📌'}</span>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>{r.sector}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color, fontWeight: 700, fontSize: 14 }}>
                          <Icon size={12} />
                          {r.change > 0 ? '+' : ''}{r.change.toFixed(2)}%
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>→ ₹{r.newAmount.toFixed(2)} Cr</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ML Explanations */}
          {result.mlExplanations?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text2)' }}>
                🤖 ML Causal Explanations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {result.mlExplanations.map((e, i) => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                    fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
                  }}>
                    <span style={{ fontWeight: 700, color: 'var(--purple-lt)' }}>{e.from} → {e.to}</span>
                    {e.effect_pct != null && (
                      <span style={{ marginLeft: 8, fontWeight: 600, color: e.effect_pct > 0 ? 'var(--green-lt)' : 'var(--red-lt)' }}>
                        {e.effect_pct > 0 ? '+' : ''}{e.effect_pct}%
                      </span>
                    )}
                    {e.reason && <span style={{ marginLeft: 6, color: 'var(--text3)' }}>— {e.reason}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ML HDI Projection chart */}
          {result.mlProjection?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontFamily: 'var(--font-head)', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text2)' }}>
                📈 HDI Projection: Baseline vs. Simulated
              </h4>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>
                Year-by-year HDI impact forecast from the ML model
              </p>
              <SimulatorErrorBoundary>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={result.mlProjection}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="year"
                      tick={{ fill: 'var(--text)', fontSize: 11, fontFamily: 'var(--font-head)' }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--text3)', fontSize: 10 }}
                      axisLine={false} tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => [v, name === 'simulated' ? 'Simulated HDI' : 'Baseline HDI']}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="baseline"  stroke="var(--text3)"    strokeDasharray="4 4" strokeWidth={2} dot={false} name="Baseline" />
                    <Line type="monotone" dataKey="simulated" stroke="var(--purple-lt)" strokeWidth={2.5}    dot={{ r: 3 }}  name="Simulated" />
                  </LineChart>
                </ResponsiveContainer>
              </SimulatorErrorBoundary>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

const S = {
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 },
}
