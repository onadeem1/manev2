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
        include: [db.model('place'), db.model('challenge')]
      }),
      scopes: {
        complete: {
          where: {
            complete: true
          }
        },
        incomplete: {
          where: {
            complete: false
          }
        },
        challenge: function() {
          return {
            include: [db.model('challenge')]
          }
        },
        user: function() {
          return {
            include: [db.model('user')]
          }
        },
        friends: function(ids, completeBool) {
          return {
            where: {
              userId: {
                [Op.in]: ids
              },
              complete: completeBool
            }
          }
        }
      }
    }
  )

  Post.prototype.getPostWithGoogPlace = async function() {
    const plainPost = await this.get({ plain: true })
    const place = await this.place.combinePlaceInfo()
    return Object.assign({}, plainPost, { place })
  }

  Post.getPost = async function(id) {
    try {
      const post = await this.scope('place', 'user', 'challenge').findById(id)
      return post
    } catch (error) {
      console.error(error)
    }
  }

  Post.createPost = async function({
    place: placeInfo,
    challenge: challengeInfo,
    post: postInfo
  }) {
    try {
      const place = await db.model('place').findOrCreate({ where: placeInfo })
      challengeInfo = Object.assign(challengeInfo, { placeId: place[0].id })
      const challenge = await db.model('challenge').create(challengeInfo)
      postInfo = Object.assign(
        postInfo,
        { challengeId: challenge.id },
        { userId: challenge.challengeCreatorId },
        { placeId: place[0].id }
      )
      const post = this.create(postInfo)
      return post
    } catch (error) {
      console.error(error)
    }
  }

  Post.getAllPosts = async function(options) {
    try {
      const posts = await this.scope('place', 'user', 'challenge').findAll(options)
      const fullPosts = Promise.all(
        posts.map(post => post.getPostWithGoogPlace())
      )
      return fullPosts
    } catch (error) {
      console.error(error)
    }
  }

  Post.getFriendsPosts = async function(user, options = {}) {
    try {
      const ids = await user.getFriendAndUserIds()
      const posts = await this.scope('place', 'user', 'challenge', {
        method: ['friends', ids]
      }).findAll(options)
      const fullPosts = await Promise.all(
        posts.map(post => post.getPostWithGoogPlace())
      )
      return fullPosts
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return Post
}

module.exports.associations = (Post, { Feed, User, Place, Challenge }) => {
  Post.belongsTo(User)
  Post.belongsTo(Place)
  Post.belongsTo(Challenge)
  Post.belongsToMany(User, { through: Feed, as: 'feedOwner' })
}
