const crypto = require('crypto')
const { STRING, BOOLEAN, Op, Promise } = require('sequelize')

module.exports = db => {
  const User = db.define(
    'user',
    {
      firstName: {
        type: STRING
      },
      lastName: {
        type: STRING
      },
      username: {
        type: STRING,
        // allowNull: false, TODO: will need to work logic for G users to create username
        unique: true
      },
      /* Making `.salt` & `.password` act like functions hides them when serializing to JSON.
         This is a hack to get around Sequelize's lack of a "private" option. */
      password: {
        type: STRING,
        get() {
          return () => this.getDataValue('password')
        }
      },
      email: {
        type: STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      salt: {
        type: STRING,
        get() {
          return () => this.getDataValue('salt')
        }
      },
      googleId: {
        type: STRING
      },
      phone: {
        type: STRING
      },
      picture: {
        type: STRING
      },
      isAdmin: {
        type: BOOLEAN,
        defaultValue: false
      }
    },
    {
      scopes: {
        challenge: () => ({
          include: [
            {
              model: db.model('challenge').scope('place'),
              as: 'challengesCreated'
            }
          ]
        }),
        recommendation: () => ({
          include: [{ model: db.model('recommendation') }]
        }),
        favPlaces: () => ({
          include: [{ model: db.model('place'), as: 'favoritePlaces' }]
        })
      }
    }
  )

  /* instance methods */

  User.prototype.correctPassword = function(candidatePwd) {
    return User.encryptPassword(candidatePwd, this.salt()) === this.password()
  }

  User.prototype.getCreatedChallenges = async function() {
    try {
      const createdChallenges = await this.getChallengesCreated()
      const fullCreatedChallenges = await Promise.all(
        createdChallenges.map(challenge => challenge.getChallengeWithGoogPlace())
      )
      return fullCreatedChallenges
    } catch (error) {
      console.error(error)
    }
  }

  User.prototype.getAllChallenges = async function(options = {}) {
    try {
      const recommendations = await this.getRecommendations(options)
      const fullRecommendations = await Promise.all(
        recommendations.map(recommendation => recommendation.getRecommendationWithGoogPlace())
      )
      return fullRecommendations
    } catch (error) {
      console.error(error)
    }
  }

  User.prototype.getFriendIds = async function() {
    try {
      const friends = await this.getFriends({
        attributes: ['id'],
        through: { where: { accepted: true } }
      })
      const friendIds = friends.map(friend => friend.id)
      return friendIds
    } catch (error) {
      console.error(error)
    }
  }

  User.prototype.getFriendAndUserIds = async function() {
    try {
      return [this.id, ...(await this.getFriendIds())]
    } catch (error) {
      console.error(error)
    }
  }

  /* friendship helper method */
  const friendsOptions = (accepted, originalRequest) => ({
    through: {
      where: {
        accepted,
        originalRequest
      }
    }
  })

  //friendship related instance methods, logic doesn't work in scopes ?! :(
  User.prototype.getAllFriends = function() {
    return this.getFriends(friendsOptions(true))
  }

  User.prototype.getFriendRequests = function() {
    return this.getFriends(friendsOptions(false, false))
  }

  User.prototype.getFriendsRequested = function() {
    return this.getFriends(friendsOptions(false, true))
  }

  User.prototype.requestFriend = async function(friendId) {
    try {
      const friend = await User.findById(friendId)
      const userRequest = await this.addFriend(friend, { through: { originalRequest: true } })
      const friendRequest = await friend.addFriend(this)
      return [...userRequest, ...friendRequest]
    } catch (error) {
      console.error(error)
    }
  }

  User.prototype.confirmFriend = async function(friendId) {
    try {
      const friend = await User.findById(friendId)
      const userConfirm = await this.addFriend(friend, {
        through: { accepted: true },
        returning: true
      })
      const friendConfirm = await friend.addFriend(this, {
        through: { accepted: true },
        returning: true
      })
      return [...userConfirm[1], ...friendConfirm[1]] //return only the models from the update
    } catch (error) {
      console.error(error)
    }
  }

  User.prototype.deleteFriend = async function(friendId) {
    try {
      const friend = await User.findById(friendId)
      await this.removeFriend(friend)
      await friend.removeFriend(this)
      return 'succesfully deleted friend'
    } catch (error) {
      console.error(error)
    }
  }

  User.prototype.potentialFriendsInContacts = async function(phoneNumbers) {
    const users = await User.findAll({
      where: {
        phone: { [Op.in]: phoneNumbers }
      }
    })
    //we are looking for users who are not already friends
    const potentialFriends = await Promise.filter(users, user =>
      this.hasFriend(user).then(bool => !bool)
    )
    return potentialFriends
  }

  /* class methods */

  User.getFullUserInfo = async function(id) {
    try {
      const user = await User.scope('challenge', 'recommendation', 'favPlaces').findById(id)
      const plainUser = user.get({ plain: true })
      const challengesCreated = await Promise.all(
        user.challengesCreated.map(challenge => challenge.getChallengeWithGoogPlace())
      )
      const recommendations = await Promise.all(
        user.recommendations.map(recommendation => recommendation.getRecommendationWithGoogPlace())
      )
      return { ...plainUser, challengesCreated, recommendations }
    } catch (error) {
      console.error(error)
    }
  }

  User.generateSalt = function() {
    return crypto.randomBytes(16).toString('base64')
  }

  User.encryptPassword = function(plainText, salt) {
    return crypto
      .createHash('RSA-SHA256')
      .update(plainText)
      .update(salt)
      .digest('hex')
  }

  /* hooks */

  const setSaltAndPassword = user => {
    if (user.changed('password')) {
      user.salt = User.generateSalt()
      user.password = User.encryptPassword(user.password(), user.salt())
    }
  }

  User.beforeCreate(setSaltAndPassword)
  User.beforeUpdate(setSaltAndPassword)

  return User
}

module.exports.associations = (User, { Recommendation, Challenge, Friendship, Feed, Place }) => {
  User.belongsToMany(User, { through: Friendship, as: 'friends' })
  User.hasMany(Recommendation)
  User.hasMany(Challenge, { as: 'challengesCreated', foreignKey: 'challengeCreatorId' })
  User.belongsToMany(Recommendation, { through: Feed, as: 'feedItems' })
  User.belongsToMany(Place, {
    through: 'favPlaces',
    as: { singular: 'favoritePlace', plural: 'favoritePlaces' }
  })
}
