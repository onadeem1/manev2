const router = require('express').Router()
module.exports = router

router.use('/auth', require('./auth'))
router.use('/users', require('./users'))
router.use('/places', require('./places'))
router.use('/challenges', require('./challenges'))

router.use((req, res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})
