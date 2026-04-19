import Navbar            from '../components/shared/Navbar'
import BudgetInputForm   from '../components/allocation/BudgetInputForm'
import RegionDatasetPanel from '../components/allocation/RegionDatasetPanel'
import AllocationResults from '../components/allocation/AllocationResults'
import ScenarioSimulator from '../components/allocation/ScenarioSimulator'
import ReportPanel       from '../components/allocation/ReportPanel'
import useAllocationStore from '../store/allocationStore'
import Loader            from '../components/shared/Loader'

export default function AllocationPage() {
  const { loading } = useAllocationStore()

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div className="fade-up" style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            NSGA-II Multi-Objective Optimization Engine
          </p>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800 }}>
            Budget Allocation
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 6 }}>
            Input your region's dataset and total budget. The optimizer computes the ideal sector distribution using urgency scores, coverage gaps, and HDI/Gini objectives.
          </p>
        </div>

        {/* Step 1: Dataset input */}
        <RegionDatasetPanel />

        {/* Step 2: Budget input + optimize */}
        <BudgetInputForm />

        {/* Loading indicator */}
        {loading && <Loader text="Running NSGA-II optimization..." />}

        {/* Step 3: Results — cards, bar chart, radar */}
        <AllocationResults />

        {/* Step 4: Scenario Simulator */}
        <ScenarioSimulator />

        {/* Step 5: Save + Report */}
        <ReportPanel />
      </div>
    </div>
  )
}