const router = require('express').Router()
const { Recommendation, Feed } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//TODO: add admin privelege options to necessary routes
//TODO: Set limits, offsets etc? will see in future

//get all Recs w/ full info
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const allRecommendations = await Recommendation.getAllRecommendations()
    res.json(allRecommendations)
  })
)

//get all complete recs
router.get(
  '/complete',
  asyncHandler(async (req, res, next) => {
    const recommendations = await Recommendation.getAllRecommendations({
      where: { complete: true }
    })
    res.json(recommendations)
  })
)

//get all incomplete recs, these are accepted challenges
router.get(
  '/incomplete',
  asyncHandler(async (req, res, next) => {
    const recommendations = await Recommendation.getAllRecommendations({
      where: { complete: false }
    })
    res.json(recommendations)
  })
)

//Feed on read approach
router.get(
  '/all/friends',
  asyncHandler(async (req, res, next) => {
    const recommendations = await Recommendation.getFriendsRecommendations(req.user)
    res.json(recommendations)
  })
)

//get all complete recs from friends
router.get(
  '/complete/friends',
  asyncHandler(async (req, res, next) => {
    const recommendations = await Recommendation.getFriendsRecommendations(req.user, {
      where: { complete: true }
    })
    res.json(recommendations)
  })
)

//get all incomplete recs from friends, these are accepted challenges
router.get(
  '/incomplete/friends',
  asyncHandler(async (req, res, next) => {
    const recommendations = await Recommendation.getFriendsRecommendations(req.user, {
      where: { complete: false }
    })
    res.json(recommendations)
  })
)

router.post(
  //pass in req.body obj as { place: placeObj, challenge: challengeObj, recommendation: recommendationObj}
  '/',
  asyncHandler(async (req, res, next) => {
    const recommendation = await Recommendation.createRecommendation(req.body)
    res.status(201).json(recommendation)
    Feed.writeFeed(req.user, recommendation.id) //TODO: should we write after sending the response?
  })
)

//accept challenge
router.post(
  '/accept',
  asyncHandler(async (req, res, next) => {
    const acceptChallenge = await Recommendation.create(req.body)
    res.status(201).json(acceptChallenge)
    Feed.writeFeed(req.user, acceptChallenge.id) //TODO: should we write after sending the response?
  })
)

//param for all recommendation by id requests
router.param(
  'id',
  asyncHandler(async (req, res, next, id) => {
    const currentRecommendation = await Recommendation.findById(id)
    if (!currentRecommendation) {
      const err = Error('Challenge not found')
      err.status = 404
      throw err
    } else {
      req.recommendation = currentRecommendation
      next()
    }
  })
)

//return full recommendation info
router.get('/:id', async (req, res, next) => {
  const recommendation = await Recommendation.getRecommendation(req.recommendation.id)
  res.json(recommendation)
})

//complete the challenge
router.put(
  '/:id/complete',
  asyncHandler(async (req, res, next) => {
    const completeRecommendation = await req.recommendation.update(req.body)
    res.status(200).json(completeRecommendation)
    Feed.writeFeed(req.user, completeRecommendation.id) //TODO: should we write after sending the response?
  })
)

//any non-completing the challenge update, ex. updating rating etc.
router.put(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const updatedRecommendation = await req.recommendation.update(req.body)
    res.status(200).json(updatedRecommendation)
  })
)

//delete recommendation //TODO: add userOrSelf admin func
router.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    await req.challenge.destroy()
    res.status(204).end()
  })
)
