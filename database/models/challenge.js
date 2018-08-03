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

  //TODO: can this be functional somewhere else useful for anything passed in? guess it applies to any challenge or rec retrived
  Challenge.prototype.getChallengeWithGoogPlace = async function() {
    const plainChallenge = await this.get({ plain: true })
    const place = await this.place.combinePlaceInfo()
    return Object.assign({}, plainChallenge, { place })
  }

  Challenge.getAllChallenges = async function(completeBool = undefined) {
    const allChallenges = await Challenge.scope('challengeCreator', 'place', {
      method: ['recommendations', completeBool]
    }).findAll()
    return allChallenges
  }

  Challenge.getFriendsChallenges = async function(completeBool, user) {
    const ids = await user.getFriendIds()
    const completedChallenges = await Challenge.scope(
      { method: ['challengeCreatorFriend', true, ids] },
      'place',
      { method: ['friends', ids, completeBool] }
    ).findAll()
    return completedChallenges
  }

  Challenge.getChallenge = async function(user, id) {
    const ids = await user.getFriendIds() //TODO: reasoning? - only see freinds stuff not your own? //maybe both your own sepearate area
    const challenge = await Challenge.scope('place', 'challengeCreator', {
      method: ['friends', ids, undefined, false]
    }).findById(id)
    return challenge
  }
  return Challenge
}
module.exports.associations = (Challenge, { User, Recommendation, Place }) => {
  Challenge.hasMany(Recommendation)
  Challenge.belongsTo(Place)
  Challenge.belongsTo(User, { as: 'challengeCreator' })
}
