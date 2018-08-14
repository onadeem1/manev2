const { STRING, TEXT, INTEGER, BOOLEAN, Op } = require('sequelize')

module.exports = db => {
  const Post = db.define(
    'post',
    {
      review: {
        type: TEXT
      },
      picture: {
        type: STRING,
        validate: {
          isUrl: true
        }
      },
      rating: {
        type: INTEGER,
        validate: {
          isNumeric: true,
          min: 0,
          max: 100
        }
      },
      complete: {
        type: BOOLEAN,
        defaultValue: false
      }
    },
    {
      defaultScope: () => ({
        include: [
          db.model('place'),
          db.model('challenge'),
          db.model('user'),
          { model: db.model('post').scope('user'), as: 'linkedPost' }
        ]
      }),
      scopes: {
        //repeating scopes used for variabliity in other models that may not need everything from the default scope
        completed: {
          where: { complete: true }
        },
        accepted: {
          where: { complete: false }
        },
        created: () => ({
          include: [
            {
              model: db.model('challenge'),
              where: { challengeCreatorId: { [Op.col]: 'post.userId' } }
            }
          ]
        }),
        challenge: () => ({
          include: [db.model('challenge')]
        }),
        linkedPost: () => ({
          include: [{ model: db.model('post').scope('user'), as: 'linkedPost' }]
        }),
        place: () => ({
          include: [db.model('place')]
        }),
        user: () => ({
          include: [db.model('user')]
        }),
        friends: ids => ({
          where: {
            userId: { [Op.in]: ids }
          }
        })
      }
    }
  )

  /* instance methods */

  Post.prototype.addGoog = async function() {
    const [plainPost, place] = await Promise.all([
      this.get({ plain: true }),
      this.place.combinePlaceInfo()
    ])
    return { ...plainPost, place }
  }

  /* class methods */

  Post.addGoogMapper = function(posts) {
    return Promise.all(posts.map(post => post.addGoog()))
  }

  //get all posts
  Post.allPosts = async function(scopes = []) {
    const posts = await this.scope(['defaultScope', ...scopes]).findAll()
    return this.addGoogMapper(posts)
  }

  //get all posts created, original challenge post
  Post.allCreated = function() {
    return this.allPosts(['created'])
  }

  //get all posts accepted
  Post.allAccepted = function() {
    return this.allPosts(['accepted'])
  }

  //get all posts completed
  Post.allCompleted = function() {
    return this.allPosts(['completed'])
  }

  //get all friends posts
  Post.friends = async function(user, scopes = []) {
    const ids = await user.getFriendAndUserIds()
    return this.allPosts([{ method: ['friends', ids] }, ...scopes])
  }

  //get all friends completed
  Post.friendsCreated = function(user) {
    return this.friends(user, ['created'])
  }

  //get all friends accepted
  Post.friendsAccepted = function(user) {
    return this.friends(user, ['accepted'])
  }

  //get all friends completed
  Post.friendsCompleted = function(user) {
    return this.friends(user, ['completed'])
  }

  //get a singlepost
  Post.getPost = async function(id) {
    const post = await this.findById(id)
    return post.addGoog()
  }

  //create a single post, used when creating a new challenge post
  Post.createPost = async function({ place: placeInfo, challenge: challengeInfo, post: postInfo }) {
    const place = await db.model('place').findOrCreate({ where: placeInfo })
    challengeInfo = { ...challengeInfo, placeId: place[0].id }
    const challenge = await db.model('challenge').create(challengeInfo)
    postInfo = {
      ...postInfo,
      challengeId: challenge.id,
      userId: challenge.challengeCreatorId,
      placeId: place[0].id
    }
    return this.create(postInfo)
  }

  return Post
}

module.exports.associations = (Post, { Feed, User, Place, Challenge }) => {
  Post.belongsTo(Post, { as: 'linkedPost' })
  Post.belongsTo(User)
  Post.belongsTo(Place)
  Post.belongsTo(Challenge)
  Post.belongsToMany(User, { through: Feed, as: 'feedOwner' })
}
