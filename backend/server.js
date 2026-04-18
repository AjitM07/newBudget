const express  = require('express')
const cors     = require('cors')
const dotenv   = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/authRoutes'))
app.use('/api/allocation', require('./routes/allocationRoutes'))
app.use('/api/dashboard',  require('./routes/dashboardRoutes'))
app.use('/api/reports',    require('./routes/reportRoutes'))
app.use('/api/citizen',    require('./routes/citizenRoutes'))

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` })
})

// ── Error handler (must be last, must have 4 params) ──────────────────────
app.use(require('./middleware/errorHandler'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🚀 BudgetOS Backend running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
})