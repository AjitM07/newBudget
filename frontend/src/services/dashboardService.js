import api from './api'

export const getSectorNeeds        = (rid)  => api.get(`/dashboard/sector-needs/${rid}`)
export const getKPIs               = (rid)  => api.get(`/dashboard/kpis/${rid}`)
export const updateRegionDataset   = (rid, data) => api.put(`/dashboard/region/${rid}`, data)
export const getPublicData         = (rid)  => api.get(`/citizen/region/${rid}`)