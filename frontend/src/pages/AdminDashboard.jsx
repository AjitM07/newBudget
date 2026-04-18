import Navbar from '../components/shared/Navbar'
import KPICards from '../components/dashboard/KPICards'
import SectorUrgencyChart from '../components/dashboard/SectorUrgencyChart'
import AllocationHistory from '../components/dashboard/AllocationHistory'
import useAuthStore from '../store/authStore'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const regionId = user?.regionId || 'default'

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            FY 2024-25 — {user?.regionType || 'Region'}
          </p>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, lineHeight: 1.2 }}>
            {user?.region || 'All India'} Dashboard
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>
            Sector need analysis and budget performance overview
          </p>
        </div>

        <KPICards regionId={regionId} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <SectorUrgencyChart regionId={regionId} />
          <AllocationHistory regionId={regionId} />
        </div>
      </div>
    </div>
  )
}