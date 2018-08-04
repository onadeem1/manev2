const { STRING, TEXT, INTEGER, BOOLEAN } = require('sequelize')

module.exports = db => {
  const Recommendation = db.define('recommendation', {
    review: {
      type: TEXT
    },
    picture: {
      type: STRING,
      validate: {
        isUrl: true
      }
    },
    rating: {
      type: INTEGER,
      validate: {
        isNumeric: true,
        min: 0,
        max: 100
      }
    },
    complete: {
      type: BOOLEAN,
      defaultValue: false
    }
  })

  Recommendation.prototype.getRecommendationWithGoogPlace = async function() {
    try {
      const plainRecommendation = await this.get({ plain: true })
      const place = await this.place.combinePlaceInfo()
      return Object.assign({}, plainRecommendation, { place })
    } catch (error) {
      console.error(error)
    }
  }

  return Recommendation
}

module.exports.associations = (Recommendation, { User, Place, Challenge }) => {
  Recommendation.belongsTo(User)
  Recommendation.belongsTo(Place)
  Recommendation.belongsTo(Challenge)
}
