const { STRING, Op } = require('sequelize')

module.exports = db => {
  const Challenge = db.define(
    'challenge',
    {
      challengeText: {
        type: STRING,
        allowNull: false
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
        posts: (as, required = true) => ({
          include: [{ model: db.model('post').scope('user', 'linkedPost'), as, required }]
        }),
        friends: (as, required = true, ids, attributes) => ({
          include: [
            {
              model: db.model('post').scope('user', 'linkedPost', { method: ['friends', ids] }),
              as,
              required,
              attributes
            }
          ]
        }),
        friendCreator: ids => ({
          include: [{ model: db.model('user'), as: 'challengeCreator' }],
          where: { challengeCreatorId: { [Op.in]: ids } }
        }),
        innerJoin: ids => ({
          //used to join when retrieving challenges by friends sorted in created/accepted/completed properties
          include: [
            {
              model: db.model('post').scope({ method: ['friends', ids] }),
              as: 'allChallenges',
              attributes: ['id']
            }
          ]
        })
      }
    }
  )

  /* helper method/s */

  //easy way to create all scopes individualized
  Challenge.scopeHelper = (friendsOrPosts, ids = []) => [
    { method: [friendsOrPosts, 'createdChallenges', false, ids] },
    { method: [friendsOrPosts, 'acceptedChallenges', false, ids] },
    { method: [friendsOrPosts, 'completedChallenges', false, ids] }
  ]

  /* instance methods */

  //add the full place info to the challenge result
  Challenge.prototype.addGoog = async function() {
    const [plainChallenge, place] = await Promise.all([
      this.get({ plain: true }),
      this.place.addGoog()
    ])
    return { ...plainChallenge, place }
  }

  /* class methods */

  //add the full place to an array of challenges
  Challenge.addGoogMapper = challenges => {
    return Promise.all(challenges.map(challenge => challenge.addGoog()))
  }

  //get all challenges sorted w/ created/accepted/completed posts
  Challenge.allChallengesSorted = async function() {
    const challenges = await this.scope('defaultScope', ...this.scopeHelper('posts')).findAll()
    if (process.env.NODE_ENV === 'test') return challenges
    return this.addGoogMapper(challenges)
  }

  //get all challenges w/ all completed/accepted/created posts on allChallenges property
  Challenge.allChallenges = async function(postAlias = 'allChallenges') {
    const challenges = await this.scope('defaultScope', { method: ['posts', postAlias] }).findAll()
    if (process.env.NODE_ENV === 'test') return challenges
    return this.addGoogMapper(challenges)
  }

  //get all challenges w/ created posts
  Challenge.allChallengesCreated = function() {
    return this.allChallenges('createdChallenges')
  }

  //get all challenges w/ accepted posts
  Challenge.allChallengesAccepted = function() {
    return this.allChallenges('acceptedChallenges')
  }

  //get all challenges w/ completed posts
  Challenge.allChallengesCompleted = function() {
    return this.allChallenges('completedChallenges')
  }

  //get all challenges created/accepted/completed on their own property
  Challenge.friendsSorted = async function(user) {
    const ids = await user.getFriendAndUserIds()
    const challenges = await this.scope('defaultScope', ...this.scopeHelper('friends', ids), {
      method: ['innerJoin', ids]
    }).findAll()
    if (process.env.NODE_ENV === 'test') return challenges
    return this.addGoogMapper(challenges)
  }

  //get all challenges created/accepted/completed by a friend on all Challenges
  Challenge.friends = async function(user, postAlias = 'allChallenges') {
    const ids = await user.getFriendAndUserIds()
    const challenges = await this.scope('defaultScope', {
      method: ['friends', postAlias, true, ids]
    }).findAll()
    if (process.env.NODE_ENV === 'test') return challenges
    return this.addGoogMapper(challenges)
  }

  //get all challenges created by a friend
  Challenge.friendsCreated = function(user) {
    return this.friends(user, 'createdChallenges')
  }

  //get all challenges accepted by a friend
  Challenge.friendsAccepted = function(user) {
    return this.friends(user, 'acceptedChallenges')
  }

  //get all challenges completed by a friend
  Challenge.friendsCompleted = function(user) {
    return this.friends(user, 'completedChallenges')
  }

  //get a challenge w/ the created/accepted/completed posts
  Challenge.fullChallengeInfo = async function(id) {
    const challenge = await this.scope('defaultScope', ...this.scopeHelper('posts')).findById(id)
    if (process.env.NODE_ENV === 'test') return challenge
    return challenge.addGoog()
  }

  //get a challenge w/ the created/accepted/completed posts by friends
  Challenge.fullChallengeFriendsInfo = async function(id, user) {
    const ids = await user.getFriendAndUserIds()
    const challenge = await this.scope(
      'defaultScope',
      ...this.scopeHelper('friends', ids)
    ).findById(id)
    if (process.env.NODE_ENV === 'test') return challenge
    return challenge.addGoog()
  }

  return Challenge
}
module.exports.associations = (Challenge, { User, Post, Place }) => {
  Challenge.hasMany(Post, { as: 'allChallenges' })
  Challenge.hasMany(Post, { as: 'createdChallenges', scope: { original: true } })
  Challenge.hasMany(Post, { as: 'acceptedChallenges', scope: { complete: false } })
  Challenge.hasMany(Post, { as: 'completedChallenges', scope: { original: false, complete: true } })
  Challenge.belongsTo(Place)
  Challenge.belongsTo(User, { as: 'challengeCreator' })
}
