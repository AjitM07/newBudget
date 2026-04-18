import { useEffect, useState } from 'react'
import Navbar from '../components/shared/Navbar'
import { getReports, publishReport, emailReport } from '../services/reportService'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { FileText, Globe, Mail, ChevronDown, ChevronUp } from 'lucide-react'

function ReportCard({ report, onPublish, onEmail }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card" style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-gl)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <FileText size={18} color="var(--accent-lt)" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{report.title}</h3>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
              {new Date(report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              &nbsp;·&nbsp; FY {report.fiscalYear}
              &nbsp;·&nbsp; ₹{report.totalBudget ? (report.totalBudget/1e7).toFixed(1) : '?'} Cr
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: report.isPublic ? 'var(--green-gl)' : 'var(--yellow-gl)',
            color: report.isPublic ? 'var(--green-lt)' : 'var(--yellow-lt)',
          }}>
            {report.isPublic ? 'Public' : 'Draft'}
          </span>
          {!report.isPublic && (
            <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', gap: 6 }}
              onClick={() => onPublish(report._id)}>
              <Globe size={12} /> Publish
            </button>
          )}
          <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', display: 'flex', gap: 6 }}
            onClick={() => onEmail(report._id)}>
            <Mail size={12} /> Email
          </button>
          <button onClick={() => setExpanded(!expanded)} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '6px 10px', cursor: 'pointer', color: 'var(--text2)',
          }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && report.sectorImpacts?.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--text2)' }}>Sector Breakdown</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {report.sectorImpacts.map(s => (
              <div key={s.sector} style={{ background: 'var(--bg2)', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{s.sector}</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent-lt)' }}>{(s.allocated * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 8 }}>
                  <div style={{ height: '100%', background: 'var(--accent-lt)', borderRadius: 2, width: `${s.allocated * 100}%` }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>{s.shapExplanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportPage() {
  const { user } = useAuthStore()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    getReports(user?.regionId || 'default')
      .then(r => setReports(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handlePublish = async (id) => {
    try { await publishReport(id); toast.success('Report published to citizens'); load() }
    catch { toast.error('Publish failed') }
  }
  const handleEmail = async (id) => {
    try { await emailReport(id); toast.success('Report emailed!') }
    catch { toast.error('Email failed') }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800 }}>Reports</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>
            Generated allocation reports with explainable recommendations
          </p>
        </div>
        {loading ? (
          <div>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 16, borderRadius: 16 }} />)}</div>
        ) : reports.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <FileText size={40} color="var(--text3)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text2)', fontSize: 15 }}>No reports yet.</p>
            <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 6 }}>Run an allocation to generate your first report.</p>
          </div>
        ) : (
          reports.map(r => <ReportCard key={r._id} report={r} onPublish={handlePublish} onEmail={handleEmail} />)
        )}
      </div>
    </div>
  )
}