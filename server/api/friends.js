const router = require('express').Router()
const asyncHandler = require('../../server/utils')
const { selfOrAdmin } = require('./filters')
module.exports = router

//load all friends
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const friends = await req.requestedUser.allFriends()
    res.json(friends)
  })
)

//load all friend requests you've received
router.get(
  '/requests',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    const friendRequests = await req.requestedUser.friendRequests()
    res.json(friendRequests)
  })
)

//load all friend requests you've sent
router.get(
  '/requested',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    const friendsRequested = await req.requestedUser.friendsRequested()
    res.json(friendsRequested)
  })
)

//send a friend request
router.post(
  '/add',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    const friendRequest = await req.requestedUser.requestFriend(req.body.friendId)
    res.status(201).json(friendRequest)
  })
)

//confirm a new friend
router.put(
  '/confirm',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    const confirmFriendship = await req.requestedUser.confirmFriend(req.body.friendId)
    res.status(200).json(confirmFriendship)
  })
)

//delete a friend or a friend request, same logic
router.delete(
  '/delete/:friendId',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    await req.requestedUser.deleteFriend(req.params.friendId)
    res.status(204).end()
  })
)

//load potential friends through contacts
router.get(
  '/contacts',
  selfOrAdmin,
  asyncHandler(async (req, res, next) => {
    const potentialFriends = await req.requestedUser.potentialFriendsInContacts(
      req.query.phoneNumbers
    )
    res.json(potentialFriends)
  })
)
