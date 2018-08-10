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
        created: () => ({
          include: [
            {
              model: db.model('challenge').scope('place'),
              as: 'createdChallenges'
            }
          ]
        }),
        post: () => ({
          include: [{ model: db.model('post') }]
        }),
        accepted: () => ({
          include: [{ model: db.model('post'), as: 'acceptedChallenges' }]
        }),
        completed: () => ({
          include: [
            {
              model: db.model('post').scope('linkedPost', 'defaultScope'),
              as: 'completedChallenges'
            }
          ]
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

  User.prototype.createdChallenges = async function() {
    const createdChallenges = await this.getCreatedChallenges({
      scope: ['place']
    })
    return Promise.all(createdChallenges.map(challenge => challenge.getChallengeWithGoogPlace()))
  }

  User.prototype.acceptedChallenges = async function() {
    const acceptedChallenges = await this.getAcceptedChallenges()
    return Promise.all(acceptedChallenges.map(post => post.getPostWithGoogPlace()))
  }

  User.prototype.completedChallenges = async function() {
    const completedChallenges = await this.getCompletedChallenges()
    return Promise.all(completedChallenges.map(post => post.getPostWithGoogPlace()))
  }

  User.prototype.getFriendIds = async function() {
    const friends = await this.getFriends({
      attributes: ['id'],
      through: { where: { accepted: true } }
    })
    return friends.map(friend => friend.id)
  }

  User.prototype.getFriendAndUserIds = async function() {
    return [this.id, ...(await this.getFriendIds())]
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
  User.prototype.allFriends = function() {
    return this.getFriends(friendsOptions(true))
  }

  User.prototype.friendRequests = function() {
    return this.getFriends(friendsOptions(false, false))
  }

  User.prototype.friendsRequested = function() {
    return this.getFriends(friendsOptions(false, true))
  }

  User.prototype.requestFriend = async function(friendId) {
    const friend = await User.findById(friendId)
    const userRequest = await this.addFriend(friend, { through: { originalRequest: true } })
    const friendRequest = await friend.addFriend(this)
    return [...userRequest, ...friendRequest]
  }

  User.prototype.confirmFriend = async function(friendId) {
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
  }

  User.prototype.deleteFriend = async function(friendId) {
    const friend = await User.findById(friendId)
    await this.removeFriend(friend)
    await friend.removeFriend(this)
    return 'succesfully deleted friend'
  }

  User.prototype.potentialFriendsInContacts = async function(phoneNumbers) {
    const users = await User.findAll({
      where: {
        phone: { [Op.in]: phoneNumbers }
      }
    })
    //we are looking for users who are not already friends
    return Promise.filter(users, user => this.hasFriend(user).then(bool => !bool))
  }

  /* class methods */

  User.fullUserInfo = async function(id) {
    const user = await User.scope('created', 'accepted', 'completed', 'favPlaces').findById(id)
    const plainUser = user.get({ plain: true })
    //add the goog place info to all posts/challenges
    const createdChallengesUpdate = Promise.all(
      user.createdChallenges.map(challenge => challenge.getChallengeWithGoogPlace())
    )
    const acceptedChallengesUpdate = Promise.all(
      user.acceptedChallenges.map(post => post.getPostWithGoogPlace())
    )
    const completedChallengesUpdate = Promise.all(
      user.completedChallenges.map(post => post.getPostWithGoogPlace())
    )
    const [createdChallenges, acceptedChallenges, completedChallenges] = await Promise.all([
      createdChallengesUpdate,
      acceptedChallengesUpdate,
      completedChallengesUpdate
    ])
    return { ...plainUser, createdChallenges, acceptedChallenges, completedChallenges }
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

module.exports.associations = (User, { Post, Challenge, Friendship, Feed, Place }) => {
  User.belongsToMany(User, { through: Friendship, as: 'friends' })
  User.hasMany(Post)
  User.hasMany(Post, { as: 'acceptedChallenges', scope: { complete: false } })
  User.hasMany(Post, { as: 'completedChallenges', scope: { complete: true } })
  User.hasMany(Challenge, { as: 'createdChallenges', foreignKey: 'challengeCreatorId' })
  User.belongsToMany(Post, { through: Feed, as: 'feedPosts' })
  User.belongsToMany(Place, { through: 'favPlaces', as: 'favoritePlaces' })
}
