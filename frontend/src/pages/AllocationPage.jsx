import Navbar from '../components/shared/Navbar'
import BudgetInputForm from '../components/allocation/BudgetInputForm'
import AllocationResults from '../components/allocation/AllocationResults'
import ReportPanel from '../components/allocation/ReportPanel'
import useAllocationStore from '../store/allocationStore'
import Loader from '../components/shared/Loader'

export default function AllocationPage() {
  const { loading } = useAllocationStore()

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800 }}>Budget Allocation</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>
            Enter your region's total budget. The engine will compute the optimal distribution.
          </p>
        </div>
        <BudgetInputForm />
        {loading && <Loader text="Running NSGA-II optimization..." />}
        <AllocationResults />
        <ReportPanel />
      </div>
    </div>
  )
}