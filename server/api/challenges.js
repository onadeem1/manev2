const router = require('express').Router()
const { Challenge } = require('../../database')
const asyncHandler = require('../../server/utils')
const { mustBeAdmin, selfOrAdminChallenge } = require('./filters')
module.exports = router

//get all challenges w/ all info
router.get(
  '/',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    const allChallenges = await Challenge.allChallenges()
    res.json(allChallenges)
  })
)

//get all challenges w/ complete/accepted/created posts
router.get(
  '/sorted',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    const allChallenges = await Challenge.allChallengesSorted()
    res.json(allChallenges)
  })
)

//get all challenges w/ created posts
router.get(
  '/created',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    const createdChallenges = await Challenge.allChallengesCreated()
    res.json(createdChallenges)
  })
)

//get all challenges w/ accepted posts
router.get(
  '/accepted',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    const acceptedChallenges = await Challenge.allChallengesAccepted()
    res.json(acceptedChallenges)
  })
)

//get all challenges w/ completed posts
router.get(
  '/completed',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    const completedChallenges = await Challenge.allChallengesCompleted()
    res.json(completedChallenges)
  })
)

//get all challenges w/ activity by friends
router.get(
  '/friends',
  asyncHandler(async (req, res, next) => {
    const friendsChallenges = await Challenge.friends(req.user)
    res.json(friendsChallenges)
  })
)

//get all challenges w/ activity by friends sorted created/accepted/completed
router.get(
  '/friends/sorted',
  asyncHandler(async (req, res, next) => {
    const friendsChallenges = await Challenge.friendsSorted(req.user)
    res.json(friendsChallenges)
  })
)

//get all challenges created by friends
router.get(
  '/friends/created',
  asyncHandler(async (req, res, next) => {
    const friendsCreated = await Challenge.friendsCreated(req.user)
    res.json(friendsCreated)
  })
)

//get all challenges accepted by friends, useful to show friend activity?
router.get(
  '/friends/accepted',
  asyncHandler(async (req, res, next) => {
    const friendsAccepted = await Challenge.friendsAccepted(req.user)
    res.json(friendsAccepted)
  })
)

//get all completed accepted by friends, useful to show friend activity?
router.get(
  '/friends/completed',
  asyncHandler(async (req, res, next) => {
    const friendsCompleted = await Challenge.friendsCompleted(req.user)
    res.json(friendsCompleted)
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

//return full challenge info w/ all accepted & completed posts
router.get('/:id', async (req, res, next) => {
  const challenge = await Challenge.fullChallengeInfo(req.params.id)
  res.json(challenge)
})

//return full challenge info w/ all accepted & completed posts by friends
router.get('/:id/friends', async (req, res, next) => {
  const challenge = await Challenge.fullChallengeFriendsInfo(req.params.id, req.user)
  res.json(challenge)
})

//update challenge
router.put(
  '/:id',
  selfOrAdminChallenge,
  asyncHandler(async (req, res, next) => {
    const updatedChallenge = await req.challenge.update(req.body)
    res.status(200).json(updatedChallenge)
  })
)

//delete challenge, only allow admin delete for now
router.delete(
  '/:id',
  mustBeAdmin,
  asyncHandler(async (req, res, next) => {
    await req.challenge.destroy()
    res.status(204).end()
  })
)
