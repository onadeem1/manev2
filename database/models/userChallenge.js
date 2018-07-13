'use strict'

const { BOOLEAN, INTEGER, TEXT } = require('sequelize')

module.exports = (db) => db.define('userChallenge', {
  complete: {
    type: BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: INTEGER
  },
  review: {
    type: TEXT
  }
});
