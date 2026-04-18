// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message)

  const status  = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'

  res.status(status).json({ message })
}

module.exports = errorHandler