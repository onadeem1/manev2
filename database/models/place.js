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
        friends: function(ids, completeBool) {
          return {
            include: [
              {
                model: db.model('recommendation'),
                where: {
                  complete: completeBool,
                  userId: {
                    [Op.in]: ids
                  }
                },
                required: true,
                include: [
                  {
                    model: db.model('user')
                  }
                ]
              },
              {
                model: db.model('challenge'),
                where: {
                  challengeCreatorId: {
                    [Op.in]: ids
                  }
                },
                required: false,
                include: [
                  {
                    model: db.model('user'),
                    as: 'challengeCreator'
                  }
                ]
              }
            ]
          }
        },
        allRecsAndChallenges: function() {
          return {
            include: [
              { model: db.model('recommendation'), include: { model: db.model('user') } },
              {
                model: db.model('challenge'),
                include: { model: db.model('user'), as: 'challengeCreator' }
              }
            ]
          }
        }
      }
    }
  )

  Place.getAllPlaces = async function() {
    try {
      const places = await Place.scope('allRecsAndChallenges').findAll()
      return db.Promise.map(places, place => place.combinePlaceInfo(place))
    } catch (error) {
      console.error(error)
    }
  }

  Place.getPlaceWithFriendRecs = async function(user, queryObj, completeBool) {
    try {
      const ids = await user.getFriendAndUserIds()
      const place = await Place.scope({ method: ['friends', ids, completeBool] }).findOne({
        where: queryObj
      })
      return place.combinePlaceInfo()
    } catch (error) {
      console.error(error)
    }
  }

  Place.getPlacesWithFriendRecs = async function(user, completeBool) {
    try {
      const ids = await user.getFriendAndUserIds()
      const places = Place.scope({ method: ['friends', ids, completeBool] }).findAll()
      return db.Promise.map(places, place => place.combinePlaceInfo())
    } catch (error) {
      console.error(error)
    }
  }

  Place.prototype.getGooglePlaceInfo = async function() {
    try {
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
    } catch (error) {
      console.error(error)
    }
  }

  Place.prototype.combinePlaceInfo = async function() {
    try {
      const googPlace = await this.getGooglePlaceInfo()
      return Object.assign({}, await this.get({ plain: true }), googPlace)
    } catch (error) {
      console.error(error)
    }
  }

  return Place
}

module.exports.associations = (Place, { Recommendation, Challenge }) => {
  Place.hasMany(Recommendation)
  Place.hasMany(Challenge)
}
