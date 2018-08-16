const router = require('express').Router()
const { User, Feed } = require('../../database')
const asyncHandler = require('../../server/utils')
const { mustBeAdmin, selfOrAdmin } = require('./filters')
module.exports = router

//get all users
router.get(
  '/',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    const allUsers = await User.findAll()
    res.json(allUsers)
  })
)

//get all users with all their created/accepted/completed challenges & fav places ADMIN
router.get(
  '/full',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    const allUsers = await User.allUsersFull()
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

// get user on request object for future id specific requests
router.param(
  'id',
  asyncHandler(async (req, res, next, id) => {
    const currentUser = await User.findById(id)
    if (!currentUser) {
      const err = Error('User not found')
      err.status = 404
      throw err
    } else {
      req.requestedUser = currentUser //avoid clash w/ req.user from passport
      next()
    }
  })
)

//get basic user :)
router.get(
  '/:id',
  asyncHandler((req, res, next) => {
    res.json(req.requestedUser)
  })
)

//get user - includes challenges created, accepted, completed & fav places!
router.get(
  '/:id/full',
  asyncHandler(async (req, res, next) => {
    const user = await req.requestedUser.fullUser()
    res.json(user)
  })
)

router.put(
  '/:id',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    //for pw changes, can add two field check when changing to new pw also
    if (req.body.oldPassword) {
      if (!req.requestedUser.correctPassword(req.body.oldPassword))
        res.status(401).send('Wrong password ')
    }
    //check against anyone changing themselves to an admin
    if (req.body.isAdmin) {
      if (!req.user.isAdmin) {
        return res.status(401).send('What you doing yo? You must be an admin!')
      }
    }
    const updatedUser = await req.requestedUser.update(req.body)
    res.status(200).json(updatedUser)
  })
)

//delete user
router.delete(
  '/:id',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    await req.requestedUser.destroy()
    res.status(204).end()
  })
)

//get the challenges the user has accepted aka incomplete recs
router.get(
  '/:id/challenges/accepted',
  asyncHandler(async (req, res, next) => {
    const acceptedChallenges = await req.requestedUser.acceptedChallenges()
    res.json(acceptedChallenges)
  })
)

//get the challenges the user has completed aka complete recs
router.get(
  '/:id/challenges/completed',
  asyncHandler(async (req, res, next) => {
    const completeChallenges = await req.requestedUser.completedChallenges()
    res.json(completeChallenges)
  })
)

//get the challenges the user has created
router.get(
  '/:id/challenges/created',
  asyncHandler(async (req, res, next) => {
    const createdChallenges = await req.requestedUser.createdChallenges()
    res.json(createdChallenges)
  })
)

//get user's saved favorite places
router.get(
  '/:id/favoritePlaces',
  asyncHandler(async (req, res, next) => {
    const favoritePlaces = await req.requestedUser.getFavoritePlaces()
    res.json(favoritePlaces)
  })
)

//add a favorite place
router.post(
  '/:id/favoritePlaces',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    const addFavoritePlace = await req.requestedUser.addFavoritePlace(req.body.place)
    res.status(201).json(addFavoritePlace)
  })
)

//delete a favorite place
router.post(
  '/:id/favoritePlaces/:placeId',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    await req.requestedUser.deleteFavoritePlace(req.params.placeId)
    res.status(204).end()
  })
)

//load the user's feed
router.get(
  '/:id/feed',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    const feed = await Feed.loadFeed(req.requestedUser)
    res.json(feed)
  })
)

//route user's friend specific actions to friends router
router.use('/:id/friends', require('./friends'))
