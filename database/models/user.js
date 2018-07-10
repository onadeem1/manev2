/* eslint-disable camelcase */
const db = require('../_db');
const { STRING, ARRAY, INTEGER, BOOLEAN, VIRTUAL } = require('sequelize');

//TODO: Add full password options through bcrypt etc.

const User = db.define('user', {
  first_name: {
    type: STRING
  },
  last_name: {
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
    type: ARRAY(INTEGER)
  },
  complete_challenge_ids: { //TODO: Do we need this or will this come through association
    type: ARRAY(INTEGER)
  },
  incomeplete_challenge_ids: { //TODO: Do we need this or will this come through association
    type: ARRAY(INTEGER)
  },
  given_recommendation_ids: { //TODO: Do we need this or will this come through association
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
