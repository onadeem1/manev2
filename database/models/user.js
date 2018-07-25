const crypto = require('crypto')
const { STRING, ARRAY, INTEGER, BOOLEAN } = require('sequelize')

module.exports = db => {
  let User = db.define('user', {
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

  //class methods
  User.associations = (User, { Recommendation, Challenge, UserChallenge, Friendship }) => {
    User.belongsToMany(User, { through: Friendship, as: 'friends' })
    User.hasMany(Recommendation)
    User.hasMany(Challenge, { as: 'challengeCreator' })
    User.belongsToMany(Challenge, { through: UserChallenge })
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
