const router = require('express').Router()
const { Place, User } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//TODO: change route names when admin is split out so its easier
//TODO: most of teh all routes are admin and for our own analysis
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.allPlaces()
    res.json(allPlaces)
  })
)

router.get(
  '/sorted',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.allPlacesSorted()
    res.json(allPlaces)
  })
)

router.get(
  '/created',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.allPlacesCreated()
    res.json(allPlaces)
  })
)

router.get(
  '/accepted',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.allPlacesAccepted()
    res.json(allPlaces)
  })
)

router.get(
  '/completed',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.allPlacesCompleted()
    res.json(allPlaces)
  })
)

/* Use the following 4 routes for suggested list */

//get all places w/ friends created challenges
router.get(
  '/friends/created',
  asyncHandler(async (req, res, next) => {
    const friendsCreatedPlaces = await Place.friendsCreated(req.user)
    res.json(friendsCreatedPlaces)
  })
)

//get all places w/ friends accepted challenges
router.get(
  '/friends/accepted',
  asyncHandler(async (req, res, next) => {
    req.user = await User.findById(1)
    const friendsAcceptedPlaces = await Place.friendsAccepted(req.user)
    res.json(friendsAcceptedPlaces)
  })
)

//get all places w/ friends completed challenges
router.get(
  '/friends/completed',
  asyncHandler(async (req, res, next) => {
    req.user = await User.findById(1)
    const friendsCompletedPlaces = await Place.friendsCompleted(req.user)
    res.json(friendsCompletedPlaces)
  })
)

//get all places w/ completed(created where creator id matches user id) & accepted challenges
router.get(
  '/friends/all',
  asyncHandler(async (req, res, next) => {
    req.user = await User.findById(1)
    const friendsAllPlaces = await Place.friendsPlaces(req.user)
    res.json(friendsAllPlaces)
  })
)

router.get(
  '/friends/all/sorted',
  asyncHandler(async (req, res, next) => {
    req.user = await User.findById(1)
    const friendsAllPlaces = await Place.friendsPlacesSorted(req.user)
    res.json(friendsAllPlaces)
  })
)

//create new place
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const newPlace = await Place.create(req.body)
    res.status(201).json(newPlace)
  })
)

//get place on request object for future id specific requests
router.param(
  'id',
  asyncHandler(async (req, res, next, id) => {
    const currentPlace = await Place.findById(id)
    if (!currentPlace) {
      const err = Error('Place not found')
      err.status = 404
      throw err
    } else {
      req.place = currentPlace
      next()
    }
  })
)

//get place basic :)
router.get('/:id', (req, res, next) => {
  res.json(req.place)
})

//get single place w/ all created, completed, accepted challenges by friends
router.get(
  '/:id/full',
  asyncHandler(async (req, res, next) => {
    req.user = await User.findById(1)
    const place = await Place.fullPlace({ id: req.params.id })
    res.json(place)
  })
)

//get a place by googleid w/ friend recs
router.get(
  '/google/:googleId',
  asyncHandler(async (req, res, next) => {
    const place = await Place.fullPlace({ googleId: req.params.googleId })
    res.json(place)
  })
)

router.get(
  '/:id/full/friends',
  asyncHandler(async (req, res, next) => {
    req.user = await User.findById(1)
    const place = await Place.fullPlaceFriends(req.user, { id: req.params.id })
    res.json(place)
  })
)

//get a place by googleid w/ friend recs
router.get(
  '/google/:googleId/friends',
  asyncHandler(async (req, res, next) => {
    const place = await Place.fullPlaceFriends(req.user, { googleId: req.params.googleId })
    res.json(place)
  })
)

//update place
router.put(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const updatedPlace = await req.place.update(req.body)
    res.status(200).json(updatedPlace)
  })
)

//delete place
router.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    await req.place.destroy()
    res.status(204).end()
  })
)
