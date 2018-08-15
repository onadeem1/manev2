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
              model: db.model('post').scope('place', 'linkedPost', 'challenge'),
              as: 'createdChallenges'
            }
          ]
        }),
        accepted: () => ({
          include: [
            {
              model: db.model('post').scope('place', 'linkedPost', 'challenge'),
              as: 'acceptedChallenges'
            }
          ]
        }),
        completed: () => ({
          include: [
            {
              model: db.model('post').scope('place', 'linkedPost', 'challenge'),
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

  //check if the user password is correct
  User.prototype.correctPassword = function(candidatePwd) {
    return User.encryptPassword(candidatePwd, this.salt()) === this.password()
  }

  //get all the posts the user created as an original challenge
  User.prototype.createdChallenges = async function() {
    const createdChallenges = await this.getCreatedChallenges({
      scope: ['place', 'linkedPost', 'challenge']
    })
    return db.model('post').addGoogMapper(createdChallenges)
  }

  //get all the user's accepted challenges
  User.prototype.acceptedChallenges = async function() {
    const acceptedChallenges = await this.getAcceptedChallenges({
      scope: ['place', 'linkedPost', 'challenge']
    })
    return db.model('post').addGoogMapper(acceptedChallenges)
  }

  //get all the user's completed challenges
  User.prototype.completedChallenges = async function() {
    const completedChallenges = await this.getCompletedChallenges({
      scope: ['place', 'linkedPost', 'challenge']
    })
    return db.model('post').addGoogMapper(completedChallenges)
  }

  //load all info relative to user as a single object (includes created/accepted/completed challenges & fav places)
  User.prototype.fullUser = async function() {
    const [
      user,
      createdChallenges,
      acceptedChallenges,
      completedChallenges,
      favoritePlaces
    ] = await Promise.all([
      this.get({ plain: true }),
      this.createdChallenges(),
      this.acceptedChallenges(),
      this.completedChallenges(),
      this.getFavoritePlaces()
    ])
    return { ...user, createdChallenges, acceptedChallenges, completedChallenges, favoritePlaces }
  }

  //get all user's friend id's, useful for filtering on other models by friends
  User.prototype.getFriendIds = async function() {
    const friends = await this.getFriends({
      attributes: ['id'],
      through: { where: { accepted: true } }
    })
    return friends.map(friend => friend.id)
  }

  //add the user's id to the friends id's since we want user to see his own posts in feed etc.
  User.prototype.getFriendAndUserIds = async function() {
    return [this.id, ...(await this.getFriendIds())]
  }

  /* friendship helper method */
  const friendsOptions = (accepted, originalRequest) => ({
    through: { where: { accepted, originalRequest } }
  })

  //get a list of all friends
  User.prototype.allFriends = function() {
    return this.getFriends(friendsOptions(true))
  }

  //get a list of friend requests received
  User.prototype.friendRequests = function() {
    return this.getFriends(friendsOptions(false, false))
  }

  //get a list of friend requests sent to other users
  User.prototype.friendsRequested = function() {
    return this.getFriends(friendsOptions(false, true))
  }

  //request a friend, two way action for easy fetching by each user
  User.prototype.requestFriend = async function(friendId) {
    const friend = await User.findById(friendId)
    const userRequest = await this.addFriend(friend, { through: { originalRequest: true } })
    const friendRequest = await friend.addFriend(this)
    return [...userRequest, ...friendRequest]
  }

  //confirm the friend request, should only be available to one user
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

  //delete a friend, remove two way relationship
  User.prototype.deleteFriend = async function(friendId) {
    const friend = await User.findById(friendId)
    await Promise.all([this.removeFriend(friend), friend.removeFriend(this)])
    return 'succesfully deleted friend'
  }

  //get all the users in our system that are in the user's contacts as potential friends
  User.prototype.potentialFriendsInContacts = async function(phoneNumbers) {
    const users = await User.findAll({
      where: { phone: { [Op.in]: phoneNumbers } }
    })
    //we are looking for users who are not already friends
    return Promise.filter(users, user => this.hasFriend(user).then(bool => !bool))
  }

  /* class methods */

  //find all the users with all of their challenge & place information
  User.allUsersFull = async function() {
    const users = await User.scope('created', 'accepted', 'completed', 'favPlaces').findAll()
    return users
  }

  //create a random salt for encryption
  User.generateSalt = function() {
    return crypto.randomBytes(16).toString('base64')
  }

  //use node crypto to create a hash and encrypt the user password using hash & a salt
  User.encryptPassword = function(plainText, salt) {
    return crypto
      .createHash('RSA-SHA256')
      .update(plainText)
      .update(salt)
      .digest('hex')
  }

  /* hooks */

  //function used to generate new encrypted pw anytime pw is changed
  const setSaltAndPassword = user => {
    if (user.changed('password')) {
      user.salt = User.generateSalt()
      user.password = User.encryptPassword(user.password(), user.salt())
    }
  }

  //hook will run before these options on the User model
  User.beforeCreate(setSaltAndPassword)
  User.beforeUpdate(setSaltAndPassword)

  return User
}

module.exports.associations = (User, { Post, Challenge, Friendship, Feed, Place }) => {
  User.belongsToMany(User, { through: Friendship, as: 'friends' })
  User.hasMany(Post, { as: 'allPosts' })
  User.hasMany(Post, { as: 'createdChallenges', scope: { original: true } })
  User.hasMany(Post, { as: 'acceptedChallenges', scope: { complete: false } })
  User.hasMany(Post, { as: 'completedChallenges', scope: { complete: true, original: false } })
  User.hasMany(Challenge, { as: 'challengeCreator', foreignKey: 'challengeCreatorId' })
  User.belongsToMany(Post, { through: Feed, as: 'feedPosts' })
  User.belongsToMany(Place, { through: 'favPlaces', as: 'favoritePlaces' })
}
