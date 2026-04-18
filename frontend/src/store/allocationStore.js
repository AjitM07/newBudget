import { create } from 'zustand'

const useAllocationStore = create((set) => ({
  totalBudget:      0,
  region:           null,
  allocations:      {},   // { Healthcare: 0.23, ... }
  sectorAnalysis:   [],   // full ML output per sector
  paretoFront:      [],
  shapValues:       {},
  report:           null,
  loading:          false,

  setLoading:       (v) => set({ loading: v }),
  setTotalBudget:   (v) => set({ totalBudget: v }),
  setRegion:        (v) => set({ region: v }),
  setResult:        (data) => set({
    allocations:    data.allocations,
    sectorAnalysis: data.sectorAnalysis,
    paretoFront:    data.paretoFront    || [],
    shapValues:     data.shapValues     || {},
    report:         data.report         || null,
  }),
  reset: () => set({
    totalBudget: 0, region: null, allocations: {}, sectorAnalysis: [],
    paretoFront: [], shapValues: {}, report: null,
  }),
}))
export default useAllocationStore