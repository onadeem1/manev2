'use strict'

const { BOOLEAN } = require('sequelize')

module.exports = (db) => db.define('userChallenge', {
  complete: {
    type: BOOLEAN
  }
});
