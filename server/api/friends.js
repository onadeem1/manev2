const router = require('express').Router()
const { User, Friendship, Promise, Op } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//load all friends
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const friends = await req.user.getFriends({
      through: {
        where: {
          accepted: true
        }
      }
    })
    res.json(friends)
  })
)

//load all friend requests you've received
router.get(
  '/requests',
  asyncHandler(async (req, res, next) => {
    const friendRequests = await req.user.getFriends({
      through: {
        where: {
          accepted: false,
          originalRequest: false
        }
      }
    })
    res.json(friendRequests)
  })
)

//load all friend requests you've sent
router.get(
  '/requested',
  asyncHandler(async (req, res, next) => {
    const friendRequests = await req.user.getFriends({
      through: {
        where: {
          accepted: false,
          originalRequest: true
        }
      }
    })
    res.json(friendRequests)
  })
)

//send a friend request
router.post(
  '/add',
  asyncHandler(async (req, res, next) => {
    const friend = await User.findById(req.body.friendId)
    const userFriendRequest = await req.user.addFriend(friend, {
      through: { originalRequest: true }
    })
    const friendAddUser = await friend.addFriend(req.user)
    res.status(201).json([userFriendRequest[0], friendAddUser[0]])
  })
)

//confirm a new friend
router.put(
  '/confirm',
  asyncHandler(async (req, res, next) => {
    const confirmFriendship = await Friendship.update(
      { accepted: true },
      {
        returning: true,
        where: {
          [Op.or]: [
            { userId: req.user.id, friendId: +req.body.friendId },
            { userId: +req.body.friendId, friendId: req.user.id }
          ]
        }
      }
    )
    res.status(200).json(confirmFriendship)
  })
)

//delete a friend
router.delete(
  '/delete/:friendId',
  asyncHandler(async (req, res, next) => {
    const friend = await User.findById(req.params.friendId)
    await req.user.removeFriend(friend)
    await friend.removeFriend(req.user)
    res.status(204).end()
  })
)

//load potential friends through contacts
router.get(
  '/contacts',
  asyncHandler(async (req, res, next) => {
    const phoneNumbers = req.query.phoneNumbers
    const users = await User.findAll({
      where: {
        phone: { [Op.in]: phoneNumbers }
      }
    })
    //we are looking for users who are not already friends
    const potentialFriends = await Promise.filter(users, user =>
      req.user.hasFriend(user).then(bool => !bool)
    )
    res.json(potentialFriends)
  })
)
