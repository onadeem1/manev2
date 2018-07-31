const router = require('express').Router()
const { Place, User } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//TODO: add admin privelege options to necessary routes

//get all places admin route? includes all info for each place
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.getAllPlaces()
    res.json(allPlaces)
  })
)

//get all places w/ friend recommendations
router.get(
  '/friends',
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(1) //TODO: replace with req.user
    const allPlaces = await Place.getPlacesWithFriendRecs(user)
    res.json(allPlaces)
  })
)

//get a place by googleid w/ friend recs
router.get(
  '/google/:googleId',
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(1) //TODO: replace with req.user
    const place = await Place.getPlaceWithFriendRecs(user, { googleId: req.params.googleId })
    res.json(place)
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

//get place
router.get('/:id', (req, res, next) => {
  res.json(req.place)
})

//get place w/ friend recs
router.get(
  '/:id/friends',
  asyncHandler(async (req, res, next) => {
    const place = await Place.getPlaceWithFriendRecs(req.user, { id: req.place.id })
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
