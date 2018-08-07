const crypto = require('crypto')
const { STRING, BOOLEAN } = require('sequelize')

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
        recommendations: function(completeBool) {
          return {
            include: [db.model('recommendation')],
            where: {
              complete: completeBool
            }
          }
        },
        challenges: function() {
          return {
            include: [db.model('challenge')]
          }
        }
      }
    }
  )

  /* instance methods */

  User.prototype.getCreatedChallenges = async function() {
    try {
      const createdChallenges = await this.getChallengesCreated({ include: db.model('place') })
      const challengesWithFullPlace = await Promise.all(
        createdChallenges.map(challenge => challenge.getChallengeWithGoogPlace())
      )
      return challengesWithFullPlace
    } catch (error) {
      console.error(error)
    }
  }

  //accepted challenges are incomplete recs :)
  User.prototype.getAcceptedChallenges = async function() {
    try {
      const acceptedChallenges = await this.getRecommendations({
        include: [
          db.model('place'),
          {
            model: db.model('challenge'),
            include: [{ model: db.model('user'), as: 'challengeCreator' }]
          }
        ],
        where: { complete: false }
      })
      const acceptedChallengesWithFullPlace = await Promise.all(
        acceptedChallenges.map(recommendation => recommendation.getRecommendationWithGoogPlace())
      )
      return acceptedChallengesWithFullPlace
    } catch (error) {
      console.error(error)
    }
  }

  User.prototype.getCompleteChallenges = async function() {
    try {
      const completeChallenges = await this.getRecommendations({
        include: [
          db.model('place'),
          {
            model: db.model('challenge'),
            include: [{ model: db.model('user'), as: 'challengeCreator' }]
          }
        ],
        where: { complete: false }
      })
      const completeChallengesWithFullPlace = await Promise.all(
        completeChallenges.map(recommendation => recommendation.getRecommendationWithGoogPlace())
      )
      return completeChallengesWithFullPlace
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

  User.prototype.correctPassword = function(candidatePwd) {
    return User.encryptPassword(candidatePwd, this.salt()) === this.password()
  }

  /* class methods */

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
  User.belongsToMany(Place, { through: 'favPlaces', as: {singular: 'favoritePlace', plural: 'favoritePlaces'}})
}
