'use strict'

const { BOOLEAN } = require('sequelize')

module.exports = (db) => db.define('friendship', {
  accepted: {
    type: BOOLEAN,
    defaultValue: false
  }
});

