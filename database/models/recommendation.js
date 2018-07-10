const db = require('../_db');
const { STRING, TEXT, INTEGER } = require('sequelize');

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
})

//associations w/ each challenge belonging to a single rec?
//also each recommendation belonging to a single place id?

module.exports = Recommendation;

