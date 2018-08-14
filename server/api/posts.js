const router = require('express').Router()
const { Post, Feed } = require('../../database')
const asyncHandler = require('../../server/utils')
module.exports = router

//TODO: add admin privelege options to necessary routes & selforAdmin to user specific routes
//TODO: Test out write feeds at scale, is it ok after sending response? Load on read vs. write approach
//TODO: see best way to send in create new post w/ new challenge & sometimes new place object

//get all posts
router.get(
  '/',
  asyncHandler(async (req, res, next) => {
    const allPosts = await Post.allPosts()
    res.json(allPosts)
  })
)

//get all original created challenge posts
router.get(
  '/created',
  asyncHandler(async (req, res, next) => {
    const created = await Post.allCreated()
    res.json(created)
  })
)

//get all incomplete posts aka accepted challenges
router.get(
  '/accepted',
  asyncHandler(async (req, res, next) => {
    const accepted = await Post.allAccepted()
    res.json(accepted)
  })
)

//get all complete posts aka completed challenges, includes created
router.get(
  '/completed',
  asyncHandler(async (req, res, next) => {
    const completed = await Post.allCompleted()
    res.json(completed)
  })
)

//Feed on read approach, get all posts from friends
router.get(
  '/friends',
  asyncHandler(async (req, res, next) => {
    const friendsPosts = await Post.friends(req.user)
    res.json(friendsPosts)
  })
)

//get all created challenge posts from friends
router.get(
  '/friends/created',
  asyncHandler(async (req, res, next) => {
    const friendsCreated = await Post.friendsCreated(req.user)
    res.json(friendsCreated)
  })
)

//get all accepted posts from friends
router.get(
  '/friends/accepted',
  asyncHandler(async (req, res, next) => {
    const friendsAccepted = await Post.friendsAccepted(req.user)
    res.json(friendsAccepted)
  })
)

//get all complete posts from friends
router.get(
  '/friends/completed',
  asyncHandler(async (req, res, next) => {
    const friendsCompleted = await Post.friendsCompleted(req.user)
    res.json(friendsCompleted)
  })
)

//create a new challenge w/ post
router.post(
  //pass in req.body obj as { place: placeObj, challenge: challengeObj, post: postObj}
  '/',
  asyncHandler(async (req, res, next) => {
    const createdPost = await Post.createPost(req.body)
    res.status(201).json(createdPost)
    Feed.writeFeed(req.user, createdPost.id)
  })
)

//accept challenge
router.post(
  '/accept',
  asyncHandler(async (req, res, next) => {
    const acceptChallenge = await Post.create(req.body)
    res.status(201).json(acceptChallenge)
    Feed.writeFeed(req.user, acceptChallenge.id)
  })
)

//param for all post by id requests
router.param(
  'id',
  asyncHandler(async (req, res, next, id) => {
    const currentPost = await Post.findById(id)
    if (!currentPost) {
      const err = Error('Challenge not found')
      err.status = 404
      throw err
    } else {
      req.post = currentPost
      next()
    }
  })
)

//return full post info
router.get('/:id', async (req, res, next) => {
  const post = await Post.getPost(req.post.id)
  res.json(post)
})

//complete the challenge
router.put(
  '/:id/complete',
  asyncHandler(async (req, res, next) => {
    const completePost = await req.post.update(req.body)
    res.status(200).json(completePost)
    Feed.writeFeed(req.user, completePost.id)
  })
)

//any non-completing the challenge update, ex. updating rating etc. don't write to feed
router.put(
  '/:id',
  asyncHandler(async (req, res, next) => {
    const updatedPost = await req.post.update(req.body)
    res.status(200).json(updatedPost)
  })
)

//delete post
router.delete(
  '/:id',
  asyncHandler(async (req, res, next) => {
    await req.post.destroy()
    res.status(204).end()
  })
)
