import api from './api'

export const generateReport  = (data) => api.post('/reports/generate', data)
export const getReports      = (rid)  => api.get(`/reports/region/${rid}`)
export const getReportById   = (id)   => api.get(`/reports/${id}`)
export const publishReport   = (id)   => api.patch(`/reports/${id}/publish`)
export const emailReport     = (id)   => api.post(`/reports/${id}/email`)