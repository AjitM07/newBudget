import { useState } from 'react'
import { updateRegionDataset } from '../../services/dashboardService'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { Database, ChevronDown, ChevronUp, Save, Users, TrendingUp } from 'lucide-react'

const SECTORS = ['Healthcare', 'Education', 'Infrastructure', 'Agriculture', 'Welfare']

const SECTOR_DEFAULTS = {
  Healthcare:     { urgencyScore: 78, currentSpend: 5, coverageGap: 42 },
  Education:      { urgencyScore: 72, currentSpend: 6, coverageGap: 35 },
  Infrastructure: { urgencyScore: 65, currentSpend: 8, coverageGap: 28 },
  Agriculture:    { urgencyScore: 58, currentSpend: 4, coverageGap: 20 },
  Welfare:        { urgencyScore: 50, currentSpend: 3, coverageGap: 15 },
}

const SECTOR_ICONS = {
  Healthcare: '🏥', Education: '📚', Infrastructure: '🏗️',
  Agriculture: '🌾', Welfare: '🤝',
}

export default function RegionDatasetPanel({ onSaved }) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [population, setPopulation] = useState('')
  const [gdp, setGdp]               = useState('')
  const [sectors, setSectors]        = useState(
    Object.fromEntries(SECTORS.map(s => [s, { ...SECTOR_DEFAULTS[s] }]))
  )

  const setSector = (s, field, val) =>
    setSectors(prev => ({ ...prev, [s]: { ...prev[s], [field]: val } }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const sectorIndicators = Object.fromEntries(
        SECTORS.map(s => [
          s.toLowerCase(),
          {
            urgencyScore: Number(sectors[s].urgencyScore),
            currentSpend: Number(sectors[s].currentSpend) / 100,
            coverageGap:  Number(sectors[s].coverageGap)  / 100,
          },
        ])
      )
      await updateRegionDataset(user?.regionId || 'default', {
        population: population ? Number(population) : undefined,
        gdp:        gdp        ? Number(gdp) * 1e7 : undefined,  // input in Crores
        sectorIndicators,
      })
      toast.success('Region dataset saved — optimization will use this data')
      if (onSaved) onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save dataset')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      {/* Header toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '18px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: 'var(--yellow-gl)',
            display: 'grid', placeItems: 'center',
          }}>
            <Database size={17} color="var(--yellow-lt)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>
              Region Dataset Input
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
              Population, GDP &amp; sector need indicators — improves AI accuracy
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
      </button>

      {open && (
        <div style={{ padding: '0 24px 24px' }}>
          {/* Region-level inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={S.label}>
                <Users size={13} /> Population
              </label>
              <input className="input" style={S.input}
                type="number" placeholder="e.g. 60000000 (6 Cr)"
                value={population} onChange={e => setPopulation(e.target.value)}
              />
              <div style={S.hint}>Number of people in your region</div>
            </div>
            <div>
              <label style={S.label}>
                <TrendingUp size={13} /> Regional GDP (₹ Crore)
              </label>
              <input className="input" style={S.input}
                type="number" placeholder="e.g. 1500 (₹1500 Cr)"
                value={gdp} onChange={e => setGdp(e.target.value)}
              />
              <div style={S.hint}>Total economic output in crores</div>
            </div>
          </div>

          {/* Sector indicators */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 14, fontFamily: 'var(--font-head)' }}>
              Sector Need Indicators
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {SECTORS.map(s => (
                <div key={s} style={{
                  background: 'var(--bg2)', borderRadius: 12, padding: '14px 18px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 18 }}>{SECTOR_ICONS[s]}</span>
                    <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14 }}>{s}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={S.label2}>Urgency Score (0–100)</label>
                      <input className="input" style={S.input}
                        type="number" min={0} max={100}
                        value={sectors[s].urgencyScore}
                        onChange={e => setSector(s, 'urgencyScore', e.target.value)}
                      />
                      <div style={S.hint}>100 = critical need</div>
                    </div>
                    <div>
                      <label style={S.label2}>Current Spend (% of budget)</label>
                      <input className="input" style={S.input}
                        type="number" min={0} max={100}
                        value={sectors[s].currentSpend}
                        onChange={e => setSector(s, 'currentSpend', e.target.value)}
                      />
                      <div style={S.hint}>How much is currently being spent</div>
                    </div>
                    <div>
                      <label style={S.label2}>Coverage Gap (%)</label>
                      <input className="input" style={S.input}
                        type="number" min={0} max={100}
                        value={sectors[s].coverageGap}
                        onChange={e => setSector(s, 'coverageGap', e.target.value)}
                      />
                      <div style={S.hint}>% of population underserved</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Dataset → Optimize with real data'}
          </button>
        </div>
      )}
    </div>
  )
}

const S = {
  label:  { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 },
  label2: { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 5 },
  input:  { fontSize: 13, padding: '9px 12px' },
  hint:   { fontSize: 10, color: 'var(--text3)', marginTop: 4 },
}
