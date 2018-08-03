const router = require('express').Router()
const { Place } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//get all places admin route? includes all info for each place
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.getAllPlaces()
    res.json(allPlaces)
  })
)

//get all places w/ friend recommendations - suggested list of places to try?
router.get(
  '/complete',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.getPlacesWithFriendRecs(req.user, true)
    res.json(allPlaces)
  })
)

//get all places w/ accepted challenges - suggested list of places to try w/ a friend
router.get(
  '/accepted',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.getPlacesWithFriendRecs(req.user, false)
    res.json(allPlaces)
  })
)

//get all places w/ complete & accepted challenges - suggested list of places to try w/ a friend
router.get(
  '/all',
  asyncHandler(async (req, res, next) => {
    const allPlaces = await Place.getPlacesWithFriendRecs(req.user, undefined)
    res.json(allPlaces)
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

//get a place by googleid w/ friend recs
router.get(
  '/google/:googleId',
  asyncHandler(async (req, res, next) => {
    const place = await Place.getPlaceWithFriendRecs(req.user, { googleId: req.params.googleId })
    res.json(place)
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

//get place w/ complete friend recs
router.get(
  '/:id/complete',
  asyncHandler(async (req, res, next) => {
    const place = await Place.getPlaceWithFriendRecs(req.user, { id: req.place.id }, true)
    res.json(place)
  })
)

//get place w/ accepted challenges
router.get(
  '/:id/accepted',
  asyncHandler(async (req, res, next) => {
    const place = await Place.getPlaceWithFriendRecs(req.user, { id: req.place.id }, false)
    res.json(place)
  })
)
//get place w/ all info accepted & completed
router.get(
  '/:id/all',
  asyncHandler(async (req, res, next) => {
    const place = await Place.getPlaceWithFriendRecs(req.user, { id: req.place.id }, undefined)
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
