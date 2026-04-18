const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/allocation', require('./routes/allocationRoutes'))
app.use('/api/dashboard', require('./routes/dashboardRoutes'))
app.use('/api/reports', require('./routes/reportRoutes'))
app.use('/api/citizen', require('./routes/citizenRoutes'))

app.use(require('./middleware/errorHandler'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
