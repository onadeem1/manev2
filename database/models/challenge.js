'use strict'

const { STRING } = require('sequelize');

module.exports = (db) => db.define('challenge', {
  challengeText: {
    type: STRING
  }
});

module.exports.associations = ( Challenge, { User, UserChallenge, Recommendation }) => {
  Challenge.hasMany(Recommendation);
  Challenge.belongsToMany(User, { through: UserChallenge });
};
