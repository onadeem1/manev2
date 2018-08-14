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
  Post.allPosts = async function(option = {}) {
    const posts = await this.findAll(option)
    return this.addGoogMapper(posts)
  }

  //get all posts created, original challenge post
  Post.allCreated = function() {
    const option = {
      include: [
        {
          model: db.model('challenge'),
          where: { challengeCreatorId: { [Op.col]: 'post.userId' } }
        }
      ]
    }
    return this.allPosts(option)
  }

  //get all posts accepted
  Post.allAccepted = function() {
    return this.allPosts({ where: { complete: false } })
  }

  //get all posts completed
  Post.allCompleted = function() {
    return this.allPosts({ where: { complete: true } })
  }

  //get all friends posts
  Post.friends = async function(user, option = {}) {
    const ids = await user.getFriendAndUserIds()
    const posts = await this.scope('defaultScope', { method: ['friends', ids] }).findAll(option)
    return this.addGoogMapper(posts)
  }

  //get all friends completed
  Post.friendsCreated = function(user) {
    const option = {
      include: [
        {
          model: db.model('challenge'),
          where: { challengeCreatorId: { [Op.col]: 'post.userId' } }
        }
      ]
    }
    return this.friends(user, option)
  }

  //get all friends accepted
  Post.friendsAccepted = function(user) {
    return this.friends(user, { where: { complete: false } })
  }

  //get all friends completed
  Post.friendsCompleted = function(user) {
    return this.friends(user, { where: { complete: true } })
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
