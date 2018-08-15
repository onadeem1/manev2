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
          ],
          required: true
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
    { method: [friendsOrPosts, 'created', false, ids] },
    { method: [friendsOrPosts, 'accepted', false, ids] },
    { method: [friendsOrPosts, 'completed', false, ids] }
  ]

  /* instance methods */

  //add the full place info to the challenge result
  Challenge.prototype.addGoogPlace = async function() {
    const [plainChallenge, place] = await Promise.all([
      this.get({ plain: true }),
      this.place.addGoog()
    ])
    return { ...plainChallenge, place }
  }

  /* class methods */

  //add the full place to an array of challenges
  Challenge.mapGoogPlace = challenges => {
    return Promise.all(challenges.map(challenge => challenge.addGoogPlace()))
  }

  //get all challenges sorted w/ created/accepted/completed posts
  Challenge.allChallengesSorted = async function() {
    const challenges = await this.scope('defaultScope', ...this.scopeHelper('posts')).findAll()
    return this.mapGoogPlace(challenges)
  }

  //get all challenges w/ all completed/accepted/created posts on allChallenges property
  Challenge.allChallenges = async function(postAlias = 'allChallenges') {
    const challenges = await this.scope('defaultScope', { method: ['posts', postAlias] }).findAll()
    return this.mapGoogPlace(challenges)
  }

  //get all challenges w/ created posts
  Challenge.allChallengesCreated = function() {
    return this.allChallenges('created')
  }

  //get all challenges w/ accepted posts
  Challenge.allChallengesAccepted = function() {
    return this.allChallenges('accepted')
  }

  //get all challenges w/ completed posts
  Challenge.allChallengesCompleted = function() {
    return this.allChallenges('completed')
  }

  Challenge.friendsSorted = async function(user) {
    const ids = await user.getFriendAndUserIds()
    const challenges = await this.scope('defaultScope', ...this.scopeHelper('friends', ids), {
      method: ['innerJoin', ids]
    }).findAll()
    return this.mapGoogPlace(challenges)
  }

  //get all challenges created/accepted/completed by a friend
  Challenge.friends = async function(user, postAlias = 'allChallenges') {
    const ids = await user.getFriendAndUserIds()
    const challenges = await this.scope('defaultScope', {
      method: ['friends', postAlias, true, ids]
    }).findAll()
    return this.mapGoogPlace(challenges)
  }

  //get all challenges created by a friend
  Challenge.friendsCreated = function(user) {
    return this.friends(user, 'created')
  }

  //get all challenges accepted by a friend
  Challenge.friendsAccepted = function(user) {
    return this.friends(user, 'accepted')
  }

  //get all challenges completed by a friend
  Challenge.friendsCompleted = function(user) {
    return this.friends(user, 'completed')
  }

  //get a challenge w/ the created/accepted/completed posts
  Challenge.fullChallengeInfo = async function(id) {
    const challenge = await this.scope('defaultScope', ...this.scopeHelper('posts')).findById(id)
    return challenge.addGoogPlace()
  }

  //get a challenge w/ the created/accepted/completed posts by friends
  Challenge.fullChallengeFriendsInfo = async function(id, user) {
    const ids = await user.getFriendAndUserIds()
    const challenge = await this.scope(
      'defaultScope',
      ...this.scopeHelper('friends', ids)
    ).findById(id)
    return challenge.addGoogPlace()
  }

  return Challenge
}
module.exports.associations = (Challenge, { User, Post, Place }) => {
  Challenge.hasMany(Post, { as: 'allChallenges' })
  Challenge.hasMany(Post, { as: 'created', scope: { original: true } })
  Challenge.hasMany(Post, { as: 'accepted', scope: { complete: false } })
  Challenge.hasMany(Post, { as: 'completed', scope: { original: false, complete: true } })
  Challenge.belongsTo(Place)
  Challenge.belongsTo(User, { as: 'challengeCreator' })
}
