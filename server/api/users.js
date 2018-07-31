const router = require('express').Router()
const { User } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//TODO: add admin privelege options to necessary routes

//get all users
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const allUsers = await User.findAll()
    res.json(allUsers)
  })
)

//create new user
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const newUser = await User.create(req.body)
    res.status(201).json(newUser)
  })
)

//get user on request object for future id specific requests
router.param(
  'id',
  asyncHandler(async (req, res, next, id) => {
    const currentUser = await User.findById(id)
    if (!currentUser) {
      const err = Error('User not found')
      err.status = 404
      throw err
    } else {
      req.requestedUser = currentUser
      next()
    }
  })
)

//get user
router.get('/:id', (req, res, next) => {
  res.json(req.requestedUser)
})

//update user
router.put(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const updatedUser = await req.requestedUser.update(req.body)
    res.status(200).json(updatedUser)
  })
)

//delete user
router.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    await req.requestedUser.destroy()
    res.status(204).end()
  })
)

//route user's friend specific actions to friends router
router.use('/:id/friends', require('./friends'))
