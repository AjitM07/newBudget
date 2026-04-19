import api from './api'

export const registerAdmin   = (data) => api.post('/auth/admin/register', data)
export const verifyOTP       = (data) => api.post('/auth/verify-otp', data)
export const loginAdmin      = (data) => api.post('/auth/admin/login', data)
export const loginCitizen      = (data) => api.post('/auth/citizen/login', data)
export const registerCitizen   = (data) => api.post('/auth/citizen/register', data)
export const getMe           = ()     => api.get('/auth/me')