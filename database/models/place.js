'use strict'

const { TEXT, INTEGER } = require('sequelize');

module.exports = (db) => db.define('place', {
  googleId: {
    type: INTEGER
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
      isNumeric: true,
    }
  }
});

module.exports.associations = ( Place, { Recommendation, Challenge }) => {
  Place.hasMany(Recommendation);
  Place.hasMany(Challenge);
}
