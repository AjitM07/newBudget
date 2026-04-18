const express   = require('express')
const cors      = require('cors')
const dotenv    = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

// ── Body parsing — MUST be before any routes ───────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

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

// ── 404 ────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` })
})

// ── Error handler — must have exactly 4 params ────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message)
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n BudgetOS Backend on http://localhost:${PORT}`)
  console.log(`   MONGO_URI : ${process.env.MONGO_URI ? 'loaded' : 'MISSING'}`)
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'loaded' : 'MISSING'}`)
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER || 'not set'}`)
})
