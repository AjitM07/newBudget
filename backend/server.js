const express    = require('express')
const cors       = require('cors')
const dotenv     = require('dotenv')
const connectDB  = require('./config/db')

dotenv.config()
connectDB()

const app = express()

// ── 1. Body parsing — before everything ───────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── 2. CORS ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// ── 3. Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/authRoutes'))
app.use('/api/allocation', require('./routes/allocationRoutes'))
app.use('/api/dashboard',  require('./routes/dashboardRoutes'))
app.use('/api/reports',    require('./routes/reportRoutes'))
app.use('/api/citizen',    require('./routes/citizenRoutes'))

// ── 4. Health check ────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

// ── 5. 404 ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `${req.method} ${req.url} not found` })
})

// ── 6. Global error handler — 4 params required by Express ────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(err.status || 500).json({ message: err.message || 'Server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
