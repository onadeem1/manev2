const db = require('../_db');
const { STRING, ARRAY, INTEGER, BOOLEAN, VIRTUAL } = require('sequelize');

//TODO: Add full password options through bcrypt etc.

const User = db.define('user', {
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
  friends: {
    type: ARRAY(INTEGER) //TODO: Create a friendship table
  },
  completeChallenges: { //TODO: Do we need this or will this come through association, create a challenges table
    type: ARRAY(INTEGER)
  },
  incomepleteChallenges: { //TODO: Do we need this or will this come through association
    type: ARRAY(INTEGER)
  },
  recommendationsGiven: { //TODO: Do we need this or will this come through association
    type: ARRAY(INTEGER)
  },
  recommendationsSaved: { //TODO: Do we need this or will this come through association
    type: ARRAY(INTEGER)
  },
  feed: {
    type: ARRAY(INTEGER)
  },
  isAdmin: {
    type: BOOLEAN,
    defaultValue: false
  }
});

module.exports = User;
