import { useState } from 'react'
import { generateReport, emailReport } from '../../services/reportService'
import { saveAllocation } from '../../services/allocationService'
import useAllocationStore from '../../store/allocationStore'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { FileText, Mail, Save, ChevronDown, ChevronUp } from 'lucide-react'

// ── Color map (self-contained, no cross-file dependency) ──────────────────
const SECTOR_COLORS = {
  Healthcare:     'var(--red-lt)',
  Education:      'var(--accent-lt)',
  Infrastructure: 'var(--yellow-lt)',
  Agriculture:    'var(--green-lt)',
  Welfare:        'var(--purple-lt)',
}

export default function ReportPanel() {
  const {
    sectorAnalysis, totalBudget, allocations,
    paretoFront, shapValues,
  } = useAllocationStore()
  const { user }   = useAuthStore()
  const [reportId, setReportId] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [saving,   setSaving]   = useState(false)

  // Nothing to show until an optimization has been run
  if (!sectorAnalysis || sectorAnalysis.length === 0) return null

  // ── Save allocation + generate report ──────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAllocation({
        regionId:    user?.regionId || 'default',
        totalBudget,
        allocations,
        paretoFront,
        shapValues,
      })

      const res = await generateReport({
        regionId:    user?.regionId || 'default',
        regionName:  user?.region   || 'All India',
        totalBudget,
        allocations,
        sectorImpacts: sectorAnalysis.map(s => ({
          sector:          s.sector,
          allocated:        s.fraction,
          allocatedAmount:  s.fraction * totalBudget,
          urgencyScore:     s.urgencyScore,
          projectedOutcome: s.projectedOutcome || '',
          shapExplanation:  s.explanation      || '',
        })),
        paretoStrategy: paretoFront?.[0] || {},
        type: 'allocation',
      })

      setReportId(res.data.report._id)
      toast.success('Allocation saved & report generated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Email existing report ───────────────────────────────────────────────
  const handleEmail = async () => {
    if (!reportId) return toast.error('Save the report first')
    try {
      await emailReport(reportId)
      toast.success('Report emailed to ' + user?.email)
    } catch {
      toast.error('Email failed')
    }
  }

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      {/* ── Header row ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 700 }}>
            Report &amp; Export
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            Save this allocation and generate a full explainable report
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn-ghost"
            onClick={handleEmail}
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}
          >
            <Mail size={14} /> Email Report
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save & Generate Report'}
          </button>
        </div>
      </div>

      {/* ── Success badge ── */}
      {reportId && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 20, marginBottom: 16,
          background: 'var(--green-gl)', color: 'var(--green-lt)',
          fontSize: 12, fontWeight: 600,
        }}>
          <FileText size={12} /> Report saved — ID: {reportId.slice(-8)}
        </div>
      )}

      {/* ── Expand toggle ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', background: 'var(--bg2)',
          border: '1px solid var(--border)', borderRadius: 10,
          padding: '10px 14px', cursor: 'pointer',
          color: 'var(--text2)', fontSize: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 600 }}>View Allocation Summary Table</span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* ── Summary table ── */}
      {expanded && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  'Sector', 'Allocation %', 'Amount (₹ Cr)',
                  'Urgency', 'Priority', 'Change', 'Key Reason',
                ].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left',
                    color: 'var(--text3)', fontWeight: 600, fontSize: 11,
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectorAnalysis.map((s, i) => {
                const color = SECTOR_COLORS[s.sector] || 'var(--accent-lt)'
                return (
                  <tr
                    key={s.sector}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 ? 'var(--bg2)' : 'transparent',
                    }}
                  >
                    {/* Sector */}
                    <td style={{
                      padding: '10px 12px', fontWeight: 700,
                      fontFamily: 'var(--font-head)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: color, display: 'inline-block', flexShrink: 0,
                      }} />
                      {s.sector}
                    </td>

                    {/* Allocation % */}
                    <td style={{ padding: '10px 12px', fontWeight: 700, color }}>
                      {(s.fraction * 100).toFixed(1)}%
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '10px 12px' }}>
                      ₹{(s.fraction * totalBudget / 1e7).toFixed(2)} Cr
                    </td>

                    {/* Urgency */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        color: s.urgencyScore > 70
                          ? 'var(--red-lt)'
                          : s.urgencyScore > 45
                          ? 'var(--yellow-lt)'
                          : 'var(--green-lt)',
                        fontWeight: 600,
                      }}>
                        {s.urgencyScore}/100
                      </span>
                    </td>

                    {/* Priority */}
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20,
                        fontSize: 10, fontWeight: 700,
                        background:
                          s.priority === 'HIGH'   ? 'var(--red-gl)'
                          : s.priority === 'MEDIUM' ? 'var(--yellow-gl)'
                          : 'var(--green-gl)',
                        color:
                          s.priority === 'HIGH'   ? 'var(--red-lt)'
                          : s.priority === 'MEDIUM' ? 'var(--yellow-lt)'
                          : 'var(--green-lt)',
                      }}>
                        {s.priority}
                      </span>
                    </td>

                    {/* Change */}
                    <td style={{
                      padding: '10px 12px', fontWeight: 600,
                      color:
                        s.changeFromPrev > 0.5  ? 'var(--green-lt)'
                        : s.changeFromPrev < -0.5 ? 'var(--red-lt)'
                        : 'var(--text3)',
                    }}>
                      {Math.abs(s.changeFromPrev) < 0.5
                        ? '—'
                        : `${s.changeFromPrev > 0 ? '+' : ''}${s.changeFromPrev.toFixed(1)}%`}
                    </td>

                    {/* Key reason */}
                    <td style={{
                      padding: '10px 12px', color: 'var(--text2)',
                      fontSize: 12, maxWidth: 220,
                    }}>
                      {s.shortReason || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>

            {/* ── Totals footer ── */}
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>Total</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent-lt)' }}>
                  {sectorAnalysis
                    .reduce((acc, s) => acc + s.fraction * 100, 0)
                    .toFixed(1)}%
                </td>
                <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                  ₹{(totalBudget / 1e7).toFixed(2)} Cr
                </td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
