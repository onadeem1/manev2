const router = require('express').Router()
const asyncHandler = require('../../server/utils')
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
  asyncHandler(async (req, res, next) => {
    const friendRequests = await req.requestedUser.friendRequests()
    res.json(friendRequests)
  })
)

//load all friend requests you've sent
router.get(
  '/requested',
  asyncHandler(async (req, res, next) => {
    const friendsRequested = await req.requestedUser.friendsRequested()
    res.json(friendsRequested)
  })
)

//send a friend request
router.post(
  '/add',
  asyncHandler(async (req, res, next) => {
    const friendRequest = await req.requestedUser.requestFriend(req.body.friendId)
    res.status(201).json(friendRequest)
  })
)

//confirm a new friend
router.put(
  '/confirm',
  asyncHandler(async (req, res, next) => {
    const confirmFriendship = await req.requestedUser.confirmFriend(req.body.friendId)
    res.status(200).json(confirmFriendship)
  })
)

//delete a friend or a friend request, same logic
router.delete(
  '/delete/:friendId',
  asyncHandler(async (req, res, next) => {
    await req.requestedUser.deleteFriend(req.params.friendId)
    res.status(204).end()
  })
)

//load potential friends through contacts
router.get(
  '/contacts',
  asyncHandler(async (req, res, next) => {
    const potentialFriends = await req.requestedUser.potentialFriendsInContacts(
      req.query.phoneNumbers
    )
    res.json(potentialFriends)
  })
)
