import api from './api'

export const optimizeBudget  = (data) => api.post('/allocation/optimize', data)
export const simulateChange  = (data) => api.post('/allocation/simulate', data)
export const saveAllocation  = (data) => api.post('/allocation/save', data)
export const getHistory      = (rid)  => api.get(`/allocation/history/${rid}`)