import { useState } from 'react'
import { optimizeBudget } from '../../services/allocationService'
import useAllocationStore from '../../store/allocationStore'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { Sparkles, IndianRupee } from 'lucide-react'

export default function BudgetInputForm() {
  const [budget, setBudget] = useState('')
  const { user } = useAuthStore()
  const { setResult, setTotalBudget, setRegion, loading, setLoading } = useAllocationStore()

  const handleOptimize = async () => {
    const val = parseFloat(budget)
    if (!val || val <= 0) return toast.error('Enter a valid budget amount')
    if (val < 100000) return toast.error('Minimum budget is ₹1 Lakh')

    setLoading(true)
    const tid = toast.loading('Running NSGA-II optimization...')
    try {
      const res = await optimizeBudget({
        regionId:    user?.regionId || 'default',
        regionName:  user?.region  || 'All India',
        totalBudget: val,
      })
      setTotalBudget(val)
      setRegion(user?.region || 'All India')
      setResult(res.data)
      toast.success('Optimal allocation ready!', { id: tid })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Optimization failed', { id: tid })
    } finally {
      setLoading(false)
    }
  }

  const presets = [
    { label: '1 Cr',   value: 10000000 },
    { label: '10 Cr',  value: 100000000 },
    { label: '100 Cr', value: 1000000000 },
    { label: '1000 Cr',value: 10000000000 },
  ]

  return (
    <div className="card" style={{ padding: 28, marginBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          Budget Allocation Engine
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>
          Enter total budget for <strong style={{ color: 'var(--accent-lt)' }}>{user?.region || 'your region'}</strong>.
          NSGA-II will optimize allocation across all sectors.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
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
            color: 'var(--text3)',
          }} />
          <input
            className="input"
            type="number"
            style={{ paddingLeft: 34 }}
            placeholder="Enter total budget (e.g. 500000000)"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOptimize()}
          />
        </div>
        <button
          className="btn-primary"
          onClick={handleOptimize}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
        >
          <Sparkles size={15} />
          {loading ? 'Optimizing...' : 'Optimize Budget'}
        </button>
      </div>

      {budget > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
          ₹ {Number(budget).toLocaleString('en-IN')} — {(budget/10000000).toFixed(2)} Crore
        </p>
      )}
    </div>
  )
}