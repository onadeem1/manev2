const { STRING, TEXT, INTEGER, BOOLEAN, Op } = require('sequelize')

module.exports = db => {
  const Recommendation = db.define(
    'recommendation',
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
      scopes: {
        place: function() {
          return {
            include: [db.model('place')]
          }
        },
        user: function() {
          return {
            include: [db.model('user')]
          }
        },
        challenge: function() {
          return {
            include: [
              {
                model: db.model('challenge'),
                include: {
                  model: db.model('user'),
                  as: 'challengeCreator'
                }
              }
            ]
          }
        },
        friends: function(ids) {
          return {
            where: {
              userId: {
                [Op.in]: ids
              }
            }
          }
        }
      }
    }
  )

  Recommendation.prototype.getRecommendationWithGoogPlace = async function() {
    const plainRecommendation = await this.get({ plain: true })
    const place = await this.place.combinePlaceInfo()
    return Object.assign({}, plainRecommendation, { place })
  }

  Recommendation.getRecommendation = async function(id) {
    try {
      const recommendation = await this.scope('place', 'user', 'challenge').findById(id)
      return recommendation
    } catch (error) {
      console.error(error)
    }
  }

  Recommendation.createRecommendation = async function({
    place: placeInfo,
    challenge: challengeInfo,
    recommendation: recommendationInfo
  }) {
    try {
      const place = await db.model('place').findOrCreate({ where: placeInfo })
      challengeInfo = Object.assign(challengeInfo, { placeId: place[0].id })
      const challenge = await db.model('challenge').create(challengeInfo)
      recommendationInfo = Object.assign(
        recommendationInfo,
        { challengeId: challenge.id },
        { userId: challenge.challengeCreatorId },
        { placeId: place[0].id }
      )
      const recommendation = this.create(recommendationInfo)
      return recommendation
    } catch (error) {
      console.error(error)
    }
  }

  Recommendation.getAllRecommendations = async function(options) {
    try {
      const recommendations = await this.scope('place', 'user', 'challenge').findAll(options)
      const fullRecommendations = Promise.all(
        recommendations.map(recommendation => recommendation.getRecommendationWithGoogPlace())
      )
      return fullRecommendations
    } catch (error) {
      console.error(error)
    }
  }

  Recommendation.getFriendsRecommendations = async function(user, options = {}) {
    try {
      const ids = await user.getFriendAndUserIds()
      const recommendations = await this.scope('place', 'user', 'challenge', {
        method: ['friends', ids]
      }).findAll(options)
      const fullRecommendations = await Promise.all(
        recommendations.map(recommendation => recommendation.getRecommendationWithGoogPlace())
      )
      return fullRecommendations
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return Recommendation
}

module.exports.associations = (Recommendation, { Feed, User, Place, Challenge }) => {
  Recommendation.belongsTo(User)
  Recommendation.belongsTo(Place)
  Recommendation.belongsTo(Challenge)
  Recommendation.belongsToMany(User, { through: Feed, as: 'feedOwner' })
}
