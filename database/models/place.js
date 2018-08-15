const { TEXT, INTEGER } = require('sequelize')
const gMaps = require('../../gMaps')

//helper to generate scope with all challenge/post possibilities
const scopeGenerator = (scope, ids = []) => {
  const asOptions = ['createdChallenges', 'acceptedChallenges', 'completedChallenges']
  const include = asOptions.map(as => scope(as, false, ids).include[0])
  return { include }
}

module.exports = db => {
  const Place = db.define(
    'place',
    {
      googleId: {
        type: TEXT
      },
      name: {
        type: TEXT
      },
      address: {
        type: TEXT
      },
      phone: {
        type: INTEGER,
        unique: true,
        validate: {
          isNumeric: true
        }
      }
    },
    {
      scopes: {
        challenge: () => ({
          include: [db.model('challenge').scope('challengeCreator')]
        }),
        friendsChallenge: ids => ({
          include: [
            {
              model: db.model('challenge').scope({ method: ['friendCreator', ids] }),
              required: false
            }
          ]
        }),
        posts: (as, required = true) => ({
          include: [{ model: db.model('post').scope('user'), as, required }]
        }),
        postsAll: () => {
          return scopeGenerator(db.model('place').options.scopes.posts)
        },
        friends: (as, required = true, ids) => ({
          include: [
            {
              model: db.model('post').scope('user', 'challenge', { method: ['friends', ids] }),
              as,
              required
            }
          ]
        }),
        friendsAll: ids => {
          return scopeGenerator(db.model('place').options.scopes.friends, ids)
        },
        innerJoin: ids => ({
          //used to join when retrieving challenges by friends sorted in created/accepted/completed properties
          include: [
            {
              model: db.model('post').scope({ method: ['friends', ids] }),
              as: 'all',
              attributes: ['id']
            }
          ]
        })
      }
    }
  )

  /* instance methods */

  //retrieve all the google info from the maps/places API, costly!
  Place.prototype.getGooglePlaceInfo = async function() {
    const query = {
      placeid: this.googleId,
      fields: [
        'name',
        'place_id',
        'geometry',
        'formatted_address',
        'formatted_phone_number',
        'opening_hours',
        'type',
        'website'
      ]
    }
    const place = await gMaps.place(query).asPromise()
    return place.json.result
  }

  //add the goog place to the place obj from db
  Place.prototype.addGoog = async function() {
    const [googPlace, plainPlace] = await Promise.all([
      this.getGooglePlaceInfo(),
      this.get({ plain: true })
    ])
    return { ...plainPlace, ...googPlace }
  }

  /* class methods */

  //used to add goog place to arrays returned from db
  Place.placesMapper = function(places) {
    return db.Promise.map(places, place => place.addGoog())
  }

  //show all places with sorted posts by created/accepted/completed & challenges
  Place.allPlacesSorted = async function() {
    const places = await this.scope('challenge', 'postsAll').findAll()
    return this.placesMapper(places)
  }

  //show all the places with all posts/challenges in an all property
  Place.allPlaces = async function(as = 'all') {
    const places = await this.scope('challenge', { method: ['posts', as] }).findAll()
    return places
    // return this.placesMapper(places)
  }

  //get all places with created challenges
  Place.allPlacesCreated = function() {
    return this.allPlaces('createdChallenges')
  }

  //get all places with accepted challenges
  Place.allPlacesAccepted = function() {
    return this.allPlaces('acceptedChallenges')
  }

  //get all places with completed challenges
  Place.allPlacesCompleted = function() {
    return this.allPlaces('completedChallenges')
  }

  //show all the places with all created/accepted/completed challenges by friends
  Place.friendsPlacesSorted = async function(user) {
    const ids = await user.getFriendAndUserIds()
    const places = await this.scope(
      { method: ['friendsChallenge', ids] },
      { method: ['friendsAll', ids] },
      { method: ['innerJoin', ids] }
    ).findAll()
    return this.placesMapper(places)
  }

  //get all places with challenges by friends in all property
  Place.friendsPlaces = async function(user, as = 'all') {
    const ids = await user.getFriendAndUserIds()
    const places = await this.scope(
      { method: ['friendsChallenge', ids] },
      { method: ['friends', as, true, ids] }
    ).findAll()
    return places
    // return this.placesMapper(places)
  }

  //get all places with created challenges by friends
  Place.friendsCreated = function(user) {
    return this.friendsPlaces(user, 'createdChallenges')
  }

  //get all places with accepted challenges by friends
  Place.friendsAccepted = function(user) {
    return this.friendsPlaces(user, 'acceptedChallenges')
  }

  //get all places with completed challenges by friends
  Place.friendsCompleted = function(user) {
    return this.friendsPlaces(user, 'completedChallenges')
  }

  //get a place with all created/accepted/completed challenges, can query by id or googId
  Place.fullPlace = async function(queryObj) {
    const place = await this.scope('challenge', 'postsAll').findOne({ where: queryObj })
    return place.addGoog()
  }

  //get a place with all created/accepted/completed challenges by friends, can query by id or googId
  Place.fullPlaceFriends = async function(user, queryObj) {
    const ids = await user.getFriendAndUserIds()
    const place = await this.scope(
      { method: ['friendsChallenge', ids] },
      { method: ['friendsAll', ids] }
    ).findOne({ where: queryObj })
    return place.addGoog()
  }

  return Place
}

module.exports.associations = (Place, { Post, Challenge, User }) => {
  Place.hasMany(Post, { as: 'all' })
  Place.hasMany(Post, { as: 'createdChallenges', scope: { original: true } })
  Place.hasMany(Post, { as: 'acceptedChallenges', scope: { complete: false } })
  Place.hasMany(Post, { as: 'completedChallenges', scope: { original: false, complete: true } })
  Place.hasMany(Challenge)
  Place.belongsToMany(User, { through: 'favPlaces' })
}
