const db = require('../_db');
const { STRING } = require('sequelize');

const Challenge = db.define('challenge', {
  challengeText: {
    type: STRING
  }
});

module.exports = Challenge;
