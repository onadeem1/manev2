const { STRING, Op } = require('sequelize')

module.exports = db => {
  const Challenge = db.define(
    'challenge',
    {
      challengeText: {
        type: STRING
      }
    },
    {
      scopes: {
        recommendations: function(completeBool) {
          return {
            include: [
              {
                model: db.model('recommendation'),
                where: {
                  complete: completeBool
                },
                include: [
                  {
                    model: db.model('user')
                  }
                ],
                required: false
              }
            ]
          }
        },
        challengeCreator: function() {
          return {
            include: [
              {
                model: db.model('user'),
                as: 'challengeCreator'
              }
            ],
            required: false
          }
        },
        challengeCreatorFriend: function(requiredBool, ids) {
          return {
            include: [
              {
                model: db.model('user'),
                as: 'challengeCreator',
                where: {
                  id: {
                    [Op.in]: ids
                  }
                }
              }
            ],
            required: requiredBool
          }
        },
        place: function() {
          return {
            include: [{ model: db.model('place') }]
          }
        },
        friends: function(ids, completeBool, requiredBool = true) {
          return {
            include: [
              {
                model: db.model('recommendation'),
                where: {
                  complete: completeBool,
                  userId: {
                    [Op.in]: ids
                  }
                },
                include: [{ model: db.model('user') }],
                required: requiredBool
              }
            ]
          }
        }
      }
    }
  )

  Challenge.prototype.getChallengeWithGoogPlace = async function() {
    try {
      const plainChallenge = await this.get({ plain: true })
      const place = await this.place.combinePlaceInfo()
      return Object.assign({}, plainChallenge, { place })
    } catch (error) {
      console.error(error)
    }
  }

  Challenge.getAllChallenges = async function(completeBool = undefined) {
    try {
      const allChallenges = await Challenge.scope('challengeCreator', 'place', {
        method: ['recommendations', completeBool]
      }).findAll()
      return allChallenges
    } catch (error) {
      console.error(error)
    }
  }

  Challenge.getFriendsChallenges = async function(completeBool, user) {
    try {
      const ids = await user.getFriendIds()
      const completedChallenges = await Challenge.scope(
        { method: ['challengeCreatorFriend', true, ids] },
        'place',
        { method: ['friends', ids, completeBool] }
      ).findAll()
      return completedChallenges
    } catch (error) {
      console.error(error)
    }
  }

  Challenge.getChallenge = async function(user, id) {
    try {
      const ids = await user.getFriendAndUserIds()
      const challenge = await Challenge.scope('place', 'challengeCreator', {
        method: ['friends', ids, undefined, false]
      }).findById(id)
      return challenge
    } catch (error) {
      console.error(error)
    }
  }
  return Challenge
}
module.exports.associations = (Challenge, { User, Recommendation, Place }) => {
  Challenge.hasMany(Recommendation)
  Challenge.belongsTo(Place)
  Challenge.belongsTo(User, { as: 'challengeCreator' })
}
