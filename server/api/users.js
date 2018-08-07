const router = require('express').Router()
const { User, Feed } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

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

//get user include challenges & recs?
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

//get the challenges the user has created
router.get(
  '/:id/challenges/created',
  asyncHandler(async (req, res, next) => {
    const createdChallenges = await req.requestedUser.getCreatedChallenges()
    res.json(createdChallenges)
  })
)

//get the challenges the user has accepted aka incomplete recs
router.get(
  '/:id/challenges/accepted',
  asyncHandler(async (req, res, next) => {
    const acceptedChallenges = await req.requestedUser.getAcceptedChallenges()
    res.json(acceptedChallenges)
  })
)

//get the challenges the user has completed aka complete recs
router.get(
  '/:id/challenges/complete',
  asyncHandler(async (req, res, next) => {
    const completeChallenges = await req.requestedUser.getCompleteChallenges()
    res.json(completeChallenges)
  })
)

//get user's saved favorite places
router.get('/:id/favoritePlaces', async (req, res, next) => {
  const favoritePlaces = await req.requestedUser.getFavoritePlaces()
  res.json(favoritePlaces)
})

//add a favorite place
router.post('/:id/favoritePlaces', async(req, res, next) => {
  const addFavoritePlace = await req.requestedUser.addFavoritePlace(req.body.place)
  res.status(201).json(addFavoritePlace)
})

//load the user's feed
router.get(
  '/:id/feed',
  asyncHandler(async (req, res, next) => {
    const feed = await Feed.loadFeed(req.requestedUser)
    res.json(feed)
  })
)

//route user's friend specific actions to friends router
router.use('/:id/friends', require('./friends'))
