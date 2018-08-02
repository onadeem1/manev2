const { TEXT, INTEGER, Op } = require('sequelize')
const gMaps = require('../../gMaps')

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
        friends: function(ids) {
          return {
            include: [
              {
                model: db.model('recommendation'),
                where: {
                  complete: true,
                  userId: {
                    [Op.in]: ids
                  }
                },
                required: false,
                include: [
                  {
                    model: db.model('user')
                  }
                ]
              },
              {
                model: db.model('challenge'),
                where: {
                  userId: {
                    [Op.in]: ids
                  }
                },
                required: false
              }
            ]
          }
        },
        allRecsAndChallenges: function() {
          return { include: [db.model('recommendation'), db.model('challenge')] }
        }
      }
    }
  )

  Place.getAllPlaces = async function() {
    const places = await Place.scope('allRecsAndChallenges').findAll()
    return db.Promise.map(places, place => place.combinePlaceInfo(place))
  }

  Place.getPlaceWithFriendRecs = async function(user, queryObj) {
    const ids = await user.getFriendAndUserIds()
    const place = await Place.scope({ method: ['friends', ids] }).findOne({ where: queryObj })
    return place.combinePlaceInfo(place)
  }

  Place.getPlacesWithFriendRecs = async function(user) {
    const ids = await user.getFriendAndUserIds()
    const places = Place.scope({ method: ['friends', ids] }).findAll()
    return db.Promise.map(places, place => place.combinePlaceInfo(place))
  }

  Place.prototype.getGooglePlaceInfo = async function(placeid) {
    const query = {
      placeid,
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

  Place.prototype.combinePlaceInfo = async function(place) {
    const googPlace = await place.getGooglePlaceInfo(place.googleId)
    return Object.assign({}, await place.get({ plain: true }), googPlace)
  }

  return Place
}

module.exports.associations = (Place, { Recommendation, Challenge }) => {
  Place.hasMany(Recommendation)
  Place.hasMany(Challenge)
}
