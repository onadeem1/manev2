const { STRING, TEXT, INTEGER, BOOLEAN } = require('sequelize')

module.exports = db =>
  db.define('recommendation', {
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

module.exports.associations = (Recommendation, { User, Place, Challenge }) => {
  Recommendation.belongsTo(User)
  Recommendation.belongsTo(Place)
  Recommendation.belongsTo(Challenge)
}
