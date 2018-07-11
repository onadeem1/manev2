const db = require('../_db');
const { TEXT, INTEGER } = require('sequelize');

const Place = db.define('place', {
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

//Add further columns to create own POI db

module.exports = Place;
