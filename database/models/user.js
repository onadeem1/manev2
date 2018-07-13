'use strict'

const { STRING, ARRAY, INTEGER, BOOLEAN, VIRTUAL } = require('sequelize');

//TODO: Add full password options through bcrypt etc.

module.exports = (db) => db.define('user', {
  firstName: {
    type: STRING
  },
  lastName: {
    type: STRING
  },
  username: {
    type: STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: VIRTUAL
  },
  email: {
    type: STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: STRING
  },
  picture: {
    type: STRING
  },
  isAdmin: {
    type: BOOLEAN,
    defaultValue: false
  },
  recommendationsSaved: {
    type: ARRAY(INTEGER)
  }
});

module.exports.associations = ( User, { Recommendation, Challenge, UserChallenge, Friendship }) => {
  User.belongsToMany(User, { through: Friendship, as: 'friend'});
  User.hasMany(Recommendation);
  User.belongsToMany(Challenge, { through: UserChallenge });
};
