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
      defaultScope: () => ({
        include: ['challengeCreator', db.model('place')]
      }),
      scopes: {
        challengeCreator: () => ({
          include: ['challengeCreator']
        }),
        place: () => ({
          include: [{ model: db.model('place') }]
        }),
        posts: (alias, reqBool = true) => ({
          include: [
            { model: db.model('post').scope('user', 'linkedPost'), as: alias, required: reqBool }
          ]
        }),
        friends: (alias, ids, extraScopes = [], reqBool = true) => ({
          include: [
            {
              model: db
                .model('post')
                .scope(['user', 'linkedPost', { method: ['friends', ids] }, ...extraScopes]),
              as: alias,
              required: reqBool
            }
          ]
        }),
        friendsCreator: ids => ({
          //return challenges where creator is friend, might be redundant depends how we want the info
          where: {
            challengeCreatorId: { [Op.in]: ids }
          }
        })
      }
    }
  )

  /* instance methods */

  //add the full place info to the challenge result
  Challenge.prototype.addGoogPlace = async function() {
    const [plainChallenge, place] = await Promise.all([
      this.get({ plain: true }),
      this.place.combinePlaceInfo()
    ])
    return { ...plainChallenge, place }
  }

  /* class methods */

  //add the full place to an array of challenges
  Challenge.mapGoogPlace = challenges => {
    return Promise.all(challenges.map(challenge => challenge.addGoogPlace()))
  }

  //get all challenges w/ all completed/accepted posts
  Challenge.allChallenges = async function(postAlias = 'allChallenges') {
    const challenges = await this.scope('defaultScope', { method: ['posts', postAlias] }).findAll()
    return this.mapGoogPlace(challenges)
  }

  //get all challenges w/ accepted posts
  Challenge.allChallengesAccepted = function() {
    return this.allChallenges('acceptedChallenges')
  }

  //get all challenges w/ completed posts
  Challenge.allChallengesCompleted = function() {
    return this.allChallenges('completedChallenges')
  }

  //get all challenges created by a friend
  Challenge.friendsCreator = async function(user) {
    const ids = await user.getFriendAndUserIds()
    const challenges = await this.scope('defaultScope', {
      method: ['friendsCreator', ids]
    }).findAll()
    return this.mapGoogPlace(challenges)
  }

  //get all challenges created/accepted/completed by a friend
  Challenge.friends = async function(user, postAlias = 'allChallenges', extraScopes = []) {
    const ids = await user.getFriendAndUserIds()
    const challenges = await this.scope([
      'defaultScope',
      { method: ['friends', postAlias, ids, extraScopes] }
    ]).findAll()
    return challenges //TODO: ADD THE MAPPER
  }

  //get all challenges created by friend as post info
  Challenge.friendsCreated = function(user) {
    return this.friends(user, 'createdChallenges', [
      { method: ['created', 'createdChallenges.userId'] }
    ])
  }

  //get all challenges accepted by a friend
  Challenge.friendsAccepted = function(user) {
    return this.friends(user, 'acceptedChallenges')
  }

  //get all challenges completed by a friend
  Challenge.friendsCompleted = function(user) {
    return this.friends(user, 'completedChallenges')
  }

  //get a challenge w/ the accepted & completed posts
  Challenge.fullChallengeInfo = async function(id) {
    const challenge = await this.scope(
      'defaultScope',
      { method: ['posts', 'completedChallenges', false] },
      { method: ['posts', 'acceptedChallenges', false] }
    ).findById(id)
    return challenge.addGoogPlace()
  }

  //get a challenge w/ the accepted & completed posts by friends
  Challenge.fullChallengeFriendsInfo = async function(id, user) {
    const ids = await user.getFriendAndUserIds()
    const challenge = await this.scope(
      'defaultScope',
      { method: ['friends', 'completedChallenges', ids, [], false] },
      { method: ['friends', 'acceptedChallenges', ids, [], false] }
    ).findById(id)
    return challenge.addGoogPlace()
  }

  return Challenge
}
module.exports.associations = (Challenge, { User, Post, Place }) => {
  Challenge.hasMany(Post, { as: 'allChallenges' })
  Challenge.hasMany(Post.scope('accepted'), {
    as: 'acceptedChallenges',
    scope: { complete: false }
  })
  Challenge.hasMany(Post, { as: 'completedChallenges', scope: { complete: true } })
  Challenge.hasMany(Post, { as: 'createdChallenges' })
  Challenge.belongsTo(Place)
  Challenge.belongsTo(User, { as: 'challengeCreator' })
}
