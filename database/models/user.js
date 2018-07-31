const crypto = require('crypto')
const { STRING, ARRAY, INTEGER, BOOLEAN } = require('sequelize')

module.exports = db => {
  const User = db.define('user', {
    firstName: {
      type: STRING
    },
    lastName: {
      type: STRING
    },
    username: {
      type: STRING,
      // allowNull: false,
      unique: true
    },
    // Making `.salt` & `.password` act like functions hides them when serializing to JSON.
    // This is a hack to get around Sequelize's lack of a "private" option.
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
    },
    recommendationsSaved: {
      //change this to an association?
      type: ARRAY(INTEGER)
    }
  })

  //instance methods
  User.prototype.correctPassword = function(candidatePwd) {
    return User.encryptPassword(candidatePwd, this.salt()) === this.password()
  }

  User.prototype.getFriendIds = async function() {
    const friends = await this.getFriends({
      attributes: ['id'],
      through: { where: { accepted: true } }
    })
    const friendIds = friends.map(friend => friend.id)
    return friendIds
  }

  User.prototype.getFriendAndUserIds = async function() {
    return [this.id, ...(await this.getFriendIds())]
  }

  //class methods
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

  // hooks
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

module.exports.associations = (User, { Recommendation, Challenge, Friendship }) => {
  User.belongsToMany(User, { through: Friendship, as: 'friends' })
  User.hasMany(Recommendation, { as: 'completedChallenges' })
  User.hasMany(Recommendation, { as: 'incompleteChallenges' })
  User.hasMany(Challenge, { as: 'challengesCreated' })
}
