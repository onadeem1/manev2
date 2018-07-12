'use strict'

const { STRING, TEXT, INTEGER } = require('sequelize');

module.exports = (db) => db.define('recommendation', {
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
  }
});

module.exports.associations = ( Recommendation, { User, Place, Challenge}) => {
  Recommendation.belongsTo(User);
  Recommendation.belongsTo(Place);
  Recommendation.belongsTo(Challenge);
}
