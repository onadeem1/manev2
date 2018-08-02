const router = require('express').Router()
const { Challenge } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//TODO: add admin privelege options to necessary routes

//get all challenges w/ complete & incomplete recs - ADMIN ROUTE
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const allChallenges = await Challenge.getAllChallenges()
    res.json(allChallenges)
  })
)

//get all challenges w/ recs & users who have completed the challenge - ADMIN ROUTE
router.get(
  '/complete',
  asyncHandler(async (req, res, next) => {
    const completedChallenges = await Challenge.getAllChallenges(true)
    res.json(completedChallenges)
  })
)
//get all challenges w/ recs & users who have accepted the challenge - ADMIN ROUTE
router.get(
  '/incomplete',
  asyncHandler(async (req, res, next) => {
    const incompleteChallenges = await Challenge.getAllChallenges(false)
    res.json(incompleteChallenges)
  })
)

//get all challenges w/ complete recs by friends, can be used to show suggestions/activity
router.get(
  '/complete/friends',
  asyncHandler(async (req, res, next) => {
    const completedChallenges = await Challenge.getFriendsChallenges(true, req.user)
    res.json(completedChallenges)
  })
)

//get all challenges w/ accepted recs by friends, can be used to show suggestions and/or encourage people to try things together
router.get(
  '/incomplete/friends',
  asyncHandler(async (req, res, next) => {
    const incompleteChallenges = await Challenge.getFriendsChallenges(false, req.user)
    res.json(incompleteChallenges)
  })
)

//create a new challenge
router.post(
  '/',
  asyncHandler(async (req, res, next) => {
    const newChallenge = await Challenge.create(req.body)
    res.status(201).json(newChallenge)
  })
)

//param for all challenge by id requests
router.param(
  'id',
  asyncHandler(async (req, res, next, id) => {
    const currentChallenge = await Challenge.findById(id)
    if (!currentChallenge) {
      const err = Error('Challenge not found')
      err.status = 404
      throw err
    } else {
      req.challenge = currentChallenge
      next()
    }
  })
)

//return full challenge info including acceptees & completed by friends
router.get('/:id', async (req, res, next) => {
  const challenge = await Challenge.getChallenge(req.user, req.challenge.id)
  res.json(challenge)
})

//update challenge
router.put(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const updatedChallenge = await req.challenge.update(req.body)
    res.status(200).json(updatedChallenge)
  })
)

//delete challenge TODO: how to approach deleting challenge logic?
router.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    await req.challenge.destroy()
    res.status(204).end()
  })
)
