import { useState, useEffect } from 'react'
import { optimizeBudget } from '../../services/allocationService'
import useAllocationStore from '../../store/allocationStore'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { Sparkles, IndianRupee, MapPin } from 'lucide-react'

const ML_DISTRICTS = [
  { id: 'MH_PUNE',         name: 'Pune, Maharashtra',         pop: '9.4M' },
  { id: 'MH_NAGPUR',       name: 'Nagpur, Maharashtra',       pop: '4.7M' },
  { id: 'UP_LUCKNOW',      name: 'Lucknow, Uttar Pradesh',    pop: '4.6M' },
  { id: 'UP_VARANASI',     name: 'Varanasi, Uttar Pradesh',   pop: '3.7M' },
  { id: 'RJ_JAIPUR',       name: 'Jaipur, Rajasthan',         pop: '6.6M' },
  { id: 'RJ_JODHPUR',      name: 'Jodhpur, Rajasthan',        pop: '3.7M' },
  { id: 'KA_BANGALORE',    name: 'Bangalore, Karnataka',      pop: '1.0M' },
  { id: 'KA_MYSORE',       name: 'Mysore, Karnataka',         pop: '3.0M' },
  { id: 'TN_CHENNAI',      name: 'Chennai, Tamil Nadu',       pop: '7.1M' },
  { id: 'TN_MADURAI',      name: 'Madurai, Tamil Nadu',       pop: '3.0M' },
  { id: 'WB_KOLKATA',      name: 'Kolkata, West Bengal',      pop: '4.5M' },
  { id: 'WB_HOWRAH',       name: 'Howrah, West Bengal',       pop: '4.8M' },
  { id: 'GJ_AHMEDABAD',    name: 'Ahmedabad, Gujarat',        pop: '7.2M' },
  { id: 'MP_BHOPAL',       name: 'Bhopal, Madhya Pradesh',    pop: '2.4M' },
  { id: 'OR_BHUBANESWAR',  name: 'Bhubaneswar, Odisha',       pop: '0.8M' },
]

export default function BudgetInputForm() {
  const [budget, setBudget]   = useState('')
  const [districtId, setDistrict] = useState('')
  const { user }              = useAuthStore()
  const { setResult, setTotalBudget, setRegion, loading, setLoading } = useAllocationStore()

  const handleOptimize = async () => {
    const val = parseFloat(budget)
    if (!val || val <= 0) return toast.error('Enter a valid budget amount')
    if (val < 100000)    return toast.error('Minimum budget is ₹1 Lakh')

    setLoading(true)
    const tid = toast.loading(
      districtId
        ? `Running ML NSGA-II for ${ML_DISTRICTS.find(d => d.id === districtId)?.name}…`
        : 'Running NSGA-II optimization...'
    )
    try {
      const res = await optimizeBudget({
        regionId:    user?.regionId  || 'default',
        regionName:  user?.region    || 'All India',
        totalBudget: val,
        ...(districtId && { districtId }),
      })
      setTotalBudget(val)
      setRegion(
        districtId
          ? ML_DISTRICTS.find(d => d.id === districtId)?.name || user?.region
          : user?.region || 'All India'
      )
      setResult(res.data)
      const source = res.data?.meta?.source === 'ml' ? '🤖 ML model' : '⚙️ Built-in engine'
      toast.success(`Optimal allocation ready! (${source})`, { id: tid })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Optimization failed', { id: tid })
    } finally {
      setLoading(false)
    }
  }

  const presets = [
    { label: '1 Cr',    value: 10_000_000 },
    { label: '10 Cr',   value: 100_000_000 },
    { label: '100 Cr',  value: 1_000_000_000 },
    { label: '1000 Cr', value: 10_000_000_000 },
  ]

  return (
    <div className="card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          Budget Allocation Engine
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Select a real district for ML-powered optimization or use your registered region.
          NSGA-II will compute the ideal sector distribution.
        </p>
      </div>

      {/* District selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
          <MapPin size={13} /> Real District (ML model — optional)
        </label>
        <select
          style={{
            width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '11px 14px', color: districtId ? 'var(--text)' : 'var(--text3)',
            fontFamily: 'var(--font-body)', fontSize: 14, outline: 'none', cursor: 'pointer',
          }}
          value={districtId}
          onChange={e => setDistrict(e.target.value)}
        >
          <option value="">— Use my registered region (or built-in) —</option>
          {ML_DISTRICTS.map(d => (
            <option key={d.id} value={d.id}>{d.name} · Pop: {d.pop}</option>
          ))}
        </select>
        {districtId && (
          <div style={{ marginTop: 4, fontSize: 11, color: 'var(--green-lt)', fontWeight: 600 }}>
            🤖 Will use real ML model with district-specific data
          </div>
        )}
      </div>

      {/* Budget amount */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        {presets.map(p => (
          <button key={p.label} onClick={() => setBudget(p.value)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${budget == p.value ? 'var(--accent-lt)' : 'var(--border)'}`,
              background: budget == p.value ? 'var(--accent-gl)' : 'transparent',
              color: budget == p.value ? 'var(--accent-lt)' : 'var(--text2)',
              transition: 'all 0.15s',
            }}>
            ₹{p.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <IndianRupee size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text3)', pointerEvents: 'none',
          }} />
          <input
            className="input" type="number" style={{ paddingLeft: 34 }}
            placeholder="Enter total budget (e.g. 500000000)"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOptimize()}
          />
        </div>
        <button className="btn-primary" onClick={handleOptimize} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <Sparkles size={15} />
          {loading ? 'Optimizing...' : 'Optimize Budget'}
        </button>
      </div>

      {budget > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
          ₹ {Number(budget).toLocaleString('en-IN')} — {(budget / 10000000).toFixed(2)} Crore
        </p>
      )}
    </div>
  )
}